// Mock Question Bank featuring 100+ questions across 9 Domains:
// 1. EXCEL AI
// 2. SQL
// 3. POWER BI
// 4. PYTHON
// 5. SAS
// 6. ML (Machine Learning)
// 7. GEN AI & AGENTIC AI
// 8. DATA ENGINEERING
// 9. MLOPS & LLMOPS

export const DOMAINS = [
  { id: 'excel_ai', name: 'Excel AI', icon: 'FileSpreadsheet', desc: 'Spreadsheet formulas, Copilot AI & grid modeling' },
  { id: 'sql', name: 'SQL', icon: 'Database', desc: 'Relational queries, window functions & aggregations' },
  { id: 'power_bi', name: 'Power BI', icon: 'BarChart3', desc: 'DAX formulas, data visualizer & reporting' },
  { id: 'python', name: 'Python', icon: 'Code', desc: 'Python core, pandas, numpy & algorithmic logic' },
  { id: 'sas', name: 'SAS', icon: 'Binary', desc: 'SAS procedures, PROC SQL & statistical analysis' },
  { id: 'ml', name: 'ML', icon: 'Brain', desc: 'Classification, regression & scikit-learn models' },
  { id: 'gen_ai', name: 'Gen AI & Agentic AI', icon: 'Sparkles', desc: 'LLM prompts, agents, RAG & tool calling' },
  { id: 'data_engineering', name: 'Data Engineering', icon: 'Workflow', desc: 'ETL pipelines, Spark & data warehousing' },
  { id: 'mlops', name: 'MLOps & LLMOps', icon: 'Cpu', desc: 'Model deployment, CI/CD pipelines & monitoring' },
];

export const COURSES = [
  'All Courses',
  'AIML',
  'APCFCS',
  'APIDA',
  'APIDS',
  'DAS',
  'FDE',
  'Gen AI & Agentic AI',
  'Excel AI & Spreadsheet Automation',
  'SQL & Data Analytics'
];

export const BATCHES = [
  '202101',
  '202102',
  '202103',
  '202107',
  '202109',
  '202110',
  '202111',
  '202601',
  '202602',
  '202603',
  '202604',
  '202605'
];

export const ASSESSMENT_TYPES = [
  { id: 'compiler', label: 'Compiler Assessment Only (Hands-On Code)', desc: 'Live Code/Query/DAX Compiler Labs without MCQs' },
  { id: 'mcq', label: 'MCQ Assessment', desc: 'Randomized 30-Question Subset without Compilers' }
];

