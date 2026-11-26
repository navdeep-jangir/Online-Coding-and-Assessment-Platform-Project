// Rich original learning notes for Modules 22–24 (Tries, Advanced String Algorithms, Advanced Data Structures) — 32 concepts

const modules22to24Notes = [
  // =========================================================================
  // MODULE 22: TRIES (10 Concepts)
  // =========================================================================
  {
    topicSlug: 'trie-introduction',
    title: 'Trie (Prefix Tree) Introduction',
    definition:
      'A **Trie** (retrieval tree / prefix tree) is a k-ary tree data structure for storing strings where each edge represents a single character and all descendants of a node share a common prefix.',
    explanation:
      'While a HashSet checks whole-word membership in `O(L)` average time, it **cannot** efficiently answer prefix queries (`startsWith("pre")`), lexicographical autocomplete, or bitwise maximum XOR. A Trie shares common prefixes across words, supporting insert, exact search, and prefix search in `O(L)` worst-case time independent of the number of stored words `N`.',
    realWorldAnalogy:
      'A dictionary thumb-index organized letter-by-letter (`c -> a -> t` and `c -> a -> r` share the `c -> a` path).',
    algorithm:
      '1. Start at `root` (empty prefix).\n2. For each character `ch` in word, follow `node.children[ch]` (creating nodes on insert).\n3. Mark `node.isEnd = true` at the final character.',
    pseudocode: `// Root represents ""
// Path root -> 'a' -> 'p' -> 'p' represents "app"`,
    dryRunExample:
      'Storing `"app"`, `"apple"`, `"bat"`: `"app"` and `"apple"` share 3 edges (`a-p-p`); `p` has `isEnd = true` and child `l -> e (isEnd = true)`.',
    timeComplexity: '`O(L)` per insert/search/startsWith where `L` is word length',
    spaceComplexity: '`O(total_chars * A)` where `A` is alphabet size (26)',
    commonMistakes: [
      'Using a `26`-pointer array per node when Unicode/arbitrary characters are expected (use a HashMap instead).',
    ],
    interviewTips: [
      'Tries shine in **Autocomplete**, **Word Search II**, **Replace Words**, and **Maximum XOR of Two Numbers**.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'trie-node-structure',
    title: 'Trie Node Structure',
    definition:
      'A **TrieNode** stores child links (`children[26]` or `Map<Character, TrieNode>`) and metadata such as `isEnd` (word termination flag), `wordCount`, and `prefixCount`.',
    explanation:
      'Notice the character itself is **not** stored inside the node—it is implicit from the edge/index (`ch - \'a\'`) leading into that node! Adding `prefixCount` enables `O(L)` prefix-counting and clean lazy deletion.',
    realWorldAnalogy:
      'A 26-slot mailroom sorter at each node where slot `0` leads to `a`, slot `1` leads to `b`, plus a stamp indicating "a complete word ends here".',
    algorithm:
      '1. `children[26]` initialized to `null`.\n2. `isEnd = false` (and optional `prefixCount = 0`, `endCount = 0`).',
    pseudocode: `struct TrieNode:
    TrieNode* children[26] = {null}
    bool isEnd = false
    int prefixCount = 0`,
    dryRunExample:
      'Each lowercase TrieNode in C++/Java holds `26` references (~104–208 bytes) + `boolean isEnd`.',
    timeComplexity: '`O(1)` child lookup via array indexing (`ch - \'a\'`)',
    spaceComplexity: '`O(A)` per node (`A = 26`)',
    commonMistakes: [
      'Forgetting to initialize `children` elements to `nullptr`/`NULL` in C/C++.',
    ],
    interviewTips: [
      'In Python, a lightweight `dict` per node (`{}` with `\'#\'` as end marker) avoids allocating 26 slots per node.',
    ],
    implementations: {
      c: `typedef struct TrieNode {\n    struct TrieNode* ch[26];\n    int isEnd;\n} TrieNode;`,
      cpp: `struct TrieNode {\n    TrieNode* ch[26]{};\n    bool isEnd = false;\n};`,
      java: `class TrieNode {\n    TrieNode[] ch = new TrieNode[26];\n    boolean isEnd = false;\n}`,
      python: `class TrieNode:\n    __slots__ = ('ch', 'is_end')\n    def __init__(self):\n        self.ch: dict[str, TrieNode] = {}\n        self.is_end: bool = False`,
    },
  },
  {
    topicSlug: 'trie-insertion',
    title: 'Trie Insertion',
    definition:
      'Inserting a string `word` into a Trie walks from `root` character-by-character, creating missing child nodes along the path and setting `isEnd = true` at the end.',
    explanation:
      'If `cur.children[idx]` is `null`, allocate a new `TrieNode`. Advance `cur = cur.children[idx]` (incrementing `prefixCount` if tracking counts). After the last character, set `cur.isEnd = true`.',
    realWorldAnalogy:
      'Adding a new road branch on a map only where the path diverges from existing roads, then placing a destination pin at the end.',
    algorithm:
      '1. `cur = root`.\n2. For each `c` in `word`:\n   - `idx = c - \'a\'`.\n   - If `!cur.ch[idx]`, `cur.ch[idx] = new TrieNode()`.\n   - `cur = cur.ch[idx]`.\n3. `cur.isEnd = true`.',
    pseudocode: `cur <- root
for c in word:
    if cur.ch[c] == null: cur.ch[c] <- new TrieNode()
    cur <- cur.ch[c]
cur.isEnd <- true`,
    dryRunExample:
      'Insert `"cat"` then `"car"`: `"cat"` creates `c -> a -> t (end)`; `"car"` reuses `c -> a` and creates `r (end)`.',
    timeComplexity: '`O(L)` where `L = len(word)`',
    spaceComplexity: '`O(L)` worst-case new nodes',
    commonMistakes: [
      'Assuming inserting `"apple"` automatically makes `"app"` a valid word (only `e` gets `isEnd = true`).',
    ],
    interviewTips: [
      'For **Empty string `""`**, `root.isEnd = true` handles it cleanly.',
    ],
    implementations: {
      c: `void trieInsert(TrieNode* root, const char* w) {\n    TrieNode* cur = root;\n    for (int i = 0; w[i]; i++) {\n        int idx = w[i] - 'a';\n        if (!cur->ch[idx]) cur->ch[idx] = calloc(1, sizeof(TrieNode));\n        cur = cur->ch[idx];\n    }\n    cur->isEnd = 1;\n}`,
      cpp: `void insert(TrieNode* root, const std::string& w) {\n    TrieNode* cur = root;\n    for (char c : w) {\n        int idx = c - 'a';\n        if (!cur->ch[idx]) cur->ch[idx] = new TrieNode();\n        cur = cur->ch[idx];\n    }\n    cur->isEnd = true;\n}`,
      java: `void insert(TrieNode root, String w) {\n    TrieNode cur = root;\n    for (char c : w.toCharArray()) {\n        int idx = c - 'a';\n        if (cur.ch[idx] == null) cur.ch[idx] = new TrieNode();\n        cur = cur.ch[idx];\n    }\n    cur.isEnd = true;\n}`,
      python: `def trie_insert(root: TrieNode, word: str) -> None:\n    cur = root\n    for c in word:\n        if c not in cur.ch: cur.ch[c] = TrieNode()\n        cur = cur.ch[c]\n    cur.is_end = True`,
    },
  },
  {
    topicSlug: 'trie-search',
    title: 'Trie Exact Word Search',
    definition:
      'Searching for an exact `word` in a Trie walks down the characters of `word` from `root` and returns `true` **only if** every character path exists **and** the final node has `isEnd == true`.',
    explanation:
      'If any character’s child pointer is `null`, return `false` immediately. Reaching the end of `word` with `isEnd == false` means `word` is only a prefix of a longer stored word (e.g. `"app"` when only `"apple"` was inserted), so return `false`.',
    realWorldAnalogy:
      'Following signs to `"app"` and checking if there’s a "word ends here" stamp rather than just a road continuing to `"apple"`.',
    algorithm:
      '1. `cur = root`.\n2. For each `c` in `word`: if `!cur.ch[c]`, return `false`; `cur = cur.ch[c]`.\n3. Return `cur.isEnd`.',
    pseudocode: `cur <- root
for c in word:
    if cur.ch[c] == null: return false
    cur <- cur.ch[c]
return cur.isEnd`,
    dryRunExample:
      'Trie has `"apple"`: `search("apple") -> true`, `search("app") -> false`, `startsWith("app") -> true`.',
    timeComplexity: '`O(L)`',
    spaceComplexity: '`O(1)`',
    commonMistakes: [
      'Returning `true` at the end of the loop without checking `cur.isEnd`.',
    ],
    interviewTips: [
      'Extract a shared helper `findNode(prefix)` used by both `search` (`node != null && node.isEnd`) and `startsWith` (`node != null`)!',
    ],
    implementations: {
      c: `int trieSearch(const TrieNode* root, const char* w) {\n    const TrieNode* cur = root;\n    for (int i = 0; w[i]; i++) { cur = cur->ch[w[i] - 'a']; if (!cur) return 0; }\n    return cur->isEnd;\n}`,
      cpp: `bool search(const TrieNode* root, const std::string& w) {\n    const TrieNode* cur = root;\n    for (char c : w) { cur = cur->ch[c - 'a']; if (!cur) return false; }\n    return cur->isEnd;\n}`,
      java: `boolean search(TrieNode root, String w) {\n    TrieNode cur = root;\n    for (char c : w.toCharArray()) { cur = cur.ch[c - 'a']; if (cur == null) return false; }\n    return cur.isEnd;\n}`,
      python: `def trie_search(root: TrieNode, word: str) -> bool:\n    cur = root\n    for c in word:\n        if c not in cur.ch: return False\n        cur = cur.ch[c]\n    return cur.is_end`,
    },
  },
  {
    topicSlug: 'prefix-matching',
    title: 'Prefix Matching (startsWith & Count Words With Prefix)',
    definition:
      'Prefix matching checks whether any stored word begins with `prefix` (`startsWith`) or counts how many stored words share `prefix` in `O(len(prefix))` time.',
    explanation:
      'Walk `prefix` from `root`: if every character exists, `startsWith` returns `true` (no `isEnd` check needed). Maintaining `prefixCount` on each node during `insert` lets `countWordsStartingWith(prefix)` return `cur.prefixCount` in `O(L)` without DFS!',
    realWorldAnalogy:
      'Counting how many contacts in a phonebook start with `"Al"` without scanning the entire phonebook.',
    algorithm:
      '1. Walk `cur` down `prefix`.\n2. If any link is `null`, return `false` (or `0` count).\n3. Return `true` (or `cur.prefixCount`).',
    pseudocode: `cur <- root
for c in prefix:
    if cur.ch[c] == null: return false
    cur <- cur.ch[c]
return true`,
    dryRunExample:
      'Inserted `"apple"`, `"app"`, `"ape"`: `startsWith("ap") -> true`, `prefixCount("ap") -> 3`, `prefixCount("app") -> 2`.',
    timeComplexity: '`O(L)`',
    spaceComplexity: '`O(1)`',
    commonMistakes: [
      'Checking `cur.isEnd` in `startsWith` (only `search` checks `isEnd`).',
    ],
    interviewTips: [
      'Adding `prefixCount` and `endCount` to `TrieNode` solves **Implement Trie II (Prefix Tree)** in `O(L)` per operation.',
    ],
    implementations: {
      c: `int startsWith(const TrieNode* root, const char* p) {\n    const TrieNode* cur = root;\n    for (int i = 0; p[i]; i++) { cur = cur->ch[p[i] - 'a']; if (!cur) return 0; }\n    return 1;\n}`,
      cpp: `bool startsWith(const TrieNode* root, const std::string& p) {\n    const TrieNode* cur = root;\n    for (char c : p) { cur = cur->ch[c - 'a']; if (!cur) return false; }\n    return true;\n}`,
      java: `boolean startsWith(TrieNode root, String p) {\n    TrieNode cur = root;\n    for (char c : p.toCharArray()) { cur = cur.ch[c - 'a']; if (cur == null) return false; }\n    return true;\n}`,
      python: `def starts_with(root: TrieNode, prefix: str) -> bool:\n    cur = root\n    for c in prefix:\n        if c not in cur.ch: return False\n        cur = cur.ch[c]\n    return True`,
    },
  },
  {
    topicSlug: 'trie-deletion',
    title: 'Trie Deletion (Lazy & Physical Pruning)',
    definition:
      'Deleting a word from a Trie unmarks `isEnd = false` (or decrements `endCount`/`prefixCount`), and optionally frees unused branch nodes bottom-up if they have no other children and `isEnd == false`.',
    explanation:
      'Simple **lazy deletion** sets `cur.isEnd = false` (and decrements `prefixCount` along the path). **Full physical pruning** uses recursion: on backtrack, if `child` has no non-null children and `child.isEnd == false`, delete/nullify `cur.ch[idx]`.',
    realWorldAnalogy:
      'Removing a dead-end street sign only if no other houses or streets branch off from it.',
    algorithm:
      '1. Base `idx == len(word)`: if `!cur.isEnd`, return `false`; set `cur.isEnd = false`; return `hasNoChildren(cur)`.\n2. Recurse on `cur.ch[word[idx]]`; if it returns `true`, delete/nullify `cur.ch[word[idx]]`.\n3. Return `!cur.isEnd && hasNoChildren(cur)`.',
    pseudocode: `erase(cur, word, idx):
    if idx == len(word):
        cur.isEnd <- false
        return hasNoChildren(cur)
    c <- word[idx]
    if cur.ch[c] != null and erase(cur.ch[c], word, idx + 1):
        cur.ch[c] <- null
    return not cur.isEnd and hasNoChildren(cur)`,
    dryRunExample:
      'Trie has `"app"` and `"apple"`: deleting `"apple"` frees `e` and `l`, but stops at `p` because `p.isEnd == true` for `"app"`.',
    timeComplexity: '`O(L)`',
    spaceComplexity: '`O(L)` recursion stack for pruning',
    commonMistakes: [
      'Deleting nodes that are still prefixes of another word (`isEnd == true` or has other children).',
    ],
    interviewTips: [
      'Verify the word exists before decrementing `prefixCount` so deleting a missing word never corrupts counts.',
    ],
    implementations: {
      c: `// Recursive erase returning 1 if node can be freed`,
      cpp: `bool hasNoChildren(const TrieNode* n) { for (auto* p : n->ch) if (p) return false; return true; }\nbool eraseWord(TrieNode* cur, const std::string& w, size_t idx) {\n    if (!cur) return false;\n    if (idx == w.size()) { cur->isEnd = false; return hasNoChildren(cur); }\n    int c = w[idx] - 'a';\n    if (eraseWord(cur->ch[c], w, idx + 1)) { delete cur->ch[c]; cur->ch[c] = nullptr; }\n    return !cur->isEnd && hasNoChildren(cur);\n}`,
      java: `boolean erase(TrieNode cur, String w, int idx) {\n    if (cur == null) return false;\n    if (idx == w.length()) { cur.isEnd = false; return isEmpty(cur); }\n    int c = w.charAt(idx) - 'a';\n    if (erase(cur.ch[c], w, idx + 1)) cur.ch[c] = null;\n    return !cur.isEnd && isEmpty(cur);\n}`,
      python: `def trie_delete(root: TrieNode, word: str) -> None:\n    def dfs(cur: TrieNode, i: int) -> bool:\n        if i == len(word):\n            cur.is_end = False\n            return len(cur.ch) == 0\n        c = word[i]\n        if c in cur.ch and dfs(cur.ch[c], i + 1):\n            del cur.ch[c]\n        return not cur.is_end and len(cur.ch) == 0\n    dfs(root, 0)`,
    },
  },
  {
    topicSlug: 'autocomplete-with-trie',
    title: 'Autocomplete System with Trie',
    definition:
      'An **Autocomplete** system navigates to the node matching the typed `prefix` and performs lexicographical DFS (`a..z`) from that node to collect the top matching word suggestions.',
    explanation:
      "First traverse `prefix` in `O(len(prefix))`. From that prefix node, run DFS iterating children `'a'..'z'` in alphabetical order so suggestions naturally come out sorted—stopping once `K` suggestions (e.g., top 3 in LeetCode 1268 Search Suggestions System) are collected.",
    realWorldAnalogy:
      'A search bar showing the top 3 alphabetical completions as you type each letter.',
    algorithm:
      "1. Navigate `cur` to end of `prefix`; if missing, return `[]`.\n2. Run DFS from `cur` with `path = prefix`, iterating `'a'..'z'`.\n3. When `cur.isEnd`, add `path` to `res`; stop if `res.size() == K`.",
    pseudocode: `cur <- findNode(prefix)
if cur == null: return []
dfsCollect(cur, prefix, res, K)`,
    dryRunExample:
      'Words `["mobile","mouse","moneypot","monitor","mousepad"]`, prefix `"mou"` -> DFS finds `"mouse"`, `"mousepad"`.',
    timeComplexity: '`O(P + S)` where `P` is prefix length and `S` is traversed subtree size (bounded by `K * maxLen`)',
    spaceComplexity: '`O(maxLen)` DFS stack',
    commonMistakes: [
      'Sorting all dictionary words on every keystroke instead of traversing from the prefix node.',
    ],
    interviewTips: [
      'For high-throughput autocomplete, cache the top-3 suggestions directly at each TrieNode during `insert` for `O(1)` lookup per keystroke!',
    ],
    implementations: {
      c: `// Navigate to prefix node, then DFS a..z up to K results`,
      cpp: `#include <string>\n#include <vector>\nusing namespace std;\nvoid collectDfs(TrieNode* n, string& cur, vector<string>& res, int k) {\n    if (static_cast<int>(res.size()) >= k) return;\n    if (n->isEnd) res.push_back(cur);\n    for (int i = 0; i < 26; ++i) if (n->ch[i]) {\n        cur.push_back('a' + i); collectDfs(n->ch[i], cur, res, k); cur.pop_back();\n    }\n}`,
      java: `import java.util.*;\nvoid collect(TrieNode n, StringBuilder cur, List<String> res, int k) {\n    if (res.size() >= k) return;\n    if (n.isEnd) res.add(cur.toString());\n    for (int i = 0; i < 26; i++) if (n.ch[i] != null) {\n        cur.append((char)('a' + i)); collect(n.ch[i], cur, res, k); cur.deleteCharAt(cur.length() - 1);\n    }\n}`,
      python: `def autocomplete(root: TrieNode, prefix: str, k: int = 3) -> list[str]:\n    cur = root\n    for c in prefix:\n        if c not in cur.ch: return []\n        cur = cur.ch[c]\n    res, path = [], list(prefix)\n    def dfs(n: TrieNode) -> None:\n        if len(res) >= k: return\n        if n.is_end: res.append("".join(path))\n        for c in sorted(n.ch):\n            path.append(c); dfs(n.ch[c]); path.pop()\n    dfs(cur)\n    return res`,
    },
  },
  {
    topicSlug: 'word-dictionary',
    title: 'Design Add and Search Words Data Structure (Wildcard `.`)',
    definition:
      'Support `addWord(word)` and `search(pattern)` where `pattern` may contain `.` wildcards matching **any** single lowercase letter.',
    explanation:
      "Normal letters follow the single child `cur.ch[c - 'a']`. When encountering `'.'`, recursively branch over all non-null children `0..25` and return `true` if any branch matches the remainder of `pattern`.",
    realWorldAnalogy:
      'Looking up a crossword puzzle clue like `"b.d"` where `.` can be any letter (`"bad"`, `"bed"`, `"bid"`).',
    algorithm:
      '1. `addWord`: standard Trie insert.\n2. `dfs(node, word, idx)`:\n   - If `idx == len(word)`, return `node.isEnd`.\n   - If `word[idx] != \'.\'`: follow single child.\n   - Else: try all 26 non-null children for `idx + 1`.',
    pseudocode: `dfs(node, word, idx):
    if idx == len(word): return node.isEnd
    if word[idx] != '.':
        return node.ch[word[idx]] != null and dfs(node.ch[word[idx]], word, idx + 1)
    for child in node.ch:
        if child != null and dfs(child, word, idx + 1): return true
    return false`,
    dryRunExample:
      'Added `"bad"`, `"dad"`, `"mad"`: `search(".ad") -> true`, `search("b..") -> true`, `search("pad") -> false`.',
    timeComplexity: '`O(L)` without wildcards; `O(26^d * L)` worst case with `d` dots',
    spaceComplexity: '`O(L)` recursion depth',
    commonMistakes: [
      'Returning `false` on the first non-matching child of `.` instead of checking all 26 children!',
    ],
    interviewTips: [
      'Mention length-bucketing or pruning if patterns contain many wildcards.',
    ],
    implementations: {
      c: `bool wdSearch(const TrieNode* n, const char* w, int i) {\n    if (!n) return false;\n    if (w[i] == '\\0') return n->isEnd;\n    if (w[i] != '.') return wdSearch(n->ch[w[i] - 'a'], w, i + 1);\n    for (int c = 0; c < 26; c++) if (n->ch[c] && wdSearch(n->ch[c], w, i + 1)) return true;\n    return false;\n}`,
      cpp: `bool wdSearch(const TrieNode* n, const std::string& w, size_t i) {\n    if (!n) return false;\n    if (i == w.size()) return n->isEnd;\n    if (w[i] != '.') return wdSearch(n->ch[w[i] - 'a'], w, i + 1);\n    for (int c = 0; c < 26; ++c) if (n->ch[c] && wdSearch(n->ch[c], w, i + 1)) return true;\n    return false;\n}`,
      java: `boolean searchWild(TrieNode n, String w, int i) {\n    if (n == null) return false;\n    if (i == w.length()) return n.isEnd;\n    if (w.charAt(i) != '.') return searchWild(n.ch[w.charAt(i) - 'a'], w, i + 1);\n    for (int c = 0; c < 26; c++) if (n.ch[c] != null && searchWild(n.ch[c], w, i + 1)) return true;\n    return false;\n}`,
      python: `def search_wild(root: TrieNode, word: str) -> bool:\n    def dfs(n: TrieNode, i: int) -> bool:\n        if i == len(word): return n.is_end\n        if word[i] != '.':\n            return word[i] in n.ch and dfs(n.ch[word[i]], i + 1)\n        return any(dfs(child, i + 1) for child in n.ch.values())\n    return dfs(root, 0)`,
    },
  },
  {
    topicSlug: 'longest-common-prefix-using-trie',
    title: 'Longest Common Prefix Using Trie',
    definition:
      'Find the longest common prefix (LCP) of an array of strings by inserting all strings into a Trie and walking down from `root` while the current node has **exactly 1 child** and **`isEnd == false`**.',
    explanation:
      'A node with `> 1` children means two strings diverge at that character; a node with `isEnd == true` means a shorter string ended there, so the common prefix cannot extend further.',
    realWorldAnalogy:
      'Following a single trunk up a tree until it either forks into two branches or hits a leaf.',
    algorithm:
      '1. Insert all strings into Trie (if any string is `""`, LCP is `""`).\n2. Start `cur = root`.\n3. While `!cur.isEnd` and `countChildren(cur) == 1`: append that single child’s character to `lcp` and advance `cur`.\n4. Return `lcp`.',
    pseudocode: `insert all strings into trie
cur <- root; lcp <- ""
while not cur.isEnd and childCount(cur) == 1:
    (ch, nextNode) <- onlyChild(cur)
    lcp <- lcp + ch; cur <- nextNode
return lcp`,
    dryRunExample:
      '`["flower", "flow", "flight"]`: `f -> l` has 1 child each; at `l`, children are `o` and `i` (2 children) -> stops, LCP = `"fl"`.',
    timeComplexity: '`O(total_characters)`',
    spaceComplexity: '`O(total_characters)` (note: vertical scanning uses `O(1)` space)',
    commonMistakes: [
      'Forgetting to stop at `cur.isEnd == true` (e.g., `["ab", "abc"]` -> must stop at `"ab"`, not `"abc"`!).',
    ],
    interviewTips: [
      'Mention that while Trie solves dynamic LCP queries cleanly, simple vertical scanning achieves `O(1)` extra space for a static array.',
    ],
    implementations: {
      c: `// Insert all strings, walk while !cur->isEnd && childCount == 1`,
      cpp: `#include <string>\n#include <vector>\nstd::string lcpTrie(const std::vector<std::string>& strs) {\n    if (strs.empty()) return "";\n    TrieNode root; for (auto& s : strs) insert(&root, s);\n    std::string lcp; TrieNode* cur = &root;\n    while (!cur->isEnd) {\n        int cnt = 0, idx = -1;\n        for (int i = 0; i < 26; ++i) if (cur->ch[i]) { ++cnt; idx = i; }\n        if (cnt != 1) break;\n        lcp.push_back('a' + idx); cur = cur->ch[idx];\n    }\n    return lcp;\n}`,
      java: `// Same childCount == 1 && !cur.isEnd walk`,
      python: `def lcp_trie(strs: list[str]) -> str:\n    if not strs: return ""\n    root = TrieNode()\n    for s in strs: trie_insert(root, s)\n    cur, lcp = root, []\n    while not cur.is_end and len(cur.ch) == 1:\n        ch, nxt = next(iter(cur.ch.items()))\n        lcp.append(ch); cur = nxt\n    return "".join(lcp)`,
    },
  },
  {
    topicSlug: 'maximum-xor-using-binary-trie',
    title: 'Maximum XOR of Two Numbers Using Binary Trie',
    definition:
      'Given an array of non-negative integers `nums`, find the maximum `nums[i] ^ nums[j]` in `O(32 * N)` time using a **Binary Trie** (bit-by-bit from MSB `31` down to LSB `0`).',
    explanation:
      'To maximize XOR with `x`, we greedily want the **opposite bit** (`1 - bit`) at the highest possible bit position! Insert all numbers’ 32-bit representations into a 2-child (`0` and `1`) Binary Trie. Then for each `x`, walk from bit `30` down to `0`: if child `1 - bit` exists, take it (gaining `1 << b` in the XOR); otherwise take `bit`.',
    realWorldAnalogy:
      'Choosing a partner number bit-by-bit from left to right, always picking the opposite bit whenever available to maximize difference.',
    algorithm:
      '1. Insert each `x` into Binary Trie (bits `30..0`).\n2. For each `x`, query `maxXor(x)`: start `cur = root, ans = 0`; for `b = 30` down to `0`, let `bit = (x >> b) & 1`, prefer `cur.ch[1 ^ bit]` (`ans |= (1 << b)`), else `cur.ch[bit]`.\n3. Return max over all `x`.',
    pseudocode: `maxXorQuery(x):
    cur <- root, ans <- 0
    for b from 30 down to 0:
        bit <- (x >> b) & 1
        if cur.ch[1 ^ bit] != null:
            ans <- ans | (1 << b); cur <- cur.ch[1 ^ bit]
        else:
            cur <- cur.ch[bit]
    return ans`,
    dryRunExample:
      '`nums = [3, 10, 5, 25, 2, 8]`: `5 ^ 25 = 00101 ^ 11001 = 11100 = 28` (maximum).',
    timeComplexity: '`O(31 * N)` = `O(N)`',
    spaceComplexity: '`O(31 * N)` Trie nodes',
    commonMistakes: [
      'Inserting bits LSB-to-MSB instead of **MSB-to-LSB** (MSB contributes `2^30`, which outweighs all lower bits combined!).',
    ],
    interviewTips: [
      'Binary Trie also solves **Maximum XOR With an Element From Array** (sort queries & numbers offline) and **Max XOR Subarray** (insert prefix XORs!).',
    ],
    implementations: {
      c: `// 2-child Binary Trie node with child[2], loop b from 30 down to 0`,
      cpp: `#include <algorithm>\n#include <vector>\nstruct BitNode { BitNode* ch[2]{}; };\nint findMaximumXOR(const std::vector<int>& nums) {\n    BitNode* root = new BitNode();\n    for (int x : nums) {\n        BitNode* cur = root;\n        for (int b = 30; b >= 0; --b) {\n            int bit = (x >> b) & 1;\n            if (!cur->ch[bit]) cur->ch[bit] = new BitNode();\n            cur = cur->ch[bit];\n        }\n    }\n    int best = 0;\n    for (int x : nums) {\n        BitNode* cur = root; int ans = 0;\n        for (int b = 30; b >= 0; --b) {\n            int bit = (x >> b) & 1;\n            if (cur->ch[1 ^ bit]) { ans |= (1 << b); cur = cur->ch[1 ^ bit]; }\n            else cur = cur->ch[bit];\n        }\n        best = std::max(best, ans);\n    }\n    return best;\n}`,
      java: `public class MaxXorTrie {\n    static class Node { Node[] ch = new Node[2]; }\n    public static int findMaximumXOR(int[] nums) {\n        Node root = new Node();\n        for (int x : nums) { Node c = root; for (int b = 30; b >= 0; b--) { int bit = (x >> b) & 1; if (c.ch[bit] == null) c.ch[bit] = new Node(); c = c.ch[bit]; } }\n        int best = 0;\n        for (int x : nums) {\n            Node c = root; int ans = 0;\n            for (int b = 30; b >= 0; b--) { int bit = (x >> b) & 1; if (c.ch[1 ^ bit] != null) { ans |= (1 << b); c = c.ch[1 ^ bit]; } else c = c.ch[bit]; }\n            best = Math.max(best, ans);\n        }\n        return best;\n    }\n}`,
      python: `def find_maximum_xor(nums: list[int]) -> int:\n    root = {}\n    for x in nums:\n        cur = root\n        for b in range(30, -1, -1):\n            cur = cur.setdefault((x >> b) & 1, {})\n    best = 0\n    for x in nums:\n        cur, ans = root, 0\n        for b in range(30, -1, -1):\n            bit = (x >> b) & 1\n            if (1 ^ bit) in cur: ans |= (1 << b); cur = cur[1 ^ bit]\n            else: cur = cur[bit]\n        best = max(best, ans)\n    return best`,
    },
  },

  // =========================================================================
  // MODULE 23: ADVANCED STRING ALGORITHMS (8 Concepts)
  // =========================================================================
  {
    topicSlug: 'naive-pattern-matching',
    title: 'Naive Pattern Matching',
    definition:
      'Naive pattern matching checks every starting alignment `i = 0 .. n - m` of pattern `pat` (length `m`) inside `text` (length `n`) character-by-character.',
    explanation:
      'When a mismatch occurs at `j`, naive matching shifts `i` by only `1` and restarts `j` from `0`. On random text this averages `O(n)`, but on repetitive strings like `text = "AAAA...AB"`, `pat = "AAAAB"`, it degrades to `O(n * m)`—motivating KMP, Z-Algorithm, and Rabin-Karp.',
    realWorldAnalogy:
      'Sliding a transparency template one character at a time across a page and re-checking from the first letter every time.',
    algorithm:
      '1. Loop `i = 0 .. n - m`.\n2. Loop `j = 0 .. m - 1`: if `text[i + j] != pat[j]`, `break`.\n3. If `j == m`, record match at `i`.',
    pseudocode: `for i from 0 to n - m:
    j <- 0
    while j < m and text[i + j] == pat[j]: j <- j + 1
    if j == m: matches.append(i)`,
    dryRunExample:
      '`text = "ABABD"`, `pat = "ABD"`: fails at `i=0` (`D != A`), fails at `i=1`, matches at `i=2`.',
    timeComplexity: '`O(n * m)` worst case; `O(n + m)` average on random text',
    spaceComplexity: '`O(1)`',
    commonMistakes: [
      'Looping `i` up to `n` instead of `n - m` (out-of-bounds read!).',
    ],
    interviewTips: [
      'Know the worst-case input `"AAA...A"` + `"AAAB"` to explain why `O(n + m)` KMP/Z is needed.',
    ],
    implementations: {
      c: `int naiveSearch(const char* t, const char* p) {\n    int n = (int)strlen(t), m = (int)strlen(p);\n    for (int i = 0; i <= n - m; i++) {\n        int j = 0; while (j < m && t[i + j] == p[j]) j++;\n        if (j == m) return i;\n    }\n    return -1;\n}`,
      cpp: `int naiveSearch(const std::string& t, const std::string& p) {\n    int n = static_cast<int>(t.size()), m = static_cast<int>(p.size());\n    for (int i = 0; i <= n - m; ++i) {\n        int j = 0; while (j < m && t[i + j] == p[j]) ++j;\n        if (j == m) return i;\n    }\n    return -1;\n}`,
      java: `public class NaiveMatch {\n    public static int findFirst(String t, String p) {\n        for (int i = 0; i <= t.length() - p.length(); i++) {\n            int j = 0; while (j < p.length() && t.charAt(i + j) == p.charAt(j)) j++;\n            if (j == p.length()) return i;\n        }\n        return -1;\n    }\n}`,
      python: `def naive_search(text: str, pat: str) -> int:\n    n, m = len(text), len(pat)\n    for i in range(n - m + 1):\n        if text[i:i + m] == pat: return i\n    return -1`,
    },
  },
  {
    topicSlug: 'kmp-algorithm',
    title: 'KMP (Knuth-Morris-Pratt) String Matching',
    definition:
      '**KMP** finds all occurrences of `pat` (length `m`) in `text` (length `n`) in guaranteed `O(n + m)` worst-case time by never moving the `text` pointer `i` backward.',
    explanation:
      'Using the precomputed **LPS (Longest Proper Prefix which is also Suffix)** array `lps[0..m-1]`, when `text[i] != pat[j]`, instead of resetting `j = 0` and rewinding `i`, we jump `j = lps[j - 1]`—reusing the characters we already know matched!',
    realWorldAnalogy:
      'Never re-reading text you already read: when a mismatch happens, slide the pattern forward to the longest prefix that already matches the suffix you just read.',
    algorithm:
      '1. Build `lps[0..m-1]` in `O(m)`.\n2. Initialize `i = 0` (text), `j = 0` (pat).\n3. While `i < n`:\n   - If `text[i] == pat[j]`: `i++`, `j++`; if `j == m`, record `i - m`, set `j = lps[j - 1]`.\n   - Else if `j > 0`: `j = lps[j - 1]`.\n   - Else: `i++`.',
    pseudocode: `buildLPS(pat)
i <- 0, j <- 0
while i < n:
    if text[i] == pat[j]:
        i <- i + 1; j <- j + 1
        if j == m: matches.append(i - m); j <- lps[j - 1]
    else if j > 0: j <- lps[j - 1]
    else: i <- i + 1`,
    dryRunExample:
      '`text = "ABABDABACDABABCABAB"`, `pat = "ABABCABAB"` (`lps = [0,0,1,2,0,1,2,3,4]`): matches at index `10`.',
    timeComplexity: '`O(n + m)` worst case',
    spaceComplexity: '`O(m)` for `lps` array',
    commonMistakes: [
      'Forgetting `j = lps[j - 1]` after finding a full match `j == m` when searching for overlapping occurrences.',
    ],
    interviewTips: [
      'Explain why `i` never decreases and `j` decreases at most as many times as it increased -> amortized `O(n)`!',
    ],
    implementations: {
      c: `int kmpSearch(const char* t, const char* p) {\n    int n = (int)strlen(t), m = (int)strlen(p); if (m == 0) return 0;\n    int lps[1000] = {0}; for (int i = 1, len = 0; i < m;) {\n        if (p[i] == p[len]) lps[i++] = ++len;\n        else if (len) len = lps[len - 1];\n        else lps[i++] = 0;\n    }\n    for (int i = 0, j = 0; i < n;) {\n        if (t[i] == p[j]) { i++; j++; if (j == m) return i - m; }\n        else if (j) j = lps[j - 1];\n        else i++;\n    }\n    return -1;\n}`,
      cpp: `#include <string>\n#include <vector>\nstd::vector<int> kmpSearch(const std::string& t, const std::string& p) {\n    int n = static_cast<int>(t.size()), m = static_cast<int>(p.size());\n    std::vector<int> lps(m, 0), res;\n    for (int i = 1, len = 0; i < m;) {\n        if (p[i] == p[len]) lps[i++] = ++len;\n        else if (len) len = lps[len - 1];\n        else lps[i++] = 0;\n    }\n    for (int i = 0, j = 0; i < n;) {\n        if (t[i] == p[j]) { ++i; ++j; if (j == m) { res.push_back(i - m); j = lps[j - 1]; } }\n        else if (j) j = lps[j - 1];\n        else ++i;\n    }\n    return res;\n}`,
      java: `import java.util.*;\npublic class KMP {\n    public static List<Integer> search(String t, String p) {\n        int n = t.length(), m = p.length(); int[] lps = new int[m];\n        for (int i = 1, len = 0; i < m;) {\n            if (p.charAt(i) == p.charAt(len)) lps[i++] = ++len;\n            else if (len > 0) len = lps[len - 1];\n            else lps[i++] = 0;\n        }\n        List<Integer> res = new ArrayList<>();\n        for (int i = 0, j = 0; i < n;) {\n            if (t.charAt(i) == p.charAt(j)) { i++; j++; if (j == m) { res.add(i - m); j = lps[j - 1]; } }\n            else if (j > 0) j = lps[j - 1];\n            else i++;\n        }\n        return res;\n    }\n}`,
      python: `def kmp_search(text: str, pat: str) -> list[int]:\n    n, m = len(text), len(pat)\n    lps = [0] * m; i, length = 1, 0\n    while i < m:\n        if pat[i] == pat[length]: length += 1; lps[i] = length; i += 1\n        elif length: length = lps[length - 1]\n        else: lps[i] = 0; i += 1\n    res, i, j = [], 0, 0\n    while i < n:\n        if text[i] == pat[j]:\n            i += 1; j += 1\n            if j == m: res.append(i - m); j = lps[j - 1]\n        elif j: j = lps[j - 1]\n        else: i += 1\n    return res`,
    },
  },
  {
    topicSlug: 'lps-failure-function-array',
    title: 'LPS (Failure Function / Prefix Function) Array',
    definition:
      '`lps[i]` (also called `pi[i]`) is the length of the **longest proper prefix** of `s[0..i]` that is also a **suffix** of `s[0..i]`.',
    explanation:
      '"Proper" means strictly shorter than `i + 1` (so `lps[0] = 0`). When `s[i] != s[len]`, we fall back to `len = lps[len - 1]`—the next-longest border—until a match or `len == 0`. Besides KMP, `lps` solves **Repeated Substring Pattern** (`n % (n - lps[n-1]) == 0`) and **Shortest Palindrome** (`s + "#" + reverse(s)`).',
    realWorldAnalogy:
      'Measuring how much of the start of a ribbon overlaps identically with the end of the ribbon.',
    algorithm:
      '1. `lps[0] = 0, len = 0, i = 1`.\n2. While `i < m`:\n   - If `s[i] == s[len]`: `lps[i++] = ++len`.\n   - Else if `len > 0`: `len = lps[len - 1]`.\n   - Else: `lps[i++] = 0`.',
    pseudocode: `lps[0] <- 0, len <- 0, i <- 1
while i < m:
    if s[i] == s[len]: len <- len + 1; lps[i] <- len; i <- i + 1
    else if len > 0: len <- lps[len - 1]
    else: lps[i] <- 0; i <- i + 1`,
    dryRunExample:
      '`s = "AABAAAB"`: `lps = [0, 1, 0, 1, 2, 2, 3]`.',
    timeComplexity: '`O(m)`',
    spaceComplexity: '`O(m)`',
    commonMistakes: [
      'Incrementing `i` in the `else if (len > 0)` fallback branch (must NOT increment `i` until `s[i]` is matched or `len == 0`!).',
    ],
    interviewTips: [
      'To test if `s` is periodic (`s = t + t + ...`), check `lps[n-1] > 0 && n % (n - lps[n-1]) == 0`.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'z-algorithm',
    title: 'Z Algorithm (Z-Array Pattern Matching)',
    definition:
      'The **Z-array** `Z[i]` stores the length of the longest substring starting at `i` that matches a prefix of `s` (`Z[0] = 0`). Computing `Z` on `pat + "$" + text` finds all pattern occurrences in `O(n + m)`.',
    explanation:
      'Maintain a **Z-box** `[L, R]`—the rightmost interval `[L..R]` matching `s[0..R-L]`. For `i <= R`, we copy the mirror value `Z[i - L]` clamped to `R - i + 1`, then extend greedily and update `[L, R]` whenever `i + Z[i] - 1 > R`.',
    realWorldAnalogy:
      'Reusing a sliding "already-verified prefix mirror" `[L, R]` so you never re-compare characters inside the known window.',
    algorithm:
      '1. `L = R = 0`, `Z[0] = 0`.\n2. For `i = 1 .. n - 1`:\n   - If `i <= R`: `Z[i] = min(R - i + 1, Z[i - L])`.\n   - While `i + Z[i] < n && s[Z[i]] == s[i + Z[i]]`: `Z[i]++`.\n   - If `i + Z[i] - 1 > R`: `L = i, R = i + Z[i] - 1`.',
    pseudocode: `L <- 0, R <- 0
for i from 1 to n - 1:
    if i <= R: Z[i] <- min(R - i + 1, Z[i - L])
    while i + Z[i] < n and s[Z[i]] == s[i + Z[i]]: Z[i] <- Z[i] + 1
    if i + Z[i] - 1 > R: L <- i; R <- i + Z[i] - 1`,
    dryRunExample:
      '`s = "aabxaab"`: `Z = [0, 1, 0, 0, 3, 1, 0]`. For `pat + "$" + text`, any `i` with `Z[i] == len(pat)` is a match!',
    timeComplexity: '`O(n + m)`',
    spaceComplexity: '`O(n + m)`',
    commonMistakes: [
      'Choosing a separator character that actually appears in `pat` or `text` (must use a unique sentinel like `$`).',
    ],
    interviewTips: [
      'Z-Algorithm is often easier to remember than KMP and gives exact LCP lengths at every index.',
    ],
    implementations: {
      c: `// Z-box [L, R] loop for i = 1..n-1`,
      cpp: `#include <algorithm>\n#include <string>\n#include <vector>\nstd::vector<int> zFunction(const std::string& s) {\n    int n = static_cast<int>(s.size()), L = 0, R = 0;\n    std::vector<int> Z(n, 0);\n    for (int i = 1; i < n; ++i) {\n        if (i <= R) Z[i] = std::min(R - i + 1, Z[i - L]);\n        while (i + Z[i] < n && s[Z[i]] == s[i + Z[i]]) ++Z[i];\n        if (i + Z[i] - 1 > R) { L = i; R = i + Z[i] - 1; }\n    }\n    return Z;\n}`,
      java: `public class ZAlgorithm {\n    public static int[] zFunction(String s) {\n        int n = s.length(), L = 0, R = 0; int[] Z = new int[n];\n        for (int i = 1; i < n; i++) {\n            if (i <= R) Z[i] = Math.min(R - i + 1, Z[i - L]);\n            while (i + Z[i] < n && s.charAt(Z[i]) == s.charAt(i + Z[i])) Z[i]++;\n            if (i + Z[i] - 1 > R) { L = i; R = i + Z[i] - 1; }\n        }\n        return Z;\n    }\n}`,
      python: `def z_function(s: str) -> list[int]:\n    n, L, R = len(s), 0, 0; Z = [0] * n\n    for i in range(1, n):\n        if i <= R: Z[i] = min(R - i + 1, Z[i - L])\n        while i + Z[i] < n and s[Z[i]] == s[i + Z[i]]: Z[i] += 1\n        if i + Z[i] - 1 > R: L, R = i, i + Z[i] - 1\n    return Z`,
    },
  },
  {
    topicSlug: 'rabin-karp-algorithm',
    title: 'Rabin-Karp String Matching',
    definition:
      '**Rabin-Karp** hashes `pat` and slides a rolling hash window of length `m` across `text`, only verifying characters when the hashes match.',
    explanation:
      'Expected time is `O(n + m)`, while worst-case (adversarial hash collisions) is `O(n * m)`. Using double hashing (two large primes `10^9 + 7` and `10^9 + 9`) makes collision probability negligible (`~10^-18`). Rabin-Karp also excels at **multi-pattern search** and **Longest Duplicate Substring**.',
    realWorldAnalogy:
      'Checking document fingerprints first and only reading word-for-word when two fingerprints match.',
    algorithm:
      '1. Compute `patHash` and initial `winHash` for `text[0..m-1]`, plus `highPow = base^(m-1) % mod`.\n2. Slide `i = 0 .. n - m`: if `winHash == patHash`, verify `text[i..i+m-1] == pat`.\n3. Roll hash: `winHash = ((winHash - text[i]*highPow) * base + text[i+m]) % mod`.',
    pseudocode: `if winHash == patHash and text[i..i+m-1] == pat: match!
winHash <- ((winHash - text[i]*highPow) * base + text[i+m]) % mod`,
    dryRunExample:
      'With `base = 256, mod = 10^9+7`, rolling out `\'a\'` and rolling in `\'d\'` updates the window hash in `O(1)`.',
    timeComplexity: '`O(n + m)` average, `O(n * m)` worst case',
    spaceComplexity: '`O(1)`',
    commonMistakes: [
      'Negative modulo result in C/C++/Java after subtracting `text[i] * highPow` (always add `+ mod` before `% mod`!).',
    ],
    interviewTips: [
      'Rabin-Karp + Binary Search on length is the standard solution for **Longest Duplicate Substring** (LeetCode 1044).',
    ],
    implementations: {
      c: `// Rolling hash with unsigned/long long and (val % mod + mod) % mod`,
      cpp: `#include <string>\n#include <vector>\nstd::vector<int> rabinKarp(const std::string& t, const std::string& p) {\n    int n = static_cast<int>(t.size()), m = static_cast<int>(p.size());\n    if (n < m) return {};\n    const long long B = 31, M = 1000000007;\n    long long hp = 1, ph = 0, wh = 0;\n    for (int i = 0; i < m - 1; ++i) hp = (hp * B) % M;\n    for (int i = 0; i < m; ++i) { ph = (ph * B + p[i]) % M; wh = (wh * B + t[i]) % M; }\n    std::vector<int> res;\n    for (int i = 0; i <= n - m; ++i) {\n        if (ph == wh && t.compare(i, m, p) == 0) res.push_back(i);\n        if (i < n - m) { wh = ((wh - t[i] * hp) % M + M) % M; wh = (wh * B + t[i + m]) % M; }\n    }\n    return res;\n}`,
      java: `// Same rolling hash with long B = 31, M = 1_000_000_007L`,
      python: `def rabin_karp(text: str, pat: str) -> list[int]:\n    n, m = len(text), len(pat)\n    if n < m: return []\n    B, M = 256, 10**9 + 7\n    hp = pow(B, m - 1, M); ph = wh = 0\n    for i in range(m): ph = (ph * B + ord(pat[i])) % M; wh = (wh * B + ord(text[i])) % M\n    res = []\n    for i in range(n - m + 1):\n        if ph == wh and text[i:i + m] == pat: res.append(i)\n        if i < n - m: wh = ((wh - ord(text[i]) * hp) * B + ord(text[i + m])) % M\n    return res`,
    },
  },
  {
    topicSlug: 'rolling-hash',
    title: 'Polynomial Rolling Hash',
    definition:
      'A **polynomial rolling hash** treats a string `s[0..k-1]` as a base-`B` number modulo a large prime `M`: `H(s) = sum(s[i] * B^(k - 1 - i)) mod M`.',
    explanation:
      'Precomputing `pref[i]` and `powB[i]` lets you query the hash of **any** substring `s[l..r]` in `O(1)`: `H(l..r) = (pref[r + 1] - pref[l] * powB[r - l + 1]) mod M`. Using two `(B, M)` pairs eliminates birthday-paradox collisions for up to `10^6` substrings.',
    realWorldAnalogy:
      'Assigning every substring a compact numeric fingerprint so any two substrings can be compared for equality in `O(1)`.',
    algorithm:
      '1. `pref[0] = 0, powB[0] = 1`.\n2. `pref[i+1] = (pref[i] * B + s[i]) % M`; `powB[i+1] = (powB[i] * B) % M`.\n3. `subHash(l, r) = (pref[r+1] - pref[l] * powB[r - l + 1] % M + M) % M`.',
    pseudocode: `subHash(l, r) = (pref[r + 1] - pref[l] * powB[r - l + 1]) mod M`,
    dryRunExample:
      'Substring `"bc"` in `"abcd"` (`l=1, r=2`): `(pref[3] - pref[1] * B^2) mod M`.',
    timeComplexity: '`O(N)` precomputation, `O(1)` per substring hash query',
    spaceComplexity: '`O(N)`',
    commonMistakes: [
      'Mapping `\'a\' -> 0` instead of `\'a\' -> 1` (causes `"a"`, `"aa"`, `"aaa"` to all hash to `0`!).',
    ],
    interviewTips: [
      'Always map characters to `>= 1` (`c - \'a\' + 1`) and use a prime base `B` > alphabet size (e.g. `31` or `131`).',
    ],
    implementations: {},
  },
  {
    topicSlug: 'manachers-algorithm',
    title: 'Manacher’s Algorithm (O(N) Longest Palindromic Substring)',
    definition:
      '**Manacher’s Algorithm** finds the longest palindromic substring centered at every position in linear `O(N)` time.',
    explanation:
      'Insert sentinel `#` between characters (e.g. `"aba"` -> `"^#a#b#a#$"`) so both odd and even palindromes become odd-length palindromes! Track the rightmost palindrome `[C - R, C + R]` centered at `C`. For `i < R`, mirror `i` across `C` (`mirror = 2*C - i`) to initialize `P[i] = min(R - i, P[mirror])`, then expand and update `(C, R)`.',
    realWorldAnalogy:
      'Using symmetry inside a large mirror hall: anything on the right half of a palindrome already mirrors the left half.',
    algorithm:
      '1. Transform `s` into `T` (`^#c0#c1#...#$`).\n2. Maintain `C = 0, R = 0`, `P[0..len(T)-1] = 0`.\n3. For `i = 1 .. len(T) - 2`: init `P[i]` via mirror if `i < R`, expand `while T[i+1+P[i]] == T[i-1-P[i]]`, update `C, R` if `i + P[i] > R`.\n4. Max `P[i]` gives the longest palindrome length.',
    pseudocode: `if i < R: P[i] <- min(R - i, P[2*C - i])
while T[i + 1 + P[i]] == T[i - 1 - P[i]]: P[i]++
if i + P[i] > R: C <- i; R <- i + P[i]`,
    dryRunExample:
      '`"babad"` -> `"^#b#a#b#a#d#$"`: max `P[i] = 3` (`"bab"` / `"aba"`).',
    timeComplexity: '`O(N)` (`R` only moves right up to `2N` times)',
    spaceComplexity: '`O(N)`',
    commonMistakes: [
      'Forgetting boundary sentinels `^` and `$`, requiring tedious bounds checks in the `while` loop.',
    ],
    interviewTips: [
      'In interviews, `O(N^2)` expand-around-center (`O(1)` space) is usually expected first; mention Manacher’s for `O(N)` follow-up!',
    ],
    implementations: {
      c: `// Transform to T with ^,#,$ and run Manacher loop`,
      cpp: `#include <algorithm>\n#include <string>\n#include <vector>\nstd::string longestPalindromeManacher(const std::string& s) {\n    std::string t = "^";\n    for (char c : s) { t.push_back('#'); t.push_back(c); }\n    t += "#$";\n    int n = static_cast<int>(t.size()), C = 0, R = 0, bestLen = 0, bestC = 0;\n    std::vector<int> P(n, 0);\n    for (int i = 1; i < n - 1; ++i) {\n        if (i < R) P[i] = std::min(R - i, P[2 * C - i]);\n        while (t[i + 1 + P[i]] == t[i - 1 - P[i]]) ++P[i];\n        if (i + P[i] > R) { C = i; R = i + P[i]; }\n        if (P[i] > bestLen) { bestLen = P[i]; bestC = i; }\n    }\n    return s.substr((bestC - bestLen) / 2, bestLen);\n}`,
      java: `// Same Manacher transform with ^,#,$ sentinels`,
      python: `def longest_palindrome_manacher(s: str) -> str:\n    t = "^#" + "#".join(s) + "#$"\n    P = [0] * len(t); C = R = best_len = best_c = 0\n    for i in range(1, len(t) - 1):\n        if i < R: P[i] = min(R - i, P[2 * C - i])\n        while t[i + 1 + P[i]] == t[i - 1 - P[i]]: P[i] += 1\n        if i + P[i] > R: C, R = i, i + P[i]\n        if P[i] > best_len: best_len, best_c = P[i], i\n    start = (best_c - best_len) // 2\n    return s[start:start + best_len]`,
    },
  },
  {
    topicSlug: 'suffix-array-basics',
    title: 'Suffix Array & LCP Array Basics',
    definition:
      'A **Suffix Array (`sa`)** of a string `s` of length `N` is an array of integers `0..N-1` giving the starting indices of all suffixes of `s` sorted in lexicographical order.',
    explanation:
      'Because any substring is a prefix of some suffix, binary searching `sa` finds pattern occurrences in `O(m log N)`. Prefix-doubling builds `sa` in `O(N log N)` (or `O(N log^2 N)`). Paired with **Kasai’s `O(N)` LCP array** (`lcp[i] = LCP(sa[i], sa[i+1])`), you can count distinct substrings (`N*(N+1)/2 - sum(lcp)`) and find the longest repeated substring (`max(lcp)`).',
    realWorldAnalogy:
      'An alphabetical index of every ending of a book so you can binary-search any phrase instantly.',
    algorithm:
      'Prefix-Doubling (`k = 1, 2, 4, ...`):\n1. Rank suffixes by first character.\n2. Sort by pair `(rank[i], rank[i + k])` using `O(N log N)` counting/radix sort.\n3. Recompute compressed ranks until all ranks are unique.',
    pseudocode: `// Distinct substrings count = N*(N+1)/2 - sum(LCP)`,
    dryRunExample:
      '`s = "banana"`: suffixes sorted -> `["a", "ana", "anana", "banana", "na", "nana"]` -> `sa = [5, 3, 1, 0, 4, 2]`, `lcp = [1, 3, 0, 0, 2]`.',
    timeComplexity: '`O(N log N)` construction; `O(M log N)` pattern search',
    spaceComplexity: '`O(N)`',
    commonMistakes: [
      'Sorting suffixes naively with `std::sort` on `substr` (`O(N^2 log N)` time and `O(N^2)` memory!).',
    ],
    interviewTips: [
      'Suffix Array uses far less memory than a Suffix Tree while solving the same substring problems.',
    ],
    implementations: {},
  },

  // =========================================================================
  // MODULE 24: ADVANCED DATA STRUCTURES (14 Concepts)
  // =========================================================================
  {
    topicSlug: 'segment-tree-introduction',
    title: 'Segment Tree Introduction',
    definition:
      'A **Segment Tree** is a binary tree stored in a `4 * N` array where each node stores an associative aggregate (sum, min, max, gcd, xor) over a contiguous range `[l, r]`, supporting `O(log N)` range queries and `O(log N)` updates.',
    explanation:
      'The root (`idx = 1`) covers `[0, N - 1]`. Any node covering `[l, r]` splits at `mid = (l + r) / 2` into left child `2*idx` (`[l, mid]`) and right child `2*idx + 1` (`[mid + 1, r]`). Leaves (`l == r`) store `arr[l]`.',
    realWorldAnalogy:
      'A company reporting hierarchy where each team lead caches the total sales of their two sub-teams, allowing instant total queries for any range.',
    algorithm:
      '1. Allocate `tree[4 * N]`.\n2. `build(idx, l, r)`: if `l == r`, `tree[idx] = arr[l]`; else build `2*idx` and `2*idx+1`, then `tree[idx] = merge(tree[2*idx], tree[2*idx+1])`.',
    pseudocode: `build(idx, l, r):
    if l == r: tree[idx] <- arr[l]; return
    mid <- (l + r) // 2
    build(2*idx, l, mid); build(2*idx + 1, mid + 1, r)
    tree[idx] <- tree[2*idx] + tree[2*idx + 1]`,
    dryRunExample:
      '`arr = [1, 3, 5, 7]`: root `[0..3] = 16`, left `[0..1] = 4`, right `[2..3] = 12`.',
    timeComplexity: '`O(N)` build; `O(log N)` query/update',
    spaceComplexity: '`O(4 * N)`',
    commonMistakes: [
      'Allocating only `2 * N` instead of `4 * N` for recursive 1-indexed segment trees (causes out-of-bounds when `N` is not a power of 2!).',
    ],
    interviewTips: [
      'Segment Tree works for **any associative operation** (even non-invertible ones like `min`, `max`, `gcd`), unlike Fenwick Tree.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'range-query-with-segment-tree',
    title: 'Range Query with Segment Tree',
    definition:
      'A Segment Tree range query `query(idx, l, r, ql, qr)` computes the aggregate over `[ql, qr]` in `O(log N)` by combining at most `O(log N)` completely covered segments.',
    explanation:
      'Three cases at node `[l, r]`:\n1. **No overlap (`r < ql || l > qr`):** return identity element (`0` for sum, `+INF` for min).\n2. **Complete overlap (`ql <= l && r <= qr`):** return `tree[idx]` immediately without recursing.\n3. **Partial overlap:** recurse into both children and merge.',
    realWorldAnalogy:
      'Summing monthly totals from quarterly reports: grab whole-quarter totals directly and only drill down into months at the start/end edges.',
    algorithm:
      '1. If `r < ql || l > qr`, return identity.\n2. If `ql <= l && r <= qr`, return `tree[idx]`.\n3. Return `merge(query(left, ql, qr), query(right, ql, qr))`.',
    pseudocode: `query(idx, l, r, ql, qr):
    if r < ql or l > qr: return 0
    if ql <= l and r <= qr: return tree[idx]
    mid <- (l + r) // 2
    return query(2*idx, l, mid, ql, qr) + query(2*idx + 1, mid + 1, r, ql, qr)`,
    dryRunExample:
      'Query `[1..2]` on `[1, 3, 5, 7]`: splits at root `[0..3]` into `[1..1] = 3` and `[2..2] = 5` -> returns `8`.',
    timeComplexity: '`O(log N)` — at most 4 nodes visited per tree level',
    spaceComplexity: '`O(log N)` recursion stack',
    commonMistakes: [
      'Returning `0` as identity for Range Minimum Query (`min`) instead of `+INF`!',
    ],
    interviewTips: [
      'Direct LeetCode problem: **Range Sum Query - Mutable** (LeetCode 307).',
    ],
    implementations: {
      c: `long long querySeg(long long tree[], int idx, int l, int r, int ql, int qr) {\n    if (r < ql || l > qr) return 0;\n    if (ql <= l && r <= qr) return tree[idx];\n    int m = (l + r) / 2;\n    return querySeg(tree, 2*idx, l, m, ql, qr) + querySeg(tree, 2*idx+1, m+1, r, ql, qr);\n}`,
      cpp: `long long querySeg(const std::vector<long long>& tree, int idx, int l, int r, int ql, int qr) {\n    if (r < ql || l > qr) return 0;\n    if (ql <= l && r <= qr) return tree[idx];\n    int m = (l + r) / 2;\n    return querySeg(tree, 2*idx, l, m, ql, qr) + querySeg(tree, 2*idx+1, m+1, r, ql, qr);\n}`,
      java: `long query(long[] tree, int idx, int l, int r, int ql, int qr) {\n    if (r < ql || l > qr) return 0;\n    if (ql <= l && r <= qr) return tree[idx];\n    int m = (l + r) / 2;\n    return query(tree, 2*idx, l, m, ql, qr) + query(tree, 2*idx+1, m+1, r, ql, qr);\n}`,
      python: `def query_seg(tree: list[int], idx: int, l: int, r: int, ql: int, qr: int) -> int:\n    if r < ql or l > qr: return 0\n    if ql <= l and r <= qr: return tree[idx]\n    m = (l + r) // 2\n    return query_seg(tree, 2*idx, l, m, ql, qr) + query_seg(tree, 2*idx+1, m+1, r, ql, qr)`,
    },
  },
  {
    topicSlug: 'segment-tree-point-update',
    title: 'Segment Tree Point Update',
    definition:
      'A **point update** modifies `arr[pos] = val` (or `+= delta`) by walking down the single root-to-leaf path containing `pos` and recomputing ancestor aggregates bottom-up in `O(log N)` time.',
    explanation:
      'At node `[l, r]`: if `l == r`, set `tree[idx] = val`. Otherwise compare `pos <= mid` to descend left (`2*idx`) or right (`2*idx + 1`), and on return update `tree[idx] = merge(tree[2*idx], tree[2*idx + 1])`.',
    realWorldAnalogy:
      'Updating one store’s daily sales and recalculating only the regional and national totals above that store.',
    algorithm:
      '1. If `l == r`: `tree[idx] = val; return`.\n2. `mid = (l + r) / 2`; if `pos <= mid` update left, else update right.\n3. `tree[idx] = tree[2*idx] + tree[2*idx + 1]`.',
    pseudocode: `update(idx, l, r, pos, val):
    if l == r: tree[idx] <- val; return
    mid <- (l + r) // 2
    if pos <= mid: update(2*idx, l, mid, pos, val)
    else: update(2*idx + 1, mid + 1, r, pos, val)
    tree[idx] <- tree[2*idx] + tree[2*idx + 1]`,
    dryRunExample:
      'Update `pos = 2` to `10` in `[1, 3, 5, 7]`: updates leaf `[2..2]=10`, then `[2..3]=17`, then `[0..3]=21`.',
    timeComplexity: '`O(log N)`',
    spaceComplexity: '`O(log N)` stack',
    commonMistakes: [
      'Forgetting to recompute `tree[idx] = merge(...)` after the recursive child call returns.',
    ],
    interviewTips: [
      'Iterative bottom-up Segment Tree (`2 * N` size) does point updates in a tight `while` loop with zero recursion!',
    ],
    implementations: {
      c: `void updateSeg(long long tree[], int idx, int l, int r, int pos, long long val) {\n    if (l == r) { tree[idx] = val; return; }\n    int m = (l + r) / 2;\n    if (pos <= m) updateSeg(tree, 2*idx, l, m, pos, val); else updateSeg(tree, 2*idx+1, m+1, r, pos, val);\n    tree[idx] = tree[2*idx] + tree[2*idx+1];\n}`,
      cpp: `void updateSeg(std::vector<long long>& tree, int idx, int l, int r, int pos, long long val) {\n    if (l == r) { tree[idx] = val; return; }\n    int m = (l + r) / 2;\n    if (pos <= m) updateSeg(tree, 2*idx, l, m, pos, val); else updateSeg(tree, 2*idx+1, m+1, r, pos, val);\n    tree[idx] = tree[2*idx] + tree[2*idx+1];\n}`,
      java: `void update(long[] tree, int idx, int l, int r, int pos, long val) {\n    if (l == r) { tree[idx] = val; return; }\n    int m = (l + r) / 2;\n    if (pos <= m) update(tree, 2*idx, l, m, pos, val); else update(tree, 2*idx+1, m+1, r, pos, val);\n    tree[idx] = tree[2*idx] + tree[2*idx+1];\n}`,
      python: `def update_seg(tree: list[int], idx: int, l: int, r: int, pos: int, val: int) -> None:\n    if l == r: tree[idx] = val; return\n    m = (l + r) // 2\n    if pos <= m: update_seg(tree, 2*idx, l, m, pos, val)\n    else: update_seg(tree, 2*idx+1, m+1, r, pos, val)\n    tree[idx] = tree[2*idx] + tree[2*idx+1]`,
    },
  },
  {
    topicSlug: 'lazy-propagation',
    title: 'Segment Tree with Lazy Propagation (Range Updates)',
    definition:
      '**Lazy Propagation** defers range updates on a Segment Tree by storing pending updates in a `lazy[]` array at covered internal nodes and only pushing them down to children when needed.',
    explanation:
      'Without lazy propagation, updating a range `[ql, qr]` takes `O(N)`. With `lazy[]`, when `[l, r]` is completely inside `[ql, qr]`, apply the update to `tree[idx]` (e.g. `tree[idx] += (r - l + 1) * addVal`) and mark `lazy[idx] += addVal`, stopping recursion in `O(log N)`! Before descending into children in any future `update` or `query`, call `push(idx, l, r)` to propagate `lazy[idx]` down.',
    realWorldAnalogy:
      'Posting a "10% bonus for everyone in Department A" memo at the department level and only updating individual employee ledgers if someone asks about a specific sub-team.',
    algorithm:
      '1. `push(idx, l, r)`: if `lazy[idx] != 0` and `l != r`, apply `lazy[idx]` to `2*idx` and `2*idx+1` (updating both `tree` and `lazy`), then reset `lazy[idx] = 0`.\n2. Call `push(idx, l, r)` before recursing in both `rangeUpdate` and `rangeQuery`.',
    pseudocode: `push(idx, l, r):
    if lazy[idx] != 0 and l != r:
        m <- (l + r) // 2
        apply(2*idx, l, m, lazy[idx])
        apply(2*idx+1, m+1, r, lazy[idx])
        lazy[idx] <- 0`,
    dryRunExample:
      'Range-add `+5` on `[0..999]` updates only the root node in `O(1)` (`lazy[1] = 5`), deferring child updates until queried.',
    timeComplexity: '`O(log N)` for both range updates and range queries',
    spaceComplexity: '`O(4 * N)` for `tree` + `O(4 * N)` for `lazy`',
    commonMistakes: [
      'Forgetting to multiply `addVal` by `(r - l + 1)` when updating range **sum**!',
      'Using `lazy[idx] = val` instead of `+=` for range-add (use `=` for range-assign with a `hasLazy[]` boolean).',
    ],
    interviewTips: [
      'Always write a dedicated `push(idx, l, r)` helper and call it at the start of partial-overlap cases.',
    ],
    implementations: {
      c: `// Allocate tree[4*N] and lazy[4*N]; push(idx, l, r) before descending`,
      cpp: `void push(std::vector<long long>& tree, std::vector<long long>& lazy, int idx, int l, int r) {\n    if (lazy[idx] == 0 || l == r) return;\n    int m = (l + r) / 2;\n    tree[2*idx] += (m - l + 1) * lazy[idx]; lazy[2*idx] += lazy[idx];\n    tree[2*idx+1] += (r - m) * lazy[idx]; lazy[2*idx+1] += lazy[idx];\n    lazy[idx] = 0;\n}`,
      java: `// Same push(idx, l, r) helper before recursing in rangeUpdate & rangeQuery`,
      python: `def push(tree: list[int], lazy: list[int], idx: int, l: int, r: int) -> None:\n    if lazy[idx] == 0 or l == r: return\n    m = (l + r) // 2\n    tree[2*idx] += (m - l + 1) * lazy[idx]; lazy[2*idx] += lazy[idx]\n    tree[2*idx+1] += (r - m) * lazy[idx]; lazy[2*idx+1] += lazy[idx]\n    lazy[idx] = 0`,
    },
  },
  {
    topicSlug: 'fenwick-tree-bit',
    title: 'Fenwick Tree (Binary Indexed Tree / BIT)',
    definition:
      'A **Fenwick Tree (BIT)** is a compact `O(N)` array structure that supports point updates and prefix-sum queries in `O(log N)` time using lowest-set-bit arithmetic (`i & -i`).',
    explanation:
      'Using **1-based indexing**, `bit[i]` stores the sum of the range ending at `i` of length `lsb(i) = i & (-i)`.\n- `add(i, delta)`: walk upward `for (; i <= n; i += i & -i) bit[i] += delta;`.\n- `prefixSum(i)`: walk downward `for (; i > 0; i -= i & -i) sum += bit[i];`.\nRange sum `[l, r]` is simply `prefixSum(r) - prefixSum(l - 1)`.',
    realWorldAnalogy:
      'Storing pre-aggregated powers-of-two blocks so any prefix `[1..i]` can be assembled in at most `log2(N)` jumps.',
    algorithm:
      '1. `add(i, delta)`: `while i <= n: bit[i] += delta; i += i & -i`.\n2. `query(i)`: `while i > 0: s += bit[i]; i -= i & -i`.',
    pseudocode: `add(i, delta):
    while i <= n:
        bit[i] <- bit[i] + delta
        i <- i + (i & -i)
query(i):
    s <- 0
    while i > 0:
        s <- s + bit[i]
        i <- i - (i & -i)
    return s`,
    dryRunExample:
      '`query(6)` (`110_2`): reads `bit[6]` (len 2: `[5..6]`) + `bit[4]` (len 4: `[1..4]`).',
    timeComplexity: '`O(log N)` update and prefix query; `O(N)` build',
    spaceComplexity: '`O(N)` (4x smaller and much faster constant than Segment Tree!)',
    commonMistakes: [
      'Passing `i = 0` into `add(0, delta)` (infinite loop because `0 & -0 == 0`! Always 1-index Fenwick Trees!).',
    ],
    interviewTips: [
      'Fenwick Tree is the cleanest way to solve **Count of Smaller Numbers After Self** and **Inversion Count**!',
    ],
    implementations: {
      c: `void bitAdd(long long bit[], int n, int i, long long d) { for (; i <= n; i += i & -i) bit[i] += d; }\nlong long bitSum(const long long bit[], int i) { long long s = 0; for (; i > 0; i -= i & -i) s += bit[i]; return s; }`,
      cpp: `#include <vector>\nstruct Fenwick {\n    int n; std::vector<long long> bit;\n    Fenwick(int n) : n(n), bit(n + 1, 0) {}\n    void add(int i, long long d) { for (; i <= n; i += i & -i) bit[i] += d; }\n    long long sum(int i) const { long long s = 0; for (; i > 0; i -= i & -i) s += bit[i]; return s; }\n    long long rangeSum(int l, int r) const { return sum(r) - sum(l - 1); }\n};`,
      java: `public class FenwickTree {\n    long[] bit; int n;\n    public FenwickTree(int n) { this.n = n; bit = new long[n + 1]; }\n    public void add(int i, long d) { for (; i <= n; i += i & -i) bit[i] += d; }\n    public long sum(int i) { long s = 0; for (; i > 0; i -= i & -i) s += bit[i]; return s; }\n}`,
      python: `class FenwickTree:\n    def __init__(self, n: int):\n        self.n, self.bit = n, [0] * (n + 1)\n    def add(self, i: int, d: int) -> None:\n        while i <= self.n: self.bit[i] += d; i += i & -i\n    def sum(self, i: int) -> int:\n        s = 0\n        while i > 0: s += self.bit[i]; i -= i & -i\n        return s`,
    },
  },
  {
    topicSlug: 'sparse-table',
    title: 'Sparse Table (O(1) Static Range Minimum/GCD Queries)',
    definition:
      'A **Sparse Table** precomputes answers for all power-of-2 length intervals `[i, i + 2^k - 1]` in `O(N log N)` time to answer **idempotent** static range queries (`min`, `max`, `gcd`, `AND`, `OR`) in **`O(1)` time**.',
    explanation:
      'Because `min(A, B)` is idempotent (overlapping intervals don’t double-count!), any range `[L, R]` of length `len = R - L + 1` with `k = floor(log2(len))` is covered by two overlapping blocks of size `2^k`: `min(st[k][L], st[k][R - (1 << k) + 1])`. Note: arrays must be **static** (no updates).',
    realWorldAnalogy:
      'Precomputing power-of-2 rulers (`1, 2, 4, 8...`) so any interval `[L, R]` is measured by overlapping two largest fitting rulers.',
    algorithm:
      '1. `st[0][i] = arr[i]`.\n2. For `k = 1 .. K`, `i = 0 .. N - (1 << k)`: `st[k][i] = min(st[k-1][i], st[k-1][i + (1 << (k-1))])`.\n3. Query `[L, R]`: `k = log2[R - L + 1]`, return `min(st[k][L], st[k][R - (1 << k) + 1])`.',
    pseudocode: `k <- floor(log2(R - L + 1))
return min(st[k][L], st[k][R - (1 << k) + 1])`,
    dryRunExample:
      'Query `[1, 6]` (`len = 6`, `k = 2`, `2^k = 4`): `min(st[2][1] /*[1..4]*/, st[2][3] /*[3..6]*/)`.',
    timeComplexity: '`O(N log N)` build; `O(1)` query for idempotent ops (`O(log N)` for sum)',
    spaceComplexity: '`O(N log N)`',
    commonMistakes: [
      'Using `O(1)` overlapping Sparse Table query for `sum` (double-counts the overlap!).',
    ],
    interviewTips: [
      'Sparse Table + Euler Tour reduces **LCA** to `O(N log N)` preprocess and **`O(1)` per query**!',
    ],
    implementations: {
      c: `// st[K][N], precompute lg2[N+1]`,
      cpp: `#include <algorithm>\n#include <vector>\nstruct SparseTable {\n    std::vector<std::vector<int>> st; std::vector<int> lg;\n    SparseTable(const std::vector<int>& a) {\n        int n = static_cast<int>(a.size()); lg.assign(n + 1, 0);\n        for (int i = 2; i <= n; ++i) lg[i] = lg[i / 2] + 1;\n        int K = lg[n] + 1; st.assign(K, std::vector<int>(n)); st[0] = a;\n        for (int k = 1; k < K; ++k)\n            for (int i = 0; i + (1 << k) <= n; ++i) st[k][i] = std::min(st[k-1][i], st[k-1][i + (1 << (k-1))]);\n    }\n    int query(int L, int R) const { int k = lg[R - L + 1]; return std::min(st[k][L], st[k][R - (1 << k) + 1]); }\n};`,
      java: `// Same O(N log N) build and O(1) min(st[k][L], st[k][R - (1<<k) + 1]) query`,
      python: `class SparseTable:\n    def __init__(self, a: list[int]):\n        n = len(a); self.lg = [0] * (n + 1)\n        for i in range(2, n + 1): self.lg[i] = self.lg[i >> 1] + 1\n        K = self.lg[n] + 1; self.st = [a[:]]\n        for k in range(1, K):\n            prev = self.st[k - 1]\n            self.st.append([min(prev[i], prev[i + (1 << (k - 1))]) for i in range(n - (1 << k) + 1)])\n    def query(self, L: int, R: int) -> int:\n        k = self.lg[R - L + 1]\n        return min(self.st[k][L], self.st[k][R - (1 << k) + 1])`,
    },
  },
  {
    topicSlug: 'coordinate-compression',
    title: 'Coordinate Compression',
    definition:
      '**Coordinate compression** maps a sparse set of up to `N` large/negative values (e.g. `[-10^9, 10^9]`) into dense ranks `[0 .. U - 1]` while preserving relative ordering.',
    explanation:
      'Fenwick Trees and Segment Trees cannot index `10^9`. Copy all values into `sortedUnique`, sort & deduplicate, and replace each `x` with `lower_bound(sortedUnique, x)` (plus `+ 1` for 1-indexed Fenwick Tree).',
    realWorldAnalogy:
      'Replacing raw race times `[12.4s, 980.1s, 5000.3s]` with finishing ranks `[1, 2, 3]`.',
    algorithm:
      '1. Copy array to `vals`, sort, and deduplicate.\n2. Map each `x` to `indexOf(x)` via binary search (`O(log N)`).',
    pseudocode: `vals <- sorted(unique(arr))
for x in arr: rank(x) <- lower_bound(vals, x)`,
    dryRunExample:
      '`[100, -50, 100, 999999]` -> `vals = [-50, 100, 999999]` -> compressed `[1, 0, 1, 2]`.',
    timeComplexity: '`O(N log N)`',
    spaceComplexity: '`O(N)`',
    commonMistakes: [
      'Forgetting to include **query** coordinates (like `x - upper`, `nums[i]`) in `vals` before compressing!',
    ],
    interviewTips: [
      'Essential prerequisite before using a Fenwick Tree on **Count of Smaller Numbers After Self** or **Reverse Pairs**.',
    ],
    implementations: {
      c: `// qsort copy, deduplicate in-place, bsearch each element`,
      cpp: `#include <algorithm>\n#include <vector>\nstd::vector<int> compress(const std::vector<int>& a) {\n    std::vector<int> vals = a; std::sort(vals.begin(), vals.end());\n    vals.erase(std::unique(vals.begin(), vals.end()), vals.end());\n    std::vector<int> res(a.size());\n    for (size_t i = 0; i < a.size(); ++i) res[i] = static_cast<int>(std::lower_bound(vals.begin(), vals.end(), a[i]) - vals.begin());\n    return res;\n}`,
      java: `import java.util.*;\npublic class CoordCompress {\n    public static int[] compress(int[] a) {\n        int[] vals = Arrays.stream(a).distinct().sorted().toArray();\n        int[] res = new int[a.length];\n        for (int i = 0; i < a.length; i++) res[i] = Arrays.binarySearch(vals, a[i]);\n        return res;\n    }\n}`,
      python: `def compress(a: list[int]) -> list[int]:\n    rank = {v: i for i, v in enumerate(sorted(set(a)))}\n    return [rank[x] for x in a]`,
    },
  },
  {
    topicSlug: 'ordered-set-map',
    title: 'Ordered Set / Map (Order-Statistic Tree)',
    definition:
      'An **Ordered Set** (or Order-Statistic Tree) is a balanced BST augmented with subtree sizes so it supports `insert`, `erase`, **`find_by_order(k)`** (`k`-th smallest), and **`order_of_key(x)`** (count of elements `< x`) in `O(log N)` time.',
    explanation:
      'In C++ GCC, `pb_ds` `tree<..., rb_tree_tag, tree_order_statistics_node_update>` provides `find_by_order` and `order_of_key` out of the box. In Java/Python interviews where PBDS isn’t available, use **Coordinate Compression + Fenwick Tree** or a balanced BST / `SortedList` (`sortedcontainers`).',
    realWorldAnalogy:
      'A sorted leaderboard where you can both look up "who is rank #5?" and "how many players scored below 1200?" in `O(log N)`.',
    algorithm:
      'Augment each BST node with `size = 1 + size(left) + size(right)`:\n- `kth(k)`: compare `k` against `size(left)`.\n- `rank(x)`: accumulate `size(left) + 1` whenever descending right.',
    pseudocode: `// C++ PBDS:
// order_of_key(x)  -> count of elements strictly < x
// find_by_order(k) -> iterator to k-th smallest (0-indexed)`,
    dryRunExample:
      'Set `{10, 20, 30, 40}`: `order_of_key(25) = 2`, `find_by_order(2) = 30`.',
    timeComplexity: '`O(log N)` per operation',
    spaceComplexity: '`O(N)`',
    commonMistakes: [
      'Using `less<int>` in PBDS when duplicates exist (must use `less_equal<int>` or `pair<int, int>` with unique ID!).',
    ],
    interviewTips: [
      'When using `less_equal<int>` in C++ PBDS, `erase` by value breaks—prefer `pair<int, int>` `(val, uniqueId)` with `less<pair<int,int>>`!',
    ],
    implementations: {},
  },
  {
    topicSlug: 'square-root-decomposition',
    title: 'Square Root Decomposition',
    definition:
      '**Square Root Decomposition** partitions an array of size `N` into `ceil(N / B)` blocks of size `B = floor(sqrt(N))`, caching a precomputed aggregate per block so updates take `O(1)` and range queries take `O(sqrt(N))`.',
    explanation:
      'To query `[L, R]`: sum individual elements in the partial left block (`L` to end of `block(L)`), add precomputed `blockSum[b]` for every full middle block, and sum individual elements in the partial right block. Watch the edge case where `L` and `R` lie in the **same** block!',
    realWorldAnalogy:
      'Summing pages `15..83` of a 100-page ledger by reading pages `15..19`, adding chapter totals for `20..79`, and reading `80..83`.',
    algorithm:
      '1. `B = floor(sqrt(N))`, `block[i / B] += arr[i]`.\n2. Update `(pos, val)`: `block[pos / B] += val - arr[pos]; arr[pos] = val`.\n3. Query `(L, R)`: if `L / B == R / B`, loop `L..R`; else loop partial left, full blocks, partial right.',
    pseudocode: `if L // B == R // B: sum arr[L..R]
else:
    sum left partial, full middle blocks[b], right partial`,
    dryRunExample:
      '`N = 10^5`, `B = 316`: worst-case query touches `< 316 + 316 + 316 = 948` operations.',
    timeComplexity: '`O(1)` point update, `O(sqrt(N))` range query',
    spaceComplexity: '`O(N)`',
    commonMistakes: [
      'Double-counting when `L` and `R` are in the same block without an explicit `L / B == R / B` check.',
    ],
    interviewTips: [
      'Sqrt Decomposition is simpler to write than Segment Tree when `N <= 10^5` and `O(N sqrt N)` fits within time limits.',
    ],
    implementations: {
      c: `// B = sqrt(N); handle same-block L/B == R/B separately`,
      cpp: `#include <cmath>\n#include <vector>\nstruct SqrtDecomp {\n    int B; std::vector<int> a; std::vector<long long> blk;\n    SqrtDecomp(const std::vector<int>& arr) : B(std::max(1, static_cast<int>(std::sqrt(arr.size())))), a(arr), blk(arr.size() / B + 2, 0) {\n        for (size_t i = 0; i < a.size(); ++i) blk[i / B] += a[i];\n    }\n    void update(int idx, int val) { blk[idx / B] += val - a[idx]; a[idx] = val; }\n    long long query(int l, int r) const {\n        long long s = 0;\n        if (l / B == r / B) { for (int i = l; i <= r; ++i) s += a[i]; return s; }\n        while (l % B != 0) s += a[l++];\n        while (l + B - 1 <= r) { s += blk[l / B]; l += B; }\n        while (l <= r) s += a[l++];\n        return s;\n    }\n};`,
      java: `// Same B = (int)Math.sqrt(n) block array`,
      python: `import math\nclass SqrtDecomp:\n    def __init__(self, a: list[int]):\n        self.B = max(1, math.isqrt(len(a))); self.a = a[:]\n        self.blk = [0] * (len(a) // self.B + 2)\n        for i, v in enumerate(a): self.blk[i // self.B] += v\n    def query(self, l: int, r: int) -> int:\n        s, B = 0, self.B\n        while l <= r and l % B != 0: s += self.a[l]; l += 1\n        while l + B - 1 <= r: s += self.blk[l // B]; l += B\n        while l <= r: s += self.a[l]; l += 1\n        return s`,
    },
  },
  {
    topicSlug: 'mos-algorithm',
    title: 'Mo’s Algorithm (Offline Range Queries)',
    definition:
      '**Mo’s Algorithm** answers `Q` **offline** static range queries `[L, R]` (e.g. count of distinct elements in `[L, R]`) in `O((N + Q) * sqrt(N))` time by sorting queries in block order and maintaining a sliding `[curL, curR]` window.',
    explanation:
      'Sort queries primarily by `L / B` (where `B = sqrt(N)`) and secondarily by `R` (using alternating ascending/descending `R` order—the Hilbert/snake optimization—cuts constant factor in half!). Move `curL` and `curR` one step at a time using `add(idx)` and `remove(idx)` in `O(1)`.',
    realWorldAnalogy:
      'Sorting museum tour stops by wing (`L / B`) and aisle (`R`) so your walking distance between consecutive stops is minimized.',
    algorithm:
      '1. Sort queries by `(q.L / B, (q.L / B) & 1 ? -q.R : q.R)`.\n2. Maintain `curL = 0, curR = -1`.\n3. For each query `[L, R]`:\n   - Expand first (`while curL > L: add(--curL)`, `while curR < R: add(++curR)`)\n   - Then shrink (`while curL < L: remove(curL++)`, `while curR > R: remove(curR--)`)\n   - Record `ans[q.id]`.',
    pseudocode: `sort queries by (L // B, R)
curL <- 0, curR <- -1
for (L, R, id) in queries:
    while curL > L: curL--; add(curL)
    while curR < R: curR++; add(curR)
    while curL < L: remove(curL); curL++
    while curR > R: remove(curR); curR--
    ans[id] <- currentAnswer`,
    dryRunExample:
      'Counting distinct elements in `[L, R]`: `add(i)` increments `distinct` when `++freq[a[i]] == 1`; `remove(i)` decrements `distinct` when `--freq[a[i]] == 0`.',
    timeComplexity: '`O((N + Q) * sqrt(N))`',
    spaceComplexity: '`O(N + Q)`',
    commonMistakes: [
      'Shrinking `[curL, curR]` before expanding (can make `curL > curR + 1` and produce negative frequencies!).',
    ],
    interviewTips: [
      'Always **expand before shrinking** in Mo’s algorithm!',
    ],
    implementations: {},
  },
  {
    topicSlug: 'binary-lifting',
    title: 'Binary Lifting on Trees',
    definition:
      '**Binary Lifting** precomputes `up[u][k]`—the `2^k`-th ancestor of node `u`—in `O(N log N)` time so jumping `k` steps up a tree takes `O(log N)` time.',
    explanation:
      'Base: `up[u][0] = parent[u]` (and `up[root][0] = root` or `-1`). Transition: `up[u][k] = up[ up[u][k - 1] ][k - 1]` (a jump of `2^k` is two jumps of `2^(k-1)`). To find the `K`-th ancestor of `u`, iterate bit `b` from `LOG - 1` down to `0` and jump `u = up[u][b]` whenever `(K >> b) & 1`.',
    realWorldAnalogy:
      'Express highway exits spaced at `1, 2, 4, 8, 16...` stops apart so any distance `K` is reached in at most `log2(K)` jumps.',
    algorithm:
      '1. Run DFS/BFS to compute `depth[u]` and `up[u][0] = parent[u]`.\n2. For `k = 1 .. LOG - 1`, `u = 0 .. N - 1`: `up[u][k] = (up[u][k-1] == -1) ? -1 : up[up[u][k-1]][k-1]`.\n3. `kthAncestor(u, K)`: loop `b = 0 .. LOG - 1`, if `(K >> b) & 1`, `u = up[u][b]`.',
    pseudocode: `for k from 1 to LOG - 1:
    for u from 0 to N - 1:
        up[u][k] <- up[ up[u][k - 1] ][k - 1]`,
    dryRunExample:
      'Jumping `5` (`101_2`) ancestors up from `u`: jump `up[u][0]` (1 step), then `up[...][2]` (4 steps) -> 2 hops!',
    timeComplexity: '`O(N log N)` preprocess; `O(log N)` per `kthAncestor` query',
    spaceComplexity: '`O(N log N)`',
    commonMistakes: [
      'Putting `u` in the outer loop and `k` in the inner loop during preprocessing (reads uncomputed `up[...][k-1]`!).',
    ],
    interviewTips: [
      'Direct LeetCode problem: **Kth Ancestor of a Tree Node** (LeetCode 1483).',
    ],
    implementations: {
      c: `// int up[N][20]; fill k outer, u inner`,
      cpp: `#include <vector>\nstruct BinaryLifting {\n    int LOG; std::vector<std::vector<int>> up;\n    BinaryLifting(int n, const std::vector<int>& parent) : LOG(20), up(n, std::vector<int>(LOG, -1)) {\n        for (int u = 0; u < n; ++u) up[u][0] = parent[u];\n        for (int k = 1; k < LOG; ++k)\n            for (int u = 0; u < n; ++u)\n                if (up[u][k - 1] != -1) up[u][k] = up[up[u][k - 1]][k - 1];\n    }\n    int kthAncestor(int u, int k) const {\n        for (int b = 0; b < LOG && u != -1; ++b) if ((k >> b) & 1) u = up[u][b];\n        return u;\n    }\n};`,
      java: `// Same up[n][LOG] table with k outer loop, u inner loop`,
      python: `class TreeAncestor:\n    def __init__(self, n: int, parent: list[int]):\n        self.LOG = 17\n        self.up = [[-1] * self.LOG for _ in range(n)]\n        for u in range(n): self.up[u][0] = parent[u]\n        for k in range(1, self.LOG):\n            for u in range(n):\n                p = self.up[u][k - 1]\n                if p != -1: self.up[u][k] = self.up[p][k - 1]\n    def get_kth_ancestor(self, node: int, k: int) -> int:\n        for b in range(self.LOG):\n            if (k >> b) & 1:\n                node = self.up[node][b]\n                if node == -1: break\n        return node`,
    },
  },
  {
    topicSlug: 'lca-with-binary-lifting',
    title: 'Lowest Common Ancestor (LCA) with Binary Lifting',
    definition:
      'Using the Binary Lifting `up[u][k]` table and `depth[u]`, **LCA(u, v)** is answered in `O(log N)` time per query after `O(N log N)` preprocessing.',
    explanation:
      '1. Ensure `depth[u] >= depth[v]` (swap if not) and lift `u` up by `depth[u] - depth[v]` so both sit at the same depth.\n2. If `u == v`, return `u`.\n3. Loop `k` from `LOG - 1` down to `0`: whenever `up[u][k] != up[v][k]`, lift both `u = up[u][k]` and `v = up[v][k]`.\n4. Now `u` and `v` sit right below their LCA, so return `up[u][0]`.',
    realWorldAnalogy:
      'Two descendants climbing up their family tree at matching heights using express jumps until just before they meet at their common ancestor.',
    algorithm:
      '1. Equalize depths by lifting deeper node.\n2. If `u == v`, return `u`.\n3. Lift both together while `up[u][k] != up[v][k]`.\n4. Return `up[u][0]`.',
    pseudocode: `if depth[u] < depth[v]: swap(u, v)
u <- kthAncestor(u, depth[u] - depth[v])
if u == v: return u
for k from LOG - 1 down to 0:
    if up[u][k] != up[v][k]:
        u <- up[u][k]; v <- up[v][k]
return up[u][0]`,
    dryRunExample:
      'Tree distance between `u` and `v` = `depth[u] + depth[v] - 2 * depth[LCA(u, v)]` in `O(log N)`!',
    timeComplexity: '`O(N log N)` preprocess; `O(log N)` per LCA query',
    spaceComplexity: '`O(N log N)`',
    commonMistakes: [
      'Looping `k` upward `0 .. LOG - 1` instead of downward `LOG - 1 .. 0` (must try largest powers of 2 first like binary search!).',
    ],
    interviewTips: [
      'Binary Lifting LCA also computes **path max/min edge weight** between `u` and `v` in `O(log N)` by maintaining `maxEdge[u][k]`!',
    ],
    implementations: {
      c: `// Lift deeper node to same depth, then loop k = LOG-1 down to 0`,
      cpp: `int lca(int u, int v, const std::vector<int>& depth, const std::vector<std::vector<int>>& up, int LOG) {\n    if (depth[u] < depth[v]) std::swap(u, v);\n    int diff = depth[u] - depth[v];\n    for (int b = 0; b < LOG; ++b) if ((diff >> b) & 1) u = up[u][b];\n    if (u == v) return u;\n    for (int k = LOG - 1; k >= 0; --k) if (up[u][k] != up[v][k]) { u = up[u][k]; v = up[v][k]; }\n    return up[u][0];\n}`,
      java: `// Same depth-equalize + downward k loop returning up[u][0]`,
      python: `def lca_lift(u: int, v: int, depth: list[int], up: list[list[int]]) -> int:\n    if depth[u] < depth[v]: u, v = v, u\n    diff = depth[u] - depth[v]; LOG = len(up[0])\n    for b in range(LOG):\n        if (diff >> b) & 1: u = up[u][b]\n    if u == v: return u\n    for k in range(LOG - 1, -1, -1):\n        if up[u][k] != up[v][k]: u, v = up[u][k], up[v][k]\n    return up[u][0]`,
    },
  },
  {
    topicSlug: 'advanced-range-queries',
    title: 'Advanced Range Queries Selection Guide',
    definition:
      'Choosing the right range-query data structure depends on four axes: **static vs. mutable**, **point vs. range updates**, **invertible vs. idempotent operation**, and **online vs. offline**.',
    explanation:
      '| Data Structure | Update | Query | Best For |\n|---|---|---|---|\n| Prefix Sum | None (static) | `O(1)` | Static range sum / XOR |\n| Sparse Table | None (static) | `O(1)` | Static RMQ / GCD |\n| Fenwick Tree (BIT) | `O(log N)` point | `O(log N)` | Dynamic prefix/range sum, inversions |\n| Segment Tree | `O(log N)` point/range | `O(log N)` | General RMQ, lazy range updates, custom merge |\n| Mo’s Algorithm | None (offline) | `O(sqrt(N))` | Offline distinct count / mode queries |',
    realWorldAnalogy:
      'Selecting the right tool from a toolbox: a tape measure (Prefix Sum) for static lengths vs. a digital laser (Segment Tree) for changing intervals.',
    algorithm:
      'Decision Checklist:\n1. Static + Sum -> Prefix Sum (`O(1)`).\n2. Static + Min/Max/GCD -> Sparse Table (`O(1)`).\n3. Point Update + Sum/XOR -> Fenwick Tree (`O(log N)`).\n4. Range Update or Non-Invertible Op -> Segment Tree + Lazy (`O(log N)`).\n5. Offline Non-Mergeable (e.g., distinct count) -> Mo’s Algorithm.',
    pseudocode: `// Pick the simplest structure that meets N <= 10^5..10^6 constraints`,
    dryRunExample:
      'For `N = 2 * 10^5` static RMQ queries, Sparse Table answers in `O(1)` without recursion overhead.',
    timeComplexity: '`O(1)` to `O(sqrt(N))` per query',
    spaceComplexity: '`O(N)` to `O(N log N)`',
    commonMistakes: [
      'Using Segment Tree with Lazy Propagation when a 10-line Prefix Sum or Fenwick Tree suffices.',
    ],
    interviewTips: [
      'Always state **why** you picked Fenwick vs Segment Tree vs Sparse Table before coding.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'competitive-programming-patterns',
    title: 'Competitive Programming & Interview Problem-Solving Patterns',
    definition:
      'Mastering **constraint-driven pattern recognition** maps input sizes `N` and problem structure directly to the required time complexity and algorithm family.',
    explanation:
      '| Constraint (`N`) | Target Complexity | Likely Algorithms / Structures |\n|---|---|---|\n| `N <= 12` | `O(N!)` | Permutations, Backtracking |\n| `N <= 20` | `O(2^N * N)` | Bitmask DP, Meet-in-the-Middle (`N <= 40`) |\n| `N <= 500` | `O(N^3)` | Floyd-Warshall, Interval DP (MCM) |\n| `N <= 5000` | `O(N^2)` | 2D DP, Two-pointer/pair loops |\n| `N <= 10^5` | `O(N log N)` / `O(N sqrt N)` | Sorting, Heap, Binary Search, SegTree/BIT, Mo’s |\n| `N <= 10^6` | `O(N)` | Sliding Window, Two Pointers, KMP/Z, Linear DP |\n| `N <= 10^18` | `O(log N)` | Binary Search on Answer, Matrix Exp, Digit DP |',
    realWorldAnalogy:
      'A chess grandmaster recognizing opening board patterns immediately rather than calculating every move from scratch.',
    algorithm:
      '1. Read constraints (`N`, value bounds, time limit `~10^8` ops/sec).\n2. Narrow down feasible Big-O complexity.\n3. Match structure (Monotonic -> Binary Search/Window; Optimal Substructure -> DP; Connectivity -> DSU/BFS; Prefix -> Trie/BIT).',
    pseudocode: `// 1 second ~ 10^8 simple operations in C++ / ~10^7 in Python`,
    dryRunExample:
      'Seeing `N <= 20` with subset cost minimization immediately points to `O(2^N * N)` Bitmask DP.',
    timeComplexity: 'Constraint-driven selection',
    spaceComplexity: 'Typically `<= 256 MB` (`~6 * 10^7` ints)',
    commonMistakes: [
      'Writing an `O(N^2)` algorithm when `N = 10^5` (`10^10` ops -> Time Limit Exceeded!).',
    ],
    interviewTips: [
      'Always check constraints first—they are the biggest hint in both competitive programming and coding interviews.',
    ],
    implementations: {},
  },
];

export default modules22to24Notes;
