/**
 * CodeClimb DSA Curriculum Seed Data — Modules 19 to 24
 * Modules: Greedy Algorithms, Graphs, Dynamic Programming, Tries,
 *          Advanced String Algorithms, and Advanced Data Structures.
 */

const ytSearch = (query, title) => ({
  url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
  title,
});

const lcProblem = (slug, title) => ({
  url: `https://leetcode.com/problems/${slug}/`,
  title,
});

const modules19to24 = [
  // =========================================================================
  // MODULE 19: GREEDY ALGORITHMS
  // =========================================================================
  {
    title: 'Greedy Algorithms',
    slug: 'greedy-algorithms',
    description:
      'Master locally optimal decision-making, exchange arguments, interval scheduling, Huffman coding, and classic greedy optimization problems.',
    order: 19,
    difficulty: 'Hard',
    iconName: 'TrendingUp',
    topics: [
      {
        title: 'Greedy Strategy',
        slug: 'greedy-strategy',
        description:
          'Understand the core paradigm of building a global solution step by step by making the locally best choice at each stage, along with when greedy approaches succeed or fail.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'greedy algorithms introduction strategy dsa',
              'Greedy Algorithms Strategy Introduction - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Greedy Choice Property',
        slug: 'greedy-choice-property',
        description:
          'Learn the two theoretical pillars that justify greedy algorithms—the greedy choice property and optimal substructure—and how to prove correctness using exchange arguments.',
        order: 2,
        difficulty: 'Medium',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'greedy choice property optimal substructure proof exchange argument',
              'Greedy Choice Property & Exchange Arguments - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Activity Selection',
        slug: 'activity-selection',
        description:
          'Select the maximum number of mutually compatible activities from start and finish times by sorting by earliest finish time in O(n log n) time.',
        order: 3,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'activity selection problem greedy algorithm',
              'Activity Selection Problem (Greedy) - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Fractional Knapsack',
        slug: 'fractional-knapsack',
        description:
          'Maximize total value within a weight capacity when items can be broken into fractions by sorting items in descending order of value-to-weight ratio.',
        order: 4,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'fractional knapsack greedy algorithm',
              'Fractional Knapsack Problem - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Job Sequencing with Deadlines',
        slug: 'job-sequencing-with-deadlines',
        description:
          'Schedule unit-time jobs with deadlines and profits to maximize total profit by greedily assigning high-profit jobs to the latest available time slot.',
        order: 5,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'job sequencing with deadlines greedy algorithm',
              'Job Sequencing with Deadlines - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Meeting Room Scheduling',
        slug: 'meeting-room-scheduling',
        description:
          'Determine whether a single participant can attend all scheduled meetings or compute the minimum conference rooms needed using interval sorting and sweep-line techniques.',
        order: 6,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem('meeting-rooms', 'Meeting Rooms (LeetCode #252)'),
          youtube: [
            ytSearch(
              'meeting rooms interval scheduling leetcode greedy',
              'Meeting Room Scheduling - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Interval Merging',
        slug: 'interval-merging',
        description:
          'Sort intervals by start time and merge all overlapping ranges in a single linear pass in O(n log n) time.',
        order: 7,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem('merge-intervals', 'Merge Intervals (LeetCode #56)'),
          youtube: [
            ytSearch(
              'merge intervals leetcode 56 explanation',
              'Merge Intervals Algorithm - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Non-Overlapping Intervals',
        slug: 'non-overlapping-intervals',
        description:
          'Find the minimum number of intervals to remove so the remaining intervals do not overlap by greedily keeping intervals with the smallest end time.',
        order: 8,
        difficulty: 'Medium',
        conceptType: 'problem',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'non-overlapping-intervals',
            'Non-overlapping Intervals (LeetCode #435)'
          ),
          youtube: [
            ytSearch(
              'non overlapping intervals leetcode 435 greedy',
              'Non-Overlapping Intervals - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Minimum Platforms',
        slug: 'minimum-platforms',
        description:
          'Compute the minimum railway platforms required for a schedule of train arrival and departure times (classic GFG problem) using two-pointer event sweep in O(n log n) time.',
        order: 9,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'minimum number of platforms greedy algorithm gfg',
              'Minimum Number of Platforms - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Huffman Coding',
        slug: 'huffman-coding',
        description:
          'Construct an optimal prefix-free variable-length binary code for lossless data compression by repeatedly merging the two lowest-frequency nodes in a min-heap.',
        order: 10,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'huffman coding greedy algorithm min heap',
              'Huffman Coding Algorithm - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Jump Game',
        slug: 'jump-game',
        description:
          'Track the farthest reachable index while scanning an array to decide reachability and compute minimum jumps greedily in O(n) time and O(1) space.',
        order: 11,
        difficulty: 'Medium',
        conceptType: 'problem',
        resources: {
          codechef: null,
          leetcode: lcProblem('jump-game', 'Jump Game (LeetCode #55)'),
          youtube: [
            ytSearch(
              'jump game leetcode 55 greedy algorithm',
              'Jump Game Greedy Solution - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
    ],
  },

  // =========================================================================
  // MODULE 20: GRAPHS
  // =========================================================================
  {
    title: 'Graphs',
    slug: 'graphs',
    description:
      'Explore graph representations, BFS/DFS traversals, cycle detection, topological sorting, shortest paths, minimum spanning trees, DSU, connectivity, and flow concepts.',
    order: 20,
    difficulty: 'Hard',
    iconName: 'Network',
    topics: [
      {
        title: 'Graph Terminology',
        slug: 'graph-terminology',
        description:
          'Learn foundational graph concepts including vertices, edges, degree, in-degree, out-degree, paths, cycles, connectivity, and dense versus sparse graphs.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'graph data structure terminology vertices edges degree',
              'Graph Terminology Introduction - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Directed and Undirected',
        slug: 'directed-and-undirected',
        description:
          'Compare directed graphs (digraphs) with symmetric undirected graphs, understanding edge orientation, reachability asymmetry, and real-world modeling.',
        order: 2,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'directed vs undirected graph data structures',
              'Directed vs Undirected Graphs - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Weighted and Unweighted',
        slug: 'weighted-and-unweighted',
        description:
          'Understand how edge weights represent cost, distance, or capacity, and how weights dictate the choice between BFS and weighted shortest-path algorithms.',
        order: 3,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'weighted vs unweighted graph data structure',
              'Weighted vs Unweighted Graphs - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Adjacency Matrix',
        slug: 'adjacency-matrix',
        description:
          'Represent graphs using a V x V matrix for O(1) edge lookup with O(V^2) space complexity, suited for dense graphs and Floyd-Warshall.',
        order: 4,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'graph representation adjacency matrix dsa',
              'Adjacency Matrix Representation - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Adjacency List',
        slug: 'adjacency-list',
        description:
          'Store per-vertex neighbor lists in O(V + E) space for fast neighbor iteration in sparse graphs and most traversal and shortest-path algorithms.',
        order: 5,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'graph representation adjacency list dsa',
              'Adjacency List Representation - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'BFS Traversal',
        slug: 'bfs-traversal',
        description:
          'Traverse a graph level by level using a queue and visited set in O(V + E) time to discover nodes and compute shortest paths in unweighted graphs.',
        order: 6,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'breadth first search bfs graph traversal algorithm',
              'BFS Graph Traversal - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'DFS Traversal',
        slug: 'dfs-traversal',
        description:
          'Explore graph paths as deeply as possible via recursion or an explicit stack in O(V + E) time to classify edges, detect cycles, and build topological orders.',
        order: 7,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'depth first search dfs graph traversal algorithm',
              'DFS Graph Traversal - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Connected Components',
        slug: 'connected-components',
        description:
          'Partition an undirected graph into maximal connected subgraphs by launching BFS, DFS, or Disjoint Set Union across unvisited vertices.',
        order: 8,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'number-of-provinces',
            'Number of Provinces (LeetCode #547)'
          ),
          youtube: [
            ytSearch(
              'connected components in graph number of provinces',
              'Connected Components in Graphs - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Flood Fill',
        slug: 'flood-fill',
        description:
          'Propagate a color or state change across 4-directionally connected cells in a 2D grid using DFS or BFS.',
        order: 9,
        difficulty: 'Easy',
        conceptType: 'problem',
        resources: {
          codechef: null,
          leetcode: lcProblem('flood-fill', 'Flood Fill (LeetCode #733)'),
          youtube: [
            ytSearch(
              'flood fill algorithm leetcode 733 dfs bfs',
              'Flood Fill Algorithm - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Number of Islands',
        slug: 'number-of-islands',
        description:
          'Count distinct connected land components in a 2D binary grid using DFS, BFS, or Union-Find in O(R * C) time.',
        order: 10,
        difficulty: 'Medium',
        conceptType: 'problem',
        resources: {
          codechef: null,
          leetcode: lcProblem('number-of-islands', 'Number of Islands (LeetCode #200)'),
          youtube: [
            ytSearch(
              'number of islands leetcode 200 dfs bfs',
              'Number of Islands - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Cycle Detection (Undirected)',
        slug: 'cycle-detection-undirected',
        description:
          'Detect back edges in undirected graphs by tracking the parent vertex during DFS/BFS traversal or checking same-root unions in Disjoint Set Union.',
        order: 11,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'redundant-connection',
            'Redundant Connection (LeetCode #684)'
          ),
          youtube: [
            ytSearch(
              'cycle detection in undirected graph dfs bfs dsu',
              'Cycle Detection in Undirected Graph - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Cycle Detection (Directed)',
        slug: 'cycle-detection-directed',
        description:
          'Identify cycles in directed graphs using three-color DFS recursion-stack tracking or by verifying whether Kahn’s topological sort visits all vertices.',
        order: 12,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem('course-schedule', 'Course Schedule (LeetCode #207)'),
          youtube: [
            ytSearch(
              'cycle detection in directed graph dfs course schedule',
              'Cycle Detection in Directed Graph - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Bipartite Graph',
        slug: 'bipartite-graph',
        description:
          'Determine whether a graph is 2-colorable (equivalently, contains no odd-length cycles) using BFS or DFS graph coloring.',
        order: 13,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'is-graph-bipartite',
            'Is Graph Bipartite? (LeetCode #785)'
          ),
          youtube: [
            ytSearch(
              'bipartite graph check bfs dfs leetcode 785',
              'Bipartite Graph Check - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Topological Sort (DFS)',
        slug: 'topological-sort-dfs',
        description:
          'Compute a linear ordering of vertices in a Directed Acyclic Graph (DAG) by pushing each vertex onto a stack after visiting all its outgoing neighbors.',
        order: 14,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem('course-schedule-ii', 'Course Schedule II (LeetCode #210)'),
          youtube: [
            ytSearch(
              'topological sort dfs algorithm dag',
              'Topological Sort using DFS - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: "Kahn's Algorithm (BFS Topo Sort)",
        slug: 'kahns-algorithm',
        description:
          'Generate a topological ordering iteratively using vertex in-degrees and a queue, naturally detecting cycles if fewer than V vertices are processed.',
        order: 15,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem('course-schedule-ii', 'Course Schedule II (LeetCode #210)'),
          youtube: [
            ytSearch(
              'kahns algorithm topological sort bfs course schedule 2',
              "Kahn's Algorithm (BFS Topological Sort) - YouTube Search"
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Shortest Path Intro',
        slug: 'shortest-path-intro',
        description:
          'Survey single-source and all-pairs shortest-path formulations across unweighted graphs, DAGs, non-negative weights, and graphs with negative edges.',
        order: 16,
        difficulty: 'Medium',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'shortest path algorithms graph overview bfs dijkstra bellman ford',
              'Shortest Path Algorithms Overview - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: "Dijkstra's Algorithm",
        slug: 'dijkstras-algorithm',
        description:
          'Find single-source shortest paths in graphs with non-negative edge weights using a priority queue (min-heap) edge-relaxation strategy in O((V + E) log V) time.',
        order: 17,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem('network-delay-time', 'Network Delay Time (LeetCode #743)'),
          youtube: [
            ytSearch(
              'dijkstra algorithm shortest path priority queue leetcode 743',
              "Dijkstra's Shortest Path Algorithm - YouTube Search"
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Bellman-Ford',
        slug: 'bellman-ford',
        description:
          'Compute single-source shortest paths in graphs with negative edge weights in O(V * E) time via V - 1 relaxation passes, and detect negative-weight cycles.',
        order: 18,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'cheapest-flights-within-k-stops',
            'Cheapest Flights Within K Stops (LeetCode #787)'
          ),
          youtube: [
            ytSearch(
              'bellman ford algorithm shortest path negative weights',
              'Bellman-Ford Algorithm - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Floyd-Warshall',
        slug: 'floyd-warshall',
        description:
          'Compute all-pairs shortest paths across all intermediate vertices using O(V^3) dynamic programming and detect negative cycles via diagonal entries.',
        order: 19,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance',
            'Find the City With the Smallest Number of Neighbors at a Threshold Distance (LeetCode #1334)'
          ),
          youtube: [
            ytSearch(
              'floyd warshall algorithm all pairs shortest path',
              'Floyd-Warshall Algorithm - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'MST Intro',
        slug: 'mst-intro',
        description:
          'Understand spanning trees, minimum-weight spanning trees in weighted connected undirected graphs, and the cut property that underpins MST algorithms.',
        order: 20,
        difficulty: 'Medium',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'minimum spanning tree mst cut property introduction',
              'Minimum Spanning Tree (MST) Introduction - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: "Prim's Algorithm",
        slug: 'prims-algorithm',
        description:
          'Grow a Minimum Spanning Tree greedily from a starting vertex by repeatedly picking the minimum-weight edge connecting the tree to a new vertex via a min-heap.',
        order: 21,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'min-cost-to-connect-all-points',
            'Min Cost to Connect All Points (LeetCode #1584)'
          ),
          youtube: [
            ytSearch(
              'prims algorithm minimum spanning tree priority queue',
              "Prim's MST Algorithm - YouTube Search"
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: "Kruskal's Algorithm",
        slug: 'kruskals-algorithm',
        description:
          'Build a Minimum Spanning Tree by sorting edges in ascending weight order and adding non-cycle-forming edges in O(E log E) time using Disjoint Set Union.',
        order: 22,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'min-cost-to-connect-all-points',
            'Min Cost to Connect All Points (LeetCode #1584)'
          ),
          youtube: [
            ytSearch(
              'kruskals algorithm minimum spanning tree disjoint set',
              "Kruskal's MST Algorithm - YouTube Search"
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Disjoint Set Union',
        slug: 'disjoint-set-union',
        description:
          'Maintain dynamic connected components using find and union operations to answer connectivity queries and merge sets in near-constant amortized time.',
        order: 23,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'redundant-connection',
            'Redundant Connection (LeetCode #684)'
          ),
          youtube: [
            ytSearch(
              'disjoint set union dsu union find data structure',
              'Disjoint Set Union (Union-Find) - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Path Compression',
        slug: 'dsu-path-compression',
        description:
          'Optimize Disjoint Set Union find queries by flattening parent pointers directly to the root representative during recursion.',
        order: 24,
        difficulty: 'Medium',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'disjoint set union path compression optimization',
              'DSU Path Compression - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Union by Rank',
        slug: 'dsu-union-by-rank',
        description:
          'Keep DSU trees shallow by attaching the smaller-rank or smaller-size tree beneath the larger root, yielding O(alpha(n)) amortized complexity with path compression.',
        order: 25,
        difficulty: 'Medium',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'union by rank and union by size dsu complexity',
              'DSU Union by Rank & Size - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Bridges in Graph',
        slug: 'bridges-in-graph',
        description:
          'Find critical edges whose removal disconnects a graph using DFS discovery times (tin) and lowest reachable ancestor times (low) in O(V + E) time.',
        order: 26,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'critical-connections-in-a-network',
            'Critical Connections in a Network (LeetCode #1192)'
          ),
          youtube: [
            ytSearch(
              'bridges in graph tarjan critical connections leetcode 1192',
              'Bridges in Graph (Tarjan) - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Articulation Points',
        slug: 'articulation-points',
        description:
          'Identify cut vertices whose removal increases the number of connected components using DFS discovery/low-link values and root-child counting.',
        order: 27,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'articulation points cut vertices in graph dfs',
              'Articulation Points in Graph - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Strongly Connected Components',
        slug: 'strongly-connected-components',
        description:
          'Understand maximal mutually reachable vertex subsets in directed graphs and how condensing SCCs transforms any directed graph into a DAG.',
        order: 28,
        difficulty: 'Hard',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'strongly connected components directed graph condensation dag',
              'Strongly Connected Components - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: "Kosaraju's Algorithm",
        slug: 'kosarajus-algorithm',
        description:
          'Compute all Strongly Connected Components in O(V + E) time using two DFS passes: finish-time ordering on the original graph followed by DFS on the transposed graph.',
        order: 29,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'kosaraju algorithm strongly connected components',
              "Kosaraju's Algorithm for SCC - YouTube Search"
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: "Tarjan's Algorithm",
        slug: 'tarjans-algorithm',
        description:
          'Find Strongly Connected Components in a single DFS pass using discovery times, low-link values, and an active recursion stack in O(V + E) time.',
        order: 30,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'tarjan algorithm strongly connected components scc',
              "Tarjan's SCC Algorithm - YouTube Search"
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Euler Path Introduction',
        slug: 'euler-path-intro',
        description:
          'Learn the degree conditions for Eulerian trails and circuits (visiting every edge exactly once) and Hierholzer’s algorithm for constructing them.',
        order: 31,
        difficulty: 'Hard',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'euler path and circuit hierholzer algorithm graph',
              'Euler Path & Circuit Introduction - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Hamiltonian Path Intro',
        slug: 'hamiltonian-path-intro',
        description:
          'Explore paths and cycles visiting every vertex exactly once, why the problem is NP-complete, and how backtracking or bitmask DP solves small instances.',
        order: 32,
        difficulty: 'Hard',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'hamiltonian path and cycle graph theory backtracking',
              'Hamiltonian Path Introduction - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Network Flow Introduction',
        slug: 'network-flow-intro',
        description:
          'Understand flow networks, edge capacities, residual graphs, augmenting paths, Ford-Fulkerson / Edmonds-Karp, and the max-flow min-cut theorem.',
        order: 33,
        difficulty: 'Hard',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'network flow max flow min cut ford fulkerson introduction',
              'Network Flow & Max-Flow Min-Cut Intro - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
    ],
  },

  // =========================================================================
  // MODULE 21: DYNAMIC PROGRAMMING
  // =========================================================================
  {
    title: 'Dynamic Programming',
    slug: 'dynamic-programming',
    description:
      'Build mastery in state formulation, memoization, tabulation, space optimization, knapsack variants, string/sequence DP, stock state machines, and advanced DP paradigms.',
    order: 21,
    difficulty: 'Hard',
    iconName: 'Layers',
    topics: [
      {
        title: 'Overlapping Subproblems',
        slug: 'overlapping-subproblems',
        description:
          'Recognize when naive recursive trees recompute identical subproblems exponentially often and why caching intermediate results eliminates redundant work.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'overlapping subproblems dynamic programming introduction',
              'Overlapping Subproblems in DP - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Optimal Substructure',
        slug: 'optimal-substructure',
        description:
          'Understand how the optimal solution to a problem can be constructed from optimal solutions of its subproblems, forming valid recurrence relations.',
        order: 2,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'optimal substructure dynamic programming explained',
              'Optimal Substructure in DP - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Recursion to DP',
        slug: 'recursion-to-dp',
        description:
          'Follow a systematic framework to transform brute-force recursive backtracking into polynomial-time dynamic programming by identifying state parameters and transitions.',
        order: 3,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'recursion to dynamic programming step by step',
              'Recursion to Dynamic Programming - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Memoization (Top-Down)',
        slug: 'memoization-top-down',
        description:
          'Cache computed subproblem results on demand inside a recursive function using a lookup table or hash map to evaluate only reachable states.',
        order: 4,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'memoization top down dynamic programming',
              'Memoization (Top-Down DP) - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Tabulation (Bottom-Up)',
        slug: 'tabulation-bottom-up',
        description:
          'Fill a DP table iteratively from base cases upward in topological dependency order, avoiding recursion stack overhead.',
        order: 5,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'tabulation bottom up dynamic programming',
              'Tabulation (Bottom-Up DP) - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Space Optimization',
        slug: 'dp-space-optimization',
        description:
          'Reduce 2D DP tables to 1D rolling arrays or O(1) variables by observing which previous rows or states each transition actually depends on.',
        order: 6,
        difficulty: 'Medium',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'dynamic programming space optimization rolling array',
              'DP Space Optimization Techniques - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Fibonacci DP',
        slug: 'fibonacci-dp',
        description:
          'Apply memoization, bottom-up tabulation, and O(1) space state compression to the classic Fibonacci recurrence to transition from O(2^n) to O(n) time.',
        order: 7,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem('fibonacci-number', 'Fibonacci Number (LeetCode #509)'),
          youtube: [
            ytSearch(
              'fibonacci dynamic programming memoization tabulation',
              'Fibonacci DP - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Climbing Stairs',
        slug: 'climbing-stairs',
        description:
          'Count distinct ways to reach the top of n stairs using 1-step or 2-step transitions via 1D linear DP in O(n) time and O(1) space.',
        order: 8,
        difficulty: 'Easy',
        conceptType: 'problem',
        resources: {
          codechef: null,
          leetcode: lcProblem('climbing-stairs', 'Climbing Stairs (LeetCode #70)'),
          youtube: [
            ytSearch(
              'climbing stairs leetcode 70 dynamic programming',
              'Climbing Stairs (LeetCode 70) - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'House Robber',
        slug: 'house-robber',
        description:
          'Model non-adjacent pick/skip decisions on an array using dp[i] = max(dp[i - 1], nums[i] + dp[i - 2]) and optimize space to two rolling variables.',
        order: 9,
        difficulty: 'Medium',
        conceptType: 'problem',
        resources: {
          codechef: null,
          leetcode: lcProblem('house-robber', 'House Robber (LeetCode #198)'),
          youtube: [
            ytSearch(
              'house robber leetcode 198 dynamic programming',
              'House Robber (LeetCode 198) - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Unique Paths in Grid',
        slug: 'unique-paths-in-grid',
        description:
          'Count distinct right/down paths across an m x n grid using 2D grid DP and compress the transition into a 1D row array.',
        order: 10,
        difficulty: 'Medium',
        conceptType: 'problem',
        resources: {
          codechef: null,
          leetcode: lcProblem('unique-paths', 'Unique Paths (LeetCode #62)'),
          youtube: [
            ytSearch(
              'unique paths leetcode 62 grid dp',
              'Unique Paths in Grid (LeetCode 62) - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Minimum Path Sum',
        slug: 'minimum-path-sum',
        description:
          'Compute the minimum-cost path from top-left to bottom-right in a weighted grid via dp[r][c] = grid[r][c] + min(dp[r - 1][c], dp[r][c - 1]).',
        order: 11,
        difficulty: 'Medium',
        conceptType: 'problem',
        resources: {
          codechef: null,
          leetcode: lcProblem('minimum-path-sum', 'Minimum Path Sum (LeetCode #64)'),
          youtube: [
            ytSearch(
              'minimum path sum leetcode 64 dynamic programming',
              'Minimum Path Sum (LeetCode 64) - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Triangle',
        slug: 'triangle-dp',
        description:
          'Find the minimum path sum from apex to base in a triangular array using bottom-up DP from the last row upward in O(n) auxiliary space.',
        order: 12,
        difficulty: 'Medium',
        conceptType: 'problem',
        resources: {
          codechef: null,
          leetcode: lcProblem('triangle', 'Triangle (LeetCode #120)'),
          youtube: [
            ytSearch(
              'triangle leetcode 120 dynamic programming',
              'Triangle Path Sum DP (LeetCode 120) - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Subset Sum',
        slug: 'subset-sum',
        description:
          'Decide whether any subset of positive integers sums to a given target using include/exclude DP transitions and backward 1D boolean table compression.',
        order: 13,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'subset sum problem dynamic programming',
              'Subset Sum DP Problem - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Partition Equal Subset Sum',
        slug: 'partition-equal-subset-sum',
        description:
          'Reduce equal two-subset partitioning to checking whether a subset achieves half the total array sum via 0/1 knapsack boolean DP.',
        order: 14,
        difficulty: 'Medium',
        conceptType: 'problem',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'partition-equal-subset-sum',
            'Partition Equal Subset Sum (LeetCode #416)'
          ),
          youtube: [
            ytSearch(
              'partition equal subset sum leetcode 416 dp',
              'Partition Equal Subset Sum - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: '0/1 Knapsack',
        slug: 'zero-one-knapsack',
        description:
          'Maximize value within a weight limit when each item can be chosen at most once, iterating capacity backward in 1D space-optimized tabulation.',
        order: 15,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              '0 1 knapsack dynamic programming memoization tabulation',
              '0/1 Knapsack Problem - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Unbounded Knapsack',
        slug: 'unbounded-knapsack',
        description:
          'Maximize value when unlimited copies of each item are available, iterating capacity forward so items can be reused multiple times.',
        order: 16,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'unbounded knapsack dynamic programming',
              'Unbounded Knapsack Problem - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Coin Change',
        slug: 'coin-change',
        description:
          'Solve minimum-coin and number-of-ways coin-change problems using unbounded knapsack DP, distinguishing loop order for combinations versus permutations.',
        order: 17,
        difficulty: 'Medium',
        conceptType: 'problem',
        resources: {
          codechef: null,
          leetcode: lcProblem('coin-change', 'Coin Change (LeetCode #322)'),
          youtube: [
            ytSearch(
              'coin change leetcode 322 dynamic programming',
              'Coin Change (LeetCode 322) - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Rod Cutting',
        slug: 'rod-cutting',
        description:
          'Cut a rod of length n into integer pieces to maximize total revenue by modeling piece lengths as weights in an unbounded knapsack DP.',
        order: 18,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'rod cutting problem dynamic programming',
              'Rod Cutting Problem - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Longest Common Subsequence',
        slug: 'longest-common-subsequence',
        description:
          'Find the longest subsequence common to two strings in O(m * n) time using 2D DP matching/skipping transitions and reconstruct the sequence.',
        order: 19,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'longest-common-subsequence',
            'Longest Common Subsequence (LeetCode #1143)'
          ),
          youtube: [
            ytSearch(
              'longest common subsequence leetcode 1143 dp',
              'Longest Common Subsequence - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Longest Common Substring',
        slug: 'longest-common-substring',
        description:
          'Adapt the LCS 2D DP table so mismatches reset the suffix match length to 0, tracking the global maximum across contiguous character matches.',
        order: 20,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'longest common substring dynamic programming',
              'Longest Common Substring DP - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Edit Distance',
        slug: 'edit-distance',
        description:
          'Compute the minimum insert, delete, and replace operations to transform one string into another (Levenshtein distance) using 2D string DP.',
        order: 21,
        difficulty: 'Medium',
        conceptType: 'problem',
        resources: {
          codechef: null,
          leetcode: lcProblem('edit-distance', 'Edit Distance (LeetCode #72)'),
          youtube: [
            ytSearch(
              'edit distance leetcode 72 dynamic programming',
              'Edit Distance (LeetCode 72) - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Longest Increasing Subsequence',
        slug: 'longest-increasing-subsequence',
        description:
          'Compute the LIS length via O(n^2) DP transitions and optimize to O(n log n) using patience-sorting tails with binary search.',
        order: 22,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'longest-increasing-subsequence',
            'Longest Increasing Subsequence (LeetCode #300)'
          ),
          youtube: [
            ytSearch(
              'longest increasing subsequence dp binary search leetcode 300',
              'Longest Increasing Subsequence - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Palindromic Subsequence',
        slug: 'palindromic-subsequence',
        description:
          'Find the longest palindromic subsequence in a string either by computing LCS(s, reverse(s)) or via interval DP over endpoints [i, j].',
        order: 23,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'longest-palindromic-subsequence',
            'Longest Palindromic Subsequence (LeetCode #516)'
          ),
          youtube: [
            ytSearch(
              'longest palindromic subsequence leetcode 516 dp',
              'Longest Palindromic Subsequence - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Stock Trading DP (Multiple Variants)',
        slug: 'stock-trading-dp',
        description:
          'Unify single-transaction, unlimited-transaction, cooldown, transaction-fee, and at-most-k-transaction stock problems under a state-machine DP framework.',
        order: 24,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'best-time-to-buy-and-sell-stock',
            'Best Time to Buy and Sell Stock (LeetCode #121)'
          ),
          youtube: [
            ytSearch(
              'best time to buy and sell stock dp all variants',
              'Stock Trading DP Variants - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Matrix Chain Multiplication',
        slug: 'matrix-chain-multiplication',
        description:
          'Determine the parenthesization order of a chain of matrices that minimizes scalar multiplications using O(n^3) partition-based interval DP.',
        order: 25,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'matrix chain multiplication dynamic programming',
              'Matrix Chain Multiplication DP - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Interval DP',
        slug: 'interval-dp',
        description:
          'Solve range-partition and endpoint-merging problems by computing dp[i][j] in increasing order of interval length and trying every split point k.',
        order: 26,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem('burst-balloons', 'Burst Balloons (LeetCode #312)'),
          youtube: [
            ytSearch(
              'interval dp burst balloons partition dynamic programming',
              'Interval Dynamic Programming - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Tree DP Basics',
        slug: 'tree-dp-basics',
        description:
          'Aggregate subtree DP states bottom-up during post-order DFS on trees to solve subtree optimization, diameter, and parent-child constraint problems.',
        order: 27,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem('house-robber-iii', 'House Robber III (LeetCode #337)'),
          youtube: [
            ytSearch(
              'dynamic programming on trees tree dp basics',
              'Tree DP Basics - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Digit DP Intro',
        slug: 'digit-dp-intro',
        description:
          'Count integers within a range [L, R] satisfying digit-level constraints by tracking position, tight upper-bound flag, leading-zero state, and property sum.',
        order: 28,
        difficulty: 'Hard',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'digit dp introduction dynamic programming',
              'Digit DP Introduction - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Bitmask DP Intro',
        slug: 'bitmask-dp-intro',
        description:
          'Encode subsets of up to ~20 elements as integer bitmasks to solve assignment, subset transition, and Traveling Salesperson DP problems.',
        order: 29,
        difficulty: 'Hard',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'bitmask dp dynamic programming traveling salesman introduction',
              'Bitmask DP Introduction - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
    ],
  },

  // =========================================================================
  // MODULE 22: TRIES
  // =========================================================================
  {
    title: 'Tries',
    slug: 'tries',
    description:
      'Learn prefix tree architecture, character-by-character insertion, search, prefix matching, deletion, wildcard dictionaries, autocomplete, and bitwise binary tries.',
    order: 22,
    difficulty: 'Hard',
    iconName: 'GitFork',
    topics: [
      {
        title: 'Trie Introduction',
        slug: 'trie-introduction',
        description:
          'Understand how a Trie (prefix tree) organizes strings by shared prefixes to support O(L) dictionary lookups independent of total word count.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'trie prefix tree data structure introduction',
              'Trie (Prefix Tree) Introduction - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Trie Node Structure',
        slug: 'trie-node-structure',
        description:
          'Design a TrieNode with fixed-size child arrays or hash maps, end-of-word markers, and optional prefix/word frequency counters.',
        order: 2,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'trie node structure implementation array vs hashmap',
              'Trie Node Structure Design - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Trie Insertion',
        slug: 'trie-insertion',
        description:
          'Insert words into a prefix tree in O(L) time by allocating missing character child nodes along the path and marking the terminal node.',
        order: 3,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'implement-trie-prefix-tree',
            'Implement Trie (Prefix Tree) (LeetCode #208)'
          ),
          youtube: [
            ytSearch(
              'implement trie prefix tree leetcode 208 insert',
              'Trie Insertion Implementation - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Trie Search',
        slug: 'trie-search',
        description:
          'Verify exact word membership in O(L) time by following character edges and checking the end-of-word flag on the final node.',
        order: 4,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'implement-trie-prefix-tree',
            'Implement Trie (Prefix Tree) (LeetCode #208)'
          ),
          youtube: [
            ytSearch(
              'trie search word exact match leetcode 208',
              'Trie Search Operation - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Prefix Matching',
        slug: 'prefix-matching',
        description:
          'Check whether any stored word begins with a given prefix (`startsWith`) and count words sharing a prefix in O(L) time.',
        order: 5,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'implement-trie-prefix-tree',
            'Implement Trie (Prefix Tree) (LeetCode #208)'
          ),
          youtube: [
            ytSearch(
              'trie startsWith prefix matching algorithm',
              'Trie Prefix Matching - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Trie Deletion',
        slug: 'trie-deletion',
        description:
          'Remove words safely from a Trie using recursive backtracking or prefix reference counts so unused nodes are pruned without breaking shared prefixes.',
        order: 6,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'delete word from trie data structure',
              'Trie Deletion Algorithm - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Autocomplete with Trie',
        slug: 'autocomplete-with-trie',
        description:
          'Build real-time search suggestions by locating the prefix node and collecting top lexicographical completions via DFS or precomputed node suggestions.',
        order: 7,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'search-suggestions-system',
            'Search Suggestions System (LeetCode #1268)'
          ),
          youtube: [
            ytSearch(
              'autocomplete system using trie search suggestions',
              'Autocomplete with Trie - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Word Dictionary',
        slug: 'word-dictionary',
        description:
          'Support wildcard dot (`.`) queries in a Trie by combining prefix traversal with DFS backtracking across all existing child branches.',
        order: 8,
        difficulty: 'Medium',
        conceptType: 'problem',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'design-add-and-search-words-data-structure',
            'Design Add and Search Words Data Structure (LeetCode #211)'
          ),
          youtube: [
            ytSearch(
              'design add and search words data structure leetcode 211 trie',
              'Word Dictionary with Wildcards (LeetCode 211) - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Longest Common Prefix Using Trie',
        slug: 'longest-common-prefix-using-trie',
        description:
          'Insert all strings into a Trie and walk down from the root while a node has exactly one child and is not marked as the end of a word.',
        order: 9,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'longest-common-prefix',
            'Longest Common Prefix (LeetCode #14)'
          ),
          youtube: [
            ytSearch(
              'longest common prefix using trie',
              'Longest Common Prefix Using Trie - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Maximum XOR Using Binary Trie',
        slug: 'maximum-xor-using-binary-trie',
        description:
          'Store 32-bit integers from MSB to LSB in a 0/1 binary Trie and greedily pick opposite bits at each level to maximize XOR in O(n * 32) time.',
        order: 10,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'maximum-xor-of-two-numbers-in-an-array',
            'Maximum XOR of Two Numbers in an Array (LeetCode #421)'
          ),
          youtube: [
            ytSearch(
              'maximum xor of two numbers binary trie leetcode 421',
              'Maximum XOR Using Binary Trie - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
    ],
  },

  // =========================================================================
  // MODULE 23: ADVANCED STRING ALGORITHMS
  // =========================================================================
  {
    title: 'Advanced String Algorithms',
    slug: 'advanced-string-algorithms',
    description:
      'Master linear and sub-quadratic string matching and palindrome techniques: KMP, Z-algorithm, Rabin-Karp rolling hashing, Manacher’s algorithm, and suffix arrays.',
    order: 23,
    difficulty: 'Hard',
    iconName: 'SearchCode',
    topics: [
      {
        title: 'Naive Pattern Matching',
        slug: 'naive-pattern-matching',
        description:
          'Understand sliding-window brute-force substring matching in O(n * m) worst-case time and analyze why backtracking on mismatches motivates linear algorithms.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'naive pattern matching string searching algorithm',
              'Naive Pattern Matching - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'KMP Algorithm',
        slug: 'kmp-algorithm',
        description:
          'Find all pattern occurrences in O(n + m) worst-case time without moving the text pointer backward by jumping to precomputed LPS fallback indices.',
        order: 2,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'find-the-index-of-the-first-occurrence-in-a-string',
            'Find the Index of the First Occurrence in a String (LeetCode #28)'
          ),
          youtube: [
            ytSearch(
              'kmp knuth morris pratt string matching algorithm',
              'KMP String Matching Algorithm - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'LPS (Failure Function) Array',
        slug: 'lps-failure-function-array',
        description:
          'Construct the Longest Proper Prefix which is also a Suffix (pi / failure) array in O(m) time using two-pointer prefix fallback transitions.',
        order: 3,
        difficulty: 'Medium',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'lps array prefix function pi array kmp construction',
              'LPS (Failure Function) Array - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Z Algorithm',
        slug: 'z-algorithm',
        description:
          'Compute the Z-array (length of the longest substring starting at index i that matches a prefix of the string) in O(n + m) time using a sliding Z-box [L, R].',
        order: 4,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'find-the-index-of-the-first-occurrence-in-a-string',
            'Find the Index of the First Occurrence in a String (LeetCode #28)'
          ),
          youtube: [
            ytSearch(
              'z algorithm pattern matching string z box',
              'Z Algorithm for Pattern Matching - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Rabin-Karp Algorithm',
        slug: 'rabin-karp-algorithm',
        description:
          'Match patterns in O(n + m) expected time by comparing rolling polynomial hashes of fixed-length windows and verifying exact equality on hash hits.',
        order: 5,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'repeated-string-match',
            'Repeated String Match (LeetCode #686)'
          ),
          youtube: [
            ytSearch(
              'rabin karp algorithm rolling hash pattern matching',
              'Rabin-Karp String Matching - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Rolling Hash',
        slug: 'rolling-hash',
        description:
          'Compute O(1) substring hash queries and sliding-window updates using polynomial modular arithmetic, double hashing to avoid collisions, and modular inverses.',
        order: 6,
        difficulty: 'Medium',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'polynomial rolling hash string hashing double hashing',
              'Rolling Hash & Double Hashing - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: "Manacher's Algorithm",
        slug: 'manachers-algorithm',
        description:
          'Compute the longest palindromic substring centered at every position in O(n) linear time by inserting sentinel separators and mirroring palindrome radii.',
        order: 7,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'longest-palindromic-substring',
            'Longest Palindromic Substring (LeetCode #5)'
          ),
          youtube: [
            ytSearch(
              'manacher algorithm longest palindromic substring linear time',
              "Manacher's Algorithm - YouTube Search"
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Suffix Array Basics',
        slug: 'suffix-array-basics',
        description:
          'Understand sorted suffix index arrays, O(n log n) prefix-doubling construction, the LCP array (Kasai’s algorithm), and binary-search substring queries.',
        order: 8,
        difficulty: 'Hard',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'suffix array lcp array basics algorithm',
              'Suffix Array & LCP Array Basics - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
    ],
  },

  // =========================================================================
  // MODULE 24: ADVANCED DATA STRUCTURES
  // =========================================================================
  {
    title: 'Advanced Data Structures',
    slug: 'advanced-data-structures',
    description:
      'Master competitive programming and high-performance range-query structures: Segment Trees, Lazy Propagation, Fenwick Trees, Sparse Tables, Mo’s Algorithm, and Binary Lifting.',
    order: 24,
    difficulty: 'Hard',
    iconName: 'Cpu',
    topics: [
      {
        title: 'Segment Tree Introduction',
        slug: 'segment-tree-introduction',
        description:
          'Understand the binary tree structure over array intervals that stores associative aggregates in 4n space for O(log n) range queries and updates.',
        order: 1,
        difficulty: 'Hard',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'segment tree data structure introduction build query',
              'Segment Tree Introduction - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Range Query with Segment Tree',
        slug: 'range-query-with-segment-tree',
        description:
          'Answer range sum, min, max, and GCD queries over [L, R] in O(log n) time by decomposing the interval into disjoint node ranges.',
        order: 2,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'range-sum-query-mutable',
            'Range Sum Query - Mutable (LeetCode #307)'
          ),
          youtube: [
            ytSearch(
              'segment tree range query leetcode 307',
              'Range Query with Segment Tree - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Point Update',
        slug: 'segment-tree-point-update',
        description:
          'Update a single array element in a Segment Tree and recompute affected ancestor aggregates along a root-to-leaf path in O(log n) time.',
        order: 3,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'range-sum-query-mutable',
            'Range Sum Query - Mutable (LeetCode #307)'
          ),
          youtube: [
            ytSearch(
              'segment tree point update algorithm',
              'Segment Tree Point Update - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Lazy Propagation',
        slug: 'lazy-propagation',
        description:
          'Defer range-update work in a Segment Tree using pending lazy tags pushed down to children only when needed, keeping range updates in O(log n) time.',
        order: 4,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'segment tree lazy propagation range update',
              'Segment Tree Lazy Propagation - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Fenwick Tree (BIT)',
        slug: 'fenwick-tree-bit',
        description:
          'Use bit manipulation (`i & -i`) in a Binary Indexed Tree to compute prefix sums and point updates in O(log n) time with compact O(n) memory.',
        order: 5,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'range-sum-query-mutable',
            'Range Sum Query - Mutable (LeetCode #307)'
          ),
          youtube: [
            ytSearch(
              'fenwick tree binary indexed tree bit data structure',
              'Fenwick Tree (BIT) - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Sparse Table',
        slug: 'sparse-table',
        description:
          'Precompute O(n log n) power-of-two blocks over static arrays to answer idempotent range queries (RMQ, GCD) in O(1) worst-case time.',
        order: 6,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'sparse table range minimum query rmq O(1)',
              'Sparse Table (RMQ) - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Coordinate Compression',
        slug: 'coordinate-compression',
        description:
          'Map large or negative value domains into dense 0..k-1 ranks via sorting and deduplication so Fenwick and Segment Trees can index values directly.',
        order: 7,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'count-of-smaller-numbers-after-self',
            'Count of Smaller Numbers After Self (LeetCode #315)'
          ),
          youtube: [
            ytSearch(
              'coordinate compression fenwick tree segment tree leetcode 315',
              'Coordinate Compression Technique - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Ordered Set/Map',
        slug: 'ordered-set-map',
        description:
          'Explore order-statistic balanced BSTs (such as C++ PBDS `tree` with `order_of_key` and `find_by_order`) for O(log n) rank and k-th element queries.',
        order: 8,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'count-of-smaller-numbers-after-self',
            'Count of Smaller Numbers After Self (LeetCode #315)'
          ),
          youtube: [
            ytSearch(
              'ordered set pbds policy based data structure order_of_key',
              'Ordered Set / Order-Statistic Tree - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Square Root Decomposition',
        slug: 'square-root-decomposition',
        description:
          'Partition an array of size n into blocks of size sqrt(n) to handle point updates and range queries cleanly in O(sqrt(n)) time per operation.',
        order: 9,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'square root decomposition sqrt decomposition range queries',
              'Square Root Decomposition - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: "Mo's Algorithm",
        slug: 'mos-algorithm',
        description:
          'Sort offline range queries by (L / B, R) block order so two-pointer window expansion and contraction answer Q queries in O((N + Q) * sqrt(N)) time.',
        order: 10,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'mos algorithm offline range queries sqrt decomposition',
              "Mo's Algorithm - YouTube Search"
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Binary Lifting',
        slug: 'binary-lifting',
        description:
          'Precompute 2^j-th ancestors for every tree node in O(n log n) time to jump up any k steps in O(log n) time using binary decomposition.',
        order: 11,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: lcProblem(
            'kth-ancestor-of-a-tree-node',
            'Kth Ancestor of a Tree Node (LeetCode #1483)'
          ),
          youtube: [
            ytSearch(
              'binary lifting kth ancestor tree algorithm',
              'Binary Lifting in Trees - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'LCA with Binary Lifting',
        slug: 'lca-with-binary-lifting',
        description:
          'Equalize node depths and lift both pointers together across decreasing powers of two to find the Lowest Common Ancestor in O(log n) per query.',
        order: 12,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'lowest common ancestor lca binary lifting tree',
              'LCA with Binary Lifting - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Advanced Range Queries',
        slug: 'advanced-range-queries',
        description:
          'Survey specialized range-query paradigms including Merge Sort Trees, Persistent Segment Trees, Euler Tour flattening on trees, and 2D BIT.',
        order: 13,
        difficulty: 'Hard',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'merge sort tree persistent segment tree euler tour range queries',
              'Advanced Range Query Structures - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
      {
        title: 'Competitive Programming Patterns',
        slug: 'competitive-programming-patterns',
        description:
          'Synthesize constraint-driven structure selection, offline query processing, small-to-large merging, meet-in-the-middle, and template patterns for hard contests.',
        order: 14,
        difficulty: 'Hard',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            ytSearch(
              'competitive programming patterns advanced algorithms',
              'Competitive Programming Patterns - YouTube Search'
            ),
          ],
        },
        hasNotes: false,
      },
    ],
  },
];

export default modules19to24;
