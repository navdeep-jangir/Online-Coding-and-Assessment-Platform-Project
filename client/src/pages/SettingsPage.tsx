import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Code2,
  BellRing,
  Save,
  RotateCcw,
  Type,
  Palette,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

const SETTINGS_STORAGE_KEY = 'codeclimb_settings';

type EditorThemeOption = 'vs-dark' | 'hc-black' | 'vs';

interface UserSettings {
  editor: {
    fontSize: number;
    theme: EditorThemeOption;
    tabSize: number;
    wordWrap: boolean;
  };
  notifications: {
    dailyChallenge: boolean;
    revisionReminders: boolean;
    streakAlerts: boolean;
    leaderboardUpdates: boolean;
  };
}

const DEFAULT_SETTINGS: UserSettings = {
  editor: {
    fontSize: 14,
    theme: 'vs-dark',
    tabSize: 2,
    wordWrap: true,
  },
  notifications: {
    dailyChallenge: true,
    revisionReminders: true,
    streakAlerts: true,
    leaderboardUpdates: false,
  },
};

function loadSavedSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      editor: {
        ...DEFAULT_SETTINGS.editor,
        ...(parsed.editor || {}),
      },
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(parsed.notifications || {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const EDITOR_THEMES: { value: EditorThemeOption; label: string; description: string }[] = [
  { value: 'vs-dark', label: 'CodeClimb Dark', description: 'Balanced dark contrast' },
  { value: 'hc-black', label: 'High Contrast', description: 'Maximum syntax clarity' },
  { value: 'vs', label: 'Classic Light', description: 'Clean daylight editor' },
];

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20];

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (nextValue: boolean) => void;
}

