// Rich original learning notes for Module 19: Greedy Algorithms (11 concepts)

const module19GreedyNotes = [
  {
    topicSlug: 'greedy-strategy',
    title: 'Greedy Algorithm Strategy',
    definition:
      'A **greedy algorithm** builds a solution step by step by always picking the locally optimal choice at each decision point, hoping those local choices lead to a globally optimal solution.',
    explanation:
      'Unlike Dynamic Programming (which evaluates all overlapping subproblems) or Backtracking (which explores and undoes choices), a greedy algorithm **never reconsiders** a choice once made. Greedy works only when two properties hold: the **Greedy Choice Property** and **Optimal Substructure**. When greedy fails (e.g., arbitrary coin denominations `[1, 3, 4]` for target `6`: greedy picks `4+1+1 = 3` coins, optimal is `3+3 = 2`), you must use DP.',
    realWorldAnalogy:
      'Making change with standard US/Indian currency coins (`25, 10, 5, 1`): repeatedly picking the largest coin that fits (`<= remaining`) always yields the minimum number of coins.',
    algorithm:
      '1. Sort or order candidates by a greedy criterion (e.g., earliest finish time, highest value/weight ratio).\n2. Iterate through candidates.\n3. If candidate is feasible with the current partial solution, include it and never backtrack.\n4. Return the accumulated solution.',
    pseudocode: `sort candidates by greedyKey
ans <- empty
for item in candidates:
    if isFeasible(ans, item):
        ans.add(item)
return ans`,
    dryRunExample:
      '- **Works:** Standard coin change `[1, 5, 10, 25]` for `30` -> `25 + 5` (2 coins).\n- **Fails:** Non-canonical coins `[1, 3, 4]` for `6` -> greedy gives `4+1+1` (3 coins), DP gives `3+3` (2 coins).',
    timeComplexity: 'Typically `O(N log N)` due to sorting + `O(N)` single pass',
    spaceComplexity: 'Usually `O(1)` to `O(N)`',
    commonMistakes: [
      'Assuming a greedy heuristic is optimal without testing counterexamples on small inputs.',
      'Picking the wrong sort key (e.g., sorting intervals by start time instead of end time for Activity Selection).',
    ],
    interviewTips: [
      'Always try to construct a small 3-element counterexample before committing to a greedy rule in an interview.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'greedy-choice-property',
    title: 'Greedy Choice Property & Exchange Argument',
    definition:
      'A problem has the **Greedy Choice Property** if a globally optimal solution can always be reached by making a locally optimal (greedy) choice first, without needing to solve subproblems beforehand.',
    explanation:
      'How do you **prove** a greedy algorithm is correct? Use an **Exchange Argument**: take an arbitrary optimal solution `OPT`, compare its first choice with the greedy choice `g`, and show you can swap `g` into `OPT` without worsening the objective and without violating feasibility. Repeating this transforms `OPT` into the greedy solution.',
    realWorldAnalogy:
      'If any valid schedule starts with a meeting ending later than the earliest-ending meeting `g`, replacing that first meeting with `g` leaves strictly more time for all remaining meetings.',
    algorithm:
      'Exchange Argument Template:\n1. Let `OPT` be an optimal solution that differs from greedy `G` at the first decision.\n2. Show replacing `OPT[0]` with `G[0]` keeps the solution valid and at least as good.\n3. By induction on the remaining subproblem (Optimal Substructure), `G` is optimal.',
    pseudocode: `// Proof skeleton:
// 1. OPT exists.
// 2. If OPT[0] != greedyChoice:
//      OPT' = (OPT \\ {OPT[0]}) U {greedyChoice}
//      Show cost(OPT') <= cost(OPT) and OPT' is feasible.`,
    dryRunExample:
      'In Activity Selection, if `OPT` starts with activity `A` (`end(A) >= end(g)`), swapping `A -> g` keeps all subsequent activities non-overlapping because `end(g) <= end(A) <= start(next)`.',
    timeComplexity: 'Proof technique (`O(N log N)` for resulting greedy algorithms)',
    spaceComplexity: '`O(1)`',
    commonMistakes: [
      'Confusing **Optimal Substructure** (shared by both DP and Greedy) with **Greedy Choice Property** (unique to Greedy).',
    ],
    interviewTips: [
      'Mentioning "by an exchange argument, picking the earliest finish time never hurts future choices" signals strong algorithmic maturity.',
    ],
    implementations: {},
  },
  {
    topicSlug: 'activity-selection',
    title: 'Activity Selection Problem',
    definition:
      'Given `N` activities with `(start[i], end[i])` times, select the **maximum number** of mutually non-overlapping activities that a single person/machine can perform.',
    explanation:
      'Sorting by **earliest finish time** (`end[i]`) frees the resource as early as possible, leaving the maximum remaining time for future activities. After picking an activity finishing at `lastEnd`, greedily pick the next activity with `start[i] >= lastEnd` (or `>` depending on inclusive endpoints).',
    realWorldAnalogy:
      'Booking the maximum number of talks in one conference room by always choosing the next available talk that ends soonest.',
    algorithm:
      '1. Pair `(start[i], end[i])` and sort ascending by `end`.\n2. Pick the first activity (`count = 1`, `lastEnd = act[0].end`).\n3. For `i = 1 .. N - 1`:\n   - If `act[i].start >= lastEnd`: `count++`, `lastEnd = act[i].end`.\n4. Return `count`.',
    pseudocode: `sort activities by end ascending
count <- 1, lastEnd <- activities[0].end
for i from 1 to n - 1:
    if activities[i].start >= lastEnd:
        count <- count + 1
        lastEnd <- activities[i].end
return count`,
    dryRunExample:
      'Activities `[(1,2), (3,4), (0,6), (5,7), (8,9), (5,9)]` sorted by `end`: pick `(1,2)` (`lastEnd=2`), `(3,4)` (`lastEnd=4`), skip `(0,6)`, pick `(5,7)` (`lastEnd=7`), `(8,9)` (`lastEnd=9`) -> `4`.',
    timeComplexity: '`O(N log N)` for sorting + `O(N)` scan',
    spaceComplexity: '`O(1)` auxiliary (or `O(N)` to pair arrays)',
    commonMistakes: [
      'Sorting by `start` time or shortest duration (`end - start`), both of which fail on counterexamples.',
    ],
    interviewTips: [
      'This is the dual of LeetCode 435 (Non-overlapping Intervals): `minRemovals = N - maxNonOverlapping`.',
    ],
    implementations: {
      c: `#include <stdlib.h>\ntypedef struct { int s, e; } Act;\nstatic int cmpAct(const void* a, const void* b) { return ((const Act*)a)->e - ((const Act*)b)->e; }\nint activitySelection(Act a[], int n) {\n    if (n == 0) return 0;\n    qsort(a, n, sizeof(Act), cmpAct);\n    int count = 1, lastEnd = a[0].e;\n    for (int i = 1; i < n; i++) if (a[i].s >= lastEnd) { count++; lastEnd = a[i].e; }\n    return count;\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\nint activitySelection(vector<pair<int,int>>& acts) {\n    if (acts.empty()) return 0;\n    sort(acts.begin(), acts.end(), [](auto& a, auto& b) { return a.second < b.second; });\n    int count = 1, lastEnd = acts[0].second;\n    for (size_t i = 1; i < acts.size(); ++i) {\n        if (acts[i].first >= lastEnd) { ++count; lastEnd = acts[i].second; }\n    }\n    return count;\n}`,
      java: `import java.util.*;\npublic class ActivitySelection {\n    public static int maxActivities(int[][] acts) {\n        if (acts.length == 0) return 0;\n        Arrays.sort(acts, Comparator.comparingInt(a -> a[1]));\n        int count = 1, lastEnd = acts[0][1];\n        for (int i = 1; i < acts.length; i++) {\n            if (acts[i][0] >= lastEnd) { count++; lastEnd = acts[i][1]; }\n        }\n        return count;\n    }\n}`,
      python: `def activity_selection(acts: list[tuple[int, int]]) -> int:\n    if not acts: return 0\n    acts.sort(key=lambda x: x[1])\n    count, last_end = 1, acts[0][1]\n    for s, e in acts[1:]:\n        if s >= last_end:\n            count += 1\n            last_end = e\n    return count`,
    },
  },
  {
    topicSlug: 'fractional-knapsack',
    title: 'Fractional Knapsack',
    definition:
      'Given `N` items with `(value[i], weight[i])` and a knapsack capacity `W`, maximize total value when you are allowed to take **fractions** of items.',
    explanation:
      'Because items can be split arbitrarily, every kilogram of capacity should be filled with the highest **value-per-unit-weight** (`value[i] / weight[i]`) available. Sort items descending by `value / weight`, take whole items while capacity permits, and take a fraction of the last fitting item.',
    realWorldAnalogy:
      'Filling a backpack with gold dust, silver dust, and copper dust up to `W` kg: always scoop the most valuable metal per kg first.',
    algorithm:
      '1. Sort items descending by `value[i] / (double)weight[i]`.\n2. Initialize `totalVal = 0.0`, `rem = W`.\n3. For each item:\n   - If `item.weight <= rem`: `totalVal += item.value`, `rem -= item.weight`.\n   - Else: `totalVal += item.value * (rem / (double)item.weight)`; `break`.',
    pseudocode: `sort items descending by value / weight
totalVal <- 0.0, rem <- W
for item in items:
    if item.weight <= rem:
        totalVal <- totalVal + item.value
        rem <- rem - item.weight
    else:
        totalVal <- totalVal + item.value * (rem / item.weight)
        break
return totalVal`,
    dryRunExample:
      'Items `[(60,10), (100,20), (120,30)]`, `W = 50`. Ratios `6, 5, 4`:\nTake `(60,10)` (`rem=40`), `(100,20)` (`rem=20`), and `20/30` of `(120,30)` (`+80`) -> `240.0`.',
    timeComplexity: '`O(N log N)` for sorting',
    spaceComplexity: '`O(1)` auxiliary',
    commonMistakes: [
      'Using `0/1 Knapsack` DP when fractions are allowed, or using greedy `value/weight` for `0/1 Knapsack` (where greedy FAILS!).',
      'Integer division `val / wt` instead of floating-point comparison `(double)val / wt` or cross-multiplication.',
    ],
    interviewTips: [
      'Contrast **Fractional Knapsack** (Greedy `O(N log N)`) with **0/1 Knapsack** (DP `O(N * W)`).',
    ],
    implementations: {
      c: `#include <stdlib.h>\ntypedef struct { int v, w; } Item;\nstatic int cmpRatio(const void* a, const void* b) {\n    const Item *x = a, *y = b;\n    double r1 = (double)x->v / x->w, r2 = (double)y->v / y->w;\n    return (r2 > r1) - (r2 < r1);\n}\ndouble fractionalKnapsack(Item it[], int n, int W) {\n    qsort(it, n, sizeof(Item), cmpRatio);\n    double total = 0.0; int rem = W;\n    for (int i = 0; i < n && rem > 0; i++) {\n        if (it[i].w <= rem) { total += it[i].v; rem -= it[i].w; }\n        else { total += it[i].v * ((double)rem / it[i].w); rem = 0; }\n    }\n    return total;\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\nstruct Item { int v, w; };\ndouble fractionalKnapsack(vector<Item>& items, int W) {\n    sort(items.begin(), items.end(), [](const Item& a, const Item& b) {\n        return static_cast<long long>(a.v) * b.w > static_cast<long long>(b.v) * a.w;\n    });\n    double total = 0.0; int rem = W;\n    for (const auto& it : items) {\n        if (it.w <= rem) { total += it.v; rem -= it.w; }\n        else { total += it.v * (static_cast<double>(rem) / it.w); break; }\n    }\n    return total;\n}`,
      java: `import java.util.*;\npublic class FractionalKnapsack {\n    public static double maxVal(int[][] items, int W) {\n        Arrays.sort(items, (a, b) -> Long.compare((long) b[0] * a[1], (long) a[0] * b[1]));\n        double total = 0.0; int rem = W;\n        for (int[] it : items) {\n            if (it[1] <= rem) { total += it[0]; rem -= it[1]; }\n            else { total += it[0] * ((double) rem / it[1]); break; }\n        }\n        return total;\n    }\n}`,
      python: `def fractional_knapsack(items: list[tuple[int, int]], w_cap: int) -> float:\n    items.sort(key=lambda x: x[0] / x[1], reverse=True)\n    total, rem = 0.0, w_cap\n    for v, w in items:\n        if w <= rem:\n            total += v; rem -= w\n        else:\n            total += v * (rem / w); break\n    return total`,
    },
  },
  {
    topicSlug: 'job-sequencing-with-deadlines',
    title: 'Job Sequencing with Deadlines',
    definition:
      'Given `N` unit-time jobs each with `(deadline[i], profit[i])`, schedule a subset of jobs (at most one per time slot `1..maxDeadline`) to maximize total profit.',
    explanation:
      'Sort jobs descending by **profit**. For each job, schedule it in the **latest** free slot `<= deadline[i]` so earlier slots remain open for tighter-deadline jobs. A simple loop checks `slot` from `min(maxD, deadline[i])` down to `1`, or Disjoint Set Union (DSU) finds the latest free slot in `O(alpha(D))` amortized time.',
    realWorldAnalogy:
      'Doing the highest-paying freelance tasks right before their respective due dates so you keep earlier days free for urgent tasks.',
    algorithm:
      '1. Sort jobs descending by `profit`.\n2. Find `maxD = max(deadline)` and allocate `slot[1..maxD] = -1`.\n3. For each job `(d, p)`:\n   - Loop `t` from `d` down to `1`: if `slot[t] == -1`, assign `slot[t] = job.id`, `profit += p`, `count++`, `break`.',
    pseudocode: `sort jobs descending by profit
slot[1..maxD] <- -1, totalProfit <- 0
for (id, d, p) in jobs:
    for t from d down to 1:
        if slot[t] == -1:
            slot[t] <- id; totalProfit <- totalProfit + p; break
return totalProfit`,
    dryRunExample:
      'Jobs `[(d=4,p=20), (d=1,p=10), (d=1,p=40), (d=1,p=30)]` sorted by profit `[40(1), 30(1), 20(4), 10(1)]`: `40` takes slot `1`, `30` cannot fit, `20` takes slot `4` -> total profit `60`.',
    timeComplexity: '`O(N log N + N * maxD)` with array scan; `O(N log N)` with DSU',
    spaceComplexity: '`O(maxD)`',
    commonMistakes: [
      'Scheduling at the earliest slot `1` instead of the latest available slot `<= d` (blocks tighter-deadline jobs!).',
    ],
    interviewTips: [
      'Mention the **DSU optimization** (`parent[t] = find(t - 1)`) if `N` and `maxD` are up to `10^5`.',
    ],
    implementations: {
      c: `#include <stdlib.h>\ntypedef struct { int id, d, p; } Job;\nstatic int cmpJob(const void* a, const void* b) { return ((const Job*)b)->p - ((const Job*)a)->p; }\nint jobSequencing(Job jobs[], int n) {\n    qsort(jobs, n, sizeof(Job), cmpJob);\n    int maxD = 0; for (int i = 0; i < n; i++) if (jobs[i].d > maxD) maxD = jobs[i].d;\n    int* slot = calloc(maxD + 1, sizeof(int));\n    int total = 0;\n    for (int i = 0; i < n; i++) {\n        for (int t = jobs[i].d; t >= 1; t--) {\n            if (!slot[t]) { slot[t] = 1; total += jobs[i].p; break; }\n        }\n    }\n    free(slot); return total;\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\nstruct Job { int id, d, p; };\nint jobSequencing(vector<Job>& jobs) {\n    sort(jobs.begin(), jobs.end(), [](const Job& a, const Job& b) { return a.p > b.p; });\n    int maxD = 0; for (auto& j : jobs) maxD = max(maxD, j.d);\n    vector<bool> used(maxD + 1, false);\n    int total = 0;\n    for (const auto& j : jobs) {\n        for (int t = j.d; t >= 1; --t) {\n            if (!used[t]) { used[t] = true; total += j.p; break; }\n        }\n    }\n    return total;\n}`,
      java: `import java.util.*;\npublic class JobSequencing {\n    public static int maxProfit(int[][] jobs) {\n        Arrays.sort(jobs, (a, b) -> b[2] - a[2]);\n        int maxD = 0; for (int[] j : jobs) maxD = Math.max(maxD, j[1]);\n        boolean[] used = new boolean[maxD + 1];\n        int total = 0;\n        for (int[] j : jobs) {\n            for (int t = j[1]; t >= 1; t--) {\n                if (!used[t]) { used[t] = true; total += j[2]; break; }\n            }\n        }\n        return total;\n    }\n}`,
      python: `def job_sequencing(jobs: list[tuple[int, int, int]]) -> int:\n    jobs.sort(key=lambda x: x[2], reverse=True)\n    max_d = max((j[1] for j in jobs), default=0)\n    used = [False] * (max_d + 1)\n    total = 0\n    for _, d, p in jobs:\n        for t in range(d, 0, -1):\n            if not used[t]:\n                used[t] = True; total += p; break\n    return total`,
    },
  },
  {
    topicSlug: 'meeting-room-scheduling',
    title: 'Meeting Room Scheduling (I & II)',
    definition:
      'Meeting Rooms I checks if one person can attend all meetings (no overlaps); Meeting Rooms II finds the **minimum number of conference rooms** required to host all meetings.',
    explanation:
      'Sort meetings by `start` time. For Meeting Rooms II, maintain a **Min-Heap** of active meeting `end` times. For each meeting `(s, e)`, if the earliest-ending room finishes before or at `s` (`minHeap.peek() <= s`), reuse that room (`pop()`), then push `e`. The heap size at the end (or `max` heap size) is the minimum rooms needed. Equivalently, sort `starts[]` and `ends[]` separately and use two pointers.',
    realWorldAnalogy:
      'Assigning classrooms to lectures: whenever a new lecture starts, check the room whose current lecture finishes earliest; if it’s free, reuse it, otherwise open a new room.',
    algorithm:
      '1. Sort intervals by `start`.\n2. Create `minHeap` storing end times.\n3. For each `[s, e]`:\n   - If `!minHeap.empty() && minHeap.top() <= s`, `minHeap.pop()`.\n   - `minHeap.push(e)`.\n4. Return `minHeap.size()`.',
    pseudocode: `sort meetings by start
for (s, e) in meetings:
    if minHeap not empty and minHeap.top() <= s:
        minHeap.pop()
    minHeap.push(e)
return len(minHeap)`,
    dryRunExample:
      'Meetings `[[0,30], [5,10], [15,20]]`: push `30`, `5<30` -> push `10`, `15>=10` -> pop `10`, push `20` -> heap `[20, 30]` -> `2` rooms.',
    timeComplexity: '`O(N log N)`',
    spaceComplexity: '`O(N)`',
    commonMistakes: [
      'Using `<` instead of `<=` when comparing `minHeap.top() <= s` (a meeting ending at `10` frees the room for one starting at `10`).',
    ],
    interviewTips: [
      'The two-pointer `starts[]`/`ends[]` sweep-line variant is identical to **Minimum Platforms Required**.',
    ],
    implementations: {
      c: `// Sort starts[] and ends[] separately, sweep with two pointers i, j`,
      cpp: `#include <algorithm>\n#include <functional>\n#include <queue>\n#include <vector>\nusing namespace std;\nint minMeetingRooms(vector<vector<int>>& intervals) {\n    if (intervals.empty()) return 0;\n    sort(intervals.begin(), intervals.end());\n    priority_queue<int, vector<int>, greater<int>> pq;\n    for (auto& iv : intervals) {\n        if (!pq.empty() && pq.top() <= iv[0]) pq.pop();\n        pq.push(iv[1]);\n    }\n    return static_cast<int>(pq.size());\n}`,
      java: `import java.util.*;\npublic class MeetingRooms {\n    public static int minMeetingRooms(int[][] intervals) {\n        if (intervals.length == 0) return 0;\n        Arrays.sort(intervals, Comparator.comparingInt(a -> a[0]));\n        PriorityQueue<Integer> pq = new PriorityQueue<>();\n        for (int[] iv : intervals) {\n            if (!pq.isEmpty() && pq.peek() <= iv[0]) pq.poll();\n            pq.offer(iv[1]);\n        }\n        return pq.size();\n    }\n}`,
      python: `import heapq\ndef min_meeting_rooms(intervals: list[list[int]]) -> int:\n    intervals.sort(key=lambda x: x[0])\n    pq = []\n    for s, e in intervals:\n        if pq and pq[0] <= s:\n            heapq.heappop(pq)\n        heapq.heappush(pq, e)\n    return len(pq)`,
    },
  },
  {
    topicSlug: 'interval-merging',
    title: 'Merge Overlapping Intervals',
    definition:
      'Given an array of intervals `[start, end]`, merge all overlapping intervals and return the minimal list of mutually disjoint intervals.',
    explanation:
      'Sort intervals by `start` time. Maintain `merged` with the first interval. For each subsequent interval `[s, e]`, if `s <= merged.back()[1]`, it overlaps the previous interval, so extend `merged.back()[1] = max(merged.back()[1], e)`; otherwise append `[s, e]` as a new disjoint interval.',
    realWorldAnalogy:
      'Consolidating overlapping calendar blocks into continuous busy blocks.',
    algorithm:
      '1. Sort intervals by `start` ascending.\n2. Push `intervals[0]` to `merged`.\n3. For `i = 1 .. N - 1`:\n   - If `intervals[i].start <= merged.back().end`, update `merged.back().end = max(merged.back().end, intervals[i].end)`.\n   - Else append `intervals[i]`.',
    pseudocode: `sort intervals by start
merged <- [intervals[0]]
for [s, e] in intervals[1..]:
    if s <= merged.back()[1]:
        merged.back()[1] <- max(merged.back()[1], e)
    else:
        merged.append([s, e])
return merged`,
    dryRunExample:
      '`[[1,3], [2,6], [8,10], [15,18]]` -> `[1,3]` merges with `[2,6]` -> `[1,6]`, `[8,10]`, `[15,18]`.',
    timeComplexity: '`O(N log N)` for sorting + `O(N)` merge',
    spaceComplexity: '`O(N)` for output',
    commonMistakes: [
      'Setting `merged.back()[1] = e` instead of `max(merged.back()[1], e)` when an interval is completely nested inside the previous one (e.g., `[1, 10]` followed by `[2, 5]`).',
    ],
    interviewTips: [
      'Ask whether touching endpoints `[1,4]` and `[4,5]` count as overlapping (usually yes: `<=`).',
    ],
    implementations: {
      c: `// qsort by start, then linear scan merging when next.s <= last.e`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\nvector<vector<int>> mergeIntervals(vector<vector<int>>& iv) {\n    if (iv.empty()) return {};\n    sort(iv.begin(), iv.end());\n    vector<vector<int>> res{iv[0]};\n    for (size_t i = 1; i < iv.size(); ++i) {\n        if (iv[i][0] <= res.back()[1]) res.back()[1] = max(res.back()[1], iv[i][1]);\n        else res.push_back(iv[i]);\n    }\n    return res;\n}`,
      java: `import java.util.*;\npublic class MergeIntervals {\n    public static int[][] merge(int[][] iv) {\n        Arrays.sort(iv, Comparator.comparingInt(a -> a[0]));\n        List<int[]> res = new ArrayList<>();\n        res.add(iv[0]);\n        for (int i = 1; i < iv.length; i++) {\n            int[] last = res.get(res.size() - 1);\n            if (iv[i][0] <= last[1]) last[1] = Math.max(last[1], iv[i][1]);\n            else res.add(iv[i]);\n        }\n        return res.toArray(new int[0][]);\n    }\n}`,
      python: `def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:\n    intervals.sort(key=lambda x: x[0])\n    res = [intervals[0]]\n    for s, e in intervals[1:]:\n        if s <= res[-1][1]: res[-1][1] = max(res[-1][1], e)\n        else: res.append([s, e])\n    return res`,
    },
  },
  {
    topicSlug: 'non-overlapping-intervals',
    title: 'Non-Overlapping Intervals (Minimum Removals)',
    definition:
      'Given an array of intervals, find the **minimum number of intervals to remove** so that the remaining intervals are non-overlapping.',
    explanation:
      'Minimizing removals is equivalent to **maximizing kept non-overlapping intervals** (Activity Selection!). Sort by **end** time ascending: whenever `intervals[i].start < prevEnd`, it overlaps, so increment `removals` (implicitly discarding `intervals[i]` because its end is `>= prevEnd`); otherwise keep it and update `prevEnd = intervals[i].end`.',
    realWorldAnalogy:
      'Canceling the fewest overlapping meetings so your calendar has zero conflicts.',
    algorithm:
      '1. Sort intervals by `end` ascending.\n2. `prevEnd = intervals[0][1]`, `removals = 0`.\n3. For `i = 1 .. N - 1`:\n   - If `intervals[i][0] < prevEnd`, `removals++`.\n   - Else `prevEnd = intervals[i][1]`.\n4. Return `removals`.',
    pseudocode: `sort intervals by end ascending
prevEnd <- intervals[0][1], removals <- 0
for [s, e] in intervals[1..]:
    if s < prevEnd: removals <- removals + 1
    else: prevEnd <- e
return removals`,
    dryRunExample:
      '`[[1,2], [2,3], [3,4], [1,3]]` sorted by end: `[1,2], [2,3], [1,3], [3,4]`. `[1,3]` overlaps `[2,3]` -> `removals = 1`.',
    timeComplexity: '`O(N log N)`',
    spaceComplexity: '`O(1)` auxiliary',
    commonMistakes: [
      'Treating touching intervals `[1,2]` and `[2,3]` as overlapping (`<=` instead of `<`).',
    ],
    interviewTips: [
      'Minimum Arrows to Burst Balloons (LeetCode 452) uses the exact same sort-by-end greedy scan!',
    ],
    implementations: {
      c: `// Sort by end ascending, count intervals with start < prevEnd`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\nint eraseOverlapIntervals(vector<vector<int>>& iv) {\n    if (iv.empty()) return 0;\n    sort(iv.begin(), iv.end(), [](const auto& a, const auto& b) { return a[1] < b[1]; });\n    int prevEnd = iv[0][1], removals = 0;\n    for (size_t i = 1; i < iv.size(); ++i) {\n        if (iv[i][0] < prevEnd) ++removals;\n        else prevEnd = iv[i][1];\n    }\n    return removals;\n}`,
      java: `import java.util.*;\npublic class NonOverlapping {\n    public static int eraseOverlapIntervals(int[][] iv) {\n        if (iv.length == 0) return 0;\n        Arrays.sort(iv, Comparator.comparingInt(a -> a[1]));\n        int prevEnd = iv[0][1], removals = 0;\n        for (int i = 1; i < iv.length; i++) {\n            if (iv[i][0] < prevEnd) removals++;\n            else prevEnd = iv[i][1];\n        }\n        return removals;\n    }\n}`,
      python: `def erase_overlap_intervals(intervals: list[list[int]]) -> int:\n    if not intervals: return 0\n    intervals.sort(key=lambda x: x[1])\n    prev_end, removals = intervals[0][1], 0\n    for s, e in intervals[1:]:\n        if s < prev_end: removals += 1\n        else: prev_end = e\n    return removals`,
    },
  },
  {
    topicSlug: 'minimum-platforms',
    title: 'Minimum Platforms Required (Sweep-Line Two Pointers)',
    definition:
      'Given arrival and departure times of `N` trains, find the minimum number of railway platforms needed so no train ever waits.',
    explanation:
      'Sort `arr[]` and `dep[]` **independently**. Use two pointers `i` (arrivals) and `j` (departures) in a chronological sweep: if `arr[i] <= dep[j]`, a train arrives before the earliest departing train leaves, so `platforms++` and `i++`; otherwise a train departs, freeing a platform (`platforms--`, `j++`). Track `maxPlatforms`.',
    realWorldAnalogy:
      'Counting the peak number of people inside a venue over a day by sorting all entry timestamps and all exit timestamps and walking through events in time order.',
    algorithm:
      '1. Sort `arr` and `dep` ascending.\n2. `i = 0, j = 0, plat = 0, best = 0`.\n3. While `i < N`:\n   - If `arr[i] <= dep[j]`: `plat++`, `best = max(best, plat)`, `i++`.\n   - Else: `plat--`, `j++`.\n4. Return `best`.',
    pseudocode: `sort(arr); sort(dep)
i <- 0, j <- 0, plat <- 0, best <- 0
while i < n:
    if arr[i] <= dep[j]:
        plat <- plat + 1; best <- max(best, plat); i <- i + 1
    else:
        plat <- plat - 1; j <- j + 1
return best`,
    dryRunExample:
      '`arr = [900, 940, 950]`, `dep = [910, 1200, 1120]` -> sorted `dep = [910, 1120, 1200]`: `900(+1=1)`, `910(-1=0)`, `940(+1=1)`, `950(+1=2)` -> `2` platforms.',
    timeComplexity: '`O(N log N)`',
    spaceComplexity: '`O(1)` auxiliary (in-place sort)',
    commonMistakes: [
      'Sorting arrivals and departures together as pairs instead of independently—for peak concurrency, only event timestamps matter!',
      'Using `<` instead of `<=` when a train arrives at the exact minute another departs (needs 2 platforms).',
    ],
    interviewTips: [
      'This sweep-line technique is `O(1)` extra space compared to `O(N)` Min-Heap in Meeting Rooms II.',
    ],
    implementations: {
      c: `#include <stdlib.h>\nstatic int cmpIntP(const void* a, const void* b) { return *(const int*)a - *(const int*)b; }\nint findPlatform(int arr[], int dep[], int n) {\n    qsort(arr, n, sizeof(int), cmpIntP); qsort(dep, n, sizeof(int), cmpIntP);\n    int i = 0, j = 0, plat = 0, best = 0;\n    while (i < n) {\n        if (arr[i] <= dep[j]) { if (++plat > best) best = plat; i++; }\n        else { plat--; j++; }\n    }\n    return best;\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\nint findPlatform(vector<int>& arr, vector<int>& dep) {\n    sort(arr.begin(), arr.end()); sort(dep.begin(), dep.end());\n    int i = 0, j = 0, plat = 0, best = 0, n = static_cast<int>(arr.size());\n    while (i < n) {\n        if (arr[i] <= dep[j]) { best = max(best, ++plat); ++i; }\n        else { --plat; ++j; }\n    }\n    return best;\n}`,
      java: `import java.util.Arrays;\npublic class MinPlatforms {\n    public static int findPlatform(int[] arr, int[] dep) {\n        Arrays.sort(arr); Arrays.sort(dep);\n        int i = 0, j = 0, plat = 0, best = 0;\n        while (i < arr.length) {\n            if (arr[i] <= dep[j]) { best = Math.max(best, ++plat); i++; }\n            else { plat--; j++; }\n        }\n        return best;\n    }\n}`,
      python: `def find_platform(arr: list[int], dep: list[int]) -> int:\n    arr.sort(); dep.sort()\n    i = j = plat = best = 0\n    while i < len(arr):\n        if arr[i] <= dep[j]:\n            plat += 1; best = max(best, plat); i += 1\n        else:\n            plat -= 1; j += 1\n    return best`,
    },
  },
  {
    topicSlug: 'huffman-coding',
    title: 'Huffman Coding (Optimal Prefix Codes)',
    definition:
      'Huffman coding is a greedy lossless data-compression algorithm that assigns variable-length binary prefix codes to characters so frequent characters get shorter codes and no code is a prefix of another.',
    explanation:
      "Insert all `(freq, char)` nodes into a **Min-Heap**. Repeatedly pop the two lowest-frequency nodes `a` and `b`, merge them into an internal node with frequency `a.freq + b.freq`, and push it back. When one root remains, left edges get `'0'` and right edges get `'1'`.",
    realWorldAnalogy:
      'Morse code assigning short signals (`·`) to common letters like `E` and longer signals (`--··`) to rare letters like `Z`.',
    algorithm:
      '1. Push leaf nodes `(freq, ch)` into a Min-Heap.\n2. While `heap.size() > 1`:\n   - Pop `left` (min1) and `right` (min2).\n   - Create internal node `parent(left.freq + right.freq, left, right)` and push to heap.\n3. Traverse the final tree from root to assign `0` (left) and `1` (right) codes.',
    pseudocode: `pq <- MinHeap of all (freq, char) nodes
while len(pq) > 1:
    a <- pq.pop(); b <- pq.pop()
    pq.push(Node(a.freq + b.freq, left=a, right=b))
traverse(pq.pop(), "")`,
    dryRunExample:
      'Freqs `{a:5, b:9, c:12, d:13, e:16, f:45}`: merges `5+9=14`, `12+13=25`, `14+16=30`, `25+30=55`, `45+55=100` (`f` gets 1-bit code `0`).',
    timeComplexity: '`O(U log U)` where `U` is number of unique characters',
    spaceComplexity: '`O(U)` for heap and tree',
    commonMistakes: [
      'Forgetting the single-unique-character edge case (`heap.size() == 1` -> assign code `"0"`).',
    ],
    interviewTips: [
      'Notice the greedy merge pattern is identical to **Minimum Cost to Connect Ropes** (LeetCode 1167).',
    ],
    implementations: {
      c: `// Min-Heap of Huffman nodes; merge two smallest until 1 node remains`,
      cpp: `#include <queue>\n#include <string>\n#include <vector>\nusing namespace std;\nstruct HNode { int f; char c; HNode *l, *r; };\nstruct HCmp { bool operator()(HNode* a, HNode* b) { return a->f > b->f; } };\nHNode* buildHuffman(const vector<pair<char,int>>& freqs) {\n    priority_queue<HNode*, vector<HNode*>, HCmp> pq;\n    for (auto [c, f] : freqs) pq.push(new HNode{f, c, nullptr, nullptr});\n    while (pq.size() > 1) {\n        auto* a = pq.top(); pq.pop(); auto* b = pq.top(); pq.pop();\n        pq.push(new HNode{a->f + b->f, '\\0', a, b});\n    }\n    return pq.empty() ? nullptr : pq.top();\n}`,
      java: `import java.util.*;\npublic class HuffmanCoding {\n    static class Node { int f; char c; Node l, r; Node(int f, char c, Node l, Node r) { this.f=f; this.c=c; this.l=l; this.r=r; } }\n    public static Node build(char[] ch, int[] freq) {\n        PriorityQueue<Node> pq = new PriorityQueue<>(Comparator.comparingInt(n -> n.f));\n        for (int i = 0; i < ch.length; i++) pq.offer(new Node(freq[i], ch[i], null, null));\n        while (pq.size() > 1) {\n            Node a = pq.poll(), b = pq.poll();\n            pq.offer(new Node(a.f + b.f, '\\0', a, b));\n        }\n        return pq.poll();\n    }\n}`,
      python: `import heapq\ndef huffman_cost(freqs: list[int]) -> int:\n    h = freqs[:]\n    heapq.heapify(h)\n    cost = 0\n    while len(h) > 1:\n        merged = heapq.heappop(h) + heapq.heappop(h)\n        cost += merged\n        heapq.heappush(h, merged)\n    return cost`,
    },
  },
  {
    topicSlug: 'jump-game',
    title: 'Jump Game (I & II)',
    definition:
      'In Jump Game I, `nums[i]` is the maximum jump length from index `i`; determine if index `n - 1` is reachable. In Jump Game II, find the **minimum number of jumps** to reach `n - 1`.',
    explanation:
      '- **Jump Game I:** Track `maxReach`. At index `i`, if `i > maxReach`, return `false`; otherwise update `maxReach = max(maxReach, i + nums[i])`.\n- **Jump Game II (BFS-like Greedy):** Track the current jump’s window `[0..curEnd]` and `farthest` reachable from within it. When `i == curEnd`, increment `jumps` and set `curEnd = farthest`.',
    realWorldAnalogy:
      'Crossing stepping stones: you only need to know the farthest stone reachable so far, and in Jump Game II you only commit to a jump when you reach the edge of your current range.',
    algorithm:
      'Jump Game I:\n1. `maxReach = 0`.\n2. For `i = 0 .. n - 1`:\n   - If `i > maxReach`, return `false`.\n   - `maxReach = max(maxReach, i + nums[i])`.\n3. Return `true`.',
    pseudocode: `maxReach <- 0
for i from 0 to n - 1:
    if i > maxReach: return false
    maxReach <- max(maxReach, i + nums[i])
return true`,
    dryRunExample:
      '`nums = [2, 3, 1, 1, 4]` -> `i=0: maxReach=2`, `i=1: maxReach=4 >= 4` -> `true` (Jump Game II: `jumps=2`).',
    timeComplexity: '`O(N)` single pass',
    spaceComplexity: '`O(1)`',
    commonMistakes: [
      'Using `O(N^2)` DP when `O(N)` greedy suffices.',
      'In Jump Game II, looping `i` up to `n - 1` instead of `n - 2` (adds an extra jump when already at `n - 1`!).',
    ],
    interviewTips: [
      'Always mention both Jump Game I (reachability) and Jump Game II (minimum jumps via implicit BFS levels).',
    ],
    implementations: {
      c: `#include <stdbool.h>\nbool canJump(const int nums[], int n) {\n    int maxReach = 0;\n    for (int i = 0; i < n; i++) {\n        if (i > maxReach) return false;\n        if (i + nums[i] > maxReach) maxReach = i + nums[i];\n    }\n    return true;\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\nbool canJump(const vector<int>& nums) {\n    int maxReach = 0;\n    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {\n        if (i > maxReach) return false;\n        maxReach = max(maxReach, i + nums[i]);\n    }\n    return true;\n}`,
      java: `public class JumpGame {\n    public static boolean canJump(int[] nums) {\n        int maxReach = 0;\n        for (int i = 0; i < nums.length; i++) {\n            if (i > maxReach) return false;\n            maxReach = Math.max(maxReach, i + nums[i]);\n        }\n        return true;\n    }\n}`,
      python: `def can_jump(nums: list[int]) -> bool:\n    max_reach = 0\n    for i, step in enumerate(nums):\n        if i > max_reach: return False\n        max_reach = max(max_reach, i + step)\n    return True`,
    },
  },
];

export default module19GreedyNotes;
