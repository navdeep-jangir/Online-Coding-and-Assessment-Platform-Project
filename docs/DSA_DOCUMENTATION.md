# DSA Implementation Documentation — CodeClimb

CodeClimb directly implements core Data Structures and Algorithms inside its backend architecture. Core reusable structures live in `server/src/utils/dsaAlgorithms.js` (unit-tested in `server/tests/unit/dsaAlgorithms.test.js`) and are actively used by the recommendation engine, smart revision scheduler, daily challenge streak engine, analytics, and leaderboard.

## Summary Matrix

| Data Structure / Algorithm | Where Used | Why Selected | Time Complexity | Space Complexity |
|---|---|---|---|---|
| **Directed Acyclic Graph (DAG)** | `recommendationService.js` (`buildPrerequisiteGraph`), `dsaAlgorithms.js` (`buildDAG`) | Models prerequisite dependencies (`prereq -> dependent`) across 24 DSA modules and 348 concepts. | O(V + E) | O(V + E) |
| **Topological Sort (Kahn's Algorithm)** | `recommendationService.js` (`topologicalSort`), `dsaAlgorithms.js` (`topologicalSort`) | Computes a valid prerequisite-respecting learning order and detects circular dependencies. | O((V + E) log V) with heap tie-breaking; O(V + E) standard | O(V + E) |
| **Min-Heap Priority Queue** | `dsaAlgorithms.js` (`PriorityQueue`), `revisionService.js` (`RevisionPriorityQueue`), `recommendationService.js` (`MinPriorityQueue`) | Prioritizes overdue/earliest-due spaced-repetition problems (`1, 3, 7, 14` days) and ranks eligible next topics/problems. | O(log n) insert/extract, O(1) peek | O(n) |
| **Hash Map (`Map`) & Hash Set (`Set`)** | `recommendationService.js`, `dailyChallengeController.js` (`calculateStreakFromDates`), `progressController.js`, `dsaAlgorithms.js` (`hashMapCounter`) | O(1) membership checks for completed topics, solved/incorrect problems, IST streak sequences, and O(S) single-pass weak-topic aggregation. | O(1) avg lookup, O(N) build | O(N) |
| **Merge Sort** | `dsaAlgorithms.js` (`mergeSort`), `leaderboardController.js` | Stable `O(n log n)` worst-case sorting for deterministic leaderboard rankings. | O(n log n) | O(n) |
| **Binary Search** | `dsaAlgorithms.js` (`binarySearch`) | Fast `O(log n)` lookup on sorted arrays. | O(log n) | O(1) |
| **Cycle Detection (3-Color DFS)** | `dsaAlgorithms.js` (`detectCycle`) | Validates prerequisite graphs so circular dependencies are caught. | O(V + E) | O(V) |
| **Breadth-First Search (BFS)** | `dsaAlgorithms.js` (`bfsShortestPath`) | Computes shortest prerequisite path between foundational and target concepts. | O(V + E) | O(V) |

## Feature-by-Feature DSA Architecture

### 1. Intelligent DSA Learning Path (`server/src/services/recommendationService.js`)
- **Prerequisite DAG (`buildPrerequisiteGraph`):** Builds `adjacencyList` (`Map<string, string[]>`), `reverseDependencies`, and `inDegree` (`Map<string, number>`) from `Module.prerequisites` and `Topic.prerequisites` across all 24 modules and 348 concepts.
- **Kahn's Topological Sort (`topologicalSort`):** Uses in-degree relaxation with a `MinPriorityQueue` tie-breaker (`difficulty -> moduleOrder -> topicOrder -> title`) to produce a deterministic prerequisite-safe learning order in `O((V + E) log V)` time.
- **Hash Sets for Progress & Weaknesses (`getUserCompletionState`, `getWeakTopics`):** Tracks `completedTopics`, `solvedProblems`, and `incorrectProblems` in `Set`s for `O(1)` lookup, and aggregates submission acceptance rates per topic in a single `O(S)` pass using a `Map`.

### 2. Smart Revision Mode (`server/src/services/revisionService.js`, `server/src/controllers/revisionController.js`)
- **Min-Heap Priority Queue (`RevisionPriorityQueue` backed by `PriorityQueue` from `dsaAlgorithms.js`):** Orders pending/due revision entries by earliest `nextRevisionDate` ascending, breaking ties by higher `incorrectAttempts` descending (`O(log n)` insert/extract).
- **Spaced Repetition (`calculateNextRevisionDate`):** Advances review intervals along `[1, 3, 7, 14]` days based on attempt history without deleting historical attempt counts.

### 3. Daily Coding Challenge & Streak Engine (`server/src/controllers/dailyChallengeController.js`)
- **Hash-Set Consecutive Sequence (`calculateStreakFromDates`):** Stores unique `Asia/Kolkata` (`YYYY-MM-DD`) activity dates in a `Set<string>` and computes both current streak and longest consecutive streak in `O(N)` time and `O(N)` space.
- **Atomic Conditional Updates:** Uses MongoDB conditional `findOneAndUpdate({ isCompleted: false, xpAwarded: false })` paired with a unique `{ user, dateKey }` index on `ChallengeAttempt` to guarantee `+20` bonus XP is awarded at most once per day.

### 4. Leaderboard Ranking (`server/src/controllers/leaderboardController.js`)
- **Hash Maps & Sets (`userSolvedMap`, `userDiffMap`, `userPeriodXpMap`):** Single-pass `O(S)` aggregation deduplicates distinct accepted `problemId`s per user in a `Set` (preventing repeated accepted submissions from inflating solved counts) and sums `XPEvent` amounts during weekly/monthly windows.
- **Merge Sort (`mergeSort`):** Stable `O(N log N)` time, `O(N)` space sorting with deterministic tie-breaking (`xp DESC -> solvedCount DESC -> streak DESC -> name ASC`).

### 5. Performance Analytics & Submission History (`server/src/controllers/progressController.js`)
- **Hash Maps & Sets (`topicStatsMap`, `languageStatsMap`, `solvedProblemIds`, `verdictMap`):** Single-pass `O(S)` grouping and counting of submissions by topic, programming language, difficulty, and Judge0 verdict.
- **Time-Series Arrays (`buildActivityWindow`, `xpGrowth`):** Fixed-length sliding-window arrays (`7`-day weekly and `30`-day monthly IST buckets) built in `O(S + D)` time and `O(D)` space.
- **Searching, Filtering & Sorting (`getPerformanceReport`):** Linear `O(S)` multi-criteria filtering (problem title search, language, verdict) and `O(S log S)` sorting (`newest`, `oldest`, `runtime`) over the student's private submissions.
