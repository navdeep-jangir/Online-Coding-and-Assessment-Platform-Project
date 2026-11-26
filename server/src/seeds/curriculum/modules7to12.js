const modules7to12 = [
  {
    title: 'Sorting',
    slug: 'sorting',
    description:
      'Master fundamental and advanced sorting algorithms, stability, in-place execution, partitioning schemes, non-comparison sorts, and inversion counting.',
    order: 7,
    difficulty: 'Medium',
    iconName: 'ArrowUpDown',
    topics: [
      {
        title: 'Sorting fundamentals',
        slug: 'sorting-fundamentals',
        description:
          'Understand what sorting is, comparison vs non-comparison models, time-space tradeoffs, and the Omega(n log n) lower bound for comparison-based sorting.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Sorting Algorithms Fundamentals & Comparison Lower Bound',
              url: 'https://www.youtube.com/results?search_query=sorting+algorithms+fundamentals+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Stable vs unstable sorts',
        slug: 'stable-vs-unstable-sorts',
        description:
          'Learn what sorting stability means, why preserving relative order of equal keys matters for multi-key sorting, and which standard algorithms are stable or unstable.',
        order: 2,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Stable vs Unstable Sorting Algorithms Explained',
              url: 'https://www.youtube.com/results?search_query=stable+vs+unstable+sorting+algorithms',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'In-place sorting',
        slug: 'in-place-sorting',
        description:
          'Explore O(1) and O(log n) auxiliary space definitions for in-place sorting, cache locality benefits, and why algorithms like Merge Sort require extra memory.',
        order: 3,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'In-Place Sorting Algorithms & Space Complexity',
              url: 'https://www.youtube.com/results?search_query=in+place+sorting+algorithms+space+complexity',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Bubble sort',
        slug: 'bubble-sort',
        description:
          'Repeatedly swap adjacent out-of-order elements to bubble the largest value to the end, including the early-exit optimization for nearly sorted arrays.',
        order: 4,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Bubble Sort Algorithm & Optimization',
              url: 'https://www.youtube.com/results?search_query=bubble+sort+algorithm+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Selection sort',
        slug: 'selection-sort',
        description:
          'Select the minimum element from the unsorted suffix in each pass and swap it into position, minimizing the total number of swaps to O(n).',
        order: 5,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Selection Sort Algorithm Explained',
              url: 'https://www.youtube.com/results?search_query=selection+sort+algorithm+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Insertion sort',
        slug: 'insertion-sort',
        description:
          'Build the sorted prefix one element at a time by shifting larger elements right, achieving O(n) adaptive performance on nearly sorted inputs.',
        order: 6,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Insertion Sort Algorithm & Adaptive Behavior',
              url: 'https://www.youtube.com/results?search_query=insertion+sort+algorithm+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Merge sort',
        slug: 'merge-sort',
        description:
          'Divide the array recursively into halves, sort each half, and merge two sorted subarrays in O(n log n) worst-case time with guaranteed stability.',
        order: 7,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Sort an Array',
            url: 'https://leetcode.com/problems/sort-an-array/',
          },
          youtube: [
            {
              title: 'Merge Sort Divide and Conquer Explained',
              url: 'https://www.youtube.com/results?search_query=merge+sort+algorithm+explained+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Quick sort',
        slug: 'quick-sort',
        description:
          'Partition an array around a pivot and recursively sort the subarrays, analyzing average O(n log n), worst-case O(n^2), and randomized pivot selection.',
        order: 8,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Sort an Array',
            url: 'https://leetcode.com/problems/sort-an-array/',
          },
          youtube: [
            {
              title: 'Quick Sort Algorithm & Pivot Strategies',
              url: 'https://www.youtube.com/results?search_query=quick+sort+algorithm+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Partition algorithms (Lomuto, Hoare)',
        slug: 'partition-algorithms-lomuto-hoare',
        description:
          'Compare Lomuto, Hoare, and 3-way Dutch National Flag partitioning schemes, focusing on pointer invariants, swap counts, and handling duplicate elements.',
        order: 9,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Sort Colors',
            url: 'https://leetcode.com/problems/sort-colors/',
          },
          youtube: [
            {
              title: 'Lomuto vs Hoare Partition & Dutch National Flag',
              url: 'https://www.youtube.com/results?search_query=lomuto+vs+hoare+partition+algorithm',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Counting sort',
        slug: 'counting-sort',
        description:
          'Sort integers within a bounded range in O(n + k) linear time using frequency counts and prefix sums while preserving stability.',
        order: 10,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Sort Colors',
            url: 'https://leetcode.com/problems/sort-colors/',
          },
          youtube: [
            {
              title: 'Counting Sort Linear Time Algorithm',
              url: 'https://www.youtube.com/results?search_query=counting+sort+algorithm+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Radix sort',
        slug: 'radix-sort',
        description:
          'Sort multi-digit integers digit-by-digit from least significant to most significant digit using a stable subroutine like Counting Sort.',
        order: 11,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Maximum Gap',
            url: 'https://leetcode.com/problems/maximum-gap/',
          },
          youtube: [
            {
              title: 'Radix Sort Algorithm Step by Step',
              url: 'https://www.youtube.com/results?search_query=radix+sort+algorithm+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Bucket sort',
        slug: 'bucket-sort',
        description:
          'Distribute elements across fixed buckets based on value range or frequency, sort each bucket individually, and concatenate for O(n) average time.',
        order: 12,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Top K Frequent Elements',
            url: 'https://leetcode.com/problems/top-k-frequent-elements/',
          },
          youtube: [
            {
              title: 'Bucket Sort Algorithm & Applications',
              url: 'https://www.youtube.com/results?search_query=bucket+sort+algorithm+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Heap sort',
        slug: 'heap-sort',
        description:
          'Build a max-heap in O(n) time and repeatedly extract the maximum element to achieve guaranteed O(n log n) time with O(1) auxiliary space.',
        order: 13,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Sort an Array',
            url: 'https://leetcode.com/problems/sort-an-array/',
          },
          youtube: [
            {
              title: 'Heap Sort Algorithm & Heapify Explained',
              url: 'https://www.youtube.com/results?search_query=heap+sort+algorithm+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Count inversions',
        slug: 'count-inversions',
        description:
          'Count pairs (i, j) with i < j and arr[i] > arr[j] in O(n log n) time by augmenting the merge step of Merge Sort.',
        order: 14,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Reverse Pairs',
            url: 'https://leetcode.com/problems/reverse-pairs/',
          },
          youtube: [
            {
              title: 'Count Inversions Using Merge Sort',
              url: 'https://www.youtube.com/results?search_query=count+inversions+merge+sort+dsa',
            },
          ],
        },
        hasNotes: true,
      },
    ],
  },
  {
    title: 'Searching',
    slug: 'searching',
    description:
      'Learn sequential and logarithmic search techniques, boundary finding, rotated arrays, peak finding, binary search on answers, and 2D matrix search.',
    order: 8,
    difficulty: 'Medium',
    iconName: 'Search',
    topics: [
      {
        title: 'Linear search',
        slug: 'linear-search',
        description:
          'Scan elements sequentially from start to finish in O(n) time and O(1) space, ideal for small or unsorted collections.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Linear Search Algorithm Explained',
              url: 'https://www.youtube.com/results?search_query=linear+search+algorithm+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Binary search iterative',
        slug: 'binary-search-iterative',
        description:
          'Halve a sorted search space iteratively using low, high, and overflow-safe mid calculation for O(log n) time and O(1) space.',
        order: 2,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Binary Search',
            url: 'https://leetcode.com/problems/binary-search/',
          },
          youtube: [
            {
              title: 'Iterative Binary Search Algorithm',
              url: 'https://www.youtube.com/results?search_query=iterative+binary+search+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Binary search recursive',
        slug: 'binary-search-recursive',
        description:
          'Implement binary search with recursive divide-and-conquer calls, analyzing the O(log n) call stack space and base-case termination.',
        order: 3,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Binary Search',
            url: 'https://leetcode.com/problems/binary-search/',
          },
          youtube: [
            {
              title: 'Recursive Binary Search Explained',
              url: 'https://www.youtube.com/results?search_query=recursive+binary+search+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Lower bound',
        slug: 'lower-bound',
        description:
          'Find the smallest index in a sorted array where the element is greater than or equal to a target value using binary search.',
        order: 4,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Search Insert Position',
            url: 'https://leetcode.com/problems/search-insert-position/',
          },
          youtube: [
            {
              title: 'Lower Bound in Binary Search Explained',
              url: 'https://www.youtube.com/results?search_query=lower+bound+binary+search+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Upper bound',
        slug: 'upper-bound',
        description:
          'Find the smallest index in a sorted array strictly greater than a target value, enabling range queries and frequency counts.',
        order: 5,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Find First and Last Position of Element in Sorted Array',
            url: 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/',
          },
          youtube: [
            {
              title: 'Upper Bound in Binary Search Explained',
              url: 'https://www.youtube.com/results?search_query=upper+bound+binary+search+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'First and last occurrence',
        slug: 'first-and-last-occurrence',
        description:
          'Locate both the starting and ending indices of a duplicate target in a sorted array in O(log n) time using boundary binary searches.',
        order: 6,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Find First and Last Position of Element in Sorted Array',
            url: 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/',
          },
          youtube: [
            {
              title: 'First and Last Occurrence Binary Search',
              url: 'https://www.youtube.com/results?search_query=first+and+last+occurrence+binary+search',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Search insert position',
        slug: 'search-insert-position',
        description:
          'Return the index of a target if present or the exact insertion index preserving sorted order using lower-bound binary search.',
        order: 7,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Search Insert Position',
            url: 'https://leetcode.com/problems/search-insert-position/',
          },
          youtube: [
            {
              title: 'Search Insert Position Binary Search',
              url: 'https://www.youtube.com/results?search_query=search+insert+position+leetcode+35',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Search in rotated sorted array',
        slug: 'search-in-rotated-sorted-array',
        description:
          'Identify which half of a rotated sorted array remains sorted at each step to discard half the search space in O(log n) time.',
        order: 8,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Search in Rotated Sorted Array',
            url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
          },
          youtube: [
            {
              title: 'Search in Rotated Sorted Array Explained',
              url: 'https://www.youtube.com/results?search_query=search+in+rotated+sorted+array+binary+search',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Find peak element',
        slug: 'find-peak-element',
        description:
          'Compare mid with its neighbor to move toward an ascending slope and guarantee finding a local maximum in O(log n) time.',
        order: 9,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Find Peak Element',
            url: 'https://leetcode.com/problems/find-peak-element/',
          },
          youtube: [
            {
              title: 'Find Peak Element Binary Search Intuition',
              url: 'https://www.youtube.com/results?search_query=find+peak+element+binary+search',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Square root using binary search',
        slug: 'square-root-using-binary-search',
        description:
          'Compute the integer floor square root of a non-negative number by binary searching the monotonic range [0, x] without floating-point precision issues.',
        order: 10,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Sqrt(x)',
            url: 'https://leetcode.com/problems/sqrtx/',
          },
          youtube: [
            {
              title: 'Square Root Using Binary Search',
              url: 'https://www.youtube.com/results?search_query=square+root+using+binary+search+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Binary search on answer',
        slug: 'binary-search-on-answer',
        description:
          'Apply binary search over a monotonic predicate space (feasible vs infeasible) to solve optimization problems such as minimum speed or capacity.',
        order: 11,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Koko Eating Bananas',
            url: 'https://leetcode.com/problems/koko-eating-bananas/',
          },
          youtube: [
            {
              title: 'Binary Search on Answer Pattern Explained',
              url: 'https://www.youtube.com/results?search_query=binary+search+on+answer+pattern+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Search a 2D matrix',
        slug: 'search-a-2d-matrix',
        description:
          'Map a sorted m x n matrix into a virtual 1D sorted array using row = mid / n and col = mid % n to search in O(log(m * n)) time.',
        order: 12,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Search a 2D Matrix',
            url: 'https://leetcode.com/problems/search-a-2d-matrix/',
          },
          youtube: [
            {
              title: 'Search a 2D Matrix Binary Search',
              url: 'https://www.youtube.com/results?search_query=search+a+2d+matrix+binary+search',
            },
          ],
        },
        hasNotes: true,
      },
    ],
  },
  {
    title: 'Recursion',
    slug: 'recursion',
    description:
      'Build a strong mental model of recursion, stack frames, recursion trees, single and multiple recursive calls, subsequence generation, and tail recursion.',
    order: 9,
    difficulty: 'Medium',
    iconName: 'Repeat',
    topics: [
      {
        title: 'Introduction to recursion',
        slug: 'introduction-to-recursion',
        description:
          'Understand self-referential problem decomposition where a function solves smaller subproblems of the same structure.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Introduction to Recursion for Beginners',
              url: 'https://www.youtube.com/results?search_query=introduction+to+recursion+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Base case and recursive case',
        slug: 'base-case-and-recursive-case',
        description:
          'Identify stopping conditions that prevent infinite recursion and recurrence steps that shrink input size toward the base case.',
        order: 2,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Power of Two',
            url: 'https://leetcode.com/problems/power-of-two/',
          },
          youtube: [
            {
              title: 'Base Case and Recursive Case Explained',
              url: 'https://www.youtube.com/results?search_query=base+case+and+recursive+case+recursion',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Call stack',
        slug: 'call-stack',
        description:
          'Trace activation records, local variables, return addresses, stack unwinding, and stack overflow errors during recursive execution.',
        order: 3,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'How the Recursion Call Stack Works',
              url: 'https://www.youtube.com/results?search_query=recursion+call+stack+visualization',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Recursion tree',
        slug: 'recursion-tree',
        description:
          'Visualize branching recursive calls as a tree to analyze time complexity, overlapping subproblems, and maximum recursion depth.',
        order: 4,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Recursion Tree Method & Complexity Analysis',
              url: 'https://www.youtube.com/results?search_query=recursion+tree+method+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Factorial recursive',
        slug: 'factorial-recursive',
        description:
          'Compute n! recursively using n * factorial(n - 1) and compare functional return recursion with parameterized accumulation.',
        order: 5,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Factorial Using Recursion Explained',
              url: 'https://www.youtube.com/results?search_query=factorial+using+recursion+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Fibonacci recursive',
        slug: 'fibonacci-recursive',
        description:
          'Derive the Fibonacci recurrence F(n) = F(n - 1) + F(n - 2), observe its O(2^n) exponential call tree, and understand redundant work.',
        order: 6,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Fibonacci Number',
            url: 'https://leetcode.com/problems/fibonacci-number/',
          },
          youtube: [
            {
              title: 'Fibonacci Recursion & Call Tree Analysis',
              url: 'https://www.youtube.com/results?search_query=fibonacci+recursion+tree+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Reverse array recursive',
        slug: 'reverse-array-recursive',
        description:
          'Reverse an array or character sequence in-place by swapping symmetric boundary indices and recursing inward.',
        order: 7,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Reverse String',
            url: 'https://leetcode.com/problems/reverse-string/',
          },
          youtube: [
            {
              title: 'Reverse an Array Using Recursion',
              url: 'https://www.youtube.com/results?search_query=reverse+array+using+recursion+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Palindrome check recursive',
        slug: 'palindrome-check-recursive',
        description:
          'Verify whether a string reads the same forwards and backwards by comparing outer characters recursively toward the center.',
        order: 8,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Valid Palindrome',
            url: 'https://leetcode.com/problems/valid-palindrome/',
          },
          youtube: [
            {
              title: 'Check Palindrome Using Recursion',
              url: 'https://www.youtube.com/results?search_query=palindrome+check+using+recursion+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Print subsequences',
        slug: 'print-subsequences',
        description:
          'Use the pick and not-pick recursion pattern to generate all 2^n ordered subsequences of an array or string.',
        order: 9,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Subsets',
            url: 'https://leetcode.com/problems/subsets/',
          },
          youtube: [
            {
              title: 'Print All Subsequences Recursion Pick Not Pick',
              url: 'https://www.youtube.com/results?search_query=print+all+subsequences+recursion+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Print subsets',
        slug: 'print-subsets',
        description:
          'Generate the complete power set of distinct elements using backtracking and index-based subset recursion.',
        order: 10,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Subsets',
            url: 'https://leetcode.com/problems/subsets/',
          },
          youtube: [
            {
              title: 'Subsets Power Set Using Recursion & Backtracking',
              url: 'https://www.youtube.com/results?search_query=print+subsets+recursion+backtracking',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Multiple recursion calls',
        slug: 'multiple-recursion-calls',
        description:
          'Analyze functions making two or more recursive calls per state, execution order in depth-first traversal, and exponential time bounds.',
        order: 11,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Fibonacci Number',
            url: 'https://leetcode.com/problems/fibonacci-number/',
          },
          youtube: [
            {
              title: 'Multiple Recursion Calls Explained',
              url: 'https://www.youtube.com/results?search_query=multiple+recursion+calls+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Divide and conquer intro',
        slug: 'divide-and-conquer-intro',
        description:
          'Understand the three-step divide, conquer, and combine paradigm behind Merge Sort, Quick Sort, and Binary Search.',
        order: 12,
        difficulty: 'Medium',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Divide and Conquer Paradigm Explained',
              url: 'https://www.youtube.com/results?search_query=divide+and+conquer+algorithm+introduction',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Tail recursion',
        slug: 'tail-recursion',
        description:
          'Distinguish tail-recursive functions where the recursive call is the final operation from head recursion, and learn how tail-call optimization works.',
        order: 13,
        difficulty: 'Medium',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Tail Recursion & Tail Call Optimization',
              url: 'https://www.youtube.com/results?search_query=tail+recursion+explained+dsa',
            },
          ],
        },
        hasNotes: true,
      },
    ],
  },
  {
    title: 'Linked Lists',
    slug: 'linked-lists',
    description:
      'Master pointer manipulation across singly, doubly, and circular linked lists, fast-slow pointers, cycle detection and removal, sorting, and k-group reversal.',
    order: 10,
    difficulty: 'Medium',
    iconName: 'Link',
    topics: [
      {
        title: 'Nodes and pointers',
        slug: 'nodes-and-pointers',
        description:
          'Learn how linked list nodes store data and references in non-contiguous heap memory compared to contiguous arrays.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Linked List Nodes and Pointers Explained',
              url: 'https://www.youtube.com/results?search_query=linked+list+nodes+and+pointers+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Singly linked list',
        slug: 'singly-linked-list',
        description:
          'Design and implement a singly linked list where each node points strictly forward to its successor, ending at null.',
        order: 2,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Design Linked List',
            url: 'https://leetcode.com/problems/design-linked-list/',
          },
          youtube: [
            {
              title: 'Singly Linked List Complete Implementation',
              url: 'https://www.youtube.com/results?search_query=singly+linked+list+implementation+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Doubly linked list',
        slug: 'doubly-linked-list',
        description:
          'Implement bidirectional nodes with prev and next pointers to support O(1) deletion when given a node reference and backward traversal.',
        order: 3,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Design Linked List',
            url: 'https://leetcode.com/problems/design-linked-list/',
          },
          youtube: [
            {
              title: 'Doubly Linked List Implementation & Operations',
              url: 'https://www.youtube.com/results?search_query=doubly+linked+list+implementation+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Circular linked list',
        slug: 'circular-linked-list',
        description:
          'Connect the tail node back to the head to form a ring structure useful for round-robin scheduling and cyclic buffers.',
        order: 4,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Circular Linked List Explained & Implemented',
              url: 'https://www.youtube.com/results?search_query=circular+linked+list+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Traversal',
        slug: 'linked-list-traversal',
        description:
          'Walk a linked list safely from head to null in O(n) time and O(1) space while handling empty and single-node edge cases.',
        order: 5,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Linked List Traversal Iterative & Recursive',
              url: 'https://www.youtube.com/results?search_query=linked+list+traversal+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Insertion (beginning, end, middle)',
        slug: 'linked-list-insertion',
        description:
          'Insert new nodes at the head, tail, or a specific index without breaking existing links, using dummy head nodes to simplify edge cases.',
        order: 6,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Design Linked List',
            url: 'https://leetcode.com/problems/design-linked-list/',
          },
          youtube: [
            {
              title: 'Linked List Insertion Beginning End Middle',
              url: 'https://www.youtube.com/results?search_query=linked+list+insertion+beginning+end+middle',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Deletion',
        slug: 'linked-list-deletion',
        description:
          'Delete nodes at the head, tail, or by position/value by re-linking predecessor pointers and handling head removal cleanly.',
        order: 7,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Design Linked List',
            url: 'https://leetcode.com/problems/design-linked-list/',
          },
          youtube: [
            {
              title: 'Linked List Deletion Operations Explained',
              url: 'https://www.youtube.com/results?search_query=linked+list+deletion+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Search in linked list',
        slug: 'search-in-linked-list',
        description:
          'Search for a key iteratively or recursively in O(n) time and understand why random access and binary search do not apply efficiently.',
        order: 8,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Search an Element in a Linked List',
              url: 'https://www.youtube.com/results?search_query=search+in+linked+list+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Reverse linked list',
        slug: 'reverse-linked-list',
        description:
          'Reverse node links in-place in O(n) time and O(1) space using three iterative pointers (prev, curr, next) as well as recursion.',
        order: 9,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Reverse Linked List',
            url: 'https://leetcode.com/problems/reverse-linked-list/',
          },
          youtube: [
            {
              title: 'Reverse Linked List Iterative & Recursive',
              url: 'https://www.youtube.com/results?search_query=reverse+linked+list+iterative+recursive',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Find middle node',
        slug: 'find-middle-node',
        description:
          'Use the tortoise and hare (slow and fast pointer) technique to locate the middle node in a single O(n) pass.',
        order: 10,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Middle of the Linked List',
            url: 'https://leetcode.com/problems/middle-of-the-linked-list/',
          },
          youtube: [
            {
              title: 'Middle of Linked List Slow Fast Pointers',
              url: 'https://www.youtube.com/results?search_query=middle+of+linked+list+tortoise+and+hare',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: "Detect cycle (Floyd's)",
        slug: 'detect-cycle-floyds',
        description:
          "Apply Floyd's cycle-finding algorithm with slow (+1) and fast (+2) pointers to detect loops in O(n) time and O(1) space.",
        order: 11,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Linked List Cycle',
            url: 'https://leetcode.com/problems/linked-list-cycle/',
          },
          youtube: [
            {
              title: "Floyd's Cycle Detection Algorithm Linked List",
              url: 'https://www.youtube.com/results?search_query=floyd+cycle+detection+linked+list',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Remove cycle',
        slug: 'remove-cycle',
        description:
          'Find the exact entry point of a cycle mathematically using Floyd’s second phase and sever the tail pointer to restore a linear list.',
        order: 12,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Linked List Cycle II',
            url: 'https://leetcode.com/problems/linked-list-cycle-ii/',
          },
          youtube: [
            {
              title: 'Find Cycle Start & Remove Loop in Linked List',
              url: 'https://www.youtube.com/results?search_query=detect+and+remove+loop+in+linked+list',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Merge two sorted lists',
        slug: 'merge-two-sorted-lists',
        description:
          'Splice two sorted linked lists together in O(n + m) time and O(1) extra space using a sentinel dummy node.',
        order: 13,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Merge Two Sorted Lists',
            url: 'https://leetcode.com/problems/merge-two-sorted-lists/',
          },
          youtube: [
            {
              title: 'Merge Two Sorted Linked Lists',
              url: 'https://www.youtube.com/results?search_query=merge+two+sorted+linked+lists+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Intersection of two lists',
        slug: 'intersection-of-two-lists',
        description:
          'Find the shared merging node of two Y-shaped singly linked lists in O(n + m) time and O(1) space by switching heads at null.',
        order: 14,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Intersection of Two Linked Lists',
            url: 'https://leetcode.com/problems/intersection-of-two-linked-lists/',
          },
          youtube: [
            {
              title: 'Intersection of Two Linked Lists Two Pointers',
              url: 'https://www.youtube.com/results?search_query=intersection+of+two+linked+lists+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Palindrome linked list',
        slug: 'palindrome-linked-list',
        description:
          'Combine finding the middle node, reversing the second half, and comparing halves to check palindrome symmetry in O(n) time and O(1) space.',
        order: 15,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Palindrome Linked List',
            url: 'https://leetcode.com/problems/palindrome-linked-list/',
          },
          youtube: [
            {
              title: 'Palindrome Linked List O(1) Space',
              url: 'https://www.youtube.com/results?search_query=palindrome+linked+list+o1+space',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Sort linked list',
        slug: 'sort-linked-list',
        description:
          'Sort a singly linked list in O(n log n) time using top-down or bottom-up Merge Sort with middle splitting and sorted-list merging.',
        order: 16,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Sort List',
            url: 'https://leetcode.com/problems/sort-list/',
          },
          youtube: [
            {
              title: 'Sort Linked List Using Merge Sort',
              url: 'https://www.youtube.com/results?search_query=sort+linked+list+merge+sort+leetcode+148',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Reverse in groups of K',
        slug: 'reverse-in-groups-of-k',
        description:
          'Reverse every consecutive group of K nodes cleanly while preserving pointers across group boundaries and leaving trailing nodes intact.',
        order: 17,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Reverse Nodes in k-Group',
            url: 'https://leetcode.com/problems/reverse-nodes-in-k-group/',
          },
          youtube: [
            {
              title: 'Reverse Nodes in K Group Linked List',
              url: 'https://www.youtube.com/results?search_query=reverse+nodes+in+k+group+linked+list',
            },
          ],
        },
        hasNotes: true,
      },
    ],
  },
  {
    title: 'Stacks',
    slug: 'stacks',
    description:
      'Master LIFO stacks from array and linked-list implementations to expression parsing, monotonic stacks, stock span, min-stack design, and histogram problems.',
    order: 11,
    difficulty: 'Medium',
    iconName: 'Layers',
    topics: [
      {
        title: 'Stack fundamentals',
        slug: 'stack-fundamentals',
        description:
          'Understand the stack abstract data type, real-world use cases like undo history, browser navigation, and function call management.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Stack Data Structure Fundamentals',
              url: 'https://www.youtube.com/results?search_query=stack+data+structure+fundamentals+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'LIFO principle',
        slug: 'lifo-principle',
        description:
          'Learn how Last-In, First-Out ordering governs insertion and removal exclusively at the top end of a stack.',
        order: 2,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'LIFO Principle in Stack Explained',
              url: 'https://www.youtube.com/results?search_query=lifo+principle+stack+data+structure',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Array implementation',
        slug: 'stack-array-implementation',
        description:
          'Implement a fixed-capacity or dynamic array-backed stack using a top index pointer with O(1) push, pop, and peek operations.',
        order: 3,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Implement Stack Using Array',
              url: 'https://www.youtube.com/results?search_query=implement+stack+using+array+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Linked list implementation',
        slug: 'stack-linked-list-implementation',
        description:
          'Implement an unbounded stack using a singly linked list where the head node acts as the top for O(1) push and pop.',
        order: 4,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Implement Stack Using Linked List',
              url: 'https://www.youtube.com/results?search_query=implement+stack+using+linked+list+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Push pop peek',
        slug: 'stack-push-pop-peek',
        description:
          'Practice core O(1) stack primitives—push, pop, peek/top, isEmpty, and size—and verify invariants across sequences of operations.',
        order: 5,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Stack Operations Push Pop Peek Explained',
              url: 'https://www.youtube.com/results?search_query=stack+push+pop+peek+operations+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Overflow and underflow',
        slug: 'stack-overflow-and-underflow',
        description:
          'Understand stack overflow on full fixed-capacity stacks, stack underflow on empty pops, and how defensive boundary checks prevent crashes.',
        order: 6,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Stack Overflow and Underflow Explained',
              url: 'https://www.youtube.com/results?search_query=stack+overflow+and+underflow+data+structure',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Valid parentheses',
        slug: 'valid-parentheses',
        description:
          'Match nested opening and closing brackets in O(n) time by pushing open delimiters onto a stack and validating closing delimiters.',
        order: 7,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Valid Parentheses',
            url: 'https://leetcode.com/problems/valid-parentheses/',
          },
          youtube: [
            {
              title: 'Valid Parentheses Stack Solution',
              url: 'https://www.youtube.com/results?search_query=valid+parentheses+stack+leetcode+20',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Infix to postfix',
        slug: 'infix-to-postfix',
        description:
          'Convert standard infix arithmetic expressions into Reverse Polish Notation (postfix) using operator precedence and associativity rules.',
        order: 8,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Infix to Postfix Conversion Using Stack',
              url: 'https://www.youtube.com/results?search_query=infix+to+postfix+using+stack+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Postfix evaluation',
        slug: 'postfix-evaluation',
        description:
          'Evaluate Reverse Polish Notation expressions in a single left-to-right pass by pushing operands and applying operators to the top two values.',
        order: 9,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Evaluate Reverse Polish Notation',
            url: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/',
          },
          youtube: [
            {
              title: 'Postfix Expression Evaluation Using Stack',
              url: 'https://www.youtube.com/results?search_query=postfix+evaluation+using+stack+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Prefix notation',
        slug: 'prefix-notation',
        description:
          'Convert between infix and Polish (prefix) notation and evaluate prefix expressions by scanning right-to-left with a stack.',
        order: 10,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Prefix Notation Conversion & Evaluation Using Stack',
              url: 'https://www.youtube.com/results?search_query=infix+to+prefix+and+prefix+evaluation+stack',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Next greater element',
        slug: 'next-greater-element',
        description:
          'Find the first greater element to the right for every item in O(n) amortized time using a decreasing monotonic stack.',
        order: 11,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Next Greater Element I',
            url: 'https://leetcode.com/problems/next-greater-element-i/',
          },
          youtube: [
            {
              title: 'Next Greater Element Using Monotonic Stack',
              url: 'https://www.youtube.com/results?search_query=next+greater+element+monotonic+stack',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Next smaller element',
        slug: 'next-smaller-element',
        description:
          'Find the nearest smaller element to the left or right in O(n) time using an increasing monotonic stack, foundational for range contribution problems.',
        order: 12,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Next Smaller Element Using Monotonic Stack',
              url: 'https://www.youtube.com/results?search_query=next+smaller+element+monotonic+stack',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Monotonic stack',
        slug: 'monotonic-stack',
        description:
          'Maintain strictly increasing or decreasing stack invariants to answer nearest-neighbor boundary queries in O(n) linear time.',
        order: 13,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Daily Temperatures',
            url: 'https://leetcode.com/problems/daily-temperatures/',
          },
          youtube: [
            {
              title: 'Monotonic Stack Pattern & Daily Temperatures',
              url: 'https://www.youtube.com/results?search_query=monotonic+stack+pattern+daily+temperatures',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Stock span problem',
        slug: 'stock-span-problem',
        description:
          'Compute consecutive prior days with price less than or equal to today using a monotonic decreasing stack storing prices or indices.',
        order: 14,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Online Stock Span',
            url: 'https://leetcode.com/problems/online-stock-span/',
          },
          youtube: [
            {
              title: 'Stock Span Problem Using Monotonic Stack',
              url: 'https://www.youtube.com/results?search_query=stock+span+problem+monotonic+stack',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Min stack',
        slug: 'min-stack',
        description:
          'Support push, pop, top, and getMin in strict O(1) time using an auxiliary minimum stack or encoded difference values.',
        order: 15,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Min Stack',
            url: 'https://leetcode.com/problems/min-stack/',
          },
          youtube: [
            {
              title: 'Min Stack Design O(1) Time',
              url: 'https://www.youtube.com/results?search_query=min+stack+leetcode+155+o1',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Largest rectangle in histogram',
        slug: 'largest-rectangle-in-histogram',
        description:
          'Compute the maximum rectangular area under histogram bars in O(n) time by finding previous and next smaller heights with an increasing monotonic stack.',
        order: 16,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Largest Rectangle in Histogram',
            url: 'https://leetcode.com/problems/largest-rectangle-in-histogram/',
          },
          youtube: [
            {
              title: 'Largest Rectangle in Histogram Monotonic Stack',
              url: 'https://www.youtube.com/results?search_query=largest+rectangle+in+histogram+monotonic+stack',
            },
          ],
        },
        hasNotes: true,
      },
    ],
  },
  {
    title: 'Queues',
    slug: 'queues',
    description:
      'Learn FIFO queue mechanics, circular buffers, double-ended queues, stack-queue simulations, priority queue basics, and monotonic deques for sliding windows.',
    order: 12,
    difficulty: 'Medium',
    iconName: 'ListOrdered',
    topics: [
      {
        title: 'Queue fundamentals',
        slug: 'queue-fundamentals',
        description:
          'Understand the queue abstract data type and its role in BFS traversal, task scheduling, buffering, and asynchronous pipelines.',
        order: 1,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Queue Data Structure Fundamentals',
              url: 'https://www.youtube.com/results?search_query=queue+data+structure+fundamentals+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'FIFO principle',
        slug: 'fifo-principle',
        description:
          'Learn how First-In, First-Out ordering ensures elements are processed strictly in the order they arrive.',
        order: 2,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'FIFO Principle in Queue Explained',
              url: 'https://www.youtube.com/results?search_query=fifo+principle+queue+data+structure',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Enqueue dequeue',
        slug: 'queue-enqueue-dequeue',
        description:
          'Implement and analyze enqueue (insert at rear) and dequeue (remove from front) operations while avoiding O(n) array shifting.',
        order: 3,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Queue Enqueue and Dequeue Operations',
              url: 'https://www.youtube.com/results?search_query=queue+enqueue+dequeue+operations+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Front and rear',
        slug: 'queue-front-and-rear',
        description:
          'Track front and rear pointers across empty, single-element, and full queue states without off-by-one errors.',
        order: 4,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Front and Rear Pointers in Queue',
              url: 'https://www.youtube.com/results?search_query=queue+front+and+rear+pointers+explained',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Array implementation',
        slug: 'queue-array-implementation',
        description:
          'Build a queue backed by an array using modular index wrap-around or count tracking for O(1) enqueue and dequeue.',
        order: 5,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Implement Queue Using Array',
              url: 'https://www.youtube.com/results?search_query=implement+queue+using+array+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Linked list implementation',
        slug: 'queue-linked-list-implementation',
        description:
          'Maintain both head (front) and tail (rear) pointers on a singly linked list to achieve O(1) enqueue and dequeue with dynamic capacity.',
        order: 6,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Implement Queue Using Linked List',
              url: 'https://www.youtube.com/results?search_query=implement+queue+using+linked+list+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Circular queue',
        slug: 'circular-queue',
        description:
          'Use modular arithmetic (index + 1) % capacity in a ring buffer to reuse freed front slots without memory waste.',
        order: 7,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Design Circular Queue',
            url: 'https://leetcode.com/problems/design-circular-queue/',
          },
          youtube: [
            {
              title: 'Circular Queue Ring Buffer Implementation',
              url: 'https://www.youtube.com/results?search_query=circular+queue+implementation+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Deque (Double ended queue)',
        slug: 'deque-double-ended-queue',
        description:
          'Design a double-ended queue supporting O(1) insertion and deletion at both the front and rear using circular arrays or doubly linked lists.',
        order: 8,
        difficulty: 'Medium',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Design Circular Deque',
            url: 'https://leetcode.com/problems/design-circular-deque/',
          },
          youtube: [
            {
              title: 'Deque Double Ended Queue Explained',
              url: 'https://www.youtube.com/results?search_query=deque+double+ended+queue+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Priority queue introduction',
        slug: 'priority-queue-introduction',
        description:
          'Understand priority-ordered queues where highest or lowest priority elements dequeue first, and compare array vs binary heap implementations.',
        order: 9,
        difficulty: 'Easy',
        conceptType: 'theory',
        resources: {
          codechef: null,
          leetcode: null,
          youtube: [
            {
              title: 'Priority Queue Introduction & Applications',
              url: 'https://www.youtube.com/results?search_query=priority+queue+introduction+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Queue using two stacks',
        slug: 'queue-using-two-stacks',
        description:
          'Simulate FIFO queue behavior using input and output stacks, achieving amortized O(1) per operation with lazy transfer.',
        order: 10,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Implement Queue using Stacks',
            url: 'https://leetcode.com/problems/implement-queue-using-stacks/',
          },
          youtube: [
            {
              title: 'Implement Queue Using Two Stacks Amortized O(1)',
              url: 'https://www.youtube.com/results?search_query=implement+queue+using+two+stacks+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Stack using two queues',
        slug: 'stack-using-two-queues',
        description:
          'Simulate LIFO stack semantics using two queues (or a single rotated queue) by reordering elements on push or pop.',
        order: 11,
        difficulty: 'Easy',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Implement Stack using Queues',
            url: 'https://leetcode.com/problems/implement-stack-using-queues/',
          },
          youtube: [
            {
              title: 'Implement Stack Using Queues Explained',
              url: 'https://www.youtube.com/results?search_query=implement+stack+using+queues+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Monotonic queue',
        slug: 'monotonic-queue',
        description:
          'Maintain sorted elements in a deque by evicting dominated values from the back and expired indices from the front in O(1) amortized time.',
        order: 12,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Sliding Window Maximum',
            url: 'https://leetcode.com/problems/sliding-window-maximum/',
          },
          youtube: [
            {
              title: 'Monotonic Queue Pattern Explained',
              url: 'https://www.youtube.com/results?search_query=monotonic+queue+deque+dsa',
            },
          ],
        },
        hasNotes: true,
      },
      {
        title: 'Sliding window maximum',
        slug: 'sliding-window-maximum',
        description:
          'Find the maximum element in every contiguous window of size k in O(n) time using a monotonic decreasing deque of indices.',
        order: 13,
        difficulty: 'Hard',
        conceptType: 'both',
        resources: {
          codechef: null,
          leetcode: {
            title: 'Sliding Window Maximum',
            url: 'https://leetcode.com/problems/sliding-window-maximum/',
          },
          youtube: [
            {
              title: 'Sliding Window Maximum Monotonic Deque',
              url: 'https://www.youtube.com/results?search_query=sliding+window+maximum+monotonic+deque',
            },
          ],
        },
        hasNotes: true,
      },
    ],
  },
];

export default modules7to12;
