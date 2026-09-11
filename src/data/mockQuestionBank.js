export const DOMAINS = [
  { id: 'excel_ai', name: 'Excel AI', icon: 'FileSpreadsheet', desc: 'Spreadsheet formulas, Copilot AI & grid modeling' },
  { id: 'sql', name: 'SQL', icon: 'Database', desc: 'Relational queries, window functions & aggregations' },
  { id: 'power_bi', name: 'Power BI', icon: 'BarChart3', desc: 'DAX formulas, data visualizer & reporting' },
  { id: 'python', name: 'Python', icon: 'Code', desc: 'Python core, pandas, numpy & algorithmic logic' },
  { id: 'sas', name: 'SAS', icon: 'Binary', desc: 'SAS procedures, PROC SQL & statistical analysis' },
  { id: 'ml', name: 'ML', icon: 'Brain', desc: 'Classification, regression & scikit-learn models' },
  { id: 'gen_ai', name: 'Gen AI & Agentic AI', icon: 'Sparkles', desc: 'LLM prompts, agents, RAG & tool calling' },
  { id: 'data_engineering', name: 'Data Engineering', icon: 'Workflow', desc: 'ETL pipelines, Spark & data warehousing' },
  { id: 'mlops', name: 'MLOps & LLMOps', icon: 'Cpu', desc: 'Model deployment, CI/CD pipelines & monitoring' }
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
  { id: 'mcq', label: 'MCQ Assessment', desc: 'Randomized question subset without compilers' }
];

export const INITIAL_QUESTION_BANK = [];

export function getRandomizedQuestions(pool = INITIAL_QUESTION_BANK, count = 30) {
  const mcqs = pool.filter(q => q.type === 'mcq');
  const shuffled = [...mcqs];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return {
    mcqs: shuffled.slice(0, Math.min(count, shuffled.length)),
    compilers: pool.filter(q => q.type === 'compiler')
  };
}
