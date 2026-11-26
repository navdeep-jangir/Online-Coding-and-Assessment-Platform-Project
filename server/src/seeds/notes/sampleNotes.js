const sampleNotes = [
  {
    topicSlug: 'binary-search-iterative',
    title: 'Binary Search (Iterative & Recursive)',
    definition:
      'Binary Search is an efficient divide-and-conquer searching algorithm that locates a target value within a sorted array by repeatedly halving the search interval.',
    explanation:
      'Instead of scanning elements one by one from left to right (linear search), binary search checks the middle element of the current range. If the middle element matches the target, we return its index immediately. If the target is smaller, we discard the entire right half; if larger, we discard the entire left half. This halves the problem size on every comparison.',
    realWorldAnalogy:
      'Looking up a word in a physical dictionary: you open near the middle, see if your word comes before or after that page, and immediately ignore the half where the word cannot be.',
    algorithm:
      '1. Initialize low = 0 and high = n - 1.\n2. While low <= high:\n   a. Compute mid = low + (high - low) / 2 to avoid integer overflow.\n   b. If arr[mid] == target, return mid.\n   c. If arr[mid] < target, set low = mid + 1.\n   d. Else set high = mid - 1.\n3. Return -1 if the loop ends without finding target.',
    pseudocode:
      'function binarySearch(arr, target):\n    low = 0, high = length(arr) - 1\n    while low <= high:\n        mid = low + (high - low) // 2\n        if arr[mid] == target: return mid\n        else if arr[mid] < target: low = mid + 1\n        else: high = mid - 1\n    return -1',
    dryRunExample:
      'arr = [2, 5, 8, 12, 16, 23], target = 16\nStep 1: low=0, high=5 -> mid=2 (arr[2]=8 < 16) -> low=3\nStep 2: low=3, high=5 -> mid=4 (arr[4]=16 == 16) -> return 4.',
    timeComplexity: 'O(log n) — The search space is halved in each iteration.',
    spaceComplexity: 'O(1) iterative; O(log n) recursive due to call stack frames.',
    commonMistakes: [
      'Using (low + high) / 2 instead of low + (high - low) / 2, which can overflow 32-bit signed integers.',
      'Using low < high instead of low <= high and missing single-element checks.',
      'Applying binary search on an unsorted array.',
    ],
    interviewTips: [
      'Always clarify whether the array may contain duplicates and whether first/last occurrence is needed.',
      'Binary search also works on monotonic answer spaces ("Binary Search on Answer").',
    ],
    implementations: {
      c: '#include <stdio.h>\n\nint binarySearch(int arr[], int n, int target) {\n    int low = 0, high = n - 1;\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (arr[mid] == target) return mid;\n        if (arr[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}',
      cpp: '#include <vector>\nusing namespace std;\n\nint binarySearch(const vector<int>& arr, int target) {\n    int low = 0, high = (int)arr.size() - 1;\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (arr[mid] == target) return mid;\n        if (arr[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}',
      java: 'public class BinarySearch {\n    public static int search(int[] arr, int target) {\n        int low = 0, high = arr.length - 1;\n        while (low <= high) {\n            int mid = low + (high - low) / 2;\n            if (arr[mid] == target) return mid;\n            if (arr[mid] < target) low = mid + 1;\n            else high = mid - 1;\n        }\n        return -1;\n    }\n}',
      python: 'def binary_search(arr: list[int], target: int) -> int:\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = low + (high - low) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1',
    },
    relatedProblemSlugs: ['binary-search', 'first-and-last-occurrence'],
  },
  {
    topicSlug: 'kadanes-algorithm',
    title: "Maximum Subarray Sum (Kadane's Algorithm)",
    definition:
      "Kadane's Algorithm is a linear-time dynamic programming technique that finds the contiguous subarray with the largest sum in a 1D array of numbers.",
    explanation:
      'At every index i, we decide whether it is better to extend the previous subarray (currentSum + arr[i]) or start a brand new subarray at arr[i]. If the running sum becomes negative, carrying it forward would only reduce future sums, so we reset it.',
    realWorldAnalogy:
      'Tracking your net profit streak over days: if your cumulative profit from previous days drops below zero, you are better off starting fresh from today rather than dragging past losses forward.',
    algorithm:
      '1. Initialize currentSum = arr[0] and maxSum = arr[0].\n2. Loop i from 1 to n - 1:\n   a. currentSum = max(arr[i], currentSum + arr[i]).\n   b. maxSum = max(maxSum, currentSum).\n3. Return maxSum.',
    pseudocode:
      'function kadane(arr):\n    currentSum = arr[0]\n    maxSum = arr[0]\n    for i from 1 to length(arr) - 1:\n        currentSum = max(arr[i], currentSum + arr[i])\n        maxSum = max(maxSum, currentSum)\n    return maxSum',
    dryRunExample:
      'arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4]\ncurrentSum evolves: -2 -> 1 -> -2 -> 4 -> 3 -> 5 -> 6 -> 1 -> 5\nmaxSum = 6 (subarray [4, -1, 2, 1]).',
    timeComplexity: 'O(n) — Single pass through the array.',
    spaceComplexity: 'O(1) — Only two scalar variables are maintained.',
    commonMistakes: [
      'Initializing maxSum = 0 when all elements in the array can be negative.',
      'Confusing subarray (contiguous) with subsequence (non-contiguous).',
    ],
    interviewTips: [
      'Mention that initializing with arr[0] handles all-negative arrays cleanly.',
      'Be ready to also return the start and end indices of the maximum subarray.',
    ],
    implementations: {
      c: 'int maxSubarraySum(int arr[], int n) {\n    int currentSum = arr[0], maxSum = arr[0];\n    for (int i = 1; i < n; i++) {\n        currentSum = (arr[i] > currentSum + arr[i]) ? arr[i] : currentSum + arr[i];\n        if (currentSum > maxSum) maxSum = currentSum;\n    }\n    return maxSum;\n}',
      cpp: '#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint maxSubarraySum(const vector<int>& arr) {\n    int currentSum = arr[0], maxSum = arr[0];\n    for (size_t i = 1; i < arr.size(); i++) {\n        currentSum = max(arr[i], currentSum + arr[i]);\n        maxSum = max(maxSum, currentSum);\n    }\n    return maxSum;\n}',
      java: 'public class Kadane {\n    public static int maxSubarraySum(int[] arr) {\n        int currentSum = arr[0], maxSum = arr[0];\n        for (int i = 1; i < arr.length; i++) {\n            currentSum = Math.max(arr[i], currentSum + arr[i]);\n            maxSum = Math.max(maxSum, currentSum);\n        }\n        return maxSum;\n    }\n}',
      python: 'def max_subarray_sum(arr: list[int]) -> int:\n    current_sum = max_sum = arr[0]\n    for x in arr[1:]:\n        current_sum = max(x, current_sum + x)\n        max_sum = max(max_sum, current_sum)\n    return max_sum',
    },
    relatedProblemSlugs: ['maximum-subarray-sum-kadanes'],
  },
  {
    topicSlug: 'two-sum-problem',
    title: 'Two Sum Problem Using Hashing',
    definition:
      'The Two Sum pattern finds two distinct elements in an array whose sum equals a given target in linear time using a hash map.',
    explanation:
      'While iterating through the array, for each element x we need its complement (target - x). Instead of scanning the rest of the array in O(n), we store previously seen values and their indices in a HashMap so we can check if the complement already exists in O(1) average time.',
    realWorldAnalogy:
      'Checking out at a store where you need exact change totaling $100: as you pull bills from your wallet, you check a tray of bills you already set aside to see if the exact missing amount is already there.',
    algorithm:
      '1. Create an empty HashMap seen (value -> index).\n2. For i from 0 to n - 1:\n   a. complement = target - arr[i].\n   b. If complement exists in seen, return [seen[complement], i].\n   c. Store seen[arr[i]] = i.\n3. Return [-1, -1] if no pair exists.',
    pseudocode:
      'function twoSum(arr, target):\n    seen = empty map\n    for i from 0 to length(arr) - 1:\n        comp = target - arr[i]\n        if comp in seen: return [seen[comp], i]\n        seen[arr[i]] = i\n    return [-1, -1]',
    dryRunExample:
      'arr = [2, 7, 11, 15], target = 9\ni=0: x=2, comp=7 not in seen -> seen={2:0}\ni=1: x=7, comp=2 in seen -> return [0, 1].',
    timeComplexity: 'O(n) average — Single pass with O(1) average hash map lookups.',
    spaceComplexity: 'O(n) — Hash map stores up to n elements.',
    commonMistakes: [
      'Inserting arr[i] into the map before checking for complement, which can reuse the same element twice.',
      'Forgetting that sorting + two pointers changes original indices.',
    ],
    interviewTips: [
      'Always ask if the array is sorted (if sorted, two pointers gives O(1) space).',
      'Mention handling duplicate values by checking before inserting.',
    ],
    implementations: {
      c: '// In C, either sort indices or use a hash table; O(n^2) brute-force fallback shown for clarity:\nvoid twoSum(int arr[], int n, int target, int* idx1, int* idx2) {\n    *idx1 = -1; *idx2 = -1;\n    for (int i = 0; i < n; i++) {\n        for (int j = i + 1; j < n; j++) {\n            if (arr[i] + arr[j] == target) { *idx1 = i; *idx2 = j; return; }\n        }\n    }\n}',
      cpp: '#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nvector<int> twoSum(const vector<int>& nums, int target) {\n    unordered_map<int, int> seen;\n    for (int i = 0; i < (int)nums.size(); i++) {\n        int comp = target - nums[i];\n        if (seen.count(comp)) return {seen[comp], i};\n        seen[nums[i]] = i;\n    }\n    return {-1, -1};\n}',
      java: 'import java.util.*;\n\npublic class TwoSum {\n    public static int[] solve(int[] nums, int target) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int comp = target - nums[i];\n            if (seen.containsKey(comp)) return new int[]{seen.get(comp), i};\n            seen.put(nums[i], i);\n        }\n        return new int[]{-1, -1};\n    }\n}',
      python: 'def two_sum(nums: list[int], target: int) -> list[int]:\n    seen = {}\n    for i, num in enumerate(nums):\n        comp = target - num\n        if comp in seen:\n            return [seen[comp], i]\n        seen[num] = i\n    return [-1, -1]',
    },
    relatedProblemSlugs: ['two-sum', 'pair-with-given-sum'],
  },
  {
    topicSlug: 'merge-sort',
    title: 'Merge Sort',
    definition:
      'Merge Sort is a stable, comparison-based divide-and-conquer sorting algorithm that recursively splits an array in half, sorts both halves, and merges them in linear time.',
    explanation:
      'Unlike Quick Sort, Merge Sort guarantees O(n log n) time in the worst case because it always divides the array evenly at the midpoint. The merge step uses two pointers to combine two sorted subarrays into one sorted array.',
    realWorldAnalogy:
      'Sorting a large deck of exam papers by splitting it between two teaching assistants, having each sort their half, and then merging the two sorted piles together by repeatedly picking the smaller top paper.',
    algorithm:
      '1. Base case: if left >= right, return.\n2. mid = left + (right - left) / 2.\n3. Recursively sort [left..mid] and [mid+1..right].\n4. Merge the two sorted halves using a temporary buffer.',
    pseudocode:
      'function mergeSort(arr, l, r):\n    if l >= r: return\n    mid = l + (r - l) // 2\n    mergeSort(arr, l, mid)\n    mergeSort(arr, mid + 1, r)\n    merge(arr, l, mid, r)',
    dryRunExample:
      '[38, 27, 43, 3] -> split [38, 27] and [43, 3] -> [27, 38] and [3, 43] -> merge -> [3, 27, 38, 43].',
    timeComplexity: 'O(n log n) in best, average, and worst cases.',
    spaceComplexity: 'O(n) auxiliary space for the temporary merge array.',
    commonMistakes: [
      'Forgetting to copy remaining elements from the left or right half after one pointer finishes.',
      'Breaking stability by using < instead of <= when picking from the left subarray.',
    ],
    interviewTips: [
      'Merge Sort is the standard algorithm for sorting linked lists (O(1) extra space) and counting inversions.',
    ],
    implementations: {
      c: 'void merge(int arr[], int l, int m, int r) {\n    int n1 = m - l + 1, n2 = r - m;\n    int L[n1], R[n2];\n    for (int i = 0; i < n1; i++) L[i] = arr[l + i];\n    for (int j = 0; j < n2; j++) R[j] = arr[m + 1 + j];\n    int i = 0, j = 0, k = l;\n    while (i < n1 && j < n2) arr[k++] = (L[i] <= R[j]) ? L[i++] : R[j++];\n    while (i < n1) arr[k++] = L[i++];\n    while (j < n2) arr[k++] = R[j++];\n}',
      cpp: '#include <vector>\nusing namespace std;\n\nvoid merge(vector<int>& arr, int l, int m, int r) {\n    vector<int> temp;\n    int i = l, j = m + 1;\n    while (i <= m && j <= r) temp.push_back(arr[i] <= arr[j] ? arr[i++] : arr[j++]);\n    while (i <= m) temp.push_back(arr[i++]);\n    while (j <= r) temp.push_back(arr[j++]);\n    for (int k = 0; k < (int)temp.size(); k++) arr[l + k] = temp[k];\n}',
      java: 'public class MergeSort {\n    public static void merge(int[] arr, int l, int m, int r) {\n        int[] temp = new int[r - l + 1];\n        int i = l, j = m + 1, k = 0;\n        while (i <= m && j <= r) temp[k++] = (arr[i] <= arr[j]) ? arr[i++] : arr[j++];\n        while (i <= m) temp[k++] = arr[i++];\n        while (j <= r) temp[k++] = arr[j++];\n        System.arraycopy(temp, 0, arr, l, temp.length);\n    }\n}',
      python: 'def merge_sort(arr: list[int]) -> list[int]:\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    merged, i, j = [], 0, 0\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            merged.append(left[i]); i += 1\n        else:\n            merged.append(right[j]); j += 1\n    return merged + left[i:] + right[j:]',
    },
    relatedProblemSlugs: ['sort-array', 'count-inversions'],
  },
  {
    topicSlug: 'valid-parentheses',
    title: 'Valid Parentheses (Balanced Brackets)',
    definition:
      'Checking balanced brackets uses a LIFO Stack to ensure every opening bracket is closed by the matching bracket type in the exact reverse order.',
    explanation:
      'When scanning from left to right, opening brackets are pushed onto a stack because the most recently opened bracket must be the very first one closed. When encountering a closing bracket, we pop from the stack and verify it matches.',
    realWorldAnalogy:
      'Nesting Russian dolls or HTML tags: you cannot close an outer box before closing the inner box you opened most recently.',
    algorithm:
      '1. Initialize an empty stack.\n2. For each character ch in string:\n   a. If ch is (, [, or {, push ch.\n   b. Else if stack is empty or top does not match ch, return false.\n   c. Else pop stack.\n3. Return stack.isEmpty().',
    pseudocode:
      'function isValid(s):\n    stack = []\n    for ch in s:\n        if ch in "([{": stack.push(ch)\n        else:\n            if stack is empty or not matches(stack.pop(), ch): return false\n    return stack is empty',
    dryRunExample:
      's = "{[()]}" -> push {, [, ( -> ) matches ( -> ] matches [ -> } matches { -> stack empty -> true.',
    timeComplexity: 'O(n) — Each character is pushed and popped at most once.',
    spaceComplexity: 'O(n) — Worst-case stack holds all opening brackets.',
    commonMistakes: [
      'Forgetting to check if the stack is empty before calling pop/peek.',
      'Forgetting to verify the stack is empty at the end (e.g., input "((").',
    ],
    interviewTips: [
      'If there is only one type of bracket like (), you only need an integer counter for O(1) space.',
    ],
    implementations: {
      c: '#include <stdbool.h>\n#include <string.h>\n\nbool isValid(const char* s) {\n    int n = strlen(s);\n    char stack[n]; int top = -1;\n    for (int i = 0; i < n; i++) {\n        char c = s[i];\n        if (c == \'(\' || c == \'[\' || c == \'{\') stack[++top] = c;\n        else {\n            if (top == -1) return false;\n            char t = stack[top--];\n            if ((c == \')\' && t != \'(\') || (c == \']\' && t != \'[\') || (c == \'}\' && t != \'{\')) return false;\n        }\n    }\n    return top == -1;\n}',
      cpp: '#include <stack>\n#include <string>\nusing namespace std;\n\nbool isValid(const string& s) {\n    stack<char> st;\n    for (char c : s) {\n        if (c == \'(\' || c == \'[\' || c == \'{\') st.push(c);\n        else {\n            if (st.empty()) return false;\n            char t = st.top(); st.pop();\n            if ((c == \')\' && t != \'(\') || (c == \']\' && t != \'[\') || (c == \'}\' && t != \'{\')) return false;\n        }\n    }\n    return st.empty();\n}',
      java: 'import java.util.*;\n\npublic class ValidParentheses {\n    public static boolean isValid(String s) {\n        Deque<Character> st = new ArrayDeque<>();\n        for (char c : s.toCharArray()) {\n            if (c == \'(\') st.push(\')\');\n            else if (c == \'[\') st.push(\']\');\n            else if (c == \'{\') st.push(\'}\');\n            else if (st.isEmpty() || st.pop() != c) return false;\n        }\n        return st.isEmpty();\n    }\n}',
      python: 'def is_valid(s: str) -> bool:\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n    for ch in s:\n        if ch in pairs:\n            if not stack or stack.pop() != pairs[ch]:\n                return False\n        else:\n            stack.append(ch)\n    return not stack',
    },
    relatedProblemSlugs: ['valid-parentheses'],
  },
  {
    topicSlug: 'bfs-traversal',
    title: 'Breadth-First Search (BFS)',
    definition:
      'Breadth-First Search (BFS) explores a graph or tree level by level from a starting node using a FIFO Queue, guaranteeing the shortest path in unweighted graphs.',
    explanation:
      'BFS visits all immediate neighbors at distance 1 before visiting neighbors at distance 2, and so on. A visited array or set prevents revisiting nodes in cyclic graphs.',
    realWorldAnalogy:
      'Ripples spreading outward when a pebble drops into a pond: every point at distance d is reached before any point at distance d + 1.',
    algorithm:
      '1. Create a queue and push start node; mark start as visited.\n2. While queue is not empty:\n   a. Pop front node u and process it.\n   b. For each neighbor v of u:\n      - If v is not visited, mark visited and push v into queue.',
    pseudocode:
      'function bfs(adj, start):\n    visited = {start}\n    queue = [start]\n    while queue not empty:\n        u = queue.dequeue()\n        for v in adj[u]:\n            if v not in visited:\n                visited.add(v)\n                queue.enqueue(v)',
    dryRunExample:
      'Graph: 0->[1,2], 1->[3], 2->[3]. Start=0: visit 0, enqueue 1,2 -> visit 1, enqueue 3 -> visit 2 -> visit 3. Order: [0, 1, 2, 3].',
    timeComplexity: 'O(V + E) for adjacency list representation.',
    spaceComplexity: 'O(V) for the visited set and queue.',
    commonMistakes: [
      'Marking a node as visited when popping from the queue instead of when pushing, causing duplicate pushes.',
      'Forgetting disconnected components in graphs.',
    ],
    interviewTips: [
      'Use BFS whenever asked for shortest path in an unweighted graph or minimum steps/moves.',
    ],
    implementations: {
      c: '// Queue-based BFS using adjacency matrix/list\nvoid bfs(int n, int adj[n][n], int start) {\n    int visited[n]; for (int i = 0; i < n; i++) visited[i] = 0;\n    int q[n], front = 0, rear = 0;\n    visited[start] = 1; q[rear++] = start;\n    while (front < rear) {\n        int u = q[front++];\n        for (int v = 0; v < n; v++) {\n            if (adj[u][v] && !visited[v]) { visited[v] = 1; q[rear++] = v; }\n        }\n    }\n}',
      cpp: '#include <vector>\n#include <queue>\nusing namespace std;\n\nvector<int> bfs(int n, const vector<vector<int>>& adj, int start) {\n    vector<bool> visited(n, false);\n    vector<int> order;\n    queue<int> q;\n    visited[start] = true; q.push(start);\n    while (!q.empty()) {\n        int u = q.front(); q.pop();\n        order.push_back(u);\n        for (int v : adj[u]) {\n            if (!visited[v]) { visited[v] = true; q.push(v); }\n        }\n    }\n    return order;\n}',
      java: 'import java.util.*;\n\npublic class BFS {\n    public static List<Integer> traverse(int n, List<List<Integer>> adj, int start) {\n        boolean[] visited = new boolean[n];\n        List<Integer> order = new ArrayList<>();\n        Queue<Integer> q = new ArrayDeque<>();\n        visited[start] = true; q.offer(start);\n        while (!q.isEmpty()) {\n            int u = q.poll(); order.add(u);\n            for (int v : adj.get(u)) {\n                if (!visited[v]) { visited[v] = true; q.offer(v); }\n            }\n        }\n        return order;\n    }\n}',
      python: 'from collections import deque\n\ndef bfs(adj: list[list[int]], start: int) -> list[int]:\n    visited = {start}\n    q = deque([start])\n    order = []\n    while q:\n        u = q.popleft()\n        order.append(u)\n        for v in adj[u]:\n            if v not in visited:\n                visited.add(v)\n                q.append(v)\n    return order',
    },
    relatedProblemSlugs: ['bfs-traversal', 'number-of-islands'],
  },
  {
    topicSlug: 'climbing-stairs',
    title: 'Dynamic Programming: Climbing Stairs',
    definition:
      'Climbing Stairs is the classic 1D Dynamic Programming problem that counts the number of distinct ways to reach step n when taking 1 or 2 steps at a time.',
    explanation:
      'To land on step i, you must have come either from step i - 1 (taking 1 step) or from step i - 2 (taking 2 steps). Therefore, ways[i] = ways[i - 1] + ways[i - 2], which exhibits optimal substructure and overlapping subproblems.',
    realWorldAnalogy:
      'Counting routes to climb a staircase where each step only depends on the total ways to reach the previous two steps.',
    algorithm:
      '1. If n <= 2, return n.\n2. Initialize prev2 = 1, prev1 = 2.\n3. For i from 3 to n:\n   a. curr = prev1 + prev2.\n   b. prev2 = prev1, prev1 = curr.\n4. Return prev1.',
    pseudocode:
      'function climbStairs(n):\n    if n <= 2: return n\n    a = 1, b = 2\n    for i from 3 to n:\n        c = a + b; a = b; b = c\n    return b',
    dryRunExample:
      'n = 4: ways(1)=1, ways(2)=2 -> ways(3)=1+2=3 -> ways(4)=2+3=5.',
    timeComplexity: 'O(n) — One loop up to n.',
    spaceComplexity: 'O(1) — Space-optimized from O(n) DP array to two variables.',
    commonMistakes: [
      'Returning 0 instead of 1 for n = 0 or misindexing base cases.',
      'Using naive recursion O(2^n) without memoization.',
    ],
    interviewTips: [
      'Always explain the progression: Recursion -> Memoization -> Tabulation -> O(1) Space Optimization.',
    ],
    implementations: {
      c: 'int climbStairs(int n) {\n    if (n <= 2) return n;\n    int a = 1, b = 2;\n    for (int i = 3; i <= n; i++) { int c = a + b; a = b; b = c; }\n    return b;\n}',
      cpp: 'int climbStairs(int n) {\n    if (n <= 2) return n;\n    int a = 1, b = 2;\n    for (int i = 3; i <= n; i++) { int c = a + b; a = b; b = c; }\n    return b;\n}',
      java: 'public class ClimbingStairs {\n    public static int solve(int n) {\n        if (n <= 2) return n;\n        int a = 1, b = 2;\n        for (int i = 3; i <= n; i++) { int c = a + b; a = b; b = c; }\n        return b;\n    }\n}',
      python: 'def climb_stairs(n: int) -> int:\n    if n <= 2:\n        return n\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return b',
    },
    relatedProblemSlugs: ['climbing-stairs', 'fibonacci-dp'],
  },
];

export default sampleNotes;
