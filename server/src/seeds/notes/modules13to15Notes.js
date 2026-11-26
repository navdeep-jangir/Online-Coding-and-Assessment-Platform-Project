// Rich original learning notes for Modules 13–15 (Two Pointers, Sliding Window, Bit Manipulation) — 31 concepts

const modules13to15Notes = [
  // =========================================================================
  // MODULE 13: TWO POINTERS (10 Concepts)
  // =========================================================================
  {
    topicSlug: 'opposite-direction-pointers',
    title: 'Opposite Direction Pointers (Converging Two Pointers)',
    definition:
      'Opposite-direction two pointers is a linear-time traversal pattern where one pointer (`left`) starts at index `0` and another pointer (`right`) starts at index `n - 1`, moving toward each other until `left >= right`.',
    explanation:
      'Instead of testing all O(n^2) pairs with nested loops, opposite-direction pointers exploit symmetry or sorted order. At each step, inspecting `arr[left]` and `arr[right]` lets you either swap them (e.g., reversing an array or checking a palindrome) or discard an entire row/column of candidate pairs in O(1) time based on a monotonic condition.',
    realWorldAnalogy:
      'Two people starting at opposite ends of a sorted bookshelf and walking toward the middle: if their combined book prices are too high, the person at the expensive end steps left; if too low, the person at the cheap end steps right.',
    algorithm:
      '1. Initialize `left = 0` and `right = n - 1`.\n2. Loop while `left < right` (or `left <= right` when the middle element must be visited).\n3. Compare or process elements at `left` and `right`.\n4. Move `left++`, `right--`, or both based on the problem condition.',
    pseudocode: `left <- 0, right <- n - 1
while left < right:
    if condition(arr[left], arr[right]) == TARGET:
        record or return (left, right)
    else if needLargerValue:
        left <- left + 1
    else:
        right <- right - 1`,
    dryRunExample:
      'Palindrome check on `"racecar"` (`n = 7`):\n- `left = 0` (`r`), `right = 6` (`r`) -> match, `left = 1, right = 5`\n- `left = 1` (`a`), `right = 5` (`a`) -> match, `left = 2, right = 4`\n- `left = 2` (`c`), `right = 4` (`c`) -> match, `left = 3, right = 3`\n- Loop ends (`left >= right`) -> returns `true`.',
    timeComplexity: 'O(n) — each pointer moves at most n steps total',
    spaceComplexity: 'O(1) — only two integer index variables',
    commonMistakes: [
      'Using `left <= right` when swapping elements (wastes a self-swap) or `left < right` when the middle element needs validation.',
      'Applying sorted two-sum pointer movement on an unsorted array without sorting first.',
      'Forgetting to handle empty arrays (`n = 0`) where `right = -1`.',
    ],
    interviewTips: [
      'State clearly why discarding `left` or `right` does not miss the optimal answer (monotonicity argument).',
      'Commonly used for reversing arrays/strings, palindrome checks, sorted pair sum, and container with most water.',
    ],
    implementations: {
      c: `#include <stdbool.h>\n\nvoid reverseArray(int arr[], int n) {\n    int left = 0, right = n - 1;\n    while (left < right) {\n        int tmp = arr[left];\n        arr[left] = arr[right];\n        arr[right] = tmp;\n        left++;\n        right--;\n    }\n}\n\nbool isPalindrome(const int arr[], int n) {\n    int left = 0, right = n - 1;\n    while (left < right) {\n        if (arr[left] != arr[right]) return false;\n        left++;\n        right--;\n    }\n    return true;\n}`,
      cpp: `#include <vector>\n#include <utility>\nusing namespace std;\n\nvoid reverseArray(vector<int>& arr) {\n    int left = 0, right = static_cast<int>(arr.size()) - 1;\n    while (left < right) {\n        swap(arr[left++], arr[right--]);\n    }\n}`,
      java: `public class OppositePointers {\n    public static void reverse(int[] arr) {\n        int left = 0, right = arr.length - 1;\n        while (left < right) {\n            int tmp = arr[left];\n            arr[left++] = arr[right];\n            arr[right--] = tmp;\n        }\n    }\n}`,
      python: `def reverse_array(arr: list[int]) -> None:\n    left, right = 0, len(arr) - 1\n    while left < right:\n        arr[left], arr[right] = arr[right], arr[left]\n        left += 1\n        right -= 1`,
    },
  },
  {
    topicSlug: 'same-direction-pointers',
    title: 'Same Direction Pointers (Fast & Slow / Reader-Writer)',
    definition:
      'Same-direction pointers use two indices (`slow` and `fast`) starting at index `0` and advancing in the same direction at different speeds or under different conditions.',
    explanation:
      'This pattern appears in two major forms: (1) Reader-Writer (`fast` scans every element while `slow` tracks the boundary of valid/kept elements for in-place compaction), and (2) Floyd Tortoise-and-Hare (`slow` moves 1 step, `fast` moves 2 steps) to find midpoints or detect cycles.',
    realWorldAnalogy:
      'An editor (`slow`) and a proofreader (`fast`) scanning a manuscript left-to-right: the proofreader reads every word, and only copies non-duplicate words into the clean draft at the editor’s position.',
    algorithm:
      '1. Initialize `slow = 0` and `fast = 0`.\n2. Advance `fast` through the array from `0` to `n - 1`.\n3. Whenever `arr[fast]` satisfies the keep condition, write it to `arr[slow]` and increment `slow`.\n4. After the loop, `slow` is the new logical length.',
    pseudocode: `slow <- 0
for fast from 0 to n - 1:
    if shouldKeep(arr[fast]):
        swap(arr[slow], arr[fast])
        slow <- slow + 1
return slow`,
    dryRunExample:
      'Move zeros to end on `[0, 1, 0, 3, 12]`:\n- `fast=0 (0)`: skip -> `slow=0`\n- `fast=1 (1)`: swap(0,1) -> `[1, 0, 0, 3, 12]`, `slow=1`\n- `fast=2 (0)`: skip -> `slow=1`\n- `fast=3 (3)`: swap(1,3) -> `[1, 3, 0, 0, 12]`, `slow=2`\n- `fast=4 (12)`: swap(2,4) -> `[1, 3, 12, 0, 0]`, `slow=3`.',
    timeComplexity: 'O(n) — each element is visited at most twice',
    spaceComplexity: 'O(1) — in-place modification',
    commonMistakes: [
      'Using `arr[slow] = arr[fast]` instead of `swap` when non-kept elements (like zeros) must be preserved at the tail.',
      'Confusing whether `slow` points to the last valid element or the next write position.',
    ],
    interviewTips: [
      'Reader-Writer maintains relative order of kept elements (stable compaction).',
      'Mention both array compaction and linked-list fast/slow cycle detection as applications of same-direction pointers.',
    ],
    implementations: {
      c: `void moveZeroes(int arr[], int n) {\n    int slow = 0;\n    for (int fast = 0; fast < n; fast++) {\n        if (arr[fast] != 0) {\n            int tmp = arr[slow];\n            arr[slow] = arr[fast];\n            arr[fast] = tmp;\n            slow++;\n        }\n    }\n}`,
      cpp: `#include <vector>\n#include <utility>\nusing namespace std;\n\nvoid moveZeroes(vector<int>& nums) {\n    int slow = 0;\n    for (int fast = 0; fast < static_cast<int>(nums.size()); ++fast) {\n        if (nums[fast] != 0) {\n            swap(nums[slow++], nums[fast]);\n        }\n    }\n}`,
      java: `public class SameDirectionPointers {\n    public static void moveZeroes(int[] nums) {\n        int slow = 0;\n        for (int fast = 0; fast < nums.length; fast++) {\n            if (nums[fast] != 0) {\n                int tmp = nums[slow];\n                nums[slow++] = nums[fast];\n                nums[fast] = tmp;\n            }\n        }\n    }\n}`,
      python: `def move_zeroes(nums: list[int]) -> None:\n    slow = 0\n    for fast in range(len(nums)):\n        if nums[fast] != 0:\n            nums[slow], nums[fast] = nums[fast], nums[slow]\n            slow += 1`,
    },
  },
  {
    topicSlug: 'pair-sum-sorted-array',
    title: 'Pair Sum in a Sorted Array (Two Sum II)',
    definition:
      'Given a sorted array and a target sum, find two distinct indices `left < right` such that `arr[left] + arr[right] == target` in `O(n)` time and `O(1)` extra space.',
    explanation:
      'Because the array is sorted in non-decreasing order, `sum = arr[left] + arr[right]` increases when `left` moves right and decreases when `right` moves left. If `sum < target`, `arr[left]` paired with any element `<= arr[right]` is still `< target`, so `left` can be safely discarded. Symmetrically, if `sum > target`, `right` can be discarded.',
    realWorldAnalogy:
      'Choosing two items from a price-sorted catalog to match an exact gift card balance: if the cheapest + most expensive is over budget, drop the most expensive; if under budget, pick a pricier cheap item.',
    algorithm:
      '1. Set `left = 0`, `right = n - 1`.\n2. While `left < right`:\n   - Compute `sum = arr[left] + arr[right]`.\n   - If `sum == target`, return `{left, right}`.\n   - If `sum < target`, increment `left`.\n   - Else decrement `right`.\n3. Return `{-1, -1}` if no pair exists.',
    pseudocode: `left <- 0, right <- n - 1
while left < right:
    s <- arr[left] + arr[right]
    if s == target: return (left, right)
    if s < target: left <- left + 1
    else: right <- right - 1
return (-1, -1)`,
    dryRunExample:
      '`arr = [2, 7, 11, 15]`, `target = 9`:\n- `left=0 (2), right=3 (15)` -> `sum=17 > 9` -> `right=2`\n- `left=0 (2), right=2 (11)` -> `sum=13 > 9` -> `right=1`\n- `left=0 (2), right=1 (7)` -> `sum=9 == 9` -> return `(0, 1)`.',
    timeComplexity: 'O(n) — single converging pass',
    spaceComplexity: 'O(1) — no hash map required when sorted',
    commonMistakes: [
      'Integer overflow when computing `arr[left] + arr[right]` in C/C++/Java for large 32-bit integers (use `long`/`long long`).',
      'Returning 0-based vs 1-based indices without checking problem requirements (LeetCode 167 expects 1-based).',
    ],
    interviewTips: [
      'Compare with unsorted Two Sum: HashMap gives O(n) time and O(n) space, whereas sorted Two Pointers gives O(n) time and O(1) space.',
      'This exact routine is the inner subroutine of 3Sum and 4Sum.',
    ],
    implementations: {
      c: `int pairSumSorted(const int arr[], int n, int target, int* outL, int* outR) {\n    int left = 0, right = n - 1;\n    while (left < right) {\n        long long s = (long long)arr[left] + arr[right];\n        if (s == target) {\n            *outL = left;\n            *outR = right;\n            return 1;\n        }\n        if (s < target) left++;\n        else right--;\n    }\n    return 0;\n}`,
      cpp: `#include <vector>\nusing namespace std;\n\nvector<int> twoSumSorted(const vector<int>& numbers, int target) {\n    int left = 0, right = static_cast<int>(numbers.size()) - 1;\n    while (left < right) {\n        long long sum = static_cast<long long>(numbers[left]) + numbers[right];\n        if (sum == target) return {left + 1, right + 1};\n        if (sum < target) ++left;\n        else --right;\n    }\n    return {};\n}`,
      java: `public class PairSumSorted {\n    public static int[] twoSum(int[] numbers, int target) {\n        int left = 0, right = numbers.length - 1;\n        while (left < right) {\n            long sum = (long) numbers[left] + numbers[right];\n            if (sum == target) return new int[]{left + 1, right + 1};\n            if (sum < target) left++;\n            else right--;\n        }\n        return new int[0];\n    }\n}`,
      python: `def two_sum_sorted(numbers: list[int], target: int) -> list[int]:\n    left, right = 0, len(numbers) - 1\n    while left < right:\n        s = numbers[left] + numbers[right]\n        if s == target:\n            return [left + 1, right + 1]\n        if s < target:\n            left += 1\n        else:\n            right -= 1\n    return []`,
    },
  },
  {
    topicSlug: 'remove-duplicates-from-sorted',
    title: 'Remove Duplicates from Sorted Array',
    definition:
      'Remove duplicate values in-place from a sorted array so that each unique element appears once in the first `k` positions, returning `k` in `O(n)` time and `O(1)` space.',
    explanation:
      'Since duplicates in a sorted array are always adjacent, a `write` pointer tracks the last confirmed unique element while a `read` pointer scans ahead. Whenever `arr[read] != arr[write]`, a new unique value is found, so we advance `write` and copy `arr[read]` into `arr[write]`.',
    realWorldAnalogy:
      'Deduplicating a stack of sorted playing cards by keeping one card on the table and only placing a new card on top when its rank differs from the top card.',
    algorithm:
      '1. If `n == 0`, return `0`.\n2. Initialize `write = 0`.\n3. For `read` from `1` to `n - 1`:\n   - If `arr[read] != arr[write]`, increment `write` and set `arr[write] = arr[read]`.\n4. Return `write + 1`.',
    pseudocode: `if n == 0: return 0
write <- 0
for read from 1 to n - 1:
    if arr[read] != arr[write]:
        write <- write + 1
        arr[write] <- arr[read]
return write + 1`,
    dryRunExample:
      '`arr = [1, 1, 2, 2, 3]`:\n- `write=0 (1)`\n- `read=1 (1) == 1`: skip\n- `read=2 (2) != 1`: `write=1`, `arr[1]=2`\n- `read=3 (2) == 2`: skip\n- `read=4 (3) != 2`: `write=2`, `arr[2]=3`\n- Returns `3` (`[1, 2, 3, ...]`).',
    timeComplexity: 'O(n) — single pass',
    spaceComplexity: 'O(1) — in-place',
    commonMistakes: [
      'Forgetting the `n == 0` empty-array guard and returning `1` instead of `0`.',
      'Returning `write` instead of `write + 1` (off-by-one count).',
    ],
    interviewTips: [
      'Know the follow-up (LeetCode 80, at most 2 duplicates): compare `arr[read] != arr[write - 2]` with `write` starting at `2`.',
    ],
    implementations: {
      c: `int removeDuplicates(int arr[], int n) {\n    if (n == 0) return 0;\n    int write = 0;\n    for (int read = 1; read < n; read++) {\n        if (arr[read] != arr[write]) {\n            arr[++write] = arr[read];\n        }\n    }\n    return write + 1;\n}`,
      cpp: `#include <vector>\nusing namespace std;\n\nint removeDuplicates(vector<int>& nums) {\n    if (nums.empty()) return 0;\n    int write = 0;\n    for (int read = 1; read < static_cast<int>(nums.size()); ++read) {\n        if (nums[read] != nums[write]) {\n            nums[++write] = nums[read];\n        }\n    }\n    return write + 1;\n}`,
      java: `public class RemoveDuplicates {\n    public static int removeDuplicates(int[] nums) {\n        if (nums.length == 0) return 0;\n        int write = 0;\n        for (int read = 1; read < nums.length; read++) {\n            if (nums[read] != nums[write]) {\n                nums[++write] = nums[read];\n            }\n        }\n        return write + 1;\n    }\n}`,
      python: `def remove_duplicates(nums: list[int]) -> int:\n    if not nums:\n        return 0\n    write = 0\n    for read in range(1, len(nums)):\n        if nums[read] != nums[write]:\n            write += 1\n            nums[write] = nums[read]\n    return write + 1`,
    },
  },
  {
    topicSlug: 'merge-sorted-arrays',
    title: 'Merge Two Sorted Arrays (In-Place & Out-of-Place)',
    definition:
      'Combine two sorted arrays of sizes `m` and `n` into a single sorted array of size `m + n` in `O(m + n)` time.',
    explanation:
      'When merging into a separate output array, start pointers `i = 0` and `j = 0` at the front and repeatedly pick the smaller element. When merging in-place into `nums1` (which has trailing buffer space of size `n`), merge **from the back** (`p1 = m - 1`, `p2 = n - 1`, `write = m + n - 1`) so unmerged elements in `nums1` are never overwritten.',
    realWorldAnalogy:
      'Combining two sorted stacks of numbered tickets into one stack by always picking the smaller front ticket—or filling a large shelf from the right end with the largest tickets first.',
    algorithm:
      '1. Set `p1 = m - 1`, `p2 = n - 1`, `write = m + n - 1`.\n2. While `p2 >= 0`:\n   - If `p1 >= 0 && nums1[p1] > nums2[p2]`, set `nums1[write--] = nums1[p1--]`.\n   - Else set `nums1[write--] = nums2[p2--]`.',
    pseudocode: `p1 <- m - 1, p2 <- n - 1, write <- m + n - 1
while p2 >= 0:
    if p1 >= 0 and nums1[p1] > nums2[p2]:
        nums1[write] <- nums1[p1]
        p1 <- p1 - 1
    else:
        nums1[write] <- nums2[p2]
        p2 <- p2 - 1
    write <- write - 1`,
    dryRunExample:
      '`nums1 = [1, 3, 5, 0, 0, 0] (m=3)`, `nums2 = [2, 4, 6] (n=3)`:\n- `write=5`: `6 > 5` -> `nums1[5]=6`, `p2=1`\n- `write=4`: `5 > 4` -> `nums1[4]=5`, `p1=1`\n- `write=3`: `4 > 3` -> `nums1[3]=4`, `p2=0`\n- `write=2`: `3 > 2` -> `nums1[2]=3`, `p1=0`\n- `write=1`: `2 > 1` -> `nums1[1]=2`, `p2=-1` -> done: `[1, 2, 3, 4, 5, 6]`.',
    timeComplexity: 'O(m + n) — every element is placed once',
    spaceComplexity: 'O(1) in-place into buffer; O(m + n) for new array',
    commonMistakes: [
      'Merging front-to-back into `nums1`, overwriting unread values.',
      'Stopping when `p1 < 0` while `p2 >= 0` (leaves smaller elements from `nums2` uncopied).',
    ],
    interviewTips: [
      'Explain why looping `while (p2 >= 0)` suffices: if `p2` reaches `-1` first, the remaining `nums1[0..p1]` elements are already in their final sorted positions.',
    ],
    implementations: {
      c: `void mergeSortedInPlace(int nums1[], int m, const int nums2[], int n) {\n    int p1 = m - 1, p2 = n - 1, write = m + n - 1;\n    while (p2 >= 0) {\n        if (p1 >= 0 && nums1[p1] > nums2[p2]) {\n            nums1[write--] = nums1[p1--];\n        } else {\n            nums1[write--] = nums2[p2--];\n        }\n    }\n}`,
      cpp: `#include <vector>\nusing namespace std;\n\nvoid merge(vector<int>& nums1, int m, const vector<int>& nums2, int n) {\n    int p1 = m - 1, p2 = n - 1, write = m + n - 1;\n    while (p2 >= 0) {\n        if (p1 >= 0 && nums1[p1] > nums2[p2]) {\n            nums1[write--] = nums1[p1--];\n        } else {\n            nums1[write--] = nums2[p2--];\n        }\n    }\n}`,
      java: `public class MergeSortedArrays {\n    public static void merge(int[] nums1, int m, int[] nums2, int n) {\n        int p1 = m - 1, p2 = n - 1, write = m + n - 1;\n        while (p2 >= 0) {\n            if (p1 >= 0 && nums1[p1] > nums2[p2]) {\n                nums1[write--] = nums1[p1--];\n            } else {\n                nums1[write--] = nums2[p2--];\n            }\n        }\n    }\n}`,
      python: `def merge_sorted(nums1: list[int], m: int, nums2: list[int], n: int) -> None:\n    p1, p2, write = m - 1, n - 1, m + n - 1\n    while p2 >= 0:\n        if p1 >= 0 and nums1[p1] > nums2[p2]:\n            nums1[write] = nums1[p1]\n            p1 -= 1\n        else:\n            nums1[write] = nums2[p2]\n            p2 -= 1\n        write -= 1`,
    },
  },
  {
    topicSlug: 'three-sum',
    title: 'Three Sum (Unique Triplets Summing to Zero)',
    definition:
      'Find all unique triplets `[nums[i], nums[j], nums[k]]` with distinct indices `i, j, k` such that `nums[i] + nums[j] + nums[k] == 0`.',
    explanation:
      'Sorting the array in `O(n log n)` lets us fix the first element `nums[i]` and reduce the remaining problem to sorted 2Sum (`nums[left] + nums[right] == -nums[i]`) on `i + 1 .. n - 1`. Sorting also groups identical values together so we can skip duplicates for `i`, `left`, and `right` in `O(1)` without a `Set`.',
    realWorldAnalogy:
      'Balancing three ledger entries to zero by sorting all amounts, picking one anchor entry, and using two converging fingers on the remaining sorted entries.',
    algorithm:
      '1. Sort `nums`.\n2. Loop `i` from `0` to `n - 3`:\n   - If `nums[i] > 0`, break (all remaining sums are positive).\n   - If `i > 0 && nums[i] == nums[i - 1]`, continue (skip duplicate anchor).\n   - Set `left = i + 1`, `right = n - 1`.\n   - While `left < right`: compute `sum = nums[i] + nums[left] + nums[right]`.\n     - If `sum == 0`, record triplet, advance `left++` and `right--`, and skip duplicates on both.\n     - Else if `sum < 0`, `left++`; else `right--`.',
    pseudocode: `sort(nums)
for i from 0 to n - 3:
    if nums[i] > 0: break
    if i > 0 and nums[i] == nums[i - 1]: continue
    left <- i + 1, right <- n - 1
    while left < right:
        s <- nums[i] + nums[left] + nums[right]
        if s == 0:
            add [nums[i], nums[left], nums[right]]
            left <- left + 1; right <- right - 1
            while left < right and nums[left] == nums[left - 1]: left <- left + 1
            while left < right and nums[right] == nums[right + 1]: right <- right - 1
        else if s < 0: left <- left + 1
        else: right <- right - 1`,
    dryRunExample:
      '`nums = [-1, 0, 1, 2, -1, -4]` -> sorted `[-4, -1, -1, 0, 1, 2]`:\n- `i=0 (-4)`: no pair sums to `4`\n- `i=1 (-1)`: `left=2 (-1), right=5 (2)` -> `sum=0` -> `[-1, -1, 2]`; next `left=3 (0), right=4 (1)` -> `sum=0` -> `[-1, 0, 1]`\n- `i=2 (-1)`: skipped (duplicate of `nums[1]`).',
    timeComplexity: 'O(n^2) — O(n log n) sort + O(n) outer loop * O(n) two pointers',
    spaceComplexity: 'O(1) auxiliary (excluding output list and sort stack)',
    commonMistakes: [
      'Skipping duplicate `nums[left]` or `nums[right]` before recording a valid triplet, or forgetting to skip `nums[i] == nums[i - 1]`.',
      'Using `nums[i] == nums[i + 1]` instead of `nums[i] == nums[i - 1]`, which skips valid triplets like `[-1, -1, 2]`.',
    ],
    interviewTips: [
      'The early break `if (nums[i] > 0) break;` is a classic optimization for target `0`.',
      'Generalizes naturally to `kSum` via recursion down to `2Sum`.',
    ],
    implementations: {
      c: `#include <stdlib.h>\n\nstatic int cmpInt(const void* a, const void* b) {\n    int x = *(const int*)a, y = *(const int*)b;\n    return (x > y) - (x < y);\n}\n\nint countThreeSum(int nums[], int n) {\n    qsort(nums, n, sizeof(int), cmpInt);\n    int count = 0;\n    for (int i = 0; i < n - 2; i++) {\n        if (nums[i] > 0) break;\n        if (i > 0 && nums[i] == nums[i - 1]) continue;\n        int l = i + 1, r = n - 1;\n        while (l < r) {\n            long long s = (long long)nums[i] + nums[l] + nums[r];\n            if (s == 0) {\n                count++;\n                l++; r--;\n                while (l < r && nums[l] == nums[l - 1]) l++;\n                while (l < r && nums[r] == nums[r + 1]) r--;\n            } else if (s < 0) l++;\n            else r--;\n        }\n    }\n    return count;\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\n\nvector<vector<int>> threeSum(vector<int>& nums) {\n    sort(nums.begin(), nums.end());\n    vector<vector<int>> res;\n    int n = static_cast<int>(nums.size());\n    for (int i = 0; i < n - 2; ++i) {\n        if (nums[i] > 0) break;\n        if (i > 0 && nums[i] == nums[i - 1]) continue;\n        int l = i + 1, r = n - 1;\n        while (l < r) {\n            long long s = static_cast<long long>(nums[i]) + nums[l] + nums[r];\n            if (s == 0) {\n                res.push_back({nums[i], nums[l], nums[r]});\n                ++l; --r;\n                while (l < r && nums[l] == nums[l - 1]) ++l;\n                while (l < r && nums[r] == nums[r + 1]) --r;\n            } else if (s < 0) ++l;\n            else --r;\n        }\n    }\n    return res;\n}`,
      java: `import java.util.*;\n\npublic class ThreeSum {\n    public static List<List<Integer>> threeSum(int[] nums) {\n        Arrays.sort(nums);\n        List<List<Integer>> res = new ArrayList<>();\n        for (int i = 0; i < nums.length - 2; i++) {\n            if (nums[i] > 0) break;\n            if (i > 0 && nums[i] == nums[i - 1]) continue;\n            int l = i + 1, r = nums.length - 1;\n            while (l < r) {\n                long s = (long) nums[i] + nums[l] + nums[r];\n                if (s == 0) {\n                    res.add(Arrays.asList(nums[i], nums[l], nums[r]));\n                    l++; r--;\n                    while (l < r && nums[l] == nums[l - 1]) l++;\n                    while (l < r && nums[r] == nums[r + 1]) r--;\n                } else if (s < 0) l++;\n                else r--;\n            }\n        }\n        return res;\n    }\n}`,
      python: `def three_sum(nums: list[int]) -> list[list[int]]:\n    nums.sort()\n    res: list[list[int]] = []\n    n = len(nums)\n    for i in range(n - 2):\n        if nums[i] > 0:\n            break\n        if i > 0 and nums[i] == nums[i - 1]:\n            continue\n        l, r = i + 1, n - 1\n        while l < r:\n            s = nums[i] + nums[l] + nums[r]\n            if s == 0:\n                res.append([nums[i], nums[l], nums[r]])\n                l += 1\n                r -= 1\n                while l < r and nums[l] == nums[l - 1]:\n                    l += 1\n                while l < r and nums[r] == nums[r + 1]:\n                    r -= 1\n            elif s < 0:\n                l += 1\n            else:\n                r -= 1\n    return res`,
    },
  },
  {
    topicSlug: 'four-sum',
    title: 'Four Sum (Unique Quadruplets)',
    definition:
      'Find all unique quadruplets `[nums[a], nums[b], nums[c], nums[d]]` with distinct indices such that their sum equals a given `target`.',
    explanation:
      'Four Sum extends Three Sum by fixing two outer indices `i` and `j` (`j > i`) in a sorted array and running two converging pointers (`left = j + 1`, `right = n - 1`) for the remaining two numbers. Duplicate skipping is applied at `i`, `j`, `left`, and `right`, and 64-bit arithmetic prevents overflow on large targets.',
    realWorldAnalogy:
      'Selecting four distinct budget items that hit an exact total by locking in the first two items and narrowing down the last two from opposite ends of a price-sorted list.',
    algorithm:
      '1. Sort `nums`.\n2. Loop `i` from `0` to `n - 4` (skip duplicate `nums[i]`).\n3. Loop `j` from `i + 1` to `n - 3` (skip duplicate `nums[j]` when `j > i + 1`).\n4. Use `left = j + 1`, `right = n - 1` to find pairs summing to `target - nums[i] - nums[j]`, skipping duplicates on match.',
    pseudocode: `sort(nums)
for i from 0 to n - 4:
    if i > 0 and nums[i] == nums[i - 1]: continue
    for j from i + 1 to n - 3:
        if j > i + 1 and nums[j] == nums[j - 1]: continue
        l <- j + 1, r <- n - 1
        while l < r:
            s <- nums[i] + nums[j] + nums[l] + nums[r]
            if s == target: record and skip duplicates
            else if s < target: l <- l + 1
            else: r <- r - 1`,
    dryRunExample:
      '`nums = [1, 0, -1, 0, -2, 2]`, `target = 0` -> sorted `[-2, -1, 0, 0, 1, 2]`:\n- `i=0 (-2), j=1 (-1)`: `l=2 (0), r=5 (2)` -> `-1` < `0` -> `l=3 (0)` -> `-1` < `0` -> `l=4 (1)` -> `sum=0` -> `[-2, -1, 1, 2]`\n- Also finds `[-2, 0, 0, 2]` and `[-1, 0, 0, 1]`.',
    timeComplexity: 'O(n^3) — two nested loops + O(n) two pointers',
    spaceComplexity: 'O(1) auxiliary (excluding output)',
    commonMistakes: [
      'Signed 32-bit integer overflow when adding four `10^9` values (always cast to `long` / `long long`).',
      'Checking `j > 0` instead of `j > i + 1` when skipping duplicate `j` values.',
    ],
    interviewTips: [
      'Add min/max pruning (`nums[i] + nums[i+1] + nums[i+2] + nums[i+3] > target` -> break) for big speedups on large inputs.',
    ],
    implementations: {
      c: `#include <stdlib.h>\n\nstatic int cmp4(const void* a, const void* b) {\n    int x = *(const int*)a, y = *(const int*)b;\n    return (x > y) - (x < y);\n}\n\nint countFourSum(int nums[], int n, long long target) {\n    qsort(nums, n, sizeof(int), cmp4);\n    int count = 0;\n    for (int i = 0; i < n - 3; i++) {\n        if (i > 0 && nums[i] == nums[i - 1]) continue;\n        for (int j = i + 1; j < n - 2; j++) {\n            if (j > i + 1 && nums[j] == nums[j - 1]) continue;\n            int l = j + 1, r = n - 1;\n            while (l < r) {\n                long long s = (long long)nums[i] + nums[j] + nums[l] + nums[r];\n                if (s == target) {\n                    count++; l++; r--;\n                    while (l < r && nums[l] == nums[l - 1]) l++;\n                    while (l < r && nums[r] == nums[r + 1]) r--;\n                } else if (s < target) l++;\n                else r--;\n            }\n        }\n    }\n    return count;\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\n\nvector<vector<int>> fourSum(vector<int>& nums, int target) {\n    sort(nums.begin(), nums.end());\n    vector<vector<int>> res;\n    int n = static_cast<int>(nums.size());\n    for (int i = 0; i < n - 3; ++i) {\n        if (i > 0 && nums[i] == nums[i - 1]) continue;\n        for (int j = i + 1; j < n - 2; ++j) {\n            if (j > i + 1 && nums[j] == nums[j - 1]) continue;\n            int l = j + 1, r = n - 1;\n            while (l < r) {\n                long long s = static_cast<long long>(nums[i]) + nums[j] + nums[l] + nums[r];\n                if (s == target) {\n                    res.push_back({nums[i], nums[j], nums[l], nums[r]});\n                    ++l; --r;\n                    while (l < r && nums[l] == nums[l - 1]) ++l;\n                    while (l < r && nums[r] == nums[r + 1]) --r;\n                } else if (s < target) ++l;\n                else --r;\n            }\n        }\n    }\n    return res;\n}`,
      java: `import java.util.*;\n\npublic class FourSum {\n    public static List<List<Integer>> fourSum(int[] nums, int target) {\n        Arrays.sort(nums);\n        List<List<Integer>> res = new ArrayList<>();\n        int n = nums.length;\n        for (int i = 0; i < n - 3; i++) {\n            if (i > 0 && nums[i] == nums[i - 1]) continue;\n            for (int j = i + 1; j < n - 2; j++) {\n                if (j > i + 1 && nums[j] == nums[j - 1]) continue;\n                int l = j + 1, r = n - 1;\n                while (l < r) {\n                    long s = (long) nums[i] + nums[j] + nums[l] + nums[r];\n                    if (s == target) {\n                        res.add(Arrays.asList(nums[i], nums[j], nums[l], nums[r]));\n                        l++; r--;\n                        while (l < r && nums[l] == nums[l - 1]) l++;\n                        while (l < r && nums[r] == nums[r + 1]) r--;\n                    } else if (s < target) l++;\n                    else r--;\n                }\n            }\n        }\n        return res;\n    }\n}`,
      python: `def four_sum(nums: list[int], target: int) -> list[list[int]]:\n    nums.sort()\n    res: list[list[int]] = []\n    n = len(nums)\n    for i in range(n - 3):\n        if i > 0 and nums[i] == nums[i - 1]:\n            continue\n        for j in range(i + 1, n - 2):\n            if j > i + 1 and nums[j] == nums[j - 1]:\n                continue\n            l, r = j + 1, n - 1\n            while l < r:\n                s = nums[i] + nums[j] + nums[l] + nums[r]\n                if s == target:\n                    res.append([nums[i], nums[j], nums[l], nums[r]])\n                    l += 1\n                    r -= 1\n                    while l < r and nums[l] == nums[l - 1]:\n                        l += 1\n                    while l < r and nums[r] == nums[r + 1]:\n                        r -= 1\n                elif s < target:\n                    l += 1\n                else:\n                    r -= 1\n    return res`,
    },
  },
  {
    topicSlug: 'container-with-most-water',
    title: 'Container With Most Water',
    definition:
      'Given an array `height` of `n` vertical lines, find two lines `i < j` that together with the x-axis form a container holding the maximum water: `(j - i) * min(height[i], height[j])`.',
    explanation:
      'Start with the widest container (`left = 0`, `right = n - 1`). Its area is limited by the shorter wall `min(height[left], height[right])`. Moving the taller wall inward can only decrease the width without increasing `min(height)`, so it can never beat the current area. Therefore, we always move the shorter wall inward to seek a taller boundary.',
    realWorldAnalogy:
      'Two flood barriers at the ends of a valley: the water level cannot rise above the shorter barrier, so to hold more water in a narrower span, you must replace the shorter barrier.',
    algorithm:
      '1. Initialize `left = 0`, `right = n - 1`, `best = 0`.\n2. While `left < right`:\n   - `h = min(height[left], height[right])`\n   - `best = max(best, (right - left) * h)`\n   - If `height[left] < height[right]`, `left++`; else `right--`.\n3. Return `best`.',
    pseudocode: `left <- 0, right <- n - 1, best <- 0
while left < right:
    area <- (right - left) * min(height[left], height[right])
    best <- max(best, area)
    if height[left] < height[right]:
        left <- left + 1
    else:
        right <- right - 1
return best`,
    dryRunExample:
      '`height = [1, 8, 6, 2, 5, 4, 8, 3, 7]`:\n- `l=0 (1), r=8 (7)`: `area = 8 * 1 = 8`, move `l->1`\n- `l=1 (8), r=8 (7)`: `area = 7 * 7 = 49`, move `r->7`\n- Remaining pairs have width `<= 6` and `min <= 8`, max stays `49`.',
    timeComplexity: 'O(n) — single pass',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Confusing Container With Most Water (two walls only, intermediate bars ignored) with Trapping Rain Water (all bars block water).',
      'Moving the taller pointer instead of the shorter pointer.',
    ],
    interviewTips: [
      'Be ready to prove correctness: if `height[left] <= height[right]`, any pair `(left, k)` with `k < right` has width `< (right - left)` and height `<= height[left]`, so its area is strictly smaller.',
    ],
    implementations: {
      c: `int maxArea(const int height[], int n) {\n    int left = 0, right = n - 1, best = 0;\n    while (left < right) {\n        int h = height[left] < height[right] ? height[left] : height[right];\n        int area = (right - left) * h;\n        if (area > best) best = area;\n        if (height[left] < height[right]) left++;\n        else right--;\n    }\n    return best;\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\n\nint maxArea(const vector<int>& height) {\n    int left = 0, right = static_cast<int>(height.size()) - 1, best = 0;\n    while (left < right) {\n        best = max(best, (right - left) * min(height[left], height[right]));\n        if (height[left] < height[right]) ++left;\n        else --right;\n    }\n    return best;\n}`,
      java: `public class ContainerMostWater {\n    public static int maxArea(int[] height) {\n        int left = 0, right = height.length - 1, best = 0;\n        while (left < right) {\n            int h = Math.min(height[left], height[right]);\n            best = Math.max(best, (right - left) * h);\n            if (height[left] < height[right]) left++;\n            else right--;\n        }\n        return best;\n    }\n}`,
      python: `def max_area(height: list[int]) -> int:\n    left, right, best = 0, len(height) - 1, 0\n    while left < right:\n        best = max(best, (right - left) * min(height[left], height[right]))\n        if height[left] < height[right]:\n            left += 1\n        else:\n            right -= 1\n    return best`,
    },
  },
  {
    topicSlug: 'partitioning-techniques',
    title: 'Partitioning Techniques (Lomuto, Hoare & Dutch National Flag)',
    definition:
      'Partitioning rearranges an array in-place around a pivot or category boundary using two or three pointers so elements satisfying a predicate sit before those that do not.',
    explanation:
      '2-way partitioning (Lomuto or Hoare) splits elements into `<= pivot` and `> pivot`. 3-way partitioning (Dutch National Flag) uses `low`, `mid`, and `high` pointers to group elements into `< pivot`, `== pivot`, and `> pivot` in a single `O(n)` pass—ideal for sorting `0s, 1s, 2s` or handling many duplicate keys in QuickSort.',
    realWorldAnalogy:
      'Sorting colored balls (`Red=0, White=1, Blue=2`) in one pass: throw Reds to the left bin (`low`), Blues to the right bin (`high`), and leave Whites in the middle (`mid`).',
    algorithm:
      '1. Initialize `low = 0`, `mid = 0`, `high = n - 1`.\n2. While `mid <= high`:\n   - If `arr[mid] == 0`: `swap(arr[low++], arr[mid++])`.\n   - Else if `arr[mid] == 1`: `mid++`.\n   - Else (`arr[mid] == 2`): `swap(arr[mid], arr[high--])` (do NOT increment `mid` because the swapped-in element from `high` is uninspected).',
    pseudocode: `low <- 0, mid <- 0, high <- n - 1
while mid <= high:
    if arr[mid] == 0:
        swap(arr[low], arr[mid])
        low <- low + 1; mid <- mid + 1
    else if arr[mid] == 1:
        mid <- mid + 1
    else:
        swap(arr[mid], arr[high])
        high <- high - 1`,
    dryRunExample:
      '`arr = [2, 0, 2, 1, 1, 0]`:\n- `mid=0 (2)`: swap(0,5) -> `[0, 0, 2, 1, 1, 2]`, `high=4`\n- `mid=0 (0)`: swap(0,0) -> `low=1, mid=1`\n- `mid=1 (0)`: swap(1,1) -> `low=2, mid=2`\n- `mid=2 (2)`: swap(2,4) -> `[0, 0, 1, 1, 2, 2]`, `high=3`\n- `mid=2 (1)`, `mid=3 (1)` -> `mid=4 > high` -> done.',
    timeComplexity: 'O(n) — each element is examined at most once',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Incrementing `mid` after swapping `arr[mid]` with `arr[high]` (skips inspecting the element brought from `high`).',
      'Using `while (mid < high)` instead of `while (mid <= high)`, leaving `arr[high]` unsorted.',
    ],
    interviewTips: [
      'Explain the loop invariant: `[0..low-1]` are 0s, `[low..mid-1]` are 1s, `[mid..high]` are unknown, `[high+1..n-1]` are 2s.',
    ],
    implementations: {
      c: `void sortColors(int arr[], int n) {\n    int low = 0, mid = 0, high = n - 1;\n    while (mid <= high) {\n        if (arr[mid] == 0) {\n            int t = arr[low]; arr[low++] = arr[mid]; arr[mid++] = t;\n        } else if (arr[mid] == 1) {\n            mid++;\n        } else {\n            int t = arr[mid]; arr[mid] = arr[high]; arr[high--] = t;\n        }\n    }\n}`,
      cpp: `#include <vector>\n#include <utility>\nusing namespace std;\n\nvoid sortColors(vector<int>& nums) {\n    int low = 0, mid = 0, high = static_cast<int>(nums.size()) - 1;\n    while (mid <= high) {\n        if (nums[mid] == 0) swap(nums[low++], nums[mid++]);\n        else if (nums[mid] == 1) ++mid;\n        else swap(nums[mid], nums[high--]);\n    }\n}`,
      java: `public class DutchFlagPartition {\n    public static void sortColors(int[] nums) {\n        int low = 0, mid = 0, high = nums.length - 1;\n        while (mid <= high) {\n            if (nums[mid] == 0) {\n                int t = nums[low]; nums[low++] = nums[mid]; nums[mid++] = t;\n            } else if (nums[mid] == 1) {\n                mid++;\n            } else {\n                int t = nums[mid]; nums[mid] = nums[high]; nums[high--] = t;\n            }\n        }\n    }\n}`,
      python: `def sort_colors(nums: list[int]) -> None:\n    low, mid, high = 0, 0, len(nums) - 1\n    while mid <= high:\n        if nums[mid] == 0:\n            nums[low], nums[mid] = nums[mid], nums[low]\n            low += 1\n            mid += 1\n        elif nums[mid] == 1:\n            mid += 1\n        else:\n            nums[mid], nums[high] = nums[high], nums[mid]\n            high -= 1`,
    },
  },
  {
    topicSlug: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    definition:
      'Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.',
    explanation:
      'Water trapped above bar `i` equals `min(maxLeft[i], maxRight[i]) - height[i]`. Instead of storing prefix/suffix max arrays in `O(n)` space, two opposite pointers maintain `leftMax` and `rightMax`. Whenever `height[left] <= height[right]`, we know `rightMax >= height[right] >= height[left]`, so the water at `left` is bounded solely by `leftMax`, letting us compute it in `O(1)` space.',
    realWorldAnalogy:
      'Water between two dams: if the right dam wall is already taller than your current left wall, the water depth at your left spot depends only on the tallest wall seen so far on the left.',
    algorithm:
      '1. Initialize `left = 0`, `right = n - 1`, `leftMax = 0`, `rightMax = 0`, `water = 0`.\n2. While `left < right`:\n   - If `height[left] <= height[right]`:\n     - `leftMax = max(leftMax, height[left])`\n     - `water += leftMax - height[left++]`\n   - Else:\n     - `rightMax = max(rightMax, height[right])`\n     - `water += rightMax - height[right--]`\n3. Return `water`.',
    pseudocode: `left <- 0, right <- n - 1
leftMax <- 0, rightMax <- 0, water <- 0
while left < right:
    if height[left] <= height[right]:
        leftMax <- max(leftMax, height[left])
        water <- water + (leftMax - height[left])
        left <- left + 1
    else:
        rightMax <- max(rightMax, height[right])
        water <- water + (rightMax - height[right])
        right <- right - 1
return water`,
    dryRunExample:
      '`height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]`:\n- At `left=2 (0)`, `leftMax=1 <= height[right]=1` -> `water += 1`\n- At `left=4 (1)`, `leftMax=2` -> `water += 1`\n- At `left=5 (0)`, `leftMax=2` -> `water += 2`\n- At `left=6 (1)`, `leftMax=2` -> `water += 1`\n- At `right=9 (1)`, `rightMax=2` -> `water += 1`\n- Total water = `6`.',
    timeComplexity: 'O(n) — single two-pointer pass',
    spaceComplexity: 'O(1) — optimal two-pointer solution',
    commonMistakes: [
      'Forgetting to update `leftMax` / `rightMax` before subtracting `height[left]` / `height[right]`, leading to negative water.',
      'Assuming `O(n)` prefix/suffix arrays are required when `O(1)` space is achievable.',
    ],
    interviewTips: [
      'Walk through the three approaches in order: Brute Force O(n^2) -> Prefix/Suffix Max O(n) space -> Two Pointers O(1) space.',
    ],
    implementations: {
      c: `int trap(const int height[], int n) {\n    int left = 0, right = n - 1;\n    int leftMax = 0, rightMax = 0, water = 0;\n    while (left < right) {\n        if (height[left] <= height[right]) {\n            if (height[left] > leftMax) leftMax = height[left];\n            water += leftMax - height[left++];\n        } else {\n            if (height[right] > rightMax) rightMax = height[right];\n            water += rightMax - height[right--];\n        }\n    }\n    return water;\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\n\nint trap(const vector<int>& height) {\n    int left = 0, right = static_cast<int>(height.size()) - 1;\n    int leftMax = 0, rightMax = 0, water = 0;\n    while (left < right) {\n        if (height[left] <= height[right]) {\n            leftMax = max(leftMax, height[left]);\n            water += leftMax - height[left++];\n        } else {\n            rightMax = max(rightMax, height[right]);\n            water += rightMax - height[right--];\n        }\n    }\n    return water;\n}`,
      java: `public class TrappingRainWater {\n    public static int trap(int[] height) {\n        int left = 0, right = height.length - 1;\n        int leftMax = 0, rightMax = 0, water = 0;\n        while (left < right) {\n            if (height[left] <= height[right]) {\n                leftMax = Math.max(leftMax, height[left]);\n                water += leftMax - height[left++];\n            } else {\n                rightMax = Math.max(rightMax, height[right]);\n                water += rightMax - height[right--];\n            }\n        }\n        return water;\n    }\n}`,
      python: `def trap(height: list[int]) -> int:\n    left, right = 0, len(height) - 1\n    left_max = right_max = water = 0\n    while left < right:\n        if height[left] <= height[right]:\n            left_max = max(left_max, height[left])\n            water += left_max - height[left]\n            left += 1\n        else:\n            right_max = max(right_max, height[right])\n            water += right_max - height[right]\n            right -= 1\n    return water`,
    },
  },

  // =========================================================================
  // MODULE 14: SLIDING WINDOW (8 Concepts)
  // =========================================================================
  {
    topicSlug: 'fixed-size-window',
    title: 'Fixed Size Sliding Window',
    definition:
      'A fixed-size sliding window maintains a contiguous subarray/substring of constant length `k` by adding one entering element on the right and removing one exiting element on the left at each step.',
    explanation:
      'Recomputing the aggregate (sum, count, frequency map) for every window of size `k` takes `O(nk)`. By updating the running state incrementally as `window = window + arr[right] - arr[right - k]`, each element enters and leaves the window once, reducing total time to `O(n)`.',
    realWorldAnalogy:
      'A train with 3 carriages (`k = 3`) passing a platform: to update the total passenger count as the train advances one slot, subtract the rear carriage leaving and add the front carriage entering.',
    algorithm:
      '1. Initialize `windowState` over the first `k` elements (`0 .. k - 1`).\n2. Record initial answer.\n3. For `right` from `k` to `n - 1`:\n   - Add `arr[right]` to `windowState`.\n   - Remove `arr[right - k]` from `windowState`.\n   - Update best answer.',
    pseudocode: `state <- aggregate(arr[0..k-1])
best <- state
for right from k to n - 1:
    state <- add(state, arr[right])
    state <- remove(state, arr[right - k])
    best <- better(best, state)
return best`,
    dryRunExample:
      '`arr = [2, 1, 5, 1, 3, 2]`, `k = 3`:\n- Initial `[2, 1, 5]` -> `sum = 8`, `best = 8`\n- `right=3 (+1, -2)`: `sum = 7`\n- `right=4 (+3, -1)`: `sum = 9`, `best = 9`\n- `right=5 (+2, -5)`: `sum = 6` -> returns `9`.',
    timeComplexity: 'O(n) — each element added once and removed once',
    spaceComplexity: 'O(1) for sums; O(A) for fixed alphabet frequency arrays',
    commonMistakes: [
      'Forgetting to check `n < k` before initializing the first window.',
      'Off-by-one when computing `left = right - k + 1` vs `exiting = right - k`.',
    ],
    interviewTips: [
      'Look for keywords: "contiguous subarray of size k", "every k consecutive elements", or "moving average of k".',
    ],
    implementations: {
      c: `int maxFixedWindowSum(const int arr[], int n, int k) {\n    if (n < k || k <= 0) return 0;\n    int sum = 0;\n    for (int i = 0; i < k; i++) sum += arr[i];\n    int best = sum;\n    for (int right = k; right < n; right++) {\n        sum += arr[right] - arr[right - k];\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\n\nint maxFixedWindowSum(const vector<int>& arr, int k) {\n    if (static_cast<int>(arr.size()) < k || k <= 0) return 0;\n    int sum = 0;\n    for (int i = 0; i < k; ++i) sum += arr[i];\n    int best = sum;\n    for (int right = k; right < static_cast<int>(arr.size()); ++right) {\n        sum += arr[right] - arr[right - k];\n        best = max(best, sum);\n    }\n    return best;\n}`,
      java: `public class FixedWindow {\n    public static int maxSum(int[] arr, int k) {\n        if (arr.length < k || k <= 0) return 0;\n        int sum = 0;\n        for (int i = 0; i < k; i++) sum += arr[i];\n        int best = sum;\n        for (int right = k; right < arr.length; right++) {\n            sum += arr[right] - arr[right - k];\n            best = Math.max(best, sum);\n        }\n        return best;\n    }\n}`,
      python: `def max_fixed_window_sum(arr: list[int], k: int) -> int:\n    if len(arr) < k or k <= 0:\n        return 0\n    window_sum = sum(arr[:k])\n    best = window_sum\n    for right in range(k, len(arr)):\n        window_sum += arr[right] - arr[right - k]\n        best = max(best, window_sum)\n    return best`,
    },
  },
  {
    topicSlug: 'variable-size-window',
    title: 'Variable Size Sliding Window',
    definition:
      'A variable-size sliding window dynamically expands its `right` boundary to include new elements and shrinks its `left` boundary whenever a constraint is violated (for longest valid window) or satisfied (for shortest valid window).',
    explanation:
      'This pattern works when the window property is **monotonic**: expanding a valid window eventually breaks it (or keeps a satisfying window satisfied), and shrinking restores validity. Because both `left` and `right` only move rightward from `0` to `n - 1`, the inner `while` loop executes at most `n` times across the entire algorithm.',
    realWorldAnalogy:
      'Stretching an elastic tape measure from left to right: you extend the right end as far as possible, and whenever the budget overflows, you pull the left end forward until it fits again.',
    algorithm:
      '1. Initialize `left = 0`, `best = 0` (or `INF` for minimum length).\n2. For `right` from `0` to `n - 1`:\n   - Incorporate `arr[right]` into window state.\n   - While window violates constraint (longest problem), remove `arr[left++]`.\n   - Update `best` with `right - left + 1`.',
    pseudocode: `left <- 0, best <- 0
for right from 0 to n - 1:
    include(arr[right])
    while windowInvalid():
        exclude(arr[left])
        left <- left + 1
    best <- max(best, right - left + 1)
return best`,
    dryRunExample:
      'Longest subarray with sum `<= 5` on `[1, 2, 1, 3, 1]`:\n- `r=0..2`: `[1,2,1]`, `sum=4 <= 5`, `best=3`\n- `r=3 (+3)`: `sum=7 > 5` -> shrink `l=0 (-1)` (`sum=6 > 5`) -> shrink `l=1 (-2)` (`sum=4 <= 5`), window `[1,3]` len `2`\n- `r=4 (+1)`: `sum=5 <= 5`, window `[1,3,1]` len `3` -> `best=3`.',
    timeComplexity: 'O(n) — amortized O(1) per element since left and right only advance',
    spaceComplexity: 'O(1) to O(k) depending on tracked state',
    commonMistakes: [
      'Applying variable sliding window when negative numbers exist in sum problems (breaks monotonicity; use Prefix Sum + HashMap instead).',
      'Using `if` instead of `while` when shrinking for minimum-length windows or character counts.',
    ],
    interviewTips: [
      'Always verify monotonicity before choosing sliding window: if numbers can be negative, sliding window for target sum fails.',
    ],
    implementations: {
      c: `int longestSubarrayAtMostK(const int arr[], int n, int k) {\n    int left = 0, sum = 0, best = 0;\n    for (int right = 0; right < n; right++) {\n        sum += arr[right];\n        while (sum > k && left <= right) {\n            sum -= arr[left++];\n        }\n        int len = right - left + 1;\n        if (len > best) best = len;\n    }\n    return best;\n}`,
      cpp: `#include <algorithm>\n#include <vector>\nusing namespace std;\n\nint longestSubarrayAtMostK(const vector<int>& arr, int k) {\n    int left = 0, sum = 0, best = 0;\n    for (int right = 0; right < static_cast<int>(arr.size()); ++right) {\n        sum += arr[right];\n        while (sum > k && left <= right) sum -= arr[left++];\n        best = max(best, right - left + 1);\n    }\n    return best;\n}`,
      java: `public class VariableWindow {\n    public static int longestAtMostK(int[] arr, int k) {\n        int left = 0, sum = 0, best = 0;\n        for (int right = 0; right < arr.length; right++) {\n            sum += arr[right];\n            while (sum > k && left <= right) sum -= arr[left++];\n            best = Math.max(best, right - left + 1);\n        }\n        return best;\n    }\n}`,
      python: `def longest_subarray_at_most_k(arr: list[int], k: int) -> int:\n    left = window_sum = best = 0\n    for right, val in enumerate(arr):\n        window_sum += val\n        while window_sum > k and left <= right:\n            window_sum -= arr[left]\n            left += 1\n        best = max(best, right - left + 1)\n    return best`,
    },
  },
  {
    topicSlug: 'maximum-sum-subarray-of-size-k',
    title: 'Maximum Sum Subarray of Size K',
    definition:
      'Given an array of integers and an integer `k`, find the maximum possible sum of any contiguous subarray of exact length `k`.',
    explanation:
      'This is the canonical fixed-size sliding window problem. Maintaining a running `windowSum` avoids recomputing `k` additions per shift: add `arr[i]` and subtract `arr[i - k]` once `i >= k - 1`. Use 64-bit integers (`long long` / `long`) to avoid overflow when `k` and element values are large.',
    realWorldAnalogy:
      'Finding the highest-earning `k`-day streak in a daily revenue log by sliding a `k`-day bracket one day forward at a time.',
    algorithm:
      '1. Initialize `windowSum = 0`, `maxSum = -INF`.\n2. Loop `i` from `0` to `n - 1`:\n   - `windowSum += arr[i]`\n   - If `i >= k - 1`:\n     - `maxSum = max(maxSum, windowSum)`\n     - `windowSum -= arr[i - k + 1]`\n3. Return `maxSum`.',
    pseudocode: `windowSum <- 0, maxSum <- -INF
for i from 0 to n - 1:
    windowSum <- windowSum + arr[i]
    if i >= k - 1:
        maxSum <- max(maxSum, windowSum)
        windowSum <- windowSum - arr[i - k + 1]
return maxSum`,
    dryRunExample:
      '`arr = [1, 4, 2, 10, 23, 3, 1, 0, 20]`, `k = 4`:\n- `i=3`: `[1,4,2,10]` sum `17`, `maxSum=17`\n- `i=4`: `[4,2,10,23]` sum `39`, `maxSum=39`\n- `i=5`: `[2,10,23,3]` sum `38`\n- Final `maxSum = 39`.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Initializing `maxSum = 0` when array elements can be negative (fails if the best window sum is negative).',
      '32-bit integer overflow when summing large values.',
    ],
    interviewTips: [
      'Follow-up: "Maximum Average Subarray I" (LeetCode 643) is identical—just return `maxSum / (double)k`.',
    ],
    implementations: {
      c: `#include <limits.h>\n\nlong long maxSumSubarrayK(const int arr[], int n, int k) {\n    if (n < k || k <= 0) return 0;\n    long long windowSum = 0, maxSum = LLONG_MIN;\n    for (int i = 0; i < n; i++) {\n        windowSum += arr[i];\n        if (i >= k - 1) {\n            if (windowSum > maxSum) maxSum = windowSum;\n            windowSum -= arr[i - k + 1];\n        }\n    }\n    return maxSum;\n}`,
      cpp: `#include <algorithm>\n#include <climits>\n#include <vector>\nusing namespace std;\n\nlong long maxSumSubarrayK(const vector<int>& arr, int k) {\n    if (static_cast<int>(arr.size()) < k || k <= 0) return 0;\n    long long windowSum = 0, maxSum = LLONG_MIN;\n    for (int i = 0; i < static_cast<int>(arr.size()); ++i) {\n        windowSum += arr[i];\n        if (i >= k - 1) {\n            maxSum = max(maxSum, windowSum);\n            windowSum -= arr[i - k + 1];\n        }\n    }\n    return maxSum;\n}`,
      java: `public class MaxSumSubarrayK {\n    public static long maxSum(int[] arr, int k) {\n        if (arr.length < k || k <= 0) return 0;\n        long windowSum = 0, maxSum = Long.MIN_VALUE;\n        for (int i = 0; i < arr.length; i++) {\n            windowSum += arr[i];\n            if (i >= k - 1) {\n                maxSum = Math.max(maxSum, windowSum);\n                windowSum -= arr[i - k + 1];\n            }\n        }\n        return maxSum;\n    }\n}`,
      python: `def max_sum_subarray_k(arr: list[int], k: int) -> int:\n    if len(arr) < k or k <= 0:\n        return 0\n    window_sum = sum(arr[:k])\n    max_sum = window_sum\n    for i in range(k, len(arr)):\n        window_sum += arr[i] - arr[i - k]\n        if window_sum > max_sum:\n            max_sum = window_sum\n    return max_sum`,
    },
  },
  {
    topicSlug: 'longest-substring-without-repeating',
    title: 'Longest Substring Without Repeating Characters',
    definition:
      'Given a string `s`, find the length of the longest contiguous substring that contains no duplicate characters.',
    explanation:
      'Track the last seen index of each character using an array of size `128`/`256` (for ASCII) or a hash map. As `right` advances, if `s[right]` was already seen at `lastSeen[c] >= left`, jump `left` directly to `lastSeen[c] + 1` in `O(1)` so the window `[left..right]` remains duplicate-free.',
    realWorldAnalogy:
      'Recording a sequence of unique musical notes: the moment a note repeats, restart your streak right after the previous occurrence of that same note.',
    algorithm:
      '1. Initialize `lastSeen[0..255] = -1`, `left = 0`, `best = 0`.\n2. For `right` from `0` to `n - 1`:\n   - `c = s[right]`\n   - If `lastSeen[c] >= left`, set `left = lastSeen[c] + 1`.\n   - Set `lastSeen[c] = right`.\n   - `best = max(best, right - left + 1)`.\n3. Return `best`.',
    pseudocode: `lastSeen <- map/array initialized to -1
left <- 0, best <- 0
for right from 0 to len(s) - 1:
    c <- s[right]
    if lastSeen[c] >= left:
        left <- lastSeen[c] + 1
    lastSeen[c] <- right
    best <- max(best, right - left + 1)
return best`,
    dryRunExample:
      "`s = \"abcabcbb\"`:\n- `r=0..2 (\"abc\")`: `best=3`\n- `r=3 ('a')`: `lastSeen['a']=0 >= left(0)` -> `left=1`, `best=3`\n- `r=4 ('b')`: `left=2`, `best=3`\n- `r=5 ('c')`: `left=3`, `best=3` -> returns `3`.",
    timeComplexity: 'O(n) — single pass with O(1) jump',
    spaceComplexity: 'O(min(n, A)) where A is alphabet size (O(1) for fixed ASCII)',
    commonMistakes: [
      'Moving `left` backward when `lastSeen[c] < left` (must guard with `lastSeen[c] >= left` or `left = max(left, lastSeen[c] + 1)`).',
      'Assuming only lowercase `a-z` when inputs can include spaces, digits, or symbols (use 256 ASCII or a HashMap).',
    ],
    interviewTips: [
      'Jumping `left` via `lastSeen` avoids the inner `while` loop and guarantees strictly `n` iterations.',
    ],
    implementations: {
      c: `#include <string.h>\n\nint lengthOfLongestSubstring(const char* s) {\n    int last[256];\n    for (int i = 0; i < 256; i++) last[i] = -1;\n    int left = 0, best = 0;\n    for (int right = 0; s[right] != '\\0'; right++) {\n        unsigned char c = (unsigned char)s[right];\n        if (last[c] >= left) left = last[c] + 1;\n        last[c] = right;\n        int len = right - left + 1;\n        if (len > best) best = len;\n    }\n    return best;\n}`,
      cpp: `#include <algorithm>\n#include <string>\n#include <vector>\nusing namespace std;\n\nint lengthOfLongestSubstring(const string& s) {\n    vector<int> last(256, -1);\n    int left = 0, best = 0;\n    for (int right = 0; right < static_cast<int>(s.size()); ++right) {\n        unsigned char c = static_cast<unsigned char>(s[right]);\n        if (last[c] >= left) left = last[c] + 1;\n        last[c] = right;\n        best = max(best, right - left + 1);\n    }\n    return best;\n}`,
      java: `import java.util.Arrays;\n\npublic class LongestUniqueSubstring {\n    public static int lengthOfLongestSubstring(String s) {\n        int[] last = new int[256];\n        Arrays.fill(last, -1);\n        int left = 0, best = 0;\n        for (int right = 0; right < s.length(); right++) {\n            char c = s.charAt(right);\n            if (last[c] >= left) left = last[c] + 1;\n            last[c] = right;\n            best = Math.max(best, right - left + 1);\n        }\n        return best;\n    }\n}`,
      python: `def length_of_longest_substring(s: str) -> int:\n    last_seen: dict[str, int] = {}\n    left = best = 0\n    for right, ch in enumerate(s):\n        if ch in last_seen and last_seen[ch] >= left:\n            left = last_seen[ch] + 1\n        last_seen[ch] = right\n        best = max(best, right - left + 1)\n    return best`,
    },
  },
  {
    topicSlug: 'minimum-size-subarray-sum',
    title: 'Minimum Size Subarray Sum',
    definition:
      'Given an array of **positive** integers `nums` and an integer `target`, find the minimal length of a contiguous subarray whose sum is `>= target`, or `0` if none exists.',
    explanation:
      'Because all numbers are strictly positive, adding elements increases the sum and removing elements decreases it. Expand `right` until `sum >= target`, then greedily shrink `left` in a `while (sum >= target)` loop to record the shortest valid window ending at `right`.',
    realWorldAnalogy:
      'Filling a shipping crate to reach at least `target` kg: once you meet or exceed the weight, remove boxes from the back end to see the fewest consecutive boxes needed.',
    algorithm:
      '1. Initialize `left = 0`, `sum = 0`, `best = INF`.\n2. For `right` from `0` to `n - 1`:\n   - `sum += nums[right]`\n   - While `sum >= target`:\n     - `best = min(best, right - left + 1)`\n     - `sum -= nums[left++]`\n3. Return `best == INF ? 0 : best`.',
    pseudocode: `left <- 0, sum <- 0, best <- INF
for right from 0 to n - 1:
    sum <- sum + nums[right]
    while sum >= target:
        best <- min(best, right - left + 1)
        sum <- sum - nums[left]
        left <- left + 1
return 0 if best == INF else best`,
    dryRunExample:
      '`nums = [2, 3, 1, 2, 4, 3]`, `target = 7`:\n- `r=3 ([2,3,1,2])`: `sum=8 >= 7` -> `best=4`, shrink `l=1` (`sum=6`)\n- `r=4 ([3,1,2,4])`: `sum=10 >= 7` -> `best=4`, shrink `l=2` (`sum=7`) -> `best=3`, shrink `l=3` (`sum=6`)\n- `r=5 ([2,4,3])`: `sum=9 >= 7` -> `best=3`, shrink `l=4` (`sum=7`) -> `best=2` (`[4,3]`).',
    timeComplexity: 'O(n) — each element added once and subtracted at most once',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Returning `INT_MAX` instead of `0` when no subarray reaches `target`.',
      'Using this algorithm when negative integers are allowed (LeetCode 862 requires a monotonic deque on prefix sums instead).',
    ],
    interviewTips: [
      'Mention the `O(n log n)` follow-up: build prefix sums and binary-search `prefix[i] + target`.',
    ],
    implementations: {
      c: `#include <limits.h>\n\nint minSubArrayLen(int target, const int nums[], int n) {\n    int left = 0, best = INT_MAX;\n    long long sum = 0;\n    for (int right = 0; right < n; right++) {\n        sum += nums[right];\n        while (sum >= target) {\n            int len = right - left + 1;\n            if (len < best) best = len;\n            sum -= nums[left++];\n        }\n    }\n    return best == INT_MAX ? 0 : best;\n}`,
      cpp: `#include <algorithm>\n#include <climits>\n#include <vector>\nusing namespace std;\n\nint minSubArrayLen(int target, const vector<int>& nums) {\n    int left = 0, best = INT_MAX;\n    long long sum = 0;\n    for (int right = 0; right < static_cast<int>(nums.size()); ++right) {\n        sum += nums[right];\n        while (sum >= target) {\n            best = min(best, right - left + 1);\n            sum -= nums[left++];\n        }\n    }\n    return best == INT_MAX ? 0 : best;\n}`,
      java: `public class MinSizeSubarraySum {\n    public static int minSubArrayLen(int target, int[] nums) {\n        int left = 0, best = Integer.MAX_VALUE;\n        long sum = 0;\n        for (int right = 0; right < nums.length; right++) {\n            sum += nums[right];\n            while (sum >= target) {\n                best = Math.min(best, right - left + 1);\n                sum -= nums[left++];\n            }\n        }\n        return best == Integer.MAX_VALUE ? 0 : best;\n    }\n}`,
      python: `def min_subarray_len(target: int, nums: list[int]) -> int:\n    left = window_sum = 0\n    best = float('inf')\n    for right, val in enumerate(nums):\n        window_sum += val\n        while window_sum >= target:\n            best = min(best, right - left + 1)\n            window_sum -= nums[left]\n            left += 1\n    return 0 if best == float('inf') else int(best)`,
    },
  },
  {
    topicSlug: 'longest-repeating-character-replacement',
    title: 'Longest Repeating Character Replacement',
    definition:
      'Given a string `s` of uppercase English letters and an integer `k`, find the length of the longest substring that can be turned into all identical characters by replacing at most `k` characters.',
    explanation:
      'For any window `[left..right]` of length `L`, the minimum replacements needed to make all characters equal is `L - maxFreq`, where `maxFreq` is the count of the most frequent character in the window. A window is valid iff `L - maxFreq <= k`. Crucially, we never need to shrink `maxFreq` downward when sliding `left` because a smaller `maxFreq` can never produce a longer valid window than `best` already found.',
    realWorldAnalogy:
      'A row of colored tiles where you can repaint up to `k` tiles: keep the majority color untouched and repaint the `L - maxFreq` minority tiles.',
    algorithm:
      '1. Maintain `freq[26] = {0}`, `left = 0`, `maxFreq = 0`, `best = 0`.\n2. For `right` from `0` to `n - 1`:\n   - Increment `freq[s[right] - \'A\']` and update `maxFreq = max(maxFreq, freq[c])`.\n   - While `(right - left + 1) - maxFreq > k`, decrement `freq[s[left++] - \'A\']`.\n   - Update `best = max(best, right - left + 1)`.\n3. Return `best`.',
    pseudocode: `freq[26] <- 0, left <- 0, maxFreq <- 0, best <- 0
for right from 0 to len(s) - 1:
    freq[s[right]] <- freq[s[right]] + 1
    maxFreq <- max(maxFreq, freq[s[right]])
    while (right - left + 1) - maxFreq > k:
        freq[s[left]] <- freq[s[left]] - 1
        left <- left + 1
    best <- max(best, right - left + 1)
return best`,
    dryRunExample:
      "`s = \"AABABBA\"`, `k = 1`:\n- `r=0..3 (\"AABA\")`: `len=4, maxFreq=3`, `4 - 3 = 1 <= 1` -> `best=4`\n- `r=4 ('B')`: `len=5, maxFreq=3`, `5 - 3 = 2 > 1` -> shrink `l=1` (`\"ABAB\"`, `len=4`). Returns `4`.",
    timeComplexity: 'O(n) — single pass without rescanning 26 frequencies',
    spaceComplexity: 'O(1) — fixed 26-element array',
    commonMistakes: [
      'Scanning all 26 buckets to recompute `maxFreq` on every shrink (still O(26n), though unnecessary).',
      'Using `maxFreq` decrement incorrectly; keeping historical `maxFreq` is valid because `best` only grows when `maxFreq` grows.',
    ],
    interviewTips: [
      'Be ready to explain why not decrementing `maxFreq` is mathematically sound: `best` only increases when `(right - left + 1)` increases, which requires a strictly larger `maxFreq`.',
    ],
    implementations: {
      c: `int characterReplacement(const char* s, int k) {\n    int freq[26] = {0};\n    int left = 0, maxFreq = 0, best = 0;\n    for (int right = 0; s[right] != '\\0'; right++) {\n        int idx = s[right] - 'A';\n        freq[idx]++;\n        if (freq[idx] > maxFreq) maxFreq = freq[idx];\n        while ((right - left + 1) - maxFreq > k) {\n            freq[s[left++] - 'A']--;\n        }\n        int len = right - left + 1;\n        if (len > best) best = len;\n    }\n    return best;\n}`,
      cpp: `#include <algorithm>\n#include <string>\nusing namespace std;\n\nint characterReplacement(const string& s, int k) {\n    int freq[26] = {0};\n    int left = 0, maxFreq = 0, best = 0;\n    for (int right = 0; right < static_cast<int>(s.size()); ++right) {\n        maxFreq = max(maxFreq, ++freq[s[right] - 'A']);\n        while ((right - left + 1) - maxFreq > k) {\n            --freq[s[left++] - 'A'];\n        }\n        best = max(best, right - left + 1);\n    }\n    return best;\n}`,
      java: `public class CharacterReplacement {\n    public static int characterReplacement(String s, int k) {\n        int[] freq = new int[26];\n        int left = 0, maxFreq = 0, best = 0;\n        for (int right = 0; right < s.length(); right++) {\n            int idx = s.charAt(right) - 'A';\n            maxFreq = Math.max(maxFreq, ++freq[idx]);\n            while ((right - left + 1) - maxFreq > k) {\n                freq[s.charAt(left++) - 'A']--;\n            }\n            best = Math.max(best, right - left + 1);\n        }\n        return best;\n    }\n}`,
      python: `def character_replacement(s: str, k: int) -> int:\n    freq = [0] * 26\n    left = max_freq = best = 0\n    for right, ch in enumerate(s):\n        idx = ord(ch) - ord('A')\n        freq[idx] += 1\n        max_freq = max(max_freq, freq[idx])\n        while (right - left + 1) - max_freq > k:\n            freq[ord(s[left]) - ord('A')] -= 1\n            left += 1\n        best = max(best, right - left + 1)\n    return best`,
    },
  },
  {
    topicSlug: 'find-all-anagrams-in-string',
    title: 'Find All Anagrams in a String',
    definition:
      'Given strings `s` and `p`, return all start indices of `p`’s anagrams in `s` using a fixed-size sliding window of length `len(p)`.',
    explanation:
      'Two strings are anagrams iff they have identical character frequency vectors. Slide a window of size `m = len(p)` across `s`, incrementing the entering character’s count and decrementing the exiting character’s count. Comparing two 26-element frequency arrays (or tracking a `matches` counter) takes `O(1)` time per step.',
    realWorldAnalogy:
      'Sliding a `m`-letter stencil over a newspaper line and checking if the multiset of letters inside the stencil matches your Scrabble rack.',
    algorithm:
      '1. If `len(s) < len(p)`, return `[]`.\n2. Build `pCount[26]` and initial `sCount[26]` for `s[0..m-1]`.\n3. If `pCount == sCount`, record index `0`.\n4. For `right` from `m` to `len(s) - 1`:\n   - `sCount[s[right]]++`, `sCount[s[right - m]]--`.\n   - If `pCount == sCount`, record `right - m + 1`.',
    pseudocode: `if len(s) < len(p): return []
build pCount and sCount for first m = len(p) chars
if pCount == sCount: res.append(0)
for right from m to len(s) - 1:
    sCount[s[right]]++
    sCount[s[right - m]]--
    if pCount == sCount: res.append(right - m + 1)
return res`,
    dryRunExample:
      '`s = "cbaebabacd"`, `p = "abc"` (`m = 3`):\n- `0..2 ("cba")`: matches `{a:1,b:1,c:1}` -> add `0`\n- `1..3 ("bae")`, `2..4 ("aeb")`, ... no match\n- `6..8 ("bac")`: matches -> add `6` -> returns `[0, 6]`.',
    timeComplexity: 'O(n) — 26-element comparison is O(1)',
    spaceComplexity: 'O(1) — two 26-int arrays (excluding output)',
    commonMistakes: [
      'Sorting every window of length `m` (`O(n * m log m)`), which times out on large strings.',
      'Forgetting the `len(s) < len(p)` early return.',
    ],
    interviewTips: [
      'Same template solves "Permutation in String" (LeetCode 567)—just return `true` on the first match.',
    ],
    implementations: {
      c: `#include <string.h>\n\nint countAnagrams(const char* s, const char* p, int outIdx[]) {\n    int n = (int)strlen(s), m = (int)strlen(p);\n    if (n < m) return 0;\n    int pc[26] = {0}, sc[26] = {0}, found = 0;\n    for (int i = 0; i < m; i++) { pc[p[i] - 'a']++; sc[s[i] - 'a']++; }\n    if (memcmp(pc, sc, sizeof(pc)) == 0) outIdx[found++] = 0;\n    for (int r = m; r < n; r++) {\n        sc[s[r] - 'a']++;\n        sc[s[r - m] - 'a']--;\n        if (memcmp(pc, sc, sizeof(pc)) == 0) outIdx[found++] = r - m + 1;\n    }\n    return found;\n}`,
      cpp: `#include <array>\n#include <string>\n#include <vector>\nusing namespace std;\n\nvector<int> findAnagrams(const string& s, const string& p) {\n    int n = static_cast<int>(s.size()), m = static_cast<int>(p.size());\n    if (n < m) return {};\n    array<int, 26> pc{}, sc{};\n    for (int i = 0; i < m; ++i) { ++pc[p[i] - 'a']; ++sc[s[i] - 'a']; }\n    vector<int> res;\n    if (pc == sc) res.push_back(0);\n    for (int r = m; r < n; ++r) {\n        ++sc[s[r] - 'a'];\n        --sc[s[r - m] - 'a'];\n        if (pc == sc) res.push_back(r - m + 1);\n    }\n    return res;\n}`,
      java: `import java.util.*;\n\npublic class FindAnagrams {\n    public static List<Integer> findAnagrams(String s, String p) {\n        List<Integer> res = new ArrayList<>();\n        if (s.length() < p.length()) return res;\n        int[] pc = new int[26], sc = new int[26];\n        int m = p.length();\n        for (int i = 0; i < m; i++) { pc[p.charAt(i) - 'a']++; sc[s.charAt(i) - 'a']++; }\n        if (Arrays.equals(pc, sc)) res.add(0);\n        for (int r = m; r < s.length(); r++) {\n            sc[s.charAt(r) - 'a']++;\n            sc[s.charAt(r - m) - 'a']--;\n            if (Arrays.equals(pc, sc)) res.add(r - m + 1);\n        }\n        return res;\n    }\n}`,
      python: `def find_anagrams(s: str, p: str) -> list[int]:\n    n, m = len(s), len(p)\n    if n < m:\n        return []\n    pc, sc = [0] * 26, [0] * 26\n    for i in range(m):\n        pc[ord(p[i]) - 97] += 1\n        sc[ord(s[i]) - 97] += 1\n    res = [0] if pc == sc else []\n    for r in range(m, n):\n        sc[ord(s[r]) - 97] += 1\n        sc[ord(s[r - m]) - 97] -= 1\n        if pc == sc:\n            res.append(r - m + 1)\n    return res`,
    },
  },
  {
    topicSlug: 'minimum-window-substring',
    title: 'Minimum Window Substring',
    definition:
      'Given strings `s` and `t`, find the shortest contiguous substring of `s` that contains every character in `t` (including duplicates), or `""` if no such substring exists.',
    explanation:
      'Build a `need[128]` frequency table for `t` and track `missing = len(t)` (total characters still needed). Expand `right`: if `need[s[right]] > 0`, decrement `missing`; always decrement `need[s[right]]`. Once `missing == 0`, the window is valid—shrink `left` while `missing == 0`, updating the best window, and when removing `s[left]` pushes `need[s[left]]` above `0`, increment `missing`.',
    realWorldAnalogy:
      'Collecting a shopping list `t` from a supermarket aisle `s`: walk forward until your cart has every item on the list, then drop redundant items from the back of the aisle walk to minimize the distance.',
    algorithm:
      '1. Populate `need[ch]++` for all `ch` in `t`; set `missing = len(t)`.\n2. Initialize `left = 0`, `bestStart = 0`, `bestLen = INF`.\n3. For `right` from `0` to `len(s) - 1`:\n   - If `need[s[right]] > 0`, `missing--`.\n   - `need[s[right]]--`.\n   - While `missing == 0`:\n     - Update `(bestStart, bestLen)` if `right - left + 1 < bestLen`.\n     - `need[s[left]]++`; if `need[s[left]] > 0`, `missing++`.\n     - `left++`.\n4. Return `bestLen == INF ? "" : s.substr(bestStart, bestLen)`.',
    pseudocode: `need[ch] <- count in t; missing <- len(t)
left <- 0, bestLen <- INF, bestStart <- 0
for right from 0 to len(s) - 1:
    if need[s[right]] > 0: missing <- missing - 1
    need[s[right]] <- need[s[right]] - 1
    while missing == 0:
        if right - left + 1 < bestLen:
            bestLen <- right - left + 1; bestStart <- left
        need[s[left]] <- need[s[left]] + 1
        if need[s[left]] > 0: missing <- missing + 1
        left <- left + 1`,
    dryRunExample:
      '`s = "ADOBECODEBANC"`, `t = "ABC"`:\n- Valid at `r=5 ("ADOBEC")`, `bestLen=6`\n- Shrinks `l=1`, expands to `r=10 ("DOBECODEBA")`, shrinks to `l=5 ("CODEBA")` len `6`\n- Expands to `r=12 ("BANC")`, shrinks to `l=9 ("BANC")`, `bestLen=4` -> returns `"BANC"`.',
    timeComplexity: 'O(|s| + |t|)',
    spaceComplexity: 'O(1) for ASCII 128-entry table',
    commonMistakes: [
      'Decrementing `missing` even when `need[c] <= 0` (excess duplicates of a needed char should not satisfy other missing chars).',
      'Slicing substrings inside the inner loop instead of storing `(bestStart, bestLen)` and slicing once at the end.',
    ],
    interviewTips: [
      'Using a single `need[128]` array + `missing` counter is cleaner and faster than maintaining two separate hash maps.',
    ],
    implementations: {
      c: `#include <limits.h>\n#include <string.h>\n\nvoid minWindow(const char* s, const char* t, int* outStart, int* outLen) {\n    int need[128] = {0}, missing = (int)strlen(t);\n    for (int i = 0; t[i]; i++) need[(unsigned char)t[i]]++;\n    int left = 0, bestStart = 0, bestLen = INT_MAX;\n    for (int right = 0; s[right]; right++) {\n        unsigned char c = (unsigned char)s[right];\n        if (need[c] > 0) missing--;\n        need[c]--;\n        while (missing == 0) {\n            if (right - left + 1 < bestLen) { bestLen = right - left + 1; bestStart = left; }\n            unsigned char lc = (unsigned char)s[left++];\n            need[lc]++;\n            if (need[lc] > 0) missing++;\n        }\n    }\n    *outStart = bestStart;\n    *outLen = (bestLen == INT_MAX) ? 0 : bestLen;\n}`,
      cpp: `#include <climits>\n#include <string>\nusing namespace std;\n\nstring minWindow(const string& s, const string& t) {\n    int need[128] = {0};\n    for (unsigned char c : t) ++need[c];\n    int missing = static_cast<int>(t.size()), left = 0, bestStart = 0, bestLen = INT_MAX;\n    for (int right = 0; right < static_cast<int>(s.size()); ++right) {\n        unsigned char c = static_cast<unsigned char>(s[right]);\n        if (need[c] > 0) --missing;\n        --need[c];\n        while (missing == 0) {\n            if (right - left + 1 < bestLen) { bestLen = right - left + 1; bestStart = left; }\n            unsigned char lc = static_cast<unsigned char>(s[left++]);\n            if (++need[lc] > 0) ++missing;\n        }\n    }\n    return bestLen == INT_MAX ? "" : s.substr(bestStart, bestLen);\n}`,
      java: `public class MinWindowSubstring {\n    public static String minWindow(String s, String t) {\n        int[] need = new int[128];\n        for (char c : t.toCharArray()) need[c]++;\n        int missing = t.length(), left = 0, bestStart = 0, bestLen = Integer.MAX_VALUE;\n        for (int right = 0; right < s.length(); right++) {\n            char c = s.charAt(right);\n            if (need[c] > 0) missing--;\n            need[c]--;\n            while (missing == 0) {\n                if (right - left + 1 < bestLen) { bestLen = right - left + 1; bestStart = left; }\n                char lc = s.charAt(left++);\n                if (++need[lc] > 0) missing++;\n            }\n        }\n        return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestStart, bestStart + bestLen);\n    }\n}`,
      python: `from collections import Counter\n\ndef min_window(s: str, t: str) -> str:\n    need = Counter(t)\n    missing = len(t)\n    left = best_start = 0\n    best_len = float('inf')\n    for right, ch in enumerate(s):\n        if need[ch] > 0:\n            missing -= 1\n        need[ch] -= 1\n        while missing == 0:\n            if right - left + 1 < best_len:\n                best_len = right - left + 1\n                best_start = left\n            need[s[left]] += 1\n            if need[s[left]] > 0:\n                missing += 1\n            left += 1\n    return "" if best_len == float('inf') else s[best_start:best_start + int(best_len)]`,
    },
  },

  // =========================================================================
  // MODULE 15: BIT MANIPULATION (13 Concepts)
  // =========================================================================
  {
    topicSlug: 'binary-number-system',
    title: 'Binary Number System & Two’s Complement',
    definition:
      'The binary number system represents numbers in base-2 using bits (`0` and `1`), where bit position `i` (0-indexed from the right) carries weight `2^i`. Signed integers in modern CPUs use Two’s Complement.',
    explanation:
      'An unsigned `w`-bit integer spans `0` to `2^w - 1`. In Two’s Complement for signed `w`-bit integers, the most significant bit (MSB) has weight `-2^(w-1)`, giving range `[-2^(w-1), 2^(w-1) - 1]`. Negating `x` computes `~x + 1`, which makes addition and subtraction identical in hardware.',
    realWorldAnalogy:
      'A row of light switches where each switch doubles the brightness of the previous one (`1, 2, 4, 8, ...`): any integer is a unique ON/OFF combination.',
    algorithm:
      '1. To convert non-negative `n` to binary: repeatedly take `n % 2` (or `n & 1`) and divide `n` by `2` (or `n >> 1`).\n2. Read remainders in reverse order.\n3. For Two’s Complement of `-x`: invert all bits of `x` (`~x`) and add `1`.',
    pseudocode: `if n == 0: return "0"
bits <- ""
while n > 0:
    bits <- str(n & 1) + bits
    n <- n >> 1
return bits`,
    dryRunExample:
      '`n = 13`: `13 & 1 = 1` (`n=6`), `6 & 1 = 0` (`n=3`), `3 & 1 = 1` (`n=1`), `1 & 1 = 1` (`n=0`) -> `1101` (`8 + 4 + 0 + 1 = 13`).',
    timeComplexity: 'O(log n) — number of bits in n',
    spaceComplexity: 'O(log n) to store binary digits',
    commonMistakes: [
      'Overflowing `-INT_MIN` in Two’s Complement because `+2^31` does not fit in signed 32-bit `int`.',
      'Right-shifting negative signed integers in C/C++ (implementation-defined arithmetic vs logical shift).',
    ],
    interviewTips: [
      'Remember `~x == -(x + 1)` in Two’s Complement, and `x & -x` isolates the lowest set bit.',
    ],
    implementations: {
      c: `#include <stdio.h>\n\nvoid printBinary32(unsigned int n) {\n    for (int i = 31; i >= 0; i--) {\n        putchar(((n >> i) & 1U) ? '1' : '0');\n    }\n}`,
      cpp: `#include <string>\nusing namespace std;\n\nstring toBinary(unsigned int n) {\n    if (n == 0) return "0";\n    string res;\n    while (n > 0) {\n        res.push_back((n & 1U) ? '1' : '0');\n        n >>= 1;\n    }\n    reverse(res.begin(), res.end());\n    return res;\n}`,
      java: `public class BinarySystem {\n    public static String toBinary(int n) {\n        return Integer.toBinaryString(n);\n    }\n}`,
      python: `def to_binary(n: int) -> str:\n    if n == 0:\n        return "0"\n    bits = []\n    while n > 0:\n        bits.append(str(n & 1))\n        n >>= 1\n    return "".join(reversed(bits))`,
    },
  },
  {
    topicSlug: 'and-or-xor-not',
    title: 'Bitwise Operators: AND, OR, XOR, NOT',
    definition:
      'Bitwise operators (`&`, `|`, `^`, `~`) operate independently on each aligned pair of bits in two integers (or every bit of one integer for `~`).',
    explanation:
      '- **AND (`&`):** `1` only if both bits are `1` (used for masking/checking).\n- **OR (`|`):** `1` if at least one bit is `1` (used for setting/combining flags).\n- **XOR (`^`):** `1` if bits differ (used for toggling, parity, and canceling pairs).\n- **NOT (`~`):** flips every bit (`0 <-> 1`).',
    realWorldAnalogy:
      'Permission flags on a file (`READ=4, WRITE=2, EXEC=1`): OR combines permissions, AND checks if a permission is granted, XOR toggles a permission.',
    algorithm:
      '1. Apply `&` to keep only bits active in both operands.\n2. Apply `|` to turn on bits active in either operand.\n3. Apply `^` to find differing bits.\n4. Apply `~` to invert all bits (mask with `(1 << w) - 1` in Python for fixed width).',
    pseudocode: `a & b  // bit is 1 iff both bits are 1
a | b  // bit is 1 iff either bit is 1
a ^ b  // bit is 1 iff bits differ
~a     // flips every bit`,
    dryRunExample:
      '`a = 6 (0110)`, `b = 5 (0101)`:\n- `a & b = 0100 (4)`\n- `a | b = 0111 (7)`\n- `a ^ b = 0011 (3)`.',
    timeComplexity: 'O(1) — single CPU instruction on fixed-width integers',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Confusing bitwise `&`/`|` with logical `&&`/`||`.',
      'Forgetting operator precedence: `==` binds tighter than `&`, `^`, `|` in C/C++/Java! Always write `(a & 1) == 0`, not `a & 1 == 0`.',
    ],
    interviewTips: [
      'Always parenthesize bitwise expressions when combining with comparisons or arithmetic.',
    ],
    implementations: {
      c: `void swapXor(int* a, int* b) {\n    if (a == b) return;\n    *a ^= *b;\n    *b ^= *a;\n    *a ^= *b;\n}`,
      cpp: `void swapXor(int& a, int& b) {\n    if (&a == &b) return;\n    a ^= b;\n    b ^= a;\n    a ^= b;\n}`,
      java: `public class BitwiseOps {\n    public static int combineFlags(int a, int b) { return a | b; }\n    public static boolean hasFlag(int mask, int flag) { return (mask & flag) == flag; }\n}`,
      python: `def bitwise_summary(a: int, b: int) -> tuple[int, int, int]:\n    return (a & b, a | b, a ^ b)`,
    },
  },
  {
    topicSlug: 'left-shift-right-shift',
    title: 'Left Shift (<<) and Right Shift (>>)',
    definition:
      'Left shift (`x << k`) moves all bits `k` positions left (filling `0`s on the right, multiplying by `2^k`), while right shift (`x >> k`) moves bits `k` positions right (dividing by `2^k` for non-negative `x`).',
    explanation:
      'Shifts are the foundation of bitmasks (`1 << k` creates a mask with only bit `k` set). In Java, `>>` is arithmetic right shift (preserves sign bit) while `>>>` is unsigned/logical right shift (fills `0`s from the left). In C/C++, shifting a negative number or shifting by `>= bit_width` is undefined behavior.',
    realWorldAnalogy:
      'Multiplying or dividing a decimal number by `10^k` by shifting digits left or right, except in base-2 with powers of `2`.',
    algorithm:
      '1. Use `1U << k` (or `1ULL << k` for 64-bit) to build a single-bit mask.\n2. Use `n >> 1` for fast floor division by 2 on non-negative integers.',
    pseudocode: `mask <- 1 << k       // equals 2^k
halved <- n >> 1     // floor(n / 2) for n >= 0`,
    dryRunExample:
      '`5 (0101) << 2 = 20 (10100)`; `20 (10100) >> 2 = 5 (0101)`.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Writing `1 << 31` or `1 << 40` on a 32-bit signed `int` (overflow / UB; use `1ULL << k` or `1L << k`).',
      'Assuming `(-1) >> 1` is `0` (arithmetic shift keeps it `-1`).',
    ],
    interviewTips: [
      'Always use `1ULL << k` in C++ when `k` can be `>= 31`.',
    ],
    implementations: {
      c: `unsigned long long pow2Mask(int k) {\n    return 1ULL << k;\n}`,
      cpp: `#include <cstdint>\nuint64_t pow2Mask(int k) {\n    return 1ULL << k;\n}`,
      java: `public class Shifts {\n    public static long pow2Mask(int k) { return 1L << k; }\n    public static int logicalRightShift(int x, int k) { return x >>> k; }\n}`,
      python: `def pow2_mask(k: int) -> int:\n    return 1 << k`,
    },
  },
  {
    topicSlug: 'set-a-bit',
    title: 'Set the k-th Bit',
    definition:
      'Setting the `k`-th bit (0-indexed from LSB) forces bit `k` of `n` to `1` while leaving all other bits unchanged using `n | (1 << k)`.',
    explanation:
      'The mask `1 << k` has `1` only at position `k` and `0` everywhere else. Because `b | 0 == b` and `b | 1 == 1`, bitwise OR sets bit `k` to `1` regardless of its previous value.',
    realWorldAnalogy:
      'Turning ON a specific switch on a control panel without touching any other switch.',
    algorithm:
      '1. Construct mask `1 << k`.\n2. Return `n | (1 << k)`.',
    pseudocode: `return n | (1 << k)`,
    dryRunExample:
      '`n = 9 (1001)`, `k = 1`:\n`1 << 1 = 0010`\n`1001 | 0010 = 1011 (11)`.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Using `n + (1 << k)` instead of `n | (1 << k)`, which corrupts higher bits if bit `k` was already `1`.',
    ],
    interviewTips: [
      'Used constantly in DP bitmasking to mark item `k` as visited: `mask | (1 << k)`.',
    ],
    implementations: {
      c: `int setBit(int n, int k) { return n | (1 << k); }`,
      cpp: `int setBit(int n, int k) { return n | (1 << k); }`,
      java: `public class SetBit { public static int setBit(int n, int k) { return n | (1 << k); } }`,
      python: `def set_bit(n: int, k: int) -> int:\n    return n | (1 << k)`,
    },
  },
  {
    topicSlug: 'clear-a-bit',
    title: 'Clear the k-th Bit',
    definition:
      'Clearing the `k`-th bit forces bit `k` of `n` to `0` while keeping all other bits intact using `n & ~(1 << k)`.',
    explanation:
      '`~(1 << k)` has `0` at position `k` and `1` everywhere else. Since `b & 1 == b` and `b & 0 == 0`, bitwise AND clears bit `k` without affecting any other bit.',
    realWorldAnalogy:
      'Applying a stencil with one blocked hole (`0`) and all other holes open (`1`) so only that one bit is erased.',
    algorithm:
      '1. Construct inverted mask `~(1 << k)`.\n2. Return `n & ~(1 << k)`.',
    pseudocode: `return n & ~(1 << k)`,
    dryRunExample:
      '`n = 13 (1101)`, `k = 2`:\n`1 << 2 = 0100`, `~0100 = 1011`\n`1101 & 1011 = 1001 (9)`.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Writing `n - (1 << k)`, which corrupts bits if bit `k` was already `0`.',
    ],
    interviewTips: [
      'Bonus identity: `n & (n - 1)` clears the **lowest** set bit of `n` in `O(1)`.',
    ],
    implementations: {
      c: `int clearBit(int n, int k) { return n & ~(1 << k); }`,
      cpp: `int clearBit(int n, int k) { return n & ~(1 << k); }`,
      java: `public class ClearBit { public static int clearBit(int n, int k) { return n & ~(1 << k); } }`,
      python: `def clear_bit(n: int, k: int) -> int:\n    return n & ~(1 << k)`,
    },
  },
  {
    topicSlug: 'toggle-a-bit',
    title: 'Toggle the k-th Bit',
    definition:
      'Toggling the `k`-th bit flips bit `k` of `n` (`0 -> 1` or `1 -> 0`) while preserving all other bits using `n ^ (1 << k)`.',
    explanation:
      'Because `b ^ 0 == b` and `b ^ 1 == !b`, XOR with `1 << k` flips only position `k`.',
    realWorldAnalogy:
      'Pressing a push-button light switch: if it was ON it turns OFF, and if it was OFF it turns ON.',
    algorithm:
      '1. Construct mask `1 << k`.\n2. Return `n ^ (1 << k)`.',
    pseudocode: `return n ^ (1 << k)`,
    dryRunExample:
      '`n = 13 (1101)`, `k = 1`: `1101 ^ 0010 = 1111 (15)`. Toggle again: `1111 ^ 0010 = 1101 (13)`.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Using `|` instead of `^` (sets instead of flipping).',
    ],
    interviewTips: [
      'Toggling is its own inverse: `(n ^ (1 << k)) ^ (1 << k) == n`.',
    ],
    implementations: {
      c: `int toggleBit(int n, int k) { return n ^ (1 << k); }`,
      cpp: `int toggleBit(int n, int k) { return n ^ (1 << k); }`,
      java: `public class ToggleBit { public static int toggleBit(int n, int k) { return n ^ (1 << k); } }`,
      python: `def toggle_bit(n: int, k: int) -> int:\n    return n ^ (1 << k)`,
    },
  },
  {
    topicSlug: 'check-if-bit-is-set',
    title: 'Check if the k-th Bit is Set',
    definition:
      'Determine whether bit `k` of integer `n` is `1` using `(n & (1 << k)) != 0` or `((n >> k) & 1) == 1`.',
    explanation:
      'Both expressions isolate bit `k`: `(n >> k) & 1` shifts bit `k` down to position `0` and masks off higher bits, returning strictly `0` or `1`. `(n & (1 << k)) != 0` checks in-place without shifting `n`.',
    realWorldAnalogy:
      'Looking through a pinhole card aligned with the `k`-th LED on a status bar.',
    algorithm:
      '1. Shift `n` right by `k` and AND with `1`: `(n >> k) & 1`.\n2. Return `true` if result is `1`, else `false`.',
    pseudocode: `return ((n >> k) & 1) == 1`,
    dryRunExample:
      '`n = 10 (1010)`, `k = 3`: `(10 >> 3) & 1 = 1 & 1 = 1` (`true`); `k = 2`: `(10 >> 2) & 1 = 2 & 1 = 0` (`false`).',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Checking `(n & (1 << k)) == 1` instead of `!= 0` (when `k > 0`, `n & (1 << k)` equals `2^k`, not `1`!).',
    ],
    interviewTips: [
      'Prefer `((n >> k) & 1) != 0` or `(n & (1 << k)) != 0` to avoid the `== 1` bug.',
    ],
    implementations: {
      c: `#include <stdbool.h>\nbool isBitSet(int n, int k) { return ((n >> k) & 1) != 0; }`,
      cpp: `bool isBitSet(int n, int k) { return ((n >> k) & 1) != 0; }`,
      java: `public class CheckBit { public static boolean isBitSet(int n, int k) { return ((n >> k) & 1) != 0; } }`,
      python: `def is_bit_set(n: int, k: int) -> bool:\n    return ((n >> k) & 1) == 1`,
    },
  },
  {
    topicSlug: 'power-of-two',
    title: 'Check Power of Two',
    definition:
      'A positive integer `n` is a power of two iff its binary representation has **exactly one** set bit, which holds iff `n > 0 && (n & (n - 1)) == 0`.',
    explanation:
      'Subtracting `1` from `n` flips the lowest set bit to `0` and all trailing `0`s to `1`. Therefore, if `n` has only one `1` bit (`1000...0`), `n - 1` is `0111...1`, and `n & (n - 1)` equals `0`. Guarding `n > 0` excludes `0` and negative numbers.',
    realWorldAnalogy:
      'A tournament bracket size (`2, 4, 8, 16, ...`): only one single power-of-two bit is active.',
    algorithm:
      '1. Check `n > 0`.\n2. Check `(n & (n - 1)) == 0`.\n3. Return `true` iff both hold.',
    pseudocode: `return n > 0 and (n & (n - 1)) == 0`,
    dryRunExample:
      '`n = 16 (10000)`: `n - 1 = 15 (01111)` -> `16 & 15 = 0` -> `true`.\n`n = 12 (1100)`: `n - 1 = 11 (1011)` -> `12 & 11 = 1000 (8) != 0` -> `false`.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Forgetting `n > 0`, which wrongly returns `true` for `n = 0` (`0 & -1 == 0`) or overflows `INT_MIN - 1`.',
    ],
    interviewTips: [
      'Related trick: power of four requires `n > 0 && (n & (n - 1)) == 0 && (n & 0x55555555) != 0`.',
    ],
    implementations: {
      c: `#include <stdbool.h>\nbool isPowerOfTwo(int n) { return n > 0 && (n & (n - 1)) == 0; }`,
      cpp: `bool isPowerOfTwo(int n) { return n > 0 && (n & (n - 1)) == 0; }`,
      java: `public class PowerOfTwo { public static boolean isPowerOfTwo(int n) { return n > 0 && (n & (n - 1)) == 0; } }`,
      python: `def is_power_of_two(n: int) -> bool:\n    return n > 0 and (n & (n - 1)) == 0`,
    },
  },
  {
    topicSlug: 'count-set-bits-brian-kernighan',
    title: 'Count Set Bits (Brian Kernighan’s Algorithm)',
    definition:
      'Brian Kernighan’s algorithm counts the number of `1` bits (Hamming weight) in an integer by repeatedly clearing the lowest set bit via `n = n & (n - 1)`.',
    explanation:
      'Instead of looping over all 32 or 64 bits, `n & (n - 1)` strips exactly one set bit per iteration. Thus the loop runs `k` times where `k` is the number of `1` bits in `n`.',
    realWorldAnalogy:
      'Turning off only the lit bulbs in a control panel one by one—you skip all unlit bulbs.',
    algorithm:
      '1. Initialize `count = 0`.\n2. While `n != 0` (using unsigned `n`):\n   - `n = n & (n - 1)`\n   - `count++`\n3. Return `count`.',
    pseudocode: `count <- 0
while n != 0:
    n <- n & (n - 1)
    count <- count + 1
return count`,
    dryRunExample:
      '`n = 13 (1101)`:\n- Iter 1: `1101 & 1100 = 1100`, `count=1`\n- Iter 2: `1100 & 1011 = 1000`, `count=2`\n- Iter 3: `1000 & 0111 = 0000`, `count=3` -> returns `3`.',
    timeComplexity: 'O(k) where k is the number of set bits (at most O(log n))',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Passing a negative signed `int` without casting to unsigned if unsigned Hamming weight is expected.',
    ],
    interviewTips: [
      'Mention built-in popcount instructions (`__builtin_popcount` in GCC/Clang, `Integer.bitCount` in Java, `int.bit_count()` in Python 3.10+).',
    ],
    implementations: {
      c: `int hammingWeight(unsigned int n) {\n    int count = 0;\n    while (n != 0) {\n        n &= (n - 1);\n        count++;\n    }\n    return count;\n}`,
      cpp: `#include <cstdint>\nint hammingWeight(uint32_t n) {\n    int count = 0;\n    while (n != 0) {\n        n &= (n - 1);\n        ++count;\n    }\n    return count;\n}`,
      java: `public class CountSetBits {\n    public static int hammingWeight(int n) {\n        int count = 0;\n        while (n != 0) {\n            n &= (n - 1);\n            count++;\n        }\n        return count;\n    }\n}`,
      python: `def hamming_weight(n: int) -> int:\n    count = 0\n    while n:\n        n &= n - 1\n        count += 1\n    return count`,
    },
  },
  {
    topicSlug: 'xor-properties',
    title: 'XOR Properties & Algebraic Tricks',
    definition:
      'Bitwise XOR (`^`) is commutative, associative, has identity `0` (`x ^ 0 == x`), and is self-inverse (`x ^ x == 0`).',
    explanation:
      'Because `x ^ x == 0` and order does not matter, any value appearing an even number of times in an XOR chain cancels out completely. This enables `O(1)`-space algorithms for missing numbers, duplicate detection, and prefix XOR subarray queries.',
    realWorldAnalogy:
      'Tapping a light switch twice leaves it in its original state; only switches tapped an odd number of times change state.',
    algorithm:
      'Key identities:\n- `a ^ 0 = a`\n- `a ^ a = 0`\n- `a ^ b = b ^ a` (commutative)\n- `(a ^ b) ^ c = a ^ (b ^ c)` (associative)\n- If `a ^ b = c`, then `a ^ c = b` and `b ^ c = a`.',
    pseudocode: `// Missing number in 0..n:
ans <- n
for i from 0 to n - 1:
    ans <- ans ^ i ^ nums[i]
return ans`,
    dryRunExample:
      'Missing number in `[3, 0, 1]` (`n = 3`):\n`3 ^ (0^3) ^ (1^0) ^ (2^1) = (0^0) ^ (1^1) ^ (3^3) ^ 2 = 2`.',
    timeComplexity: 'O(n) for array XOR scans; O(1) per operation',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Using XOR swap `a ^= b; b ^= a; a ^= b` when `a` and `b` alias the same memory address (zeroes out the value!).',
    ],
    interviewTips: [
      'Prefix XOR `px[r+1] ^ px[l]` answers range XOR queries in `O(1)` just like prefix sums.',
    ],
    implementations: {
      c: `int missingNumber(const int nums[], int n) {\n    int ans = n;\n    for (int i = 0; i < n; i++) ans ^= i ^ nums[i];\n    return ans;\n}`,
      cpp: `#include <vector>\nusing namespace std;\n\nint missingNumber(const vector<int>& nums) {\n    int ans = static_cast<int>(nums.size());\n    for (int i = 0; i < static_cast<int>(nums.size()); ++i) ans ^= i ^ nums[i];\n    return ans;\n}`,
      java: `public class XorProperties {\n    public static int missingNumber(int[] nums) {\n        int ans = nums.length;\n        for (int i = 0; i < nums.length; i++) ans ^= i ^ nums[i];\n        return ans;\n    }\n}`,
      python: `def missing_number(nums: list[int]) -> int:\n    ans = len(nums)\n    for i, x in enumerate(nums):\n        ans ^= i ^ x\n    return ans`,
    },
  },
  {
    topicSlug: 'single-number',
    title: 'Single Number (XOR Cancellation)',
    definition:
      'Given an array where every element appears twice except for one unique element, find that single element in `O(n)` time and `O(1)` space.',
    explanation:
      'XORing all elements together cancels every paired number (`x ^ x = 0`), leaving only `0 ^ unique = unique`. When **two** numbers appear once (`Single Number III`), XOR all elements to get `diff = a ^ b`, isolate the lowest set bit `lsb = diff & (-diff)` where `a` and `b` differ, and partition the array into two buckets by `lsb` to recover `a` and `b`.',
    realWorldAnalogy:
      'Finding the one unmatched sock in a pile by pairing identical socks and discarding pairs.',
    algorithm:
      '1. Initialize `ans = 0`.\n2. For each `x` in `nums`: `ans ^= x`.\n3. Return `ans`.',
    pseudocode: `ans <- 0
for x in nums:
    ans <- ans ^ x
return ans`,
    dryRunExample:
      '`nums = [4, 1, 2, 1, 2]`:\n`0 ^ 4 ^ 1 ^ 2 ^ 1 ^ 2 = 4 ^ (1^1) ^ (2^2) = 4`.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Using a HashSet (`O(n)` space) when the problem explicitly requires `O(1)` extra space.',
    ],
    interviewTips: [
      'For "every element appears 3 times except one" (Single Number II), count bits modulo 3 across all 32 bit positions.',
    ],
    implementations: {
      c: `int singleNumber(const int nums[], int n) {\n    int ans = 0;\n    for (int i = 0; i < n; i++) ans ^= nums[i];\n    return ans;\n}`,
      cpp: `#include <vector>\nusing namespace std;\n\nint singleNumber(const vector<int>& nums) {\n    int ans = 0;\n    for (int x : nums) ans ^= x;\n    return ans;\n}`,
      java: `public class SingleNumber {\n    public static int singleNumber(int[] nums) {\n        int ans = 0;\n        for (int x : nums) ans ^= x;\n        return ans;\n    }\n}`,
      python: `def single_number(nums: list[int]) -> int:\n    ans = 0\n    for x in nums:\n        ans ^= x\n    return ans`,
    },
  },
  {
    topicSlug: 'bitmasking-introduction',
    title: 'Bitmasking Introduction',
    definition:
      'Bitmasking encodes a subset of `n` boolean choices (typically `n <= 20..30`) as a single integer `mask`, where bit `i` is `1` if element `i` is included and `0` otherwise.',
    explanation:
      'Instead of passing a `boolean[]` or `Set<Integer>` around in recursion or DP memoization, a single integer `mask` represents the entire state. Set union is `A | B`, intersection is `A & B`, membership is `(mask >> i) & 1`, adding item `i` is `mask | (1 << i)`, and removing item `i` is `mask & ~(1 << i)`.',
    realWorldAnalogy:
      'A 7-bit weekly schedule byte where each bit represents a day (`Mon..Sun`): `0b0011111` means Monday–Friday.',
    algorithm:
      '1. Empty set: `0`; Full set of `n` items: `(1 << n) - 1`.\n2. Iterate all subsets: `for (int mask = 0; mask < (1 << n); mask++)`.\n3. Iterate submasks of `mask`: `for (int sub = mask; sub > 0; sub = (sub - 1) & mask)`.',
    pseudocode: `fullMask <- (1 << n) - 1
// Add i:    mask | (1 << i)
// Remove i: mask & ~(1 << i)
// Check i:  (mask >> i) & 1`,
    dryRunExample:
      'For `n = 3` (`{A, B, C}`): `mask = 5 (101_2)` represents `{A, C}`. Adding `B (i=1)`: `5 | (1 << 1) = 7 (111_2) = {A, B, C}`.',
    timeComplexity: 'O(1) per set operation; O(2^n) to iterate all masks',
    spaceComplexity: 'O(1) per state integer',
    commonMistakes: [
      'Using bitmasking when `n > 30` (overflows 32-bit int and `2^n` exceeds time/memory limits).',
    ],
    interviewTips: [
      'Bitmask DP shines in TSP, Hamiltonian path, and assignment problems when `n <= 20`.',
    ],
    implementations: {
      c: `int addElem(int mask, int i) { return mask | (1 << i); }\nint removeElem(int mask, int i) { return mask & ~(1 << i); }\nint hasElem(int mask, int i) { return (mask >> i) & 1; }`,
      cpp: `int addElem(int mask, int i) { return mask | (1 << i); }\nint removeElem(int mask, int i) { return mask & ~(1 << i); }\nbool hasElem(int mask, int i) { return ((mask >> i) & 1) != 0; }`,
      java: `public class BitmaskIntro {\n    public static int add(int mask, int i) { return mask | (1 << i); }\n    public static int remove(int mask, int i) { return mask & ~(1 << i); }\n    public static boolean has(int mask, int i) { return ((mask >> i) & 1) != 0; }\n}`,
      python: `def add_elem(mask: int, i: int) -> int: return mask | (1 << i)\ndef remove_elem(mask: int, i: int) -> int: return mask & ~(1 << i)\ndef has_elem(mask: int, i: int) -> bool: return ((mask >> i) & 1) == 1`,
    },
  },
  {
    topicSlug: 'subset-generation-using-bits',
    title: 'Subset Generation Using Bitmasks (Power Set)',
    definition:
      'Generate all `2^n` subsets of an `n`-element array iteratively by mapping each integer `mask` in `[0, 2^n - 1]` to a subset via its set bits.',
    explanation:
      'Every `n`-bit binary number from `0` to `2^n - 1` corresponds bijectively to one subset: if bit `i` of `mask` is `1`, include `nums[i]`; if `0`, exclude it. This avoids recursion stack overhead and visits all `2^n` subsets deterministically.',
    realWorldAnalogy:
      'Listing all pizza topping combinations from `000` (plain cheese) to `111` (all 3 toppings) by counting up in binary.',
    algorithm:
      '1. Set `total = 1 << n`.\n2. For `mask` from `0` to `total - 1`:\n   - Create empty list `sub`.\n   - For `i` from `0` to `n - 1`:\n     - If `(mask >> i) & 1`, append `nums[i]` to `sub`.\n   - Add `sub` to `result`.',
    pseudocode: `total <- 1 << n
for mask from 0 to total - 1:
    sub <- []
    for i from 0 to n - 1:
        if (mask >> i) & 1:
            sub.append(nums[i])
    result.append(sub)`,
    dryRunExample:
      '`nums = [1, 2]` (`n = 2`, `total = 4`):\n- `mask=0 (00)`: `[]`\n- `mask=1 (01)`: `[1]`\n- `mask=2 (10)`: `[2]`\n- `mask=3 (11)`: `[1, 2]`.',
    timeComplexity: 'O(n * 2^n) — 2^n subsets, up to n elements copied per subset',
    spaceComplexity: 'O(n * 2^n) for output (O(1) auxiliary beyond output)',
    commonMistakes: [
      'Using `1 << n` when `n >= 31` (though `2^n` is already infeasible for `n > 25`).',
    ],
    interviewTips: [
      'Compare iterative bitmasking (`O(1)` extra stack space) vs recursive backtracking (easier when pruning duplicates or constraints).',
    ],
    implementations: {
      c: `#include <stdio.h>\n\nvoid printSubsets(const int nums[], int n) {\n    int total = 1 << n;\n    for (int mask = 0; mask < total; mask++) {\n        putchar('{');\n        int first = 1;\n        for (int i = 0; i < n; i++) {\n            if ((mask >> i) & 1) {\n                if (!first) printf(", ");\n                printf("%d", nums[i]);\n                first = 0;\n            }\n        }\n        printf("}\\n");\n    }\n}`,
      cpp: `#include <vector>\nusing namespace std;\n\nvector<vector<int>> subsetsBits(const vector<int>& nums) {\n    int n = static_cast<int>(nums.size()), total = 1 << n;\n    vector<vector<int>> res;\n    res.reserve(total);\n    for (int mask = 0; mask < total; ++mask) {\n        vector<int> sub;\n        for (int i = 0; i < n; ++i) {\n            if ((mask >> i) & 1) sub.push_back(nums[i]);\n        }\n        res.push_back(move(sub));\n    }\n    return res;\n}`,
      java: `import java.util.*;\n\npublic class SubsetsBits {\n    public static List<List<Integer>> subsets(int[] nums) {\n        int n = nums.length, total = 1 << n;\n        List<List<Integer>> res = new ArrayList<>(total);\n        for (int mask = 0; mask < total; mask++) {\n            List<Integer> sub = new ArrayList<>();\n            for (int i = 0; i < n; i++) {\n                if (((mask >> i) & 1) != 0) sub.add(nums[i]);\n            }\n            res.add(sub);\n        }\n        return res;\n    }\n}`,
      python: `def subsets_bits(nums: list[int]) -> list[list[int]]:\n    n = len(nums)\n    return [\n        [nums[i] for i in range(n) if (mask >> i) & 1]\n        for mask in range(1 << n)\n    ]`,
    },
  },
];

export default modules13to15Notes;
