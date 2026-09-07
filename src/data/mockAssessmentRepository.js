// Mock Assessment Repository
// Contains multi-domain production-grade assessment files with complete question sets,
// options, identified correct answers, explanations, and metadata.

export const INITIAL_ASSESSMENTS = [
  {
    id: 'ASM-PY-101',
    title: 'Python Core & Algorithmic Data Structures Assessment',
    assessmentType: 'mcq',
    domain: 'python',
    course: 'AIML',
    targetBatches: ['202601', '202101'],
    dateCreated: '2026-09-01',
    status: 'Active',
    durationMinutes: 45,
    description: 'Evaluates proficiency in Python memory management, algorithmic complexity, list comprehensions, decorators, and generator pipelines.',
    questions: [
      {
        id: 'py-q01',
        question: 'Which of the following data structures in Python maintains order, is mutable, but enforces unique elements?',
        type: 'mcq',
        options: [
          'dict keys (Python 3.7+)',
          'set',
          'collections.OrderedDict (keys only)',
          'frozenset'
        ],
        correctAnswer: 0,
        explanation: 'From Python 3.7+, standard dictionary keys preserve insertion order, allow mutable mapping updates, and naturally enforce key uniqueness.'
      },
      {
        id: 'py-q02',
        question: 'What is the theoretical average-case time complexity of retrieving an item from a Python dictionary by key?',
        type: 'mcq',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctAnswer: 0,
        explanation: 'Python dictionaries utilize an open-addressing hash table with perturbation, achieving amortized O(1) average lookup complexity.'
      },
      {
        id: 'py-q03',
        question: 'What is the output of the following generator expression: sum(x for x in range(10) if x % 2 == 0)?',
        type: 'mcq',
        options: ['20', '25', '30', '45'],
        correctAnswer: 0,
        explanation: 'The even numbers are 0, 2, 4, 6, 8. Their sum is 0 + 2 + 4 + 6 + 8 = 20.'
      },
      {
        id: 'py-q04',
        question: 'What does the functools.wraps decorator achieve when authoring custom Python decorators?',
        type: 'mcq',
        options: [
          'It compiles the function bytecode into C-extension speed',
          'It copies metadata like __name__ and __doc__ from the original function to the wrapper',
          'It forces the decorated function to execute asynchronously in a thread pool',
          'It automatically memoizes recursive function return values'
        ],
        correctAnswer: 1,
        explanation: 'functools.wraps preserves docstrings, function names, module origins, and signature metadata from the original wrapped callable.'
      },
      {
        id: 'py-q05',
        question: 'In Python multiprocessing, why is the multiprocessing module favored over threading for heavy CPU-bound algorithmic tasks?',
        type: 'mcq',
        options: [
          'Threading consumes more OS file handles than multiprocessing',
          'The Global Interpreter Lock (GIL) prevents pure Python threads from executing in parallel on multiple CPU cores',
          'Processes share memory by default whereas threads isolate memory',
          'Threading does not support exception handling across subprocess boundaries'
        ],
        correctAnswer: 1,
        explanation: 'The CPython GIL restricts multi-threading to one active core for CPU-bound bytecode execution; multiprocessing spawns separate processes with isolated GILs.'
      },
      {
        id: 'py-q06',
        question: 'What does the expression [x[:] for x in [[1, 2], [3, 4]]] produce relative to the original list of lists?',
        type: 'mcq',
        options: [
          'A deep copy of the nested arrays',
          'A shallow copy of the outer list, with new inner lists copied by slice',
          'The exact same references for inner lists',
          'A single flattened 1D array [1, 2, 3, 4]'
        ],
        correctAnswer: 1,
        explanation: 'x[:] slices each 1st-level sublist creating a new list instance containing the primitive elements.'
      },
      {
        id: 'py-q07',
        question: 'Which method in Python allows a class instance to be invoked as a callable function (e.g. obj())?',
        type: 'mcq',
        options: ['__call__', '__invoke__', '__init__', '__execute__'],
        correctAnswer: 0,
        explanation: 'Defining the special magic method __call__(self, *args, **kwargs) enables instances of the class to behave as callables.'
      },
      {
        id: 'py-q08',
        question: 'When reading a multi-gigabyte log file line-by-line, which file reading technique provides the optimal memory footprint?',
        type: 'mcq',
        options: [
          'file.readlines()',
          'file.read().splitlines()',
          'for line in file:',
          'json.loads(file.read())'
        ],
        correctAnswer: 2,
        explanation: 'Iterating over the file object directly (for line in file:) leverages buffered generator streaming, loading only one line at a time into RAM.'
      },
      {
        id: 'py-q09',
        question: 'What does the @staticmethod decorator indicate in a class definition?',
        type: 'mcq',
        options: [
          'The method accepts "cls" as its first parameter',
          'The method belongs to the class namespace but does not receive an implicit "self" or "cls" parameter',
          'The method can only be called from within the class constructor',
          'The method is strictly immutable and cannot return values'
        ],
        correctAnswer: 1,
        explanation: 'A @staticmethod behaves like a standard plain function scoped inside the class namespace without automatic self or cls argument injection.'
      },
      {
        id: 'py-q10',
        question: 'Which builtin module provides double-ended queues with fast O(1) appends and pops from both ends?',
        type: 'mcq',
        options: ['collections.deque', 'queue.LifoQueue', 'heapq', 'array.array'],
        correctAnswer: 0,
        explanation: 'collections.deque is implemented as a doubly linked list of blocks, guaranteeing O(1) push/pop operations at both the left and right ends.'
      },
      {
        id: 'py-q11',
        question: 'What is the key difference between deepcopy() and copy() in Python copy module?',
        type: 'mcq',
        options: [
          'copy() works only on numbers; deepcopy() works on strings',
          'copy() constructs a new compound object and inserts references; deepcopy() recursively inserts copies of nested objects',
          'deepcopy() freezes mutations while copy() permits write operations',
          'copy() operates in O(1) while deepcopy() is strictly invalid for custom classes'
        ],
        correctAnswer: 1,
        explanation: 'copy.copy creates a shallow copy holding pointers to nested children; copy.deepcopy recursively duplicates all nested structures.'
      },
      {
        id: 'py-q12',
        question: 'In Python, what is the output of bool("False")?',
        type: 'mcq',
        options: ['True', 'False', 'None', 'TypeError'],
        correctAnswer: 0,
        explanation: 'Any non-empty string evaluates to boolean True in Python, regardless of the characters inside.'
      }
    ]
  },
  {
    id: 'ASM-SQL-102',
    title: 'Advanced SQL Window Functions & Optimization Assessment',
    assessmentType: 'mcq',
    domain: 'sql',
    course: 'APIDA',
    targetBatches: ['202601', '202107'],
    dateCreated: '2026-09-03',
    status: 'Active',
    durationMinutes: 30,
    description: 'Covers CTEs, analytical window partitioning, DENSE_RANK vs RANK, execution plan optimization, and indexing strategies.',
    questions: [
      {
        id: 'sql-q01',
        question: 'Which SQL window function computes the running cumulative sum of salaries partitioned by department?',
        type: 'mcq',
        options: [
          'SUM(salary) OVER (PARTITION BY dept_id ORDER BY hire_date)',
          'RUNNING_SUM(salary) OVER (dept_id)',
          'CUMULATIVE_SUM(salary) GROUP BY dept_id',
          'SUM(salary) OVER (ORDER BY dept_id COMPUTE BY hire_date)'
        ],
        correctAnswer: 0,
        explanation: 'SUM(salary) OVER (PARTITION BY dept_id ORDER BY hire_date) creates a window partition and accumulates rows ordered by hire_date.'
      },
      {
        id: 'sql-q02',
        question: 'What is the functional difference between RANK() and DENSE_RANK() when encountering tied values?',
        type: 'mcq',
        options: [
          'RANK() skips ranks following a tie (e.g. 1, 2, 2, 4); DENSE_RANK() does not skip (1, 2, 2, 3)',
          'DENSE_RANK() only operates on numeric columns; RANK() operates on text',
          'DENSE_RANK() skips ranks following a tie; RANK() does not skip',
          'RANK() requires an ORDER BY clause whereas DENSE_RANK() forbids it'
        ],
        correctAnswer: 0,
        explanation: 'RANK() increments rank by count of preceding tied rows leaving gaps, whereas DENSE_RANK() keeps consecutive numbering without gaps.'
      },
      {
        id: 'sql-q03',
        question: 'Which clause defines the boundaries of rows examined within a window frame relative to the current row?',
        type: 'mcq',
        options: [
          'ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW',
          'LIMIT ROWS OFFSET 0',
          'HAVING BOUNDARY BETWEEN PRECEDING AND FOLLOWING',
          'WINDOW BOUNDS RELATIVE TO CURRENT'
        ],
        correctAnswer: 0,
        explanation: 'The ROWS BETWEEN (or RANGE BETWEEN) specification explicitly declares the sliding window frame bounds.'
      },
      {
        id: 'sql-q04',
        question: 'In SQL execution planning, what does an "Index Seek" represent compared to an "Index Scan"?',
        type: 'mcq',
        options: [
          'Index Seek traverses the B-Tree directly to qualifying keys; Index Scan reads all leaf pages of the index',
          'Index Seek is slower than a full table scan; Index Scan is instantaneous',
          'Index Seek requires memory swapping to disk; Index Scan uses L1 cache only',
          'Index Seek only applies to clustered columnstore indexes'
        ],
        correctAnswer: 0,
        explanation: 'Index Seek navigates the B-tree structure directly to matching rows using search arguments, making it dramatically more efficient than scanning the entire index leaf level.'
      },
      {
        id: 'sql-q05',
        question: 'What is the primary operational advantage of Common Table Expressions (CTEs) utilizing the RECURSIVE keyword?',
        type: 'mcq',
        options: [
          'To query hierarchical trees, organizational charts, and graph path networks',
          'To force parallel query execution across CPU threads',
          'To automatically encrypt sensitive database columns at rest',
          'To bypass transaction rollback logging'
        ],
        correctAnswer: 0,
        explanation: 'Recursive CTEs iteratively query hierarchical and graph datasets such as parent-child employee rosters or bill-of-materials structures.'
      },
      {
        id: 'sql-q06',
        question: 'Which SQL function returns the value from a row 1 step prior in the current partition without requiring a self-join?',
        type: 'mcq',
        options: ['LAG()', 'LEAD()', 'FIRST_VALUE()', 'PREV()'],
        correctAnswer: 0,
        explanation: 'LAG(column, offset) accesses data from a preceding row at a given physical offset within the window partition.'
      },
      {
        id: 'sql-q07',
        question: 'What happens when an INNER JOIN compares two tables where the joining column contains NULL values on both sides?',
        type: 'mcq',
        options: [
          'NULL values do not match each other, so those rows are excluded from the result',
          'All NULL rows match all other NULL rows producing a Cartesian product',
          'The query throws a runtime NULL_COMPARISON_EXCEPTION',
          'The database automatically coalesces NULLs to empty strings'
        ],
        correctAnswer: 0,
        explanation: 'In ANSI SQL ternary logic, NULL = NULL evaluates to UNKNOWN (not TRUE), hence INNER JOIN filters out those rows.'
      },
      {
        id: 'sql-q08',
        question: 'Which index structure stores the actual table data rows physically sorted on disk according to the key columns?',
        type: 'mcq',
        options: [
          'Clustered Index',
          'Non-Clustered Index',
          'Filtered Index',
          'Spatial Index'
        ],
        correctAnswer: 0,
        explanation: 'A Clustered Index dictates the physical leaf-level ordering of data rows in the storage table.'
      },
      {
        id: 'sql-q09',
        question: 'What is the purpose of the QUALIFY clause found in modern SQL engines like Snowflake, BigQuery, and Teradata?',
        type: 'mcq',
        options: [
          'To filter the output of window functions directly without wrapping in a subquery or CTE',
          'To validate user credentials during database authentication',
          'To enforce schema constraints on newly inserted rows',
          'To check whether a table exists prior to execution'
        ],
        correctAnswer: 0,
        explanation: 'QUALIFY filters results based on window function computations directly, eliminating the boilerplate of wrapping queries in CTEs.'
      },
      {
        id: 'sql-q10',
        question: 'What does the UNION operator do compared to UNION ALL?',
        type: 'mcq',
        options: [
          'UNION performs a distinct sort to eliminate duplicate rows; UNION ALL retains all duplicates without sorting',
          'UNION ALL is slower because it deduplicates records',
          'UNION requires both tables to have matching table names',
          'UNION can only join two tables; UNION ALL joins up to ten tables'
        ],
        correctAnswer: 0,
        explanation: 'UNION performs a distinct deduplication pass which carries an execution cost; UNION ALL simply appends result sets directly.'
      }
    ]
  },
  {
    id: 'ASM-EX-103',
    title: 'Excel AI & Copilot Spreadsheet Automation Assessment',
    assessmentType: 'mcq',
    domain: 'excel_ai',
    course: 'DAS',
    targetBatches: ['202601', '202102'],
    dateCreated: '2026-09-04',
    status: 'Published',
    durationMinutes: 40,
    description: 'Tests knowledge of modern dynamic array formulas (LET, LAMBDA, XLOOKUP), Power Query transformations, and Copilot AI formula crafting.',
    questions: [
      {
        id: 'ex-q01',
        question: 'Which Excel function enables the creation of reusable custom functions with named parameters directly inside cell formulas without VBA?',
        type: 'mcq',
        options: ['=LAMBDA()', '=CUSTOM.FUNC()', '=VBA.EXEC()', '=DEF()'],
        correctAnswer: 0,
        explanation: '=LAMBDA(param1, param2, formula) turns standard formula expressions into reusable custom formulas that can be given friendly names in the Name Manager.'
      },
      {
        id: 'ex-q02',
        question: 'What does the Excel formula =LET(tax_rate, 0.18, revenue, 100000, revenue * tax_rate) return?',
        type: 'mcq',
        options: ['18000', '1800', '100000', 'Error: Invalid Token'],
        correctAnswer: 0,
        explanation: 'The LET function assigns 0.18 to tax_rate, 100000 to revenue, and evaluates revenue * tax_rate = 18000 with significant performance gains.'
      },
      {
        id: 'ex-q03',
        question: 'Which modern Excel dynamic lookup function eliminates the limitation where the lookup column must be the leftmost column of the range?',
        type: 'mcq',
        options: ['XLOOKUP', 'VLOOKUP', 'HLOOKUP', 'SEARCH.EXACT'],
        correctAnswer: 0,
        explanation: 'XLOOKUP accepts separate lookup_array and return_array ranges, allowing lookups to the left, right, top, or bottom without column index offsets.'
      },
      {
        id: 'ex-q04',
        question: 'When using Microsoft Copilot for Excel to classify unstructured customer feedback comments into sentiment categories, which prompt structure delivers the highest accuracy?',
        type: 'mcq',
        options: [
          'Define the exact column range, target categories [Positive, Neutral, Negative], and rule criteria in the prompt',
          'Type "fix comments" without parameters',
          'Paste a Python script into the Copilot chat bar',
          'Tell Copilot to delete all rows containing punctuation'
        ],
        correctAnswer: 0,
        explanation: 'Providing strict target categories, clear operational boundaries, and source column context gives Copilot deterministic parameters for formula synthesis.'
      },
      {
        id: 'ex-q05',
        question: 'What happens when a dynamic array formula in Excel encounters an existing non-empty cell in its intended output expansion path?',
        type: 'mcq',
        options: [
          'It displays a #SPILL! error until the obstructing cell is cleared',
          'It silently overwrites the existing cell content',
          'It truncates the array output to fit only empty cells',
          'It automatically shifts the obstructing cells down by 1 row'
        ],
        correctAnswer: 0,
        explanation: 'Excel dynamic arrays protect existing user data by throwing a #SPILL! error until the rectangular bounding box needed for expansion is cleared.'
      },
      {
        id: 'ex-q06',
        question: 'Which dynamic array function filters a tabular range based on boolean criteria without modifying the source table?',
        type: 'mcq',
        options: ['=FILTER()', '=SUBSET()', '=WHERE()', '=EXTRACT()'],
        correctAnswer: 0,
        explanation: '=FILTER(array, include, [if_empty]) extracts matching records dynamically based on boolean conditions provided in the include parameter.'
      },
      {
        id: 'ex-q07',
        question: 'In Power Query for Excel, what language is generated when you apply transformation steps in the Applied Steps list?',
        type: 'mcq',
        options: ['M Formula Language', 'DAX', 'VBA', 'TypeScript'],
        correctAnswer: 0,
        explanation: 'Power Query transformation steps are coded under the hood in the M functional formula language.'
      },
      {
        id: 'ex-q08',
        question: 'Which Excel feature allows grouping, summarizing, and dynamically exploring relational tables connected via data model relationships?',
        type: 'mcq',
        options: ['Power Pivot', 'Solver', 'Goal Seek', 'Data Table Simulation'],
        correctAnswer: 0,
        explanation: 'Power Pivot provides an in-memory xVelocity columnar engine inside Excel to build relational data models and write DAX measures.'
      }
    ]
  },
  {
    id: 'ASM-PBI-104',
    title: 'Power BI DAX Modeling & Financial Analytics Assessment',
    assessmentType: 'mcq',
    domain: 'power_bi',
    course: 'APIDS',
    targetBatches: ['202601', '202103'],
    dateCreated: '2026-09-05',
    status: 'Published',
    durationMinutes: 45,
    description: 'Evaluates DAX filter context transition, CALCULATE modifiers (ALL, KEEPFILTERS, USERELATIONSHIP), Time Intelligence functions, and star-schema design.',
    questions: [
      {
        id: 'pb-q01',
        question: 'What does the CALCULATE function in DAX do when evaluating a measure?',
        type: 'mcq',
        options: [
          'It evaluates an expression in a modified filter context',
          'It calculates the average of a column and rounds to 2 decimals',
          'It converts text data into currency values',
          'It exports data into an external CSV file'
        ],
        correctAnswer: 0,
        explanation: 'CALCULATE is the single most critical function in DAX, allowing modification, overriding, or expansion of the active filter context during evaluation.'
      },
      {
        id: 'pb-q02',
        question: 'What is the operational difference between a DAX Calculated Column and a DAX Measure?',
        type: 'mcq',
        options: [
          'Calculated Columns are computed row-by-row during data refresh and stored in RAM; Measures are computed dynamically on the fly based on report filters',
          'Calculated Columns are evaluated on the fly; Measures are written to disk',
          'Measures can only be used on card visuals; Calculated Columns can only be used on tables',
          'There is no difference; they are aliases for the same underlying construct'
        ],
        correctAnswer: 0,
        explanation: 'Calculated Columns consume model memory by storing values per row; Measures execute on-demand in response to slicers, drill-downs, and visual context.'
      },
      {
        id: 'pb-q03',
        question: 'Which DAX modifier function instructs CALCULATE to ignore any active filters on a specific dimension table?',
        type: 'mcq',
        options: ['ALL()', 'FILTER()', 'VALUES()', 'DISTINCT()'],
        correctAnswer: 0,
        explanation: 'ALL(Table) removes all context filters applied to the table, commonly used when computing percentage-of-total calculations.'
      },
      {
        id: 'pb-q04',
        question: 'Why is a Star Schema architecture preferred over a deeply normalized Snowflake Schema in Power BI tabular models?',
        type: 'mcq',
        options: [
          'Star schemas simplify relationship traversal, minimize join depth, and maximize VertiPaq engine compression efficiency',
          'Star schemas require fewer permissions in Azure AD',
          'Snowflake schemas cannot handle numeric fields in DAX',
          'Star schemas prevent report authors from creating bookmarks'
        ],
        correctAnswer: 0,
        explanation: 'The VertiPaq tabular engine is heavily optimized for single-hop relationships between dimension tables and fact tables in a Star Schema.'
      },
      {
        id: 'pb-q05',
        question: 'Which DAX time-intelligence function calculates sales for the exact same period in the prior calendar year?',
        type: 'mcq',
        options: [
          'SAMEPERIODLASTYEAR(DateTable[Date])',
          'PREV_YEAR_SUM(Sales[Amount])',
          'YEAR_OFFSET(-1)',
          'DATE_SHIFT(DateTable[Date], -365)'
        ],
        correctAnswer: 0,
        explanation: 'CALCULATE([Total Sales], SAMEPERIODLASTYEAR(Calendar[Date])) shifts the active filter context back 1 full year while preserving month/quarter granularity.'
      },
      {
        id: 'pb-q06',
        question: 'What DAX function allows activating an inactive secondary relationship defined between two tables in the data model?',
        type: 'mcq',
        options: [
          'USERELATIONSHIP(Fact[ShipDate], Calendar[Date])',
          'ACTIVE_RELATION(Fact[ShipDate], Calendar[Date])',
          'JOIN_OVERRIDE(Fact, Calendar)',
          'SET_ACTIVE_KEY(Fact[ShipDate])'
        ],
        correctAnswer: 0,
        explanation: 'USERELATIONSHIP is passed as a filter argument to CALCULATE to temporarily activate an inactive role-playing relationship (e.g. Order Date vs Ship Date).'
      }
    ]
  },
  {
    id: 'ASM-ML-105',
    title: 'Machine Learning Model Evaluation & Scikit-Learn Assessment',
    assessmentType: 'mcq',
    domain: 'ml',
    course: 'AIML',
    targetBatches: ['202601', '202101'],
    dateCreated: '2026-09-06',
    status: 'Active',
    durationMinutes: 45,
    description: 'Assesses cross-validation strategies, ROC-AUC metrics, precision-recall trade-offs, regularization (L1/L2), and feature engineering.',
    questions: [
      {
        id: 'ml-q01',
        question: 'When evaluating a binary classifier on a severely imbalanced dataset (e.g. 99% negative, 1% fraud cases), which metric is the MOST deceptive?',
        type: 'mcq',
        options: ['Accuracy', 'Precision', 'Recall', 'F1-Score'],
        correctAnswer: 0,
        explanation: 'A naive model predicting the negative class for every single instance achieves 99% accuracy while detecting 0 fraud cases.'
      },
      {
        id: 'ml-q02',
        question: 'What is the primary effect of L1 regularization (Lasso) on model weights compared to L2 regularization (Ridge)?',
        type: 'mcq',
        options: [
          'L1 drives less relevant feature coefficients exactly to zero, performing intrinsic feature selection',
          'L2 drives coefficients exactly to zero, while L1 only shrinks them proportionally',
          'L1 only applies to neural networks, while L2 only applies to decision trees',
          'L1 doubles the learning rate during stochastic gradient descent'
        ],
        correctAnswer: 0,
        explanation: 'Due to the diamond geometry of the L1 penalty norm, optimal solutions frequently intersect axes where coefficients become exactly 0.'
      },
      {
        id: 'ml-q03',
        question: 'Which cross-validation scheme ensures that each fold contains approximately the same percentage of target class samples as the complete dataset?',
        type: 'mcq',
        options: [
          'StratifiedKFold',
          'KFold',
          'TimeSeriesSplit',
          'LeaveOneOut'
        ],
        correctAnswer: 0,
        explanation: 'StratifiedKFold partitions datasets while preserving class distribution proportions in both the training and test splits.'
      },
      {
        id: 'ml-q04',
        question: 'In Random Forest algorithms, what are the two main sources of randomness introduced to ensure individual tree diversity?',
        type: 'mcq',
        options: [
          'Bootstrap sample selection (bagging) and random feature subset selection at each node split',
          'Random learning rates and random loss functions',
          'Random activation functions and random gradient initialization',
          'Random sorting of input columns and random precision quantization'
        ],
        correctAnswer: 0,
        explanation: 'Random Forests combine bootstrap aggregating (bagging rows) with random feature subspace sampling at each candidate split to de-correlate trees.'
      },
      {
        id: 'ml-q05',
        question: 'What does the Area Under the Receiver Operating Characteristic Curve (ROC-AUC) quantify?',
        type: 'mcq',
        options: [
          'The probability that the classifier ranks a randomly chosen positive instance higher than a randomly chosen negative instance',
          'The exact percentage of false positives in the training set',
          'The speed of gradient convergence per epoch',
          'The ratio of features to observations'
        ],
        correctAnswer: 0,
        explanation: 'ROC-AUC measures discrimination ability across all classification thresholds, equivalent to the Wilcoxon-Mann-Whitney ranking statistic.'
      },
      {
        id: 'ml-q06',
        question: 'What critical issue occurs if you fit a StandardScaler on the combined training AND test dataset prior to cross-validation?',
        type: 'mcq',
        options: [
          'Data Leakage (information from test set contaminates model training)',
          'Gradient explosion in scikit-learn',
          'Memory leak in the Python garbage collector',
          'Automatic underfitting of linear models'
        ],
        correctAnswer: 0,
        explanation: 'Fitting scalers on test data leaks future mean and variance statistics into training, leading to unrealistically optimistic validation metrics.'
      }
    ]
  },
  {
    id: 'ASM-COMP-106',
    title: 'Hands-On Python & SQL Live Compiler Challenge Assessment',
    assessmentType: 'compiler',
    domain: 'python',
    course: 'AIML',
    targetBatches: ['202601', '202101', '202102'],
    dateCreated: '2026-09-07',
    status: 'Active',
    durationMinutes: 60,
    description: 'Hands-on practical coding assessment featuring live interactive compilers for Python algorithms, SQL aggregations, and data transformation labs.',
    questions: [
      {
        id: 'comp-q01',
        title: 'Python Lab: Word Frequency Counter & Top-K Extraction',
        description: 'Write a Python function count_top_words(text, k) that cleans punctuation, tokenizes words, and returns the top k most frequent lowercase words as a sorted list of tuples (word, count).',
        type: 'compiler',
        domain: 'python',
        starterCode: `import re
from collections import Counter

def count_top_words(text: str, k: int = 3):
    # Clean text, convert to lowercase, count frequencies, and return top-k
    cleaned = re.findall(r'\\b[a-zA-Z]+\\b', text.lower())
    counts = Counter(cleaned)
    return counts.most_common(k)

# Example execution:
sample_text = "Data Science is amazing. Data analysis and data modeling drive science."
print(count_top_words(sample_text, 2))`,
        testCases: [
          { input: 'count_top_words("Python is fast. Python is dynamic. Python rules.", 1)', expected: "[('python', 3)]" },
          { input: 'count_top_words("Data data data code code bug", 2)', expected: "[('data', 3), ('code', 2)]" }
        ]
      },
      {
        id: 'comp-q02',
        title: 'SQL Lab: Cumulative Running Total & Departmental Ranking',
        description: 'Write a SQL query using window functions to calculate the cumulative running total salary for each employee within their respective department, ordered by hire_date.',
        type: 'compiler',
        domain: 'sql',
        starterCode: `-- SQL Window Function Query Lab
SELECT 
    emp_id,
    emp_name,
    dept_id,
    salary,
    hire_date,
    SUM(salary) OVER(
        PARTITION BY dept_id 
        ORDER BY hire_date 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total_salary,
    DENSE_RANK() OVER(
        PARTITION BY dept_id 
        ORDER BY salary DESC
    ) AS dept_salary_rank
FROM employees;`,
        testCases: [
          { input: 'Execute cumulative salary window query on employees table', expected: 'Running salary totals computed without grouping errors' }
        ]
      },
      {
        id: 'comp-q03',
        title: 'Power BI DAX Lab: Dynamic Year-over-Year Revenue Growth %',
        description: 'Write DAX measure definitions to compute Total Revenue, Prior Year Revenue, and Year-over-Year Percentage Growth.',
        type: 'compiler',
        domain: 'power_bi',
        starterCode: `// Measure 1: Total Revenue
Total Revenue = SUM(Sales[Revenue])

// Measure 2: Prior Year Revenue
PY Revenue = CALCULATE([Total Revenue], SAMEPERIODLASTYEAR('Calendar'[Date]))

// Measure 3: YoY Revenue Growth %
YoY Revenue % = 
DIVIDE(
    [Total Revenue] - [PY Revenue],
    [PY Revenue],
    0
)`,
        testCases: [
          { input: 'Evaluate YoY Revenue % on Sales sample model', expected: 'DAX measure parsed and compiled successfully' }
        ]
      },
      {
        id: 'comp-q04',
        title: 'SAS Lab: PROC MEANS Summary Statistics by Demographic Region',
        description: 'Write a SAS program utilizing the DATA step and PROC MEANS procedure to calculate Mean, Standard Deviation, Min, and Max sales grouped by geographic Region.',
        type: 'compiler',
        domain: 'sas',
        starterCode: `/* SAS Enterprise Data Procedure */
DATA work.regional_sales;
    SET sashelp.shoes;
    WHERE Sales > 25000;
RUN;

PROC MEANS DATA=work.regional_sales N MEAN STD MIN MAX MAXDEC=2;
    CLASS Region;
    VAR Sales Returns;
RUN;`,
        testCases: [
          { input: 'PROC MEANS executed on regional sales dataset', expected: 'Summary statistics table generated across regions' }
        ]
      },
      {
        id: 'comp-q05',
        title: 'Excel AI Lab: Dynamic Spill Array with XLOOKUP & AI Category Extraction',
        description: 'Construct a dynamic formula applying XLOOKUP with fallback handling alongside conditional classification.',
        type: 'compiler',
        domain: 'excel_ai',
        starterCode: `=XLOOKUP(A2, Products[SKU], Products[UnitCost], "SKU Not Found", 0, 1) * B2`,
        testCases: [
          { input: 'Lookup SKU-9942 with Qty 10', expected: '$4,250.00' }
        ]
      }
    ]
  }
];
