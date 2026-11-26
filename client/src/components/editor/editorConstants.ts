export type SupportedEditorLanguage = 'c' | 'cpp' | 'java' | 'python';

export type EditorTheme =
  | 'codeclimb-dark'
  | 'vs-dark'
  | 'monokai'
  | 'dracula'
  | 'hc-black'
  | 'vs';

export interface EditorLanguageOption {
  id: SupportedEditorLanguage;
  label: string;
  monacoId: string;
  extension: string;
}

export const EDITOR_LANGUAGES: EditorLanguageOption[] = [
  { id: 'c', label: 'C', monacoId: 'c', extension: 'c' },
  { id: 'cpp', label: 'C++', monacoId: 'cpp', extension: 'cpp' },
  { id: 'java', label: 'Java', monacoId: 'java', extension: 'java' },
  { id: 'python', label: 'Python', monacoId: 'python', extension: 'py' },
];

export const EDITOR_THEMES: Array<{ id: EditorTheme; label: string }> = [
  { id: 'vs-dark', label: 'VS Dark' },
  { id: 'codeclimb-dark', label: 'CodeClimb Dark' },
  { id: 'monokai', label: 'Monokai' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'hc-black', label: 'High Contrast' },
  { id: 'vs', label: 'VS Light' },
];

export const DEFAULT_STARTER_CODE: Record<SupportedEditorLanguage, string> = {
  c: `#include <stdio.h>

int main(void) {
    // Write your solution here
    return 0;
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // Write your solution here
    return 0;
}
`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
    }
}
`,
  python: `import sys


def solve() -> None:
    # Write your solution here
    pass


if __name__ == "__main__":
    solve()
`,
};

export function mapLanguageToMonaco(language: string): string {
  const normalized = language.trim().toLowerCase();
  const languageMap: Record<string, string> = {
    c: 'c',
    cpp: 'cpp',
    'c++': 'cpp',
    cxx: 'cpp',
    java: 'java',
    python: 'python',
    python3: 'python',
    py: 'python',
    javascript: 'javascript',
    js: 'javascript',
    typescript: 'typescript',
    ts: 'typescript',
    go: 'go',
    rust: 'rust',
  };

  return languageMap[normalized] ?? 'plaintext';
}
