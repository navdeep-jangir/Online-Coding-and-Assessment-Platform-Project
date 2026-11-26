// Rich original learning notes for Module 16 (Backtracking, 11 concepts) & Module 17 Part 1 (Trees, 16 concepts)

const modules16to17Notes = [
  // =========================================================================
  // MODULE 16: BACKTRACKING (11 Concepts)
  // =========================================================================
  {
    topicSlug: 'decision-tree-concept',
    title: 'Decision Tree (State-Space Tree) in Backtracking',
    definition:
      'A decision tree (or state-space tree) is a conceptual tree representing every partial choice sequence during recursive search: internal nodes are partial states, edges are individual decisions, and leaves are complete candidate solutions or dead ends.',
    explanation:
      'Before writing a single line of backtracking code, drawing the decision tree clarifies the branching factor `b`, tree depth `d`, base case, and pruning opportunities. Total work is bounded by `O(b^d)`—and pruning invalid branches early collapses entire subtrees.',
    realWorldAnalogy:
      'A "choose your own adventure" book mapped out as a flowchart: every fork is a choice, dead ends send you back to the last fork, and starred endings are valid solutions.',
    algorithm:
      '1. Identify what each level of the tree decides (e.g., index `i`, cell `(r, c)`, or row `r`).\n2. Identify the branches from a node (e.g., include/exclude, or try `1..9`).\n3. Define the leaf/base condition.\n4. Identify constraint checks to prune invalid branches before recursing.',
    pseudocode: `// Decision tree DFS shape:
solve(state):
    if isLeaf(state):
        record(state)
        return
    for choice in validChoices(state):
        apply(choice)
        solve(nextState)
        undo(choice)`,
    dryRunExample:
      'Decision tree for subsets of `[1, 2]`:\n- Level 0 (decide `1`): left = `[]`, right = `[1]`\n- Level 1 (decide `2`): leaves = `[]`, `[2]`, `[1]`, `[1, 2]`.',
    timeComplexity: 'O(b^d * work_per_node) in the worst case without pruning',
    spaceComplexity: 'O(d) recursion stack depth',
    commonMistakes: [
      'Confusing branching factor with depth, leading to wrong complexity estimates.',
      'Recursing into invalid states instead of pruning at the parent node.',
    ],
    interviewTips: [
      'Sketch the first 2 levels of the decision tree on the whiteboard before coding—it immediately shows whether you need a `startIndex`, a `used[]` array, or both.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'choose-explore-unchoose',
    title: 'The Choose–Explore–Unchoose Pattern',
    definition:
      'Choose–Explore–Unchoose is the core backtracking template where a shared mutable state (`path`, `board`, `used[]`) is modified before recursing and restored identically after the recursive call returns.',
    explanation:
      'Passing fresh copies of `path` or `board` at every recursive call wastes `O(n)` memory and time per node. Instead, mutating a single shared structure (`push` -> recurse -> `pop`) keeps auxiliary memory at `O(depth)`. Unchoosing is mandatory so sibling branches see the exact state the parent had.',
    realWorldAnalogy:
      'Trying on outfits in a fitting room: put on a jacket (`choose`), check the mirror (`explore`), take the jacket off (`unchoose`) before trying the next one.',
    algorithm:
      '1. If base condition is met, save a **copy** of `path` into `result` and return.\n2. For each candidate `c`:\n   - **Choose:** append `c` to `path` (and mark `used[c] = true` if needed).\n   - **Explore:** call `backtrack(nextState)`.\n   - **Unchoose:** remove `c` from `path` (and reset `used[c] = false`).',
    pseudocode: `backtrack(path, choices):
    if isGoal(path):
        result.append(copy(path))
        return
    for c in choices:
        if not isValid(c): continue
        path.push(c)          // Choose
        backtrack(path, ...)  // Explore
        path.pop()            // Unchoose`,
    dryRunExample:
      'Choosing 2-element sequences from `[1, 2]`:\n- Choose `1` -> Choose `2` -> `[1,2]` -> Pop `2` -> Pop `1`\n- Choose `2` -> Choose `1` -> `[2,1]` -> Pop `1` -> Pop `2`.',
    timeComplexity: 'Depends on branching and pruning; O(1) overhead per choose/unchoose',
    spaceComplexity: 'O(d) for shared path + recursion stack',
    commonMistakes: [
      'Appending `path` directly to `result` without copying (all entries end up empty `[]` after backtracking finishes!).',
      'Forgetting to undo a `used[]` flag or board cell when returning early.',
    ],
    interviewTips: [
      'Always emphasize `new ArrayList<>(path)` in Java or `path[:]` in Python when saving a solution.',
    ],
    implementations: {
      c: `#include <stdio.h>\n\nvoid generateBinary(int n, int idx, char buf[]) {\n    if (idx == n) { buf[n] = '\\0'; printf("%s\\n", buf); return; }\n    buf[idx] = '0'; generateBinary(n, idx + 1, buf);\n    buf[idx] = '1'; generateBinary(n, idx + 1, buf);\n}`,
      cpp: `#include <string>\n#include <vector>\nusing namespace std;\n\nvoid genBinary(int n, string& path, vector<string>& out) {\n    if (static_cast<int>(path.size()) == n) { out.push_back(path); return; }\n    for (char c : {'0', '1'}) {\n        path.push_back(c);\n        genBinary(n, path, out);\n        path.pop_back();\n    }\n}`,
      java: `import java.util.*;\n\npublic class ChooseExploreUnchoose {\n    static void genBinary(int n, StringBuilder path, List<String> out) {\n        if (path.length() == n) { out.add(path.toString()); return; }\n        for (char c : new char[]{'0', '1'}) {\n            path.append(c);\n            genBinary(n, path, out);\n            path.deleteCharAt(path.length() - 1);\n        }\n    }\n}`,
      python: `def gen_binary(n: int) -> list[str]:\n    res, path = [], []\n    def backtrack() -> None:\n        if len(path) == n:\n            res.append("".join(path))\n            return\n        for c in ("0", "1"):\n            path.append(c)\n            backtrack()\n            path.pop()\n    backtrack()\n    return res`,
    },
  },
  {
    topicSlug: 'generate-subsets',
    title: 'Generate All Subsets (Backtracking)',
    definition:
      'Given an array `nums` of unique integers, return all `2^n` possible subsets (the power set) using recursive backtracking.',
    explanation:
      'At index `idx`, we can either record the current `path` and loop `i` from `idx` to `n - 1` (each call represents a unique subset), or branch on `include nums[idx]` vs `exclude nums[idx]`. To handle duplicates (`Subsets II`), sort `nums` first and skip `i > idx && nums[i] == nums[i - 1]`.',
    realWorldAnalogy:
      'Building every possible team roster from `n` players by adding one player at a time in increasing ID order so `{Alice, Bob}` is never generated twice as `{Bob, Alice}`.',
    algorithm:
      '1. Call `dfs(0, path)`.\n2. At each `dfs(start, path)`: append `copy(path)` to `res`.\n3. For `i` from `start` to `n - 1`: `path.push(nums[i])`, `dfs(i + 1, path)`, `path.pop()`.',
    pseudocode: `dfs(start, path):
    res.append(copy(path))
    for i from start to n - 1:
        path.push(nums[i])
        dfs(i + 1, path)
        path.pop()`,
    dryRunExample:
      '`nums = [1, 2, 3]`:\n`[] -> [1] -> [1,2] -> [1,2,3] -> [1,3] -> [2] -> [2,3] -> [3]` (8 subsets).',
    timeComplexity: 'O(n * 2^n)',
    spaceComplexity: 'O(n) recursion stack (excluding output)',
    commonMistakes: [
      'Starting the loop at `0` instead of `start` (produces permutations/duplicates instead of subsets).',
    ],
    interviewTips: [
      'Subsets II duplicate guard: `if (i > start && nums[i] == nums[i - 1]) continue;` after sorting.',
    ],
    implementations: {
      c: `#include <stdio.h>\n\nvoid subsetsDfs(const int nums[], int n, int start, int path[], int len) {\n    printf("[");\n    for (int i = 0; i < len; i++) printf("%d%s", path[i], i + 1 < len ? "," : "");\n    printf("]\\n");\n    for (int i = start; i < n; i++) {\n        path[len] = nums[i];\n        subsetsDfs(nums, n, i + 1, path, len + 1);\n    }\n}`,
      cpp: `#include <vector>\nusing namespace std;\n\nvoid dfs(const vector<int>& nums, int start, vector<int>& path, vector<vector<int>>& res) {\n    res.push_back(path);\n    for (int i = start; i < static_cast<int>(nums.size()); ++i) {\n        path.push_back(nums[i]);\n        dfs(nums, i + 1, path, res);\n        path.pop_back();\n    }\n}\n\nvector<vector<int>> subsets(const vector<int>& nums) {\n    vector<vector<int>> res; vector<int> path;\n    dfs(nums, 0, path, res);\n    return res;\n}`,
      java: `import java.util.*;\n\npublic class Subsets {\n    public static List<List<Integer>> subsets(int[] nums) {\n        List<List<Integer>> res = new ArrayList<>();\n        dfs(nums, 0, new ArrayList<>(), res);\n        return res;\n    }\n    private static void dfs(int[] nums, int start, List<Integer> path, List<List<Integer>> res) {\n        res.add(new ArrayList<>(path));\n        for (int i = start; i < nums.length; i++) {\n            path.add(nums[i]);\n            dfs(nums, i + 1, path, res);\n            path.remove(path.size() - 1);\n        }\n    }\n}`,
      python: `def subsets(nums: list[int]) -> list[list[int]]:\n    res, path = [], []\n    def dfs(start: int) -> None:\n        res.append(path[:])\n        for i in range(start, len(nums)):\n            path.append(nums[i])\n            dfs(i + 1)\n            path.pop()\n    dfs(0)\n    return res`,
    },
  },
  {
    topicSlug: 'generate-permutations',
    title: 'Generate All Permutations',
    definition:
      'Given `n` distinct elements, generate all `n!` possible orderings using backtracking with a `used[]` boolean array (or in-place swapping).',
    explanation:
      'Unlike subsets/combinations where order does not matter and we advance `start`, permutations care about order, so every position `0..n-1` can pick any unused element. A `used[]` array preserves lexicographical order; in-place swapping (`swap(nums[idx], nums[i])`) avoids the `used[]` array.',
    realWorldAnalogy:
      'Seating `n` guests in `n` numbered chairs: each chair can take any guest not yet seated.',
    algorithm:
      '1. If `path.size() == n`, add `copy(path)` to `res` and return.\n2. Loop `i` from `0` to `n - 1`:\n   - If `used[i]`, continue.\n   - `used[i] = true`, `path.push(nums[i])`.\n   - Recurse.\n   - `path.pop()`, `used[i] = false`.',
    pseudocode: `dfs(path, used):
    if len(path) == n:
        res.append(copy(path)); return
    for i from 0 to n - 1:
        if used[i]: continue
        used[i] <- true; path.push(nums[i])
        dfs(path, used)
        path.pop(); used[i] <- false`,
    dryRunExample:
      '`nums = [1, 2, 3]` -> `[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]` (`3! = 6`).',
    timeComplexity: 'O(n * n!) — n! permutations, O(n) copy each',
    spaceComplexity: 'O(n) recursion + used array',
    commonMistakes: [
      'Forgetting `used[i] = false` during unchoose.',
      'For Permutations II (with duplicates): forgetting `if (i > 0 && nums[i] == nums[i-1] && !used[i-1]) continue;`.',
    ],
    interviewTips: [
      'Explain why `!used[i-1]` (or `used[i-1]`) deduplicates identical elements in Permutations II.',
    ],
    implementations: {
      c: `#include <stdio.h>\n\nvoid permute(int nums[], int n, int idx) {\n    if (idx == n) {\n        for (int i = 0; i < n; i++) printf("%d ", nums[i]);\n        printf("\\n"); return;\n    }\n    for (int i = idx; i < n; i++) {\n        int t = nums[idx]; nums[idx] = nums[i]; nums[i] = t;\n        permute(nums, n, idx + 1);\n        t = nums[idx]; nums[idx] = nums[i]; nums[i] = t;\n    }\n}`,
      cpp: `#include <vector>\nusing namespace std;\n\nvoid dfs(const vector<int>& nums, vector<bool>& used, vector<int>& path, vector<vector<int>>& res) {\n    if (path.size() == nums.size()) { res.push_back(path); return; }\n    for (size_t i = 0; i < nums.size(); ++i) {\n        if (used[i]) continue;\n        used[i] = true; path.push_back(nums[i]);\n        dfs(nums, used, path, res);\n        path.pop_back(); used[i] = false;\n    }\n}`,
      java: `import java.util.*;\n\npublic class Permutations {\n    public static List<List<Integer>> permute(int[] nums) {\n        List<List<Integer>> res = new ArrayList<>();\n        dfs(nums, new boolean[nums.length], new ArrayList<>(), res);\n        return res;\n    }\n    private static void dfs(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> res) {\n        if (path.size() == nums.length) { res.add(new ArrayList<>(path)); return; }\n        for (int i = 0; i < nums.length; i++) {\n            if (used[i]) continue;\n            used[i] = true; path.add(nums[i]);\n            dfs(nums, used, path, res);\n            path.remove(path.size() - 1); used[i] = false;\n        }\n    }\n}`,
      python: `def permute(nums: list[int]) -> list[list[int]]:\n    res, path, used = [], [], [False] * len(nums)\n    def dfs() -> None:\n        if len(path) == len(nums):\n            res.append(path[:]); return\n        for i in range(len(nums)):\n            if used[i]: continue\n            used[i] = True; path.append(nums[i])\n            dfs()\n            path.pop(); used[i] = False\n    dfs()\n    return res`,
    },
  },
  {
    topicSlug: 'combinations',
    title: 'Combinations (n Choose k)',
    definition:
      'Given integers `n` and `k`, return all `C(n, k)` combinations of `k` numbers chosen from `1..n` in any order.',
    explanation:
      'Similar to subsets, we advance `start` to `i + 1` so combinations are strictly increasing and never duplicate `{1, 2}` as `{2, 1}`. A crucial pruning optimization: if we still need `need = k - path.size()` elements, `i` only needs to go up to `n - need + 1` because later starts cannot provide enough remaining numbers.',
    realWorldAnalogy:
      'Picking `k` lottery numbers from `1..n` in ascending order.',
    algorithm:
      '1. If `path.size() == k`, record `copy(path)` and return.\n2. Let `need = k - path.size()`.\n3. Loop `i` from `start` to `n - need + 1`:\n   - `path.push(i)`, recurse `dfs(i + 1)`, `path.pop()`.',
    pseudocode: `dfs(start, path):
    if len(path) == k:
        res.append(copy(path)); return
    need <- k - len(path)
    for i from start to n - need + 1:
        path.push(i)
        dfs(i + 1, path)
        path.pop()`,
    dryRunExample:
      '`n = 4, k = 2`:\n`[1,2], [1,3], [1,4], [2,3], [2,4], [3,4]` (`C(4,2) = 6`).',
    timeComplexity: 'O(k * C(n, k))',
    spaceComplexity: 'O(k) recursion stack',
    commonMistakes: [
      'Missing the `n - need + 1` upper-bound pruning, which explores doomed partial branches.',
    ],
    interviewTips: [
      'Mention the `n - (k - path.size()) + 1` pruning bound—interviewers love seeing tight branch bounds.',
    ],
    implementations: {
      c: `#include <stdio.h>\n\nvoid combDfs(int n, int k, int start, int path[], int len) {\n    if (len == k) {\n        for (int i = 0; i < k; i++) printf("%d ", path[i]);\n        printf("\\n"); return;\n    }\n    int limit = n - (k - len) + 1;\n    for (int i = start; i <= limit; i++) {\n        path[len] = i;\n        combDfs(n, k, i + 1, path, len + 1);\n    }\n}`,
      cpp: `#include <vector>\nusing namespace std;\n\nvoid dfs(int n, int k, int start, vector<int>& path, vector<vector<int>>& res) {\n    if (static_cast<int>(path.size()) == k) { res.push_back(path); return; }\n    int limit = n - (k - static_cast<int>(path.size())) + 1;\n    for (int i = start; i <= limit; ++i) {\n        path.push_back(i);\n        dfs(n, k, i + 1, path, res);\n        path.pop_back();\n    }\n}`,
      java: `import java.util.*;\n\npublic class Combinations {\n    public static List<List<Integer>> combine(int n, int k) {\n        List<List<Integer>> res = new ArrayList<>();\n        dfs(n, k, 1, new ArrayList<>(), res);\n        return res;\n    }\n    private static void dfs(int n, int k, int start, List<Integer> path, List<List<Integer>> res) {\n        if (path.size() == k) { res.add(new ArrayList<>(path)); return; }\n        int limit = n - (k - path.size()) + 1;\n        for (int i = start; i <= limit; i++) {\n            path.add(i); dfs(n, k, i + 1, path, res); path.remove(path.size() - 1);\n        }\n    }\n}`,
      python: `def combine(n: int, k: int) -> list[list[int]]:\n    res, path = [], []\n    def dfs(start: int) -> None:\n        if len(path) == k:\n            res.append(path[:]); return\n        limit = n - (k - len(path)) + 1\n        for i in range(start, limit + 1):\n            path.append(i)\n            dfs(i + 1)\n            path.pop()\n    dfs(1)\n    return res`,
    },
  },
  {
    topicSlug: 'combination-sum',
    title: 'Combination Sum (Unlimited Reuse & Pruning)',
    definition:
      'Given distinct positive integers `candidates` and a `target`, find all unique combinations where chosen numbers sum to `target`, allowing each candidate to be chosen unlimited times.',
    explanation:
      'Sorting `candidates` lets us break early as soon as `candidates[i] > remaining`. Because reuse is allowed, the recursive call passes `i` (not `i + 1`) so `candidates[i]` can be picked again, while still preventing duplicate orderings like `[2,3]` and `[3,2]` by never looking backward before `i`.',
    realWorldAnalogy:
      'Making exact change for `target` cents using unlimited coins of each denomination, always picking coins in non-decreasing denomination order.',
    algorithm:
      '1. Sort `candidates`.\n2. `dfs(start, rem, path)`:\n   - If `rem == 0`, add `copy(path)` and return.\n   - For `i` from `start` to `n - 1`:\n     - If `candidates[i] > rem`, `break`.\n     - `path.push(candidates[i])`, `dfs(i, rem - candidates[i], path)`, `path.pop()`.',
    pseudocode: `sort(candidates)
dfs(start, rem, path):
    if rem == 0: res.append(copy(path)); return
    for i from start to n - 1:
        if candidates[i] > rem: break
        path.push(candidates[i])
        dfs(i, rem - candidates[i], path)
        path.pop()`,
    dryRunExample:
      '`candidates = [2, 3, 6, 7]`, `target = 7`:\n- `[2, 2, 3]` (sum 7) and `[7]` (sum 7).',
    timeComplexity: 'O(N^(T/M + 1)) where T is target and M is min candidate',
    spaceComplexity: 'O(T/M) recursion depth',
    commonMistakes: [
      'Passing `0` instead of `i` to the recursive call (generates `[2,2,3]`, `[2,3,2]`, `[3,2,2]`).',
      'For Combination Sum II (each number used once with duplicates): pass `i + 1` and skip `i > start && c[i] == c[i-1]`.',
    ],
    interviewTips: [
      'Distinguish clearly between Combination Sum I (reuse allowed -> pass `i`), II (use once + duplicates -> pass `i + 1` + skip), and IV (order matters -> 1D DP).',
    ],
    implementations: {
      c: `#include <stdlib.h>\n\nstatic int cmpC(const void* a, const void* b) { return (*(const int*)a - *(const int*)b); }\n\nvoid csDfs(const int c[], int n, int start, int rem, int* count) {\n    if (rem == 0) { (*count)++; return; }\n    for (int i = start; i < n; i++) {\n        if (c[i] > rem) break;\n        csDfs(c, n, i, rem - c[i], count);\n    }\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\n\nvoid dfs(const vector<int>& c, int start, int rem, vector<int>& path, vector<vector<int>>& res) {\n    if (rem == 0) { res.push_back(path); return; }\n    for (int i = start; i < static_cast<int>(c.size()); ++i) {\n        if (c[i] > rem) break;\n        path.push_back(c[i]);\n        dfs(c, i, rem - c[i], path, res);\n        path.pop_back();\n    }\n}`,
      java: `import java.util.*;\n\npublic class CombinationSum {\n    public static List<List<Integer>> combinationSum(int[] c, int target) {\n        Arrays.sort(c);\n        List<List<Integer>> res = new ArrayList<>();\n        dfs(c, 0, target, new ArrayList<>(), res);\n        return res;\n    }\n    private static void dfs(int[] c, int start, int rem, List<Integer> path, List<List<Integer>> res) {\n        if (rem == 0) { res.add(new ArrayList<>(path)); return; }\n        for (int i = start; i < c.length; i++) {\n            if (c[i] > rem) break;\n            path.add(c[i]); dfs(c, i, rem - c[i], path, res); path.remove(path.size() - 1);\n        }\n    }\n}`,
      python: `def combination_sum(candidates: list[int], target: int) -> list[list[int]]:\n    candidates.sort()\n    res, path = [], []\n    def dfs(start: int, rem: int) -> None:\n        if rem == 0:\n            res.append(path[:]); return\n        for i in range(start, len(candidates)):\n            if candidates[i] > rem:\n                break\n            path.append(candidates[i])\n            dfs(i, rem - candidates[i])\n            path.pop()\n    dfs(0, target)\n    return res`,
    },
  },
  {
    topicSlug: 'rat-in-a-maze',
    title: 'Rat in a Maze (Grid Path Backtracking)',
    definition:
      'Given an `N x N` binary grid (`1` = open, `0` = blocked), find all valid paths from `(0, 0)` to `(N - 1, N - 1)` moving in 4 directions (`D, L, R, U`) without revisiting any cell in the same path.',
    explanation:
      'Mark `(r, c)` as visited (`vis[r][c] = true` or temporarily set `grid[r][c] = 0`) before exploring its 4 neighbors, then unmark it on return so other paths can still pass through `(r, c)`. Iterating directions in lexicographical order (`D, L, R, U`) naturally produces sorted path strings.',
    realWorldAnalogy:
      'Leaving breadcrumbs along a maze corridor so you do not walk in circles, and picking them back up when backing out of a dead end.',
    algorithm:
      '1. If `grid[0][0] == 0` or `grid[N-1][N-1] == 0`, return `[]`.\n2. At `(r, c)`: if `(r, c) == (N-1, N-1)`, record `path`.\n3. Mark `vis[r][c] = true`.\n4. For each `(dr, dc, ch)` in `{D, L, R, U}`:\n   - If `(nr, nc)` is in bounds, `grid[nr][nc] == 1`, and `!vis[nr][nc]`, append `ch`, recurse, pop `ch`.\n5. Unmark `vis[r][c] = false`.',
    pseudocode: `dfs(r, c, path):
    if r == N - 1 and c == N - 1:
        res.append(path); return
    vis[r][c] <- true
    for (dr, dc, dirChar) in [(1,0,'D'), (0,-1,'L'), (0,1,'R'), (-1,0,'U')]:
        nr <- r + dr, nc <- c + dc
        if valid(nr, nc) and grid[nr][nc] == 1 and not vis[nr][nc]:
            dfs(nr, nc, path + dirChar)
    vis[r][c] <- false`,
    dryRunExample:
      'On a `2x2` open grid `[[1,1],[1,1]]`: valid paths from `(0,0)` to `(1,1)` are `"DR"` and `"RD"`.',
    timeComplexity: 'O(4^(N^2)) worst case (bounded by 3^(N^2) since you cannot go straight back)',
    spaceComplexity: 'O(N^2) for visited matrix and recursion stack',
    commonMistakes: [
      'Forgetting to check `grid[0][0] == 0` before starting.',
      'Not unmarking `vis[r][c] = false` (turns all-paths backtracking into single-visit reachability).',
    ],
    interviewTips: [
      'Note the difference between **shortest path** (use BFS, `O(N^2)`) and **all simple paths** (use Backtracking).',
    ],
    implementations: {
      c: `int ratCount(int grid[][10], int n, int r, int c, int vis[][10]) {\n    if (r < 0 || c < 0 || r >= n || c >= n || grid[r][c] == 0 || vis[r][c]) return 0;\n    if (r == n - 1 && c == n - 1) return 1;\n    vis[r][c] = 1;\n    int ways = ratCount(grid, n, r + 1, c, vis) + ratCount(grid, n, r, c - 1, vis)\n             + ratCount(grid, n, r, c + 1, vis) + ratCount(grid, n, r - 1, c, vis);\n    vis[r][c] = 0;\n    return ways;\n}`,
      cpp: `#include <string>\n#include <vector>\nusing namespace std;\n\nvoid mazeDfs(const vector<vector<int>>& g, int r, int c, vector<vector<bool>>& vis, string& path, vector<string>& res) {\n    int n = static_cast<int>(g.size());\n    if (r == n - 1 && c == n - 1) { res.push_back(path); return; }\n    static const int dr[] = {1, 0, 0, -1}, dc[] = {0, -1, 1, 0};\n    static const char* dcName = "DLRU";\n    vis[r][c] = true;\n    for (int d = 0; d < 4; ++d) {\n        int nr = r + dr[d], nc = c + dc[d];\n        if (nr >= 0 && nc >= 0 && nr < n && nc < n && g[nr][nc] == 1 && !vis[nr][nc]) {\n            path.push_back(dcName[d]);\n            mazeDfs(g, nr, nc, vis, path, res);\n            path.pop_back();\n        }\n    }\n    vis[r][c] = false;\n}`,
      java: `import java.util.*;\n\npublic class RatInMaze {\n    static void dfs(int[][] g, int r, int c, boolean[][] vis, StringBuilder path, List<String> res) {\n        int n = g.length;\n        if (r == n - 1 && c == n - 1) { res.add(path.toString()); return; }\n        int[] dr = {1, 0, 0, -1}, dc = {0, -1, 1, 0};\n        char[] ch = {'D', 'L', 'R', 'U'};\n        vis[r][c] = true;\n        for (int d = 0; d < 4; d++) {\n            int nr = r + dr[d], nc = c + dc[d];\n            if (nr >= 0 && nc >= 0 && nr < n && nc < n && g[nr][nc] == 1 && !vis[nr][nc]) {\n                path.append(ch[d]); dfs(g, nr, nc, vis, path, res); path.deleteCharAt(path.length() - 1);\n            }\n        }\n        vis[r][c] = false;\n    }\n}`,
      python: `def rat_in_maze(grid: list[list[int]]) -> list[str]:\n    n = len(grid)\n    if not n or grid[0][0] == 0 or grid[n - 1][n - 1] == 0:\n        return []\n    res, vis = [], [[False] * n for _ in range(n)]\n    def dfs(r: int, c: int, path: list[str]) -> None:\n        if r == n - 1 and c == n - 1:\n            res.append("".join(path)); return\n        vis[r][c] = True\n        for dr, dc, ch in ((1, 0, "D"), (0, -1, "L"), (0, 1, "R"), (-1, 0, "U")):\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 1 and not vis[nr][nc]:\n                path.append(ch); dfs(nr, nc, path); path.pop()\n        vis[r][c] = False\n    dfs(0, 0, [])\n    return res`,
    },
  },
  {
    topicSlug: 'word-search',
    title: 'Word Search in a 2D Grid',
    definition:
      'Given an `m x n` character grid `board` and a string `word`, return `true` if `word` can be formed by sequentially adjacent (4-directional) cells without reusing any cell.',
    explanation:
      'Try starting DFS from every cell matching `word[0]`. At step `idx`, temporarily overwrite `board[r][c]` with a sentinel (e.g. `\'#\')` to mark it visited in `O(1)` extra space, explore 4 neighbors for `word[idx + 1]`, and restore the original character on backtrack.',
    realWorldAnalogy:
      'Tracing a word in Boggle without lifting your finger or stepping on the same letter tile twice.',
    algorithm:
      '1. For every `(r, c)` in `board`, if `dfs(r, c, 0)` returns `true`, return `true`.\n2. In `dfs(r, c, idx)`:\n   - If `idx == len(word)`, return `true`.\n   - Check bounds and `board[r][c] == word[idx]`.\n   - Save `saved = board[r][c]`, set `board[r][c] = \'#\'`.\n   - Recurse 4 directions for `idx + 1`.\n   - Restore `board[r][c] = saved`.',
    pseudocode: `dfs(r, c, idx):
    if idx == len(word): return true
    if outOfBounds(r, c) or board[r][c] != word[idx]: return false
    saved <- board[r][c]
    board[r][c] <- '#'
    found <- dfs(r+1,c,idx+1) or dfs(r-1,c,idx+1) or dfs(r,c+1,idx+1) or dfs(r,c-1,idx+1)
    board[r][c] <- saved
    return found`,
    dryRunExample:
      'Board `[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]`, `word = "ABCCED"` -> `(0,0)A -> (0,1)B -> (0,2)C -> (1,2)C -> (2,2)E -> (2,1)D` -> `true`.',
    timeComplexity: 'O(m * n * 3^L) where L = len(word)',
    spaceComplexity: 'O(L) recursion stack (in-place sentinel marking)',
    commonMistakes: [
      'Forgetting to restore `board[r][c] = saved` when returning `true` or `false`.',
    ],
    interviewTips: [
      'For **Word Search II** (multiple words), combine Backtracking with a **Trie** so all words are searched simultaneously.',
    ],
    implementations: {
      c: `#include <stdbool.h>\n\nstatic bool wsDfs(char** b, int R, int C, int r, int c, const char* w, int idx) {\n    if (w[idx] == '\\0') return true;\n    if (r < 0 || c < 0 || r >= R || c >= C || b[r][c] != w[idx]) return false;\n    char saved = b[r][c]; b[r][c] = '#';\n    bool ok = wsDfs(b, R, C, r+1, c, w, idx+1) || wsDfs(b, R, C, r-1, c, w, idx+1)\n           || wsDfs(b, R, C, r, c+1, w, idx+1) || wsDfs(b, R, C, r, c-1, w, idx+1);\n    b[r][c] = saved;\n    return ok;\n}`,
      cpp: `#include <string>\n#include <vector>\nusing namespace std;\n\nbool wsDfs(vector<vector<char>>& b, int r, int c, const string& w, int idx) {\n    if (idx == static_cast<int>(w.size())) return true;\n    if (r < 0 || c < 0 || r >= static_cast<int>(b.size()) || c >= static_cast<int>(b[0].size()) || b[r][c] != w[idx]) return false;\n    char saved = b[r][c]; b[r][c] = '#';\n    bool ok = wsDfs(b, r+1, c, w, idx+1) || wsDfs(b, r-1, c, w, idx+1)\n           || wsDfs(b, r, c+1, w, idx+1) || wsDfs(b, r, c-1, w, idx+1);\n    b[r][c] = saved;\n    return ok;\n}`,
      java: `public class WordSearch {\n    public static boolean exist(char[][] b, String w) {\n        for (int r = 0; r < b.length; r++)\n            for (int c = 0; c < b[0].length; c++)\n                if (dfs(b, r, c, w, 0)) return true;\n        return false;\n    }\n    private static boolean dfs(char[][] b, int r, int c, String w, int idx) {\n        if (idx == w.length()) return true;\n        if (r < 0 || c < 0 || r >= b.length || c >= b[0].length || b[r][c] != w.charAt(idx)) return false;\n        char saved = b[r][c]; b[r][c] = '#';\n        boolean ok = dfs(b, r+1, c, w, idx+1) || dfs(b, r-1, c, w, idx+1)\n                  || dfs(b, r, c+1, w, idx+1) || dfs(b, r, c-1, w, idx+1);\n        b[r][c] = saved;\n        return ok;\n    }\n}`,
      python: `def exist(board: list[list[str]], word: str) -> bool:\n    R, C = len(board), len(board[0])\n    def dfs(r: int, c: int, idx: int) -> bool:\n        if idx == len(word): return True\n        if r < 0 or c < 0 or r >= R or c >= C or board[r][c] != word[idx]: return False\n        saved, board[r][c] = board[r][c], '#'\n        ok = dfs(r+1,c,idx+1) or dfs(r-1,c,idx+1) or dfs(r,c+1,idx+1) or dfs(r,c-1,idx+1)\n        board[r][c] = saved\n        return ok\n    return any(dfs(r, c, 0) for r in range(R) for c in range(C))`,
    },
  },
  {
    topicSlug: 'n-queens-problem',
    title: 'N-Queens Problem',
    definition:
      'Place `N` queens on an `N x N` chessboard so that no two queens attack each other (no shared row, column, or diagonal).',
    explanation:
      'Place exactly one queen per row (`row = 0 .. N - 1`). Instead of scanning the board in `O(N)` to check safety, maintain three boolean/bitmask lookup tables in `O(1)`:\n- `cols[c]`\n- `diag1[r - c + N - 1]` (main diagonal `\\`)\n- `diag2[r + c]` (anti-diagonal `/`)',
    realWorldAnalogy:
      'Scheduling `N` mutually incompatible tasks onto `N` time slots and `N` rooms where diagonals represent conflict buffers.',
    algorithm:
      "1. Start at `row = 0`.\n2. If `row == N`, record board configuration.\n3. For `col` from `0` to `N - 1`:\n   - If `cols[col] || diag1[row - col + N - 1] || diag2[row + col]`, continue.\n   - Mark all three `true`, place `'Q'`, recurse `row + 1`, remove `'Q'`, unmark all three.",
    pseudocode: `solve(row):
    if row == N: recordBoard(); return
    for col from 0 to N - 1:
        if cols[col] or diag1[row - col + N - 1] or diag2[row + col]: continue
        placeQueen(row, col)
        solve(row + 1)
        removeQueen(row, col)`,
    dryRunExample:
      'For `N = 4`, there are `2` valid solutions: columns `[1, 3, 0, 2]` and `[2, 0, 3, 1]`.',
    timeComplexity: 'O(N!) — at most N choices in row 0, N-1 in row 1, etc.',
    spaceComplexity: 'O(N^2) for board (O(N) for conflict arrays + stack)',
    commonMistakes: [
      'Negative index for `row - col` without shifting by `+ (N - 1)`.',
    ],
    interviewTips: [
      'Using 3 integer bitmasks (`colMask`, `d1Mask`, `d2Mask`) makes `N-Queens II` (counting solutions) blazingly fast.',
    ],
    implementations: {
      c: `int totalNQueensHelper(int n, int r, int cols, int d1, int d2) {\n    if (r == n) return 1;\n    int count = 0, avail = ((1 << n) - 1) & ~(cols | d1 | d2);\n    while (avail) {\n        int bit = avail & -avail;\n        avail &= avail - 1;\n        count += totalNQueensHelper(n, r + 1, cols | bit, (d1 | bit) << 1, (d2 | bit) >> 1);\n    }\n    return count;\n}`,
      cpp: `#include <string>\n#include <vector>\nusing namespace std;\n\nvoid solveNQueensDfs(int n, int r, vector<bool>& col, vector<bool>& d1, vector<bool>& d2, vector<string>& board, vector<vector<string>>& res) {\n    if (r == n) { res.push_back(board); return; }\n    for (int c = 0; c < n; ++c) {\n        if (col[c] || d1[r - c + n - 1] || d2[r + c]) continue;\n        col[c] = d1[r - c + n - 1] = d2[r + c] = true;\n        board[r][c] = 'Q';\n        solveNQueensDfs(n, r + 1, col, d1, d2, board, res);\n        board[r][c] = '.';\n        col[c] = d1[r - c + n - 1] = d2[r + c] = false;\n    }\n}`,
      java: `import java.util.*;\n\npublic class NQueens {\n    public static int totalNQueens(int n) {\n        return dfs(n, 0, new boolean[n], new boolean[2 * n], new boolean[2 * n]);\n    }\n    private static int dfs(int n, int r, boolean[] col, boolean[] d1, boolean[] d2) {\n        if (r == n) return 1;\n        int count = 0;\n        for (int c = 0; c < n; c++) {\n            if (col[c] || d1[r - c + n] || d2[r + c]) continue;\n            col[c] = d1[r - c + n] = d2[r + c] = true;\n            count += dfs(n, r + 1, col, d1, d2);\n            col[c] = d1[r - c + n] = d2[r + c] = false;\n        }\n        return count;\n    }\n}`,
      python: `def total_n_queens(n: int) -> int:\n    cols, d1, d2 = set(), set(), set()\n    def dfs(r: int) -> int:\n        if r == n: return 1\n        ans = 0\n        for c in range(n):\n            if c in cols or (r - c) in d1 or (r + c) in d2: continue\n            cols.add(c); d1.add(r - c); d2.add(r + c)\n            ans += dfs(r + 1)\n            cols.remove(c); d1.remove(r - c); d2.remove(r + c)\n        return ans\n    return dfs(0)`,
    },
  },
  {
    topicSlug: 'sudoku-solver',
    title: 'Sudoku Solver (Constraint Backtracking)',
    definition:
      'Fill a `9 x 9` grid with digits `1..9` such that each row, each column, and each `3 x 3` sub-box (`box = (r / 3) * 3 + c / 3`) contains every digit `1..9` exactly once.',
    explanation:
      "Find the next empty cell `'.'`, try digits `'1'..'9'` that do not violate row, column, or 3x3 box constraints, recurse, and reset to `'.'` if a dead end is reached. Precomputing `rows[9][10]`, `cols[9][10]`, and `boxes[9][10]` boolean tables makes validity checks `O(1)`.",
    realWorldAnalogy:
      'Pencil-in a candidate digit in an empty Sudoku square; if a later square has zero legal digits left, erase and try the next digit.',
    algorithm:
      "1. Scan for the next empty cell `(r, c)`. If none exists, return `true` (solved!).\n2. For `d` from `'1'` to `'9'`:\n   - If `d` is absent from row `r`, col `c`, and box `(r/3)*3 + c/3`:\n     - Place `d`, mark lookup tables, recurse.\n     - If recursion returns `true`, return `true`.\n     - Undo placement and lookup tables.\n3. Return `false` to trigger backtracking.",
    pseudocode: `solve(board):
    find next empty (r, c); if none return true
    for d in '1'..'9':
        if isSafe(r, c, d):
            board[r][c] <- d
            if solve(board): return true
            board[r][c] <- '.'
    return false`,
    dryRunExample:
      'Box index formula: cell `(5, 7)` belongs to box `(5 / 3) * 3 + (7 / 3) = 1 * 3 + 2 = 5`.',
    timeComplexity: 'O(9^E) worst case where E is empty cells (much smaller in practice due to constraint pruning)',
    spaceComplexity: 'O(E) recursion stack + O(1) 9x10 lookup tables',
    commonMistakes: [
      'Forgetting to return `true` immediately when the solution is found (causes backtracking to erase the solved board!).',
      'Wrong 3x3 box indexing: `(r / 3) * 3 + (c / 3)` (integer division).',
    ],
    interviewTips: [
      'Mention the MRV heuristic (Minimum Remaining Values: pick the empty cell with fewest legal digits first) to speed up hard puzzles dramatically.',
    ],
    implementations: {
      c: `#include <stdbool.h>\n\nstatic bool isSafe(char b[9][9], int r, int c, char d) {\n    int br = (r / 3) * 3, bc = (c / 3) * 3;\n    for (int i = 0; i < 9; i++) {\n        if (b[r][i] == d || b[i][c] == d || b[br + i / 3][bc + i % 3] == d) return false;\n    }\n    return true;\n}\n\nbool solveSudoku(char b[9][9]) {\n    for (int r = 0; r < 9; r++) {\n        for (int c = 0; c < 9; c++) {\n            if (b[r][c] == '.') {\n                for (char d = '1'; d <= '9'; d++) {\n                    if (isSafe(b, r, c, d)) {\n                        b[r][c] = d;\n                        if (solveSudoku(b)) return true;\n                        b[r][c] = '.';\n                    }\n                }\n                return false;\n            }\n        }\n    }\n    return true;\n}`,
      cpp: `#include <vector>\nusing namespace std;\n\nbool isSafe(const vector<vector<char>>& b, int r, int c, char d) {\n    int br = (r / 3) * 3, bc = (c / 3) * 3;\n    for (int i = 0; i < 9; ++i) {\n        if (b[r][i] == d || b[i][c] == d || b[br + i / 3][bc + i % 3] == d) return false;\n    }\n    return true;\n}\n\nbool solveSudoku(vector<vector<char>>& b) {\n    for (int r = 0; r < 9; ++r)\n        for (int c = 0; c < 9; ++c)\n            if (b[r][c] == '.') {\n                for (char d = '1'; d <= '9'; ++d) {\n                    if (isSafe(b, r, c, d)) {\n                        b[r][c] = d;\n                        if (solveSudoku(b)) return true;\n                        b[r][c] = '.';\n                    }\n                }\n                return false;\n            }\n    return true;\n}`,
      java: `public class SudokuSolver {\n    public static boolean solve(char[][] b) {\n        for (int r = 0; r < 9; r++)\n            for (int c = 0; c < 9; c++)\n                if (b[r][c] == '.') {\n                    for (char d = '1'; d <= '9'; d++) {\n                        if (isSafe(b, r, c, d)) {\n                            b[r][c] = d;\n                            if (solve(b)) return true;\n                            b[r][c] = '.';\n                        }\n                    }\n                    return false;\n                }\n        return true;\n    }\n    private static boolean isSafe(char[][] b, int r, int c, char d) {\n        int br = (r / 3) * 3, bc = (c / 3) * 3;\n        for (int i = 0; i < 9; i++)\n            if (b[r][i] == d || b[i][c] == d || b[br + i / 3][bc + i % 3] == d) return false;\n        return true;\n    }\n}`,
      python: `def solve_sudoku(board: list[list[str]]) -> bool:\n    def is_safe(r: int, c: int, d: str) -> bool:\n        br, bc = (r // 3) * 3, (c // 3) * 3\n        return all(board[r][i] != d and board[i][c] != d and board[br + i // 3][bc + i % 3] != d for i in range(9))\n    for r in range(9):\n        for c in range(9):\n            if board[r][c] == '.':\n                for d in '123456789':\n                    if is_safe(r, c, d):\n                        board[r][c] = d\n                        if solve_sudoku(board): return True\n                        board[r][c] = '.'\n                return False\n    return True`,
    },
  },
  {
    topicSlug: 'graph-coloring',
    title: 'M-Coloring Problem (Graph Coloring Backtracking)',
    definition:
      'Given an undirected graph with `V` vertices and `M` colors, determine if every vertex can be assigned one of the `M` colors such that no two adjacent vertices share the same color.',
    explanation:
      'Process vertices `0 .. V - 1` sequentially. At vertex `u`, try each color `c` in `1..M`. If no neighbor of `u` currently has color `c`, assign `color[u] = c` and recurse to `u + 1`. If `u == V`, a valid coloring is found; otherwise reset `color[u] = 0` and try the next color.',
    realWorldAnalogy:
      'Coloring a map of countries with `M` crayons so no two bordering countries have the same color—or assigning `M` exam time slots so no student has two exams at once.',
    algorithm:
      '1. Initialize `color[0..V-1] = 0`.\n2. `solve(u)`:\n   - If `u == V`, return `true`.\n   - For `c` from `1` to `M`:\n     - Check all neighbors `v` of `u`: if `color[v] == c`, skip.\n     - `color[u] = c`; if `solve(u + 1)`, return `true`; `color[u] = 0`.\n   - Return `false`.',
    pseudocode: `solve(u):
    if u == V: return true
    for c from 1 to M:
        if all neighbors v of u have color[v] != c:
            color[u] <- c
            if solve(u + 1): return true
            color[u] <- 0
    return false`,
    dryRunExample:
      'Triangle graph `(0-1, 1-2, 2-0)` with `M = 2`: `u=0 -> c1`, `u=1 -> c2`, `u=2` cannot use `c1` (adj to 0) or `c2` (adj to 1) -> returns `false`. With `M = 3`, succeeds (`1, 2, 3`).',
    timeComplexity: 'O(M^V) worst case',
    spaceComplexity: 'O(V) for color array and recursion stack',
    commonMistakes: [
      'Confusing 2-coloring (bipartite check, solvable in `O(V + E)` via BFS/DFS) with general M-coloring (`M >= 3`, NP-complete).',
    ],
    interviewTips: [
      'Always mention that `M = 2` is just Bipartite Graph Checking in `O(V + E)` without backtracking!',
    ],
    implementations: {
      c: `#include <stdbool.h>\n\nbool canColor(int u, int V, int M, int adj[][20], int color[]) {\n    if (u == V) return true;\n    for (int c = 1; c <= M; c++) {\n        bool ok = true;\n        for (int v = 0; v < V; v++) if (adj[u][v] && color[v] == c) { ok = false; break; }\n        if (ok) {\n            color[u] = c;\n            if (canColor(u + 1, V, M, adj, color)) return true;\n            color[u] = 0;\n        }\n    }\n    return false;\n}`,
      cpp: `#include <vector>\nusing namespace std;\n\nbool graphColoring(int u, int M, const vector<vector<int>>& adj, vector<int>& color) {\n    if (u == static_cast<int>(adj.size())) return true;\n    for (int c = 1; c <= M; ++c) {\n        bool ok = true;\n        for (int v : adj[u]) if (color[v] == c) { ok = false; break; }\n        if (ok) {\n            color[u] = c;\n            if (graphColoring(u + 1, M, adj, color)) return true;\n            color[u] = 0;\n        }\n    }\n    return false;\n}`,
      java: `import java.util.*;\n\npublic class GraphColoring {\n    public static boolean solve(int u, int m, List<List<Integer>> adj, int[] color) {\n        if (u == adj.size()) return true;\n        for (int c = 1; c <= m; c++) {\n            boolean ok = true;\n            for (int v : adj.get(u)) if (color[v] == c) { ok = false; break; }\n            if (ok) {\n                color[u] = c;\n                if (solve(u + 1, m, adj, color)) return true;\n                color[u] = 0;\n            }\n        }\n        return false;\n    }\n}`,
      python: `def graph_coloring(v_count: int, m: int, adj: list[list[int]]) -> bool:\n    color = [0] * v_count\n    def solve(u: int) -> bool:\n        if u == v_count: return True\n        for c in range(1, m + 1):\n            if all(color[nb] != c for nb in adj[u]):\n                color[u] = c\n                if solve(u + 1): return True\n                color[u] = 0\n        return False\n    return solve(0)`,
    },
  },

  // =========================================================================
  // MODULE 17: TREES — PART 1 (Concepts 1–16)
  // =========================================================================
  {
    topicSlug: 'tree-terminology',
    title: 'Tree Terminology & Properties',
    definition:
      'A tree is a connected, acyclic undirected graph (or a hierarchical rooted structure) with `N` nodes and `N - 1` edges, where every non-root node has exactly one parent.',
    explanation:
      '- **Root:** Topmost node (no parent).\n- **Leaf:** Node with zero children.\n- **Depth of node:** Number of edges from root to that node (root depth = `0`).\n- **Height of node:** Number of edges on the longest downward path from that node to a leaf (leaf height = `0`; some problems count nodes so leaf = `1`).\n- **Subtree:** A node together with all its descendants.',
    realWorldAnalogy:
      'A company org chart or file system directory hierarchy: `/` is the root, folders are internal nodes, and files are leaves.',
    algorithm:
      'Key mathematical invariants for any tree with `N` nodes:\n1. Number of edges `E = N - 1`.\n2. There is a **unique** simple path between any two nodes.\n3. Sum of degrees = `2(N - 1)`.',
    pseudocode: `// Rooted tree node structure:
struct TreeNode:
    val
    children[] (or left, right for binary tree)`,
    dryRunExample:
      'Tree `1 -> (2, 3)`, `2 -> (4, 5)`: `N = 5` nodes, `E = 4` edges. Leaves: `{4, 5, 3}`. Depth(4) = 2 edges; Height(1) = 2 edges (or 3 nodes).',
    timeComplexity: 'O(N) for full tree traversals',
    spaceComplexity: 'O(H) recursion stack where H is tree height',
    commonMistakes: [
      'Mixing up 0-based edge height vs 1-based node count height—always clarify which definition a problem uses.',
    ],
    interviewTips: [
      'Always ask whether an empty tree (`root == null`) has height `0` or `-1` in the problem’s convention.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'binary-tree-basics',
    title: 'Binary Tree Basics & Types',
    definition:
      'A binary tree is a rooted tree in which every node has **at most two children**, referred to as `left` and `right`.',
    explanation:
      'Important binary tree classifications:\n- **Full Binary Tree:** Every node has `0` or `2` children.\n- **Complete Binary Tree:** All levels are completely filled except possibly the last, which is filled left-to-right (used by Heaps).\n- **Perfect Binary Tree:** All internal nodes have `2` children and all leaves are at the same depth (`N = 2^(h+1) - 1`).\n- **Balanced Binary Tree:** `|height(left) - height(right)| <= 1` for every node.\n- **Degenerate (Skewed) Tree:** Every node has at most `1` child (behaves like a linked list, `H = N`).',
    realWorldAnalogy:
      'A single-elimination tournament bracket where each match (`node`) feeds from at most two prior matches (`left`, `right`).',
    algorithm:
      'A binary tree node stores `val`, `left`, and `right` pointers (or array indices `2*i + 1` and `2*i + 2` for complete binary trees).',
    pseudocode: `struct Node:
    int val
    Node* left
    Node* right`,
    dryRunExample:
      'A perfect binary tree of 3 levels (heights 0, 1, 2) has `1 + 2 + 4 = 7` nodes and `4` leaves.',
    timeComplexity: 'O(log N) height if balanced; O(N) height if skewed',
    spaceComplexity: 'O(N) to store N nodes',
    commonMistakes: [
      'Assuming a binary tree is always balanced (`O(log N)` height)—worst-case skewed tree has height `O(N)`.',
    ],
    interviewTips: [
      'Maximum nodes at level `L` (0-indexed) is `2^L`; minimum height for `N` nodes is `floor(log2(N))`.',
    ],
    implementations: {
      c: `typedef struct TreeNode {\n    int val;\n    struct TreeNode* left;\n    struct TreeNode* right;\n} TreeNode;`,
      cpp: `struct TreeNode {\n    int val;\n    TreeNode* left;\n    TreeNode* right;\n    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n};`,
      java: `class TreeNode {\n    int val;\n    TreeNode left, right;\n    TreeNode(int val) { this.val = val; }\n}`,
      python: `class TreeNode:\n    def __init__(self, val: int = 0, left: 'TreeNode | None' = None, right: 'TreeNode | None' = None):\n        self.val = val\n        self.left = left\n        self.right = right`,
    },
  },
  {
    topicSlug: 'preorder-traversal',
    title: 'Preorder Traversal (Root -> Left -> Right)',
    definition:
      'Preorder traversal visits the **root** node first, then recursively traverses the **left** subtree, and finally the **right** subtree (`N-L-R`).',
    explanation:
      'Because the root is processed before its children, preorder traversal is ideal for cloning/copying a tree, serializing tree structure, and evaluating prefix expressions.',
    realWorldAnalogy:
      'Reading a book’s table of contents top-down: read the chapter title (`Root`), then all its subsections (`Left`, `Right`) before moving to the next chapter.',
    algorithm:
      '1. If `node == null`, return.\n2. Visit/record `node.val`.\n3. Recurse `preorder(node.left)`.\n4. Recurse `preorder(node.right)`.',
    pseudocode: `preorder(node):
    if node == null: return
    visit(node.val)
    preorder(node.left)
    preorder(node.right)`,
    dryRunExample:
      'Tree `1 -> (2 -> (4, 5), 3)`: Preorder = `[1, 2, 4, 5, 3]`.',
    timeComplexity: 'O(N) — visits every node once',
    spaceComplexity: 'O(H) call stack (O(log N) balanced, O(N) skewed)',
    commonMistakes: [
      'Pushing `left` before `right` onto an explicit stack in iterative preorder (must push `right` first so `left` pops first!).',
    ],
    interviewTips: [
      'Preorder + Inorder uniquely reconstructs a binary tree (when values are distinct).',
    ],
    implementations: {
      c: `void preorder(const TreeNode* root) {\n    if (!root) return;\n    printf("%d ", root->val);\n    preorder(root->left);\n    preorder(root->right);\n}`,
      cpp: `void preorder(TreeNode* root, vector<int>& out) {\n    if (!root) return;\n    out.push_back(root->val);\n    preorder(root->left, out);\n    preorder(root->right, out);\n}`,
      java: `void preorder(TreeNode root, List<Integer> out) {\n    if (root == null) return;\n    out.add(root.val);\n    preorder(root.left, out);\n    preorder(root.right, out);\n}`,
      python: `def preorder(root: TreeNode | None) -> list[int]:\n    if not root: return []\n    return [root.val] + preorder(root.left) + preorder(root.right)`,
    },
  },
  {
    topicSlug: 'inorder-traversal',
    title: 'Inorder Traversal (Left -> Root -> Right)',
    definition:
      'Inorder traversal recursively visits the **left** subtree, then the **root** node, and finally the **right** subtree (`L-N-R`).',
    explanation:
      'In a Binary Search Tree (BST), inorder traversal visits all keys in **strictly non-decreasing sorted order** (`left <= root <= right`). For expression trees, it produces infix notation.',
    realWorldAnalogy:
      'Reading a sorted filing cabinet from left drawer to middle label to right drawer.',
    algorithm:
      '1. If `node == null`, return.\n2. Recurse `inorder(node.left)`.\n3. Visit/record `node.val`.\n4. Recurse `inorder(node.right)`.',
    pseudocode: `inorder(node):
    if node == null: return
    inorder(node.left)
    visit(node.val)
    inorder(node.right)`,
    dryRunExample:
      'Tree `1 -> (2 -> (4, 5), 3)`: Inorder = `[4, 2, 5, 1, 3]`.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(H) call stack (O(1) with Morris Traversal)',
    commonMistakes: [
      'Expecting inorder of a general binary tree (non-BST) to be sorted.',
    ],
    interviewTips: [
      'Mention Morris Inorder Traversal for `O(1)` auxiliary space by temporarily threading predecessors.',
    ],
    implementations: {
      c: `void inorder(const TreeNode* root) {\n    if (!root) return;\n    inorder(root->left);\n    printf("%d ", root->val);\n    inorder(root->right);\n}`,
      cpp: `void inorder(TreeNode* root, vector<int>& out) {\n    if (!root) return;\n    inorder(root->left, out);\n    out.push_back(root->val);\n    inorder(root->right, out);\n}`,
      java: `void inorder(TreeNode root, List<Integer> out) {\n    if (root == null) return;\n    inorder(root.left, out);\n    out.add(root.val);\n    inorder(root.right, out);\n}`,
      python: `def inorder(root: TreeNode | None) -> list[int]:\n    if not root: return []\n    return inorder(root.left) + [root.val] + inorder(root.right)`,
    },
  },
  {
    topicSlug: 'postorder-traversal',
    title: 'Postorder Traversal (Left -> Right -> Root)',
    definition:
      'Postorder traversal recursively visits the **left** subtree, then the **right** subtree, and finally processes the **root** node (`L-R-N`).',
    explanation:
      'Because children are completely processed before their parent, postorder is the natural order for bottom-up tree DP (height, diameter, balanced check), freeing/deleting a tree in C/C++, and evaluating postfix expressions.',
    realWorldAnalogy:
      'Demolishing a building from top floors downward, or calculating folder sizes by summing subfolders before reporting the parent folder’s total.',
    algorithm:
      '1. If `node == null`, return.\n2. Recurse `postorder(node.left)`.\n3. Recurse `postorder(node.right)`.\n4. Visit/record `node.val`.',
    pseudocode: `postorder(node):
    if node == null: return
    postorder(node.left)
    postorder(node.right)
    visit(node.val)`,
    dryRunExample:
      'Tree `1 -> (2 -> (4, 5), 3)`: Postorder = `[4, 5, 2, 3, 1]`.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(H) call stack',
    commonMistakes: [
      'Freeing `root` before `root->left` and `root->right` in C/C++ (use-after-free bug!).',
    ],
    interviewTips: [
      'Iterative postorder can be written cleanly by running modified preorder (`Root -> Right -> Left`) and reversing the output.',
    ],
    implementations: {
      c: `void postorder(const TreeNode* root) {\n    if (!root) return;\n    postorder(root->left);\n    postorder(root->right);\n    printf("%d ", root->val);\n}`,
      cpp: `void postorder(TreeNode* root, vector<int>& out) {\n    if (!root) return;\n    postorder(root->left, out);\n    postorder(root->right, out);\n    out.push_back(root->val);\n}`,
      java: `void postorder(TreeNode root, List<Integer> out) {\n    if (root == null) return;\n    postorder(root.left, out);\n    postorder(root.right, out);\n    out.add(root.val);\n}`,
      python: `def postorder(root: TreeNode | None) -> list[int]:\n    if not root: return []\n    return postorder(root.left) + postorder(root.right) + [root.val]`,
    },
  },
  {
    topicSlug: 'level-order-traversal',
    title: 'Level Order Traversal (Breadth-First Search)',
    definition:
      'Level order traversal visits a binary tree level by level from top to bottom and left to right within each level using a FIFO queue.',
    explanation:
      'At the start of each level, capture `levelSize = queue.size()`. Popping exactly `levelSize` nodes processes one complete level and enqueues all children for the next level.',
    realWorldAnalogy:
      'Printing a company org chart row by row: CEO first, then all VPs, then all Directors.',
    algorithm:
      '1. If `root == null`, return `[]`.\n2. Push `root` into `queue`.\n3. While `queue` is non-empty:\n   - `sz = queue.size()`, `level = []`\n   - Repeat `sz` times: pop `node`, append `node.val`, enqueue non-null `left` and `right`.\n   - Append `level` to `result`.',
    pseudocode: `if root == null: return []
q.push(root)
while q not empty:
    sz <- q.size()
    level <- []
    for i from 1 to sz:
        node <- q.pop()
        level.append(node.val)
        if node.left: q.push(node.left)
        if node.right: q.push(node.right)
    res.append(level)`,
    dryRunExample:
      'Tree `1 -> (2 -> (4, 5), 3)` -> `[[1], [2, 3], [4, 5]]`.',
    timeComplexity: 'O(N) — each node enqueued and dequeued once',
    spaceComplexity: 'O(W) where W is maximum width of the tree (up to N/2)',
    commonMistakes: [
      'Calling `q.size()` directly inside the `for` loop condition without caching it before pushing children.',
    ],
    interviewTips: [
      'Level order BFS is the foundation for Right View, Zigzag Traversal, and Minimum Depth of Binary Tree.',
    ],
    implementations: {
      c: `// Push root to circular/array queue, loop levelSize = tail - head per level`,
      cpp: `#include <queue>\n#include <vector>\nusing namespace std;\n\nvector<vector<int>> levelOrder(TreeNode* root) {\n    if (!root) return {};\n    vector<vector<int>> res;\n    queue<TreeNode*> q;\n    q.push(root);\n    while (!q.empty()) {\n        int sz = static_cast<int>(q.size());\n        vector<int> level;\n        while (sz--) {\n            TreeNode* cur = q.front(); q.pop();\n            level.push_back(cur->val);\n            if (cur->left) q.push(cur->left);\n            if (cur->right) q.push(cur->right);\n        }\n        res.push_back(move(level));\n    }\n    return res;\n}`,
      java: `import java.util.*;\n\npublic class LevelOrder {\n    public static List<List<Integer>> levelOrder(TreeNode root) {\n        List<List<Integer>> res = new ArrayList<>();\n        if (root == null) return res;\n        Queue<TreeNode> q = new ArrayDeque<>();\n        q.offer(root);\n        while (!q.isEmpty()) {\n            int sz = q.size();\n            List<Integer> level = new ArrayList<>(sz);\n            for (int i = 0; i < sz; i++) {\n                TreeNode cur = q.poll();\n                level.add(cur.val);\n                if (cur.left != null) q.offer(cur.left);\n                if (cur.right != null) q.offer(cur.right);\n            }\n            res.add(level);\n        }\n        return res;\n    }\n}`,
      python: `from collections import deque\n\ndef level_order(root: TreeNode | None) -> list[list[int]]:\n    if not root: return []\n    res, q = [], deque([root])\n    while q:\n        level = []\n        for _ in range(len(q)):\n            cur = q.popleft()\n            level.append(cur.val)\n            if cur.left: q.append(cur.left)\n            if cur.right: q.append(cur.right)\n        res.append(level)\n    return res`,
    },
  },
  {
    topicSlug: 'recursive-traversals',
    title: 'Recursive Tree Traversals (DFS Call Stack)',
    definition:
      'Recursive DFS traversals rely on the system call stack to visit every node in Preorder (`NLR`), Inorder (`LNR`), or Postorder (`LRN`) with minimal code.',
    explanation:
      'Every node is entered from its parent, delegates to `left`, returns, delegates to `right`, and returns to its parent. The only difference among Preorder, Inorder, and Postorder is **when** `node.val` is recorded along that Euler tour.',
    realWorldAnalogy:
      'Walking around the perimeter of a tree: touch the left side of a node (Preorder), bottom (Inorder), and right side (Postorder).',
    algorithm:
      '1. Base case: `if (!node) return;`.\n2. Place `visit(node)` before both calls (Preorder), between them (Inorder), or after both calls (Postorder).',
    pseudocode: `dfs(node):
    if node == null: return
    // Preorder position
    dfs(node.left)
    // Inorder position
    dfs(node.right)
    // Postorder position`,
    dryRunExample:
      'For a skewed chain of `10^5` nodes, recursive DFS uses `10^5` stack frames, which can trigger a stack overflow—requiring iterative traversal.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(H) call stack',
    commonMistakes: [
      'Using recursive traversal on very deep skewed trees (`N > 10^4`) where the call stack limit can overflow.',
    ],
    interviewTips: [
      'All three traversals can even be collected in a single recursive pass!',
    ],
    implementations: {},
  },
  {
    topicSlug: 'iterative-traversals',
    title: 'Iterative Tree Traversals (Explicit Stack)',
    definition:
      'Iterative traversals replace the recursive call stack with an explicit `stack` data structure to perform Preorder, Inorder, and Postorder in `O(N)` time without risking call-stack overflow.',
    explanation:
      '- **Iterative Preorder:** Push `root`, pop `cur`, visit `cur`, push `cur.right` then `cur.left`.\n- **Iterative Inorder:** Walk `cur = cur.left` pushing nodes onto `stack` until `null`, pop `cur`, visit `cur`, set `cur = cur.right`.\n- **Iterative Postorder:** Either use two stacks (push `left` then `right` on stack 1, reverse via stack 2) or track `lastVisited` with one stack.',
    realWorldAnalogy:
      'Keeping your own physical notepad (`stack`) of unfinished rooms to return to, rather than relying on memory.',
    algorithm:
      'Iterative Inorder:\n1. Initialize `cur = root`, empty `stack`.\n2. While `cur != null || !stack.empty()`:\n   - While `cur != null`: `stack.push(cur); cur = cur.left`.\n   - `cur = stack.pop()`, visit `cur.val`, `cur = cur.right`.',
    pseudocode: `cur <- root
while cur != null or not stack.empty():
    while cur != null:
        stack.push(cur); cur <- cur.left
    cur <- stack.pop()
    visit(cur.val)
    cur <- cur.right`,
    dryRunExample:
      'Inorder on `1 -> (2, 3)`: push `1`, push `2`, pop `2` (visit `2`), `cur=null`, pop `1` (visit `1`), `cur=3`, push `3`, pop `3` (visit `3`).',
    timeComplexity: 'O(N) — each node pushed and popped once',
    spaceComplexity: 'O(H) explicit stack',
    commonMistakes: [
      'Pushing `left` before `right` in iterative preorder (reverses left/right order).',
    ],
    interviewTips: [
      'Iterative Inorder is essential for BST iterators (`BSTIterator` LeetCode 173) and `Kth Smallest` early termination.',
    ],
    implementations: {
      c: `void iterInorder(TreeNode* root) {\n    TreeNode* st[1000]; int top = -1; TreeNode* cur = root;\n    while (cur || top >= 0) {\n        while (cur) { st[++top] = cur; cur = cur->left; }\n        cur = st[top--];\n        printf("%d ", cur->val);\n        cur = cur->right;\n    }\n}`,
      cpp: `#include <stack>\n#include <vector>\nusing namespace std;\n\nvector<int> iterativeInorder(TreeNode* root) {\n    vector<int> res; stack<TreeNode*> st; TreeNode* cur = root;\n    while (cur || !st.empty()) {\n        while (cur) { st.push(cur); cur = cur->left; }\n        cur = st.top(); st.pop();\n        res.push_back(cur->val);\n        cur = cur->right;\n    }\n    return res;\n}`,
      java: `import java.util.*;\n\npublic class IterativeTraversals {\n    public static List<Integer> inorder(TreeNode root) {\n        List<Integer> res = new ArrayList<>();\n        Deque<TreeNode> st = new ArrayDeque<>();\n        TreeNode cur = root;\n        while (cur != null || !st.isEmpty()) {\n            while (cur != null) { st.push(cur); cur = cur.left; }\n            cur = st.pop(); res.add(cur.val); cur = cur.right;\n        }\n        return res;\n    }\n}`,
      python: `def iterative_inorder(root: TreeNode | None) -> list[int]:\n    res, stack, cur = [], [], root\n    while cur or stack:\n        while cur:\n            stack.append(cur)\n            cur = cur.left\n        cur = stack.pop()\n        res.append(cur.val)\n        cur = cur.right\n    return res`,
    },
  },
  {
    topicSlug: 'height-of-tree',
    title: 'Height / Maximum Depth of a Binary Tree',
    definition:
      'The maximum depth (node-based height) of a binary tree is the number of nodes along the longest path from the root down to the farthest leaf.',
    explanation:
      'By postorder recursion, the height of a subtree rooted at `node` is `1 + max(height(node.left), height(node.right))`, with base case `height(null) = 0`. (If edge-based height is asked, base case is `-1`).',
    realWorldAnalogy:
      'Measuring the tallest branch of a family tree from the founder down to the youngest descendant.',
    algorithm:
      '1. If `root == null`, return `0`.\n2. Return `1 + max(maxDepth(root.left), maxDepth(root.right))`.',
    pseudocode: `maxDepth(node):
    if node == null: return 0
    return 1 + max(maxDepth(node.left), maxDepth(node.right))`,
    dryRunExample:
      'Tree `3 -> (9, 20 -> (15, 7))`: `height(9)=1`, `height(20)=1+max(1,1)=2`, `height(3)=1+max(1,2)=3`.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(H) recursion stack',
    commonMistakes: [
      'Confusing Minimum Depth (`min` with care for 1-child nodes!) with Maximum Depth.',
    ],
    interviewTips: [
      'This 3-line helper is reused inside Diameter, Balanced Binary Tree, and AVL height calculations.',
    ],
    implementations: {
      c: `int maxDepth(const TreeNode* root) {\n    if (!root) return 0;\n    int l = maxDepth(root->left), r = maxDepth(root->right);\n    return 1 + (l > r ? l : r);\n}`,
      cpp: `#include <algorithm>\nint maxDepth(TreeNode* root) {\n    if (!root) return 0;\n    return 1 + std::max(maxDepth(root->left), maxDepth(root->right));\n}`,
      java: `public class TreeHeight {\n    public static int maxDepth(TreeNode root) {\n        if (root == null) return 0;\n        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));\n    }\n}`,
      python: `def max_depth(root: TreeNode | None) -> int:\n    if not root: return 0\n    return 1 + max(max_depth(root.left), max_depth(root.right))`,
    },
  },
  {
    topicSlug: 'diameter-of-tree',
    title: 'Diameter of a Binary Tree',
    definition:
      'The diameter of a binary tree is the length (number of edges) of the longest path between any two nodes in the tree (which may or may not pass through the root).',
    explanation:
      'For every node `u`, the longest path that **turns** at `u` has edge length `height(u.left) + height(u.right)`. Computing heights bottom-up in a single postorder DFS while updating a global `best = max(best, lh + rh)` solves the problem in `O(N)` instead of `O(N^2)`.',
    realWorldAnalogy:
      'Finding the longest cable run between any two workstations in a tree-shaped office network.',
    algorithm:
      '1. Maintain `diameter = 0`.\n2. `depth(node)`: if `null`, return `0`; compute `lh = depth(left)`, `rh = depth(right)`; update `diameter = max(diameter, lh + rh)`; return `1 + max(lh, rh)`.\n3. Return `diameter`.',
    pseudocode: `diameter <- 0
depth(node):
    if node == null: return 0
    lh <- depth(node.left)
    rh <- depth(node.right)
    diameter <- max(diameter, lh + rh)
    return 1 + max(lh, rh)`,
    dryRunExample:
      'Tree `1 -> (2 -> (4, 5), 3)`: at node `2`, `lh=1, rh=1 -> 2`; at node `1`, `lh=2, rh=1 -> 3` (path `4-2-1-3`, 3 edges).',
    timeComplexity: 'O(N) — single postorder traversal',
    spaceComplexity: 'O(H) recursion stack',
    commonMistakes: [
      'Calling a separate `height()` function at every node (`O(N^2)` worst case).',
      'Assuming the diameter always passes through the root.',
    ],
    interviewTips: [
      'Clarify whether diameter is measured in **edges** (LeetCode 543: `lh + rh`) or **nodes** (`lh + rh + 1`).',
    ],
    implementations: {
      c: `static int diamDfs(const TreeNode* r, int* best) {\n    if (!r) return 0;\n    int lh = diamDfs(r->left, best), rh = diamDfs(r->right, best);\n    if (lh + rh > *best) *best = lh + rh;\n    return 1 + (lh > rh ? lh : rh);\n}\nint diameterOfBinaryTree(const TreeNode* root) {\n    int best = 0; diamDfs(root, &best); return best;\n}`,
      cpp: `#include <algorithm>\nint diamDfs(TreeNode* r, int& best) {\n    if (!r) return 0;\n    int lh = diamDfs(r->left, best), rh = diamDfs(r->right, best);\n    best = std::max(best, lh + rh);\n    return 1 + std::max(lh, rh);\n}\nint diameterOfBinaryTree(TreeNode* root) {\n    int best = 0; diamDfs(root, best); return best;\n}`,
      java: `public class DiameterTree {\n    private int best = 0;\n    public int diameterOfBinaryTree(TreeNode root) {\n        depth(root);\n        return best;\n    }\n    private int depth(TreeNode r) {\n        if (r == null) return 0;\n        int lh = depth(r.left), rh = depth(r.right);\n        best = Math.max(best, lh + rh);\n        return 1 + Math.max(lh, rh);\n    }\n}`,
      python: `def diameter_of_binary_tree(root: TreeNode | None) -> int:\n    best = 0\n    def depth(node: TreeNode | None) -> int:\n        nonlocal best\n        if not node: return 0\n        lh, rh = depth(node.left), depth(node.right)\n        best = max(best, lh + rh)\n        return 1 + max(lh, rh)\n    depth(root)\n    return best`,
    },
  },
  {
    topicSlug: 'balanced-binary-tree',
    title: 'Check Height-Balanced Binary Tree',
    definition:
      'A binary tree is height-balanced if for **every** node, the heights of its left and right subtrees differ by at most `1`.',
    explanation:
      'Use a bottom-up postorder DFS that returns `-1` immediately as a sentinel whenever any subtree is unbalanced. If `lh == -1`, `rh == -1`, or `abs(lh - rh) > 1`, propagate `-1` upward; otherwise return `1 + max(lh, rh)`. This avoids the `O(N^2)` top-down approach.',
    realWorldAnalogy:
      'Inspecting a mobile sculpture from the bottom hangers up: the moment one hanger is lopsided by more than 1 level, fail the whole sculpture immediately.',
    algorithm:
      '1. `check(node)`:\n   - If `null`, return `0`.\n   - `lh = check(node.left)`; if `lh == -1`, return `-1`.\n   - `rh = check(node.right)`; if `rh == -1`, return `-1`.\n   - If `abs(lh - rh) > 1`, return `-1`.\n   - Return `1 + max(lh, rh)`.\n2. Return `check(root) != -1`.',
    pseudocode: `check(node):
    if node == null: return 0
    lh <- check(node.left); if lh == -1: return -1
    rh <- check(node.right); if rh == -1: return -1
    if abs(lh - rh) > 1: return -1
    return 1 + max(lh, rh)`,
    dryRunExample:
      '`1 -> (2 -> (3 -> (4, null), null), 5)`: at `2`, `lh=2, rh=0`, `|2-0| = 2 > 1` -> returns `-1` -> `false`.',
    timeComplexity: 'O(N) — single bottom-up pass',
    spaceComplexity: 'O(H)',
    commonMistakes: [
      'Checking only `abs(height(root.left) - height(root.right)) <= 1` at the root without verifying every subtree.',
    ],
    interviewTips: [
      'This exact sentinel `-1` trick turns naive `O(N^2)` tree checks into clean `O(N)`.',
    ],
    implementations: {
      c: `#include <stdbool.h>\n#include <stdlib.h>\n\nstatic int balCheck(const TreeNode* r) {\n    if (!r) return 0;\n    int lh = balCheck(r->left); if (lh == -1) return -1;\n    int rh = balCheck(r->right); if (rh == -1) return -1;\n    if (abs(lh - rh) > 1) return -1;\n    return 1 + (lh > rh ? lh : rh);\n}\nbool isBalanced(const TreeNode* root) { return balCheck(root) != -1; }`,
      cpp: `#include <algorithm>\n#include <cmath>\nint balCheck(TreeNode* r) {\n    if (!r) return 0;\n    int lh = balCheck(r->left); if (lh == -1) return -1;\n    int rh = balCheck(r->right); if (rh == -1) return -1;\n    if (std::abs(lh - rh) > 1) return -1;\n    return 1 + std::max(lh, rh);\n}\nbool isBalanced(TreeNode* root) { return balCheck(root) != -1; }`,
      java: `public class BalancedTree {\n    public static boolean isBalanced(TreeNode root) { return check(root) != -1; }\n    private static int check(TreeNode r) {\n        if (r == null) return 0;\n        int lh = check(r.left); if (lh == -1) return -1;\n        int rh = check(r.right); if (rh == -1) return -1;\n        if (Math.abs(lh - rh) > 1) return -1;\n        return 1 + Math.max(lh, rh);\n    }\n}`,
      python: `def is_balanced(root: TreeNode | None) -> bool:\n    def check(node: TreeNode | None) -> int:\n        if not node: return 0\n        lh = check(node.left)\n        if lh == -1: return -1\n        rh = check(node.right)\n        if rh == -1: return -1\n        if abs(lh - rh) > 1: return -1\n        return 1 + max(lh, rh)\n    return check(root) != -1`,
    },
  },
  {
    topicSlug: 'left-view',
    title: 'Left View of a Binary Tree',
    definition:
      'The left view of a binary tree consists of the first (leftmost) node visible at every depth level when looking from the left side.',
    explanation:
      'Using BFS level order, take the node at index `i == 0` of each level. Equivalently, using DFS (`Root -> Left -> Right`) with `level`, whenever `level == result.size()`, this is the first time we have reached `level`, so append `node.val`.',
    realWorldAnalogy:
      'Standing to the left of a tree-shaped staircase and noting the first person standing on each floor.',
    algorithm:
      '1. Call `dfs(root, 0, res)`.\n2. If `node == null`, return.\n3. If `level == res.size()`, `res.push(node.val)`.\n4. Recurse `dfs(node.left, level + 1)` then `dfs(node.right, level + 1)`.',
    pseudocode: `dfs(node, level):
    if node == null: return
    if level == len(res): res.append(node.val)
    dfs(node.left, level + 1)
    dfs(node.right, level + 1)`,
    dryRunExample:
      'Tree `1 -> (2 -> (null, 4), 3)`: Left view = `[1, 2, 4]`.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(H) via DFS (or O(W) via BFS)',
    commonMistakes: [
      'Walking only `root -> left -> left...`, which misses nodes in the right subtree that extend deeper than the left subtree!',
    ],
    interviewTips: [
      'DFS with `level == res.size()` uses `O(H)` space instead of `O(W)` BFS queue.',
    ],
    implementations: {
      c: `void leftViewDfs(const TreeNode* r, int lvl, int* maxLvl) {\n    if (!r) return;\n    if (lvl > *maxLvl) { printf("%d ", r->val); *maxLvl = lvl; }\n    leftViewDfs(r->left, lvl + 1, maxLvl);\n    leftViewDfs(r->right, lvl + 1, maxLvl);\n}`,
      cpp: `#include <vector>\nusing namespace std;\nvoid leftViewDfs(TreeNode* r, int lvl, vector<int>& res) {\n    if (!r) return;\n    if (lvl == static_cast<int>(res.size())) res.push_back(r->val);\n    leftViewDfs(r->left, lvl + 1, res);\n    leftViewDfs(r->right, lvl + 1, res);\n}`,
      java: `import java.util.*;\npublic class LeftView {\n    public static List<Integer> leftView(TreeNode root) {\n        List<Integer> res = new ArrayList<>();\n        dfs(root, 0, res);\n        return res;\n    }\n    private static void dfs(TreeNode r, int lvl, List<Integer> res) {\n        if (r == null) return;\n        if (lvl == res.size()) res.add(r.val);\n        dfs(r.left, lvl + 1, res);\n        dfs(r.right, lvl + 1, res);\n    }\n}`,
      python: `def left_view(root: TreeNode | None) -> list[int]:\n    res = []\n    def dfs(node: TreeNode | None, lvl: int) -> None:\n        if not node: return\n        if lvl == len(res): res.append(node.val)\n        dfs(node.left, lvl + 1)\n        dfs(node.right, lvl + 1)\n    dfs(root, 0)\n    return res`,
    },
  },
  {
    topicSlug: 'right-view',
    title: 'Right View of a Binary Tree',
    definition:
      'The right view of a binary tree consists of the last (rightmost) node visible at every depth level when looking from the right side.',
    explanation:
      'Mirror of Left View: either take the last node of each BFS level, or run DFS in `Root -> Right -> Left` order and record `node.val` whenever `level == res.size()`.',
    realWorldAnalogy:
      'Standing to the right of a tree-shaped apartment building and seeing only the rightmost lit window on each floor.',
    algorithm:
      '1. Run `dfs(root, 0, res)`.\n2. If `level == res.size()`, append `node.val`.\n3. Recurse `node.right` **before** `node.left`.',
    pseudocode: `dfs(node, level):
    if node == null: return
    if level == len(res): res.append(node.val)
    dfs(node.right, level + 1)
    dfs(node.left, level + 1)`,
    dryRunExample:
      'Tree `1 -> (2 -> (null, 5), 3 -> (null, 4))`: Right view = `[1, 3, 4]`.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(H) via DFS',
    commonMistakes: [
      'Walking only `root.right` and missing deeper nodes in the left subtree.',
    ],
    interviewTips: [
      'Flipping `left`/`right` order in DFS is the cleanest 1-line difference between Left View and Right View.',
    ],
    implementations: {
      c: `void rightViewDfs(const TreeNode* r, int lvl, int* maxLvl) {\n    if (!r) return;\n    if (lvl > *maxLvl) { printf("%d ", r->val); *maxLvl = lvl; }\n    rightViewDfs(r->right, lvl + 1, maxLvl);\n    rightViewDfs(r->left, lvl + 1, maxLvl);\n}`,
      cpp: `#include <vector>\nusing namespace std;\nvoid rightViewDfs(TreeNode* r, int lvl, vector<int>& res) {\n    if (!r) return;\n    if (lvl == static_cast<int>(res.size())) res.push_back(r->val);\n    rightViewDfs(r->right, lvl + 1, res);\n    rightViewDfs(r->left, lvl + 1, res);\n}`,
      java: `import java.util.*;\npublic class RightView {\n    public static List<Integer> rightSideView(TreeNode root) {\n        List<Integer> res = new ArrayList<>();\n        dfs(root, 0, res);\n        return res;\n    }\n    private static void dfs(TreeNode r, int lvl, List<Integer> res) {\n        if (r == null) return;\n        if (lvl == res.size()) res.add(r.val);\n        dfs(r.right, lvl + 1, res);\n        dfs(r.left, lvl + 1, res);\n    }\n}`,
      python: `def right_side_view(root: TreeNode | None) -> list[int]:\n    res = []\n    def dfs(node: TreeNode | None, lvl: int) -> None:\n        if not node: return\n        if lvl == len(res): res.append(node.val)\n        dfs(node.right, lvl + 1)\n        dfs(node.left, lvl + 1)\n    dfs(root, 0)\n    return res`,
    },
  },
  {
    topicSlug: 'top-view',
    title: 'Top View of a Binary Tree',
    definition:
      'The top view of a binary tree prints the first (highest/shallowest) node encountered at each horizontal distance (`hd`) from the root, ordered from leftmost `hd` to rightmost `hd`.',
    explanation:
      'Assign root horizontal distance `hd = 0`; going left gives `hd - 1`, going right gives `hd + 1`. Use BFS (level order) so shallower nodes always arrive before deeper nodes at the same `hd`: only insert `hd -> node.val` into the map if `hd` is not already present.',
    realWorldAnalogy:
      'Looking straight down from a drone over a tree: higher branches block lower branches directly beneath them in the same vertical column.',
    algorithm:
      '1. Enqueue `(root, 0)` in a BFS queue.\n2. Maintain `map<int, int> firstAtHd` (or track `minHd`, `maxHd` with a hash map).\n3. Pop `(node, hd)`: if `hd` not in map, store `firstAtHd[hd] = node.val`.\n4. Enqueue `(node.left, hd - 1)` and `(node.right, hd + 1)`.\n5. Output values from `minHd` to `maxHd`.',
    pseudocode: `q.push((root, 0))
while q not empty:
    (node, hd) <- q.pop()
    if hd not in firstAtHd: firstAtHd[hd] <- node.val
    if node.left: q.push((node.left, hd - 1))
    if node.right: q.push((node.right, hd + 1))`,
    dryRunExample:
      'Tree `1 -> (2 -> (4, 5), 3)`: `hd(4)=-2`, `hd(2)=-1`, `hd(1)=0`, `hd(3)=1` (`5` at `hd=0` is hidden by `1`). Top view = `[4, 2, 1, 3]`.',
    timeComplexity: 'O(N log N) with ordered map, or O(N) with hash map + minHd..maxHd',
    spaceComplexity: 'O(N)',
    commonMistakes: [
      'Using plain DFS without tracking depth (a deep left-branch node can arrive before a shallower right-branch node at the same `hd`!).',
    ],
    interviewTips: [
      'Prefer BFS over DFS for Top View and Bottom View because BFS guarantees level-by-level arrival.',
    ],
    implementations: {
      c: `// BFS with (TreeNode*, hd) pairs and minHd/maxHd array offset`,
      cpp: `#include <map>\n#include <queue>\n#include <vector>\nusing namespace std;\n\nvector<int> topView(TreeNode* root) {\n    if (!root) return {};\n    map<int, int> mp;\n    queue<pair<TreeNode*, int>> q;\n    q.push({root, 0});\n    while (!q.empty()) {\n        auto [node, hd] = q.front(); q.pop();\n        if (!mp.count(hd)) mp[hd] = node->val;\n        if (node->left) q.push({node->left, hd - 1});\n        if (node->right) q.push({node->right, hd + 1});\n    }\n    vector<int> res;\n    for (auto& [hd, val] : mp) res.push_back(val);\n    return res;\n}`,
      java: `import java.util.*;\npublic class TopView {\n    public static List<Integer> topView(TreeNode root) {\n        List<Integer> res = new ArrayList<>();\n        if (root == null) return res;\n        TreeMap<Integer, Integer> mp = new TreeMap<>();\n        Queue<Map.Entry<TreeNode, Integer>> q = new ArrayDeque<>();\n        q.offer(Map.entry(root, 0));\n        while (!q.isEmpty()) {\n            var e = q.poll(); TreeNode n = e.getKey(); int hd = e.getValue();\n            mp.putIfAbsent(hd, n.val);\n            if (n.left != null) q.offer(Map.entry(n.left, hd - 1));\n            if (n.right != null) q.offer(Map.entry(n.right, hd + 1));\n        }\n        res.addAll(mp.values());\n        return res;\n    }\n}`,
      python: `from collections import deque\n\ndef top_view(root: TreeNode | None) -> list[int]:\n    if not root: return []\n    mp, q = {}, deque([(root, 0)])\n    while q:\n        node, hd = q.popleft()\n        if hd not in mp: mp[hd] = node.val\n        if node.left: q.append((node.left, hd - 1))\n        if node.right: q.append((node.right, hd + 1))\n    return [mp[hd] for hd in sorted(mp)]`,
    },
  },
  {
    topicSlug: 'bottom-view',
    title: 'Bottom View of a Binary Tree',
    definition:
      'The bottom view of a binary tree prints the **last** (deepest, and rightmost in ties) node at each horizontal distance `hd`, ordered from leftmost `hd` to rightmost `hd`.',
    explanation:
      'Identical to Top View BFS, except we **always overwrite** `mp[hd] = node.val` on every visit. Because BFS visits shallower levels before deeper levels and left before right on the same level, the final value remaining at `mp[hd]` is the bottom-most (and rightmost on tie) node.',
    realWorldAnalogy:
      'Looking up from underneath a tree: lower branches block higher branches in the same vertical column.',
    algorithm:
      '1. Run BFS with `(node, hd)` starting at `(root, 0)`.\n2. Always set `mp[hd] = node.val`.\n3. Enqueue `(left, hd - 1)` and `(right, hd + 1)`.\n4. Return `mp` values sorted by `hd`.',
    pseudocode: `q.push((root, 0))
while q not empty:
    (node, hd) <- q.pop()
    mp[hd] <- node.val   // overwrite!
    if node.left: q.push((node.left, hd - 1))
    if node.right: q.push((node.right, hd + 1))`,
    dryRunExample:
      'Tree `1 -> (2 -> (4, 5), 3)`: `5` overwrites `1` at `hd=0`. Bottom view = `[4, 2, 5, 3]`.',
    timeComplexity: 'O(N log N) (or O(N) with min/max bounds)',
    spaceComplexity: 'O(N)',
    commonMistakes: [
      'Using `putIfAbsent` (gives Top View) instead of overwriting `mp[hd] = node.val`.',
    ],
    interviewTips: [
      'Highlight the 1-line contrast with Top View: Top View keeps the first visit per `hd`; Bottom View overwrites with the latest visit.',
    ],
    implementations: {
      c: `// Same BFS structure as Top View, overwriting lastAtHd[hd] = node->val`,
      cpp: `#include <map>\n#include <queue>\n#include <vector>\nusing namespace std;\n\nvector<int> bottomView(TreeNode* root) {\n    if (!root) return {};\n    map<int, int> mp;\n    queue<pair<TreeNode*, int>> q;\n    q.push({root, 0});\n    while (!q.empty()) {\n        auto [node, hd] = q.front(); q.pop();\n        mp[hd] = node->val;\n        if (node->left) q.push({node->left, hd - 1});\n        if (node->right) q.push({node->right, hd + 1});\n    }\n    vector<int> res;\n    for (auto& [hd, val] : mp) res.push_back(val);\n    return res;\n}`,
      java: `import java.util.*;\npublic class BottomView {\n    public static List<Integer> bottomView(TreeNode root) {\n        List<Integer> res = new ArrayList<>();\n        if (root == null) return res;\n        TreeMap<Integer, Integer> mp = new TreeMap<>();\n        Queue<Map.Entry<TreeNode, Integer>> q = new ArrayDeque<>();\n        q.offer(Map.entry(root, 0));\n        while (!q.isEmpty()) {\n            var e = q.poll(); TreeNode n = e.getKey(); int hd = e.getValue();\n            mp.put(hd, n.val);\n            if (n.left != null) q.offer(Map.entry(n.left, hd - 1));\n            if (n.right != null) q.offer(Map.entry(n.right, hd + 1));\n        }\n        res.addAll(mp.values());\n        return res;\n    }\n}`,
      python: `from collections import deque\n\ndef bottom_view(root: TreeNode | None) -> list[int]:\n    if not root: return []\n    mp, q = {}, deque([(root, 0)])\n    while q:\n        node, hd = q.popleft()\n        mp[hd] = node.val\n        if node.left: q.append((node.left, hd - 1))\n        if node.right: q.append((node.right, hd + 1))\n    return [mp[hd] for hd in sorted(mp)]`,
    },
  },
  {
    topicSlug: 'boundary-traversal',
    title: 'Boundary Traversal (Anticlockwise)',
    definition:
      'Boundary traversal prints the outer perimeter of a binary tree anticlockwise in 3 parts: (1) root + left boundary (excluding leaves), (2) all leaves left-to-right, and (3) right boundary bottom-up (excluding leaves and root).',
    explanation:
      'Separating leaves from the left/right boundaries prevents leaf nodes from being printed twice. On the left boundary, go `left` if available else `right` (stop before leaves). On the right boundary, go `right` if available else `left` and reverse the collected values.',
    realWorldAnalogy:
      'Walking around the outer fence of a treehouse village: down the left edge, across the bottom row of houses, and back up the right edge.',
    algorithm:
      '1. If `!isLeaf(root)`, add `root.val`.\n2. Walk left boundary from `root.left` (prefer `left`, else `right`) while `!isLeaf(cur)`.\n3. Run DFS to collect all leaves left-to-right.\n4. Walk right boundary from `root.right` (prefer `right`, else `left`) while `!isLeaf(cur)`, then append in reverse.',
    pseudocode: `if not isLeaf(root): res.append(root.val)
addLeftBoundary(root.left)     // non-leaves, top-down
addLeaves(root)                // all leaves, left-to-right
addRightBoundaryRev(root.right) // non-leaves, bottom-up`,
    dryRunExample:
      'Tree `1 -> (2 -> (4, 5), 3 -> (6, 7))`: Root `[1]`, Left `[2]`, Leaves `[4, 5, 6, 7]`, Right `[3]` -> `[1, 2, 4, 5, 6, 7, 3]`.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(H)',
    commonMistakes: [
      'Double-counting `root` when `root` itself is a leaf (single-node tree).',
      'Double-counting corner leaves in both left/right boundaries and the leaves pass.',
    ],
    interviewTips: [
      'Always write a small `isLeaf(node)` helper and exclude leaves from both boundary walks.',
    ],
    implementations: {
      c: `// Split into isLeaf(), addLeftBoundary(), addLeaves(), addRightBoundaryRev()`,
      cpp: `#include <vector>\nusing namespace std;\n\nstatic bool isLeaf(TreeNode* n) { return n && !n->left && !n->right; }\nstatic void addLeaves(TreeNode* r, vector<int>& res) {\n    if (!r) return;\n    if (isLeaf(r)) { res.push_back(r->val); return; }\n    addLeaves(r->left, res); addLeaves(r->right, res);\n}\nvector<int> boundaryOfBinaryTree(TreeNode* root) {\n    if (!root) return {};\n    vector<int> res;\n    if (!isLeaf(root)) res.push_back(root->val);\n    for (TreeNode* cur = root->left; cur && !isLeaf(cur); cur = cur->left ? cur->left : cur->right)\n        res.push_back(cur->val);\n    addLeaves(root, res);\n    vector<int> rightPart;\n    for (TreeNode* cur = root->right; cur && !isLeaf(cur); cur = cur->right ? cur->right : cur->left)\n        rightPart.push_back(cur->val);\n    for (int i = static_cast<int>(rightPart.size()) - 1; i >= 0; --i) res.push_back(rightPart[i]);\n    return res;\n}`,
      java: `import java.util.*;\npublic class BoundaryTraversal {\n    private static boolean isLeaf(TreeNode n) { return n != null && n.left == null && n.right == null; }\n    private static void addLeaves(TreeNode r, List<Integer> res) {\n        if (r == null) return;\n        if (isLeaf(r)) { res.add(r.val); return; }\n        addLeaves(r.left, res); addLeaves(r.right, res);\n    }\n    public static List<Integer> boundary(TreeNode root) {\n        List<Integer> res = new ArrayList<>();\n        if (root == null) return res;\n        if (!isLeaf(root)) res.add(root.val);\n        for (TreeNode c = root.left; c != null && !isLeaf(c); c = c.left != null ? c.left : c.right) res.add(c.val);\n        addLeaves(root, res);\n        List<Integer> rt = new ArrayList<>();\n        for (TreeNode c = root.right; c != null && !isLeaf(c); c = c.right != null ? c.right : c.left) rt.add(c.val);\n        for (int i = rt.size() - 1; i >= 0; i--) res.add(rt.get(i));\n        return res;\n    }\n}`,
      python: `def boundary_of_binary_tree(root: TreeNode | None) -> list[int]:\n    if not root: return []\n    is_leaf = lambda n: n is not None and not n.left and not n.right\n    res = [] if is_leaf(root) else [root.val]\n    cur = root.left\n    while cur and not is_leaf(cur):\n        res.append(cur.val)\n        cur = cur.left or cur.right\n    def add_leaves(n: TreeNode | None) -> None:\n        if not n: return\n        if is_leaf(n): res.append(n.val); return\n        add_leaves(n.left); add_leaves(n.right)\n    add_leaves(root)\n    rt, cur = [], root.right\n    while cur and not is_leaf(cur):\n        rt.append(cur.val)\n        cur = cur.right or cur.left\n    return res + rt[::-1]`,
    },
  },
];

export default modules16to17Notes;
