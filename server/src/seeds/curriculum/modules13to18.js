/**
 * Helper builders for curriculum resource links so every topic keeps a
 * uniform schema shape ({ url, title }).
 */
const leetcodeLink = (slug, title) => ({
  url: `https://leetcode.com/problems/${slug}/`,
  title,
});

const youtubeSearch = (title, query) => [
  {
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    title,
  },
];

const buildTopic = ({
  title,
  slug,
  description,
  order,
  difficulty,
  conceptType,
  leetcode = null,
  youtubeTitle,
  youtubeQuery,
}) => ({
  title,
  slug,
  description,
  order,
  difficulty,
  conceptType,
  resources: {
    codechef: null,
    leetcode,
    youtube: youtubeSearch(youtubeTitle, youtubeQuery),
  },
  hasNotes: false,
});

const modules13to18 = [
  {
    title: 'Two Pointers',
    slug: 'two-pointers',
    description:
      'Master opposite-direction, same-direction, and partitioning two-pointer techniques to solve array and sequence problems in linear time and constant extra space.',
    order: 13,
    difficulty: 'Medium',
    iconName: 'ArrowLeftRight',
    topics: [
      buildTopic({
        title: 'Opposite Direction Pointers',
        slug: 'opposite-direction-pointers',
        description:
          'Learn the converging two-pointer pattern starting at both ends of a sequence and advancing inward based on monotonic comparison invariants.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Opposite Direction Two Pointers Pattern',
        youtubeQuery: 'two pointers opposite direction pattern dsa',
      }),
      buildTopic({
        title: 'Same Direction Pointers',
        slug: 'same-direction-pointers',
        description:
          'Understand slow-and-fast (reader/writer) pointer movement for in-place filtering, deduplication, and cycle or subsequence scans in O(n) time.',
        order: 2,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Same Direction Two Pointers (Slow and Fast)',
        youtubeQuery: 'same direction two pointers slow fast dsa',
      }),
      buildTopic({
        title: 'Pair Sum (Sorted Array)',
        slug: 'pair-sum-sorted-array',
        description:
          'Find two indices in a sorted array whose values add up to a target by shrinking the search space from both ends in O(n) time and O(1) space.',
        order: 3,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'two-sum-ii-input-array-is-sorted',
          'Two Sum II - Input Array Is Sorted'
        ),
        youtubeTitle: 'Two Sum II Sorted Array Two Pointers',
        youtubeQuery: 'two sum ii input array is sorted two pointers',
      }),
      buildTopic({
        title: 'Remove Duplicates from Sorted',
        slug: 'remove-duplicates-from-sorted',
        description:
          'Use a write pointer and a scan pointer moving in the same direction to compact unique elements in-place inside a sorted array.',
        order: 4,
        difficulty: 'Easy',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'remove-duplicates-from-sorted-array',
          'Remove Duplicates from Sorted Array'
        ),
        youtubeTitle: 'Remove Duplicates from Sorted Array',
        youtubeQuery: 'remove duplicates from sorted array two pointers',
      }),
      buildTopic({
        title: 'Merge Sorted Arrays',
        slug: 'merge-sorted-arrays',
        description:
          'Combine two sorted arrays into a single sorted sequence without extra buffer space by merging backward from the largest elements.',
        order: 5,
        difficulty: 'Easy',
        conceptType: 'both',
        leetcode: leetcodeLink('merge-sorted-array', 'Merge Sorted Array'),
        youtubeTitle: 'Merge Sorted Array In-Place Two Pointers',
        youtubeQuery: 'merge sorted array leetcode 88 two pointers',
      }),
      buildTopic({
        title: 'Three Sum',
        slug: 'three-sum',
        description:
          'Sort the array, fix one element, and apply opposite-direction two pointers to enumerate all unique triplets summing to zero in O(n^2) time.',
        order: 6,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink('3sum', '3Sum'),
        youtubeTitle: '3Sum Optimal Two Pointers Solution',
        youtubeQuery: '3sum leetcode two pointers explanation',
      }),
      buildTopic({
        title: 'Four Sum',
        slug: 'four-sum',
        description:
          'Extend k-sum reduction with sorting, duplicate skipping, and inner two-pointer sweeps to find all unique quadruplets matching a target sum.',
        order: 7,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink('4sum', '4Sum'),
        youtubeTitle: '4Sum Two Pointers Algorithm',
        youtubeQuery: '4sum leetcode two pointers explanation',
      }),
      buildTopic({
        title: 'Container With Most Water',
        slug: 'container-with-most-water',
        description:
          'Maximize rectangular water area between two vertical lines by greedily advancing the shorter boundary pointer inward in O(n) time.',
        order: 8,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'container-with-most-water',
          'Container With Most Water'
        ),
        youtubeTitle: 'Container With Most Water Two Pointers',
        youtubeQuery: 'container with most water leetcode two pointers',
      }),
      buildTopic({
        title: 'Partitioning Techniques',
        slug: 'partitioning-techniques',
        description:
          'Study Lomuto, Hoare, and three-way Dutch National Flag partitioning invariants used in quickselect, quicksort, and multi-region array rearrangement.',
        order: 9,
        difficulty: 'Medium',
        conceptType: 'theory',
        youtubeTitle: 'Array Partitioning & Dutch National Flag Algorithm',
        youtubeQuery: 'lomuto hoare dutch national flag partitioning two pointers',
      }),
      buildTopic({
        title: 'Trapping Rain Water',
        slug: 'trapping-rain-water',
        description:
          'Track running leftMax and rightMax heights with opposite pointers to accumulate trapped rainwater above every bar in O(n) time and O(1) space.',
        order: 10,
        difficulty: 'Hard',
        conceptType: 'both',
        leetcode: leetcodeLink('trapping-rain-water', 'Trapping Rain Water'),
        youtubeTitle: 'Trapping Rain Water Two Pointers O(1) Space',
        youtubeQuery: 'trapping rain water two pointers o(1) space',
      }),
    ],
  },
  {
    title: 'Sliding Window',
    slug: 'sliding-window',
    description:
      'Solve contiguous subarray and substring optimization problems in linear time using fixed-size and dynamically resizing sliding windows.',
    order: 14,
    difficulty: 'Medium',
    iconName: 'ScanLine',
    topics: [
      buildTopic({
        title: 'Fixed Size Window',
        slug: 'fixed-size-window',
        description:
          'Maintain a contiguous window of constant length k by adding the incoming element and subtracting the outgoing element on each step.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Fixed Size Sliding Window Technique',
        youtubeQuery: 'fixed size sliding window technique dsa',
      }),
      buildTopic({
        title: 'Variable Size Window',
        slug: 'variable-size-window',
        description:
          'Expand the right boundary to satisfy a window condition and shrink the left boundary to optimize length or maintain validity in O(n) amortized time.',
        order: 2,
        difficulty: 'Medium',
        conceptType: 'theory',
        youtubeTitle: 'Variable Size Sliding Window Pattern',
        youtubeQuery: 'variable size sliding window pattern dsa',
      }),
      buildTopic({
        title: 'Maximum Sum Subarray of Size K',
        slug: 'maximum-sum-subarray-of-size-k',
        description:
          'Compute the maximum sum (or average) over all contiguous subarrays of fixed size k in a single O(n) pass using constant auxiliary space.',
        order: 3,
        difficulty: 'Easy',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'maximum-average-subarray-i',
          'Maximum Average Subarray I'
        ),
        youtubeTitle: 'Maximum Sum / Average Subarray of Size K',
        youtubeQuery: 'maximum sum subarray of size k sliding window',
      }),
      buildTopic({
        title: 'Longest Substring Without Repeating',
        slug: 'longest-substring-without-repeating',
        description:
          'Use a frequency map or last-seen index table with a variable window to find the longest substring containing all unique characters.',
        order: 4,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'longest-substring-without-repeating-characters',
          'Longest Substring Without Repeating Characters'
        ),
        youtubeTitle: 'Longest Substring Without Repeating Characters',
        youtubeQuery: 'longest substring without repeating characters sliding window',
      }),
      buildTopic({
        title: 'Minimum Size Subarray Sum',
        slug: 'minimum-size-subarray-sum',
        description:
          'Shrink the left edge whenever the running positive-integer window sum reaches or exceeds the target to find the shortest valid subarray.',
        order: 5,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'minimum-size-subarray-sum',
          'Minimum Size Subarray Sum'
        ),
        youtubeTitle: 'Minimum Size Subarray Sum Sliding Window',
        youtubeQuery: 'minimum size subarray sum leetcode 209 sliding window',
      }),
      buildTopic({
        title: 'Longest Repeating Character Replacement',
        slug: 'longest-repeating-character-replacement',
        description:
          'Maintain character frequencies and track maxFreq in the window so at most k non-dominant characters need replacement.',
        order: 6,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'longest-repeating-character-replacement',
          'Longest Repeating Character Replacement'
        ),
        youtubeTitle: 'Longest Repeating Character Replacement',
        youtubeQuery: 'longest repeating character replacement leetcode 424',
      }),
      buildTopic({
        title: 'Find All Anagrams in String',
        slug: 'find-all-anagrams-in-string',
        description:
          'Slide a fixed-length window matching the pattern length across a text string while comparing 26-letter frequency signatures in O(n) time.',
        order: 7,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'find-all-anagrams-in-a-string',
          'Find All Anagrams in a String'
        ),
        youtubeTitle: 'Find All Anagrams in a String Sliding Window',
        youtubeQuery: 'find all anagrams in a string leetcode 438 sliding window',
      }),
      buildTopic({
        title: 'Minimum Window Substring',
        slug: 'minimum-window-substring',
        description:
          'Track required character counts and matched distinct characters to contract a variable window to the smallest substring covering all target characters.',
        order: 8,
        difficulty: 'Hard',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'minimum-window-substring',
          'Minimum Window Substring'
        ),
        youtubeTitle: 'Minimum Window Substring Sliding Window',
        youtubeQuery: 'minimum window substring leetcode 76 sliding window',
      }),
    ],
  },
  {
    title: 'Bit Manipulation',
    slug: 'bit-manipulation',
    description:
      'Manipulate binary representations directly using bitwise operators, bit tricks, XOR invariants, and bitmasks for compact state encoding.',
    order: 15,
    difficulty: 'Medium',
    iconName: 'Binary',
    topics: [
      buildTopic({
        title: 'Binary Number System',
        slug: 'binary-number-system',
        description:
          'Understand positional base-2 representation, signed two’s complement encoding, integer bit widths, and decimal-to-binary conversion.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Binary Number System and Two’s Complement',
        youtubeQuery: 'binary number system twos complement dsa',
      }),
      buildTopic({
        title: 'AND OR XOR NOT',
        slug: 'and-or-xor-not',
        description:
          'Master truth tables and bitwise semantics of &, |, ^, and ~ along with common parity, masking, and arithmetic identities.',
        order: 2,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Bitwise Operators AND OR XOR NOT Explained',
        youtubeQuery: 'bitwise operators and or xor not dsa',
      }),
      buildTopic({
        title: 'Left Shift and Right Shift',
        slug: 'left-shift-right-shift',
        description:
          'Use << and >> for fast multiplication/division by powers of two, bit extraction, and understanding logical vs arithmetic right shifts.',
        order: 3,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Left Shift and Right Shift Bitwise Operators',
        youtubeQuery: 'left shift right shift bitwise operators dsa',
      }),
      buildTopic({
        title: 'Set a Bit',
        slug: 'set-a-bit',
        description:
          'Turn on the i-th bit of an integer in O(1) time using the bitwise OR mask expression n | (1 << i).',
        order: 4,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'How to Set the i-th Bit',
        youtubeQuery: 'set ith bit bitwise manipulation',
      }),
      buildTopic({
        title: 'Clear a Bit',
        slug: 'clear-a-bit',
        description:
          'Turn off the i-th bit of an integer using n & ~(1 << i) as well as clearing the lowest set bit with n & (n - 1).',
        order: 5,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'How to Clear the i-th Bit',
        youtubeQuery: 'clear ith bit bitwise manipulation',
      }),
      buildTopic({
        title: 'Toggle a Bit',
        slug: 'toggle-a-bit',
        description:
          'Flip the state of the i-th bit between 0 and 1 in constant time using the bitwise XOR mask n ^ (1 << i).',
        order: 6,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'How to Toggle the i-th Bit',
        youtubeQuery: 'toggle ith bit bitwise manipulation',
      }),
      buildTopic({
        title: 'Check if Bit is Set',
        slug: 'check-if-bit-is-set',
        description:
          'Test whether the i-th bit is 1 or 0 via (n & (1 << i)) !== 0 or ((n >> i) & 1) === 1 without altering the number.',
        order: 7,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Check if the i-th Bit is Set',
        youtubeQuery: 'check if ith bit is set bit manipulation',
      }),
      buildTopic({
        title: 'Power of Two',
        slug: 'power-of-two',
        description:
          'Verify whether a positive integer has exactly one set bit in O(1) time using the classic n > 0 && (n & (n - 1)) === 0 check.',
        order: 8,
        difficulty: 'Easy',
        conceptType: 'both',
        leetcode: leetcodeLink('power-of-two', 'Power of Two'),
        youtubeTitle: 'Power of Two Bit Manipulation',
        youtubeQuery: 'power of two leetcode 231 bit manipulation',
      }),
      buildTopic({
        title: 'Count Set Bits (Brian Kernighan)',
        slug: 'count-set-bits-brian-kernighan',
        description:
          'Count 1-bits by repeatedly clearing the rightmost set bit via n &= (n - 1) in O(popcount) steps (also extends to Counting Bits over ranges).',
        order: 9,
        difficulty: 'Easy',
        conceptType: 'both',
        leetcode: leetcodeLink('number-of-1-bits', 'Number of 1 Bits'),
        youtubeTitle: 'Brian Kernighan Algorithm Count Set Bits',
        youtubeQuery: 'brian kernighan algorithm count set bits number of 1 bits',
      }),
      buildTopic({
        title: 'XOR Properties',
        slug: 'xor-properties',
        description:
          'Apply self-inverse (a ^ a = 0), identity (a ^ 0 = a), commutativity, and associativity to cancel duplicates, swap values, and compute prefix XORs.',
        order: 10,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'XOR Properties and Tricks in DSA',
        youtubeQuery: 'xor properties tricks bit manipulation dsa',
      }),
      buildTopic({
        title: 'Single Number',
        slug: 'single-number',
        description:
          'XOR all elements of an array where every value except one appears twice so pairs cancel out and leave the unique element in O(1) space.',
        order: 11,
        difficulty: 'Easy',
        conceptType: 'both',
        leetcode: leetcodeLink('single-number', 'Single Number'),
        youtubeTitle: 'Single Number XOR Solution',
        youtubeQuery: 'single number leetcode 136 xor bit manipulation',
      }),
      buildTopic({
        title: 'Bitmasking Introduction',
        slug: 'bitmasking-introduction',
        description:
          'Represent small sets, boolean flags, and visited-node states as integer bitmasks enabling O(1) union, intersection, and membership transitions.',
        order: 12,
        difficulty: 'Medium',
        conceptType: 'theory',
        youtubeTitle: 'Introduction to Bitmasking in DSA',
        youtubeQuery: 'bitmasking introduction dsa tutorial',
      }),
      buildTopic({
        title: 'Subset Generation Using Bits',
        slug: 'subset-generation-using-bits',
        description:
          'Iterate masks from 0 to (1 << n) - 1 and inspect each bit position to enumerate the entire power set iteratively in O(n * 2^n) time.',
        order: 13,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink('subsets', 'Subsets'),
        youtubeTitle: 'Generate All Subsets Using Bit Manipulation',
        youtubeQuery: 'generate subsets using bit manipulation power set',
      }),
    ],
  },
  {
    title: 'Backtracking',
    slug: 'backtracking',
    description:
      'Explore combinatorial search spaces systematically by building candidate solutions step-by-step, pruning invalid branches, and undoing state changes.',
    order: 16,
    difficulty: 'Hard',
    iconName: 'RotateCcw',
    topics: [
      buildTopic({
        title: 'Decision Tree Concept',
        slug: 'decision-tree-concept',
        description:
          'Visualize recursive branching choices as a state-space tree to reason about path depth, branching factor, pruning, and exponential time complexity.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Backtracking Decision Tree Concept',
        youtubeQuery: 'backtracking recursion decision tree concept dsa',
      }),
      buildTopic({
        title: 'Choose-Explore-Unchoose',
        slug: 'choose-explore-unchoose',
        description:
          'Internalize the core three-step backtracking template: mutate shared state, recurse into the subproblem, and restore state before the next branch.',
        order: 2,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Choose Explore Unchoose Backtracking Template',
        youtubeQuery: 'choose explore unchoose backtracking template',
      }),
      buildTopic({
        title: 'Generate Subsets',
        slug: 'generate-subsets',
        description:
          'Enumerate every subset of distinct elements using include/exclude or index-ordered backtracking over the power-set decision tree.',
        order: 3,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink('subsets', 'Subsets'),
        youtubeTitle: 'Subsets Backtracking Solution',
        youtubeQuery: 'subsets leetcode 78 backtracking',
      }),
      buildTopic({
        title: 'Generate Permutations',
        slug: 'generate-permutations',
        description:
          'Generate all n! orderings of distinct items using a used-element tracker or in-place swapping with backtracking.',
        order: 4,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink('permutations', 'Permutations'),
        youtubeTitle: 'Permutations Backtracking Solution',
        youtubeQuery: 'permutations leetcode 46 backtracking',
      }),
      buildTopic({
        title: 'Combinations',
        slug: 'combinations',
        description:
          'Choose all k-element subsets from 1..n in strictly increasing order while pruning branches that lack enough remaining elements.',
        order: 5,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink('combinations', 'Combinations'),
        youtubeTitle: 'Combinations LeetCode 77 Backtracking',
        youtubeQuery: 'combinations leetcode 77 backtracking',
      }),
      buildTopic({
        title: 'Combination Sum',
        slug: 'combination-sum',
        description:
          'Find all unique combinations summing to a target when candidates may be reused unlimited times, pruning once the remaining sum drops below zero.',
        order: 6,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink('combination-sum', 'Combination Sum'),
        youtubeTitle: 'Combination Sum Backtracking',
        youtubeQuery: 'combination sum leetcode 39 backtracking',
      }),
      buildTopic({
        title: 'Rat in a Maze',
        slug: 'rat-in-a-maze',
        description:
          'Find all valid paths from top-left to bottom-right in a blocked grid using 4-directional DFS, visited marking, and path backtracking.',
        order: 7,
        difficulty: 'Medium',
        conceptType: 'both',
        youtubeTitle: 'Rat in a Maze Backtracking Problem',
        youtubeQuery: 'rat in a maze backtracking problem dsa',
      }),
      buildTopic({
        title: 'Word Search',
        slug: 'word-search',
        description:
          'Search a 2D character grid for a target word by matching characters sequentially across adjacent cells while temporarily marking visited cells.',
        order: 8,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink('word-search', 'Word Search'),
        youtubeTitle: 'Word Search Grid Backtracking',
        youtubeQuery: 'word search leetcode 79 backtracking',
      }),
      buildTopic({
        title: 'N-Queens Problem',
        slug: 'n-queens-problem',
        description:
          'Place N non-attacking queens on an N x N board row-by-row using O(1) column and diagonal conflict sets to prune invalid placements.',
        order: 9,
        difficulty: 'Hard',
        conceptType: 'both',
        leetcode: leetcodeLink('n-queens', 'N-Queens'),
        youtubeTitle: 'N-Queens Backtracking Problem',
        youtubeQuery: 'n queens leetcode 51 backtracking',
      }),
      buildTopic({
        title: 'Sudoku Solver',
        slug: 'sudoku-solver',
        description:
          'Fill empty cells of a 9 x 9 Sudoku board with digits 1-9 while enforcing row, column, and 3 x 3 subgrid constraints via backtracking.',
        order: 10,
        difficulty: 'Hard',
        conceptType: 'both',
        leetcode: leetcodeLink('sudoku-solver', 'Sudoku Solver'),
        youtubeTitle: 'Sudoku Solver Backtracking',
        youtubeQuery: 'sudoku solver leetcode 37 backtracking',
      }),
      buildTopic({
        title: 'Graph Coloring',
        slug: 'graph-coloring',
        description:
          'Assign at most M colors to vertices of an undirected graph so no two adjacent vertices share a color using constraint-checked backtracking.',
        order: 11,
        difficulty: 'Hard',
        conceptType: 'both',
        youtubeTitle: 'M-Coloring Graph Problem Backtracking',
        youtubeQuery: 'm coloring problem graph coloring backtracking dsa',
      }),
    ],
  },
  {
    title: 'Trees',
    slug: 'trees',
    description:
      'Understand hierarchical tree structures, DFS/BFS traversals, structural properties, tree views, binary search trees, and self-balancing AVL and Red-Black trees.',
    order: 17,
    difficulty: 'Hard',
    iconName: 'Network',
    topics: [
      buildTopic({
        title: 'Tree Terminology',
        slug: 'tree-terminology',
        description:
          'Learn core tree vocabulary including root, parent, child, leaf, siblings, depth, height, degree, subtree, and acyclic connected graph properties.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Tree Data Structure Terminology',
        youtubeQuery: 'tree data structure terminology root leaf height depth',
      }),
      buildTopic({
        title: 'Binary Tree Basics',
        slug: 'binary-tree-basics',
        description:
          'Explore node representation, full, complete, perfect, degenerate, and skewed binary trees along with node-count and height bounds.',
        order: 2,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Binary Tree Basics and Types',
        youtubeQuery: 'binary tree basics types full complete perfect dsa',
      }),
      buildTopic({
        title: 'Preorder Traversal',
        slug: 'preorder-traversal',
        description:
          'Visit nodes in Root -> Left -> Right order to clone trees, evaluate prefix expressions, and serialize hierarchical structure.',
        order: 3,
        difficulty: 'Easy',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'binary-tree-preorder-traversal',
          'Binary Tree Preorder Traversal'
        ),
        youtubeTitle: 'Binary Tree Preorder Traversal',
        youtubeQuery: 'binary tree preorder traversal recursive iterative',
      }),
      buildTopic({
        title: 'Inorder Traversal',
        slug: 'inorder-traversal',
        description:
          'Visit nodes in Left -> Root -> Right order, which yields sorted sequence output when executed on a Binary Search Tree.',
        order: 4,
        difficulty: 'Easy',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'binary-tree-inorder-traversal',
          'Binary Tree Inorder Traversal'
        ),
        youtubeTitle: 'Binary Tree Inorder Traversal',
        youtubeQuery: 'binary tree inorder traversal recursive iterative',
      }),
      buildTopic({
        title: 'Postorder Traversal',
        slug: 'postorder-traversal',
        description:
          'Visit nodes in Left -> Right -> Root order so child subtrees finish before their parent, ideal for bottom-up tree DP and deletion.',
        order: 5,
        difficulty: 'Easy',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'binary-tree-postorder-traversal',
          'Binary Tree Postorder Traversal'
        ),
        youtubeTitle: 'Binary Tree Postorder Traversal',
        youtubeQuery: 'binary tree postorder traversal recursive iterative',
      }),
      buildTopic({
        title: 'Level Order Traversal',
        slug: 'level-order-traversal',
        description:
          'Traverse a binary tree breadth-first layer by layer using a FIFO queue and level-size batching in O(n) time.',
        order: 6,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'binary-tree-level-order-traversal',
          'Binary Tree Level Order Traversal'
        ),
        youtubeTitle: 'Binary Tree Level Order Traversal BFS',
        youtubeQuery: 'binary tree level order traversal bfs queue',
      }),
      buildTopic({
        title: 'Recursive Traversals',
        slug: 'recursive-traversals',
        description:
          'Trace call-stack frames, base cases, and Euler tour visitation order across recursive DFS binary tree traversals.',
        order: 7,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Recursive Tree Traversals Call Stack Explained',
        youtubeQuery: 'recursive tree traversals call stack dfs dsa',
      }),
      buildTopic({
        title: 'Iterative Traversals',
        slug: 'iterative-traversals',
        description:
          'Simulate recursion explicitly with a stack for preorder, inorder, and postorder traversals, plus an overview of O(1)-space Morris traversal.',
        order: 8,
        difficulty: 'Medium',
        conceptType: 'theory',
        youtubeTitle: 'Iterative Preorder Inorder Postorder Traversals',
        youtubeQuery: 'iterative preorder inorder postorder traversal using stack',
      }),
      buildTopic({
        title: 'Height of Tree',
        slug: 'height-of-tree',
        description:
          'Compute the maximum depth (longest root-to-leaf path) of a binary tree recursively via 1 + max(leftHeight, rightHeight) or via BFS.',
        order: 9,
        difficulty: 'Easy',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'maximum-depth-of-binary-tree',
          'Maximum Depth of Binary Tree'
        ),
        youtubeTitle: 'Maximum Depth / Height of Binary Tree',
        youtubeQuery: 'height of binary tree maximum depth recursion',
      }),
      buildTopic({
        title: 'Diameter of Tree',
        slug: 'diameter-of-tree',
        description:
          'Find the longest path between any two nodes in O(n) time by updating leftHeight + rightHeight at every node in a single postorder pass.',
        order: 10,
        difficulty: 'Easy',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'diameter-of-binary-tree',
          'Diameter of Binary Tree'
        ),
        youtubeTitle: 'Diameter of Binary Tree O(n) Solution',
        youtubeQuery: 'diameter of binary tree leetcode 543 o(n)',
      }),
      buildTopic({
        title: 'Balanced Binary Tree',
        slug: 'balanced-binary-tree',
        description:
          'Verify in O(n) bottom-up time that every subtree has |leftHeight - rightHeight| <= 1 using a sentinel (-1) to propagate imbalance.',
        order: 11,
        difficulty: 'Easy',
        conceptType: 'both',
        leetcode: leetcodeLink('balanced-binary-tree', 'Balanced Binary Tree'),
        youtubeTitle: 'Check Balanced Binary Tree O(n)',
        youtubeQuery: 'balanced binary tree leetcode 110 o(n)',
      }),
      buildTopic({
        title: 'Left View',
        slug: 'left-view',
        description:
          'Capture the first node visible at each depth level from the left side using level-order traversal or preorder DFS tracking maxLevel.',
        order: 12,
        difficulty: 'Medium',
        conceptType: 'both',
        youtubeTitle: 'Left View of Binary Tree',
        youtubeQuery: 'left view of binary tree bfs dfs dsa',
      }),
      buildTopic({
        title: 'Right View',
        slug: 'right-view',
        description:
          'Return the rightmost node at every tree level using BFS last-in-level inspection or reverse preorder (Root -> Right -> Left) DFS.',
        order: 13,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'binary-tree-right-side-view',
          'Binary Tree Right Side View'
        ),
        youtubeTitle: 'Binary Tree Right Side View',
        youtubeQuery: 'binary tree right side view leetcode 199',
      }),
      buildTopic({
        title: 'Top View',
        slug: 'top-view',
        description:
          'Use BFS with horizontal distance (hd) coordinates and record the first node encountered at each vertical column to form the top silhouette.',
        order: 14,
        difficulty: 'Medium',
        conceptType: 'both',
        youtubeTitle: 'Top View of Binary Tree',
        youtubeQuery: 'top view of binary tree horizontal distance bfs',
      }),
      buildTopic({
        title: 'Bottom View',
        slug: 'bottom-view',
        description:
          'Use BFS with horizontal distance coordinates and overwrite each column entry so the deepest (and rightmost on ties) node remains.',
        order: 15,
        difficulty: 'Medium',
        conceptType: 'both',
        youtubeTitle: 'Bottom View of Binary Tree',
        youtubeQuery: 'bottom view of binary tree horizontal distance bfs',
      }),
      buildTopic({
        title: 'Boundary Traversal',
        slug: 'boundary-traversal',
        description:
          'Walk the anti-clockwise perimeter of a binary tree by combining the left boundary (top-down), all leaf nodes (left-to-right), and the right boundary (bottom-up).',
        order: 16,
        difficulty: 'Medium',
        conceptType: 'both',
        youtubeTitle: 'Boundary Traversal of Binary Tree',
        youtubeQuery: 'boundary traversal of binary tree anti clockwise',
      }),
      buildTopic({
        title: 'Zigzag Traversal',
        slug: 'zigzag-traversal',
        description:
          'Perform level-order BFS while alternating left-to-right and right-to-left node ordering on consecutive depth levels.',
        order: 17,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'binary-tree-zigzag-level-order-traversal',
          'Binary Tree Zigzag Level Order Traversal'
        ),
        youtubeTitle: 'Binary Tree Zigzag Level Order Traversal',
        youtubeQuery: 'binary tree zigzag level order traversal leetcode 103',
      }),
      buildTopic({
        title: 'Vertical Order Traversal',
        slug: 'vertical-order-traversal',
        description:
          'Assign (row, col) coordinates to every node and group by column, sorting ties within the same (row, col) cell by node value.',
        order: 18,
        difficulty: 'Hard',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'vertical-order-traversal-of-a-binary-tree',
          'Vertical Order Traversal of a Binary Tree'
        ),
        youtubeTitle: 'Vertical Order Traversal of a Binary Tree',
        youtubeQuery: 'vertical order traversal of a binary tree leetcode 987',
      }),
      buildTopic({
        title: 'Lowest Common Ancestor',
        slug: 'lowest-common-ancestor',
        description:
          'Find the deepest common ancestor of two nodes p and q in O(n) time by detecting where p and q split into left and right subtrees.',
        order: 19,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'lowest-common-ancestor-of-a-binary-tree',
          'Lowest Common Ancestor of a Binary Tree'
        ),
        youtubeTitle: 'Lowest Common Ancestor of a Binary Tree',
        youtubeQuery: 'lowest common ancestor of a binary tree leetcode 236',
      }),
      buildTopic({
        title: 'Maximum Path Sum',
        slug: 'maximum-path-sum',
        description:
          'Compute the maximum sum path between any two nodes by clamping negative child gains to zero and updating the global split path at each node.',
        order: 20,
        difficulty: 'Hard',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'binary-tree-maximum-path-sum',
          'Binary Tree Maximum Path Sum'
        ),
        youtubeTitle: 'Binary Tree Maximum Path Sum',
        youtubeQuery: 'binary tree maximum path sum leetcode 124',
      }),
      buildTopic({
        title: 'Serialize and Deserialize',
        slug: 'serialize-and-deserialize',
        description:
          'Encode a binary tree into a string representation using preorder or level-order markers for null pointers and reconstruct the exact tree.',
        order: 21,
        difficulty: 'Hard',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'serialize-and-deserialize-binary-tree',
          'Serialize and Deserialize Binary Tree'
        ),
        youtubeTitle: 'Serialize and Deserialize Binary Tree',
        youtubeQuery: 'serialize and deserialize binary tree leetcode 297',
      }),
      buildTopic({
        title: 'BST Introduction',
        slug: 'bst-introduction',
        description:
          'Understand the Binary Search Tree ordering invariant (left < node < right), O(h) search complexity, and worst-case skewed degeneration.',
        order: 22,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Binary Search Tree (BST) Introduction',
        youtubeQuery: 'binary search tree bst introduction properties dsa',
      }),
      buildTopic({
        title: 'BST Search',
        slug: 'bst-search',
        description:
          'Locate a target value in a Binary Search Tree in O(h) time by discarding one half of the tree at each comparison.',
        order: 23,
        difficulty: 'Easy',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'search-in-a-binary-search-tree',
          'Search in a Binary Search Tree'
        ),
        youtubeTitle: 'Search in a Binary Search Tree',
        youtubeQuery: 'search in a binary search tree leetcode 700',
      }),
      buildTopic({
        title: 'BST Insertion',
        slug: 'bst-insertion',
        description:
          'Descend the BST according to key comparisons and attach a new leaf node at the appropriate null child slot while preserving BST ordering.',
        order: 24,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'insert-into-a-binary-search-tree',
          'Insert into a Binary Search Tree'
        ),
        youtubeTitle: 'Insert into a Binary Search Tree',
        youtubeQuery: 'insert into a binary search tree leetcode 701',
      }),
      buildTopic({
        title: 'BST Deletion',
        slug: 'bst-deletion',
        description:
          'Remove a target node cleanly across all three structural cases: leaf node, single child, and two children via inorder successor replacement.',
        order: 25,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink('delete-node-in-a-bst', 'Delete Node in a BST'),
        youtubeTitle: 'Delete Node in a BST',
        youtubeQuery: 'delete node in a bst leetcode 450',
      }),
      buildTopic({
        title: 'Validate BST',
        slug: 'validate-bst',
        description:
          'Verify strict global BST ordering across entire subtrees by propagating (minBound, maxBound) intervals or checking strictly increasing inorder traversal.',
        order: 26,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'validate-binary-search-tree',
          'Validate Binary Search Tree'
        ),
        youtubeTitle: 'Validate Binary Search Tree',
        youtubeQuery: 'validate binary search tree leetcode 98',
      }),
      buildTopic({
        title: 'Inorder Predecessor and Successor',
        slug: 'inorder-predecessor-successor',
        description:
          'Find the closest smaller and larger keys relative to a target key in a BST in O(h) time and O(1) space without storing an inorder array.',
        order: 27,
        difficulty: 'Medium',
        conceptType: 'both',
        youtubeTitle: 'Inorder Predecessor and Successor in BST',
        youtubeQuery: 'inorder predecessor and successor in bst',
      }),
      buildTopic({
        title: 'Kth Smallest in BST',
        slug: 'kth-smallest-in-bst',
        description:
          'Use early-stopping iterative or recursive inorder traversal to retrieve the k-th smallest element in a BST in O(h + k) time.',
        order: 28,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'kth-smallest-element-in-a-bst',
          'Kth Smallest Element in a BST'
        ),
        youtubeTitle: 'Kth Smallest Element in a BST',
        youtubeQuery: 'kth smallest element in a bst leetcode 230',
      }),
      buildTopic({
        title: 'AVL Tree Basics',
        slug: 'avl-tree-basics',
        description:
          'Study height-balanced BSTs where every node maintains a balance factor in {-1, 0, +1}, guaranteeing O(log n) worst-case height.',
        order: 29,
        difficulty: 'Hard',
        conceptType: 'theory',
        youtubeTitle: 'AVL Tree Basics and Balance Factor',
        youtubeQuery: 'avl tree basics balance factor dsa',
      }),
      buildTopic({
        title: 'AVL Rotations',
        slug: 'avl-rotations',
        description:
          'Master LL, RR, LR, and RL tree rotations to restore AVL balance invariants after insertions and deletions in O(log n) time.',
        order: 30,
        difficulty: 'Hard',
        conceptType: 'theory',
        youtubeTitle: 'AVL Tree Rotations LL RR LR RL',
        youtubeQuery: 'avl tree rotations ll rr lr rl explained',
      }),
      buildTopic({
        title: 'Red-Black Tree Fundamentals',
        slug: 'red-black-tree-fundamentals',
        description:
          'Learn the five Red-Black tree invariants, black-height bounds, and how recoloring plus rotations keep ordered maps/sets balanced in O(log n) time.',
        order: 31,
        difficulty: 'Hard',
        conceptType: 'theory',
        youtubeTitle: 'Red-Black Tree Fundamentals and Properties',
        youtubeQuery: 'red black tree fundamentals properties insertion dsa',
      }),
    ],
  },
  {
    title: 'Heaps and Priority Queues',
    slug: 'heaps-and-priority-queues',
    description:
      'Build binary heaps backed by arrays, understand heapify and heap sort mechanics, and solve Top-K, multi-way merge, and streaming median problems.',
    order: 18,
    difficulty: 'Hard',
    iconName: 'Layers',
    topics: [
      buildTopic({
        title: 'Heap Fundamentals',
        slug: 'heap-fundamentals',
        description:
          'Understand the binary heap abstract model, heap-order property, and array index arithmetic for parent (i-1)/2, left 2i+1, and right 2i+2.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Heap Data Structure Fundamentals',
        youtubeQuery: 'heap data structure fundamentals array representation dsa',
      }),
      buildTopic({
        title: 'Complete Binary Tree Property',
        slug: 'complete-binary-tree-property',
        description:
          'See why filling every level left-to-right guarantees O(log n) height and pointer-free contiguous array storage with zero wasted slots.',
        order: 2,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Complete Binary Tree Property in Heaps',
        youtubeQuery: 'complete binary tree property heap array representation',
      }),
      buildTopic({
        title: 'Min Heap',
        slug: 'min-heap',
        description:
          'Explore the min-heap invariant where every parent is less than or equal to its children, exposing the global minimum in O(1) time.',
        order: 3,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Min Heap Explained with Examples',
        youtubeQuery: 'min heap data structure explained dsa',
      }),
      buildTopic({
        title: 'Max Heap',
        slug: 'max-heap',
        description:
          'Explore the max-heap invariant where every parent is greater than or equal to its children, exposing the global maximum in O(1) time.',
        order: 4,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Max Heap Explained with Examples',
        youtubeQuery: 'max heap data structure explained dsa',
      }),
      buildTopic({
        title: 'Heap Insertion',
        slug: 'heap-insertion',
        description:
          'Append a new element at the end of the array to preserve completeness, then sift-up (bubble-up) to restore the heap property in O(log n) time.',
        order: 5,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Heap Insertion (Sift Up) Explained',
        youtubeQuery: 'heap insertion sift up bubble up dsa',
      }),
      buildTopic({
        title: 'Heap Deletion (Extract)',
        slug: 'heap-deletion-extract',
        description:
          'Extract the root extremum by swapping it with the last array element, shrinking size, and sifting-down the new root in O(log n) time.',
        order: 6,
        difficulty: 'Medium',
        conceptType: 'theory',
        youtubeTitle: 'Heap Deletion Extract Min/Max (Sift Down)',
        youtubeQuery: 'heap deletion extract min max sift down dsa',
      }),
      buildTopic({
        title: 'Heapify',
        slug: 'heapify',
        description:
          'Master the top-down sift-down heapify procedure that fixes a single root violation when both left and right subtrees are already valid heaps.',
        order: 7,
        difficulty: 'Medium',
        conceptType: 'theory',
        youtubeTitle: 'Heapify Algorithm Explained',
        youtubeQuery: 'heapify algorithm sift down dsa',
      }),
      buildTopic({
        title: 'Build Heap',
        slug: 'build-heap',
        description:
          'Understand Floyd’s bottom-up heap construction starting from the last non-leaf node (n/2 - 1) and prove why it runs in O(n) rather than O(n log n) time.',
        order: 8,
        difficulty: 'Medium',
        conceptType: 'theory',
        youtubeTitle: 'Build Heap in O(n) Time Proof',
        youtubeQuery: 'build heap in o(n) time complexity proof dsa',
      }),
      buildTopic({
        title: 'Priority Queue Concept',
        slug: 'priority-queue-concept',
        description:
          'Learn the Priority Queue ADT, custom comparator design, and language implementations (std::priority_queue, Java PriorityQueue, Python heapq).',
        order: 9,
        difficulty: 'Easy',
        conceptType: 'theory',
        youtubeTitle: 'Priority Queue Concept & Custom Comparators',
        youtubeQuery: 'priority queue concept custom comparator dsa',
      }),
      buildTopic({
        title: 'Heap Sort',
        slug: 'heap-sort',
        description:
          'Sort an array in-place in O(n log n) worst-case time and O(1) auxiliary space by building a max-heap and repeatedly extracting the maximum.',
        order: 10,
        difficulty: 'Medium',
        conceptType: 'theory',
        youtubeTitle: 'Heap Sort Algorithm Step by Step',
        youtubeQuery: 'heap sort algorithm step by step complexity dsa',
      }),
      buildTopic({
        title: 'Kth Largest Element',
        slug: 'kth-largest-element',
        description:
          'Maintain a min-heap of size k over the stream of numbers so the root always holds the k-th largest element in O(n log k) time.',
        order: 11,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'kth-largest-element-in-an-array',
          'Kth Largest Element in an Array'
        ),
        youtubeTitle: 'Kth Largest Element in an Array Min Heap',
        youtubeQuery: 'kth largest element in an array leetcode 215 min heap',
      }),
      buildTopic({
        title: 'Top K Frequent Elements',
        slug: 'top-k-frequent-elements',
        description:
          'Count frequencies in a hash map and retain the k highest-frequency items using a size-k min-heap in O(n log k) time.',
        order: 12,
        difficulty: 'Medium',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'top-k-frequent-elements',
          'Top K Frequent Elements'
        ),
        youtubeTitle: 'Top K Frequent Elements Priority Queue',
        youtubeQuery: 'top k frequent elements leetcode 347 heap',
      }),
      buildTopic({
        title: 'Merge K Sorted Lists',
        slug: 'merge-k-sorted-lists',
        description:
          'Perform a k-way merge across k sorted linked lists using a min-heap of active list heads in O(N log k) total time.',
        order: 13,
        difficulty: 'Hard',
        conceptType: 'both',
        leetcode: leetcodeLink('merge-k-sorted-lists', 'Merge k Sorted Lists'),
        youtubeTitle: 'Merge K Sorted Lists Min Heap',
        youtubeQuery: 'merge k sorted lists leetcode 23 min heap',
      }),
      buildTopic({
        title: 'Median from Data Stream',
        slug: 'median-from-data-stream',
        description:
          'Balance a lower-half max-heap and an upper-half min-heap so insertions take O(log n) and median queries run in O(1) time.',
        order: 14,
        difficulty: 'Hard',
        conceptType: 'both',
        leetcode: leetcodeLink(
          'find-median-from-data-stream',
          'Find Median from Data Stream'
        ),
        youtubeTitle: 'Find Median from Data Stream Two Heaps',
        youtubeQuery: 'find median from data stream leetcode 295 two heaps',
      }),
    ],
  },
];

export default modules13to18;
