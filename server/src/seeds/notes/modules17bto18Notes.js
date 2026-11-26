// Rich original learning notes for Module 17 Part 2 (Trees, 15 concepts) & Module 18 (Heaps & Priority Queues, 14 concepts)

const modules17bto18Notes = [
  // =========================================================================
  // MODULE 17: TREES — PART 2 (Concepts 17–31)
  // =========================================================================
  {
    topicSlug: 'zigzag-traversal',
    title: 'Zigzag (Spiral) Level Order Traversal',
    definition:
      'Zigzag level order traversal visits a binary tree level by level, alternating left-to-right on even levels (`0, 2, ...`) and right-to-left on odd levels (`1, 3, ...`).',
    explanation:
      'Run standard BFS with a queue, pre-allocating a `level` array of size `sz`. If `leftToRight` is true, place the `i`-th popped node at `level[i]`; otherwise place it at `level[sz - 1 - i]`. Always enqueue children left-to-right so the underlying BFS order stays simple.',
    realWorldAnalogy:
      'Plowing a field in alternating sweeps: left-to-right on row 0, right-to-left on row 1, left-to-right on row 2.',
    algorithm:
      '1. Enqueue `root`; set `leftToRight = true`.\n2. While queue non-empty:\n   - `sz = q.size()`, allocate `level[sz]`.\n   - For `i` from `0` to `sz - 1`: pop `cur`, set `idx = leftToRight ? i : sz - 1 - i`, `level[idx] = cur.val`, enqueue `left` and `right`.\n   - Flip `leftToRight = !leftToRight`; append `level`.',
    pseudocode: `leftToRight <- true
while q not empty:
    sz <- q.size(); level <- array of size sz
    for i from 0 to sz - 1:
        cur <- q.pop()
        idx <- i if leftToRight else (sz - 1 - i)
        level[idx] <- cur.val
        if cur.left: q.push(cur.left)
        if cur.right: q.push(cur.right)
    leftToRight <- not leftToRight
    res.append(level)`,
    dryRunExample:
      'Tree `3 -> (9, 20 -> (15, 7))`: Level 0 `[3]`, Level 1 `[20, 9]`, Level 2 `[15, 7]`.',
    timeComplexity: 'O(N) — no reversal needed with direct index placement',
    spaceComplexity: 'O(W) queue + output',
    commonMistakes: [
      'Changing the order children are pushed into the queue without switching to a deque (breaks level order).',
    ],
    interviewTips: [
      'Pre-sizing `level[sz]` and writing to `sz - 1 - i` avoids an extra `reverse()` pass.',
    ],
    implementations: {
      c: `// Use standard BFS queue and write level[leftToRight ? i : sz - 1 - i]`,
      cpp: `#include <queue>\n#include <vector>\nusing namespace std;\n\nvector<vector<int>> zigzagLevelOrder(TreeNode* root) {\n    if (!root) return {};\n    vector<vector<int>> res; queue<TreeNode*> q; q.push(root); bool ltr = true;\n    while (!q.empty()) {\n        int sz = static_cast<int>(q.size());\n        vector<int> lvl(sz);\n        for (int i = 0; i < sz; ++i) {\n            TreeNode* c = q.front(); q.pop();\n            lvl[ltr ? i : sz - 1 - i] = c->val;\n            if (c->left) q.push(c->left);\n            if (c->right) q.push(c->right);\n        }\n        ltr = !ltr; res.push_back(move(lvl));\n    }\n    return res;\n}`,
      java: `import java.util.*;\npublic class ZigzagTraversal {\n    public static List<List<Integer>> zigzag(TreeNode root) {\n        List<List<Integer>> res = new ArrayList<>();\n        if (root == null) return res;\n        Queue<TreeNode> q = new ArrayDeque<>(); q.offer(root); boolean ltr = true;\n        while (!q.isEmpty()) {\n            int sz = q.size(); Integer[] lvl = new Integer[sz];\n            for (int i = 0; i < sz; i++) {\n                TreeNode c = q.poll();\n                lvl[ltr ? i : sz - 1 - i] = c.val;\n                if (c.left != null) q.offer(c.left);\n                if (c.right != null) q.offer(c.right);\n            }\n            ltr = !ltr; res.add(Arrays.asList(lvl));\n        }\n        return res;\n    }\n}`,
      python: `from collections import deque\ndef zigzag_level_order(root: TreeNode | None) -> list[list[int]]:\n    if not root: return []\n    res, q, ltr = [], deque([root]), True\n    while q:\n        sz = len(q); lvl = [0] * sz\n        for i in range(sz):\n            c = q.popleft()\n            lvl[i if ltr else sz - 1 - i] = c.val\n            if c.left: q.append(c.left)\n            if c.right: q.append(c.right)\n        ltr = not ltr; res.append(lvl)\n    return res`,
    },
  },
  {
    topicSlug: 'vertical-order-traversal',
    title: 'Vertical Order Traversal',
    definition:
      'Vertical order traversal groups nodes by `(col, row)` coordinates (`root = (0,0)`, `left = (col-1, row+1)`, `right = (col+1, row+1)`), ordering columns left-to-right, rows top-to-bottom, and sorting ties at the same `(col, row)` by node value.',
    explanation:
      'Assign `(col, row)` to every node via BFS or DFS. Store tuples `(col, row, val)` and sort—or maintain `map<int, map<int, multiset<int>>>`—so nodes in the same column are sorted primarily by `row` and secondarily by `val` (LeetCode 987 tie-breaking rule).',
    realWorldAnalogy:
      'Plotting every tree node on a 2D coordinate grid and reading down each vertical grid line from left to right.',
    algorithm:
      '1. Traverse tree collecting `(col, row, node.val)`.\n2. Sort tuples by `(col, row, val)`.\n3. Group consecutive tuples with the same `col` into column lists.',
    pseudocode: `collect(node, row, col):
    if node == null: return
    nodes.append((col, row, node.val))
    collect(node.left, row + 1, col - 1)
    collect(node.right, row + 1, col + 1)
sort(nodes) and group by col`,
    dryRunExample:
      'Tree `3 -> (9, 20 -> (15, 7))`: `9` at `(-1,1)`, `3` at `(0,0)`, `15` at `(0,2)`, `20` at `(1,1)`, `7` at `(2,2)` -> `[[9], [3, 15], [20], [7]]`.',
    timeComplexity: 'O(N log N) due to sorting coordinates/values',
    spaceComplexity: 'O(N)',
    commonMistakes: [
      'Forgetting to sort by `val` when two nodes share the exact same `(col, row)`.',
    ],
    interviewTips: [
      'Collecting `(col, row, val)` tuples and sorting once is much simpler and less bug-prone than nested `TreeMap<Integer, TreeMap<Integer, PriorityQueue<Integer>>>`.',
    ],
    implementations: {
      c: `// Collect (col, row, val) structs and qsort by col, then row, then val`,
      cpp: `#include <algorithm>\n#include <tuple>\n#include <vector>\nusing namespace std;\n\nvoid collectVert(TreeNode* r, int row, int col, vector<tuple<int,int,int>>& pts) {\n    if (!r) return;\n    pts.emplace_back(col, row, r->val);\n    collectVert(r->left, row + 1, col - 1, pts);\n    collectVert(r->right, row + 1, col + 1, pts);\n}\nvector<vector<int>> verticalTraversal(TreeNode* root) {\n    vector<tuple<int,int,int>> pts;\n    collectVert(root, 0, 0, pts);\n    sort(pts.begin(), pts.end());\n    vector<vector<int>> res;\n    int prevCol = INT_MIN;\n    for (auto& [c, r, v] : pts) {\n        if (c != prevCol) { res.emplace_back(); prevCol = c; }\n        res.back().push_back(v);\n    }\n    return res;\n}`,
      java: `import java.util.*;\npublic class VerticalOrder {\n    public static List<List<Integer>> verticalTraversal(TreeNode root) {\n        List<int[]> pts = new ArrayList<>();\n        dfs(root, 0, 0, pts);\n        pts.sort((a, b) -> a[0] != b[0] ? a[0] - b[0] : (a[1] != b[1] ? a[1] - b[1] : a[2] - b[2]));\n        List<List<Integer>> res = new ArrayList<>();\n        int prevCol = Integer.MIN_VALUE;\n        for (int[] p : pts) {\n            if (p[0] != prevCol) { res.add(new ArrayList<>()); prevCol = p[0]; }\n            res.get(res.size() - 1).add(p[2]);\n        }\n        return res;\n    }\n    private static void dfs(TreeNode r, int row, int col, List<int[]> pts) {\n        if (r == null) return;\n        pts.add(new int[]{col, row, r.val});\n        dfs(r.left, row + 1, col - 1, pts);\n        dfs(r.right, row + 1, col + 1, pts);\n    }\n}`,
      python: `def vertical_traversal(root: TreeNode | None) -> list[list[int]]:\n    pts = []\n    def dfs(n: TreeNode | None, r: int, c: int) -> None:\n        if not n: return\n        pts.append((c, r, n.val))\n        dfs(n.left, r + 1, c - 1); dfs(n.right, r + 1, c + 1)\n    dfs(root, 0, 0)\n    pts.sort()\n    res, prev_c = [], None\n    for c, r, v in pts:\n        if c != prev_c: res.append([]); prev_c = c\n        res[-1].append(v)\n    return res`,
    },
  },
  {
    topicSlug: 'lowest-common-ancestor',
    title: 'Lowest Common Ancestor (LCA) in a Binary Tree',
    definition:
      'The Lowest Common Ancestor (LCA) of two nodes `p` and `q` in a rooted tree is the deepest node `T` that has both `p` and `q` as descendants (where a node can be a descendant of itself).',
    explanation:
      'In a general binary tree, run postorder DFS: if `root == null || root == p || root == q`, return `root`. Recursively search `left = lca(root.left)` and `right = lca(root.right)`. If both `left` and `right` are non-null, `p` and `q` lie in opposite subtrees, so `root` is their LCA! Otherwise return whichever of `left` or `right` is non-null.',
    realWorldAnalogy:
      'Finding the most recent common manager of two employees in a company org chart.',
    algorithm:
      '1. Base case: if `!root || root == p || root == q`, return `root`.\n2. `left = lca(root.left, p, q)`, `right = lca(root.right, p, q)`.\n3. If `left && right`, return `root`.\n4. Return `left ? left : right`.',
    pseudocode: `lca(root, p, q):
    if root == null or root == p or root == q: return root
    left <- lca(root.left, p, q)
    right <- lca(root.right, p, q)
    if left != null and right != null: return root
    return left if left != null else right`,
    dryRunExample:
      'Tree `3 -> (5 -> (6, 2), 1)`: `lca(3, 6, 2)`: left at `5` returns `6`, right at `5` returns `2` -> both non-null -> returns `5`.',
    timeComplexity: 'O(N) in general binary tree (O(H) in a BST)',
    spaceComplexity: 'O(H) recursion stack',
    commonMistakes: [
      'Assuming both `p` and `q` are guaranteed to exist without checking if the problem allows one to be missing.',
    ],
    interviewTips: [
      'In a **BST**, LCA is even faster (`O(H)` time, `O(1)` iterative space): walk left if both `< root.val`, right if both `> root.val`, else `root` is the split point!',
    ],
    implementations: {
      c: `TreeNode* lca(TreeNode* root, TreeNode* p, TreeNode* q) {\n    if (!root || root == p || root == q) return root;\n    TreeNode* l = lca(root->left, p, q);\n    TreeNode* r = lca(root->right, p, q);\n    if (l && r) return root;\n    return l ? l : r;\n}`,
      cpp: `TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n    if (!root || root == p || root == q) return root;\n    TreeNode* l = lowestCommonAncestor(root->left, p, q);\n    TreeNode* r = lowestCommonAncestor(root->right, p, q);\n    if (l && r) return root;\n    return l ? l : r;\n}`,
      java: `public class LCA {\n    public static TreeNode lca(TreeNode root, TreeNode p, TreeNode q) {\n        if (root == null || root == p || root == q) return root;\n        TreeNode l = lca(root.left, p, q), r = lca(root.right, p, q);\n        if (l != null && r != null) return root;\n        return l != null ? l : r;\n    }\n}`,
      python: `def lowest_common_ancestor(root: TreeNode | None, p: TreeNode, q: TreeNode) -> TreeNode | None:\n    if not root or root is p or root is q:\n        return root\n    l = lowest_common_ancestor(root.left, p, q)\n    r = lowest_common_ancestor(root.right, p, q)\n    if l and r:\n        return root\n    return l or r`,
    },
  },
  {
    topicSlug: 'maximum-path-sum',
    title: 'Binary Tree Maximum Path Sum',
    definition:
      'Find the maximum sum of values along any non-empty simple path between any two nodes in a binary tree (node values may be negative).',
    explanation:
      'At each node `u`, there are two distinct quantities: (1) the best **arch** path turning at `u` (`u.val + leftGain + rightGain`), which updates the global `best`, and (2) the best **single-branch** gain `u.val + max(leftGain, rightGain)` returned upward to `u`’s parent. Negative branch gains are clamped to `0` (`max(0, dfs(child))`) because including a negative branch only lowers the sum.',
    realWorldAnalogy:
      'Finding the most profitable connected route in a mine tunnel network where some chambers have positive gold and others have tolls (negative values).',
    algorithm:
      '1. Initialize `best = -INF`.\n2. `maxGain(node)`:\n   - If `null`, return `0`.\n   - `lg = max(0, maxGain(node.left))`, `rg = max(0, maxGain(node.right))`.\n   - `best = max(best, node.val + lg + rg)`.\n   - Return `node.val + max(lg, rg)`.\n3. Return `best`.',
    pseudocode: `best <- -INF
maxGain(node):
    if node == null: return 0
    lg <- max(0, maxGain(node.left))
    rg <- max(0, maxGain(node.right))
    best <- max(best, node.val + lg + rg)
    return node.val + max(lg, rg)`,
    dryRunExample:
      'Tree `-10 -> (9, 20 -> (15, 7))`: at `20`, `lg=15, rg=7`, `best = 20 + 15 + 7 = 42`. Returns `42`.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(H)',
    commonMistakes: [
      'Initializing `best = 0` (fails when all node values are negative, e.g. `[-3]` -> answer is `-3`, not `0`).',
      'Returning `node.val + lg + rg` to the parent instead of `node.val + max(lg, rg)` (creates a forked non-simple path!).',
    ],
    interviewTips: [
      'This is the weighted generalization of Diameter of a Binary Tree.',
    ],
    implementations: {
      c: `#include <limits.h>\nstatic int mpsDfs(const TreeNode* r, int* best) {\n    if (!r) return 0;\n    int lg = mpsDfs(r->left, best); if (lg < 0) lg = 0;\n    int rg = mpsDfs(r->right, best); if (rg < 0) rg = 0;\n    if (r->val + lg + rg > *best) *best = r->val + lg + rg;\n    return r->val + (lg > rg ? lg : rg);\n}\nint maxPathSum(const TreeNode* root) { int best = INT_MIN; mpsDfs(root, &best); return best; }`,
      cpp: `#include <algorithm>\n#include <climits>\nint mpsDfs(TreeNode* r, int& best) {\n    if (!r) return 0;\n    int lg = std::max(0, mpsDfs(r->left, best));\n    int rg = std::max(0, mpsDfs(r->right, best));\n    best = std::max(best, r->val + lg + rg);\n    return r->val + std::max(lg, rg);\n}\nint maxPathSum(TreeNode* root) { int best = INT_MIN; mpsDfs(root, best); return best; }`,
      java: `public class MaxPathSum {\n    private int best = Integer.MIN_VALUE;\n    public int maxPathSum(TreeNode root) { gain(root); return best; }\n    private int gain(TreeNode r) {\n        if (r == null) return 0;\n        int lg = Math.max(0, gain(r.left)), rg = Math.max(0, gain(r.right));\n        best = Math.max(best, r.val + lg + rg);\n        return r.val + Math.max(lg, rg);\n    }\n}`,
      python: `def max_path_sum(root: TreeNode | None) -> int:\n    best = float('-inf')\n    def gain(n: TreeNode | None) -> int:\n        nonlocal best\n        if not n: return 0\n        lg = max(0, gain(n.left)); rg = max(0, gain(n.right))\n        best = max(best, n.val + lg + rg)\n        return n.val + max(lg, rg)\n    gain(root)\n    return int(best)`,
    },
  },
  {
    topicSlug: 'serialize-and-deserialize',
    title: 'Serialize and Deserialize Binary Tree',
    definition:
      'Serialization converts a binary tree into a string/byte sequence (preserving `null` markers), and deserialization reconstructs the exact original tree structure from that string.',
    explanation:
      'A single Preorder (or Level-order BFS) traversal **with explicit `#` markers for `null` children** uniquely determines the tree—no second traversal (like Inorder) is needed, and duplicate node values are handled cleanly.',
    realWorldAnalogy:
      'Saving a binary tree to a text file over a network and rebuilding the exact same pointer structure on another machine.',
    algorithm:
      '1. **Serialize (Preorder):** if `null`, append `"#,"`; else append `val + ","`, recurse `left`, recurse `right`.\n2. **Deserialize:** split tokens into a queue/iterator; read next token `tok`: if `tok == "#"`, return `null`; else create `Node(stoi(tok))`, set `node.left = build()`, `node.right = build()`, return `node`.',
    pseudocode: `serialize(node):
    if node == null: return "#,"
    return str(node.val) + "," + serialize(node.left) + serialize(node.right)

deserialize(tokens):
    tok <- tokens.next()
    if tok == "#": return null
    node <- Node(int(tok))
    node.left <- deserialize(tokens)
    node.right <- deserialize(tokens)
    return node`,
    dryRunExample:
      'Tree `1 -> (2, 3 -> (4, 5))` serializes to `"1,2,#,#,3,4,#,#,5,#,#,"`.',
    timeComplexity: 'O(N) for both serialize and deserialize',
    spaceComplexity: 'O(N) for serialized string and recursion stack',
    commonMistakes: [
      'Omitting `null` markers (cannot distinguish left-skewed vs right-skewed trees).',
    ],
    interviewTips: [
      'For a **BST**, you don’t even need `#` markers—plain Preorder + value bounds `(min, max)` reconstructs it in `O(N)`.',
    ],
    implementations: {
      c: `// Preorder snprintf with '#' for NULL, and strtok/index pointer to rebuild`,
      cpp: `#include <sstream>\n#include <string>\nusing namespace std;\n\nvoid serDfs(TreeNode* r, string& out) {\n    if (!r) { out += "#,"; return; }\n    out += to_string(r->val) + ",";\n    serDfs(r->left, out); serDfs(r->right, out);\n}\nTreeNode* deserDfs(stringstream& ss) {\n    string tok;\n    if (!getline(ss, tok, ',') || tok == "#") return nullptr;\n    TreeNode* n = new TreeNode(stoi(tok));\n    n->left = deserDfs(ss); n->right = deserDfs(ss);\n    return n;\n}`,
      java: `import java.util.*;\npublic class Codec {\n    public String serialize(TreeNode root) {\n        StringBuilder sb = new StringBuilder();\n        ser(root, sb);\n        return sb.toString();\n    }\n    private void ser(TreeNode r, StringBuilder sb) {\n        if (r == null) { sb.append("#,"); return; }\n        sb.append(r.val).append(',');\n        ser(r.left, sb); ser(r.right, sb);\n    }\n    public TreeNode deserialize(String data) {\n        Queue<String> q = new ArrayDeque<>(Arrays.asList(data.split(",")));\n        return deser(q);\n    }\n    private TreeNode deser(Queue<String> q) {\n        String t = q.poll();\n        if (t == null || t.equals("#")) return null;\n        TreeNode n = new TreeNode(Integer.parseInt(t));\n        n.left = deser(q); n.right = deser(q);\n        return n;\n    }\n}`,
      python: `def serialize(root: TreeNode | None) -> str:\n    out = []\n    def dfs(n: TreeNode | None) -> None:\n        if not n: out.append('#'); return\n        out.append(str(n.val)); dfs(n.left); dfs(n.right)\n    dfs(root)\n    return ",".join(out)\n\ndef deserialize(data: str) -> TreeNode | None:\n    it = iter(data.split(","))\n    def build() -> TreeNode | None:\n        val = next(it)\n        if val == '#': return None\n        node = TreeNode(int(val))\n        node.left = build(); node.right = build()\n        return node\n    return build()`,
    },
  },
  {
    topicSlug: 'bst-introduction',
    title: 'Binary Search Tree (BST) Fundamentals',
    definition:
      'A Binary Search Tree (BST) is a binary tree satisfying the **BST invariant** at every node `u`: all keys in `u.left` are strictly less than `u.val`, and all keys in `u.right` are strictly greater than `u.val` (or `<=` / `>=` if duplicates are allowed).',
    explanation:
      'Because every subtree is itself a BST, searching, inserting, and deleting follow a single root-to-leaf path—taking `O(H)` time (`O(log N)` when balanced, `O(N)` when skewed). Furthermore, **Inorder traversal** of any BST yields its keys in ascending sorted order.',
    realWorldAnalogy:
      'A physical dictionary or phonebook where opening to any page tells you whether to look solely in the left half or the right half.',
    algorithm:
      'BST Invariant at every node `u`:\n`max(u.left) < u.val < min(u.right)`.',
    pseudocode: `// Search / Navigate in BST:
while cur != null:
    if target == cur.val: return cur
    cur <- cur.left if target < cur.val else cur.right`,
    dryRunExample:
      'BST `8 -> (3 -> (1, 6), 10 -> (null, 14))`: Inorder = `[1, 3, 6, 8, 10, 14]` (sorted!).',
    timeComplexity: 'O(H): O(log N) average/balanced, O(N) worst-case skewed',
    spaceComplexity: 'O(1) iterative, O(H) recursive',
    commonMistakes: [
      'Checking only `node.left.val < node.val < node.right.val` instead of the global subtree `(min, max)` bounds.',
    ],
    interviewTips: [
      'Always state both balanced `O(log N)` and skewed `O(N)` complexities when discussing BST operations.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'bst-search',
    title: 'Search in a Binary Search Tree',
    definition:
      'Locate a node with value `target` in a BST by comparing `target` against `cur.val` and descending left or right until found or reaching `null`.',
    explanation:
      'Iterative BST search uses `O(1)` extra space and avoids recursion overhead: at each step, half the remaining search space is eliminated in a balanced BST.',
    realWorldAnalogy:
      'Binary search over a tree-shaped index.',
    algorithm:
      '1. Start `cur = root`.\n2. While `cur != null && cur.val != target`:\n   - `cur = (target < cur.val) ? cur.left : cur.right`.\n3. Return `cur`.',
    pseudocode: `cur <- root
while cur != null and cur.val != target:
    cur <- cur.left if target < cur.val else cur.right
return cur`,
    dryRunExample:
      'Search `6` in `8 -> (3 -> (1, 6), 10)`: `8 -> 3 (6 < 8) -> 6 (6 > 3)` -> found!',
    timeComplexity: 'O(H) — O(log N) balanced, O(N) skewed',
    spaceComplexity: 'O(1) iterative',
    commonMistakes: [
      'Searching both left and right subtrees like a general binary tree (`O(N)` instead of `O(H)`).',
    ],
    interviewTips: [
      'Prefer the iterative `while` loop in interviews to demonstrate `O(1)` space.',
    ],
    implementations: {
      c: `TreeNode* searchBST(TreeNode* root, int val) {\n    while (root && root->val != val) root = val < root->val ? root->left : root->right;\n    return root;\n}`,
      cpp: `TreeNode* searchBST(TreeNode* root, int val) {\n    while (root && root->val != val) root = val < root->val ? root->left : root->right;\n    return root;\n}`,
      java: `public class BSTSearch {\n    public static TreeNode searchBST(TreeNode root, int val) {\n        while (root != null && root.val != val) root = val < root.val ? root.left : root.right;\n        return root;\n    }\n}`,
      python: `def search_bst(root: TreeNode | None, val: int) -> TreeNode | None:\n    while root and root.val != val:\n        root = root.left if val < root.val else root.right\n    return root`,
    },
  },
  {
    topicSlug: 'bst-insertion',
    title: 'Insertion in a Binary Search Tree',
    definition:
      'Insert a new key `val` into a BST as a new leaf node at the unique `null` position reached by following BST comparisons.',
    explanation:
      'Walk down from `root` comparing `val` with `cur.val`. When `cur` would step into `null`, attach `new TreeNode(val)` there. Note that standard BST insertion does not rebalance the tree.',
    realWorldAnalogy:
      'Filing a new folder into the exact empty slot in an alphabetical cabinet.',
    algorithm:
      '1. If `root == null`, return `new Node(val)`.\n2. If `val < root.val`, `root.left = insert(root.left, val)`.\n3. Else if `val > root.val`, `root.right = insert(root.right, val)`.\n4. Return `root`.',
    pseudocode: `insert(root, val):
    if root == null: return Node(val)
    if val < root.val: root.left <- insert(root.left, val)
    else if val > root.val: root.right <- insert(root.right, val)
    return root`,
    dryRunExample:
      'Insert `5` into `4 -> (2, 7)`: `5 > 4` (right to `7`), `5 < 7` (`7.left` is `null` -> attach `5`).',
    timeComplexity: 'O(H)',
    spaceComplexity: 'O(1) iterative, O(H) recursive',
    commonMistakes: [
      'Forgetting to reconnect `root.left = insert(root.left, val)` (drops the newly created node).',
    ],
    interviewTips: [
      'Ask how duplicate keys should be handled (ignore, count frequency, or place in right/left subtree).',
    ],
    implementations: {
      c: `TreeNode* insertIntoBST(TreeNode* root, int val) {\n    if (!root) { TreeNode* n = malloc(sizeof(TreeNode)); n->val = val; n->left = n->right = NULL; return n; }\n    if (val < root->val) root->left = insertIntoBST(root->left, val);\n    else if (val > root->val) root->right = insertIntoBST(root->right, val);\n    return root;\n}`,
      cpp: `TreeNode* insertIntoBST(TreeNode* root, int val) {\n    if (!root) return new TreeNode(val);\n    if (val < root->val) root->left = insertIntoBST(root->left, val);\n    else if (val > root->val) root->right = insertIntoBST(root->right, val);\n    return root;\n}`,
      java: `public class BSTInsert {\n    public static TreeNode insert(TreeNode root, int val) {\n        if (root == null) return new TreeNode(val);\n        if (val < root.val) root.left = insert(root.left, val);\n        else if (val > root.val) root.right = insert(root.right, val);\n        return root;\n    }\n}`,
      python: `def insert_into_bst(root: TreeNode | None, val: int) -> TreeNode:\n    if not root: return TreeNode(val)\n    if val < root.val: root.left = insert_into_bst(root.left, val)\n    elif val > root.val: root.right = insert_into_bst(root.right, val)\n    return root`,
    },
  },
  {
    topicSlug: 'bst-deletion',
    title: 'Deletion in a Binary Search Tree',
    definition:
      'Delete a node with key `val` from a BST while preserving the BST invariant across all 3 structural cases: 0 children, 1 child, or 2 children.',
    explanation:
      '- **Case 1 (Leaf, 0 children):** Return `null`.\n- **Case 2 (1 child):** Bypass the node and return its single non-null child.\n- **Case 3 (2 children):** Find the **inorder successor** (leftmost node in `root.right`) or **inorder predecessor** (rightmost in `root.left`), copy its value into `root.val`, and recursively delete that successor from `root.right`.',
    realWorldAnalogy:
      'Replacing a departing manager who has two teams with the next-in-rank team lead (inorder successor), then removing that lead’s old vacant slot.',
    algorithm:
      '1. Search for `key` recursively (`key < root.val` -> left, `key > root.val` -> right).\n2. On match:\n   - If `!root.left`, return `root.right`.\n   - If `!root.right`, return `root.left`.\n   - Find `succ = minNode(root.right)`.\n   - `root.val = succ.val`; `root.right = deleteNode(root.right, succ.val)`.\n3. Return `root`.',
    pseudocode: `deleteNode(root, key):
    if root == null: return null
    if key < root.val: root.left <- deleteNode(root.left, key)
    else if key > root.val: root.right <- deleteNode(root.right, key)
    else:
        if not root.left: return root.right
        if not root.right: return root.left
        succ <- minNode(root.right)
        root.val <- succ.val
        root.right <- deleteNode(root.right, succ.val)
    return root`,
    dryRunExample:
      'Delete `3` from `5 -> (3 -> (2, 4), 6)`: `3` has 2 children; inorder successor is `4`. Replace `3` with `4` and delete `4` from right -> `5 -> (4 -> (2, null), 6)`.',
    timeComplexity: 'O(H)',
    spaceComplexity: 'O(H) recursive (O(1) iterative)',
    commonMistakes: [
      'Forgetting to delete the duplicate successor node from `root.right` after copying `succ.val`!',
    ],
    interviewTips: [
      'Inorder successor always has at most 1 child (`left == null`), so deleting it from `root.right` hits Case 1 or Case 2.',
    ],
    implementations: {
      c: `TreeNode* deleteNode(TreeNode* root, int key) {\n    if (!root) return NULL;\n    if (key < root->val) root->left = deleteNode(root->left, key);\n    else if (key > root->val) root->right = deleteNode(root->right, key);\n    else {\n        if (!root->left) { TreeNode* r = root->right; free(root); return r; }\n        if (!root->right) { TreeNode* l = root->left; free(root); return l; }\n        TreeNode* s = root->right; while (s->left) s = s->left;\n        root->val = s->val;\n        root->right = deleteNode(root->right, s->val);\n    }\n    return root;\n}`,
      cpp: `TreeNode* deleteNode(TreeNode* root, int key) {\n    if (!root) return nullptr;\n    if (key < root->val) root->left = deleteNode(root->left, key);\n    else if (key > root->val) root->right = deleteNode(root->right, key);\n    else {\n        if (!root->left) return root->right;\n        if (!root->right) return root->left;\n        TreeNode* s = root->right; while (s->left) s = s->left;\n        root->val = s->val;\n        root->right = deleteNode(root->right, s->val);\n    }\n    return root;\n}`,
      java: `public class BSTDelete {\n    public static TreeNode deleteNode(TreeNode root, int key) {\n        if (root == null) return null;\n        if (key < root.val) root.left = deleteNode(root.left, key);\n        else if (key > root.val) root.right = deleteNode(root.right, key);\n        else {\n            if (root.left == null) return root.right;\n            if (root.right == null) return root.left;\n            TreeNode s = root.right; while (s.left != null) s = s.left;\n            root.val = s.val;\n            root.right = deleteNode(root.right, s.val);\n        }\n        return root;\n    }\n}`,
      python: `def delete_node(root: TreeNode | None, key: int) -> TreeNode | None:\n    if not root: return None\n    if key < root.val: root.left = delete_node(root.left, key)\n    elif key > root.val: root.right = delete_node(root.right, key)\n    else:\n        if not root.left: return root.right\n        if not root.right: return root.left\n        s = root.right\n        while s.left: s = s.left\n        root.val = s.val\n        root.right = delete_node(root.right, s.val)\n    return root`,
    },
  },
  {
    topicSlug: 'validate-bst',
    title: 'Validate Binary Search Tree',
    definition:
      'Determine whether a binary tree is a valid BST where every node’s value lies strictly within `(low, high)` bounds inherited from its ancestors.',
    explanation:
      'Simply checking `node.left.val < node.val < node.right.val` is wrong because a node deep in `root.left.right` could exceed `root.val`. Pass `(low, high)` bounds down: going left narrows `high = node.val`; going right narrows `low = node.val`. Use 64-bit `LONG_MIN`/`LONG_MAX` (or `null` bounds) to handle `INT_MIN`/`INT_MAX` node values.',
    realWorldAnalogy:
      'Checking that every employee’s ID in a department tree falls inside the ID range assigned to that department.',
    algorithm:
      '1. `valid(node, low, high)`:\n   - If `node == null`, return `true`.\n   - If `node.val <= low || node.val >= high`, return `false`.\n   - Return `valid(node.left, low, node.val) && valid(node.right, node.val, high)`.\n2. Call `valid(root, -INF, +INF)`.',
    pseudocode: `valid(node, low, high):
    if node == null: return true
    if node.val <= low or node.val >= high: return false
    return valid(node.left, low, node.val) and valid(node.right, node.val, high)`,
    dryRunExample:
      'Tree `5 -> (1, 4 -> (3, 6))`: `4` is in `root.right` so `low = 5`; `4 <= 5` -> returns `false`.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(H)',
    commonMistakes: [
      'Using 32-bit `INT_MIN`/`INT_MAX` as sentinel bounds when a node actually has value `INT_MIN` or `INT_MAX`.',
      'Only checking immediate children instead of subtree range bounds.',
    ],
    interviewTips: [
      'Alternative `O(N)` approach: iterative Inorder traversal checking `prev < cur.val` at every step.',
    ],
    implementations: {
      c: `#include <limits.h>\n#include <stdbool.h>\nstatic bool validBst(const TreeNode* r, long long lo, long long hi) {\n    if (!r) return true;\n    if (r->val <= lo || r->val >= hi) return false;\n    return validBst(r->left, lo, r->val) && validBst(r->right, r->val, hi);\n}\nbool isValidBST(const TreeNode* root) { return validBst(root, LLONG_MIN, LLONG_MAX); }`,
      cpp: `#include <climits>\nbool validBst(TreeNode* r, long long lo, long long hi) {\n    if (!r) return true;\n    if (r->val <= lo || r->val >= hi) return false;\n    return validBst(r->left, lo, r->val) && validBst(r->right, r->val, hi);\n}\nbool isValidBST(TreeNode* root) { return validBst(root, LLONG_MIN, LLONG_MAX); }`,
      java: `public class ValidateBST {\n    public static boolean isValidBST(TreeNode root) { return valid(root, Long.MIN_VALUE, Long.MAX_VALUE); }\n    private static boolean valid(TreeNode r, long lo, long hi) {\n        if (r == null) return true;\n        if (r.val <= lo || r.val >= hi) return false;\n        return valid(r.left, lo, r.val) && valid(r.right, r.val, hi);\n    }\n}`,
      python: `def is_valid_bst(root: TreeNode | None) -> bool:\n    def valid(n: TreeNode | None, lo: float, hi: float) -> bool:\n        if not n: return True\n        if not (lo < n.val < hi): return False\n        return valid(n.left, lo, n.val) and valid(n.right, n.val, hi)\n    return valid(root, float('-inf'), float('inf'))`,
    },
  },
  {
    topicSlug: 'inorder-predecessor-successor',
    title: 'Inorder Predecessor & Successor in BST',
    definition:
      'For a given key `k` in a BST, the **inorder predecessor** is the largest key strictly `< k`, and the **inorder successor** is the smallest key strictly `> k`.',
    explanation:
      'Walk down from `root` in `O(H)` time and `O(1)` space without storing the inorder array:\n- **Successor:** whenever `cur.val > k`, `cur` is a candidate (`succ = cur`) and we move `cur = cur.left` to find a tighter (smaller) candidate; else `cur = cur.right`.\n- **Predecessor:** whenever `cur.val < k`, `cur` is a candidate (`pred = cur`) and we move `cur = cur.right` to find a larger candidate; else `cur = cur.left`.',
    realWorldAnalogy:
      'Finding the closest lower and higher price tags to a target price `k` by walking down a binary decision tree.',
    algorithm:
      'Successor of `k`:\n1. `succ = null`, `cur = root`.\n2. While `cur != null`:\n   - If `cur.val > k`: `succ = cur; cur = cur.left`.\n   - Else: `cur = cur.right`.\n3. Return `succ`.',
    pseudocode: `succ <- null, cur <- root
while cur != null:
    if cur.val > k: succ <- cur; cur <- cur.left
    else: cur <- cur.right`,
    dryRunExample:
      'BST `20 -> (10 -> (5, 15), 30)`, `k = 15`: `20 > 15` (`succ=20`, left), `10 <= 15` (right), `15 <= 15` (right -> null) -> `succ = 20`.',
    timeComplexity: 'O(H)',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Only checking `node.right`’s leftmost child and forgetting the ancestor case when `node.right == null`.',
    ],
    interviewTips: [
      'The single `while` loop handles **both** cases (with or without a right subtree, and even when `k` is not in the BST!).',
    ],
    implementations: {
      c: `TreeNode* inorderSuccessor(TreeNode* root, int k) {\n    TreeNode* succ = NULL;\n    while (root) {\n        if (root->val > k) { succ = root; root = root->left; }\n        else root = root->right;\n    }\n    return succ;\n}`,
      cpp: `TreeNode* inorderSuccessor(TreeNode* root, int k) {\n    TreeNode* succ = nullptr;\n    while (root) {\n        if (root->val > k) { succ = root; root = root->left; }\n        else root = root->right;\n    }\n    return succ;\n}`,
      java: `public class PredecessorSuccessor {\n    public static TreeNode successor(TreeNode root, int k) {\n        TreeNode succ = null;\n        while (root != null) {\n            if (root.val > k) { succ = root; root = root.left; }\n            else root = root.right;\n        }\n        return succ;\n    }\n}`,
      python: `def inorder_successor(root: TreeNode | None, k: int) -> TreeNode | None:\n    succ = None\n    while root:\n        if root.val > k:\n            succ = root\n            root = root.left\n        else:\n            root = root.right\n    return succ`,
    },
  },
  {
    topicSlug: 'kth-smallest-in-bst',
    title: 'Kth Smallest Element in a BST',
    definition:
      'Given the root of a BST and an integer `k` (1-indexed), return the `k`-th smallest key in the tree.',
    explanation:
      'Since Inorder traversal visits BST keys in ascending order, run **iterative Inorder** and stop immediately on the `k`-th popped node—taking `O(H + k)` time instead of traversing all `N` nodes.',
    realWorldAnalogy:
      'Reading names from an alphabetical index card box and stopping as soon as you count the `k`-th name.',
    algorithm:
      '1. Initialize `stack`, `cur = root`.\n2. Loop while `cur != null || !stack.empty()`:\n   - Push all left descendants (`cur = cur.left`).\n   - Pop `cur`, decrement `k`.\n   - If `k == 0`, return `cur.val`.\n   - Move `cur = cur.right`.',
    pseudocode: `while cur != null or not stack.empty():
    while cur != null: stack.push(cur); cur <- cur.left
    cur <- stack.pop()
    k <- k - 1
    if k == 0: return cur.val
    cur <- cur.right`,
    dryRunExample:
      'BST `5 -> (3 -> (2 -> (1, null), 4), 6)`, `k = 3`: pops `1` (`k=2`), `2` (`k=1`), `3` (`k=0`) -> returns `3`.',
    timeComplexity: 'O(H + k) — stops early at the k-th element',
    spaceComplexity: 'O(H) explicit stack',
    commonMistakes: [
      'Collecting all `N` elements into a list when `k` is small.',
    ],
    interviewTips: [
      'Follow-up: If the BST is modified frequently with `kthSmallest` queries, augment each node with `leftSubtreeSize` to answer in `O(H)` time!',
    ],
    implementations: {
      c: `int kthSmallest(TreeNode* root, int k) {\n    TreeNode* st[1000]; int top = -1; TreeNode* cur = root;\n    while (cur || top >= 0) {\n        while (cur) { st[++top] = cur; cur = cur->left; }\n        cur = st[top--];\n        if (--k == 0) return cur->val;\n        cur = cur->right;\n    }\n    return -1;\n}`,
      cpp: `#include <stack>\nint kthSmallest(TreeNode* root, int k) {\n    std::stack<TreeNode*> st; TreeNode* cur = root;\n    while (cur || !st.empty()) {\n        while (cur) { st.push(cur); cur = cur->left; }\n        cur = st.top(); st.pop();\n        if (--k == 0) return cur->val;\n        cur = cur->right;\n    }\n    return -1;\n}`,
      java: `import java.util.*;\npublic class KthSmallestBST {\n    public static int kthSmallest(TreeNode root, int k) {\n        Deque<TreeNode> st = new ArrayDeque<>(); TreeNode cur = root;\n        while (cur != null || !st.isEmpty()) {\n            while (cur != null) { st.push(cur); cur = cur.left; }\n            cur = st.pop();\n            if (--k == 0) return cur.val;\n            cur = cur.right;\n        }\n        return -1;\n    }\n}`,
      python: `def kth_smallest(root: TreeNode | None, k: int) -> int:\n    stack, cur = [], root\n    while cur or stack:\n        while cur: stack.append(cur); cur = cur.left\n        cur = stack.pop()\n        k -= 1\n        if k == 0: return cur.val\n        cur = cur.right\n    return -1`,
    },
  },
  {
    topicSlug: 'avl-tree-basics',
    title: 'AVL Tree Basics & Balance Factor',
    definition:
      'An AVL tree (Adelson-Velsky and Landis) is a **self-balancing Binary Search Tree** where the **balance factor** `BF(node) = height(node.left) - height(node.right)` of every node is constrained to `{-1, 0, +1}`.',
    explanation:
      'A plain BST can degenerate into a skewed linked list of height `N` on sorted insertions. By enforcing `|BF| <= 1` after every insertion and deletion using tree rotations, an AVL tree guarantees height `H <= 1.44 * log2(N)`, keeping search, insert, and delete strictly `O(log N)` in the worst case.',
    realWorldAnalogy:
      'A self-leveling bookshelf that shifts books slightly whenever one side becomes 2 shelves taller than the other.',
    algorithm:
      '1. Store `height` inside each AVL node.\n2. After BST insert/delete, update `node.height = 1 + max(h(left), h(right))`.\n3. Compute `bf = h(left) - h(right)`.\n4. If `|bf| > 1`, apply the matching rotation (`LL`, `RR`, `LR`, or `RL`).',
    pseudocode: `bf(node) <- height(node.left) - height(node.right)
// Valid iff bf in {-1, 0, +1} for all nodes`,
    dryRunExample:
      'Inserting `10, 20, 30` sequentially creates `BF(10) = 0 - 2 = -2` (RR imbalance), triggering a Left Rotation at `10` so `20` becomes the balanced root (`BF = 0`).',
    timeComplexity: 'O(log N) guaranteed worst-case search, insert, delete',
    spaceComplexity: 'O(N) nodes (each storing 1 extra `height` integer)',
    commonMistakes: [
      'Forgetting to update `height` bottom-up on the children before the new rotated root.',
    ],
    interviewTips: [
      'AVL trees are more strictly balanced than Red-Black trees (faster lookups, slightly more rotations on writes).',
    ],
    implementations: {},
  },
  {
    topicSlug: 'avl-rotations',
    title: 'AVL Rotations (LL, RR, LR, RL)',
    definition:
      'AVL rotations are `O(1)` local pointer restructurings that restore `|BF| <= 1` while preserving the BST inorder sequence.',
    explanation:
      'There are 4 imbalance cases at an unbalanced ancestor `z`:\n1. **LL (Left-Left, `bf > 1` & `key < z.left.key`):** Single **Right Rotate** at `z`.\n2. **RR (Right-Right, `bf < -1` & `key > z.right.key`):** Single **Left Rotate** at `z`.\n3. **LR (Left-Right, `bf > 1` & `key > z.left.key`):** **Left Rotate** `z.left`, then **Right Rotate** `z`.\n4. **RL (Right-Left, `bf < -1` & `key < z.right.key`):** **Right Rotate** `z.right`, then **Left Rotate** `z`.',
    realWorldAnalogy:
      'Rotating a crooked triangle of 3 connected gears so the middle gear rises to the top while keeping left-to-right order intact.',
    algorithm:
      '`rightRotate(y)`:\n1. `x = y.left`, `T2 = x.right`.\n2. `x.right = y`, `y.left = T2`.\n3. Update `y.height`, then `x.height`.\n4. Return `x` (new root).',
    pseudocode: `rightRotate(y):
    x <- y.left; T2 <- x.right
    x.right <- y; y.left <- T2
    updateHeight(y); updateHeight(x)
    return x`,
    dryRunExample:
      'LR case `30 -> left: 10 -> right: 20`: Left-rotate `10` -> `30 -> left: 20 -> left: 10`; Right-rotate `30` -> `20 -> (10, 30)`.',
    timeComplexity: 'O(1) per rotation; at most 1 (single/double) rotation on insert, O(log N) on delete',
    spaceComplexity: 'O(1) per rotation',
    commonMistakes: [
      'Updating `x.height` before `y.height` (since `y` is now a child of `x`, `y` must be updated first!).',
    ],
    interviewTips: [
      'Always verify rotations preserve inorder order: `T1 < x < T2 < y < T3` before and after rotation.',
    ],
    implementations: {
      c: `typedef struct AVLNode { int key, height; struct AVLNode *left, *right; } AVLNode;\nint h(AVLNode* n) { return n ? n->height : 0; }\nint mx(int a, int b) { return a > b ? a : b; }\nAVLNode* rightRotate(AVLNode* y) {\n    AVLNode* x = y->left; AVLNode* T2 = x->right;\n    x->right = y; y->left = T2;\n    y->height = 1 + mx(h(y->left), h(y->right));\n    x->height = 1 + mx(h(x->left), h(x->right));\n    return x;\n}`,
      cpp: `struct AVLNode { int key, height = 1; AVLNode *left = nullptr, *right = nullptr; };\nint h(AVLNode* n) { return n ? n->height : 0; }\nAVLNode* rightRotate(AVLNode* y) {\n    AVLNode* x = y->left; AVLNode* T2 = x->right;\n    x->right = y; y->left = T2;\n    y->height = 1 + std::max(h(y->left), h(y->right));\n    x->height = 1 + std::max(h(x->left), h(x->right));\n    return x;\n}`,
      java: `class AVLRotations {\n    static class Node { int key, height = 1; Node left, right; Node(int k) { key = k; } }\n    static int h(Node n) { return n == null ? 0 : n.height; }\n    static Node rightRotate(Node y) {\n        Node x = y.left, T2 = x.right;\n        x.right = y; y.left = T2;\n        y.height = 1 + Math.max(h(y.left), h(y.right));\n        x.height = 1 + Math.max(h(x.left), h(x.right));\n        return x;\n    }\n}`,
      python: `def right_rotate(y):\n    x = y.left; t2 = x.right\n    x.right = y; y.left = t2\n    y.height = 1 + max(y.left.height if y.left else 0, y.right.height if y.right else 0)\n    x.height = 1 + max(x.left.height if x.left else 0, x.right.height if x.right else 0)\n    return x`,
    },
  },
  {
    topicSlug: 'red-black-tree-fundamentals',
    title: 'Red-Black Tree Fundamentals',
    definition:
      'A Red-Black Tree is a self-balancing BST where each node is colored **Red** or **Black** and obeys 5 invariants that guarantee height `H <= 2 * log2(N + 1)`.',
    explanation:
      'The 5 Red-Black invariants:\n1. Every node is Red or Black.\n2. The **root** is always Black.\n3. Every `NIL` leaf is Black.\n4. **No Red-Red parent-child:** a Red node cannot have a Red child.\n5. **Equal Black-Height:** every path from any node to its descendant `NIL` leaves has the exact same number of Black nodes.\n\nBecause the longest path (alternating Black-Red) is at most twice the shortest path (all Black), `H = O(log N)`. Red-Black trees power `std::map`/`std::set` in C++ and `TreeMap`/`TreeSet` in Java because insertions/deletions need at most `O(1)` rotations (recoloring handles most fixes).',
    realWorldAnalogy:
      'A traffic rule where Red cars cannot follow another Red car directly, and every route from root to exit passes the exact same number of Black tollbooths.',
    algorithm:
      'On insert (always insert new node as **Red**):\n- If parent is Black -> done.\n- If parent is Red and **uncle is Red** -> recolor parent & uncle Black, grandparent Red, and repeat at grandparent.\n- If parent is Red and **uncle is Black** -> perform LL/RR/LR/RL rotation + recolor.',
    pseudocode: `// New node inserted as RED:
while node != root and node.parent.color == RED:
    if uncle.color == RED:
        recolor parent & uncle BLACK, grandparent RED
        node <- grandparent
    else:
        rotate (LL/RR/LR/RL) and recolor -> break
root.color <- BLACK`,
    dryRunExample:
      'In C++ `std::map` and Java `TreeMap`, Red-Black trees guarantee `O(log N)` worst-case insert/delete/lookup with at most 2 rotations on insert and 3 on delete.',
    timeComplexity: 'O(log N) worst-case search, insert, delete',
    spaceComplexity: 'O(N) (1 bit per node for color)',
    commonMistakes: [
      'Forgetting that `NIL` leaves count as Black when checking the uncle’s color.',
    ],
    interviewTips: [
      'Know the **AVL vs Red-Black** tradeoff: AVL is stricter (`1.44 log N`) -> faster reads; Red-Black (`2 log N`) -> fewer rotations -> faster frequent writes (`std::map`, `TreeMap`, Linux CFS scheduler).',
    ],
    implementations: {},
  },

  // =========================================================================
  // MODULE 18: HEAPS AND PRIORITY QUEUES (14 Concepts)
  // =========================================================================
  {
    topicSlug: 'heap-fundamentals',
    title: 'Heap Fundamentals (Binary Heap)',
    definition:
      'A Binary Heap is a **Complete Binary Tree** stored compactly in an array that satisfies the **heap-order property**: every parent is either `<=` its children (Min-Heap) or `>=` its children (Max-Heap).',
    explanation:
      'Unlike a BST, a heap is **not** globally sorted (left child is not necessarily smaller than right child); it only guarantees that the root is the global minimum (Min-Heap) or maximum (Max-Heap). This gives `O(1)` peek, `O(log N)` push/pop, and `O(N)` bottom-up construction.',
    realWorldAnalogy:
      'An emergency room triage board: the most urgent patient is always at the top, without needing every remaining patient strictly sorted.',
    algorithm:
      '0-indexed array mapping for node at index `i`:\n- `parent(i) = (i - 1) / 2`\n- `left(i) = 2 * i + 1`\n- `right(i) = 2 * i + 2`',
    pseudocode: `parent(i) <- (i - 1) // 2
left(i)   <- 2 * i + 1
right(i)  <- 2 * i + 2`,
    dryRunExample:
      'Array `[10, 20, 15, 30, 40]` represents a Min-Heap: root `10` has children `20, 15`; `20` has children `30, 40`.',
    timeComplexity: 'O(1) peek; O(log N) insert/extract; O(N) build',
    spaceComplexity: 'O(N) contiguous array (zero pointer overhead)',
    commonMistakes: [
      'Confusing 0-indexed (`2*i + 1`, `2*i + 2`) and 1-indexed (`2*i`, `2*i + 1`) child formulas.',
    ],
    interviewTips: [
      'Note that in C++, `std::priority_queue` is a **Max-Heap** by default, whereas in Java (`PriorityQueue`) and Python (`heapq`), it is a **Min-Heap** by default!',
    ],
    implementations: {},
  },
  {
    topicSlug: 'complete-binary-tree-property',
    title: 'Complete Binary Tree Property & Array Representation',
    definition:
      'A Complete Binary Tree has every level completely filled except possibly the last, which is filled strictly from left to right—eliminating gaps and allowing pointer-free array storage.',
    explanation:
      'Because there are no missing nodes before the end of the last level, an array of length `N` maps level-order positions `0 .. N - 1` 1-to-1 with tree nodes. Non-leaf (internal) nodes sit at indices `0 .. floor(N / 2) - 1`, and leaves sit at `floor(N / 2) .. N - 1`.',
    realWorldAnalogy:
      'Filling theater seats row by row from front-left to back-right with zero empty seats between occupied ones.',
    algorithm:
      '1. Total height of `N` nodes is `floor(log2(N))`.\n2. First leaf index = `N / 2` (0-indexed).\n3. Last non-leaf index = `(N / 2) - 1`.',
    pseudocode: `// 0-indexed array of size N:
leaves:      indices [N // 2 .. N - 1]
internal:    indices [0 .. N // 2 - 1]`,
    dryRunExample:
      'For `N = 7`: indices `0, 1, 2` are internal nodes; indices `3, 4, 5, 6` are leaves (`7 // 2 = 3`).',
    timeComplexity: 'O(1) parent/child index arithmetic',
    spaceComplexity: 'O(N) array with better CPU cache locality than pointer trees',
    commonMistakes: [
      'Checking `left < N` without checking `right < N` when accessing children.',
    ],
    interviewTips: [
      'Knowing that leaves start at `N / 2` explains why `buildHeap` loops from `N / 2 - 1` down to `0`.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'min-heap',
    title: 'Min-Heap',
    definition:
      'A Min-Heap is a binary heap where `heap[parent(i)] <= heap[i]` for every non-root node `i`, ensuring the smallest element is always at `heap[0]`.',
    explanation:
      'Min-Heaps are used in Dijkstra’s shortest path, Prim’s MST, Merge K Sorted Lists, and finding the **Kth Largest** element (by keeping a Min-Heap of size `K` whose root is the Kth largest!).',
    realWorldAnalogy:
      'A job scheduler always picking the task with the earliest deadline (`min` timestamp) next.',
    algorithm:
      '1. `peek()`: return `heap[0]` in `O(1)`.\n2. `push(x)`: append `x` at end and sift-up while `heap[i] < heap[parent(i)]`.\n3. `pop()`: replace `heap[0]` with `heap.back()`, pop back, and sift-down.',
    pseudocode: `// Invariant: for all i > 0, heap[(i - 1) // 2] <= heap[i]`,
    dryRunExample:
      'Pushing `[5, 3, 8, 1]` into a Min-Heap leaves `1` at `heap[0]`.',
    timeComplexity: 'O(1) peek, O(log N) push/pop',
    spaceComplexity: 'O(N)',
    commonMistakes: [
      'Using a Max-Heap when you need a Min-Heap of size `K` for Kth Largest (or vice versa).',
    ],
    interviewTips: [
      'In Python `heapq`, simulate a Max-Heap by negating values (`-x`).',
    ],
    implementations: {
      c: `// Array-based Min-Heap with siftUp/siftDown comparing a < b`,
      cpp: `#include <functional>\n#include <queue>\n#include <vector>\nusing namespace std;\n\n// C++ Min-Heap:\npriority_queue<int, vector<int>, greater<int>> minHeap;`,
      java: `import java.util.PriorityQueue;\n// Java PriorityQueue is a Min-Heap by default:\nPriorityQueue<Integer> minHeap = new PriorityQueue<>();`,
      python: `import heapq\nh = []\nheapq.heappush(h, 5)\nheapq.heappush(h, 1)\nsmallest = heapq.heappop(h)  # 1`,
    },
  },
  {
    topicSlug: 'max-heap',
    title: 'Max-Heap',
    definition:
      'A Max-Heap is a binary heap where `heap[parent(i)] >= heap[i]` for every non-root node `i`, ensuring the largest element is always at `heap[0]`.',
    explanation:
      'Max-Heaps are used for Heap Sort (in-place ascending sort), finding the **Kth Smallest** element (maintain Max-Heap of size `K`), and task scheduling by highest priority.',
    realWorldAnalogy:
      'A VIP boarding queue where the passenger with the highest tier number always boards first.',
    algorithm:
      '1. `peek()`: return `heap[0]`.\n2. `push(x)`: append `x` and sift-up while `heap[i] > heap[parent(i)]`.\n3. `pop()`: swap `heap[0]` with `heap[n-1]`, shrink `n`, and sift-down.',
    pseudocode: `// Invariant: for all i > 0, heap[(i - 1) // 2] >= heap[i]`,
    dryRunExample:
      'Pushing `[5, 3, 8, 1]` into a Max-Heap places `8` at `heap[0]`.',
    timeComplexity: 'O(1) peek, O(log N) push/pop',
    spaceComplexity: 'O(N)',
    commonMistakes: [
      'Forgetting `Collections.reverseOrder()` in Java when a Max-Heap is needed.',
    ],
    interviewTips: [
      'C++ `priority_queue<int>` is already a Max-Heap.',
    ],
    implementations: {
      c: `// Array-based Max-Heap with siftUp/siftDown comparing a > b`,
      cpp: `#include <queue>\n// C++ priority_queue is a Max-Heap by default:\nstd::priority_queue<int> maxHeap;`,
      java: `import java.util.*;\nPriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());`,
      python: `import heapq\n# Negate values for Max-Heap in Python heapq:\nh = []\nheapq.heappush(h, -5)\nheapq.heappush(h, -8)\nlargest = -heapq.heappop(h)  # 8`,
    },
  },
  {
    topicSlug: 'heap-insertion',
    title: 'Heap Insertion (Sift-Up / Bubble-Up)',
    definition:
      'Inserting a new element into a heap appends it at the next available leaf slot (`index = size`) to preserve completeness, then swaps it upward with its parent until the heap property is restored.',
    explanation:
      'Appending at the end keeps the tree a Complete Binary Tree in `O(1)`. If the new value violates the heap property against its parent (`(i - 1) / 2`), swapping it upward fixes that edge and moves the violation one level closer to the root, taking at most `H = floor(log2 N)` swaps.',
    realWorldAnalogy:
      'A new hire joining at the bottom of a hierarchy and being promoted upward past anyone they outrank.',
    algorithm:
      '1. Append `val` at `i = heap.size()`.\n2. While `i > 0`:\n   - `p = (i - 1) / 2`.\n   - If `heap[i] < heap[p]` (Min-Heap), `swap(heap[i], heap[p])` and set `i = p`; else `break`.',
    pseudocode: `heap.append(val)
i <- len(heap) - 1
while i > 0:
    p <- (i - 1) // 2
    if heap[i] < heap[p]:
        swap(heap[i], heap[p])
        i <- p
    else: break`,
    dryRunExample:
      'Insert `2` into Min-Heap `[5, 10, 8, 15]`:\n- Append at `i=4`: `[5, 10, 8, 15, 2]`\n- `p=1 (10) > 2`: swap -> `[5, 2, 8, 15, 10]`, `i=1`\n- `p=0 (5) > 2`: swap -> `[2, 5, 8, 15, 10]`, `i=0` -> done.',
    timeComplexity: 'O(log N) worst case; O(1) average',
    spaceComplexity: 'O(1) auxiliary',
    commonMistakes: [
      'Computing `parent` as `i / 2` on a 0-indexed array (gives wrong parent for even indices!).',
    ],
    interviewTips: [
      'Average insertion time in a random heap is actually `O(1)` because most nodes sit near the bottom!',
    ],
    implementations: {
      c: `void minHeapPush(int h[], int* n, int val) {\n    int i = (*n)++;\n    h[i] = val;\n    while (i > 0) {\n        int p = (i - 1) / 2;\n        if (h[i] < h[p]) { int t = h[i]; h[i] = h[p]; h[p] = t; i = p; }\n        else break;\n    }\n}`,
      cpp: `#include <vector>\n#include <utility>\nvoid minHeapPush(std::vector<int>& h, int val) {\n    h.push_back(val);\n    int i = static_cast<int>(h.size()) - 1;\n    while (i > 0) {\n        int p = (i - 1) / 2;\n        if (h[i] < h[p]) { std::swap(h[i], h[p]); i = p; }\n        else break;\n    }\n}`,
      java: `import java.util.List;\npublic class HeapInsert {\n    public static void push(List<Integer> h, int val) {\n        h.add(val);\n        int i = h.size() - 1;\n        while (i > 0) {\n            int p = (i - 1) / 2;\n            if (h.get(i) < h.get(p)) {\n                int t = h.get(i); h.set(i, h.get(p)); h.set(p, t); i = p;\n            } else break;\n        }\n    }\n}`,
      python: `def min_heap_push(h: list[int], val: int) -> None:\n    h.append(val)\n    i = len(h) - 1\n    while i > 0:\n        p = (i - 1) // 2\n        if h[i] < h[p]:\n            h[i], h[p] = h[p], h[i]\n            i = p\n        else:\n            break`,
    },
  },
  {
    topicSlug: 'heap-deletion-extract',
    title: 'Heap Deletion / Extract Root (Sift-Down)',
    definition:
      'Extracting the root (min or max) removes `heap[0]`, moves the last element `heap[n - 1]` into `heap[0]` to preserve completeness, and sifts it downward (`heapifyDown`) until the heap invariant holds.',
    explanation:
      'You cannot leave a hole at index `0` or shift the entire array (`O(N)`). Moving the last leaf to index `0` keeps the tree complete in `O(1)`, and sifting down swaps it with the smaller child (Min-Heap) or larger child (Max-Heap) for at most `log N` levels.',
    realWorldAnalogy:
      'The top CEO leaves, the newest trainee temporarily sits at the top desk, and then trades places down the chain with whichever direct report is more senior until order is restored.',
    algorithm:
      '1. Save `top = heap[0]`.\n2. Set `heap[0] = heap.back()`, `heap.pop_back()`.\n3. Sift down from `i = 0`: find `best = smallest(i, 2i+1, 2i+2)`; if `best != i`, swap and set `i = best`, else `break`.\n4. Return `top`.',
    pseudocode: `top <- heap[0]
heap[0] <- heap.popLast()
siftDown(heap, 0)
return top`,
    dryRunExample:
      'Extract min from `[2, 5, 8, 15, 10]`:\n- Return `2`; move `10` to root -> `[10, 5, 8, 15]`\n- Children of `0` are `5, 8`; smaller is `5` -> swap -> `[5, 10, 8, 15]`\n- Child of `1` is `15` (`10 < 15`) -> done.',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(1) iterative',
    commonMistakes: [
      'Removing `heap[0]` by shifting elements left (`O(N)` and breaks complete binary tree structure!).',
    ],
    interviewTips: [
      'Always handle empty-heap check (`if (n == 0)`) before extracting.',
    ],
    implementations: {
      c: `int minHeapPop(int h[], int* n) {\n    int top = h[0];\n    h[0] = h[--(*n)];\n    int i = 0;\n    while (1) {\n        int l = 2 * i + 1, r = 2 * i + 2, s = i;\n        if (l < *n && h[l] < h[s]) s = l;\n        if (r < *n && h[r] < h[s]) s = r;\n        if (s == i) break;\n        int t = h[i]; h[i] = h[s]; h[s] = t; i = s;\n    }\n    return top;\n}`,
      cpp: `#include <vector>\n#include <utility>\nint minHeapPop(std::vector<int>& h) {\n    int top = h[0];\n    h[0] = h.back(); h.pop_back();\n    int n = static_cast<int>(h.size()), i = 0;\n    while (true) {\n        int l = 2 * i + 1, r = 2 * i + 2, s = i;\n        if (l < n && h[l] < h[s]) s = l;\n        if (r < n && h[r] < h[s]) s = r;\n        if (s == i) break;\n        std::swap(h[i], h[s]); i = s;\n    }\n    return top;\n}`,
      java: `import java.util.List;\npublic class HeapExtract {\n    public static int pop(List<Integer> h) {\n        int top = h.get(0), last = h.remove(h.size() - 1);\n        if (!h.isEmpty()) {\n            h.set(0, last);\n            int n = h.size(), i = 0;\n            while (true) {\n                int l = 2 * i + 1, r = 2 * i + 2, s = i;\n                if (l < n && h.get(l) < h.get(s)) s = l;\n                if (r < n && h.get(r) < h.get(s)) s = r;\n                if (s == i) break;\n                int t = h.get(i); h.set(i, h.get(s)); h.set(s, t); i = s;\n            }\n        }\n        return top;\n    }\n}`,
      python: `def min_heap_pop(h: list[int]) -> int:\n    top = h[0]\n    last = h.pop()\n    if h:\n        h[0] = last\n        n, i = len(h), 0\n        while True:\n            l, r, s = 2 * i + 1, 2 * i + 2, i\n            if l < n and h[l] < h[s]: s = l\n            if r < n and h[r] < h[s]: s = r\n            if s == i: break\n            h[i], h[s] = h[s], h[i]; i = s\n    return top`,
    },
  },
  {
    topicSlug: 'heapify',
    title: 'Heapify (Sift-Down Repair)',
    definition:
      '`heapify(arr, n, i)` restores the heap property at subtree `i` assuming its left and right subtrees (`2i + 1` and `2i + 2`) are already valid heaps.',
    explanation:
      'Compare `arr[i]` with its left and right children (within bounds `< n`). If a child violates the heap order, swap `arr[i]` with the **extreme** child (largest for Max-Heap, smallest for Min-Heap) and continue sifting down that child’s index.',
    realWorldAnalogy:
      'Dropping a stone into a sorted funnel: it sinks down whichever branch is more extreme until it settles at its rightful level.',
    algorithm:
      '1. `best = i`, `l = 2*i + 1`, `r = 2*i + 2`.\n2. If `l < n && arr[l] > arr[best]`, `best = l` (Max-Heap).\n3. If `r < n && arr[r] > arr[best]`, `best = r`.\n4. If `best != i`, `swap(arr[i], arr[best])` and recurse/loop at `i = best`.',
    pseudocode: `heapify(arr, n, i):
    while true:
        best <- i, l <- 2*i + 1, r <- 2*i + 2
        if l < n and arr[l] > arr[best]: best <- l
        if r < n and arr[r] > arr[best]: best <- r
        if best == i: break
        swap(arr[i], arr[best])
        i <- best`,
    dryRunExample:
      'Max-Heapify `[1, 9, 8, 4, 5]` at `i=0`: `9 > 8` -> swap `1` and `9` -> `[9, 1, 8, 4, 5]` -> `5 > 4` -> swap `1` and `5` -> `[9, 5, 8, 4, 1]`.',
    timeComplexity: 'O(log N) worst case (proportional to height of node i)',
    spaceComplexity: 'O(1) iterative (O(log N) if recursive)',
    commonMistakes: [
      'Swapping with `left` immediately when both `left` and `right` are larger instead of picking `max(left, right)`.',
    ],
    interviewTips: [
      'Write `heapify` iteratively with a `while` loop to guarantee `O(1)` stack space.',
    ],
    implementations: {
      c: `void maxHeapify(int arr[], int n, int i) {\n    while (1) {\n        int best = i, l = 2 * i + 1, r = 2 * i + 2;\n        if (l < n && arr[l] > arr[best]) best = l;\n        if (r < n && arr[r] > arr[best]) best = r;\n        if (best == i) break;\n        int t = arr[i]; arr[i] = arr[best]; arr[best] = t;\n        i = best;\n    }\n}`,
      cpp: `#include <utility>\n#include <vector>\nvoid maxHeapify(std::vector<int>& arr, int n, int i) {\n    while (true) {\n        int best = i, l = 2 * i + 1, r = 2 * i + 2;\n        if (l < n && arr[l] > arr[best]) best = l;\n        if (r < n && arr[r] > arr[best]) best = r;\n        if (best == i) break;\n        std::swap(arr[i], arr[best]);\n        i = best;\n    }\n}`,
      java: `public class Heapify {\n    public static void maxHeapify(int[] arr, int n, int i) {\n        while (true) {\n            int best = i, l = 2 * i + 1, r = 2 * i + 2;\n            if (l < n && arr[l] > arr[best]) best = l;\n            if (r < n && arr[r] > arr[best]) best = r;\n            if (best == i) break;\n            int t = arr[i]; arr[i] = arr[best]; arr[best] = t;\n            i = best;\n        }\n    }\n}`,
      python: `def max_heapify(arr: list[int], n: int, i: int) -> None:\n    while True:\n        best, l, r = i, 2 * i + 1, 2 * i + 2\n        if l < n and arr[l] > arr[best]: best = l\n        if r < n and arr[r] > arr[best]: best = r\n        if best == i: break\n        arr[i], arr[best] = arr[best], arr[i]\n        i = best`,
    },
  },
  {
    topicSlug: 'build-heap',
    title: 'Build Heap in O(N) Time (Floyd’s Algorithm)',
    definition:
      'Floyd’s bottom-up `buildHeap` converts an arbitrary unsorted array of `N` elements into a valid heap in **linear `O(N)` time** by calling `heapify` from the last non-leaf `(N / 2) - 1` down to `0`.',
    explanation:
      'Why is it `O(N)` instead of `O(N log N)`? Leaves (`N/2` nodes) do `0` work; nodes 1 level above leaves (`N/4` nodes) do at most `1` swap; nodes at height `h` (`N / 2^(h+1)` nodes) do at most `h` swaps. Summing `sum(h / 2^(h+1))` converges to `<= 2N`, which is strictly `O(N)`.',
    realWorldAnalogy:
      'Building a tournament pyramid from the bottom up rather than inserting one player at a time from the top.',
    algorithm:
      '1. For `i` from `(n / 2) - 1` down to `0`:\n   - Call `heapify(arr, n, i)`.',
    pseudocode: `for i from (n // 2) - 1 down to 0:
    heapify(arr, n, i)`,
    dryRunExample:
      '`arr = [4, 10, 3, 5, 1]` (`n = 5`, start at `i = 1`):\n- `i=1 (10)`: children `5, 1` -> already valid\n- `i=0 (4)`: swap with `10` -> `[10, 4, 3, 5, 1]`, then `4` swaps with `5` -> `[10, 5, 3, 4, 1]`.',
    timeComplexity: 'O(N) — tighter than O(N log N) repeated insertion',
    spaceComplexity: 'O(1) in-place',
    commonMistakes: [
      'Looping forward `0 .. n/2 - 1` instead of backward `n/2 - 1 .. 0` (violates `heapify`’s precondition that subtrees are already heaps!).',
    ],
    interviewTips: [
      'Be ready to sketch the geometric series proof showing `buildHeap` is `O(N)`—it’s a classic interview question.',
    ],
    implementations: {
      c: `void buildMaxHeap(int arr[], int n) {\n    for (int i = n / 2 - 1; i >= 0; i--) maxHeapify(arr, n, i);\n}`,
      cpp: `void buildMaxHeap(std::vector<int>& arr) {\n    int n = static_cast<int>(arr.size());\n    for (int i = n / 2 - 1; i >= 0; --i) maxHeapify(arr, n, i);\n}`,
      java: `public class BuildHeap {\n    public static void buildMaxHeap(int[] arr) {\n        for (int i = arr.length / 2 - 1; i >= 0; i--) Heapify.maxHeapify(arr, arr.length, i);\n    }\n}`,
      python: `import heapq\n# Python's built-in heapq.heapify(arr) runs Floyd's O(N) Min-Heap construction in-place!`,
    },
  },
  {
    topicSlug: 'priority-queue-concept',
    title: 'Priority Queue Abstract Data Type',
    definition:
      'A Priority Queue is an Abstract Data Type (ADT) where each element has a priority and `pop()` always removes the element with the highest (or lowest) priority rather than FIFO order.',
    explanation:
      'While a Priority Queue can be implemented with an unsorted array (`O(1)` push, `O(N)` pop) or a sorted array (`O(N)` push, `O(1)` pop), a **Binary Heap** balances both at `O(log N)` push/pop and `O(1)` peek—making it the standard implementation in C++ (`std::priority_queue`), Java (`PriorityQueue`), and Python (`heapq`).',
    realWorldAnalogy:
      'An airport boarding gate where First Class, Business, and Economy passengers board by priority tier rather than arrival time.',
    algorithm:
      'Core operations:\n- `push(item, priority)` -> `O(log N)`\n- `peek()` -> `O(1)`\n- `pop()` -> `O(log N)`',
    pseudocode: `pq.push((priority, item))
topItem <- pq.peek()
pq.pop()`,
    dryRunExample:
      'Min-PQ receives `(3, "C"), (1, "A"), (2, "B")`: `pop()` returns `"A"`, then `"B"`, then `"C"`.',
    timeComplexity: 'O(log N) push/pop, O(1) top',
    spaceComplexity: 'O(N)',
    commonMistakes: [
      'Expecting `PriorityQueue` iteration (`for x : pq`) in Java/C++ to yield elements in sorted order (it yields heap-array order, not sorted order!).',
    ],
    interviewTips: [
      'In Python `heapq`, when pushing `(priority, obj)` tuples where `obj` isn’t comparable, include a tie-breaker counter `(priority, idx, obj)` to avoid `TypeError`.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'heap-sort',
    title: 'Heap Sort',
    definition:
      'Heap Sort is an in-place, comparison-based sorting algorithm that builds a Max-Heap in `O(N)` time and repeatedly swaps the root (maximum) with the end of the unsorted prefix, shrinking the heap and calling `heapify` in `O(N log N)` total time.',
    explanation:
      'Heap Sort combines the best of Merge Sort (`O(N log N)` worst-case time, no `O(N^2)` pivot risk) and Insertion Sort (`O(1)` auxiliary space). However, it is **not stable** and has poorer cache locality than QuickSort.',
    realWorldAnalogy:
      'Repeatedly crowning the heaviest weightlifter (`heap[0]`), moving them to the podium at the back of the line, and re-evaluating the remaining contenders.',
    algorithm:
      '1. Build a Max-Heap over `arr[0..n-1]` (`O(N)`).\n2. For `end` from `n - 1` down to `1`:\n   - `swap(arr[0], arr[end])`\n   - `maxHeapify(arr, end, 0)` (on reduced heap size `end`).',
    pseudocode: `buildMaxHeap(arr, n)
for end from n - 1 down to 1:
    swap(arr[0], arr[end])
    maxHeapify(arr, end, 0)`,
    dryRunExample:
      '`[4, 10, 3, 5, 1]` -> Max-Heap `[10, 5, 3, 4, 1]` -> swap `10` to end `[1, 5, 3, 4 | 10]` -> heapify -> `[5, 4, 3, 1 | 10]` -> ... -> `[1, 3, 4, 5, 10]`.',
    timeComplexity: 'O(N log N) best, average, and worst case',
    spaceComplexity: 'O(1) auxiliary (in-place with iterative heapify)',
    commonMistakes: [
      'Calling `maxHeapify(arr, n, 0)` with full `n` instead of shrinking size `end` (corrupts already-sorted suffix!).',
    ],
    interviewTips: [
      'C++ `std::sort` uses **Introsort** (QuickSort + HeapSort fallback when recursion exceeds `2 log N` + InsertionSort for small partitions).',
    ],
    implementations: {
      c: `void heapSort(int arr[], int n) {\n    for (int i = n / 2 - 1; i >= 0; i--) maxHeapify(arr, n, i);\n    for (int end = n - 1; end > 0; end--) {\n        int t = arr[0]; arr[0] = arr[end]; arr[end] = t;\n        maxHeapify(arr, end, 0);\n    }\n}`,
      cpp: `void heapSort(std::vector<int>& arr) {\n    int n = static_cast<int>(arr.size());\n    for (int i = n / 2 - 1; i >= 0; --i) maxHeapify(arr, n, i);\n    for (int end = n - 1; end > 0; --end) {\n        std::swap(arr[0], arr[end]);\n        maxHeapify(arr, end, 0);\n    }\n}`,
      java: `public class HeapSort {\n    public static void sort(int[] arr) {\n        int n = arr.length;\n        for (int i = n / 2 - 1; i >= 0; i--) Heapify.maxHeapify(arr, n, i);\n        for (int end = n - 1; end > 0; end--) {\n            int t = arr[0]; arr[0] = arr[end]; arr[end] = t;\n            Heapify.maxHeapify(arr, end, 0);\n        }\n    }\n}`,
      python: `def heap_sort(arr: list[int]) -> None:\n    n = len(arr)\n    for i in range(n // 2 - 1, -1, -1): max_heapify(arr, n, i)\n    for end in range(n - 1, 0, -1):\n        arr[0], arr[end] = arr[end], arr[0]\n        max_heapify(arr, end, 0)`,
    },
  },
  {
    topicSlug: 'kth-largest-element',
    title: 'Kth Largest Element in an Array',
    definition:
      'Find the `k`-th largest element in an unsorted array of `N` elements (in sorted descending order, not `k`-th distinct).',
    explanation:
      'Maintain a **Min-Heap of size `k`**: push each element, and whenever `heap.size() > k`, pop the smallest element. After scanning all `N` elements, the heap holds the `k` largest elements, and its root (`heap.peek()`) is the smallest of those `k`—which is exactly the `k`-th largest! Time is `O(N log k)` and space is `O(k)` (works even on streams!).',
    realWorldAnalogy:
      'Keeping a Top-10 leaderboard: whenever a new score arrives, add it and evict the 11th-place (lowest) score.',
    algorithm:
      '1. Create empty `minHeap`.\n2. For each `x` in `nums`:\n   - `minHeap.push(x)`\n   - If `minHeap.size() > k`, `minHeap.pop()`.\n3. Return `minHeap.peek()`.',
    pseudocode: `minHeap <- empty
for x in nums:
    minHeap.push(x)
    if len(minHeap) > k: minHeap.pop()
return minHeap.peek()`,
    dryRunExample:
      '`nums = [3, 2, 1, 5, 6, 4]`, `k = 2`: heap ends with `[5, 6]`, root = `5` (2nd largest).',
    timeComplexity: 'O(N log k) with Min-Heap (or O(N) average with Quickselect)',
    spaceComplexity: 'O(k) for Min-Heap',
    commonMistakes: [
      'Using a Max-Heap of size `N` (`O(N)` space, `O(N log N)` time) instead of a Min-Heap of size `k` (`O(k)` space).',
    ],
    interviewTips: [
      'Discuss both **Min-Heap (`O(N log k)` guaranteed, streaming-friendly)** and **Quickselect (`O(N)` average, `O(N^2)` worst case)**.',
    ],
    implementations: {
      c: `// Maintain a k-element Min-Heap; pop when size > k`,
      cpp: `#include <functional>\n#include <queue>\n#include <vector>\nusing namespace std;\n\nint findKthLargest(const vector<int>& nums, int k) {\n    priority_queue<int, vector<int>, greater<int>> pq;\n    for (int x : nums) {\n        pq.push(x);\n        if (static_cast<int>(pq.size()) > k) pq.pop();\n    }\n    return pq.top();\n}`,
      java: `import java.util.PriorityQueue;\npublic class KthLargest {\n    public static int findKthLargest(int[] nums, int k) {\n        PriorityQueue<Integer> pq = new PriorityQueue<>();\n        for (int x : nums) {\n            pq.offer(x);\n            if (pq.size() > k) pq.poll();\n        }\n        return pq.peek();\n    }\n}`,
      python: `import heapq\ndef find_kth_largest(nums: list[int], k: int) -> int:\n    h = []\n    for x in nums:\n        heapq.heappush(h, x)\n        if len(h) > k: heapq.heappop(h)\n    return h[0]`,
    },
  },
  {
    topicSlug: 'top-k-frequent-elements',
    title: 'Top K Frequent Elements',
    definition:
      'Given an integer array `nums` and an integer `k`, return the `k` most frequently occurring elements.',
    explanation:
      'First count frequencies in `O(N)` using a hash map (`val -> freq`). Then either (1) maintain a Min-Heap of size `k` keyed by `(freq, val)` in `O(N log k)` time, or (2) use **Bucket Sort** on frequencies `1..N` to achieve `O(N)` time.',
    realWorldAnalogy:
      'Finding the top `k` trending hashtags by tallying counts and keeping only the `k` highest-count tags.',
    algorithm:
      '1. Build `freqMap[x]++` for all `x` in `nums`.\n2. For each `(val, freq)` in `freqMap`:\n   - Push `(freq, val)` into `minHeap`.\n   - If `minHeap.size() > k`, `minHeap.pop()`.\n3. Extract all `val`s from `minHeap`.',
    pseudocode: `freq <- Counter(nums)
minHeap <- empty
for (val, f) in freq:
    minHeap.push((f, val))
    if len(minHeap) > k: minHeap.pop()
return [val for (f, val) in minHeap]`,
    dryRunExample:
      '`nums = [1, 1, 1, 2, 2, 3]`, `k = 2`: `freq = {1:3, 2:2, 3:1}`, Min-Heap of size 2 keeps `(2,2)` and `(3,1)` -> `[1, 2]`.',
    timeComplexity: 'O(N log k) with Min-Heap (or O(N) with Bucket Sort)',
    spaceComplexity: 'O(N) for frequency map + O(k) for heap',
    commonMistakes: [
      'Sorting all `U` unique pairs (`O(U log U)`) when `U >> k`.',
    ],
    interviewTips: [
      'Mention the `O(N)` Bucket Sort optimization (`buckets[freq].push_back(val)`) right after the `O(N log k)` heap solution.',
    ],
    implementations: {
      c: `// Hash frequencies, then maintain size-k Min-Heap of (freq, val) pairs`,
      cpp: `#include <queue>\n#include <unordered_map>\n#include <vector>\nusing namespace std;\n\nvector<int> topKFrequent(const vector<int>& nums, int k) {\n    unordered_map<int, int> freq;\n    for (int x : nums) ++freq[x];\n    using P = pair<int, int>;\n    priority_queue<P, vector<P>, greater<P>> pq;\n    for (auto& [val, f] : freq) {\n        pq.push({f, val});\n        if (static_cast<int>(pq.size()) > k) pq.pop();\n    }\n    vector<int> res;\n    while (!pq.empty()) { res.push_back(pq.top().second); pq.pop(); }\n    return res;\n}`,
      java: `import java.util.*;\npublic class TopKFrequent {\n    public static int[] topKFrequent(int[] nums, int k) {\n        Map<Integer, Integer> freq = new HashMap<>();\n        for (int x : nums) freq.merge(x, 1, Integer::sum);\n        PriorityQueue<Integer> pq = new PriorityQueue<>(Comparator.comparingInt(freq::get));\n        for (int key : freq.keySet()) {\n            pq.offer(key);\n            if (pq.size() > k) pq.poll();\n        }\n        int[] res = new int[k];\n        for (int i = 0; i < k; i++) res[i] = pq.poll();\n        return res;\n    }\n}`,
      python: `from collections import Counter\nimport heapq\n\ndef top_k_frequent(nums: list[int], k: int) -> list[int]:\n    freq = Counter(nums)\n    return heapq.nlargest(k, freq.keys(), key=freq.get)`,
    },
  },
  {
    topicSlug: 'merge-k-sorted-lists',
    title: 'Merge K Sorted Lists / Arrays',
    definition:
      'Given `k` sorted linked lists (or arrays) containing `N` total elements, merge them into one sorted list in `O(N log k)` time.',
    explanation:
      'Maintain a Min-Heap of size at most `k` holding the current head node from each non-empty list. Repeatedly pop the smallest node, attach it to the merged tail, and if that node has a `next`, push `node.next` into the Min-Heap. Each of the `N` elements enters and leaves a heap of size `<= k` once.',
    realWorldAnalogy:
      'Merging `k` sorted marathon finish logs by looking only at the front runner of each log and picking the fastest among those `k` candidates.',
    algorithm:
      '1. Push the head of every non-empty list into `minHeap`.\n2. Create `dummy` head and `tail = dummy`.\n3. While `minHeap` is non-empty:\n   - Pop smallest `node`, set `tail.next = node`, `tail = node`.\n   - If `node.next != null`, push `node.next`.\n4. Return `dummy.next`.',
    pseudocode: `for head in lists:
    if head != null: minHeap.push(head)
dummy <- Node(0), tail <- dummy
while minHeap not empty:
    node <- minHeap.pop()
    tail.next <- node; tail <- node
    if node.next != null: minHeap.push(node.next)
return dummy.next`,
    dryRunExample:
      'Lists `[1->4->5]`, `[1->3->4]`, `[2->6]`: heap pops `1, 1, 2, 3, 4, 4, 5, 6` -> `1->1->2->3->4->4->5->6`.',
    timeComplexity: 'O(N log k) where N is total nodes and k is number of lists',
    spaceComplexity: 'O(k) for the Min-Heap',
    commonMistakes: [
      'Merging lists sequentially one by one (`O(N * k)` instead of `O(N log k)`).',
      'In Python, pushing `(node.val, node)` without a tie-breaker index `(node.val, idx, node)` causes `TypeError` on equal values.',
    ],
    interviewTips: [
      'Pairwise Divide & Conquer merging also achieves `O(N log k)` time with `O(1)` iterative space!',
    ],
    implementations: {
      c: `// Store k heads in a Min-Heap of ListNode*; pop min and push node->next`,
      cpp: `#include <queue>\n#include <vector>\nusing namespace std;\n\nstruct ListNode { int val; ListNode* next; ListNode(int x) : val(x), next(nullptr) {} };\nListNode* mergeKLists(vector<ListNode*>& lists) {\n    auto cmp = [](ListNode* a, ListNode* b) { return a->val > b->val; };\n    priority_queue<ListNode*, vector<ListNode*>, decltype(cmp)> pq(cmp);\n    for (auto* head : lists) if (head) pq.push(head);\n    ListNode dummy(0), *tail = &dummy;\n    while (!pq.empty()) {\n        ListNode* cur = pq.top(); pq.pop();\n        tail->next = cur; tail = cur;\n        if (cur->next) pq.push(cur->next);\n    }\n    return dummy.next;\n}`,
      java: `import java.util.*;\npublic class MergeKLists {\n    public static ListNode mergeKLists(ListNode[] lists) {\n        PriorityQueue<ListNode> pq = new PriorityQueue<>(Comparator.comparingInt(n -> n.val));\n        for (ListNode h : lists) if (h != null) pq.offer(h);\n        ListNode dummy = new ListNode(0), tail = dummy;\n        while (!pq.isEmpty()) {\n            ListNode cur = pq.poll();\n            tail.next = cur; tail = cur;\n            if (cur.next != null) pq.offer(cur.next);\n        }\n        return dummy.next;\n    }\n}`,
      python: `import heapq\ndef merge_k_lists(lists: list) -> object:\n    pq = []\n    for i, head in enumerate(lists):\n        if head: heapq.heappush(pq, (head.val, i, head))\n    dummy = tail = type('Node', (), {'val': 0, 'next': None})()\n    while pq:\n        _, i, node = heapq.heappop(pq)\n        tail.next = node; tail = node\n        if node.next: heapq.heappush(pq, (node.next.val, i, node.next))\n    return dummy.next`,
    },
  },
  {
    topicSlug: 'median-from-data-stream',
    title: 'Find Median from Data Stream (Two Heaps)',
    definition:
      'Design a data structure supporting `addNum(int num)` in `O(log N)` and `findMedian()` in `O(1)` on a continuous stream of integers.',
    explanation:
      'Split the numbers seen so far into two balanced halves:\n- `maxHeap` (`low`): stores the smaller half of numbers (top is largest of smaller half).\n- `minHeap` (`high`): stores the larger half of numbers (top is smallest of larger half).\nMaintain two invariants: (1) every element in `low <=` every element in `high`, and (2) `low.size() == high.size()` or `low.size() == high.size() + 1`. Then the median is `low.top()` (odd count) or `(low.top() + high.top()) / 2.0` (even count).',
    realWorldAnalogy:
      'Two stacks of exam papers split at the median score: the left stack is sorted face-up with the highest of the lower half on top; the right stack is sorted with the lowest of the upper half on top.',
    algorithm:
      '1. `addNum(x)`: push `x` to `low`, pop `low.top()` and push to `high` (keeps ordering invariant), then if `high.size() > low.size()`, pop `high.top()` and push to `low` (keeps size invariant).\n2. `findMedian()`: if `low.size() > high.size()`, return `low.top()`; else return `(low.top() + high.top()) / 2.0`.',
    pseudocode: `addNum(x):
    low.push(x)
    high.push(low.pop())
    if len(high) > len(low):
        low.push(high.pop())

findMedian():
    if len(low) > len(high): return low.top()
    return (low.top() + high.top()) / 2.0`,
    dryRunExample:
      'Stream `1, 2, 3`:\n- `add(1)`: `low=[1], high=[]` -> median `1.0`\n- `add(2)`: `low=[1], high=[2]` -> median `1.5`\n- `add(3)`: `low=[2,1], high=[3]` -> median `2.0`.',
    timeComplexity: 'O(log N) per addNum, O(1) per findMedian',
    spaceComplexity: 'O(N)',
    commonMistakes: [
      'Pushing directly into `low` or `high` without rebalancing through the other heap (can violate `low.top() <= high.top()`).',
      'Integer division `(a + b) / 2` instead of floating-point `/ 2.0`.',
    ],
    interviewTips: [
      'The 3-step `addNum` (`low -> high -> balance`) is cleaner and less error-prone than branching `if/else` on sizes.',
    ],
    implementations: {
      c: `// Maintain two fixed/dynamic arrays: Max-Heap low and Min-Heap high`,
      cpp: `#include <queue>\n#include <vector>\nusing namespace std;\n\nclass MedianFinder {\n    priority_queue<int> low;\n    priority_queue<int, vector<int>, greater<int>> high;\npublic:\n    void addNum(int num) {\n        low.push(num);\n        high.push(low.top()); low.pop();\n        if (high.size() > low.size()) { low.push(high.top()); high.pop(); }\n    }\n    double findMedian() const {\n        return low.size() > high.size() ? low.top() : (low.top() + high.top()) / 2.0;\n    }\n};`,
      java: `import java.util.*;\nclass MedianFinder {\n    private final PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder());\n    private final PriorityQueue<Integer> high = new PriorityQueue<>();\n    public void addNum(int num) {\n        low.offer(num);\n        high.offer(low.poll());\n        if (high.size() > low.size()) low.offer(high.poll());\n    }\n    public double findMedian() {\n        return low.size() > high.size() ? low.peek() : (low.peek() + high.peek()) / 2.0;\n    }\n}`,
      python: `import heapq\nclass MedianFinder:\n    def __init__(self):\n        self.low, self.high = [], []  # low is negated max-heap\n    def add_num(self, num: int) -> None:\n        heapq.heappush(self.low, -num)\n        heapq.heappush(self.high, -heapq.heappop(self.low))\n        if len(self.high) > len(self.low):\n            heapq.heappush(self.low, -heapq.heappop(self.high))\n    def find_median(self) -> float:\n        if len(self.low) > len(self.high): return float(-self.low[0])\n        return (-self.low[0] + self.high[0]) / 2.0`,
    },
  },
];

export default modules17bto18Notes;