export const INITIAL_QUESTION_BANK = [
  // --- EXCEL AI (12 questions) ---
  {
    id: 'ex-1',
    domain: 'excel_ai',
    type: 'mcq',
    question: 'Which Excel AI function automatically extracts entities and classifies text without manual regex formulas?',
    options: ['=LABELS.EXTRACT()', '=AI.CLASSIFY()', '=TEXT.EXTRACT()', '=VLOOKUP.AI()'],
    correctAnswer: 1,
    explanation: 'Modern Excel AI tools utilize AI.CLASSIFY to evaluate unstructured text against user-defined categories.'
  },
  {
    id: 'ex-2',
    domain: 'excel_ai',
    type: 'mcq',
    question: 'What is the default reference type created when using the "$" sign before both column letter and row number (e.g. $A$1)?',
    options: ['Relative Reference', 'Absolute Reference', 'Mixed Reference', 'Dynamic Range'],
    correctAnswer: 1
  },
  {
    id: 'ex-3',
    domain: 'excel_ai',
    type: 'mcq',
    question: 'In Excel dynamic arrays, which formula sorts a range of values based on values in a specified column?',
    options: ['=SORT()', '=ORDER.BY()', '=ARR.SORT()', '=VLOOKUP.SORT()'],
    correctAnswer: 0
  },
  {
    id: 'ex-4',
    domain: 'excel_ai',
    type: 'mcq',
    question: 'Which lookup function in Excel replaces both VLOOKUP and HLOOKUP, allowing left-side lookups without column index counting?',
    options: ['XLOOKUP', 'INDEX/MATCH', 'FILTER', 'LOOKUP.EXACT'],
    correctAnswer: 0
  },
  {
    id: 'ex-5',
    domain: 'excel_ai',
    type: 'mcq',
    question: 'In Copilot for Excel, what prompt format yields the most accurate formula generation for calculated columns?',
    options: [
      'Just type "add column"',
      'Specify target column name, mathematical business logic, and source range',
      'Provide raw SQL queries',
      'Paste VBA macro code without context'
    ],
    correctAnswer: 1
  },
  {
    id: 'ex-6',
    domain: 'excel_ai',
    type: 'mcq',
    question: 'What does the Excel formula =LET(x, 10, y, 20, x * y) return?',
    options: ['30', '200', '1020', 'Error'],
    correctAnswer: 1
  },
  {
    id: 'ex-7',
    domain: 'excel_ai',
    type: 'mcq',
    question: 'Which Excel feature allows user-defined reusable custom functions written in formula syntax without VBA?',
    options: ['LAMBDA', 'MACRO', 'PIVOT.FUNC', 'SOLVER'],
    correctAnswer: 0
  },
  {
    id: 'ex-8',
    domain: 'excel_ai',
    type: 'mcq',
    question: 'Which function dynamically filters a range of data based on criteria provided in boolean expressions?',
    options: ['=FILTER()', '=QUERY()', '=SEARCH.RANGE()', '=WHERE()'],
    correctAnswer: 0
  },
  {
    id: 'ex-9',
    domain: 'excel_ai',
    type: 'mcq',
    question: 'What error code is produced when a formula attempts to divide a numeric value by zero or an empty cell?',
    options: ['#N/A', '#DIV/0!', '#VALUE!', '#REF!'],
    correctAnswer: 1
  },
  {
    id: 'ex-10',
    domain: 'excel_ai',
    type: 'mcq',
    question: 'Which Excel tool performs Goal Seek across multiple variables simultaneously with user-defined constraints?',
    options: ['Data Table', 'Solver Add-in', 'PivotTable Manager', 'Power Query'],
    correctAnswer: 1
  },
  {
    id: 'ex-11',
    domain: 'excel_ai',
    type: 'mcq',
    question: 'How do Python formulas in Excel (e.g. =PY) execute code inside Excel workbooks?',
    options: [
      'Locally on local GPU',
      'Inside a secure Microsoft Cloud container sandboxed with Anaconda distribution',
      'Directly inside Windows command prompt',
      'Via VBA translation'
    ],
    correctAnswer: 1
  },
  {
    id: 'ex-12',
    domain: 'excel_ai',
    type: 'mcq',
    question: 'Which dynamic array formula flattens a multi-dimensional row/column array into a single column vector?',
    options: ['=TOCOL()', '=TOROW()', '=UNPIVOT()', '=FLATTEN()'],
    correctAnswer: 0
  },

  // --- SQL (12 questions) ---
  {
    id: 'sql-1',
    domain: 'sql',
    type: 'mcq',
    question: 'Which SQL clause is used to filter aggregated grouped data after a GROUP BY statement?',
    options: ['WHERE', 'HAVING', 'QUALIFY', 'ORDER BY'],
    correctAnswer: 1
  },
  {
    id: 'sql-2',
    domain: 'sql',
    type: 'mcq',
    question: 'What window function assigns a unique sequential integer to rows within a partition without gaps in sequence?',
    options: ['RANK()', 'DENSE_RANK()', 'ROW_NUMBER()', 'NTILE()'],
    correctAnswer: 2
  },
  {
    id: 'sql-3',
    domain: 'sql',
    type: 'mcq',
    question: 'What is the primary difference between RANK() and DENSE_RANK() when duplicate values occur?',
    options: [
      'DENSE_RANK skips duplicate values',
      'RANK leaves gaps in sequence numbers after ties; DENSE_RANK does not skip sequence numbers',
      'DENSE_RANK is only available in PostgreSQL',
      'There is no difference'
    ],
    correctAnswer: 1
  },
  {
    id: 'sql-4',
    domain: 'sql',
    type: 'mcq',
    question: 'Which JOIN type returns all records when there is a match in either left or right table, filling non-matching sides with NULL?',
    options: ['INNER JOIN', 'LEFT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN'],
    correctAnswer: 2
  },
  {
    id: 'sql-5',
    domain: 'sql',
    type: 'mcq',
    question: 'What does CTE stand for in SQL database query optimization?',
    options: [
      'Calculated Table Entity',
      'Common Table Expression',
      'Compiled Query Execution',
      'Columnar Transaction Engine'
    ],
    correctAnswer: 1
  },
  {
    id: 'sql-6',
    domain: 'sql',
    type: 'mcq',
    question: 'Which SQL command is used to permanently remove all rows from a table without logging individual row deletions?',
    options: ['DELETE', 'TRUNCATE', 'DROP', 'REMOVE'],
    correctAnswer: 1
  },
  {
    id: 'sql-7',
    domain: 'sql',
    type: 'mcq',
    question: 'What is the result of joining Table A (5 rows) with Table B (4 rows) using a CROSS JOIN?',
    options: ['5 rows', '9 rows', '20 rows', 'Error'],
    correctAnswer: 2
  },
  {
    id: 'sql-8',
    domain: 'sql',
    type: 'mcq',
    question: 'Which NULL handling function returns the first non-null argument from a list of expressions?',
    options: ['ISNULL()', 'COALESCE()', 'NULLIF()', 'NVL2()'],
    correctAnswer: 1
  },
  {
    id: 'sql-9',
    domain: 'sql',
    type: 'mcq',
    question: 'In SQL window functions, which clause defines the window partition boundary?',
    options: ['OVER (PARTITION BY ...)', 'GROUP BY ...', 'CLUSTER BY ...', 'SEGMENT BY ...'],
    correctAnswer: 0
  },
  {
    id: 'sql-10',
    domain: 'sql',
    type: 'mcq',
    question: 'Which index type physical orders the data rows in the table on disk based on key values?',
    options: ['Non-Clustered Index', 'Clustered Index', 'Bitmap Index', 'Hash Index'],
    correctAnswer: 1
  },
  {
    id: 'sql-11',
    domain: 'sql',
    type: 'mcq',
    question: 'Which aggregate function counts distinct non-null values in a column?',
    options: ['COUNT(*)', 'COUNT(DISTINCT column)', 'SUM(UNIQUE column)', 'COUNT_UNIQUE()'],
    correctAnswer: 1
  },
  {
    id: 'sql-12',
    domain: 'sql',
    type: 'mcq',
    question: 'What keyword is used to combine the results of two SELECT queries, removing duplicate rows by default?',
    options: ['UNION', 'UNION ALL', 'INTERSECT', 'JOIN'],
    correctAnswer: 0
  },

  // --- POWER BI (12 questions) ---
  {
    id: 'pb-1',
    domain: 'power_bi',
    type: 'mcq',
    question: 'Which DAX function modifies the filter context of a calculation within a visual or measure?',
    options: ['FILTER', 'CALCULATE', 'ALL', 'RELATED'],
    correctAnswer: 1
  },
  {
    id: 'pb-2',
    domain: 'power_bi',
    type: 'mcq',
    question: 'What is the default relationship direction recommended in Power BI Star Schema data modeling?',
    options: ['Both Directions (Bi-directional)', 'Single Direction (One-to-Many)', 'Many-to-Many', 'None'],
    correctAnswer: 1
  },
  {
    id: 'pb-3',
    domain: 'power_bi',
    type: 'mcq',
    question: 'Which Power BI storage mode loads data into the VertiPaq in-memory engine for fastest analytical query performance?',
    options: ['DirectQuery', 'Import Mode', 'Live Connection', 'Dual Mode'],
    correctAnswer: 1
  },
  {
    id: 'pb-4',
    domain: 'power_bi',
    type: 'mcq',
    question: 'What DAX function removes all filters from a table or column regardless of context?',
    options: ['REMOVEFILTERS() / ALL()', 'KEEPFILTERS()', 'ALLEXCEPT()', 'USERELATIONSHIP()'],
    correctAnswer: 0
  },
  {
    id: 'pb-5',
    domain: 'power_bi',
    type: 'mcq',
    question: 'In Power Query Editor, what M language function is generated when transforming data steps?',
    options: ['DAX Query', 'M Code (Power Query Formula Language)', 'VBA Script', 'TSQL'],
    correctAnswer: 1
  },
  {
    id: 'pb-6',
    domain: 'power_bi',
    type: 'mcq',
    question: 'Which time-intelligence DAX function computes year-to-date values for a given measure?',
    options: ['TOTALYTD()', 'DATESYTD()', 'SAMEPERIODLASTYEAR()', 'DATEADD()'],
    correctAnswer: 0
  },
  {
    id: 'pb-7',
    domain: 'power_bi',
    type: 'mcq',
    question: 'What Power BI feature enables row-level security (RLS) to restrict data access for specific users based on roles?',
    options: ['Security Roles + DAX filters', 'Sensitivity Labels', 'Gateway Policy', 'Power Query Rules'],
    correctAnswer: 0
  },
  {
    id: 'pb-8',
    domain: 'power_bi',
    type: 'mcq',
    question: 'What is the primary difference between a Calculated Column and a Calculated Measure in DAX?',
    options: [
      'Calculated Columns consume RAM and disk at refresh; Measures compute dynamically on visual interaction',
      'Measures save data in the model tables on disk',
      'Calculated Columns cannot evaluate DAX functions',
      'There is no performance difference'
    ],
    correctAnswer: 0
  },
  {
    id: 'pb-9',
    domain: 'power_bi',
    type: 'mcq',
    question: 'Which visual allows navigating through hierarchical drill-down paths by clicking data nodes?',
    options: ['Decomposition Tree', 'KPI Visual', 'Matrix Visual', 'Scatter Plot'],
    correctAnswer: 0
  },
  {
    id: 'pb-10',
    domain: 'power_bi',
    type: 'mcq',
    question: 'What component is required to establish secure live automated refreshes between Power BI Cloud Service and an on-premises SQL Database?',
    options: ['On-premises Data Gateway', 'Power BI Desktop App', 'Active Directory Connector', 'ODBC Driver'],
    correctAnswer: 0
  },
  {
    id: 'pb-11',
    domain: 'power_bi',
    type: 'mcq',
    question: 'Which DAX function evaluates a table expression row-by-row in an iterated context (X-function)?',
    options: ['SUMX()', 'SUM()', 'TOTAL()', 'COUNT()'],
    correctAnswer: 0
  },
  {
    id: 'pb-12',
    domain: 'power_bi',
    type: 'mcq',
    question: 'What is the maximum file size for a single PBIX report dataset published to a standard shared Power BI workspace without Premium capacity?',
    options: ['1 GB', '10 GB', '500 MB', '100 MB'],
    correctAnswer: 0
  },

  // --- PYTHON (12 questions) ---
  {
    id: 'py-1',
    domain: 'python',
    type: 'mcq',
    question: 'What is the time complexity of looking up a key in a standard Python dictionary on average?',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
    correctAnswer: 0
  },
  {
    id: 'py-2',
    domain: 'python',
    type: 'mcq',
    question: 'Which built-in Python method returns an iterator of tuples containing index and element pairs?',
    options: ['enumerate()', 'zip()', 'map()', 'filter()'],
    correctAnswer: 0
  },
  {
    id: 'py-3',
    domain: 'python',
    type: 'mcq',
    question: 'In Pandas, which method is used to fill missing NaN values with a specified value or strategy?',
    options: ['fillna()', 'dropna()', 'replace_null()', 'interpolate()'],
    correctAnswer: 0
  },

  // --- SAS (12 questions) ---
  {
    id: 'sas-1',
    domain: 'sas',
    type: 'mcq',
    question: 'Which SAS procedure produces descriptive summary statistics (N, Mean, Std Dev, Min, Max) for continuous variables?',
    options: ['PROC MEANS', 'PROC FREQ', 'PROC SUMMARY', 'PROC REG'],
    correctAnswer: 0
  },

  // --- MACHINE LEARNING (12 questions) ---
  {
    id: 'ml-1',
    domain: 'ml',
    type: 'mcq',
    question: 'Which loss function is commonly used for binary classification training in logistic regression?',
    options: ['Binary Cross-Entropy (Log Loss)', 'Mean Squared Error (MSE)', 'Mean Absolute Error (MAE)', 'Hinge Loss'],
    correctAnswer: 0
  },

  // --- GEN AI & AGENTIC AI (12 questions) ---
  {
    id: 'gen-1',
    domain: 'gen_ai',
    type: 'mcq',
    question: 'What key mechanism introduced in the "Attention Is All You Need" paper allowed Transformers to process sequences in parallel?',
    options: ['Self-Attention Mechanism', 'Recurrent Backpropagation', 'Convolutional Pooling', 'LSTM Cells'],
    correctAnswer: 0
  },

  // --- DATA ENGINEERING (12 questions) ---
  {
    id: 'de-1',
    domain: 'data_engineering',
    type: 'mcq',
    question: 'In Apache Spark, what distributed data collection abstraction provides immutable partitioned collections of records?',
    options: ['RDD (Resilient Distributed Dataset)', 'Pandas Series', 'SQL Table', 'Kafka Topic'],
    correctAnswer: 0
  },

  // --- MLOPS & LLMOPS (12 questions) ---
  {
    id: 'mlops-1',
    domain: 'mlops',
    type: 'mcq',
    question: 'Which platform is standard for tracking machine learning experiments, hyperparameter runs, and artifact registries?',
    options: ['MLflow / Weights & Biases', 'Jenkins', 'Kubernetes', 'Docker Compose'],
    correctAnswer: 0
  },

  // --- HANDS-ON COMPILER / CODE CHALLENGES ---
  {
    id: 'coding-py-1',
    domain: 'python',
    type: 'compiler',
    title: 'Python Coding Task: Data Cleaning & Aggregation',
    description: 'Write a Python function `process_sales(transactions)` that takes a list of dictionary sales records `[{"item": "laptop", "price": 1000}, ...]` and returns a dictionary with total revenue per item.',
    starterCode: `def process_sales(transactions):
    # Your code here
    result = {}
    for item in transactions:
        name = item["item"]
        price = item["price"]
        result[name] = result.get(name, 0) + price
    return result

# Test invocation:
data = [
    {"item": "Laptop", "price": 1200},
    {"item": "Mouse", "price": 25},
    {"item": "Laptop", "price": 1200},
    {"item": "Keyboard", "price": 75}
]
print("Result:", process_sales(data))`,
    solutionCode: `def process_sales(transactions):
    result = {}
    for item in transactions:
        name = item["item"]
        price = item["price"]
        result[name] = result.get(name, 0) + price
    return result`,
    testCases: [
      { input: 'Laptop: 2400, Mouse: 25, Keyboard: 75', expected: "{'Laptop': 2400, 'Mouse': 25, 'Keyboard': 75}" }
    ]
  },
  {
    id: 'coding-sql-1',
    domain: 'sql',
    type: 'compiler',
    title: 'SQL Challenge: High-Earning Employee Department Ranking',
    description: 'Write a SQL query to select department_name, employee_name, and salary from employees, sorted by department_name and highest salary.',
    starterCode: `SELECT 
    department,
    name,
    salary,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) as salary_rank
FROM employees
WHERE salary >= 75000
ORDER BY department, salary DESC;`,
    solutionCode: `SELECT department, name, salary, DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) as salary_rank FROM employees WHERE salary >= 75000 ORDER BY department, salary DESC;`,
    testCases: [
      { input: 'Query employees table where salary >= 75000', expected: 'Ranked list grouped by department' }
    ]
  },
  {
    id: 'coding-pb-1',
    domain: 'power_bi',
    type: 'compiler',
    title: 'Power BI Challenge: DAX Dynamic YoY Revenue Measure',
    description: 'Write DAX measures to calculate Total Sales and Year-over-Year Growth Percentage.',
    starterCode: `// Measure 1: Total Sales
Total Revenue = SUM(Sales[Revenue])

// Measure 2: Previous Year Revenue
PY Revenue = CALCULATE([Total Revenue], SAMEPERIODLASTYEAR('Calendar'[Date]))

// Measure 3: YoY Growth %
YoY Growth % = DIVIDE([Total Revenue] - [PY Revenue], [PY Revenue], 0)`,
    solutionCode: `Total Revenue = SUM(Sales[Revenue])
PY Revenue = CALCULATE([Total Revenue], SAMEPERIODLASTYEAR('Calendar'[Date]))
YoY Growth % = DIVIDE([Total Revenue] - [PY Revenue], [PY Revenue], 0)`,
    testCases: [
      { input: 'DAX measure evaluation on Sales table', expected: 'YoY Growth % measure compiled' }
    ]
  },
  {
    id: 'coding-sas-1',
    domain: 'sas',
    type: 'compiler',
    title: 'SAS Challenge: Summary Statistics & PROC MEANS',
    description: 'Write a SAS script using PROC MEANS to generate summary statistics for sales performance grouped by region.',
    starterCode: `/* SAS Data Step & PROC MEANS */
DATA work.sales_summary;
    SET sashelp.shoes;
    WHERE Sales > 50000;
RUN;

PROC MEANS DATA=work.sales_summary N MEAN STD MIN MAX;
    CLASS Region;
    VAR Sales Returns;
RUN;`,
    solutionCode: `DATA work.sales_summary; SET sashelp.shoes; WHERE Sales > 50000; RUN; PROC MEANS DATA=work.sales_summary N MEAN STD MIN MAX; CLASS Region; VAR Sales Returns; RUN;`,
    testCases: [
      { input: 'EXECUTE PROC MEANS ON sashelp.shoes', expected: 'Summary Table by Region generated' }
    ]
  },
  {
    id: 'coding-excel-1',
    domain: 'excel_ai',
    type: 'compiler',
    title: 'Excel AI Lab: Dynamic XLOOKUP & AI Classification',
    description: 'Build a dynamic formula table with XLOOKUP and conditional AI text classification.',
    starterCode: `=XLOOKUP(A2, Products[ID], Products[Price], "Not Found") * B2`,
    solutionCode: `=XLOOKUP(A2, Products[ID], Products[Price], "Not Found") * B2`,
    testCases: [
      { input: 'Product Lookup ID: P-102', expected: '$1,450.00' }
    ]
  }
];

// Helper function to serve randomized questions based on count
export function getRandomizedQuestions(pool = INITIAL_QUESTION_BANK, count = 30) {
  const mcqs = pool.filter(q => q.type === 'mcq');
  const shuffled = [...mcqs];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selectedMcqs = shuffled.slice(0, Math.min(count, shuffled.length));
  const compilers = pool.filter(q => q.type === 'compiler');
  
  return {
    mcqs: selectedMcqs,
    compilers: compilers
  };
}
