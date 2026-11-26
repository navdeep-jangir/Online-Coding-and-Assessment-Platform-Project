import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, CheckCircle2, Edit3, Eye, Link2, ShieldCheck, X } from 'lucide-react';
import api from '@/services/api';
import { MarkdownPreview } from '@/components/admin/MarkdownPreview';

interface ModuleRow {
  _id: string;
  title: string;
  slug: string;
  order: number;
  difficulty: string;
}

interface TopicRowData {
  _id: string;
  title: string;
  slug: string;
  order: number;
  difficulty: string;
  module: { _id: string; title: string } | string;
  prerequisites?: Array<{ _id: string; title: string } | string>;
  resources?: {
    codechef?: { url?: string; title?: string; verified?: boolean };
    leetcode?: { url?: string; title?: string; verified?: boolean };
    youtube?: Array<{ url?: string; title?: string; channel?: string; verified?: boolean }>;
  };
}

interface NoteData {
  _id: string;
  title: string;
  content: string;
  summary?: string;
}

export function AdminCurriculumSection({ initialMode = 'curriculum' }: { initialMode?: 'curriculum' | 'notes' }) {
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [topics, setTopics] = useState<TopicRowData[]>([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit Topic Modal
  const [editingTopic, setEditingTopic] = useState<TopicRowData | null>(null);
  const [dagValidMsg, setDagValidMsg] = useState<string | null>(null);

  // Edit Note & Resources Modal
  const [noteTopic, setNoteTopic] = useState<TopicRowData | null>(null);
  const [noteDoc, setNoteDoc] = useState<NoteData | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [showNotePreview, setShowNotePreview] = useState(false);
  const [ccUrl, setCcUrl] = useState('');
  const [lcUrl, setLcUrl] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [ytTitle, setYtTitle] = useState('');
  const [ytVerified, setYtVerified] = useState(false);

  const loadCurriculum = useCallback(async () => {
    setLoading(true);
    try {
      const [modRes, topRes] = await Promise.all([
        api.get('/modules'),
        api.get('/topics', {
          params: {
            limit: 400,
            ...(selectedModule ? { module: selectedModule } : {}),
            ...(search.trim() ? { search: search.trim() } : {}),
          },
        }),
      ]);
      setModules(Array.isArray(modRes.data?.data) ? modRes.data.data : []);
      setTopics(Array.isArray(topRes.data?.data) ? topRes.data.data : []);
    } catch {
      toast.error('Failed to load curriculum.');
    } finally {
      setLoading(false);
    }
  }, [selectedModule, search]);

  useEffect(() => {
    void loadCurriculum();
  }, [loadCurriculum]);

  const handleValidateDAG = async () => {
    if (!editingTopic) return;
    try {
      const prereqs = (editingTopic.prerequisites || []).map((p) =>
        typeof p === 'string' ? p : p._id
      );
      const res = await api.post('/admin/curriculum/validate-dag', {
        nodeId: editingTopic._id,
        prerequisites: prereqs,
        type: 'topic',
      });
      setDagValidMsg(res.data?.message || 'Valid DAG!');
      toast.success('DAG prerequisite check passed.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Circular prerequisite detected!';
      setDagValidMsg(msg);
      toast.error(msg);
    }
  };

  const handleSaveTopic = async () => {
    if (!editingTopic) return;
    try {
      const prereqs = (editingTopic.prerequisites || []).map((p) =>
        typeof p === 'string' ? p : p._id
      );
      await api.put(`/topics/${editingTopic._id}`, {
        title: editingTopic.title,
        order: editingTopic.order,
        difficulty: editingTopic.difficulty,
        prerequisites: prereqs,
      });
      toast.success('Topic updated!');
      setEditingTopic(null);
      await loadCurriculum();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update topic.';
      toast.error(msg);
    }
  };

  const openNoteEditor = async (topic: TopicRowData) => {
    setNoteTopic(topic);
    setShowNotePreview(false);
    setCcUrl(topic.resources?.codechef?.url || '');
    setLcUrl(topic.resources?.leetcode?.url || '');
    const firstYt = topic.resources?.youtube?.[0];
    setYtUrl(firstYt?.url || '');
    setYtTitle(firstYt?.title || '');
    setYtVerified(Boolean(firstYt?.verified));

    try {
      const res = await api.get(`/notes/topic/${topic._id}`);
      const n = res.data?.data;
      setNoteDoc(n || null);
      setNoteTitle(n?.title || topic.title);
      setNoteContent(n?.content || '');
    } catch {
      setNoteDoc(null);
      setNoteTitle(topic.title);
      setNoteContent('');
    }
  };

  const handleSaveNoteAndResources = async () => {
    if (!noteTopic) return;
    try {
      if (noteDoc?._id) {
        await api.put(`/notes/${noteDoc._id}`, {
          title: noteTitle,
          content: noteContent,
        });
      } else if (noteContent.trim()) {
        await api.post('/notes', {
          topic: noteTopic._id,
          title: noteTitle,
          content: noteContent,
        });
      }

      const updatedResources = {
        ...noteTopic.resources,
        codechef: ccUrl.trim() ? { url: ccUrl.trim(), title: noteTopic.title, verified: Boolean(ccUrl.trim()) } : {},
        leetcode: lcUrl.trim() ? { url: lcUrl.trim(), title: noteTopic.title, verified: Boolean(lcUrl.trim()) } : {},
        youtube: ytUrl.trim()
          ? [{ url: ytUrl.trim(), title: ytTitle.trim() || noteTopic.title, verified: ytVerified }]
          : [],
      };
      await api.put(`/topics/${noteTopic._id}`, { resources: updatedResources });

      toast.success('Notes and external resources updated!');
      setNoteTopic(null);
      await loadCurriculum();
    } catch {
      toast.error('Failed to save note or resources.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#F0F6FC]">
          {initialMode === 'notes' ? 'Notes & External Resources' : 'DSA Curriculum (24 Modules • 348 Concepts)'}
        </h2>
        <p className="text-xs text-[#8B949E]">
          Manage modules, concepts, difficulty, ordering, DAG-validated prerequisites, notes, and verified external links.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#30363D] bg-[#161B22] p-4 sm:grid-cols-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search concept title..."
          className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
        />
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
        >
          <option value="">All 24 Modules</option>
          {modules.map((m) => (
            <option key={m._id} value={m._id}>
              #{m.order} {m.title}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#30363D] bg-[#161B22]">
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead>
            <tr className="border-b border-[#30363D] text-[#8B949E]">
              <th className="px-4 py-3">Concept</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3">Resources</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363D]/60">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#8B949E]">
                  Loading curriculum...
                </td>
              </tr>
            ) : (
              topics.slice(0, 40).map((t) => (
                <tr key={t._id} className="hover:bg-[#0D1117]/40">
                  <td className="px-4 py-3 font-medium text-[#F0F6FC]">{t.title}</td>
                  <td className="px-4 py-3 text-[#8B949E]">
                    {typeof t.module === 'object' ? t.module?.title : 'Module'}
                  </td>
                  <td className="px-4 py-3 text-[#C9D1D9]">{t.difficulty}</td>
                  <td className="px-4 py-3 text-[#8B949E]">
                    {[
                      t.resources?.codechef?.url ? 'CC' : null,
                      t.resources?.leetcode?.url ? 'LC' : null,
                      t.resources?.youtube?.length ? 'YT' : null,
                    ]
                      .filter(Boolean)
                      .join(' • ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDagValidMsg(null);
                          setEditingTopic(t);
                        }}
                        className="inline-flex items-center gap-1 rounded border border-[#30363D] bg-[#0D1117] px-2.5 py-1 text-[#F0F6FC]"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit &amp; Prereqs
                      </button>
                      <button
                        type="button"
                        onClick={() => void openNoteEditor(t)}
                        className="inline-flex items-center gap-1 rounded border border-[#30363D] bg-[#0D1117] px-2.5 py-1 text-[#38BDF8]"
                      >
                        <BookOpen className="h-3 w-3" />
                        Notes &amp; Links
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Topic & Prerequisites Modal */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#30363D] bg-[#161B22] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
              <h3 className="text-base font-bold text-[#F0F6FC]">Edit Concept &amp; Prerequisites</h3>
              <button type="button" onClick={() => setEditingTopic(null)} className="text-[#8B949E]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              type="text"
              value={editingTopic.title}
              onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
              className="w-full rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-sm text-[#F0F6FC]"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={editingTopic.difficulty}
                onChange={(e) => setEditingTopic({ ...editingTopic, difficulty: e.target.value })}
                className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <input
                type="number"
                value={editingTopic.order}
                onChange={(e) => setEditingTopic({ ...editingTopic, order: Number(e.target.value) })}
                className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#8B949E]">Prerequisites (DAG validated)</label>
              <select
                multiple
                value={(editingTopic.prerequisites || []).map((p) => (typeof p === 'string' ? p : p._id))}
                onChange={(e) =>
                  setEditingTopic({
                    ...editingTopic,
                    prerequisites: Array.from(e.target.selectedOptions).map((o) => o.value),
                  })
                }
                className="h-28 w-full rounded-lg border border-[#30363D] bg-[#0D1117] p-2 text-xs text-[#F0F6FC]"
              >
                {topics
                  .filter((x) => x._id !== editingTopic._id)
                  .map((x) => (
                    <option key={x._id} value={x._id}>
                      {x.title}
                    </option>
                  ))}
              </select>
            </div>
            {dagValidMsg && (
              <p className="inline-flex items-center gap-1.5 text-xs text-[#22C55E]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {dagValidMsg}
              </p>
            )}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => void handleValidateDAG()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#38BDF8]/40 bg-[#38BDF8]/10 px-3 py-2 text-xs font-medium text-[#38BDF8]"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Validate DAG
              </button>
              <button
                type="button"
                onClick={() => void handleSaveTopic()}
                className="rounded-lg bg-[#22C55E] px-4 py-2 text-xs font-semibold text-[#0D1117]"
              >
                Save Concept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Note & External Resources Modal */}
      {noteTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#30363D] bg-[#161B22] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
              <h3 className="text-base font-bold text-[#F0F6FC]">
                Notes &amp; Resources — {noteTopic.title}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNotePreview((v) => !v)}
                  className="inline-flex items-center gap-1 rounded border border-[#30363D] bg-[#0D1117] px-3 py-1 text-xs text-[#F0F6FC]"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {showNotePreview ? 'Edit Markdown' : 'Preview'}
                </button>
                <button type="button" onClick={() => setNoteTopic(null)} className="text-[#8B949E]">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {showNotePreview ? (
              <div className="rounded-xl border border-[#30363D] bg-[#0D1117] p-4">
                <MarkdownPreview content={noteContent} />
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title"
                  className="w-full rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-sm text-[#F0F6FC]"
                />
                <textarea
                  rows={10}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Markdown note content..."
                  className="w-full rounded-lg border border-[#30363D] bg-[#0D1117] p-3 font-mono text-xs text-[#F0F6FC]"
                />
              </>
            )}

            <div className="space-y-2 rounded-xl border border-[#30363D] bg-[#0D1117] p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#F0F6FC]">
                <Link2 className="h-3.5 w-3.5 text-[#38BDF8]" />
                External Resources
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="url"
                  value={ccUrl}
                  onChange={(e) => setCcUrl(e.target.value)}
                  placeholder="CodeChef Problem URL"
                  className="rounded border border-[#30363D] bg-[#161B22] px-3 py-1.5 text-xs text-[#F0F6FC]"
                />
                <input
                  type="url"
                  value={lcUrl}
                  onChange={(e) => setLcUrl(e.target.value)}
                  placeholder="LeetCode Problem URL"
                  className="rounded border border-[#30363D] bg-[#161B22] px-3 py-1.5 text-xs text-[#F0F6FC]"
                />
                <input
                  type="url"
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="YouTube Video or Search URL"
                  className="rounded border border-[#30363D] bg-[#161B22] px-3 py-1.5 text-xs text-[#F0F6FC]"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ytTitle}
                    onChange={(e) => setYtTitle(e.target.value)}
                    placeholder="YouTube Title"
                    className="flex-1 rounded border border-[#30363D] bg-[#161B22] px-3 py-1.5 text-xs text-[#F0F6FC]"
                  />
                  <label className="flex items-center gap-1 text-xs text-[#8B949E]">
                    <input
                      type="checkbox"
                      checked={ytVerified}
                      onChange={(e) => setYtVerified(e.target.checked)}
                    />
                    Verified
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoteTopic(null)}
                className="rounded-lg border border-[#30363D] px-4 py-2 text-xs text-[#8B949E]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveNoteAndResources()}
                className="rounded-lg bg-[#22C55E] px-4 py-2 text-xs font-semibold text-[#0D1117]"
              >
                Save Note &amp; Resources
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
