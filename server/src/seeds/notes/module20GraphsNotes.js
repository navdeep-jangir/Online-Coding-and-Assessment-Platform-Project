// Rich original learning notes for Module 20: Graphs (33 concepts)

const module20GraphsNotes = [
  {
    topicSlug: 'graph-terminology',
    title: 'Graph Terminology & Fundamentals',
    definition:
      'A **graph** `G = (V, E)` consists of a set of **vertices** (nodes) `V` and a set of **edges** `E` connecting pairs of vertices.',
    explanation:
      '- **Degree:** Number of edges incident to a vertex (in directed graphs: **in-degree** and **out-degree**).\n- **Path:** A sequence of vertices connected by edges; a **simple path** repeats no vertices.\n- **Cycle:** A path starting and ending at the same vertex with at least one edge.\n- **Connected Graph:** Every pair of vertices has a path between them.\n- **DAG:** Directed Acyclic Graph (no directed cycles; supports topological ordering).',
    realWorldAnalogy:
      'A city road map (intersections = vertices, roads = edges) or a social network (users = vertices, friendships = edges).',
    algorithm:
      'Handshaking Lemma for undirected graphs:\n`sum(deg(v) for v in V) = 2 * |E|`.\nIn any graph, `0 <= |E| <= |V| * (|V| - 1) / 2` (undirected simple graph).',
    pseudocode: `// Sparse graph: |E| = O(|V|)   -> prefer Adjacency List
// Dense graph:  |E| = O(|V|^2) -> Adjacency Matrix can be viable`,
    dryRunExample:
      'A triangle `0-1, 1-2, 2-0` has `|V| = 3`, `|E| = 3`, every vertex has degree `2`, and `sum(deg) = 6 = 2 * 3`.',
    timeComplexity: 'Traversals take `O(V + E)` with Adjacency List or `O(V^2)` with Adjacency Matrix',
    spaceComplexity: '`O(V + E)` for Adjacency List; `O(V^2)` for Adjacency Matrix',
    commonMistakes: [
      'Assuming graphs are always connected or simple (forgetting disconnected components, self-loops, or parallel edges).',
    ],
    interviewTips: [
      'Always ask: Directed or undirected? Weighted or unweighted? Connected or possibly disconnected? 0-indexed or 1-indexed?',
    ],
    implementations: {},
  },
  {
    topicSlug: 'directed-and-undirected',
    title: 'Directed vs. Undirected Graphs',
    definition:
      'In an **undirected graph**, edge `(u, v)` is symmetric (bidirectional); in a **directed graph (digraph)**, edge `u -> v` is one-way from `u` to `v`.',
    explanation:
      'Undirected edges are stored twice in an adjacency list (`adj[u].push(v)` and `adj[v].push(u)`), whereas directed edges are stored once (`adj[u].push(v)`). Cycle detection and connectivity differ sharply between the two: undirected graphs use parent tracking (`v != parent`), while directed graphs require 3-color recursion-stack tracking or Kahn’s in-degree algorithm.',
    realWorldAnalogy:
      'Two-way neighborhood streets (undirected) vs. one-way downtown streets or hyperlinks on the web (directed).',
    algorithm:
      '- **Undirected:** add `u -> v` and `v -> u`.\n- **Directed:** add only `u -> v` (and optionally `v -> u` in a reverse graph `revAdj` for Kosaraju’s SCC).',
    pseudocode: `addEdge(u, v, isDirected):
    adj[u].append(v)
    if not isDirected:
        adj[v].append(u)`,
    dryRunExample:
      'In a digraph `0 -> 1`, `outDeg(0) = 1, inDeg(0) = 0`, `outDeg(1) = 0, inDeg(1) = 1`.',
    timeComplexity: '`O(1)` per edge insertion',
    spaceComplexity: '`O(V + E)`',
    commonMistakes: [
      'Using undirected parent-check cycle detection on a directed graph (fails on diamond DAGs like `0->1, 0->2, 1->3, 2->3`).',
    ],
    interviewTips: [
      'Notice that every undirected edge is equivalent to two opposite directed edges, except when counting simple cycles of length 2.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'weighted-and-unweighted',
    title: 'Weighted vs. Unweighted Graphs',
    definition:
      'An **unweighted graph** treats every edge as having unit cost `1`, while a **weighted graph** attaches a numeric weight `w(u, v)` (distance, cost, latency, or capacity) to each edge.',
    explanation:
      'Choosing the right shortest-path algorithm depends directly on edge weights:\n- **Unweighted:** BFS (`O(V + E)`).\n- **0/1 weights:** 0-1 BFS with a Deque (`O(V + E)`).\n- **Non-negative weights:** Dijkstra (`O((V + E) log V)`).\n- **Negative weights:** Bellman-Ford (`O(V * E)`).',
    realWorldAnalogy:
      'Counting subway stops between stations (unweighted) vs. minimizing driving minutes with traffic delays (weighted).',
    algorithm:
      'Store weighted adjacency entries as `(neighbor, weight)` pairs.',
    pseudocode: `adj[u].append((v, weight))`,
    dryRunExample:
      'A 2-edge path `A -1-> B -2-> C` (total weight `3`) beats a 1-edge path `A -10-> C` even though it has more hops.',
    timeComplexity: 'Depends on shortest-path algorithm chosen',
    spaceComplexity: '`O(V + E)`',
    commonMistakes: [
      'Using plain BFS on a weighted graph (BFS minimizes hop count, NOT total edge weight!).',
    ],
    interviewTips: [
      'Whenever edge weights are all `0` or `1`, mention **0-1 BFS** (`push_front` for `0`, `push_back` for `1`)—it beats Dijkstra’s `log V` factor.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'adjacency-matrix',
    title: 'Adjacency Matrix Representation',
    definition:
      'An **adjacency matrix** is a `V x V` 2D array `mat` where `mat[u][v] = 1` (or `weight`) if edge `(u, v)` exists, and `0` (or `INF`) otherwise.',
    explanation:
      'Adjacency matrices provide `O(1)` edge-existence queries (`isEdge(u, v)`) and are required by **Floyd-Warshall** (`O(V^3)`). However, iterating neighbors of `u` takes `O(V)` even in sparse graphs, and memory is `O(V^2)`, which overflows memory when `V > 10^4`.',
    realWorldAnalogy:
      'A mileage table at the back of a road atlas showing the direct distance between every pair of cities.',
    algorithm:
      '1. Allocate `mat[V][V]` initialized to `0` (or `INF` for weighted, `0` on diagonal).\n2. For edge `(u, v, w)`: set `mat[u][v] = w` (and `mat[v][u] = w` if undirected).',
    pseudocode: `mat <- V x V matrix filled with 0
addEdge(u, v, w=1):
    mat[u][v] <- w`,
    dryRunExample:
      'For `V = 3` with edges `(0,1)` and `(1,2)` (undirected): `mat[0][1] = mat[1][0] = 1`, `mat[1][2] = mat[2][1] = 1`.',
    timeComplexity: '`O(1)` edge check/update; `O(V)` to list neighbors; `O(V^2)` full traversal',
    spaceComplexity: '`O(V^2)`',
    commonMistakes: [
      'Allocating a `10^5 x 10^5` matrix (`10^10` ints = 40 GB -> Memory Limit Exceeded!).',
    ],
    interviewTips: [
      'Use Adjacency Matrix only when `V <= 500` (dense graphs, Floyd-Warshall) or when `O(1)` edge lookup is critical.',
    ],
    implementations: {
      c: `int mat[100][100] = {0};\nvoid addEdgeMat(int u, int v, int w) { mat[u][v] = w; mat[v][u] = w; }`,
      cpp: `#include <vector>\nusing namespace std;\nvector<vector<int>> buildAdjMatrix(int V, const vector<pair<int,int>>& edges) {\n    vector<vector<int>> mat(V, vector<int>(V, 0));\n    for (auto [u, v] : edges) { mat[u][v] = 1; mat[v][u] = 1; }\n    return mat;\n}`,
      java: `public class AdjMatrix {\n    public static int[][] build(int V, int[][] edges) {\n        int[][] mat = new int[V][V];\n        for (int[] e : edges) { mat[e[0]][e[1]] = 1; mat[e[1]][e[0]] = 1; }\n        return mat;\n    }\n}`,
      python: `def build_adj_matrix(v_count: int, edges: list[tuple[int, int]]) -> list[list[int]]:\n    mat = [[0] * v_count for _ in range(v_count)]\n    for u, v in edges:\n        mat[u][v] = mat[v][u] = 1\n    return mat`,
    },
  },
  {
    topicSlug: 'adjacency-list',
    title: 'Adjacency List Representation',
    definition:
      'An **adjacency list** stores an array of lists `adj[0..V-1]`, where `adj[u]` contains only the neighbors directly connected to vertex `u`.',
    explanation:
      'Most real-world and interview graphs are sparse (`E << V^2`). Adjacency lists use `O(V + E)` memory and iterate over `u`’s neighbors in `O(deg(u))`, making BFS and DFS `O(V + E)`.',
    realWorldAnalogy:
      'Each person keeping a personal contact list of only their own friends rather than a giant global grid of everyone on Earth.',
    algorithm:
      '1. Initialize `adj` as `V` empty lists.\n2. For each edge `(u, v)`: append `v` to `adj[u]` (and `u` to `adj[v]` if undirected).',
    pseudocode: `adj <- array of V empty lists
for (u, v) in edges:
    adj[u].append(v)
    if undirected: adj[v].append(u)`,
    dryRunExample:
      'Triangle `0-1, 1-2, 2-0`: `adj[0]=[1,2]`, `adj[1]=[0,2]`, `adj[2]=[1,0]`.',
    timeComplexity: '`O(1)` add edge; `O(deg(u))` iterate neighbors; `O(V + E)` traversal',
    spaceComplexity: '`O(V + E)`',
    commonMistakes: [
      'Forgetting to size `adj` to `V + 1` for 1-indexed vertices.',
    ],
    interviewTips: [
      'Adjacency List is the default graph representation for almost all interview problems.',
    ],
    implementations: {
      c: `// Use dynamic arrays or linked-list head[V] + next[2*E] + to[2*E] (forward star)`,
      cpp: `#include <vector>\nusing namespace std;\nvector<vector<int>> buildAdjList(int V, const vector<pair<int,int>>& edges) {\n    vector<vector<int>> adj(V);\n    for (auto [u, v] : edges) { adj[u].push_back(v); adj[v].push_back(u); }\n    return adj;\n}`,
      java: `import java.util.*;\npublic class AdjList {\n    public static List<List<Integer>> build(int V, int[][] edges) {\n        List<List<Integer>> adj = new ArrayList<>(V);\n        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());\n        for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }\n        return adj;\n    }\n}`,
      python: `def build_adj_list(v_count: int, edges: list[tuple[int, int]]) -> list[list[int]]:\n    adj = [[] for _ in range(v_count)]\n    for u, v in edges:\n        adj[u].append(v); adj[v].append(u)\n    return adj`,
    },
  },
  {
    topicSlug: 'bfs-traversal',
    title: 'Breadth-First Search (BFS) in Graphs',
    definition:
      '**Breadth-First Search (BFS)** explores a graph level by level outward from a source vertex `src` using a FIFO queue, visiting all vertices at distance `d` before any at distance `d + 1`.',
    explanation:
      'Mark `visited[v] = true` **immediately when pushing `v` onto the queue** (not when popping!), preventing the same vertex from being enqueued multiple times by different neighbors. BFS automatically finds the **shortest path** (fewest edges) in unweighted graphs.',
    realWorldAnalogy:
      'Ripples spreading outward in concentric circles when a pebble drops into a pond.',
    algorithm:
      '1. Set `visited[src] = true`, push `src` to `queue`.\n2. While `queue` non-empty:\n   - Pop `u`, process `u`.\n   - For each `v` in `adj[u]`: if `!visited[v]`, set `visited[v] = true`, `dist[v] = dist[u] + 1`, push `v`.',
    pseudocode: `visited[src] <- true; q.push(src)
while q not empty:
    u <- q.pop()
    order.append(u)
    for v in adj[u]:
        if not visited[v]:
            visited[v] <- true
            q.push(v)`,
    dryRunExample:
      'Graph `0-1, 0-2, 1-3, 2-4` from `0`: Queue `0 -> [1,2] -> [2,3] -> [3,4]` -> BFS order `[0, 1, 2, 3, 4]`.',
    timeComplexity: '`O(V + E)`',
    spaceComplexity: '`O(V)` for `visited` and `queue`',
    commonMistakes: [
      'Marking `visited[u] = true` on pop instead of on push—causes duplicate enqueues and `O(E)` queue blowup!',
    ],
    interviewTips: [
      'Multi-source BFS (e.g., Rotting Oranges) simply pushes all starting sources into `queue` at `dist = 0` before starting the loop.',
    ],
    implementations: {
      c: `void bfs(int V, int adj[][100], int deg[], int src) {\n    int vis[100] = {0}, q[100], head = 0, tail = 0;\n    vis[src] = 1; q[tail++] = src;\n    while (head < tail) {\n        int u = q[head++];\n        printf("%d ", u);\n        for (int i = 0; i < deg[u]; i++) {\n            int v = adj[u][i];\n            if (!vis[v]) { vis[v] = 1; q[tail++] = v; }\n        }\n    }\n}`,
      cpp: `#include <queue>\n#include <vector>\nusing namespace std;\nvector<int> bfs(int V, const vector<vector<int>>& adj, int src) {\n    vector<bool> vis(V, false); vector<int> order; queue<int> q;\n    vis[src] = true; q.push(src);\n    while (!q.empty()) {\n        int u = q.front(); q.pop(); order.push_back(u);\n        for (int v : adj[u]) if (!vis[v]) { vis[v] = true; q.push(v); }\n    }\n    return order;\n}`,
      java: `import java.util.*;\npublic class GraphBFS {\n    public static List<Integer> bfs(int V, List<List<Integer>> adj, int src) {\n        boolean[] vis = new boolean[V]; List<Integer> order = new ArrayList<>();\n        Queue<Integer> q = new ArrayDeque<>(); vis[src] = true; q.offer(src);\n        while (!q.isEmpty()) {\n            int u = q.poll(); order.add(u);\n            for (int v : adj.get(u)) if (!vis[v]) { vis[v] = true; q.offer(v); }\n        }\n        return order;\n    }\n}`,
      python: `from collections import deque\ndef bfs(v_count: int, adj: list[list[int]], src: int) -> list[int]:\n    vis = [False] * v_count; vis[src] = True\n    q, order = deque([src]), []\n    while q:\n        u = q.popleft(); order.append(u)\n        for v in adj[u]:\n            if not vis[v]: vis[v] = True; q.append(v)\n    return order`,
    },
  },
  {
    topicSlug: 'dfs-traversal',
    title: 'Depth-First Search (DFS) in Graphs',
    definition:
      '**Depth-First Search (DFS)** explores as deeply as possible along each branch from `src` before backtracking to explore remaining unvisited neighbors.',
    explanation:
      'DFS uses recursion (or an explicit stack) plus a `visited[]` array to avoid infinite loops on cycles. It is the backbone of cycle detection, topological sort, connected components, bridges/articulation points, and Tarjan’s/Kosaraju’s SCC algorithms.',
    realWorldAnalogy:
      'Exploring a cave system by always taking the first unexplored tunnel until a dead end forces you to backtrack.',
    algorithm:
      '1. `dfs(u)`: mark `visited[u] = true`, record `u`.\n2. For each `v` in `adj[u]`: if `!visited[v]`, call `dfs(v)`.',
    pseudocode: `dfs(u):
    visited[u] <- true
    order.append(u)
    for v in adj[u]:
        if not visited[v]: dfs(v)`,
    dryRunExample:
      'Graph `0-1, 0-2, 1-3, 2-4` from `0`: `0 -> 1 -> 3` (backtrack) `-> 2 -> 4` -> DFS order `[0, 1, 3, 2, 4]`.',
    timeComplexity: '`O(V + E)`',
    spaceComplexity: '`O(V)` for `visited` and recursion stack',
    commonMistakes: [
      'Forgetting an outer loop `for (int i = 0; i < V; i++) if (!vis[i]) dfs(i);` on disconnected graphs.',
    ],
    interviewTips: [
      'Use iterative DFS with an explicit stack if `V` can reach `10^5` in a long chain (prevents stack overflow).',
    ],
    implementations: {
      c: `void dfs(int u, int adj[][100], int deg[], int vis[]) {\n    vis[u] = 1; printf("%d ", u);\n    for (int i = 0; i < deg[u]; i++) if (!vis[adj[u][i]]) dfs(adj[u][i], adj, deg, vis);\n}`,
      cpp: `#include <vector>\nusing namespace std;\nvoid dfsHelper(int u, const vector<vector<int>>& adj, vector<bool>& vis, vector<int>& order) {\n    vis[u] = true; order.push_back(u);\n    for (int v : adj[u]) if (!vis[v]) dfsHelper(v, adj, vis, order);\n}`,
      java: `import java.util.*;\npublic class GraphDFS {\n    public static void dfs(int u, List<List<Integer>> adj, boolean[] vis, List<Integer> order) {\n        vis[u] = true; order.add(u);\n        for (int v : adj.get(u)) if (!vis[v]) dfs(v, adj, vis, order);\n    }\n}`,
      python: `def dfs(v_count: int, adj: list[list[int]], src: int) -> list[int]:\n    vis, order = [False] * v_count, []\n    def go(u: int) -> None:\n        vis[u] = True; order.append(u)\n        for v in adj[u]:\n            if not vis[v]: go(v)\n    go(src)\n    return order`,
    },
  },
  {
    topicSlug: 'connected-components',
    title: 'Connected Components in Undirected Graphs',
    definition:
      'A **connected component** is a maximal set of vertices in an undirected graph such that every pair of vertices in the set has a path between them.',
    explanation:
      'Loop through every vertex `i = 0 .. V - 1`. Whenever `!visited[i]`, increment `components++` and launch DFS/BFS from `i` to mark all vertices reachable from `i` as visited. Alternatively, DSU unions every edge `(u, v)` and counts distinct roots.',
    realWorldAnalogy:
      'Counting isolated friend groups or separate island clusters on a map.',
    algorithm:
      '1. `vis[0..V-1] = false`, `count = 0`.\n2. For `i = 0 .. V - 1`:\n   - If `!vis[i]`: `count++`, run `dfs(i)` (or `bfs(i)`).\n3. Return `count`.',
    pseudocode: `count <- 0
for i from 0 to V - 1:
    if not vis[i]:
        count <- count + 1
        dfs(i)
return count`,
    dryRunExample:
      '`V = 5`, edges `(0,1), (1,2), (3,4)`: `dfs(0)` marks `{0,1,2}`, `dfs(3)` marks `{3,4}` -> `2` components.',
    timeComplexity: '`O(V + E)`',
    spaceComplexity: '`O(V)`',
    commonMistakes: [
      'Running traversal only from vertex `0` instead of looping `0 .. V - 1`.',
    ],
    interviewTips: [
      'If edges arrive dynamically online, DSU maintains connected component count in `O(alpha(V))` per edge!',
    ],
    implementations: {
      c: `int countComponents(int V, int adj[][100], int deg[]) {\n    int vis[100] = {0}, cnt = 0;\n    for (int i = 0; i < V; i++) if (!vis[i]) { cnt++; dfs(i, adj, deg, vis); }\n    return cnt;\n}`,
      cpp: `#include <vector>\nusing namespace std;\nvoid ccDfs(int u, const vector<vector<int>>& adj, vector<bool>& vis) {\n    vis[u] = true; for (int v : adj[u]) if (!vis[v]) ccDfs(v, adj, vis);\n}\nint countComponents(int V, const vector<vector<int>>& adj) {\n    vector<bool> vis(V, false); int cnt = 0;\n    for (int i = 0; i < V; ++i) if (!vis[i]) { ++cnt; ccDfs(i, adj, vis); }\n    return cnt;\n}`,
      java: `import java.util.*;\npublic class ConnectedComponents {\n    public static int count(int V, List<List<Integer>> adj) {\n        boolean[] vis = new boolean[V]; int cnt = 0;\n        for (int i = 0; i < V; i++) if (!vis[i]) { cnt++; dfs(i, adj, vis); }\n        return cnt;\n    }\n    private static void dfs(int u, List<List<Integer>> adj, boolean[] vis) {\n        vis[u] = true; for (int v : adj.get(u)) if (!vis[v]) dfs(v, adj, vis);\n    }\n}`,
      python: `def count_components(v_count: int, adj: list[list[int]]) -> int:\n    vis, cnt = [False] * v_count, 0\n    for i in range(v_count):\n        if not vis[i]:\n            cnt += 1\n            stack = [i]; vis[i] = True\n            while stack:\n                u = stack.pop()\n                for v in adj[u]:\n                    if not vis[v]: vis[v] = True; stack.append(v)\n    return cnt`,
    },
  },
  {
    topicSlug: 'flood-fill',
    title: 'Flood Fill Algorithm (Grid DFS/BFS)',
    definition:
      'Flood Fill replaces the connected 4-directional region of cells matching `startColor` starting at `(sr, sc)` with `newColor`.',
    explanation:
      'Always check `if (image[sr][sc] == newColor) return image;` **before** starting DFS/BFS! Otherwise, recoloring a cell to its own existing color causes infinite recursion unless you maintain a separate `visited` matrix.',
    realWorldAnalogy:
      'The Paint Bucket fill tool in MS Paint or Photoshop.',
    algorithm:
      '1. `orig = image[sr][sc]`.\n2. If `orig == newColor`, return `image`.\n3. DFS/BFS from `(sr, sc)`: if in bounds and `image[r][c] == orig`, set `image[r][c] = newColor` and visit 4 neighbors.',
    pseudocode: `orig <- image[sr][sc]
if orig == newColor: return image
dfs(r, c):
    if outOfBounds or image[r][c] != orig: return
    image[r][c] <- newColor
    dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1)`,
    dryRunExample:
      '`[[1,1,1],[1,1,0],[1,0,1]]`, `(1,1)`, `newColor=2` -> `[[2,2,2],[2,2,0],[2,0,1]]` (bottom-right `1` is diagonal, not 4-connected).',
    timeComplexity: '`O(R * C)`',
    spaceComplexity: '`O(R * C)` worst-case recursion/queue',
    commonMistakes: [
      'Infinite loop when `orig == newColor` without an early guard.',
    ],
    interviewTips: [
      'Grid DFS/BFS treats each cell `(r, c)` as an implicit graph vertex with up to 4 neighbors.',
    ],
    implementations: {
      c: `void ffDfs(int img[][50], int R, int C, int r, int c, int orig, int nc) {\n    if (r < 0 || c < 0 || r >= R || c >= C || img[r][c] != orig) return;\n    img[r][c] = nc;\n    ffDfs(img, R, C, r+1, c, orig, nc); ffDfs(img, R, C, r-1, c, orig, nc);\n    ffDfs(img, R, C, r, c+1, orig, nc); ffDfs(img, R, C, r, c-1, orig, nc);\n}`,
      cpp: `#include <vector>\nusing namespace std;\nvoid ffDfs(vector<vector<int>>& img, int r, int c, int orig, int nc) {\n    if (r < 0 || c < 0 || r >= static_cast<int>(img.size()) || c >= static_cast<int>(img[0].size()) || img[r][c] != orig) return;\n    img[r][c] = nc;\n    ffDfs(img, r+1, c, orig, nc); ffDfs(img, r-1, c, orig, nc);\n    ffDfs(img, r, c+1, orig, nc); ffDfs(img, r, c-1, orig, nc);\n}\nvector<vector<int>> floodFill(vector<vector<int>>& img, int sr, int sc, int nc) {\n    if (img[sr][sc] != nc) ffDfs(img, sr, sc, img[sr][sc], nc);\n    return img;\n}`,
      java: `public class FloodFill {\n    public static int[][] floodFill(int[][] img, int sr, int sc, int nc) {\n        if (img[sr][sc] != nc) dfs(img, sr, sc, img[sr][sc], nc);\n        return img;\n    }\n    private static void dfs(int[][] img, int r, int c, int orig, int nc) {\n        if (r < 0 || c < 0 || r >= img.length || c >= img[0].length || img[r][c] != orig) return;\n        img[r][c] = nc;\n        dfs(img, r+1, c, orig, nc); dfs(img, r-1, c, orig, nc);\n        dfs(img, r, c+1, orig, nc); dfs(img, r, c-1, orig, nc);\n    }\n}`,
      python: `def flood_fill(img: list[list[int]], sr: int, sc: int, new_color: int) -> list[list[int]]:\n    orig = img[sr][sc]\n    if orig == new_color: return img\n    R, C = len(img), len(img[0])\n    def dfs(r: int, c: int) -> None:\n        if 0 <= r < R and 0 <= c < C and img[r][c] == orig:\n            img[r][c] = new_color\n            dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)\n    dfs(sr, sc)\n    return img`,
    },
  },
  {
    topicSlug: 'number-of-islands',
    title: 'Number of Islands',
    definition:
      "Given an `R x C` grid of `'1'`s (land) and `'0'`s (water), count the number of islands (connected components of 4-directionally adjacent `'1'`s).",
    explanation:
      "Scan every cell `(r, c)`. Whenever `grid[r][c] == '1'`, increment `islands++` and run DFS or BFS to sink the entire connected island (mark visited cells `'0'`) so it is never counted again.",
    realWorldAnalogy:
      'Counting distinct islands on a satellite map by coloring each discovered island blue once mapped.',
    algorithm:
      "1. `islands = 0`.\n2. Loop `r` in `0..R-1`, `c` in `0..C-1`:\n   - If `grid[r][c] == '1'`: `islands++`, `sink(r, c)`.\n3. Return `islands`.",
    pseudocode: `islands <- 0
for r in 0..R-1, c in 0..C-1:
    if grid[r][c] == '1':
        islands <- islands + 1
        dfsSink(r, c)
return islands`,
    dryRunExample:
      'Grid `[["1","1","0"],["1","0","0"],["0","0","1"]]` -> `2` islands.',
    timeComplexity: '`O(R * C)`',
    spaceComplexity: '`O(R * C)` worst case',
    commonMistakes: [
      'Modifying input grid when caller expects it preserved (use a `vis` array if mutation is disallowed).',
    ],
    interviewTips: [
      'BFS avoids recursion depth limits on `300 x 300` grids.',
    ],
    implementations: {
      c: `static void sink(char** g, int R, int C, int r, int c) {\n    if (r < 0 || c < 0 || r >= R || c >= C || g[r][c] != '1') return;\n    g[r][c] = '0';\n    sink(g,R,C,r+1,c); sink(g,R,C,r-1,c); sink(g,R,C,r,c+1); sink(g,R,C,r,c-1);\n}\nint numIslands(char** g, int R, int C) {\n    int cnt = 0;\n    for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) if (g[r][c] == '1') { cnt++; sink(g, R, C, r, c); }\n    return cnt;\n}`,
      cpp: `#include <vector>\nusing namespace std;\nvoid sink(vector<vector<char>>& g, int r, int c) {\n    if (r < 0 || c < 0 || r >= static_cast<int>(g.size()) || c >= static_cast<int>(g[0].size()) || g[r][c] != '1') return;\n    g[r][c] = '0';\n    sink(g,r+1,c); sink(g,r-1,c); sink(g,r,c+1); sink(g,r,c-1);\n}\nint numIslands(vector<vector<char>>& g) {\n    int cnt = 0;\n    for (int r = 0; r < static_cast<int>(g.size()); ++r)\n        for (int c = 0; c < static_cast<int>(g[0].size()); ++c)\n            if (g[r][c] == '1') { ++cnt; sink(g, r, c); }\n    return cnt;\n}`,
      java: `public class NumberOfIslands {\n    public static int numIslands(char[][] g) {\n        int cnt = 0;\n        for (int r = 0; r < g.length; r++)\n            for (int c = 0; c < g[0].length; c++)\n                if (g[r][c] == '1') { cnt++; sink(g, r, c); }\n        return cnt;\n    }\n    private static void sink(char[][] g, int r, int c) {\n        if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != '1') return;\n        g[r][c] = '0'; sink(g,r+1,c); sink(g,r-1,c); sink(g,r,c+1); sink(g,r,c-1);\n    }\n}`,
      python: `def num_islands(grid: list[list[str]]) -> int:\n    R, C = len(grid), len(grid[0])\n    def sink(r: int, c: int) -> None:\n        if 0 <= r < R and 0 <= c < C and grid[r][c] == '1':\n            grid[r][c] = '0'\n            sink(r+1, c); sink(r-1, c); sink(r, c+1); sink(r, c-1)\n    cnt = 0\n    for r in range(R):\n        for c in range(C):\n            if grid[r][c] == '1': cnt += 1; sink(r, c)\n    return cnt`,
    },
  },
  {
    topicSlug: 'cycle-detection-undirected',
    title: 'Cycle Detection in Undirected Graphs',
    definition:
      'An undirected graph contains a cycle if during DFS/BFS from any unvisited vertex, we encounter an already-visited neighbor `v` that is **not** the immediate `parent` of `u`.',
    explanation:
      'Because undirected edges `(u, v)` appear in both `adj[u]` and `adj[v]`, stepping back to your immediate `parent` is normal, not a cycle. Any other visited neighbor `v != parent` proves there is a second distinct path to `v`—forming a cycle. (DSU also detects cycles in `O(E alpha(V))`: if `find(u) == find(v)` before unioning, edge `(u, v)` closes a cycle.)',
    realWorldAnalogy:
      'Walking through hallways: seeing a room you already marked—other than the room you just stepped out of—proves you walked in a loop.',
    algorithm:
      '1. Loop `i = 0 .. V - 1`: if `!vis[i]` and `hasCycle(i, -1)`, return `true`.\n2. In `hasCycle(u, parent)`: mark `vis[u] = true`; for `v` in `adj[u]`:\n   - If `!vis[v]`: if `hasCycle(v, u)`, return `true`.\n   - Else if `v != parent`: return `true`.\n3. Return `false`.',
    pseudocode: `hasCycle(u, parent):
    vis[u] <- true
    for v in adj[u]:
        if not vis[v]:
            if hasCycle(v, u): return true
        else if v != parent:
            return true
    return false`,
    dryRunExample:
      'Edges `(0,1), (1,2), (2,0)`: `dfs(0,-1) -> dfs(1,0) -> dfs(2,1)` sees `0` visited and `0 != 1` -> `true`!',
    timeComplexity: '`O(V + E)`',
    spaceComplexity: '`O(V)`',
    commonMistakes: [
      'Using this `v != parent` logic on a **directed** graph (fails on cross/forward edges in DAGs).',
    ],
    interviewTips: [
      'Mention both DFS (`parent` check) and DSU (`find(u) == find(v)`) approaches.',
    ],
    implementations: {
      c: `#include <stdbool.h>\nbool cycUndir(int u, int p, int adj[][100], int deg[], int vis[]) {\n    vis[u] = 1;\n    for (int i = 0; i < deg[u]; i++) {\n        int v = adj[u][i];\n        if (!vis[v]) { if (cycUndir(v, u, adj, deg, vis)) return true; }\n        else if (v != p) return true;\n    }\n    return false;\n}`,
      cpp: `#include <vector>\nusing namespace std;\nbool cycDfs(int u, int p, const vector<vector<int>>& adj, vector<bool>& vis) {\n    vis[u] = true;\n    for (int v : adj[u]) {\n        if (!vis[v]) { if (cycDfs(v, u, adj, vis)) return true; }\n        else if (v != p) return true;\n    }\n    return false;\n}`,
      java: `import java.util.*;\npublic class CycleUndirected {\n    public static boolean hasCycle(int V, List<List<Integer>> adj) {\n        boolean[] vis = new boolean[V];\n        for (int i = 0; i < V; i++) if (!vis[i] && dfs(i, -1, adj, vis)) return true;\n        return false;\n    }\n    private static boolean dfs(int u, int p, List<List<Integer>> adj, boolean[] vis) {\n        vis[u] = true;\n        for (int v : adj.get(u)) {\n            if (!vis[v]) { if (dfs(v, u, adj, vis)) return true; }\n            else if (v != p) return true;\n        }\n        return false;\n    }\n}`,
      python: `def has_cycle_undirected(v_count: int, adj: list[list[int]]) -> bool:\n    vis = [False] * v_count\n    def dfs(u: int, p: int) -> bool:\n        vis[u] = True\n        for v in adj[u]:\n            if not vis[v]:\n                if dfs(v, u): return True\n            elif v != p:\n                return True\n        return False\n    return any(dfs(i, -1) for i in range(v_count) if not vis[i])`,
    },
  },
  {
    topicSlug: 'cycle-detection-directed',
    title: 'Cycle Detection in Directed Graphs (3-State DFS)',
    definition:
      'A directed graph has a cycle iff DFS encounters a **back edge** pointing to a vertex currently on the active recursion stack (`state == 1` / `inStack == true`).',
    explanation:
      'Using a single `visited` boolean is wrong for directed graphs because two paths can merge at a previously finished node (`0 -> 1 -> 3` and `0 -> 2 -> 3`) without forming a cycle. Tracking 3 states (`0 = unvisited`, `1 = visiting / on current recursion stack`, `2 = completely finished`) guarantees a cycle iff we hit a `state == 1` node. (Alternatively, Kahn’s BFS topo-sort detects a cycle if fewer than `V` nodes are processed.)',
    realWorldAnalogy:
      'Detecting circular package dependencies: if package A is currently installing B which tries to install A (still in progress), you have a cycle.',
    algorithm:
      '1. Initialize `state[0..V-1] = 0`.\n2. `dfs(u)`: set `state[u] = 1`.\n3. For `v` in `adj[u]`:\n   - If `state[v] == 1`, return `true` (cycle!).\n   - If `state[v] == 0 && dfs(v)`, return `true`.\n4. Set `state[u] = 2`, return `false`.',
    pseudocode: `dfs(u):
    state[u] <- 1  // visiting
    for v in adj[u]:
        if state[v] == 1: return true
        if state[v] == 0 and dfs(v): return true
    state[u] <- 2  // done
    return false`,
    dryRunExample:
      '`0 -> 1 -> 2 -> 0`: `state[0]=1 -> state[1]=1 -> state[2]=1`, sees `0` with `state[0]==1` -> `true`.',
    timeComplexity: '`O(V + E)`',
    spaceComplexity: '`O(V)`',
    commonMistakes: [
      'Forgetting to reset `state[u] = 2` (or `inStack[u] = false`) after exploring all neighbors of `u`.',
    ],
    interviewTips: [
      'Using a single `state[V]` array with `0/1/2` is cleaner than two separate `vis[]` and `pathVis[]` arrays.',
    ],
    implementations: {
      c: `#include <stdbool.h>\nbool cycDir(int u, int adj[][100], int deg[], int state[]) {\n    state[u] = 1;\n    for (int i = 0; i < deg[u]; i++) {\n        int v = adj[u][i];\n        if (state[v] == 1) return true;\n        if (state[v] == 0 && cycDir(v, adj, deg, state)) return true;\n    }\n    state[u] = 2; return false;\n}`,
      cpp: `#include <vector>\nusing namespace std;\nbool cycDirDfs(int u, const vector<vector<int>>& adj, vector<int>& state) {\n    state[u] = 1;\n    for (int v : adj[u]) {\n        if (state[v] == 1) return true;\n        if (state[v] == 0 && cycDirDfs(v, adj, state)) return true;\n    }\n    state[u] = 2; return false;\n}`,
      java: `import java.util.*;\npublic class CycleDirected {\n    public static boolean hasCycle(int V, List<List<Integer>> adj) {\n        int[] state = new int[V];\n        for (int i = 0; i < V; i++) if (state[i] == 0 && dfs(i, adj, state)) return true;\n        return false;\n    }\n    private static boolean dfs(int u, List<List<Integer>> adj, int[] state) {\n        state[u] = 1;\n        for (int v : adj.get(u)) {\n            if (state[v] == 1) return true;\n            if (state[v] == 0 && dfs(v, adj, state)) return true;\n        }\n        state[u] = 2; return false;\n    }\n}`,
      python: `def has_cycle_directed(v_count: int, adj: list[list[int]]) -> bool:\n    state = [0] * v_count\n    def dfs(u: int) -> bool:\n        state[u] = 1\n        for v in adj[u]:\n            if state[v] == 1: return True\n            if state[v] == 0 and dfs(v): return True\n        state[u] = 2; return False\n    return any(dfs(i) for i in range(v_count) if state[i] == 0)`,
    },
  },
  {
    topicSlug: 'bipartite-graph',
    title: 'Bipartite Graph Check (2-Coloring)',
    definition:
      'A graph is **bipartite** if its vertices can be partitioned into two disjoint sets `U` and `V` (2-colored with `{0, 1}`) such that every edge connects a vertex in `U` to one in `V`.',
    explanation:
      'A graph is bipartite **if and only if it contains no odd-length cycle**. Run BFS or DFS over every uncolored component: assign `color[start] = 0`, and for every neighbor `v` of `u`, if uncolored assign `1 - color[u]`, else if `color[v] == color[u]`, return `false`.',
    realWorldAnalogy:
      'Splitting guests into two tables so no two rivals sit at the same table.',
    algorithm:
      '1. `color[0..V-1] = -1`.\n2. For `i = 0 .. V - 1`: if `color[i] == -1`, BFS from `i` with `color[i] = 0`.\n3. For each neighbor `v` of `u`: if `color[v] == -1`, set `color[v] = 1 - color[u]` and push; else if `color[v] == color[u]`, return `false`.',
    pseudocode: `color[0..V-1] <- -1
for i from 0 to V - 1:
    if color[i] == -1:
        color[i] <- 0; q.push(i)
        while q not empty:
            u <- q.pop()
            for v in adj[u]:
                if color[v] == -1: color[v] <- 1 - color[u]; q.push(v)
                else if color[v] == color[u]: return false
return true`,
    dryRunExample:
      '4-cycle `0-1-2-3-0`: colors `0->0, 1->1, 2->0, 3->1` -> valid (`true`). 3-cycle `0-1-2-0`: `2` conflicts with `0` -> `false`.',
    timeComplexity: '`O(V + E)`',
    spaceComplexity: '`O(V)`',
    commonMistakes: [
      'Checking only component `0` and forgetting disconnected components.',
    ],
    interviewTips: [
      'Remember the theorem: **Bipartite `<=>` No odd cycles**.',
    ],
    implementations: {
      c: `#include <stdbool.h>\nbool isBipartite(int V, int adj[][100], int deg[]) {\n    int col[100]; for (int i = 0; i < V; i++) col[i] = -1;\n    int q[100];\n    for (int i = 0; i < V; i++) if (col[i] == -1) {\n        int h = 0, t = 0; col[i] = 0; q[t++] = i;\n        while (h < t) {\n            int u = q[h++];\n            for (int k = 0; k < deg[u]; k++) {\n                int v = adj[u][k];\n                if (col[v] == -1) { col[v] = 1 - col[u]; q[t++] = v; }\n                else if (col[v] == col[u]) return false;\n            }\n        }\n    }\n    return true;\n}`,
      cpp: `#include <queue>\n#include <vector>\nusing namespace std;\nbool isBipartite(const vector<vector<int>>& adj) {\n    int V = static_cast<int>(adj.size()); vector<int> col(V, -1);\n    for (int i = 0; i < V; ++i) if (col[i] == -1) {\n        queue<int> q; q.push(i); col[i] = 0;\n        while (!q.empty()) {\n            int u = q.front(); q.pop();\n            for (int v : adj[u]) {\n                if (col[v] == -1) { col[v] = 1 - col[u]; q.push(v); }\n                else if (col[v] == col[u]) return false;\n            }\n        }\n    }\n    return true;\n}`,
      java: `import java.util.*;\npublic class Bipartite {\n    public static boolean isBipartite(int[][] graph) {\n        int V = graph.length; int[] col = new int[V]; Arrays.fill(col, -1);\n        for (int i = 0; i < V; i++) if (col[i] == -1) {\n            Queue<Integer> q = new ArrayDeque<>(); q.offer(i); col[i] = 0;\n            while (!q.isEmpty()) {\n                int u = q.poll();\n                for (int v : graph[u]) {\n                    if (col[v] == -1) { col[v] = 1 - col[u]; q.offer(v); }\n                    else if (col[v] == col[u]) return false;\n                }\n            }\n        }\n        return true;\n    }\n}`,
      python: `from collections import deque\ndef is_bipartite(graph: list[list[int]]) -> bool:\n    col = [-1] * len(graph)\n    for i in range(len(graph)):\n        if col[i] == -1:\n            col[i] = 0; q = deque([i])\n            while q:\n                u = q.popleft()\n                for v in graph[u]:\n                    if col[v] == -1: col[v] = 1 - col[u]; q.append(v)\n                    elif col[v] == col[u]: return False\n    return True`,
    },
  },
  {
    topicSlug: 'topological-sort-dfs',
    title: 'Topological Sort (DFS Postorder)',
    definition:
      'A **topological ordering** of a Directed Acyclic Graph (DAG) is a linear ordering of vertices such that for every directed edge `u -> v`, `u` appears before `v`.',
    explanation:
      'In DFS postorder, a vertex `u` finishes only after **all** vertices `v` reachable from `u` have finished. Pushing `u` onto a stack upon finishing and reversing the stack guarantees every dependency `u -> v` has `u` before `v`.',
    realWorldAnalogy:
      'Ordering college courses so every prerequisite appears before the courses that require it.',
    algorithm:
      '1. Loop `i = 0 .. V - 1`: if `!vis[i]`, `dfs(i)`.\n2. Inside `dfs(u)`: mark `vis[u] = true`; for `v` in `adj[u]`, if `!vis[v]` `dfs(v)`; push `u` to `stack`.\n3. Pop `stack` (or reverse `order`) to obtain the topological sort.',
    pseudocode: `dfs(u):
    vis[u] <- true
    for v in adj[u]:
        if not vis[v]: dfs(v)
    order.append(u)
// Reverse order after visiting all vertices`,
    dryRunExample:
      'Edges `5->2, 5->0, 4->0, 4->1, 2->3, 3->1`: finishing order `[1, 3, 2, 0, 5, 4]` -> reversed `[4, 5, 0, 2, 3, 1]`.',
    timeComplexity: '`O(V + E)`',
    spaceComplexity: '`O(V)`',
    commonMistakes: [
      'Applying topological sort to a graph with cycles without checking for cycles first.',
    ],
    interviewTips: [
      'Topological order is **not unique** (any valid DAG ordering is accepted unless lexicographically smallest is requested, which uses a Min-Heap with Kahn’s algorithm).',
    ],
    implementations: {
      c: `void topoDfs(int u, int adj[][100], int deg[], int vis[], int st[], int* top) {\n    vis[u] = 1;\n    for (int i = 0; i < deg[u]; i++) if (!vis[adj[u][i]]) topoDfs(adj[u][i], adj, deg, vis, st, top);\n    st[(*top)++] = u;\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\nvoid tDfs(int u, const vector<vector<int>>& adj, vector<bool>& vis, vector<int>& res) {\n    vis[u] = true;\n    for (int v : adj[u]) if (!vis[v]) tDfs(v, adj, vis, res);\n    res.push_back(u);\n}\nvector<int> topoSortDFS(int V, const vector<vector<int>>& adj) {\n    vector<bool> vis(V, false); vector<int> res;\n    for (int i = 0; i < V; ++i) if (!vis[i]) tDfs(i, adj, vis, res);\n    reverse(res.begin(), res.end());\n    return res;\n}`,
      java: `import java.util.*;\npublic class TopoSortDFS {\n    public static List<Integer> topoSort(int V, List<List<Integer>> adj) {\n        boolean[] vis = new boolean[V]; List<Integer> res = new ArrayList<>();\n        for (int i = 0; i < V; i++) if (!vis[i]) dfs(i, adj, vis, res);\n        Collections.reverse(res); return res;\n    }\n    private static void dfs(int u, List<List<Integer>> adj, boolean[] vis, List<Integer> res) {\n        vis[u] = true; for (int v : adj.get(u)) if (!vis[v]) dfs(v, adj, vis, res);\n        res.add(u);\n    }\n}`,
      python: `def topo_sort_dfs(v_count: int, adj: list[list[int]]) -> list[int]:\n    vis, res = [False] * v_count, []\n    def dfs(u: int) -> None:\n        vis[u] = True\n        for v in adj[u]:\n            if not vis[v]: dfs(v)\n        res.append(u)\n    for i in range(v_count):\n        if not vis[i]: dfs(i)\n    return res[::-1]`,
    },
  },
  {
    topicSlug: 'kahns-algorithm',
    title: 'Kahn’s Algorithm (BFS Topological Sort)',
    definition:
      '**Kahn’s Algorithm** computes a topological ordering of a DAG using BFS by repeatedly removing vertices with `inDegree == 0` and decrementing their neighbors’ in-degrees.',
    explanation:
      'Every vertex with `inDegree == 0` has zero unmet prerequisites and can be scheduled immediately. Removing it lowers each neighbor’s `inDegree` by `1`; whenever a neighbor hits `0`, push it to the queue. Bonus: if `order.size() < V`, the graph **contains a directed cycle**!',
    realWorldAnalogy:
      'Completing tasks on a checklist as soon as all their blocking prerequisites are checked off.',
    algorithm:
      '1. Compute `inDeg[v]` for all edges `u -> v`.\n2. Push all `v` with `inDeg[v] == 0` into `queue`.\n3. While `queue` non-empty: pop `u`, append to `order`, for `v` in `adj[u]` do `if (--inDeg[v] == 0) q.push(v)`.\n4. If `order.size() != V`, a cycle exists.',
    pseudocode: `compute inDeg[0..V-1]
q <- all v with inDeg[v] == 0
while q not empty:
    u <- q.pop(); order.append(u)
    for v in adj[u]:
        inDeg[v] <- inDeg[v] - 1
        if inDeg[v] == 0: q.push(v)
return order if len(order) == V else []`,
    dryRunExample:
      'Course Schedule (`1->0`, `2->0`, `3->1`, `3->2`): `inDeg = [2, 1, 1, 0]` -> `q=[3]` -> pops `3`, pushes `1, 2` -> pops `1, 2`, pushes `0` -> `[3, 1, 2, 0]`.',
    timeComplexity: '`O(V + E)`',
    spaceComplexity: '`O(V)`',
    commonMistakes: [
      'Forgetting to check `order.size() == V` when cycle detection is required (e.g. Course Schedule).',
    ],
    interviewTips: [
      'Replacing the FIFO queue with a **Min-Heap** in Kahn’s algorithm gives the **lexicographically smallest** topological order in `O((V + E) log V)`.',
    ],
    implementations: {
      c: `int kahn(int V, int adj[][100], int deg[], int inDeg[], int out[]) {\n    int q[100], h = 0, t = 0, cnt = 0;\n    for (int i = 0; i < V; i++) if (inDeg[i] == 0) q[t++] = i;\n    while (h < t) {\n        int u = q[h++]; out[cnt++] = u;\n        for (int i = 0; i < deg[u]; i++) if (--inDeg[adj[u][i]] == 0) q[t++] = adj[u][i];\n    }\n    return cnt;\n}`,
      cpp: `#include <queue>\n#include <vector>\nusing namespace std;\nvector<int> kahnTopo(int V, const vector<vector<int>>& adj) {\n    vector<int> inDeg(V, 0), order;\n    for (int u = 0; u < V; ++u) for (int v : adj[u]) ++inDeg[v];\n    queue<int> q;\n    for (int i = 0; i < V; ++i) if (inDeg[i] == 0) q.push(i);\n    while (!q.empty()) {\n        int u = q.front(); q.pop(); order.push_back(u);\n        for (int v : adj[u]) if (--inDeg[v] == 0) q.push(v);\n    }\n    return static_cast<int>(order.size()) == V ? order : vector<int>{};\n}`,
      java: `import java.util.*;\npublic class KahnsTopo {\n    public static int[] topoSort(int V, List<List<Integer>> adj) {\n        int[] inDeg = new int[V];\n        for (int u = 0; u < V; u++) for (int v : adj.get(u)) inDeg[v]++;\n        Queue<Integer> q = new ArrayDeque<>();\n        for (int i = 0; i < V; i++) if (inDeg[i] == 0) q.offer(i);\n        int[] order = new int[V]; int idx = 0;\n        while (!q.isEmpty()) {\n            int u = q.poll(); order[idx++] = u;\n            for (int v : adj.get(u)) if (--inDeg[v] == 0) q.offer(v);\n        }\n        return idx == V ? order : new int[0];\n    }\n}`,
      python: `from collections import deque\ndef kahn_topo(v_count: int, adj: list[list[int]]) -> list[int]:\n    in_deg = [0] * v_count\n    for u in range(v_count):\n        for v in adj[u]: in_deg[v] += 1\n    q = deque([i for i in range(v_count) if in_deg[i] == 0])\n    order = []\n    while q:\n        u = q.popleft(); order.append(u)\n        for v in adj[u]:\n            in_deg[v] -= 1\n            if in_deg[v] == 0: q.append(v)\n    return order if len(order) == v_count else []`,
    },
  },
  {
    topicSlug: 'shortest-path-intro',
    title: 'Shortest Path Algorithms Overview',
    definition:
      'The **shortest path problem** finds a path between vertices minimizing the sum of edge weights (or number of edges in unweighted graphs).',
    explanation:
      'Choosing the optimal algorithm depends on graph constraints:\n\n| Graph Type | Best Algorithm | Time Complexity |\n|---|---|---|\n| Unweighted | BFS | `O(V + E)` |\n| 0/1 Weights | 0-1 BFS (Deque) | `O(V + E)` |\n| DAG (any weights) | Topo Sort + Relaxation | `O(V + E)` |\n| Non-negative weights | Dijkstra (Min-Heap) | `O((V + E) log V)` |\n| Negative weights | Bellman-Ford | `O(V * E)` |\n| All-pairs (`V <= 500`) | Floyd-Warshall | `O(V^3)` |',
    realWorldAnalogy:
      'Picking the right navigation tool: subway map (BFS), highway toll/time GPS (Dijkstra), or arbitrage currency detector (Bellman-Ford).',
    algorithm:
      'Core operation across all shortest-path algorithms is **Edge Relaxation**:\n`if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;`',
    pseudocode: `relax(u, v, w):
    if dist[u] != INF and dist[u] + w < dist[v]:
        dist[v] <- dist[u] + w`,
    dryRunExample:
      'If `dist[u] = 4`, edge `(u, v)` has weight `3`, and `dist[v] = 10`, relaxation updates `dist[v] = 7`.',
    timeComplexity: '`O(V + E)` to `O(V^3)` depending on algorithm',
    spaceComplexity: '`O(V)` to `O(V^2)`',
    commonMistakes: [
      'Running Dijkstra when negative edges exist (can produce wrong distances without looping forever).',
    ],
    interviewTips: [
      'Always state the relaxation invariant and justify why Dijkstra requires non-negative weights.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'dijkstras-algorithm',
    title: 'Dijkstra’s Shortest Path Algorithm',
    definition:
      '**Dijkstra’s Algorithm** finds the shortest paths from a single source `src` to all other vertices in a graph with **non-negative** edge weights using a Min-Heap.',
    explanation:
      'Maintain `dist[src] = 0` and `dist[v] = INF` elsewhere. Pop the unfinalized vertex `u` with minimum `dist[u]` from the Min-Heap. Skip stale heap entries (`if (d > dist[u]) continue;`). Relax every outgoing edge `(u, v, w)` and push `(dist[v], v)` whenever `dist[v]` improves.',
    realWorldAnalogy:
      'GPS navigation expanding outward from your location by always locking in the closest unvisited intersection next.',
    algorithm:
      '1. `dist[0..V-1] = INF`, `dist[src] = 0`, push `(0, src)` to Min-Heap.\n2. While heap non-empty:\n   - Pop `(d, u)`; if `d > dist[u]`, `continue`.\n   - For `(v, w)` in `adj[u]`: if `d + w < dist[v]`, set `dist[v] = d + w` and push `(dist[v], v)`.',
    pseudocode: `dist[0..V-1] <- INF; dist[src] <- 0
pq.push((0, src))
while pq not empty:
    (d, u) <- pq.pop()
    if d > dist[u]: continue
    for (v, w) in adj[u]:
        if d + w < dist[v]:
            dist[v] <- d + w
            pq.push((dist[v], v))`,
    dryRunExample:
      '`0 -(4)-> 1, 0 -(1)-> 2, 2 -(2)-> 1`: pops `(0,0)` -> `dist[1]=4, dist[2]=1`; pops `(1,2)` -> relaxes `1` to `3`; pops `(3,1)`; stale `(4,1)` skipped.',
    timeComplexity: '`O((V + E) log V)` with binary Min-Heap',
    spaceComplexity: '`O(V + E)`',
    commonMistakes: [
      'Forgetting `if (d > dist[u]) continue;` (re-expands stale entries).',
      'Using Dijkstra on graphs with negative edge weights.',
    ],
    interviewTips: [
      'Remember `long long` / `long` for `dist[]` when weights can sum past `2 * 10^9`.',
    ],
    implementations: {
      c: `// Min-Heap of (dist, node) pairs; skip stale d > dist[u] and relax neighbors`,
      cpp: `#include <climits>\n#include <queue>\n#include <vector>\nusing namespace std;\nvector<long long> dijkstra(int V, const vector<vector<pair<int,int>>>& adj, int src) {\n    vector<long long> dist(V, LLONG_MAX);\n    using P = pair<long long, int>;\n    priority_queue<P, vector<P>, greater<P>> pq;\n    dist[src] = 0; pq.push({0, src});\n    while (!pq.empty()) {\n        auto [d, u] = pq.top(); pq.pop();\n        if (d > dist[u]) continue;\n        for (auto [v, w] : adj[u]) {\n            if (d + w < dist[v]) { dist[v] = d + w; pq.push({dist[v], v}); }\n        }\n    }\n    return dist;\n}`,
      java: `import java.util.*;\npublic class Dijkstra {\n    public static long[] shortestPath(int V, List<List<int[]>> adj, int src) {\n        long[] dist = new long[V]; Arrays.fill(dist, Long.MAX_VALUE);\n        PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(a -> a[0]));\n        dist[src] = 0; pq.offer(new long[]{0, src});\n        while (!pq.isEmpty()) {\n            long[] cur = pq.poll(); long d = cur[0]; int u = (int) cur[1];\n            if (d > dist[u]) continue;\n            for (int[] e : adj.get(u)) {\n                if (d + e[1] < dist[e[0]]) { dist[e[0]] = d + e[1]; pq.offer(new long[]{dist[e[0]], e[0]}); }\n            }\n        }\n        return dist;\n    }\n}`,
      python: `import heapq\ndef dijkstra(v_count: int, adj: list[list[tuple[int, int]]], src: int) -> list[float]:\n    dist = [float('inf')] * v_count; dist[src] = 0\n    pq = [(0, src)]\n    while pq:\n        d, u = heapq.heappop(pq)\n        if d > dist[u]: continue\n        for v, w in adj[u]:\n            if d + w < dist[v]: dist[v] = d + w; heapq.heappush(pq, (dist[v], v))\n    return dist`,
    },
  },
  {
    topicSlug: 'bellman-ford',
    title: 'Bellman-Ford Algorithm (Negative Weights & Negative Cycles)',
    definition:
      '**Bellman-Ford** computes single-source shortest paths in graphs that may contain **negative edge weights** by relaxing all `E` edges `V - 1` times, and detects negative-weight cycles on a `V`-th pass.',
    explanation:
      'Any simple shortest path has at most `V - 1` edges. After `k` full relaxation passes over all edges, every shortest path using at most `k` edges is finalized. If any edge can still be relaxed on pass `V`, a **negative-weight cycle** reachable from `src` exists.',
    realWorldAnalogy:
      'Detecting currency exchange arbitrage loops where trading A -> B -> C -> A leaves you with more money than you started with.',
    algorithm:
      '1. `dist[0..V-1] = INF`, `dist[src] = 0`.\n2. Repeat `V - 1` times: for every edge `(u, v, w)`, if `dist[u] != INF && dist[u] + w < dist[v]`, `dist[v] = dist[u] + w`.\n3. Run one more pass: if any edge relaxes, report a negative cycle.',
    pseudocode: `dist[src] <- 0
repeat V - 1 times:
    for (u, v, w) in edges:
        if dist[u] != INF and dist[u] + w < dist[v]:
            dist[v] <- dist[u] + w
for (u, v, w) in edges:
    if dist[u] != INF and dist[u] + w < dist[v]:
        return NEGATIVE_CYCLE`,
    dryRunExample:
      '`V = 3`, edges `(0,1,4), (0,2,5), (2,1,-3)`: pass 1 gives `dist=[0, 4, 5]` then relaxes `(2,1,-3)` -> `dist[1] = 2`.',
    timeComplexity: '`O(V * E)`',
    spaceComplexity: '`O(V)`',
    commonMistakes: [
      'Relaxing when `dist[u] == INF` (`INF + negative_w < INF` causes overflow or false updates!).',
    ],
    interviewTips: [
      'In **Cheapest Flights Within K Stops** (LeetCode 787), run `K + 1` Bellman-Ford passes using a `prevDist` copy each round so edges don’t cascade within a single stop!',
    ],
    implementations: {
      c: `#include <limits.h>\ntypedef struct { int u, v, w; } Edge;\nint bellmanFord(int V, int E, Edge edges[], int src, long long dist[]) {\n    for (int i = 0; i < V; i++) dist[i] = LLONG_MAX;\n    dist[src] = 0;\n    for (int it = 0; it < V - 1; it++)\n        for (int i = 0; i < E; i++)\n            if (dist[edges[i].u] != LLONG_MAX && dist[edges[i].u] + edges[i].w < dist[edges[i].v])\n                dist[edges[i].v] = dist[edges[i].u] + edges[i].w;\n    for (int i = 0; i < E; i++)\n        if (dist[edges[i].u] != LLONG_MAX && dist[edges[i].u] + edges[i].w < dist[edges[i].v]) return 0;\n    return 1;\n}`,
      cpp: `#include <climits>\n#include <vector>\nusing namespace std;\nbool bellmanFord(int V, const vector<tuple<int,int,int>>& edges, int src, vector<long long>& dist) {\n    dist.assign(V, LLONG_MAX); dist[src] = 0;\n    for (int it = 0; it < V - 1; ++it)\n        for (auto [u, v, w] : edges)\n            if (dist[u] != LLONG_MAX && dist[u] + w < dist[v]) dist[v] = dist[u] + w;\n    for (auto [u, v, w] : edges)\n        if (dist[u] != LLONG_MAX && dist[u] + w < dist[v]) return false;\n    return true;\n}`,
      java: `import java.util.Arrays;\npublic class BellmanFord {\n    public static boolean solve(int V, int[][] edges, int src, long[] dist) {\n        Arrays.fill(dist, Long.MAX_VALUE); dist[src] = 0;\n        for (int it = 0; it < V - 1; it++)\n            for (int[] e : edges)\n                if (dist[e[0]] != Long.MAX_VALUE && dist[e[0]] + e[2] < dist[e[1]]) dist[e[1]] = dist[e[0]] + e[2];\n        for (int[] e : edges)\n            if (dist[e[0]] != Long.MAX_VALUE && dist[e[0]] + e[2] < dist[e[1]]) return false;\n        return true;\n    }\n}`,
      python: `def bellman_ford(v_count: int, edges: list[tuple[int, int, int]], src: int) -> list[float] | None:\n    dist = [float('inf')] * v_count; dist[src] = 0\n    for _ in range(v_count - 1):\n        for u, v, w in edges:\n            if dist[u] + w < dist[v]: dist[v] = dist[u] + w\n    for u, v, w in edges:\n        if dist[u] + w < dist[v]: return None\n    return dist`,
    },
  },
  {
    topicSlug: 'floyd-warshall',
    title: 'Floyd-Warshall (All-Pairs Shortest Paths)',
    definition:
      '**Floyd-Warshall** computes shortest paths between **every pair** `(i, j)` of vertices in `O(V^3)` time using dynamic programming over intermediate vertices `k = 0 .. V - 1`.',
    explanation:
      'At phase `k`, `dist[i][j]` holds the shortest path from `i` to `j` using only intermediate vertices from `{0..k}`. Transition: `dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])`. If `dist[i][i] < 0` after completion, a negative cycle exists.',
    realWorldAnalogy:
      'Updating an all-cities flight distance table by testing whether routing through hub city `k` makes any `(i, j)` trip shorter.',
    algorithm:
      '1. Initialize `dist[i][j]` (`0` on diagonal, `w` for edges, `INF` otherwise).\n2. **Important:** `k` MUST be the outermost loop!\n   - `for k in 0..V-1`: `for i in 0..V-1`: `for j in 0..V-1`: relax `dist[i][j]` via `k`.',
    pseudocode: `for k from 0 to V - 1:
    for i from 0 to V - 1:
        for j from 0 to V - 1:
            if dist[i][k] < INF and dist[k][j] < INF:
                dist[i][j] <- min(dist[i][j], dist[i][k] + dist[k][j])`,
    dryRunExample:
      'If `0->1 (5)`, `1->2 (3)`, `0->2 (10)`, at `k = 1`, `dist[0][2]` updates from `10` to `5 + 3 = 8`.',
    timeComplexity: '`O(V^3)`',
    spaceComplexity: '`O(V^2)`',
    commonMistakes: [
      'Putting `k` as the innermost loop instead of the outermost loop (breaks the DP invariant!).',
    ],
    interviewTips: [
      'Ideal when `V <= 400` and all-pairs distances are needed (e.g. LeetCode 1334 City With Smallest Number of Neighbors).',
    ],
    implementations: {
      c: `void floydWarshall(int V, long long d[][100]) {\n    for (int k = 0; k < V; k++)\n        for (int i = 0; i < V; i++)\n            for (int j = 0; j < V; j++)\n                if (d[i][k] < 1e15 && d[k][j] < 1e15 && d[i][k] + d[k][j] < d[i][j])\n                    d[i][j] = d[i][k] + d[k][j];\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\nvoid floydWarshall(int V, vector<vector<long long>>& d) {\n    const long long INF = 1e15;\n    for (int k = 0; k < V; ++k)\n        for (int i = 0; i < V; ++i)\n            for (int j = 0; j < V; ++j)\n                if (d[i][k] < INF && d[k][j] < INF) d[i][j] = min(d[i][j], d[i][k] + d[k][j]);\n}`,
      java: `public class FloydWarshall {\n    public static void solve(int V, long[][] d) {\n        long INF = (long) 1e15;\n        for (int k = 0; k < V; k++)\n            for (int i = 0; i < V; i++)\n                for (int j = 0; j < V; j++)\n                    if (d[i][k] < INF && d[k][j] < INF) d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j]);\n    }\n}`,
      python: `def floyd_warshall(v_count: int, d: list[list[float]]) -> None:\n    for k in range(v_count):\n        for i in range(v_count):\n            for j in range(v_count):\n                if d[i][k] + d[k][j] < d[i][j]:\n                    d[i][j] = d[i][k] + d[k][j]`,
    },
  },
  {
    topicSlug: 'mst-intro',
    title: 'Minimum Spanning Tree (MST) Introduction',
    definition:
      'A **Minimum Spanning Tree (MST)** of a connected, undirected, weighted graph `G = (V, E)` is a subset of `V - 1` edges that connects all `V` vertices with **no cycles** and the **minimum possible total edge weight**.',
    explanation:
      'Two greedy algorithms build an MST using the **Cut Property** (the lightest edge crossing any cut of `V` is safe to include):\n- **Prim’s Algorithm:** Grows one connected tree from a start vertex using a Min-Heap (`O((V + E) log V)`).\n- **Kruskal’s Algorithm:** Sorts all edges by weight and adds non-cycling edges using DSU (`O(E log E)`).',
    realWorldAnalogy:
      'Laying fiber-optic cable to connect `N` neighborhoods using the least total length of cable.',
    algorithm:
      'MST invariants:\n1. Exactly `V - 1` edges.\n2. Connected and acyclic.\n3. Minimum total weight (unique if all edge weights are distinct).',
    pseudocode: `// Cut Property: For any partition (S, V \\ S),
// the minimum-weight edge crossing between S and V \\ S belongs to an MST.`,
    dryRunExample:
      '3-node triangle with weights `1, 2, 10`: MST picks edges `1` and `2` (total weight `3`, `2` edges).',
    timeComplexity: '`O(E log V)` / `O(E log E)`',
    spaceComplexity: '`O(V + E)`',
    commonMistakes: [
      'Confusing Shortest Path Tree (Dijkstra: minimizes distance from `src`) with MST (Prim/Kruskal: minimizes total edge sum).',
    ],
    interviewTips: [
      'Use Kruskal’s for sparse graphs / edge lists; use Prim’s for dense graphs (`O(V^2)` without heap).',
    ],
    implementations: {},
  },
  {
    topicSlug: 'prims-algorithm',
    title: 'Prim’s Algorithm (MST)',
    definition:
      '**Prim’s Algorithm** grows a Minimum Spanning Tree starting from vertex `0` by repeatedly using a Min-Heap to pick the lightest edge connecting a visited vertex to an unvisited vertex.',
    explanation:
      'Push `(0, 0)` into a Min-Heap. When popping `(w, u)`, if `inMST[u]` is already true, skip it; otherwise mark `inMST[u] = true`, add `w` to `mstCost`, and push `(edgeW, v)` for all unvisited neighbors `v` of `u`.',
    realWorldAnalogy:
      'Growing a power grid outward from one power plant by always connecting the closest unpowered town next.',
    algorithm:
      '1. `inMST[0..V-1] = false`, `mstCost = 0`, push `(0, 0)` to `minHeap`.\n2. While `minHeap` non-empty:\n   - Pop `(w, u)`; if `inMST[u]`, `continue`.\n   - `inMST[u] = true`, `mstCost += w`.\n   - For `(v, ew)` in `adj[u]`: if `!inMST[v]`, push `(ew, v)`.',
    pseudocode: `pq.push((0, 0)); mstCost <- 0
while pq not empty:
    (w, u) <- pq.pop()
    if inMST[u]: continue
    inMST[u] <- true; mstCost <- mstCost + w
    for (v, ew) in adj[u]:
        if not inMST[v]: pq.push((ew, v))
return mstCost`,
    dryRunExample:
      'Triangle `0-1 (1), 1-2 (2), 0-2 (5)`: pops `(0,0)`, pushes `(1,1),(5,2)`, pops `(1,1)`, pushes `(2,2)`, pops `(2,2)` -> `mstCost = 3`.',
    timeComplexity: '`O((V + E) log V)`',
    spaceComplexity: '`O(V + E)`',
    commonMistakes: [
      'Marking `inMST[v] = true` on push instead of on pop (prevents finding a cheaper edge to `v` later!).',
    ],
    interviewTips: [
      'Notice the contrast with BFS: BFS marks `visited` on push; Prim’s and Dijkstra mark/finalize on pop!',
    ],
    implementations: {
      c: `// Min-Heap of (weight, vertex); mark inMST[u] on pop`,
      cpp: `#include <queue>\n#include <vector>\nusing namespace std;\nlong long primMST(int V, const vector<vector<pair<int,int>>>& adj) {\n    vector<bool> inMST(V, false);\n    using P = pair<int, int>;\n    priority_queue<P, vector<P>, greater<P>> pq;\n    pq.push({0, 0}); long long cost = 0;\n    while (!pq.empty()) {\n        auto [w, u] = pq.top(); pq.pop();\n        if (inMST[u]) continue;\n        inMST[u] = true; cost += w;\n        for (auto [v, ew] : adj[u]) if (!inMST[v]) pq.push({ew, v});\n    }\n    return cost;\n}`,
      java: `import java.util.*;\npublic class PrimsMST {\n    public static long prim(int V, List<List<int[]>> adj) {\n        boolean[] inMST = new boolean[V];\n        PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));\n        pq.offer(new int[]{0, 0}); long cost = 0;\n        while (!pq.isEmpty()) {\n            int[] cur = pq.poll(); int w = cur[0], u = cur[1];\n            if (inMST[u]) continue;\n            inMST[u] = true; cost += w;\n            for (int[] e : adj.get(u)) if (!inMST[e[0]]) pq.offer(new int[]{e[1], e[0]});\n        }\n        return cost;\n    }\n}`,
      python: `import heapq\ndef prim_mst(v_count: int, adj: list[list[tuple[int, int]]]) -> int:\n    in_mst = [False] * v_count\n    pq, cost = [(0, 0)], 0\n    while pq:\n        w, u = heapq.heappop(pq)\n        if in_mst[u]: continue\n        in_mst[u] = True; cost += w\n        for v, ew in adj[u]:\n            if not in_mst[v]: heapq.heappush(pq, (ew, v))\n    return cost`,
    },
  },
  {
    topicSlug: 'kruskals-algorithm',
    title: 'Kruskal’s Algorithm (MST with DSU)',
    definition:
      '**Kruskal’s Algorithm** builds an MST by sorting all `E` edges in ascending weight order and greedily adding each edge `(u, v, w)` that connects two different components in a Disjoint Set Union (DSU).',
    explanation:
      'Sorting edges takes `O(E log E)`. Checking `find(u) != find(v)` in DSU prevents cycles in `O(alpha(V))` amortized time. Stop early as soon as `edgesUsed == V - 1`.',
    realWorldAnalogy:
      'Connecting cities with roads by picking the cheapest road anywhere in the country that doesn’t create a redundant loop.',
    algorithm:
      '1. Sort `edges` ascending by `w`.\n2. Initialize DSU for `0..V-1`.\n3. For `(u, v, w)` in `edges`: if `dsu.unite(u, v)` succeeds, add `w` to `mstCost`, increment `count`; if `count == V - 1`, `break`.',
    pseudocode: `sort edges by w ascending
dsu <- DSU(V); mstCost <- 0
for (u, v, w) in edges:
    if dsu.unite(u, v):
        mstCost <- mstCost + w
return mstCost`,
    dryRunExample:
      'Edges `(0,1,1), (1,2,2), (0,2,5)`: add `(0,1,1)` and `(1,2,2)`; `(0,2,5)` has `find(0) == find(2)` -> skipped. Total = `3`.',
    timeComplexity: '`O(E log E)`',
    spaceComplexity: '`O(V + E)`',
    commonMistakes: [
      'Forgetting to check `count == V - 1` when the graph might be disconnected (no spanning tree exists).',
    ],
    interviewTips: [
      'Kruskal’s is super clean on **Min Cost to Connect All Points** (LeetCode 1584) or when edges are already given as an edge list.',
    ],
    implementations: {
      c: `// qsort edges by w, then loop calling dsuUnite(u, v)`,
      cpp: `#include <algorithm>\n#include <numeric>\n#include <vector>\nusing namespace std;\nstruct KEdge { int u, v, w; };\nlong long kruskalMST(int V, vector<KEdge>& edges) {\n    sort(edges.begin(), edges.end(), [](const KEdge& a, const KEdge& b) { return a.w < b.w; });\n    vector<int> p(V), r(V, 0); iota(p.begin(), p.end(), 0);\n    auto find = [&](auto& self, int x) -> int { return p[x] == x ? x : p[x] = self(self, p[x]); };\n    long long cost = 0; int used = 0;\n    for (auto& e : edges) {\n        int a = find(find, e.u), b = find(find, e.v);\n        if (a != b) { if (r[a] < r[b]) swap(a, b); p[b] = a; if (r[a] == r[b]) ++r[a]; cost += e.w; if (++used == V - 1) break; }\n    }\n    return cost;\n}`,
      java: `import java.util.*;\npublic class KruskalsMST {\n    static int find(int[] p, int x) { return p[x] == x ? x : (p[x] = find(p, p[x])); }\n    public static long kruskal(int V, int[][] edges) {\n        Arrays.sort(edges, Comparator.comparingInt(a -> a[2]));\n        int[] p = new int[V], r = new int[V]; for (int i = 0; i < V; i++) p[i] = i;\n        long cost = 0; int used = 0;\n        for (int[] e : edges) {\n            int a = find(p, e[0]), b = find(p, e[1]);\n            if (a != b) { if (r[a] < r[b]) { int t=a; a=b; b=t; } p[b] = a; if (r[a] == r[b]) r[a]++; cost += e[2]; if (++used == V - 1) break; }\n        }\n        return cost;\n    }\n}`,
      python: `def kruskal_mst(v_count: int, edges: list[tuple[int, int, int]]) -> int:\n    edges.sort(key=lambda x: x[2])\n    p, r = list(range(v_count)), [0] * v_count\n    def find(x: int) -> int:\n        while p[x] != x: p[x] = p[p[x]]; x = p[x]\n        return x\n    cost = used = 0\n    for u, v, w in edges:\n        a, b = find(u), find(v)\n        if a != b:\n            if r[a] < r[b]: a, b = b, a\n            p[b] = a\n            if r[a] == r[b]: r[a] += 1\n            cost += w; used += 1\n            if used == v_count - 1: break\n    return cost`,
    },
  },
  {
    topicSlug: 'disjoint-set-union',
    title: 'Disjoint Set Union (DSU / Union-Find)',
    definition:
      '**Disjoint Set Union (DSU)** maintains a partition of `{0..N-1}` into disjoint sets, supporting `find(x)` (get set representative) and `unite(x, y)` (merge two sets) in near-constant `O(alpha(N))` amortized time.',
    explanation:
      'Each set is represented as a rooted tree stored in a `parent[]` array (`parent[root] = root`). Combining **Path Compression** in `find` and **Union by Rank/Size** in `unite` keeps tree height effectively constant (`<= 4` for all practical `N`).',
    realWorldAnalogy:
      'Tracking friend circles or network connectivity where two clusters merge into one whenever a bridge is built between them.',
    algorithm:
      '1. Initialize `parent[i] = i`, `size[i] = 1`.\n2. `find(x)`: follow `parent` to root and compress paths.\n3. `unite(x, y)`: `rx = find(x)`, `ry = find(y)`; if `rx != ry`, attach smaller tree under larger tree.',
    pseudocode: `find(x):
    if parent[x] != x: parent[x] <- find(parent[x])
    return parent[x]
unite(x, y):
    rx <- find(x), ry <- find(y)
    if rx == ry: return false
    attach smaller root under larger root
    return true`,
    dryRunExample:
      '`unite(0, 1)`, `unite(2, 3)`, `unite(1, 3)` -> `find(0) == find(2)` is `true`.',
    timeComplexity: '`O(alpha(N))` amortized per operation (Inverse Ackermann)',
    spaceComplexity: '`O(N)`',
    commonMistakes: [
      'Connecting `x` and `y` directly (`parent[y] = x`) instead of connecting their roots (`parent[ry] = rx`).',
    ],
    interviewTips: [
      'DSU is the go-to structure for dynamic connectivity, Kruskal’s MST, and Redundant Connection.',
    ],
    implementations: {
      c: `int dsuFind(int p[], int x) { return p[x] == x ? x : (p[x] = dsuFind(p, p[x])); }\nint dsuUnite(int p[], int sz[], int x, int y) {\n    int a = dsuFind(p, x), b = dsuFind(p, y);\n    if (a == b) return 0;\n    if (sz[a] < sz[b]) { int t = a; a = b; b = t; }\n    p[b] = a; sz[a] += sz[b]; return 1;\n}`,
      cpp: `#include <numeric>\n#include <vector>\nstruct DSU {\n    std::vector<int> p, sz;\n    DSU(int n) : p(n), sz(n, 1) { std::iota(p.begin(), p.end(), 0); }\n    int find(int x) { return p[x] == x ? x : p[x] = find(p[x]); }\n    bool unite(int x, int y) {\n        int a = find(x), b = find(y); if (a == b) return false;\n        if (sz[a] < sz[b]) std::swap(a, b);\n        p[b] = a; sz[a] += sz[b]; return true;\n    }\n};`,
      java: `public class DSU {\n    int[] p, sz;\n    public DSU(int n) { p = new int[n]; sz = new int[n]; for (int i = 0; i < n; i++) { p[i] = i; sz[i] = 1; } }\n    public int find(int x) { return p[x] == x ? x : (p[x] = find(p[x])); }\n    public boolean unite(int x, int y) {\n        int a = find(x), b = find(y); if (a == b) return false;\n        if (sz[a] < sz[b]) { int t = a; a = b; b = t; }\n        p[b] = a; sz[a] += sz[b]; return true;\n    }\n}`,
      python: `class DSU:\n    def __init__(self, n: int):\n        self.p, self.sz = list(range(n)), [1] * n\n    def find(self, x: int) -> int:\n        while self.p[x] != x:\n            self.p[x] = self.p[self.p[x]]\n            x = self.p[x]\n        return x\n    def unite(self, x: int, y: int) -> bool:\n        a, b = self.find(x), self.find(y)\n        if a == b: return False\n        if self.sz[a] < self.sz[b]: a, b = b, a\n        self.p[b] = a; self.sz[a] += self.sz[b]; return True`,
    },
  },
  {
    topicSlug: 'dsu-path-compression',
    title: 'DSU Path Compression',
    definition:
      '**Path Compression** flattens the DSU tree during `find(x)` by pointing every visited node along the path directly to the root.',
    explanation:
      'Without path compression, a sequence of unions could form a tall tree. Path compression makes `parent[x] = find(parent[x])` recursively (or path halving `parent[x] = parent[parent[x]]` iteratively), turning future `find` calls on any node in that path into `O(1)` lookups.',
    realWorldAnalogy:
      'Asking a chain of managers "who is the CEO?" and then having everyone in that chain save the CEO’s direct phone number.',
    algorithm:
      'Recursive: `if (p[x] != x) p[x] = find(p[x]); return p[x];`\nIterative (path halving): `while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; }`',
    pseudocode: `find(x):
    if p[x] != x:
        p[x] <- find(p[x])
    return p[x]`,
    dryRunExample:
      'Chain `3 -> 2 -> 1 -> 0`: `find(3)` rewires `p[3] = 0`, `p[2] = 0`, `p[1] = 0`.',
    timeComplexity: '`O(log N)` alone, `O(alpha(N))` with Union by Rank/Size',
    spaceComplexity: '`O(1)` iterative, `O(H)` recursive',
    commonMistakes: [
      'Using path compression when you need **DSU Rollback** (for offline dynamic connectivity, use Union by Size WITHOUT path compression).',
    ],
    interviewTips: [
      'Iterative path halving `p[x] = p[p[x]]` avoids recursion stack completely and has the same `O(alpha(N))` bound.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'dsu-union-by-rank',
    title: 'DSU Union by Rank / Size',
    definition:
      '**Union by Rank (or Size)** always attaches the root of the shorter (or smaller) tree under the root of the taller (or larger) tree, bounding tree height to `O(log N)`.',
    explanation:
      'Attaching a smaller tree under a larger tree ensures that every time a node’s depth increases, the size of its component **at least doubles**—so depth can never exceed `log2(N)`. Rank only increments by `1` when two trees of equal rank are merged.',
    realWorldAnalogy:
      'Merging a small startup into a large corporation by having the startup’s CEO report to the corporation’s CEO.',
    algorithm:
      '1. Find roots `a = find(x)`, `b = find(y)`; if `a == b`, return.\n2. If `rank[a] < rank[b]`, `swap(a, b)`.\n3. `parent[b] = a`; if `rank[a] == rank[b]`, `rank[a]++`.',
    pseudocode: `if rank[a] < rank[b]: swap(a, b)
parent[b] <- a
if rank[a] == rank[b]: rank[a] <- rank[a] + 1`,
    dryRunExample:
      'Merging two rank-1 trees produces a rank-2 tree; merging a rank-1 tree into a rank-2 tree keeps rank `2`.',
    timeComplexity: '`O(log N)` alone, `O(alpha(N))` with Path Compression',
    spaceComplexity: '`O(N)`',
    commonMistakes: [
      'Incrementing `rank[a]` unconditionally instead of only when `rank[a] == rank[b]`.',
    ],
    interviewTips: [
      'Union by Size is often even more useful than Rank because `size[find(x)]` gives component size in `O(1)`.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'bridges-in-graph',
    title: 'Bridges in a Graph (Tarjan’s Bridge-Finding)',
    definition:
      'A **bridge** (cut-edge) in an undirected graph is an edge whose removal increases the number of connected components.',
    explanation:
      'Run DFS tracking two timestamps per node: `tin[u]` (discovery time) and `low[u]` (earliest discovery time reachable from `u`’s subtree using at most one back-edge). For tree edge `u -> v`, if `low[v] > tin[u]`, no back-edge from `v`’s subtree reaches `u` or above, so `(u, v)` is a bridge!',
    realWorldAnalogy:
      'Finding single-point-of-failure network cables whose cut would disconnect part of the internet.',
    algorithm:
      '1. `dfs(u, parent)` sets `tin[u] = low[u] = timer++`.\n2. For `v` in `adj[u]`:\n   - If `v == parent`, `continue`.\n   - If `vis[v]`: `low[u] = min(low[u], tin[v])`.\n   - Else: `dfs(v, u)`, `low[u] = min(low[u], low[v])`; if `low[v] > tin[u]`, record bridge `(u, v)`.',
    pseudocode: `dfs(u, parent):
    tin[u] <- low[u] <- timer++
    for v in adj[u]:
        if v == parent: continue
        if vis[v]: low[u] <- min(low[u], tin[v])
        else:
            dfs(v, u)
            low[u] <- min(low[u], low[v])
            if low[v] > tin[u]: bridges.append((u, v))`,
    dryRunExample:
      'Graph `0-1, 1-2, 2-0, 1-3`: cycle `{0,1,2}` has `low = 0`; edge `(1,3)` has `low[3]=3 > tin[1]=1` -> `(1,3)` is a bridge.',
    timeComplexity: '`O(V + E)`',
    spaceComplexity: '`O(V + E)`',
    commonMistakes: [
      'Using `low[v]` instead of `tin[v]` on a back-edge (breaks Articulation Points; stick to `tin[v]` for back-edges!).',
    ],
    interviewTips: [
      'Direct LeetCode problem: **Critical Connections in a Network** (LeetCode 1192).',
    ],
    implementations: {
      c: `// Tarjan bridge DFS with tin[], low[], timer`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\nvoid bridgeDfs(int u, int p, const vector<vector<int>>& adj, vector<int>& tin, vector<int>& low, int& timer, vector<pair<int,int>>& res) {\n    tin[u] = low[u] = ++timer;\n    for (int v : adj[u]) {\n        if (v == p) continue;\n        if (tin[v]) low[u] = min(low[u], tin[v]);\n        else {\n            bridgeDfs(v, u, adj, tin, low, timer, res);\n            low[u] = min(low[u], low[v]);\n            if (low[v] > tin[u]) res.push_back({u, v});\n        }\n    }\n}`,
      java: `import java.util.*;\npublic class Bridges {\n    int timer = 0;\n    public List<List<Integer>> criticalConnections(int n, List<List<Integer>> adj) {\n        int[] tin = new int[n], low = new int[n]; List<List<Integer>> res = new ArrayList<>();\n        dfs(0, -1, adj, tin, low, res); return res;\n    }\n    private void dfs(int u, int p, List<List<Integer>> adj, int[] tin, int[] low, List<List<Integer>> res) {\n        tin[u] = low[u] = ++timer;\n        for (int v : adj.get(u)) {\n            if (v == p) continue;\n            if (tin[v] != 0) low[u] = Math.min(low[u], tin[v]);\n            else { dfs(v, u, adj, tin, low, res); low[u] = Math.min(low[u], low[v]); if (low[v] > tin[u]) res.add(Arrays.asList(u, v)); }\n        }\n    }\n}`,
      python: `def find_bridges(n: int, adj: list[list[int]]) -> list[tuple[int, int]]:\n    tin, low, timer, res = [0] * n, [0] * n, [0], []\n    def dfs(u: int, p: int) -> None:\n        timer[0] += 1; tin[u] = low[u] = timer[0]\n        for v in adj[u]:\n            if v == p: continue\n            if tin[v]: low[u] = min(low[u], tin[v])\n            else:\n                dfs(v, u); low[u] = min(low[u], low[v])\n                if low[v] > tin[u]: res.append((u, v))\n    for i in range(n):\n        if not tin[i]: dfs(i, -1)\n    return res`,
    },
  },
  {
    topicSlug: 'articulation-points',
    title: 'Articulation Points (Cut Vertices)',
    definition:
      'An **articulation point** (cut vertex) in an undirected graph is a vertex whose removal (along with its incident edges) disconnects the graph (increases component count).',
    explanation:
      'Using Tarjan’s `tin[]` and `low[]`:\n- A **non-root** vertex `u` is an articulation point iff it has a DFS child `v` with `low[v] >= tin[u]` (note `>=`, not `>`!).\n- The **DFS root** (`parent == -1`) is an articulation point iff it has `>= 2` independent DFS children.',
    realWorldAnalogy:
      'A central router whose failure splits the office network into disconnected islands.',
    algorithm:
      '1. `children = 0`, `tin[u] = low[u] = ++timer`.\n2. For `v` in `adj[u]`:\n   - If `v == p`, `continue`.\n   - If `tin[v] != 0`: `low[u] = min(low[u], tin[v])`.\n   - Else: `children++`, `dfs(v, u)`, `low[u] = min(low[u], low[v])`; if `p != -1 && low[v] >= tin[u]`, mark `isArticulation[u] = true`.\n3. If `p == -1 && children > 1`, mark `isArticulation[u] = true`.',
    pseudocode: `if p != -1 and low[v] >= tin[u]: isAP[u] <- true
// after loop:
if p == -1 and children > 1: isAP[u] <- true`,
    dryRunExample:
      'Star graph with center `0` and leaves `1, 2, 3`: `0` has `children = 3 > 1` -> `0` is an articulation point.',
    timeComplexity: '`O(V + E)`',
    spaceComplexity: '`O(V)`',
    commonMistakes: [
      'Forgetting the special `parent == -1 && children > 1` rule for the DFS root.',
      'Adding `u` multiple times to a list instead of using a boolean `isAP[u]` array.',
    ],
    interviewTips: [
      'Contrast Bridges (`low[v] > tin[u]`) vs Articulation Points (`low[v] >= tin[u]` + root rule).',
    ],
    implementations: {
      c: `// Same Tarjan DFS as Bridges with low[v] >= tin[u] and root children > 1`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\nvoid apDfs(int u, int p, const vector<vector<int>>& adj, vector<int>& tin, vector<int>& low, int& timer, vector<bool>& isAP) {\n    tin[u] = low[u] = ++timer; int children = 0;\n    for (int v : adj[u]) {\n        if (v == p) continue;\n        if (tin[v]) low[u] = min(low[u], tin[v]);\n        else {\n            ++children; apDfs(v, u, adj, tin, low, timer, isAP);\n            low[u] = min(low[u], low[v]);\n            if (p != -1 && low[v] >= tin[u]) isAP[u] = true;\n        }\n    }\n    if (p == -1 && children > 1) isAP[u] = true;\n}`,
      java: `// Same Tarjan DFS with boolean[] isAP and children > 1 check for p == -1`,
      python: `def articulation_points(n: int, adj: list[list[int]]) -> list[int]:\n    tin, low, is_ap, timer = [0]*n, [0]*n, [False]*n, [0]\n    def dfs(u: int, p: int) -> None:\n        timer[0] += 1; tin[u] = low[u] = timer[0]; children = 0\n        for v in adj[u]:\n            if v == p: continue\n            if tin[v]: low[u] = min(low[u], tin[v])\n            else:\n                children += 1; dfs(v, u); low[u] = min(low[u], low[v])\n                if p != -1 and low[v] >= tin[u]: is_ap[u] = True\n        if p == -1 and children > 1: is_ap[u] = True\n    for i in range(n):\n        if not tin[i]: dfs(i, -1)\n    return [i for i, flag in enumerate(is_ap) if flag]`,
    },
  },
  {
    topicSlug: 'strongly-connected-components',
    title: 'Strongly Connected Components (SCC)',
    definition:
      'A **Strongly Connected Component (SCC)** of a directed graph is a maximal subgraph in which every vertex `u` is reachable from every other vertex `v` in that subgraph.',
    explanation:
      'Compressing each SCC into a single super-node turns any directed graph into a **Condensation DAG**. Two linear-time `O(V + E)` algorithms find all SCCs: **Kosaraju’s Algorithm** (2 DFS passes + transposed graph) and **Tarjan’s SCC Algorithm** (1 DFS pass + stack).',
    realWorldAnalogy:
      'Neighborhoods in a city of one-way streets where you can drive from any house to any other house inside the same neighborhood and return.',
    algorithm:
      'Two standard algorithms:\n1. **Kosaraju:** DFS finish-time stack -> reverse all edges -> DFS in stack order.\n2. **Tarjan:** Single DFS with `tin[]`, `low[]`, and `onStack[]` popping an SCC whenever `low[u] == tin[u]`.',
    pseudocode: `// Every directed graph = DAG of its SCCs`,
    dryRunExample:
      'Cycle `0 -> 1 -> 2 -> 0` + edge `2 -> 3`: SCCs are `{0, 1, 2}` and `{3}`.',
    timeComplexity: '`O(V + E)`',
    spaceComplexity: '`O(V + E)`',
    commonMistakes: [
      'Confusing undirected Connected Components with directed Strongly Connected Components.',
    ],
    interviewTips: [
      'Condensation DAGs let you run DAG DP or 2-SAT solvers on cyclic directed graphs!',
    ],
    implementations: {},
  },
  {
    topicSlug: 'kosarajus-algorithm',
    title: 'Kosaraju’s Algorithm (SCC)',
    definition:
      '**Kosaraju’s Algorithm** finds all Strongly Connected Components in a directed graph in `O(V + E)` using two DFS passes and the transposed (reversed) graph.',
    explanation:
      '1. Run DFS on `G` and push vertices onto a stack in finishing order (top of stack is in a "source" SCC of the condensation DAG).\n2. Reverse all edges to form `G^T` (reversing edges turns source SCCs into sink SCCs so DFS cannot leak into other SCCs!).\n3. Pop vertices from the stack and run DFS on `G^T`; each DFS call discovers one complete SCC.',
    realWorldAnalogy:
      'Reversing all one-way street signs so a "source" district becomes a trap you cannot drive out of.',
    algorithm:
      '1. Pass 1: DFS on `adj`, push `u` to `order` on exit.\n2. Build `revAdj` by reversing every `u -> v` to `v -> u`.\n3. Pass 2: Pop `u` from `order` (back to front); if `!vis[u]`, DFS on `revAdj` to collect one SCC.',
    pseudocode: `// Pass 1:
for i in 0..V-1: if not vis[i]: dfs1(i) // pushes to stack
// Pass 2 on revAdj:
reset vis
while stack not empty:
    u <- stack.pop()
    if not vis[u]:
        comp <- []
        dfs2(u, comp)
        sccs.append(comp)`,
    dryRunExample:
      '`0->1->2->0` and `2->3`: Pass 1 stack top is `0`; in `G^T`, `0` can reach `2, 1` but NOT `3` (since `3->2` is reversed). SCCs: `{0, 2, 1}` and `{3}`.',
    timeComplexity: '`O(V + E)`',
    spaceComplexity: '`O(V + E)` (stores reversed graph)',
    commonMistakes: [
      'Forgetting to reset `visited[]` between Pass 1 and Pass 2.',
    ],
    interviewTips: [
      'Kosaraju is conceptually easier to explain in interviews than Tarjan’s SCC.',
    ],
    implementations: {
      c: `// Two DFS passes: fill stack in G, reset vis, DFS in revG`,
      cpp: `#include <vector>\nusing namespace std;\nvoid kDfs1(int u, const vector<vector<int>>& adj, vector<bool>& vis, vector<int>& st) {\n    vis[u] = true; for (int v : adj[u]) if (!vis[v]) kDfs1(v, adj, vis, st); st.push_back(u);\n}\nvoid kDfs2(int u, const vector<vector<int>>& rev, vector<bool>& vis, vector<int>& comp) {\n    vis[u] = true; comp.push_back(u); for (int v : rev[u]) if (!vis[v]) kDfs2(v, rev, vis, comp);\n}\nvector<vector<int>> kosaraju(int V, const vector<vector<int>>& adj) {\n    vector<bool> vis(V, false); vector<int> st;\n    for (int i = 0; i < V; ++i) if (!vis[i]) kDfs1(i, adj, vis, st);\n    vector<vector<int>> rev(V); for (int u = 0; u < V; ++u) for (int v : adj[u]) rev[v].push_back(u);\n    fill(vis.begin(), vis.end(), false); vector<vector<int>> sccs;\n    for (int i = V - 1; i >= 0; --i) if (!vis[st[i]]) { sccs.emplace_back(); kDfs2(st[i], rev, vis, sccs.back()); }\n    return sccs;\n}`,
      java: `// Same 2-pass DFS using adj and revAdj`,
      python: `def kosaraju(v_count: int, adj: list[list[int]]) -> list[list[int]]:\n    vis, st = [False] * v_count, []\n    def dfs1(u: int) -> None:\n        vis[u] = True\n        for v in adj[u]:\n            if not vis[v]: dfs1(v)\n        st.append(u)\n    for i in range(v_count):\n        if not vis[i]: dfs1(i)\n    rev = [[] for _ in range(v_count)]\n    for u in range(v_count):\n        for v in adj[u]: rev[v].append(u)\n    vis = [False] * v_count; sccs = []\n    def dfs2(u: int, comp: list[int]) -> None:\n        vis[u] = True; comp.append(u)\n        for v in rev[u]:\n            if not vis[v]: dfs2(v, comp)\n    for u in reversed(st):\n        if not vis[u]: comp = []; dfs2(u, comp); sccs.append(comp)\n    return sccs`,
    },
  },
  {
    topicSlug: 'tarjans-algorithm',
    title: 'Tarjan’s Algorithm (Single-Pass SCC)',
    definition:
      '**Tarjan’s Algorithm** finds all Strongly Connected Components in a single `O(V + E)` DFS pass using discovery times `tin[]`, low-link values `low[]`, and an active `onStack[]` set.',
    explanation:
      'When DFS visits `u`, push `u` onto `st` and mark `onStack[u] = true`. Only update `low[u] = min(low[u], tin[v])` for already-visited neighbors `v` that are **currently `onStack[v]`** (ignoring cross-edges to finished SCCs!). When `low[u] == tin[u]`, `u` is the root of an SCC—pop from `st` until `u` to extract the entire SCC.',
    realWorldAnalogy:
      'Exploring a maze with a trail stack: whenever the oldest reachable room from your current room is itself, everyone on the stack above it forms a closed loop district.',
    algorithm:
      '1. `tin[u] = low[u] = ++timer`, `st.push(u)`, `onStack[u] = true`.\n2. For `v` in `adj[u]`:\n   - If `!tin[v]`: `dfs(v)`, `low[u] = min(low[u], low[v])`.\n   - Else if `onStack[v]`: `low[u] = min(low[u], tin[v])`.\n3. If `low[u] == tin[u]`: pop nodes until `u`, setting `onStack[w] = false`.',
    pseudocode: `dfs(u):
    tin[u] <- low[u] <- ++timer; st.push(u); onStack[u] <- true
    for v in adj[u]:
        if not tin[v]: dfs(v); low[u] <- min(low[u], low[v])
        else if onStack[v]: low[u] <- min(low[u], tin[v])
    if low[u] == tin[u]:
        pop until u -> forms one SCC`,
    dryRunExample:
      'In `0->1->2->0` and `2->3`: `3` finishes with `low[3]=tin[3]=4` -> pops `{3}`; `0` finishes with `low[0]=tin[0]=1` -> pops `{2, 1, 0}`.',
    timeComplexity: '`O(V + E)` single pass',
    spaceComplexity: '`O(V)` (no reversed graph needed!)',
    commonMistakes: [
      'Updating `low[u]` from a neighbor `v` where `onStack[v] == false` (cross-edge to an already-popped SCC!).',
    ],
    interviewTips: [
      'Tarjan’s SCC outputs SCCs in **reverse topological order** of the condensation DAG!',
    ],
    implementations: {
      c: `// Single-pass DFS with tin[], low[], onStack[], and explicit stack`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\nvoid tarjanDfs(int u, const vector<vector<int>>& adj, vector<int>& tin, vector<int>& low, vector<bool>& onSt, vector<int>& st, int& timer, vector<vector<int>>& sccs) {\n    tin[u] = low[u] = ++timer; st.push_back(u); onSt[u] = true;\n    for (int v : adj[u]) {\n        if (!tin[v]) { tarjanDfs(v, adj, tin, low, onSt, st, timer, sccs); low[u] = min(low[u], low[v]); }\n        else if (onSt[v]) low[u] = min(low[u], tin[v]);\n    }\n    if (low[u] == tin[u]) {\n        vector<int> comp;\n        while (true) { int w = st.back(); st.pop_back(); onSt[w] = false; comp.push_back(w); if (w == u) break; }\n        sccs.push_back(move(comp));\n    }\n}`,
      java: `// Same single-pass Tarjan SCC with tin[], low[], boolean[] onSt, Deque<Integer> st`,
      python: `def tarjan_scc(n: int, adj: list[list[int]]) -> list[list[int]]:\n    tin, low, on_st, st, timer, sccs = [0]*n, [0]*n, [False]*n, [], [0], []\n    def dfs(u: int) -> None:\n        timer[0] += 1; tin[u] = low[u] = timer[0]; st.append(u); on_st[u] = True\n        for v in adj[u]:\n            if not tin[v]: dfs(v); low[u] = min(low[u], low[v])\n            elif on_st[v]: low[u] = min(low[u], tin[v])\n        if low[u] == tin[u]:\n            comp = []\n            while True:\n                w = st.pop(); on_st[w] = False; comp.append(w)\n                if w == u: break\n            sccs.append(comp)\n    for i in range(n):\n        if not tin[i]: dfs(i)\n    return sccs`,
    },
  },
  {
    topicSlug: 'euler-path-intro',
    title: 'Euler Path & Euler Circuit (Hierholzer’s Overview)',
    definition:
      'An **Euler Path** traverses every **edge** in a graph exactly once; an **Euler Circuit** is an Euler Path that starts and ends at the same vertex.',
    explanation:
      'Necessary & sufficient conditions (ignoring isolated 0-degree vertices):\n- **Undirected Euler Circuit:** Connected + every vertex has **even** degree.\n- **Undirected Euler Path:** Connected + **0 or 2** vertices have odd degree (start/end at the 2 odd vertices).\n- **Directed Euler Circuit:** Strongly connected + `inDeg[v] == outDeg[v]` for all `v`.\n- **Directed Euler Path:** At most one vertex has `outDeg - inDeg = 1` (start), at most one has `inDeg - outDeg = 1` (end), all others `inDeg == outDeg`.',
    realWorldAnalogy:
      'The classic Seven Bridges of Königsberg puzzle: drawing a figure without lifting your pen or retracing any line.',
    algorithm:
      'Hierholzer’s Algorithm (`O(E)`):\n1. Start DFS from valid start vertex.\n2. Greedily consume and delete outgoing edges.\n3. Append vertex to `path` on backtrack; reverse `path` at the end.',
    pseudocode: `hierholzer(u):
    while adj[u] not empty:
        v <- adj[u].pop()
        hierholzer(v)
    circuit.append(u)`,
    dryRunExample:
      'LeetCode 332 (**Reconstruct Itinerary**) is a direct application of Hierholzer’s algorithm on directed edges sorted lexicographically.',
    timeComplexity: '`O(V + E)` (or `O(E log E)` if edges are sorted)',
    spaceComplexity: '`O(V + E)`',
    commonMistakes: [
      'Confusing **Euler Path** (every *edge* once, polynomial `O(E)`) with **Hamiltonian Path** (every *vertex* once, NP-complete).',
    ],
    interviewTips: [
      'Always state the degree parity conditions clearly before coding Hierholzer’s postorder DFS.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'hamiltonian-path-intro',
    title: 'Hamiltonian Path & Cycle Introduction',
    definition:
      'A **Hamiltonian Path** visits every **vertex** in a graph exactly once; a **Hamiltonian Cycle** returns to the starting vertex after visiting every vertex once.',
    explanation:
      'Unlike Euler paths (solvable in `O(E)`), deciding whether a general graph has a Hamiltonian Path or Cycle is **NP-complete**—no polynomial-time algorithm is known. For small `N <= 20`, **Bitmask DP** (`dp[mask][last]`) solves it in `O(2^N * N^2)` time, improving over `O(N!)` backtracking.',
    realWorldAnalogy:
      'The Traveling Salesperson Problem (TSP): visiting every city once before returning home.',
    algorithm:
      'Bitmask DP:\n`dp[mask][u] = true` if subset `mask` of vertices can be visited ending at `u`.\nTransition: if `dp[mask][u]` and edge `(u, v)` exists with `!(mask & (1 << v))`, set `dp[mask | (1 << v)][v] = true`.',
    pseudocode: `dp[1 << i][i] <- true for all i
for mask in 1..(1<<N)-1:
    for u in 0..N-1:
        if dp[mask][u]:
            for v in adj[u]:
                if not (mask & (1 << v)):
                    dp[mask | (1 << v)][v] <- true`,
    dryRunExample:
      'For `N = 4` path `0-1-2-3`, `dp[1111_2][3]` becomes `true`.',
    timeComplexity: '`O(2^N * N^2)` with Bitmask DP (`O(N!)` backtracking)',
    spaceComplexity: '`O(2^N * N)`',
    commonMistakes: [
      'Trying to find a polynomial `O(V + E)` rule like Euler Path for Hamiltonian Path.',
    ],
    interviewTips: [
      'When `N <= 15..20`, immediately think **Bitmask DP** or Backtracking.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'network-flow-intro',
    title: 'Network Flow & Max-Flow Min-Cut Introduction',
    definition:
      'In a directed **flow network** with capacities `cap(u, v)`, **Maximum Flow** finds the greatest flow rate from source `S` to sink `T` obeying capacity constraints and flow conservation at every intermediate vertex.',
    explanation:
      'The **Max-Flow Min-Cut Theorem** states that the maximum `S-T` flow equals the minimum capacity of an `S-T` cut. **Ford-Fulkerson / Edmonds-Karp** repeatedly finds an **augmenting path** from `S` to `T` in the **residual graph** (which includes backward edges to allow "undoing" earlier flow) until no augmenting path remains.\n- **Edmonds-Karp (BFS):** `O(V * E^2)`.\n- **Dinic’s Algorithm (Level Graph + Blocking Flow):** `O(V^2 * E)` (or `O(E sqrt(V))` on unit-capacity / bipartite matching graphs).',
    realWorldAnalogy:
      'Determining the maximum liters/second of water that can flow through a pipe network from a reservoir `S` to a city `T`.',
    algorithm:
      '1. Initialize `flow = 0`.\n2. While BFS finds an `S -> T` path in residual graph (`cap - flow > 0`):\n   - Find bottleneck capacity `bn` along the path.\n   - Add `bn` to `flow`, subtract `bn` from forward residual capacities, and add `bn` to reverse residual capacities.',
    pseudocode: `maxFlow <- 0
while path <- bfsResidual(S, T):
    bn <- minResidualCapacity(path)
    maxFlow <- maxFlow + bn
    updateResidualEdges(path, bn)
return maxFlow`,
    dryRunExample:
      'Maximum Bipartite Matching reduces directly to Max-Flow by adding a super-source `S` to left nodes (cap 1) and right nodes to super-sink `T` (cap 1).',
    timeComplexity: '`O(V * E^2)` (Edmonds-Karp); `O(V^2 * E)` (Dinic)',
    spaceComplexity: '`O(V + E)`',
    commonMistakes: [
      'Forgetting **reverse residual edges** (without them, greedy augmenting paths can get stuck in suboptimal flow!).',
    ],
    interviewTips: [
      'Mention the **Max-Flow Min-Cut Theorem** and Bipartite Matching reduction.',
    ],
    implementations: {},
  },
];

export default module20GraphsNotes;
