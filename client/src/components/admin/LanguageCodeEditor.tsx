import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Code2, RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/utils/helpers';

export type AdminCodeLanguage = 'c' | 'cpp' | 'java' | 'python';

export interface LanguageOption {
  id: AdminCodeLanguage;
  label: string;
  monacoLanguage: string;
  extension: string;
}

export const ADMIN_CODE_LANGUAGES: readonly LanguageOption[] = [
  { id: 'c', label: 'C', monacoLanguage: 'c', extension: '.c' },
  { id: 'cpp', label: 'C++', monacoLanguage: 'cpp', extension: '.cpp' },
  { id: 'java', label: 'Java', monacoLanguage: 'java', extension: '.java' },
  { id: 'python', label: 'Python', monacoLanguage: 'python', extension: '.py' },
] as const;

export interface LanguageCodeEditorProps {
  value: Partial<Record<AdminCodeLanguage | string, string>>;
  onChange: (language: AdminCodeLanguage, code: string) => void;
  activeLanguage?: AdminCodeLanguage;
  onLanguageChange?: (language: AdminCodeLanguage) => void;
  height?: string | number;
  label?: string;
  defaultTemplates?: Partial<Record<AdminCodeLanguage, string>>;
  readOnly?: boolean;
  className?: string;
}

export function LanguageCodeEditor({
  value,
  onChange,
  activeLanguage: controlledLang,
  onLanguageChange,
  height = 280,
  label,
  defaultTemplates,
  readOnly = false,
  className,
}: LanguageCodeEditorProps) {
  const [internalLang, setInternalLang] = useState<AdminCodeLanguage>('cpp');
  const activeLang = controlledLang ?? internalLang;

  const selectLanguage = (lang: AdminCodeLanguage) => {
    if (!controlledLang) {
      setInternalLang(lang);
    }
    onLanguageChange?.(lang);
  };

  const currentOption =
    ADMIN_CODE_LANGUAGES.find((item) => item.id === activeLang) ?? ADMIN_CODE_LANGUAGES[1];
  const currentCode = value[activeLang] ?? '';
  const templateForCurrent = defaultTemplates?.[activeLang];

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-[#30363D] bg-[#0D1117]',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363D] bg-[#161B22] px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {label && (
            <span className="mr-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#8B949E]">
              <Code2 className="h-3.5 w-3.5 text-[#22C55E]" aria-hidden="true" />
              {label}
            </span>
          )}
          <div className="flex items-center gap-1" role="tablist" aria-label="Programming language">
            {ADMIN_CODE_LANGUAGES.map((lang) => {
              const isSelected = lang.id === activeLang;
              const hasContent = Boolean(value[lang.id]?.trim());

              return (
                <button
                  key={lang.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => selectLanguage(lang.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition',
                    isSelected
                      ? 'border border-[#22C55E]/40 bg-[#22C55E]/15 text-[#22C55E]'
                      : 'border border-transparent text-[#8B949E] hover:bg-[#1C2128] hover:text-[#F0F6FC]'
                  )}
                >
                  <span>{lang.label}</span>
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      hasContent ? 'bg-[#22C55E]' : 'bg-[#30363D]'
                    )}
                    title={hasContent ? 'Has code' : 'Empty'}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1.5">
            {templateForCurrent !== undefined && (
              <button
                type="button"
                onClick={() => onChange(activeLang, templateForCurrent)}
                className="inline-flex items-center gap-1 rounded-md border border-[#30363D] bg-[#1C2128] px-2 py-1 text-[11px] font-medium text-[#8B949E] transition hover:border-[#484F58] hover:text-[#F0F6FC]"
                title={`Reset ${currentOption.label} template`}
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                Template
              </button>
            )}
            {currentCode.length > 0 && (
              <button
                type="button"
                onClick={() => onChange(activeLang, '')}
                className="inline-flex items-center gap-1 rounded-md border border-[#30363D] bg-[#1C2128] px-2 py-1 text-[11px] font-medium text-[#8B949E] transition hover:border-red-500/40 hover:text-red-400"
                title={`Clear ${currentOption.label} code`}
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <Editor
          height={height}
          language={currentOption.monacoLanguage}
          theme="vs-dark"
          value={currentCode}
          onChange={(nextValue) => onChange(activeLang, nextValue ?? '')}
          loading={
            <div className="flex h-full items-center justify-center bg-[#0D1117] text-xs text-[#8B949E]">
              Loading {currentOption.label} editor...
            </div>
          }
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 20,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'line',
            fontFamily:
              "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, monospace",
          }}
        />
      </div>
    </div>
  );
}

export default LanguageCodeEditor;
