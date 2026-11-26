// Rich original learning notes for Module 21: Dynamic Programming (29 concepts)

const module21DpNotes = [
  {
    topicSlug: 'overlapping-subproblems',
    title: 'Overlapping Subproblems',
    definition:
      'A problem has **overlapping subproblems** if its recursive decomposition solves the exact same subproblem states repeatedly instead of generating brand-new subproblems each time.',
    explanation:
      'In naive recursive Fibonacci `fib(n) = fib(n-1) + fib(n-2)`, `fib(3)` is recomputed twice in `fib(5)` and exponentially many times for larger `n`, causing `O(2^n)` time. Storing each subproblem’s answer once in a table reduces total distinct states to `O(n)`—turning exponential recursion into polynomial DP.',
    realWorldAnalogy:
      'Looking up a complex multiplication you already wrote on a sticky note instead of multiplying it from scratch every time it reappears.',
    algorithm:
      '1. Draw the recursion tree for a small input (`n = 5`).\n2. If identical state tuples `(i, j)` or `(idx, rem)` appear multiple times, the problem has overlapping subproblems.\n3. Cache answers by state key.',
    pseudocode: `// Naive fib(5) calls fib(3) twice, fib(2) three times!
// With cache: each state 0..n is computed ONCE.`,
    dryRunExample:
      '`fib(5)` -> `fib(4) + fib(3)`; `fib(4)` -> `fib(3) + fib(2)` -> `fib(3)` is already duplicated!',
    timeComplexity: 'Reduces `O(2^N)` exponential trees to `O(#states * transition)`',
    spaceComplexity: '`O(#states)` for DP cache',
    commonMistakes: [
      'Confusing Divide & Conquer (Merge Sort: **disjoint** subproblems) with Dynamic Programming (**overlapping** subproblems).',
    ],
    interviewTips: [
      'Always state both DP prerequisites: **Overlapping Subproblems** + **Optimal Substructure**.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'optimal-substructure',
    title: 'Optimal Substructure',
    definition:
      'A problem has **optimal substructure** if an optimal solution to the overall problem can be constructed from optimal solutions to its subproblems.',
    explanation:
      'For example, the shortest path `S -> ... -> u -> T` must contain the shortest path from `S` to `u` (otherwise replacing `S -> u` with a shorter one improves `S -> T`). By contrast, **Longest Simple Path** lacks optimal substructure because combining two longest simple subpaths might repeat a vertex.',
    realWorldAnalogy:
      'The fastest route from New York to Los Angeles through Chicago must use the fastest route from New York to Chicago.',
    algorithm:
      'Verify that the recurrence depends only on the optimal value of smaller subproblems (not on the specific path/choices that created them).',
    pseudocode: `OPT(state) = best_over_choices( cost(choice) + OPT(nextState) )`,
    dryRunExample:
      'In 0/1 Knapsack, `dp[i][w] = max(dp[i-1][w], val[i] + dp[i-1][w - wt[i]])` uses only optimal subproblem values.',
    timeComplexity: 'Enables valid DP recurrence',
    spaceComplexity: 'Depends on state dimension',
    commonMistakes: [
      'Assuming a problem has optimal substructure when the objective depends on history (e.g., simple-path constraint without bitmask).',
    ],
    interviewTips: [
      'If a greedy/DP recurrence seems to need "which items were picked earlier", you must either add that info to the DP state or rethink the state.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'recursion-to-dp',
    title: 'From Recursion to Dynamic Programming (4-Step Framework)',
    definition:
      'Converting a recursive solution into DP follows a systematic 4-step pipeline: **(1) Express state -> (2) Write recurrence -> (3) Memoize (Top-Down) -> (4) Tabulate & Space-Optimize (Bottom-Up)**.',
    explanation:
      'Start by defining what `f(state)` returns in plain English. Ensure every changing parameter in the recursion is part of `state`. Add a memo table (`O(#states)`), then flip loop order to build the table iteratively from base cases upward, and finally compress dimensions if each row only depends on the previous row.',
    realWorldAnalogy:
      'Drafting a blueprint (recursion), adding a cache for repeated calculations (memoization), and then building a factory assembly line (tabulation).',
    algorithm:
      '1. Define `f(i, ...)` meaning and base cases.\n2. Write recurrence over all choices.\n3. Add `memo` check before computing.\n4. Convert to `dp[]` loops from base case to target; drop unneeded dimensions.',
    pseudocode: `// Step 1: f(i) = min cost to reach i
// Step 2: f(i) = cost[i] + min(f(i-1), f(i-2))
// Step 3: memo[i]
// Step 4: prev2, prev1 -> curr (O(1) space)`,
    dryRunExample:
      'Climbing Stairs: Recursion `O(2^n)` -> Memo `O(n) time, O(n) space` -> Tabulation `O(n) time, O(n) space` -> Two vars `O(n) time, O(1) space`.',
    timeComplexity: '`O(#states * transitions_per_state)`',
    spaceComplexity: '`O(#states)` down to `O(1)`/`O(W)` after optimization',
    commonMistakes: [
      'Passing global/mutated state that isn’t captured in the memoization key.',
    ],
    interviewTips: [
      'Walking through all 4 steps out loud in an interview shows crystal-clear problem-solving structure.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'memoization-top-down',
    title: 'Memoization (Top-Down DP)',
    definition:
      '**Memoization** is top-down DP: keep the natural recursive structure starting from the target state, and cache each computed result in a table/map initialized to a sentinel (e.g. `-1`).',
    explanation:
      'Top-down memoization only computes states that are actually **reachable** from the target, and mirrors the mathematical recurrence directly. Watch out for recursion stack overflow on very deep chains (`N > 10^4`) and ensure your sentinel (like `-1`) cannot be a valid DP answer.',
    realWorldAnalogy:
      'Asking a manager a question; they check their notebook first—if it’s there, they answer immediately; otherwise they ask subordinates, write the answer down, and reply.',
    algorithm:
      '1. Initialize `memo` with sentinel `-1`.\n2. At start of `solve(state)`: if `baseCase`, return base value; if `memo[state] != -1`, return `memo[state]`.\n3. Compute `ans`, store `memo[state] = ans`, and return `ans`.',
    pseudocode: `solve(state):
    if isBase(state): return baseVal
    if memo[state] != -1: return memo[state]
    memo[state] <- computeFromSubproblems()
    return memo[state]`,
    dryRunExample:
      '`fib(5)` with `memo`: computes `fib(0..5)` once each (`6` calls instead of `15`).',
    timeComplexity: '`O(#reachable_states * transition)`',
    spaceComplexity: '`O(#states)` table + `O(max_depth)` call stack',
    commonMistakes: [
      'Using `-1` as the "uncomputed" sentinel when valid DP answers can be negative (use `INT_MIN` / `None` / `boolean visited[][]`).',
    ],
    interviewTips: [
      'Top-down is often faster to code bug-free for complex state transitions like Digit DP or Interval DP.',
    ],
    implementations: {
      c: `int fibMemo(int n, int dp[]) {\n    if (n <= 1) return n;\n    if (dp[n] != -1) return dp[n];\n    return dp[n] = fibMemo(n - 1, dp) + fibMemo(n - 2, dp);\n}`,
      cpp: `#include <vector>\nint fibMemo(int n, std::vector<int>& dp) {\n    if (n <= 1) return n;\n    if (dp[n] != -1) return dp[n];\n    return dp[n] = fibMemo(n - 1, dp) + fibMemo(n - 2, dp);\n}`,
      java: `import java.util.Arrays;\npublic class MemoizationDemo {\n    public static int fib(int n) {\n        int[] dp = new int[n + 1]; Arrays.fill(dp, -1);\n        return go(n, dp);\n    }\n    private static int go(int n, int[] dp) {\n        if (n <= 1) return n;\n        if (dp[n] != -1) return dp[n];\n        return dp[n] = go(n - 1, dp) + go(n - 2, dp);\n    }\n}`,
      python: `from functools import lru_cache\n@lru_cache(maxsize=None)\ndef fib_memo(n: int) -> int:\n    if n <= 1: return n\n    return fib_memo(n - 1) + fib_memo(n - 2)`,
    },
  },
  {
    topicSlug: 'tabulation-bottom-up',
    title: 'Tabulation (Bottom-Up DP)',
    definition:
      '**Tabulation** is bottom-up DP: allocate a DP table, fill base cases first, and iterate through states in topological dependency order until the target state is computed.',
    explanation:
      'Tabulation eliminates recursion call-stack overhead (zero stack overflow risk, better CPU cache locality) and makes space optimization straightforward because you can see exactly which prior rows/indices are read.',
    realWorldAnalogy:
      'Building a brick wall from the foundation up: row 1 is laid first, then row 2 rests on row 1, up to the roof.',
    algorithm:
      '1. Allocate `dp` of size `N + 1`.\n2. Set base cases (`dp[0]`, `dp[1]`).\n3. Loop `i` in topological order (`2 .. N`), filling `dp[i]` from already-computed smaller states.\n4. Return `dp[N]`.',
    pseudocode: `dp[0] <- base0, dp[1] <- base1
for i from 2 to N:
    dp[i] <- transition(dp[i-1], dp[i-2])
return dp[N]`,
    dryRunExample:
      'Fibonacci `n = 5`: `dp = [0, 1, 1, 2, 3, 5]`.',
    timeComplexity: '`O(#states * transition)` (often faster constant factor than memoization)',
    spaceComplexity: '`O(#states)` (no recursion stack)',
    commonMistakes: [
      'Iterating loops in the wrong direction (e.g., in 0/1 Knapsack 1D space optimization, looping `w` forward instead of backward reuses the same item multiple times!).',
    ],
    interviewTips: [
      'Notice the base-case-to-target loop order is literally topological order on the DP state DAG.',
    ],
    implementations: {
      c: `int fibTab(int n) {\n    if (n <= 1) return n;\n    int dp[1000]; dp[0] = 0; dp[1] = 1;\n    for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];\n    return dp[n];\n}`,
      cpp: `#include <vector>\nint fibTab(int n) {\n    if (n <= 1) return n;\n    std::vector<int> dp(n + 1);\n    dp[0] = 0; dp[1] = 1;\n    for (int i = 2; i <= n; ++i) dp[i] = dp[i - 1] + dp[i - 2];\n    return dp[n];\n}`,
      java: `public class TabulationDemo {\n    public static int fib(int n) {\n        if (n <= 1) return n;\n        int[] dp = new int[n + 1]; dp[1] = 1;\n        for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];\n        return dp[n];\n    }\n}`,
      python: `def fib_tab(n: int) -> int:\n    if n <= 1: return n\n    dp = [0] * (n + 1); dp[1] = 1\n    for i in range(2, n + 1): dp[i] = dp[i - 1] + dp[i - 2]\n    return dp[n]`,
    },
  },
  {
    topicSlug: 'dp-space-optimization',
    title: 'Space Optimization in DP',
    definition:
      '**DP Space Optimization** compresses a `k`-dimensional DP table down to `(k - 1)` dimensions (or `O(1)` variables) whenever each state only depends on a bounded window of previous states.',
    explanation:
      '- **1D -> `O(1)`:** If `dp[i]` only reads `dp[i-1]` and `dp[i-2]` (Fibonacci, Climbing Stairs, House Robber), keep just `prev2` and `prev1`.\n- **2D -> 1D:** If `dp[i][j]` only reads row `i - 1` (Grid paths, LCS, Knapsack), keep a 1D `dp[W + 1]` array. In **0/1 Knapsack**, iterate `w` **backward** (`W` down to `wt[i]`) so `dp[w - wt[i]]` still holds row `i - 1`; in **Unbounded Knapsack**, iterate `w` **forward**!',
    realWorldAnalogy:
      'Only keeping yesterday’s and today’s ledger sheets on your desk instead of archiving every day of the year.',
    algorithm:
      '1. Inspect dependencies of `dp[i][...]`.\n2. Replace `dp[i-1]` with `prev` and `dp[i]` with `curr`, or reuse a single 1D array with careful loop direction.',
    pseudocode: `prev2 <- 0, prev1 <- 1
for i from 2 to n:
    curr <- prev1 + prev2
    prev2 <- prev1; prev1 <- curr
return prev1`,
    dryRunExample:
      '2D `dp[1000][1000]` (`4 MB`) compresses to 1D `dp[1000]` (`4 KB`).',
    timeComplexity: 'Same as tabulated DP',
    spaceComplexity: 'Reduced by a factor of `N` (e.g. `O(N) -> O(1)` or `O(N*W) -> O(W)`)',
    commonMistakes: [
      'Looping `w` forward in 1D 0/1 Knapsack (accidentally turns it into Unbounded Knapsack).',
    ],
    interviewTips: [
      'Always optimize space as the final step after your 2D/1D tabulation works cleanly.',
    ],
    implementations: {
      c: `int fibOpt(int n) {\n    if (n <= 1) return n;\n    int a = 0, b = 1;\n    for (int i = 2; i <= n; i++) { int c = a + b; a = b; b = c; }\n    return b;\n}`,
      cpp: `int fibOpt(int n) {\n    if (n <= 1) return n;\n    int a = 0, b = 1;\n    for (int i = 2; i <= n; ++i) { int c = a + b; a = b; b = c; }\n    return b;\n}`,
      java: `public class DpSpaceOpt {\n    public static int fib(int n) {\n        if (n <= 1) return n;\n        int a = 0, b = 1;\n        for (int i = 2; i <= n; i++) { int c = a + b; a = b; b = c; }\n        return b;\n    }\n}`,
      python: `def fib_opt(n: int) -> int:\n    if n <= 1: return n\n    a, b = 0, 1\n    for _ in range(2, n + 1): a, b = b, a + b\n    return b`,
    },
  },
  {
    topicSlug: 'fibonacci-dp',
    title: 'Fibonacci Numbers using DP',
    definition:
      'Compute the `n`-th Fibonacci number `F(n) = F(n - 1) + F(n - 2)` with `F(0) = 0, F(1) = 1` in `O(n)` time and `O(1)` space.',
    explanation:
      'The Fibonacci sequence is the hello-world of DP: naive recursion takes `O(2^n)`, DP reduces it to `O(n)` time and `O(1)` space (and Matrix Exponentiation even achieves `O(log n)` time!).',
    realWorldAnalogy:
      'Modeling rabbit population growth or stair-climbing ways where each step depends on the previous two.',
    algorithm:
      '1. If `n <= 1`, return `n`.\n2. Track `prev2 = 0, prev1 = 1`.\n3. For `i = 2 .. n`: `curr = prev1 + prev2`, shift `prev2 = prev1, prev1 = curr`.\n4. Return `prev1`.',
    pseudocode: `if n <= 1: return n
a <- 0, b <- 1
for i from 2 to n: a, b <- b, a + b
return b`,
    dryRunExample:
      '`n = 6`: `0, 1, 1, 2, 3, 5, 8` -> `F(6) = 8`.',
    timeComplexity: '`O(n)`',
    spaceComplexity: '`O(1)`',
    commonMistakes: [
      'Integer overflow in 32-bit `int` beyond `F(46)`.',
    ],
    interviewTips: [
      'Mention Matrix Exponentiation `[[1,1],[1,0]]^n` for `O(log n)` time when `n <= 10^18`.',
    ],
    implementations: {
      c: `long long fib(int n) { if (n <= 1) return n; long long a = 0, b = 1; for (int i = 2; i <= n; i++) { long long c = a + b; a = b; b = c; } return b; }`,
      cpp: `long long fib(int n) { if (n <= 1) return n; long long a = 0, b = 1; for (int i = 2; i <= n; ++i) { long long c = a + b; a = b; b = c; } return b; }`,
      java: `public class FibDP { public static long fib(int n) { if (n <= 1) return n; long a = 0, b = 1; for (int i = 2; i <= n; i++) { long c = a + b; a = b; b = c; } return b; } }`,
      python: `def fib(n: int) -> int:\n    if n <= 1: return n\n    a, b = 0, 1\n    for _ in range(2, n + 1): a, b = b, a + b\n    return b`,
    },
  },
  {
    topicSlug: 'climbing-stairs',
    title: 'Climbing Stairs',
    definition:
      'Given `n` steps to reach the top, where each move climbs `1` or `2` steps, count the total distinct ways to reach step `n`.',
    explanation:
      'To arrive at step `i`, your last move must have come from step `i - 1` (1-step jump) or step `i - 2` (2-step jump). Thus `ways[i] = ways[i - 1] + ways[i - 2]` with `ways[0] = 1, ways[1] = 1`.',
    realWorldAnalogy:
      'Counting how many ways you can walk up a staircase taking single or double strides.',
    algorithm:
      '1. If `n <= 1`, return `1`.\n2. `a = 1, b = 1`.\n3. Loop `i = 2 .. n`: `c = a + b; a = b; b = c`.\n4. Return `b`.',
    pseudocode: `a <- 1, b <- 1
for i from 2 to n: a, b <- b, a + b
return b`,
    dryRunExample:
      '`n = 4`: `ways = [1, 1, 2, 3, 5]` (`1+1+1+1, 1+1+2, 1+2+1, 2+1+1, 2+2`).',
    timeComplexity: '`O(n)`',
    spaceComplexity: '`O(1)`',
    commonMistakes: [
      'Returning `0` for `n = 0` instead of `1` (1 way: do nothing).',
    ],
    interviewTips: [
      'Generalizes to `1..k` steps: `dp[i] = sum(dp[i-1..i-k])` (optimizable to `O(n)` using a sliding window sum!).',
    ],
    implementations: {
      c: `int climbStairs(int n) { int a = 1, b = 1; for (int i = 2; i <= n; i++) { int c = a + b; a = b; b = c; } return b; }`,
      cpp: `int climbStairs(int n) { int a = 1, b = 1; for (int i = 2; i <= n; ++i) { int c = a + b; a = b; b = c; } return b; }`,
      java: `public class ClimbingStairs { public static int climbStairs(int n) { int a = 1, b = 1; for (int i = 2; i <= n; i++) { int c = a + b; a = b; b = c; } return b; } }`,
      python: `def climb_stairs(n: int) -> int:\n    a, b = 1, 1\n    for _ in range(2, n + 1): a, b = b, a + b\n    return b`,
    },
  },
  {
    topicSlug: 'house-robber',
    title: 'House Robber (Max Non-Adjacent Sum)',
    definition:
      'Given an array `nums` of non-negative house values, find the maximum sum you can collect without picking any two **adjacent** elements.',
    explanation:
      'At house `i`, you either **rob** it (`nums[i] + dp[i - 2]`) or **skip** it (`dp[i - 1]`), giving `dp[i] = max(dp[i - 1], nums[i] + dp[i - 2])`. With two rolling variables `prev2` and `prev1`, this runs in `O(1)` space.',
    realWorldAnalogy:
      'Picking non-adjacent shifts or billboard locations where neighboring slots trigger an alarm.',
    algorithm:
      '1. `prev2 = 0, prev1 = 0`.\n2. For each `x` in `nums`:\n   - `cur = max(prev1, prev2 + x)`\n   - `prev2 = prev1; prev1 = cur`.\n3. Return `prev1`.',
    pseudocode: `prev2 <- 0, prev1 <- 0
for x in nums:
    cur <- max(prev1, prev2 + x)
    prev2 <- prev1; prev1 <- cur
return prev1`,
    dryRunExample:
      '`nums = [2, 7, 9, 3, 1]`: `2 -> 7 -> 11 (2+9) -> 11 -> 12 (2+9+1)`.',
    timeComplexity: '`O(n)`',
    spaceComplexity: '`O(1)`',
    commonMistakes: [
      'Taking `max(evenSum, oddSum)` (fails on `[2, 1, 1, 2]` where optimal is `2 + 2 = 4`!).',
    ],
    interviewTips: [
      'For **House Robber II** (circular array), return `max(rob(nums[0..n-2]), rob(nums[1..n-1]))`.',
    ],
    implementations: {
      c: `int rob(const int nums[], int n) {\n    int p2 = 0, p1 = 0;\n    for (int i = 0; i < n; i++) { int cur = p1 > p2 + nums[i] ? p1 : p2 + nums[i]; p2 = p1; p1 = cur; }\n    return p1;\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nint rob(const std::vector<int>& nums) {\n    int p2 = 0, p1 = 0;\n    for (int x : nums) { int cur = std::max(p1, p2 + x); p2 = p1; p1 = cur; }\n    return p1;\n}`,
      java: `public class HouseRobber {\n    public static int rob(int[] nums) {\n        int p2 = 0, p1 = 0;\n        for (int x : nums) { int cur = Math.max(p1, p2 + x); p2 = p1; p1 = cur; }\n        return p1;\n    }\n}`,
      python: `def rob(nums: list[int]) -> int:\n    p2 = p1 = 0\n    for x in nums: p2, p1 = p1, max(p1, p2 + x)\n    return p1`,
    },
  },
  {
    topicSlug: 'unique-paths-in-grid',
    title: 'Unique Paths in a Grid',
    definition:
      'Count the number of distinct paths from `(0, 0)` to `(m - 1, n - 1)` in an `m x n` grid moving only **Right** or **Down**.',
    explanation:
      'Every cell `(r, c)` can only be entered from `(r - 1, c)` (above) or `(r, c - 1)` (left), so `dp[r][c] = dp[r - 1][c] + dp[r][c - 1]`. Using a 1D row `dp[0..n-1]` initialized to `1`, each update is simply `dp[c] += dp[c - 1]`!',
    realWorldAnalogy:
      'Counting Manhattan street-grid routes from the northwest corner to the southeast corner moving only south or east.',
    algorithm:
      '1. Initialize `dp[0..n-1] = 1`.\n2. Repeat `m - 1` times:\n   - For `c = 1 .. n - 1`: `dp[c] += dp[c - 1]`.\n3. Return `dp[n - 1]`.',
    pseudocode: `dp[0..n-1] <- 1
for r from 1 to m - 1:
    for c from 1 to n - 1:
        dp[c] <- dp[c] + dp[c - 1]
return dp[n - 1]`,
    dryRunExample:
      '`m = 3, n = 3`: row 0 `[1,1,1]` -> row 1 `[1,2,3]` -> row 2 `[1,3,6]` -> `6` paths.',
    timeComplexity: '`O(m * n)` (or `O(min(m, n))` via combinatorics `C(m+n-2, m-1)`)',
    spaceComplexity: '`O(n)`',
    commonMistakes: [
      'Forgetting obstacles in **Unique Paths II** (`if (grid[r][c] == 1) dp[c] = 0;`).',
    ],
    interviewTips: [
      'Mention the `O(1)`-space combinatorics formula `C(m + n - 2, min(m - 1, n - 1))` when there are no obstacles.',
    ],
    implementations: {
      c: `int uniquePaths(int m, int n) {\n    int dp[100]; for (int c = 0; c < n; c++) dp[c] = 1;\n    for (int r = 1; r < m; r++) for (int c = 1; c < n; c++) dp[c] += dp[c - 1];\n    return dp[n - 1];\n}`,
      cpp: `#include <vector>\nint uniquePaths(int m, int n) {\n    std::vector<int> dp(n, 1);\n    for (int r = 1; r < m; ++r) for (int c = 1; c < n; ++c) dp[c] += dp[c - 1];\n    return dp[n - 1];\n}`,
      java: `import java.util.Arrays;\npublic class UniquePaths {\n    public static int uniquePaths(int m, int n) {\n        int[] dp = new int[n]; Arrays.fill(dp, 1);\n        for (int r = 1; r < m; r++) for (int c = 1; c < n; c++) dp[c] += dp[c - 1];\n        return dp[n - 1];\n    }\n}`,
      python: `def unique_paths(m: int, n: int) -> int:\n    dp = [1] * n\n    for _ in range(1, m):\n        for c in range(1, n): dp[c] += dp[c - 1]\n    return dp[-1]`,
    },
  },
  {
    topicSlug: 'minimum-path-sum',
    title: 'Minimum Path Sum in a Grid',
    definition:
      'Given an `m x n` grid of non-negative costs, find a path from `(0, 0)` to `(m - 1, n - 1)` moving only Right or Down that minimizes the sum of visited cells.',
    explanation:
      'At `(r, c)`, `dp[r][c] = grid[r][c] + min(dp[r - 1][c], dp[r][c - 1])`. The first row can only come from the left and the first column only from above. Space-optimized to `O(n)` with a single row `dp[]`.',
    realWorldAnalogy:
      'Crossing a toll grid from top-left to bottom-right paying the lowest total toll.',
    algorithm:
      '1. `dp[0] = grid[0][0]`; fill row 0: `dp[c] = dp[c-1] + grid[0][c]`.\n2. For `r = 1 .. m - 1`:\n   - `dp[0] += grid[r][0]`.\n   - For `c = 1 .. n - 1`: `dp[c] = grid[r][c] + min(dp[c], dp[c - 1])`.\n3. Return `dp[n - 1]`.',
    pseudocode: `dp[0] <- grid[0][0]
for c in 1..n-1: dp[c] <- dp[c-1] + grid[0][c]
for r in 1..m-1:
    dp[0] <- dp[0] + grid[r][0]
    for c in 1..n-1:
        dp[c] <- grid[r][c] + min(dp[c], dp[c-1])
return dp[n-1]`,
    dryRunExample:
      '`[[1,3,1],[1,5,1],[4,2,1]]`: row 0 `[1,4,5]` -> row 1 `[2,7,6]` -> row 2 `[6,8,7]` -> `7` (`1+3+1+1+1`).',
    timeComplexity: '`O(m * n)`',
    spaceComplexity: '`O(n)`',
    commonMistakes: [
      'Forgetting to initialize row 0 and col 0 separately without out-of-bounds reads.',
    ],
    interviewTips: [
      'If 4-directional movement is allowed, DP fails due to cycles—switch to **Dijkstra**!',
    ],
    implementations: {
      c: `int minPathSum(int** g, int m, int n) {\n    int dp[200]; dp[0] = g[0][0];\n    for (int c = 1; c < n; c++) dp[c] = dp[c - 1] + g[0][c];\n    for (int r = 1; r < m; r++) {\n        dp[0] += g[r][0];\n        for (int c = 1; c < n; c++) dp[c] = g[r][c] + (dp[c] < dp[c - 1] ? dp[c] : dp[c - 1]);\n    }\n    return dp[n - 1];\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\nint minPathSum(const vector<vector<int>>& g) {\n    int m = static_cast<int>(g.size()), n = static_cast<int>(g[0].size());\n    vector<int> dp(n); dp[0] = g[0][0];\n    for (int c = 1; c < n; ++c) dp[c] = dp[c - 1] + g[0][c];\n    for (int r = 1; r < m; ++r) {\n        dp[0] += g[r][0];\n        for (int c = 1; c < n; ++c) dp[c] = g[r][c] + min(dp[c], dp[c - 1]);\n    }\n    return dp[n - 1];\n}`,
      java: `public class MinPathSum {\n    public static int minPathSum(int[][] g) {\n        int m = g.length, n = g[0].length; int[] dp = new int[n]; dp[0] = g[0][0];\n        for (int c = 1; c < n; c++) dp[c] = dp[c - 1] + g[0][c];\n        for (int r = 1; r < m; r++) {\n            dp[0] += g[r][0];\n            for (int c = 1; c < n; c++) dp[c] = g[r][c] + Math.min(dp[c], dp[c - 1]);\n        }\n        return dp[n - 1];\n    }\n}`,
      python: `def min_path_sum(grid: list[list[int]]) -> int:\n    m, n = len(grid), len(grid[0])\n    dp = [grid[0][0]] * n\n    for c in range(1, n): dp[c] = dp[c - 1] + grid[0][c]\n    for r in range(1, m):\n        dp[0] += grid[r][0]\n        for c in range(1, n): dp[c] = grid[r][c] + min(dp[c], dp[c - 1])\n    return dp[-1]`,
    },
  },
  {
    topicSlug: 'triangle-dp',
    title: 'Triangle Minimum Path Sum (Bottom-Up DP)',
    definition:
      'Given a triangle array, find the minimum path sum from top to bottom where from `(r, c)` you may step to `(r + 1, c)` or `(r + 1, c + 1)`.',
    explanation:
      'Going **bottom-up** from the last row up to row `0` is cleaner than top-down because there are no edge-boundary checks (`c == 0` or `c == r`)! Initialize `dp` as a copy of the bottom row, then for `r = n - 2` down to `0`, set `dp[c] = tri[r][c] + min(dp[c], dp[c + 1])`. The answer lands at `dp[0]`.',
    realWorldAnalogy:
      'Evaluating a pyramid from the base upward so every stone simply picks the cheaper of its two supporting stones below.',
    algorithm:
      '1. `dp = copy(triangle[n - 1])`.\n2. For `r = n - 2` down to `0`:\n   - For `c = 0 .. r`: `dp[c] = triangle[r][c] + min(dp[c], dp[c + 1])`.\n3. Return `dp[0]`.',
    pseudocode: `dp <- copy(triangle[n - 1])
for r from n - 2 down to 0:
    for c from 0 to r:
        dp[c] <- triangle[r][c] + min(dp[c], dp[c + 1])
return dp[0]`,
    dryRunExample:
      '`[[2],[3,4],[6,5,7],[4,1,8,3]]`: bottom `[4,1,8,3]` -> `[7,6,10]` -> `[9,10]` -> `11` (`2+3+5+1`).',
    timeComplexity: '`O(N^2)` where `N` is number of rows',
    spaceComplexity: '`O(N)`',
    commonMistakes: [
      'Looping `c` backward when updating bottom-up (`dp[c]` overwrites `dp[c+1]`? No, `c` forward reads `dp[c]` and `dp[c+1]` before `dp[c+1]` is modified, so `c` MUST go forward `0..r`!).',
    ],
    interviewTips: [
      'Bottom-up avoids boundary conditionals and finishes cleanly at `dp[0]`.',
    ],
    implementations: {
      c: `int minimumTotal(int** tri, int n) {\n    int dp[200]; for (int c = 0; c < n; c++) dp[c] = tri[n - 1][c];\n    for (int r = n - 2; r >= 0; r--)\n        for (int c = 0; c <= r; c++) dp[c] = tri[r][c] + (dp[c] < dp[c + 1] ? dp[c] : dp[c + 1]);\n    return dp[0];\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\nint minimumTotal(const vector<vector<int>>& tri) {\n    vector<int> dp = tri.back();\n    for (int r = static_cast<int>(tri.size()) - 2; r >= 0; --r)\n        for (int c = 0; c <= r; ++c) dp[c] = tri[r][c] + min(dp[c], dp[c + 1]);\n    return dp[0];\n}`,
      java: `import java.util.*;\npublic class TriangleDP {\n    public static int minimumTotal(List<List<Integer>> tri) {\n        int n = tri.size(); int[] dp = new int[n];\n        for (int c = 0; c < n; c++) dp[c] = tri.get(n - 1).get(c);\n        for (int r = n - 2; r >= 0; r--)\n            for (int c = 0; c <= r; c++) dp[c] = tri.get(r).get(c) + Math.min(dp[c], dp[c + 1]);\n        return dp[0];\n    }\n}`,
      python: `def minimum_total(triangle: list[list[int]]) -> int:\n    dp = triangle[-1][:]\n    for r in range(len(triangle) - 2, -1, -1):\n        for c in range(r + 1): dp[c] = triangle[r][c] + min(dp[c], dp[c + 1])\n    return dp[0]`,
    },
  },
  {
    topicSlug: 'subset-sum',
    title: 'Subset Sum Problem',
    definition:
      'Given an array of non-negative integers `nums` and a `target`, determine whether any subset of `nums` sums exactly to `target`.',
    explanation:
      '`dp[s]` is `true` if sum `s` can be formed. Initialize `dp[0] = true`. For each number `x` in `nums`, iterate `s` **backward** from `target` down to `x` and set `dp[s] = dp[s] || dp[s - x]`. Backward iteration ensures each element `x` is used at most once.',
    realWorldAnalogy:
      'Checking whether exact change for `target` can be made from a finite handful of specific coins.',
    algorithm:
      '1. `dp[0..target] = false`, `dp[0] = true`.\n2. For each `x` in `nums`:\n   - For `s = target` down to `x`: `dp[s] = dp[s] || dp[s - x]`.\n3. Return `dp[target]`.',
    pseudocode: `dp[0] <- true, dp[1..target] <- false
for x in nums:
    for s from target down to x:
        dp[s] <- dp[s] or dp[s - x]
return dp[target]`,
    dryRunExample:
      '`nums = [3, 34, 4, 12, 5, 2]`, `target = 9`: `4 + 5 = 9` -> `dp[9] = true`.',
    timeComplexity: '`O(N * target)` (pseudo-polynomial)',
    spaceComplexity: '`O(target)`',
    commonMistakes: [
      'Iterating `s` forward (`x .. target`), which allows reusing the same element multiple times.',
    ],
    interviewTips: [
      'Subset Sum is the boolean foundation for **Partition Equal Subset Sum**, **Target Sum**, and **Count Subsets with Sum K**.',
    ],
    implementations: {
      c: `#include <stdbool.h>\nbool subsetSum(const int nums[], int n, int target) {\n    bool dp[10001] = {false}; dp[0] = true;\n    for (int i = 0; i < n; i++) for (int s = target; s >= nums[i]; s--) if (dp[s - nums[i]]) dp[s] = true;\n    return dp[target];\n}`,
      cpp: `#include <vector>\nbool subsetSum(const std::vector<int>& nums, int target) {\n    std::vector<bool> dp(target + 1, false); dp[0] = true;\n    for (int x : nums) for (int s = target; s >= x; --s) if (dp[s - x]) dp[s] = true;\n    return dp[target];\n}`,
      java: `public class SubsetSum {\n    public static boolean canSum(int[] nums, int target) {\n        boolean[] dp = new boolean[target + 1]; dp[0] = true;\n        for (int x : nums) for (int s = target; s >= x; s--) if (dp[s - x]) dp[s] = true;\n        return dp[target];\n    }\n}`,
      python: `def subset_sum(nums: list[int], target: int) -> bool:\n    dp = [False] * (target + 1); dp[0] = True\n    for x in nums:\n        for s in range(target, x - 1, -1):\n            if dp[s - x]: dp[s] = True\n    return dp[target]`,
    },
  },
  {
    topicSlug: 'partition-equal-subset-sum',
    title: 'Partition Equal Subset Sum',
    definition:
      'Given an array of positive integers `nums`, determine whether it can be partitioned into two subsets with equal sum.',
    explanation:
      'Let `total = sum(nums)`. If `total` is **odd**, return `false` immediately. Otherwise, the problem reduces directly to **Subset Sum** with `target = total / 2`.',
    realWorldAnalogy:
      'Splitting a pile of gold bars of different weights evenly between two people without cutting any bar.',
    algorithm:
      '1. Compute `total = sum(nums)`.\n2. If `total % 2 != 0`, return `false`.\n3. Run Subset Sum for `target = total / 2`.',
    pseudocode: `total <- sum(nums)
if total % 2 != 0: return false
return subsetSum(nums, total / 2)`,
    dryRunExample:
      '`nums = [1, 5, 11, 5]`: `total = 22`, `target = 11` -> `[1, 5, 5]` sums to `11` -> `true`.',
    timeComplexity: '`O(N * (total / 2))`',
    spaceComplexity: '`O(total / 2)`',
    commonMistakes: [
      'Forgetting the odd-sum check (`total % 2 != 0`).',
    ],
    interviewTips: [
      'In C++/Python, a bitset (`bitset<10001> dp(1); dp |= (dp << x);`) solves this in `O(N * target / 64)`!',
    ],
    implementations: {
      c: `#include <stdbool.h>\nbool canPartition(const int nums[], int n) {\n    int sum = 0; for (int i = 0; i < n; i++) sum += nums[i];\n    if (sum % 2) return false;\n    return subsetSum(nums, n, sum / 2);\n}`,
      cpp: `#include <numeric>\n#include <vector>\nbool canPartition(const std::vector<int>& nums) {\n    int sum = std::accumulate(nums.begin(), nums.end(), 0);\n    if (sum % 2) return false;\n    int target = sum / 2; std::vector<bool> dp(target + 1, false); dp[0] = true;\n    for (int x : nums) for (int s = target; s >= x; --s) if (dp[s - x]) dp[s] = true;\n    return dp[target];\n}`,
      java: `public class PartitionEqual {\n    public static boolean canPartition(int[] nums) {\n        int sum = 0; for (int x : nums) sum += x;\n        if (sum % 2 != 0) return false;\n        int t = sum / 2; boolean[] dp = new boolean[t + 1]; dp[0] = true;\n        for (int x : nums) for (int s = t; s >= x; s--) if (dp[s - x]) dp[s] = true;\n        return dp[t];\n    }\n}`,
      python: `def can_partition(nums: list[int]) -> bool:\n    total = sum(nums)\n    if total % 2: return False\n    t = total // 2; dp = [False] * (t + 1); dp[0] = True\n    for x in nums:\n        for s in range(t, x - 1, -1):\n            if dp[s - x]: dp[s] = True\n    return dp[t]`,
    },
  },
  {
    topicSlug: 'zero-one-knapsack',
    title: '0/1 Knapsack Problem',
    definition:
      'Given `N` items with `(weight[i], value[i])` and capacity `W`, maximize total value where each item can either be taken once (`1`) or skipped (`0`).',
    explanation:
      '`dp[i][w]` is the max value using items `0..i-1` within capacity `w`: `max(dp[i-1][w], val[i] + dp[i-1][w - wt[i]])`. Compressing to 1D `dp[0..W]` requires iterating `w` **backward** from `W` down to `wt[i]` so each item is considered at most once.',
    realWorldAnalogy:
      'Packing a suitcase with weight limit `W` using indivisible gadgets where you want maximum utility.',
    algorithm:
      '1. `dp[0..W] = 0`.\n2. For `i = 0 .. N - 1`:\n   - For `w = W` down to `wt[i]`:\n     - `dp[w] = max(dp[w], val[i] + dp[w - wt[i]])`.\n3. Return `dp[W]`.',
    pseudocode: `dp[0..W] <- 0
for i from 0 to N - 1:
    for w from W down to wt[i]:
        dp[w] <- max(dp[w], val[i] + dp[w - wt[i]])
return dp[W]`,
    dryRunExample:
      '`wt = [1, 3, 4, 5], val = [1, 4, 5, 7], W = 7`: picking `wt=3 (4)` and `wt=4 (5)` gives `9`.',
    timeComplexity: '`O(N * W)`',
    spaceComplexity: '`O(W)`',
    commonMistakes: [
      'Looping `w` forward in 1D DP (counts the same item multiple times!).',
    ],
    interviewTips: [
      'Remember: 0/1 Knapsack loops capacity **backward**; Unbounded Knapsack loops capacity **forward**.',
    ],
    implementations: {
      c: `int knapsack01(int W, const int wt[], const int val[], int n) {\n    int dp[10001] = {0};\n    for (int i = 0; i < n; i++)\n        for (int w = W; w >= wt[i]; w--)\n            if (val[i] + dp[w - wt[i]] > dp[w]) dp[w] = val[i] + dp[w - wt[i]];\n    return dp[W];\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nint knapsack01(int W, const std::vector<int>& wt, const std::vector<int>& val) {\n    std::vector<int> dp(W + 1, 0);\n    for (size_t i = 0; i < wt.size(); ++i)\n        for (int w = W; w >= wt[i]; --w) dp[w] = std::max(dp[w], val[i] + dp[w - wt[i]]);\n    return dp[W];\n}`,
      java: `public class Knapsack01 {\n    public static int solve(int W, int[] wt, int[] val) {\n        int[] dp = new int[W + 1];\n        for (int i = 0; i < wt.length; i++)\n            for (int w = W; w >= wt[i]; w--) dp[w] = Math.max(dp[w], val[i] + dp[w - wt[i]]);\n        return dp[W];\n    }\n}`,
      python: `def knapsack_01(w_cap: int, wt: list[int], val: list[int]) -> int:\n    dp = [0] * (w_cap + 1)\n    for wi, vi in zip(wt, val):\n        for w in range(w_cap, wi - 1, -1):\n            dp[w] = max(dp[w], vi + dp[w - wi])\n    return dp[w_cap]`,
    },
  },
  {
    topicSlug: 'unbounded-knapsack',
    title: 'Unbounded Knapsack',
    definition:
      'Given `N` item types with `(weight[i], value[i])` and capacity `W`, maximize total value when you have an **unlimited supply** of each item type.',
    explanation:
      'Because item `i` can be reused after being picked, `dp[w]` may read `dp[w - wt[i]]` from the **current** iteration. Therefore, iterate `w` **forward** from `wt[i]` up to `W`.',
    realWorldAnalogy:
      'Loading a cargo van with unlimited crates of each product type to maximize cargo value.',
    algorithm:
      '1. `dp[0..W] = 0`.\n2. For `i = 0 .. N - 1`:\n   - For `w = wt[i]` up to `W`: `dp[w] = max(dp[w], val[i] + dp[w - wt[i]])`.\n3. Return `dp[W]`.',
    pseudocode: `dp[0..W] <- 0
for i from 0 to N - 1:
    for w from wt[i] to W:
        dp[w] <- max(dp[w], val[i] + dp[w - wt[i]])
return dp[W]`,
    dryRunExample:
      '`wt = [2, 4, 6], val = [5, 11, 13], W = 10`: `2*wt(4) + wt(2) = 11+11+5 = 27`.',
    timeComplexity: '`O(N * W)`',
    spaceComplexity: '`O(W)`',
    commonMistakes: [
      'Looping `w` backward (which restricts items to 0/1 usage).',
    ],
    interviewTips: [
      'Coin Change and Rod Cutting are direct variants of Unbounded Knapsack.',
    ],
    implementations: {
      c: `int unboundedKnapsack(int W, const int wt[], const int val[], int n) {\n    int dp[10001] = {0};\n    for (int i = 0; i < n; i++)\n        for (int w = wt[i]; w <= W; w++)\n            if (val[i] + dp[w - wt[i]] > dp[w]) dp[w] = val[i] + dp[w - wt[i]];\n    return dp[W];\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nint unboundedKnapsack(int W, const std::vector<int>& wt, const std::vector<int>& val) {\n    std::vector<int> dp(W + 1, 0);\n    for (size_t i = 0; i < wt.size(); ++i)\n        for (int w = wt[i]; w <= W; ++w) dp[w] = std::max(dp[w], val[i] + dp[w - wt[i]]);\n    return dp[W];\n}`,
      java: `public class UnboundedKnapsack {\n    public static int solve(int W, int[] wt, int[] val) {\n        int[] dp = new int[W + 1];\n        for (int i = 0; i < wt.length; i++)\n            for (int w = wt[i]; w <= W; w++) dp[w] = Math.max(dp[w], val[i] + dp[w - wt[i]]);\n        return dp[W];\n    }\n}`,
      python: `def unbounded_knapsack(w_cap: int, wt: list[int], val: list[int]) -> int:\n    dp = [0] * (w_cap + 1)\n    for wi, vi in zip(wt, val):\n        for w in range(wi, w_cap + 1):\n            dp[w] = max(dp[w], vi + dp[w - wi])\n    return dp[w_cap]`,
    },
  },
  {
    topicSlug: 'coin-change',
    title: 'Coin Change (Minimum Coins & Ways)',
    definition:
      'Given coin denominations `coins[]` and an `amount`, **Coin Change I** finds the fewest coins needed to make `amount` (`-1` if impossible); **Coin Change II** counts the number of combinations.',
    explanation:
      'Initialize `dp[0] = 0` and `dp[1..amount] = INF` (use `amount + 1` as safe `INF` so `INF + 1` never overflows). For each `a = 1 .. amount`, `dp[a] = min(dp[a], 1 + dp[a - c])` for all `c <= a`. For **Coin Change II (combinations)**, put `coins` in the **outer** loop and `amount` in the **inner** loop so order doesn’t double-count `[1,2]` and `[2,1]`.',
    realWorldAnalogy:
      'Making exact change with the fewest coins when greedy fails on arbitrary denominations like `[1, 3, 4]`.',
    algorithm:
      '1. `dp[0..amount] = amount + 1`, `dp[0] = 0`.\n2. For `c` in `coins`: for `a = c .. amount`: `dp[a] = min(dp[a], 1 + dp[a - c])`.\n3. Return `dp[amount] > amount ? -1 : dp[amount]`.',
    pseudocode: `dp[0] <- 0, dp[1..amount] <- amount + 1
for c in coins:
    for a from c to amount:
        dp[a] <- min(dp[a], 1 + dp[a - c])
return -1 if dp[amount] > amount else dp[amount]`,
    dryRunExample:
      '`coins = [1, 3, 4]`, `amount = 6`: `dp = [0, 1, 2, 1, 1, 2, 2]` -> `2` coins (`3 + 3`).',
    timeComplexity: '`O(N * amount)`',
    spaceComplexity: '`O(amount)`',
    commonMistakes: [
      'Using `INT_MAX` as `INF` and then adding `+ 1`, causing signed integer overflow!',
    ],
    interviewTips: [
      'Know the loop-order rule for counting: `coins` outer + `amount` inner = **combinations**; `amount` outer + `coins` inner = **permutations**.',
    ],
    implementations: {
      c: `int coinChange(const int coins[], int n, int amount) {\n    int dp[10001]; for (int i = 0; i <= amount; i++) dp[i] = amount + 1;\n    dp[0] = 0;\n    for (int i = 0; i < n; i++)\n        for (int a = coins[i]; a <= amount; a++)\n            if (1 + dp[a - coins[i]] < dp[a]) dp[a] = 1 + dp[a - coins[i]];\n    return dp[amount] > amount ? -1 : dp[amount];\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nint coinChange(const std::vector<int>& coins, int amount) {\n    std::vector<int> dp(amount + 1, amount + 1); dp[0] = 0;\n    for (int c : coins) for (int a = c; a <= amount; ++a) dp[a] = std::min(dp[a], 1 + dp[a - c]);\n    return dp[amount] > amount ? -1 : dp[amount];\n}`,
      java: `import java.util.Arrays;\npublic class CoinChange {\n    public static int coinChange(int[] coins, int amount) {\n        int[] dp = new int[amount + 1]; Arrays.fill(dp, amount + 1); dp[0] = 0;\n        for (int c : coins) for (int a = c; a <= amount; a++) dp[a] = Math.min(dp[a], 1 + dp[a - c]);\n        return dp[amount] > amount ? -1 : dp[amount];\n    }\n}`,
      python: `def coin_change(coins: list[int], amount: int) -> int:\n    dp = [amount + 1] * (amount + 1); dp[0] = 0\n    for c in coins:\n        for a in range(c, amount + 1): dp[a] = min(dp[a], 1 + dp[a - c])\n    return -1 if dp[amount] > amount else dp[amount]`,
    },
  },
  {
    topicSlug: 'rod-cutting',
    title: 'Rod Cutting Problem',
    definition:
      'Given a rod of length `N` and `price[i]` for a piece of length `i + 1`, determine the maximum revenue obtainable by cutting the rod and selling the pieces.',
    explanation:
      'Rod Cutting is **isomorphic to Unbounded Knapsack** where capacity `W = N`, item weights are piece lengths `1..N`, and item values are `price[0..N-1]`. `dp[len] = max(price[cut - 1] + dp[len - cut])` for `1 <= cut <= len`.',
    realWorldAnalogy:
      'Cutting a `N`-meter steel pipe into optimal lengths to maximize total sale price.',
    algorithm:
      '1. `dp[0..N] = 0`.\n2. For `len = 1 .. N`:\n   - For `cut = 1 .. len`: `dp[len] = max(dp[len], price[cut - 1] + dp[len - cut])`.\n3. Return `dp[N]`.',
    pseudocode: `dp[0..N] <- 0
for len from 1 to N:
    for cut from 1 to len:
        dp[len] <- max(dp[len], price[cut - 1] + dp[len - cut])
return dp[N]`,
    dryRunExample:
      '`price = [1, 5, 8, 9, 10, 17, 17, 20]`, `N = 8`: cutting into `2 + 6` yields `5 + 17 = 22`.',
    timeComplexity: '`O(N^2)`',
    spaceComplexity: '`O(N)`',
    commonMistakes: [
      'Off-by-one between 1-indexed piece length `cut` and 0-indexed `price[cut - 1]`.',
    ],
    interviewTips: [
      'Point out the exact equivalence to Unbounded Knapsack immediately.',
    ],
    implementations: {
      c: `int cutRod(const int price[], int n) {\n    int dp[1001] = {0};\n    for (int len = 1; len <= n; len++)\n        for (int cut = 1; cut <= len; cut++)\n            if (price[cut - 1] + dp[len - cut] > dp[len]) dp[len] = price[cut - 1] + dp[len - cut];\n    return dp[n];\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nint cutRod(const std::vector<int>& price) {\n    int n = static_cast<int>(price.size()); std::vector<int> dp(n + 1, 0);\n    for (int len = 1; len <= n; ++len)\n        for (int cut = 1; cut <= len; ++cut) dp[len] = std::max(dp[len], price[cut - 1] + dp[len - cut]);\n    return dp[n];\n}`,
      java: `public class RodCutting {\n    public static int cutRod(int[] price) {\n        int n = price.length; int[] dp = new int[n + 1];\n        for (int len = 1; len <= n; len++)\n            for (int cut = 1; cut <= len; cut++) dp[len] = Math.max(dp[len], price[cut - 1] + dp[len - cut]);\n        return dp[n];\n    }\n}`,
      python: `def cut_rod(price: list[int]) -> int:\n    n = len(price); dp = [0] * (n + 1)\n    for length in range(1, n + 1):\n        for cut in range(1, length + 1): dp[length] = max(dp[length], price[cut - 1] + dp[length - cut])\n    return dp[n]`,
    },
  },
  {
    topicSlug: 'longest-common-subsequence',
    title: 'Longest Common Subsequence (LCS)',
    definition:
      'Given two strings `s1` and `s2`, find the length of their longest subsequence present in both strings in the same relative order (not necessarily contiguous).',
    explanation:
      'Compare `s1[i - 1]` and `s2[j - 1]`:\n- If they match: `dp[i][j] = 1 + dp[i - 1][j - 1]`.\n- If they differ: `dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])`.\nSpace-optimizes from `O(M * N)` to `O(min(M, N))` using two 1D rows (or `prev` + `curr`).',
    realWorldAnalogy:
      'Computing `git diff` between two versions of a file to find the longest shared sequence of unchanged lines.',
    algorithm:
      '1. `dp[0..m][0..n] = 0`.\n2. For `i = 1 .. m`, `j = 1 .. n`:\n   - If `s1[i-1] == s2[j-1]`, `dp[i][j] = 1 + dp[i-1][j-1]`.\n   - Else `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`.\n3. Return `dp[m][n]`.',
    pseudocode: `for i from 1 to m:
    for j from 1 to n:
        if s1[i-1] == s2[j-1]: dp[i][j] <- 1 + dp[i-1][j-1]
        else: dp[i][j] <- max(dp[i-1][j], dp[i][j-1])`,
    dryRunExample:
      '`s1 = "abcde"`, `s2 = "ace"` -> LCS is `"ace"` (length `3`).',
    timeComplexity: '`O(M * N)`',
    spaceComplexity: '`O(min(M, N))` space-optimized (`O(M * N)` to reconstruct string)',
    commonMistakes: [
      'Confusing **subsequence** (can skip chars -> `max(top, left)`) with **substring** (contiguous -> reset to `0`).',
    ],
    interviewTips: [
      'LCS directly solves **Longest Palindromic Subsequence** (`LCS(s, reverse(s))`) and **Min Insertions/Deletions to Convert s1 to s2**.',
    ],
    implementations: {
      c: `int lcs(const char* a, const char* b) {\n    int m = (int)strlen(a), n = (int)strlen(b), prev[1001] = {0}, cur[1001] = {0};\n    for (int i = 1; i <= m; i++) {\n        for (int j = 1; j <= n; j++) cur[j] = (a[i-1] == b[j-1]) ? 1 + prev[j-1] : (prev[j] > cur[j-1] ? prev[j] : cur[j-1]);\n        memcpy(prev, cur, (n + 1) * sizeof(int));\n    }\n    return prev[n];\n}`,
      cpp: `#include <algorithm>\n#include <string>\n#include <vector>\nusing namespace std;\nint longestCommonSubsequence(const string& a, const string& b) {\n    int m = static_cast<int>(a.size()), n = static_cast<int>(b.size());\n    vector<int> prev(n + 1, 0), cur(n + 1, 0);\n    for (int i = 1; i <= m; ++i) {\n        for (int j = 1; j <= n; ++j) cur[j] = (a[i-1] == b[j-1]) ? 1 + prev[j-1] : max(prev[j], cur[j-1]);\n        swap(prev, cur);\n    }\n    return prev[n];\n}`,
      java: `public class LCS {\n    public static int lcs(String a, String b) {\n        int m = a.length(), n = b.length(); int[] prev = new int[n + 1], cur = new int[n + 1];\n        for (int i = 1; i <= m; i++) {\n            for (int j = 1; j <= n; j++) cur[j] = (a.charAt(i-1) == b.charAt(j-1)) ? 1 + prev[j-1] : Math.max(prev[j], cur[j-1]);\n            int[] t = prev; prev = cur; cur = t;\n        }\n        return prev[n];\n    }\n}`,
      python: `def lcs(a: str, b: str) -> int:\n    m, n = len(a), len(b); prev = [0] * (n + 1)\n    for i in range(1, m + 1):\n        cur = [0] * (n + 1)\n        for j in range(1, n + 1):\n            cur[j] = 1 + prev[j - 1] if a[i - 1] == b[j - 1] else max(prev[j], cur[j - 1])\n        prev = cur\n    return prev[n]`,
    },
  },
  {
    topicSlug: 'longest-common-substring',
    title: 'Longest Common Substring',
    definition:
      'Given two strings `s1` and `s2`, find the length of the longest **contiguous** substring appearing in both strings.',
    explanation:
      'Define `dp[i][j]` as the length of the common substring **ending strictly at `s1[i-1]` and `s2[j-1]`**. If `s1[i-1] == s2[j-1]`, `dp[i][j] = 1 + dp[i-1][j-1]`; otherwise **`dp[i][j] = 0`** (reset because contiguity broke!). Track `best = max(best, dp[i][j])` across all cells.',
    realWorldAnalogy:
      'Finding the longest identical consecutive phrase shared by two documents.',
    algorithm:
      '1. `best = 0`.\n2. Loop `i = 1 .. m`, `j = 1 .. n`:\n   - If `s1[i-1] == s2[j-1]`: `dp[i][j] = 1 + dp[i-1][j-1]`, `best = max(best, dp[i][j])`.\n   - Else: `dp[i][j] = 0`.\n3. Return `best`.',
    pseudocode: `best <- 0
for i in 1..m, j in 1..n:
    if s1[i-1] == s2[j-1]:
        dp[i][j] <- 1 + dp[i-1][j-1]
        best <- max(best, dp[i][j])
    else: dp[i][j] <- 0`,
    dryRunExample:
      '`s1 = "abcjklp"`, `s2 = "acjkp"`: `"cjk"` gives `dp = 3` -> returns `3`.',
    timeComplexity: '`O(M * N)`',
    spaceComplexity: '`O(N)` with 1D array iterated backward',
    commonMistakes: [
      'Returning `dp[m][n]` instead of the global `max` across the DP table!',
    ],
    interviewTips: [
      'Can also be solved in `O((M + N) log min(M, N))` using Binary Search on length + Rolling Hash.',
    ],
    implementations: {
      c: `int lcSubstring(const char* a, const char* b) {\n    int m = (int)strlen(a), n = (int)strlen(b), dp[1001] = {0}, best = 0;\n    for (int i = 1; i <= m; i++) for (int j = n; j >= 1; j--) {\n        dp[j] = (a[i-1] == b[j-1]) ? 1 + dp[j-1] : 0;\n        if (dp[j] > best) best = dp[j];\n    }\n    return best;\n}`,
      cpp: `#include <algorithm>\n#include <string>\n#include <vector>\nusing namespace std;\nint longestCommonSubstring(const string& a, const string& b) {\n    int m = static_cast<int>(a.size()), n = static_cast<int>(b.size()), best = 0;\n    vector<int> dp(n + 1, 0);\n    for (int i = 1; i <= m; ++i) for (int j = n; j >= 1; --j) {\n        dp[j] = (a[i-1] == b[j-1]) ? 1 + dp[j-1] : 0;\n        best = max(best, dp[j]);\n    }\n    return best;\n}`,
      java: `public class LCSubstring {\n    public static int solve(String a, String b) {\n        int m = a.length(), n = b.length(), best = 0; int[] dp = new int[n + 1];\n        for (int i = 1; i <= m; i++) for (int j = n; j >= 1; j--) {\n            dp[j] = (a.charAt(i-1) == b.charAt(j-1)) ? 1 + dp[j-1] : 0;\n            best = Math.max(best, dp[j]);\n        }\n        return best;\n    }\n}`,
      python: `def longest_common_substring(a: str, b: str) -> int:\n    n, best = len(b), 0; dp = [0] * (n + 1)\n    for ch in a:\n        for j in range(n, 0, -1):\n            dp[j] = 1 + dp[j - 1] if ch == b[j - 1] else 0\n            if dp[j] > best: best = dp[j]\n    return best`,
    },
  },
  {
    topicSlug: 'edit-distance',
    title: 'Edit Distance (Levenshtein Distance)',
    definition:
      'Given strings `word1` and `word2`, find the minimum number of single-character operations (**insert**, **delete**, or **replace**) to transform `word1` into `word2`.',
    explanation:
      '`dp[i][j]` is the min edits to convert `word1[0..i-1]` to `word2[0..j-1]`:\n- Base cases: `dp[i][0] = i` (delete `i` chars), `dp[0][j] = j` (insert `j` chars).\n- If `word1[i-1] == word2[j-1]`: `dp[i][j] = dp[i-1][j-1]` (free).\n- Else: `1 + min(dp[i-1][j] /*delete*/, dp[i][j-1] /*insert*/, dp[i-1][j-1] /*replace*/)`.',
    realWorldAnalogy:
      'Spell-checker measuring how many keystrokes separate a typo from a dictionary word.',
    algorithm:
      '1. Initialize `dp[i][0] = i` and `dp[0][j] = j`.\n2. Fill `dp[i][j]` for `i = 1..m`, `j = 1..n`.\n3. Return `dp[m][n]`.',
    pseudocode: `dp[i][0] <- i, dp[0][j] <- j
for i in 1..m, j in 1..n:
    if w1[i-1] == w2[j-1]: dp[i][j] <- dp[i-1][j-1]
    else: dp[i][j] <- 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])`,
    dryRunExample:
      '`"horse"` -> `"ros"`: replace `h->r`, delete `r`, delete `e` -> `3` edits.',
    timeComplexity: '`O(M * N)`',
    spaceComplexity: '`O(min(M, N))` space-optimized',
    commonMistakes: [
      'Forgetting base cases `dp[i][0] = i` and `dp[0][j] = j` (leaving them `0`).',
    ],
    interviewTips: [
      'Clearly map each DP cell transition (`i-1, j` = delete, `i, j-1` = insert, `i-1, j-1` = replace).',
    ],
    implementations: {
      c: `int minDistance(const char* w1, const char* w2) {\n    int m = (int)strlen(w1), n = (int)strlen(w2), dp[501][501];\n    for (int i = 0; i <= m; i++) dp[i][0] = i;\n    for (int j = 0; j <= n; j++) dp[0][j] = j;\n    for (int i = 1; i <= m; i++) for (int j = 1; j <= n; j++) {\n        if (w1[i-1] == w2[j-1]) dp[i][j] = dp[i-1][j-1];\n        else { int a = dp[i-1][j], b = dp[i][j-1], c = dp[i-1][j-1]; dp[i][j] = 1 + (a < b ? (a < c ? a : c) : (b < c ? b : c)); }\n    }\n    return dp[m][n];\n}`,
      cpp: `#include <algorithm>\n#include <string>\n#include <vector>\nusing namespace std;\nint minDistance(const string& w1, const string& w2) {\n    int m = static_cast<int>(w1.size()), n = static_cast<int>(w2.size());\n    vector<int> prev(n + 1), cur(n + 1); iota(prev.begin(), prev.end(), 0);\n    for (int i = 1; i <= m; ++i) {\n        cur[0] = i;\n        for (int j = 1; j <= n; ++j) cur[j] = (w1[i-1] == w2[j-1]) ? prev[j-1] : 1 + min({prev[j], cur[j-1], prev[j-1]});\n        swap(prev, cur);\n    }\n    return prev[n];\n}`,
      java: `public class EditDistance {\n    public static int minDistance(String w1, String w2) {\n        int m = w1.length(), n = w2.length(); int[] prev = new int[n + 1], cur = new int[n + 1];\n        for (int j = 0; j <= n; j++) prev[j] = j;\n        for (int i = 1; i <= m; i++) {\n            cur[0] = i;\n            for (int j = 1; j <= n; j++) cur[j] = (w1.charAt(i-1) == w2.charAt(j-1)) ? prev[j-1] : 1 + Math.min(prev[j], Math.min(cur[j-1], prev[j-1]));\n            int[] t = prev; prev = cur; cur = t;\n        }\n        return prev[n];\n    }\n}`,
      python: `def min_distance(w1: str, w2: str) -> int:\n    m, n = len(w1), len(w2); prev = list(range(n + 1))\n    for i in range(1, m + 1):\n        cur = [i] + [0] * n\n        for j in range(1, n + 1):\n            cur[j] = prev[j - 1] if w1[i - 1] == w2[j - 1] else 1 + min(prev[j], cur[j - 1], prev[j - 1])\n        prev = cur\n    return prev[n]`,
    },
  },
  {
    topicSlug: 'longest-increasing-subsequence',
    title: 'Longest Increasing Subsequence (LIS — O(N^2) & O(N log N))',
    definition:
      'Given an integer array `nums`, find the length of the longest strictly increasing subsequence.',
    explanation:
      '- **`O(N^2)` DP:** `dp[i] = 1 + max(dp[j])` for all `j < i` with `nums[j] < nums[i]`.\n- **`O(N log N)` Patience Sorting + Binary Search:** Maintain `tails[]`, where `tails[k]` is the smallest possible ending value of an increasing subsequence of length `k + 1`. For each `x`, find the first element `>= x` in `tails` (`lower_bound`): replace it (to keep tails minimal) or append `x` if `x > tails.back()`. Answer is `tails.size()`.',
    realWorldAnalogy:
      'Playing Patience/Solitaire: placing each dealt card on the leftmost pile whose top card is `>=` it, minimizing pile tops so future cards have maximum room to extend.',
    algorithm:
      '1. `tails = []`.\n2. For each `x` in `nums`:\n   - `idx = lower_bound(tails, x)`.\n   - If `idx == tails.size()`, `tails.push_back(x)`; else `tails[idx] = x`.\n3. Return `tails.size()`.',
    pseudocode: `tails <- []
for x in nums:
    idx <- lower_bound(tails, x)
    if idx == len(tails): tails.append(x)
    else: tails[idx] <- x
return len(tails)`,
    dryRunExample:
      '`nums = [10, 9, 2, 5, 3, 7, 101, 18]`: `tails` evolves `[10] -> [9] -> [2] -> [2,5] -> [2,3] -> [2,3,7] -> [2,3,7,101] -> [2,3,7,18]` -> length `4`.',
    timeComplexity: '`O(N log N)` with binary search (`O(N^2)` basic DP)',
    spaceComplexity: '`O(N)`',
    commonMistakes: [
      'Assuming `tails` itself is a valid LIS (only its **length** equals the LIS length; elements inside `tails` can come from different branches).',
    ],
    interviewTips: [
      'Use `lower_bound` (`>=`) for **strictly** increasing LIS, and `upper_bound` (`>`) for **non-decreasing** LIS.',
    ],
    implementations: {
      c: `int lengthOfLIS(const int nums[], int n) {\n    int tails[2500], len = 0;\n    for (int i = 0; i < n; i++) {\n        int l = 0, r = len;\n        while (l < r) { int m = l + (r - l) / 2; if (tails[m] < nums[i]) l = m + 1; else r = m; }\n        tails[l] = nums[i]; if (l == len) len++;\n    }\n    return len;\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nint lengthOfLIS(const std::vector<int>& nums) {\n    std::vector<int> tails;\n    for (int x : nums) {\n        auto it = std::lower_bound(tails.begin(), tails.end(), x);\n        if (it == tails.end()) tails.push_back(x); else *it = x;\n    }\n    return static_cast<int>(tails.size());\n}`,
      java: `import java.util.*;\npublic class LIS {\n    public static int lengthOfLIS(int[] nums) {\n        int[] tails = new int[nums.length]; int len = 0;\n        for (int x : nums) {\n            int i = Arrays.binarySearch(tails, 0, len, x);\n            if (i < 0) i = -(i + 1);\n            tails[i] = x; if (i == len) len++;\n        }\n        return len;\n    }\n}`,
      python: `from bisect import bisect_left\ndef length_of_lis(nums: list[int]) -> int:\n    tails = []\n    for x in nums:\n        i = bisect_left(tails, x)\n        if i == len(tails): tails.append(x)\n        else: tails[i] = x\n    return len(tails)`,
    },
  },
  {
    topicSlug: 'palindromic-subsequence',
    title: 'Longest Palindromic Subsequence (LPS)',
    definition:
      'Given a string `s`, find the length of its longest subsequence that reads the same forward and backward.',
    explanation:
      'Two clean ways:\n1. **LCS Reduction:** `LPS(s) = LCS(s, reverse(s))`.\n2. **Interval DP:** `dp[i][j]` for `s[i..j]`: if `s[i] == s[j]`, `2 + dp[i+1][j-1]`; else `max(dp[i+1][j], dp[i][j-1])`.',
    realWorldAnalogy:
      'Deleting the fewest characters from a word to turn it into a palindrome (`minDeletions = n - LPS(s)`).',
    algorithm:
      '1. Set `dp[i][i] = 1`.\n2. Loop `len` from `2` to `n`, `i = 0 .. n - len`, `j = i + len - 1`:\n   - If `s[i] == s[j]`: `dp[i][j] = 2 + (len == 2 ? 0 : dp[i+1][j-1])`.\n   - Else: `dp[i][j] = max(dp[i+1][j], dp[i][j-1])`.\n3. Return `dp[0][n - 1]`.',
    pseudocode: `for i from n - 1 down to 0:
    dp[i][i] <- 1
    for j from i + 1 to n - 1:
        if s[i] == s[j]: dp[i][j] <- 2 + dp[i+1][j-1]
        else: dp[i][j] <- max(dp[i+1][j], dp[i][j-1])`,
    dryRunExample:
      '`s = "bbbab"` -> `"bbbb"` has length `4`.',
    timeComplexity: '`O(N^2)`',
    spaceComplexity: '`O(N)` space-optimized',
    commonMistakes: [
      'Confusing Palindromic **Subsequence** (can skip chars) with Palindromic **Substring** (contiguous).',
    ],
    interviewTips: [
      'Minimum insertions to make a string a palindrome = `N - LPS(s)`.',
    ],
    implementations: {
      c: `int lps(const char* s) {\n    int n = (int)strlen(s), dp[1001] = {0};\n    for (int i = n - 1; i >= 0; i--) {\n        dp[i] = 1; int prev = 0;\n        for (int j = i + 1; j < n; j++) {\n            int tmp = dp[j];\n            dp[j] = (s[i] == s[j]) ? 2 + prev : (dp[j] > dp[j-1] ? dp[j] : dp[j-1]);\n            prev = tmp;\n        }\n    }\n    return dp[n - 1];\n}`,
      cpp: `#include <algorithm>\n#include <string>\n#include <vector>\nint longestPalindromeSubseq(const std::string& s) {\n    int n = static_cast<int>(s.size()); std::vector<int> dp(n, 0);\n    for (int i = n - 1; i >= 0; --i) {\n        dp[i] = 1; int prev = 0;\n        for (int j = i + 1; j < n; ++j) {\n            int tmp = dp[j];\n            dp[j] = (s[i] == s[j]) ? 2 + prev : std::max(dp[j], dp[j - 1]);\n            prev = tmp;\n        }\n    }\n    return dp[n - 1];\n}`,
      java: `public class LPS {\n    public static int longestPalindromeSubseq(String s) {\n        int n = s.length(); int[] dp = new int[n];\n        for (int i = n - 1; i >= 0; i--) {\n            dp[i] = 1; int prev = 0;\n            for (int j = i + 1; j < n; j++) {\n                int tmp = dp[j];\n                dp[j] = (s.charAt(i) == s.charAt(j)) ? 2 + prev : Math.max(dp[j], dp[j - 1]);\n                prev = tmp;\n            }\n        }\n        return dp[n - 1];\n    }\n}`,
      python: `def longest_palindrome_subseq(s: str) -> int:\n    n = len(s); dp = [0] * n\n    for i in range(n - 1, -1, -1):\n        dp[i] = 1; prev = 0\n        for j in range(i + 1, n):\n            tmp = dp[j]\n            dp[j] = 2 + prev if s[i] == s[j] else max(dp[j], dp[j - 1])\n            prev = tmp\n    return dp[-1]`,
    },
  },
  {
    topicSlug: 'stock-trading-dp',
    title: 'Stock Trading DP (State Machine Pattern)',
    definition:
      'Best Time to Buy and Sell Stock variants model daily decisions using a **state machine** tracking `(day, holding, transactionsLeft)`—typically compressed to `O(1)` or `O(K)` space.',
    explanation:
      'At any day with price `p`, you maintain:\n- `hold`: max profit currently holding a stock (`max(hold, cash - p)`).\n- `cash`: max profit currently not holding (`max(cash, hold + p - fee)`).\nFor at most `K` transactions, track `buy[k]` and `sell[k]` for `1..K`! For cooldown, add a 1-day `prevCash` state.',
    realWorldAnalogy:
      'Switching between two financial states ("invested" vs "in cash") each day to maximize net portfolio value.',
    algorithm:
      'Unlimited transactions with `fee`:\n1. `hold = -INF, cash = 0`.\n2. For each `p` in `prices`:\n   - `cash = max(cash, hold + p - fee)`\n   - `hold = max(hold, cash - p)`.\n3. Return `cash`.',
    pseudocode: `hold <- -INF, cash <- 0
for p in prices:
    prevCash <- cash
    cash <- max(cash, hold + p - fee)
    hold <- max(hold, prevCash - p)
return cash`,
    dryRunExample:
      '`prices = [1, 3, 2, 8, 4, 9], fee = 2`: buy at `1`, sell at `8` (`+5`), buy at `4`, sell at `9` (`+3`) -> `8`.',
    timeComplexity: '`O(N)` (or `O(N * K)` for at most `K` transactions)',
    spaceComplexity: '`O(1)` (or `O(K)`)',
    commonMistakes: [
      'Initializing `hold = 0` instead of `-prices[0]` or `-INF` (allows selling before buying!).',
    ],
    interviewTips: [
      'One unified state-machine framework (`hold`, `cash`, `cooldown`, `k`) solves all 6 LeetCode Stock problems!',
    ],
    implementations: {
      c: `int maxProfitFee(const int prices[], int n, int fee) {\n    int hold = -prices[0], cash = 0;\n    for (int i = 1; i < n; i++) {\n        int nc = cash > hold + prices[i] - fee ? cash : hold + prices[i] - fee;\n        int nh = hold > cash - prices[i] ? hold : cash - prices[i];\n        cash = nc; hold = nh;\n    }\n    return cash;\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nint maxProfitWithFee(const std::vector<int>& prices, int fee) {\n    int hold = -prices[0], cash = 0;\n    for (size_t i = 1; i < prices.size(); ++i) {\n        int nc = std::max(cash, hold + prices[i] - fee);\n        hold = std::max(hold, cash - prices[i]);\n        cash = nc;\n    }\n    return cash;\n}`,
      java: `public class StockDP {\n    public static int maxProfit(int[] prices, int fee) {\n        int hold = -prices[0], cash = 0;\n        for (int i = 1; i < prices.length; i++) {\n            int nc = Math.max(cash, hold + prices[i] - fee);\n            hold = Math.max(hold, cash - prices[i]);\n            cash = nc;\n        }\n        return cash;\n    }\n}`,
      python: `def max_profit_with_fee(prices: list[int], fee: int) -> int:\n    hold, cash = -prices[0], 0\n    for p in prices[1:]:\n        cash, hold = max(cash, hold + p - fee), max(hold, cash - p)\n    return cash`,
    },
  },
  {
    topicSlug: 'matrix-chain-multiplication',
    title: 'Matrix Chain Multiplication (MCM)',
    definition:
      'Given `N - 1` matrices with dimensions `dims[0..N-1]` (matrix `i` is `dims[i-1] x dims[i]`), find the parenthesization that minimizes total scalar multiplications.',
    explanation:
      'Matrix multiplication is associative (`(AB)C == A(BC)`), but parenthesization drastically changes operation count (`A: 10x30, B: 30x5, C: 5x60`: `(AB)C = 4500`, `A(BC) = 27000`). Let `dp[i][j]` be min cost to multiply matrices `i..j`; try every split point `k` (`i <= k < j`): `dp[i][j] = min(dp[i][k] + dp[k+1][j] + dims[i-1]*dims[k]*dims[j])`.',
    realWorldAnalogy:
      'Grouping database joins or matrix pipelines so intermediate tables/matrices stay as small as possible.',
    algorithm:
      '1. `dp[i][i] = 0` for `1 <= i < N`.\n2. Loop chain length `L = 2 .. N - 1`:\n   - For `i = 1 .. N - L`, `j = i + L - 1`:\n     - `dp[i][j] = INF`; for `k = i .. j - 1`: minimize `dp[i][k] + dp[k+1][j] + dims[i-1]*dims[k]*dims[j]`.\n3. Return `dp[1][N - 1]`.',
    pseudocode: `for L from 2 to N - 1:
    for i from 1 to N - L:
        j <- i + L - 1; dp[i][j] <- INF
        for k from i to j - 1:
            dp[i][j] <- min(dp[i][j], dp[i][k] + dp[k+1][j] + dims[i-1]*dims[k]*dims[j])`,
    dryRunExample:
      '`dims = [40, 20, 30, 10, 30]`: optimal cost `dp[1][4] = 26000`.',
    timeComplexity: '`O(N^3)`',
    spaceComplexity: '`O(N^2)`',
    commonMistakes: [
      'Looping `i` and `j` in standard row-major order instead of increasing **interval length `L`** (reads uncomputed `dp[k+1][j]`).',
    ],
    interviewTips: [
      'MCM is the archetype of **Interval DP** (Burst Balloons, Palindrome Partitioning II, Minimum Cost to Cut a Stick).',
    ],
    implementations: {
      c: `#include <limits.h>\nint matrixChainOrder(const int d[], int n) {\n    int dp[105][105] = {0};\n    for (int L = 2; L < n; L++) for (int i = 1; i <= n - L; i++) {\n        int j = i + L - 1; dp[i][j] = INT_MAX;\n        for (int k = i; k < j; k++) {\n            int cost = dp[i][k] + dp[k+1][j] + d[i-1] * d[k] * d[j];\n            if (cost < dp[i][j]) dp[i][j] = cost;\n        }\n    }\n    return dp[1][n - 1];\n}`,
      cpp: `#include <algorithm>\n#include <climits>\n#include <vector>\nint matrixChainOrder(const std::vector<int>& d) {\n    int n = static_cast<int>(d.size()); std::vector<std::vector<int>> dp(n, std::vector<int>(n, 0));\n    for (int L = 2; L < n; ++L) for (int i = 1; i <= n - L; ++i) {\n        int j = i + L - 1; dp[i][j] = INT_MAX;\n        for (int k = i; k < j; ++k) dp[i][j] = std::min(dp[i][j], dp[i][k] + dp[k+1][j] + d[i-1] * d[k] * d[j]);\n    }\n    return dp[1][n - 1];\n}`,
      java: `public class MCM {\n    public static int matrixChainOrder(int[] d) {\n        int n = d.length; int[][] dp = new int[n][n];\n        for (int L = 2; L < n; L++) for (int i = 1; i <= n - L; i++) {\n            int j = i + L - 1; dp[i][j] = Integer.MAX_VALUE;\n            for (int k = i; k < j; k++) dp[i][j] = Math.min(dp[i][j], dp[i][k] + dp[k+1][j] + d[i-1] * d[k] * d[j]);\n        }\n        return dp[1][n - 1];\n    }\n}`,
      python: `def matrix_chain_order(d: list[int]) -> int:\n    n = len(d); dp = [[0] * n for _ in range(n)]\n    for L in range(2, n):\n        for i in range(1, n - L + 1):\n            j = i + L - 1\n            dp[i][j] = min(dp[i][k] + dp[k+1][j] + d[i-1] * d[k] * d[j] for k in range(i, j))\n    return dp[1][n - 1]`,
    },
  },
  {
    topicSlug: 'interval-dp',
    title: 'Interval DP Pattern (Burst Balloons & Range DP)',
    definition:
      '**Interval DP** computes `dp[l][r]` for every contiguous subarray `[l..r]` by iterating in increasing order of interval length `len = r - l + 1` and splitting at every intermediate pivot `k`.',
    explanation:
      'In problems like **Burst Balloons** (LeetCode 312), bursting balloon `k` *first* creates dependent neighbors, whereas thinking **last** ("suppose `k` is the **last** balloon burst in `(l, r)`") makes subproblems `(l, k)` and `(k, r)` completely independent because `nums[l]` and `nums[r]` remain intact as boundaries!',
    realWorldAnalogy:
      'Solving a puzzle over a range `[l..r]` by deciding which piece is placed **last**, cleanly splitting `[l..r]` into two independent sub-ranges.',
    algorithm:
      '1. Pad array with `1` at both ends (`A[0] = A[n+1] = 1`).\n2. Loop `len = 1 .. n`, `l = 1 .. n - len + 1`, `r = l + len - 1`.\n3. For `k = l .. r`: `dp[l][r] = max(dp[l][r], dp[l][k-1] + A[l-1]*A[k]*A[r+1] + dp[k+1][r])`.',
    pseudocode: `for len from 1 to n:
    for l from 1 to n - len + 1:
        r <- l + len - 1
        for k from l to r:
            dp[l][r] <- max(dp[l][r], dp[l][k-1] + A[l-1]*A[k]*A[r+1] + dp[k+1][r])`,
    dryRunExample:
      'Burst Balloons `[3, 1, 5, 8]`: padded `[1, 3, 1, 5, 8, 1]` -> optimal coins `167`.',
    timeComplexity: '`O(N^3)`',
    spaceComplexity: '`O(N^2)`',
    commonMistakes: [
      'Trying to split on the *first* action instead of the *last* action in Burst Balloons.',
    ],
    interviewTips: [
      'Whenever subproblems seem coupled when choosing the first step, flip perspective to choosing the **last** step!',
    ],
    implementations: {
      c: `int maxCoins(const int nums[], int n) {\n    int a[305], dp[305][305] = {0}; a[0] = a[n + 1] = 1;\n    for (int i = 0; i < n; i++) a[i + 1] = nums[i];\n    for (int len = 1; len <= n; len++) for (int l = 1; l <= n - len + 1; l++) {\n        int r = l + len - 1;\n        for (int k = l; k <= r; k++) {\n            int v = dp[l][k - 1] + a[l - 1] * a[k] * a[r + 1] + dp[k + 1][r];\n            if (v > dp[l][r]) dp[l][r] = v;\n        }\n    }\n    return dp[1][n];\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nint maxCoins(const std::vector<int>& nums) {\n    int n = static_cast<int>(nums.size()); std::vector<int> a(n + 2, 1);\n    for (int i = 0; i < n; ++i) a[i + 1] = nums[i];\n    std::vector<std::vector<int>> dp(n + 2, std::vector<int>(n + 2, 0));\n    for (int len = 1; len <= n; ++len) for (int l = 1; l <= n - len + 1; ++l) {\n        int r = l + len - 1;\n        for (int k = l; k <= r; ++k) dp[l][r] = std::max(dp[l][r], dp[l][k - 1] + a[l - 1] * a[k] * a[r + 1] + dp[k + 1][r]);\n    }\n    return dp[1][n];\n}`,
      java: `public class BurstBalloons {\n    public static int maxCoins(int[] nums) {\n        int n = nums.length; int[] a = new int[n + 2]; a[0] = a[n + 1] = 1;\n        System.arraycopy(nums, 0, a, 1, n); int[][] dp = new int[n + 2][n + 2];\n        for (int len = 1; len <= n; len++) for (int l = 1; l <= n - len + 1; l++) {\n            int r = l + len - 1;\n            for (int k = l; k <= r; k++) dp[l][r] = Math.max(dp[l][r], dp[l][k-1] + a[l-1]*a[k]*a[r+1] + dp[k+1][r]);\n        }\n        return dp[1][n];\n    }\n}`,
      python: `def max_coins(nums: list[int]) -> int:\n    n = len(nums); a = [1] + nums + [1]\n    dp = [[0] * (n + 2) for _ in range(n + 2)]\n    for length in range(1, n + 1):\n        for l in range(1, n - length + 2):\n            r = l + length - 1\n            dp[l][r] = max(dp[l][k-1] + a[l-1]*a[k]*a[r+1] + dp[k+1][r] for k in range(l, r + 1))\n    return dp[1][n]`,
    },
  },
  {
    topicSlug: 'tree-dp-basics',
    title: 'Tree DP Basics (House Robber III)',
    definition:
      '**Tree DP** computes optimal values on a tree bottom-up via postorder DFS, returning a small tuple of states (e.g. `[includeNode, excludeNode]`) from each subtree.',
    explanation:
      'In **House Robber III** (rob nodes on a binary tree without robbing directly connected parent-child pairs), each node returns `{robThis, skipThis}`:\n- `robThis = node.val + left.skip + right.skip`.\n- `skipThis = max(left.rob, left.skip) + max(right.rob, right.skip)`.',
    realWorldAnalogy:
      'Selecting an optimal committee from an org chart where no direct manager and subordinate can both serve.',
    algorithm:
      '1. `dfs(node)` returns `(rob, skip)`.\n2. Base: `null` -> `(0, 0)`.\n3. Combine `(lRob, lSkip)` and `(rRob, rSkip)` in `O(1)`.\n4. Final answer = `max(rootResult.rob, rootResult.skip)`.',
    pseudocode: `dfs(node):
    if node == null: return (0, 0)
    (lRob, lSkip) <- dfs(node.left)
    (rRob, rSkip) <- dfs(node.right)
    rob <- node.val + lSkip + rSkip
    skip <- max(lRob, lSkip) + max(rRob, rSkip)
    return (rob, skip)`,
    dryRunExample:
      'Tree `3 -> (2 -> (null, 3), 3 -> (null, 1))`: robbing `3 + 3 + 1 = 7` beats `2 + 3 = 5`.',
    timeComplexity: '`O(N)`',
    spaceComplexity: '`O(H)` recursion stack',
    commonMistakes: [
      'Assuming `skipThis` must pick `lRob + rRob` (you are allowed to skip BOTH parent and child -> `max(lRob, lSkip)`!).',
    ],
    interviewTips: [
      'Diameter, Maximum Path Sum, and Binary Tree Cameras are all Tree DP!',
    ],
    implementations: {
      c: `// Return struct { int rob, skip; } from postorder DFS`,
      cpp: `#include <algorithm>\n#include <utility>\nstd::pair<int,int> robTreeDfs(TreeNode* r) {\n    if (!r) return {0, 0};\n    auto [lr, ls] = robTreeDfs(r->left); auto [rr, rs] = robTreeDfs(r->right);\n    return {r->val + ls + rs, std::max(lr, ls) + std::max(rr, rs)};\n}`,
      java: `public class TreeDP {\n    public static int rob(TreeNode root) { int[] r = dfs(root); return Math.max(r[0], r[1]); }\n    private static int[] dfs(TreeNode n) {\n        if (n == null) return new int[]{0, 0};\n        int[] l = dfs(n.left), r = dfs(n.right);\n        return new int[]{n.val + l[1] + r[1], Math.max(l[0], l[1]) + Math.max(r[0], r[1])};\n    }\n}`,
      python: `def rob_tree(root: TreeNode | None) -> int:\n    def dfs(n: TreeNode | None) -> tuple[int, int]:\n        if not n: return (0, 0)\n        lr, ls = dfs(n.left); rr, rs = dfs(n.right)\n        return (n.val + ls + rs, max(lr, ls) + max(rr, rs))\n    return max(dfs(root))`,
    },
  },
  {
    topicSlug: 'digit-dp-intro',
    title: 'Digit DP Introduction',
    definition:
      '**Digit DP** counts integers in `[L, R]` (up to `10^18` or `10^100`) satisfying digit-level constraints by building numbers digit-by-digit from most-significant to least-significant with a `tight` bound flag.',
    explanation:
      'Use `solve(R) - solve(L - 1)`. At digit position `pos`: if `tight == true`, the next digit `d` is capped at `num[pos]`; otherwise `d` ranges freely over `0..9`. Memoize **only** when `tight == false` (or include `tight` in the DP key), along with `started` (to ignore leading zeros) and problem-specific state (e.g. `digitSum`, `mask`).',
    realWorldAnalogy:
      'Counting valid license plates below a serial number by filling slots left-to-right and tracking whether you’re still hugging the upper limit.',
    algorithm:
      '1. Convert `N` to string `s`.\n2. `dfs(pos, tight, state)`:\n   - If `pos == len(s)`, return `isValid(state)`.\n   - `limit = tight ? (s[pos] - \'0\') : 9`.\n   - Sum `dfs(pos + 1, tight && (d == limit), nextState)` for `d = 0..limit`.',
    pseudocode: `dfs(pos, tight, sum):
    if pos == len(s): return 1 if valid(sum) else 0
    if not tight and memo[pos][sum] != -1: return memo[pos][sum]
    limit <- int(s[pos]) if tight else 9
    ans <- 0
    for d from 0 to limit:
        ans <- ans + dfs(pos + 1, tight and d == limit, sum + d)
    if not tight: memo[pos][sum] <- ans
    return ans`,
    dryRunExample:
      'Counting numbers `<= 25` with digit sum `5`: `05, 14, 23` -> `3`.',
    timeComplexity: '`O(D * 10 * |state|)` where `D` is number of digits (`<= 19`)',
    spaceComplexity: '`O(D * |state|)`',
    commonMistakes: [
      'Memoizing `tight == true` states globally across both `R` and `L - 1` without resetting `memo`!',
    ],
    interviewTips: [
      'Resetting `memo` is unnecessary across test cases if you ONLY memoize `tight == false` states!',
    ],
    implementations: {},
  },
  {
    topicSlug: 'bitmask-dp-intro',
    title: 'Bitmask DP Introduction (TSP / Assignment)',
    definition:
      '**Bitmask DP** uses an integer `mask` of `N` bits (`0 .. 2^N - 1`) to represent which subset of `N` items/cities (`N <= 20`) has been visited or assigned.',
    explanation:
      'Classic example — **Traveling Salesperson Problem (TSP)**: `dp[mask][u]` = minimum cost to visit subset `mask` ending at city `u`. Start at `dp[1][0] = 0`, transition `dp[mask | (1 << v)][v] = min(..., dp[mask][u] + dist[u][v])` for every unvisited `v` (`!(mask & (1 << v))`).',
    realWorldAnalogy:
      'A delivery driver with `N <= 15` stops tracking which stops are checked off on an `N`-bit checklist and which stop they’re currently at.',
    algorithm:
      '1. `dp[(1 << N)][N] = INF`, `dp[1][0] = 0`.\n2. For `mask = 1 .. (1 << N) - 1`, `u = 0 .. N - 1`:\n   - If `dp[mask][u] == INF`, continue.\n   - For `v = 0 .. N - 1`: if `!(mask & (1 << v))`, relax `dp[mask | (1 << v)][v]`.\n3. Answer = `min(dp[(1 << N) - 1][u] + dist[u][0])`.',
    pseudocode: `dp[1][0] <- 0
for mask in 1..(1<<N)-1:
    for u in 0..N-1:
        if dp[mask][u] < INF:
            for v in 0..N-1:
                if not (mask & (1 << v)):
                    dp[mask | (1 << v)][v] <- min(..., dp[mask][u] + cost[u][v])`,
    dryRunExample:
      'For `N = 4` cities, `2^4 = 16` masks x `4` cities = `64` DP states (instead of `4! = 24`, and for `N = 15`: `32768 * 15` vs `15! = 1.3 * 10^12`).',
    timeComplexity: '`O(2^N * N^2)` (or `O(2^N * N)` for assignment without last-city dependency)',
    spaceComplexity: '`O(2^N * N)`',
    commonMistakes: [
      'Using `1 << N` with `int` when `N >= 31` (though `2^N` is already only feasible for `N <= 20`).',
    ],
    interviewTips: [
      'Spot Bitmask DP immediately whenever constraints say **`N <= 15` or `N <= 20`**!',
    ],
    implementations: {},
  },
];

export default module21DpNotes;
