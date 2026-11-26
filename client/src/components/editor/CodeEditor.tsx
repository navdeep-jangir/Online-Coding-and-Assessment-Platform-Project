import { useCallback, useEffect, useRef } from 'react';
import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/helpers';
import {
  mapLanguageToMonaco,
  type EditorTheme,
} from './editorConstants';

type MonacoInstance = Parameters<BeforeMount>[0];

function registerCustomThemes(monaco: MonacoInstance): void {
  monaco.editor.defineTheme('codeclimb-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8B949E', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'FF7B72' },
      { token: 'string', foreground: 'A5D6FF' },
      { token: 'number', foreground: '79C0FF' },
      { token: 'type', foreground: 'FFA657' },
      { token: 'function', foreground: 'D2A8FF' },
      { token: 'variable', foreground: 'F0F6FC' },
    ],
    colors: {
      'editor.background': '#0D1117',
      'editor.foreground': '#F0F6FC',
      'editor.lineHighlightBackground': '#161B22',
      'editor.selectionBackground': '#22C55E33',
      'editor.inactiveSelectionBackground': '#22C55E1A',
      'editorLineNumber.foreground': '#484F58',
      'editorLineNumber.activeForeground': '#F0F6FC',
      'editorCursor.foreground': '#22C55E',
      'editorGutter.background': '#0D1117',
      'editorWidget.background': '#161B22',
      'editorWidget.border': '#30363D',
    },
  });

  monaco.editor.defineTheme('monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '75715E', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'F92672' },
      { token: 'string', foreground: 'E6DB74' },
      { token: 'number', foreground: 'AE81FF' },
      { token: 'type', foreground: '66D9EF', fontStyle: 'italic' },
      { token: 'function', foreground: 'A6E22E' },
      { token: 'variable', foreground: 'F8F8F2' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#F8F8F2',
      'editor.lineHighlightBackground': '#3E3D32',
      'editor.selectionBackground': '#49483E',
      'editorLineNumber.foreground': '#90908A',
      'editorLineNumber.activeForeground': '#F8F8F2',
      'editorCursor.foreground': '#F8F8F0',
    },
  });

  monaco.editor.defineTheme('dracula', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6272A4', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'FF79C6' },
      { token: 'string', foreground: 'F1FA8C' },
      { token: 'number', foreground: 'BD93F9' },
      { token: 'type', foreground: '8BE9FD', fontStyle: 'italic' },
      { token: 'function', foreground: '50FA7B' },
      { token: 'variable', foreground: 'F8F8F2' },
    ],
    colors: {
      'editor.background': '#282A36',
      'editor.foreground': '#F8F8F2',
      'editor.lineHighlightBackground': '#44475A66',
      'editor.selectionBackground': '#44475A',
      'editorLineNumber.foreground': '#6272A4',
      'editorLineNumber.activeForeground': '#F8F8F2',
      'editorCursor.foreground': '#F8F8F2',
    },
  });
}

export interface CodeEditorProps {
  language: string;
  value: string;
  onChange?: (value: string) => void;
  theme?: EditorTheme | string;
  fontSize?: number;
  readOnly?: boolean;
  tabSize?: number;
  wordWrap?: 'on' | 'off';
  height?: string | number;
  className?: string;
  onMount?: OnMount;
  onRunShortcut?: () => void;
  onSubmitShortcut?: () => void;
  onSaveShortcut?: () => void;
}

export function CodeEditor({
  language,
  value,
  onChange,
  theme = 'vs-dark',
  fontSize = 14,
  readOnly = false,
  tabSize = 4,
  wordWrap = 'off',
  height = '100%',
  className,
  onMount,
  onRunShortcut,
  onSubmitShortcut,
  onSaveShortcut,
}: CodeEditorProps) {
  const onRunRef = useRef(onRunShortcut);
  const onSubmitRef = useRef(onSubmitShortcut);
  const onSaveRef = useRef(onSaveShortcut);

  useEffect(() => {
    onRunRef.current = onRunShortcut;
  }, [onRunShortcut]);

  useEffect(() => {
    onSubmitRef.current = onSubmitShortcut;
  }, [onSubmitShortcut]);

  useEffect(() => {
    onSaveRef.current = onSaveShortcut;
  }, [onSaveShortcut]);

  const handleBeforeMount = useCallback<BeforeMount>((monaco) => {
    registerCustomThemes(monaco);
  }, []);

  const handleMount = useCallback<OnMount>(
    (editorInstance, monaco) => {
      editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRunRef.current?.();
      });

      editorInstance.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
        () => {
          onSubmitRef.current?.();
        }
      );

      editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onSaveRef.current?.();
      });

      onMount?.(editorInstance, monaco);
    },
    [onMount]
  );

  const monacoLanguage = mapLanguageToMonaco(language);

  return (
    <div
      className={cn(
        'relative h-full w-full min-h-[180px] overflow-hidden bg-[#0D1117]',
        className
      )}
    >
      <Editor
        height={height}
        language={monacoLanguage}
        value={value}
        theme={theme}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={(nextValue) => onChange?.(nextValue ?? '')}
        loading={
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#0D1117] text-[#8B949E]">
            <Loader2 className="h-6 w-6 animate-spin text-[#22C55E]" aria-hidden="true" />
            <span className="text-xs font-medium">Loading Monaco Editor...</span>
          </div>
        }
        options={{
          fontSize,
          readOnly,
          lineNumbers: 'on',
          autoIndent: 'full',
          formatOnPaste: true,
          formatOnType: true,
          tabSize,
          insertSpaces: true,
          detectIndentation: false,
          wordWrap,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, monospace",
          fontLigatures: true,
          bracketPairColorization: { enabled: true },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          padding: { top: 12, bottom: 12 },
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          suggestOnTriggerCharacters: !readOnly,
          quickSuggestions: !readOnly,
        }}
      />
    </div>
  );
}

export default CodeEditor;
