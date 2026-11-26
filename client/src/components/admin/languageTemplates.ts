import type { AdminCodeLanguage } from './LanguageCodeEditor';

export const DEFAULT_STARTER_TEMPLATES: Record<AdminCodeLanguage, string> = {
  c: `#include <stdio.h>

int main(void) {
    // Write your solution here
    return 0;
}
`,
  cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);
    // Write your solution here
    return 0;
}
`,
  java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws Exception {
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