function ToggleRow({ id, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <label
          htmlFor={id}
          className="cursor-pointer text-sm font-medium text-slate-900 dark:text-[#F0F6FC]"
        >
          {label}
        </label>
        <p className="text-xs text-slate-500 dark:text-[#8B949E]">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 ${
          checked ? 'bg-[#22C55E]' : 'bg-slate-300 dark:bg-[#30363D]'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>(loadSavedSettings);

  const isDark = theme === 'dark';

  const persistSettings = (nextSettings: UserSettings, message?: string) => {
    setSettings(nextSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
      if (message) toast.success(message);
    } catch {
      toast.error('Failed to save settings to local storage.');
    }
  };

  const handleSelectTheme = (targetTheme: 'dark' | 'light') => {
    if (theme !== targetTheme) {
      toggleTheme();
    }
  };

  const handleSaveAll = () => {
    persistSettings(settings, 'Preferences saved!');
  };

  const handleResetDefaults = () => {
    persistSettings(DEFAULT_SETTINGS, 'Settings restored to defaults');
  };

  const previewThemeClasses =
    settings.editor.theme === 'vs'
      ? 'bg-slate-50 text-slate-900 border-slate-200'
      : settings.editor.theme === 'hc-black'
      ? 'bg-black text-white border-white/25'
      : 'bg-[#0D1117] text-[#F0F6FC] border-[#30363D]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mx-auto max-w-4xl space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F0F6FC]">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#8B949E]">
            Customize your appearance, code editor, and notification preferences.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-[#30363D] dark:bg-[#1C2128] dark:text-[#8B949E] dark:hover:text-[#F0F6FC]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#22C55E] px-4 py-2 text-xs font-semibold text-[#0D1117] shadow-sm transition-colors hover:bg-[#16A34A]"
          >
            <Save className="h-3.5 w-3.5" />
            Save Preferences
          </button>
        </div>
      </div>

      {/* Appearance / Theme Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#30363D] dark:bg-[#1C2128]">
        <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-[#30363D]">
          <div className="flex items-center gap-2.5">
            {isDark ? (
              <Moon className="h-5 w-5 text-[#38BDF8]" />
            ) : (
              <Sun className="h-5 w-5 text-amber-500" />
            )}
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-[#F0F6FC]">
                Appearance
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#8B949E]">
                Choose between Dark Mode and Light Mode across CodeClimb.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[#22C55E]/50 dark:border-[#30363D] dark:bg-[#161B22] dark:text-[#F0F6FC]"
          >
            {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
            {isDark ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Dark Mode Option */}
          <button
            type="button"
            onClick={() => handleSelectTheme('dark')}
            className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
              isDark
                ? 'border-[#22C55E] bg-[#22C55E]/10 ring-1 ring-[#22C55E]/30'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-[#30363D] dark:bg-[#0D1117]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1117] text-[#38BDF8] ring-1 ring-[#30363D]">
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-[#F0F6FC]">
                  Dark Mode
                </p>
                <p className="text-xs text-slate-500 dark:text-[#8B949E]">
                  Easy on the eyes for long sessions
                </p>
              </div>
            </div>
            {isDark && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#22C55E] text-[#0D1117]">
                <Check className="h-3.5 w-3.5" />
              </span>
            )}
          </button>

          {/* Light Mode Option */}
          <button
            type="button"
            onClick={() => handleSelectTheme('light')}
            className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
              !isDark
                ? 'border-[#22C55E] bg-[#22C55E]/10 ring-1 ring-[#22C55E]/30'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-[#30363D] dark:bg-[#0D1117]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-amber-500 ring-1 ring-slate-200">
                <Sun className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-[#F0F6FC]">
                  Light Mode
                </p>
                <p className="text-xs text-slate-500 dark:text-[#8B949E]">
                  Crisp daylight contrast
                </p>
              </div>
            </div>
            {!isDark && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#22C55E] text-[#0D1117]">
                <Check className="h-3.5 w-3.5" />
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Editor Preferences Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#30363D] dark:bg-[#1C2128]">
        <div className="mb-5 flex items-center gap-2.5 border-b border-slate-200 pb-4 dark:border-[#30363D]">
          <Code2 className="h-5 w-5 text-[#22C55E]" />
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-[#F0F6FC]">
              Editor Preferences
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#8B949E]">
              Configure the Practice Arena code editor appearance and behavior.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Font Size */}
            <div>
              <label
                htmlFor="editor-font-size"
                className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-[#F0F6FC]"
              >
                <Type className="h-4 w-4 text-[#38BDF8]" />
                Font Size
              </label>
              <select
                id="editor-font-size"
                value={settings.editor.fontSize}
                onChange={(e) =>
                  persistSettings({
                    ...settings,
                    editor: { ...settings.editor, fontSize: Number(e.target.value) },
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#F0F6FC]"
              >
                {FONT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}px {size === 14 ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Editor Theme */}
            <div>
              <label
                htmlFor="editor-theme"
                className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-[#F0F6FC]"
              >
                <Palette className="h-4 w-4 text-[#22C55E]" />
                Editor Theme
              </label>
              <select
                id="editor-theme"
                value={settings.editor.theme}
                onChange={(e) =>
                  persistSettings({
                    ...settings,
                    editor: {
                      ...settings.editor,
                      theme: e.target.value as EditorThemeOption,
                    },
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#F0F6FC]"
              >
                {EDITOR_THEMES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} — {option.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-200 border-t border-slate-200 pt-2 dark:divide-[#30363D] dark:border-[#30363D]">
            <div className="flex items-center justify-between gap-4 py-3">
              <div>
                <span className="text-sm font-medium text-slate-900 dark:text-[#F0F6FC]">
                  Tab Indentation Size
                </span>
                <p className="text-xs text-slate-500 dark:text-[#8B949E]">
                  Number of spaces inserted per Tab keystroke
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-[#30363D] dark:bg-[#0D1117]">
                {[2, 4].map((spaces) => (
                  <button
                    key={spaces}
                    type="button"
                    onClick={() =>
                      persistSettings({
                        ...settings,
                        editor: { ...settings.editor, tabSize: spaces },
                      })
                    }
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                      settings.editor.tabSize === spaces
                        ? 'bg-[#22C55E] text-[#0D1117]'
                        : 'text-slate-600 dark:text-[#8B949E]'
                    }`}
                  >
                    {spaces} spaces
                  </button>
                ))}
              </div>
            </div>

            <ToggleRow
              id="toggle-word-wrap"
              label="Word Wrap"
              description="Wrap long lines cleanly inside the code editor viewport"
              checked={settings.editor.wordWrap}
              onChange={(checked) =>
                persistSettings({
                  ...settings,
                  editor: { ...settings.editor, wordWrap: checked },
                })
              }
            />
          </div>

          {/* Live Editor Preview */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-[#8B949E]">
              Live Editor Preview ({settings.editor.fontSize}px · {settings.editor.theme})
            </p>
            <pre
              style={{ fontSize: `${settings.editor.fontSize}px` }}
              className={`overflow-x-auto rounded-xl border p-4 font-mono leading-relaxed transition-all ${previewThemeClasses}`}
            >
              <code>
                {`function binarySearch(nums: number[], target: number): number {\n`}
                {`${' '.repeat(settings.editor.tabSize)}let left = 0, right = nums.length - 1;\n`}
                {`${' '.repeat(settings.editor.tabSize)}while (left <= right) {\n`}
                {`${' '.repeat(settings.editor.tabSize * 2)}const mid = left + Math.floor((right - left) / 2);\n`}
                {`${' '.repeat(settings.editor.tabSize * 2)}if (nums[mid] === target) return mid;\n`}
                {`${' '.repeat(settings.editor.tabSize * 2)}nums[mid] < target ? (left = mid + 1) : (right = mid - 1);\n`}
                {`${' '.repeat(settings.editor.tabSize)}}\n`}
                {`${' '.repeat(settings.editor.tabSize)}return -1;\n`}
                {`}`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Notification Preferences Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#30363D] dark:bg-[#1C2128]">
        <div className="mb-3 flex items-center gap-2.5 border-b border-slate-200 pb-4 dark:border-[#30363D]">
          <BellRing className="h-5 w-5 text-[#38BDF8]" />
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-[#F0F6FC]">
              Notification Preferences
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#8B949E]">
              Control which alerts and reminders appear in your workspace.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-[#30363D]">
          <ToggleRow
            id="notif-daily-challenge"
            label="Daily Challenge Reminders"
            description="Notify me when a new daily coding challenge unlocks"
            checked={settings.notifications.dailyChallenge}
            onChange={(checked) =>
              persistSettings({
                ...settings,
                notifications: { ...settings.notifications, dailyChallenge: checked },
              })
            }
          />
          <ToggleRow
            id="notif-revision"
            label="Spaced Repetition Alerts"
            description="Remind me when previously solved problems are due for revision"
            checked={settings.notifications.revisionReminders}
            onChange={(checked) =>
              persistSettings({
                ...settings,
                notifications: { ...settings.notifications, revisionReminders: checked },
              })
            }
          />
          <ToggleRow
            id="notif-streak"
            label="Streak Protection Warnings"
            description="Send a gentle nudge if my daily solve streak is at risk"
            checked={settings.notifications.streakAlerts}
            onChange={(checked) =>
              persistSettings({
                ...settings,
                notifications: { ...settings.notifications, streakAlerts: checked },
              })
            }
          />
          <ToggleRow
            id="notif-leaderboard"
            label="Leaderboard & Milestone Updates"
            description="Alert me on rank jumps and module completion milestones"
            checked={settings.notifications.leaderboardUpdates}
            onChange={(checked) =>
              persistSettings({
                ...settings,
                notifications: { ...settings.notifications, leaderboardUpdates: checked },
              })
            }
          />
        </div>
      </section>
    </motion.div>
  );
}
