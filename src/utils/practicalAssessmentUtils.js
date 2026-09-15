const SECTION_KEYS = [
  'TITLE',
  'QUESTION',
  'DATASET_INFO',
  'MODEL_INFO',
  'SETUP_INFO',
  'STARTER_CODE',
  'EXPECTED_OUTPUT',
  'EXPECTED_ANSWER'
];

export const PRACTICAL_APP_CONFIG = {
  sql: {
    label: 'SQL',
    setupLabel: 'SQL Database File',
    setupAccept: '.sql',
    questionAccept: '.docx,.doc,.txt,.md',
    setupSampleFileName: 'sql_database_setup_sample.sql',
    questionSampleFileName: 'sql_question_answer_sample.doc',
    questionInfoLabel: 'Database / Table Information',
    defaultTitle: 'SQL Department Salary Ranking',
    setupSampleContent: `CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  department VARCHAR(100),
  salary INT
);

INSERT INTO employees (id, name, department, salary) VALUES
(101, 'Sarah Jenkins', 'Engineering', 115000),
(104, 'David Chen', 'Engineering', 98000),
(108, 'Elena Rostova', 'Data Science', 125000),
(112, 'Marcus Vance', 'Data Science', 92000),
(115, 'Aria Montgomery', 'Product', 105000);`,
    questionSample: {
      TITLE: 'SQL Department Salary Ranking',
      QUESTION: 'Write a SELECT query to return id, name, department, salary, and salary_rank for every employee. Rank employees from highest salary to lowest salary within each department.',
      DATASET_INFO: 'The database is already loaded. Available table: employees(id, name, department, salary). Do not create or insert tables. Write only the final SELECT query.',
      STARTER_CODE: `SELECT
  id,
  name,
  department,
  salary
FROM employees;`,
      EXPECTED_OUTPUT: `id, name, department, salary, salary_rank ordered by department and salary_rank.`,
      EXPECTED_ANSWER: `SELECT
  id,
  name,
  department,
  salary,
  DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS salary_rank
FROM employees
ORDER BY department, salary_rank;`
    }
  },
  python: {
    label: 'Python',
    setupLabel: 'Python Data / Starter File',
    setupAccept: '.py,.csv,.json,.txt',
    questionAccept: '.docx,.doc,.txt,.md',
    setupSampleFileName: 'python_dataset_sample.py',
    questionSampleFileName: 'python_question_answer_sample.doc',
    questionInfoLabel: 'Input / Data Information',
    defaultTitle: 'Python Sales Revenue Aggregator',
    setupSampleContent: `transactions = [
    {"item": "Laptop", "price": 1200},
    {"item": "Mouse", "price": 25},
    {"item": "Laptop", "price": 1200},
    {"item": "Laptop", "price": -300},
    {"item": "Keyboard", "price": 75},
]`,
    questionSample: {
      TITLE: 'Python Sales Revenue Aggregator',
      QUESTION: 'Complete process_sales(transactions) so it returns total positive revenue grouped by item name. Ignore transactions where price is 0 or negative.',
      DATASET_INFO: 'Input is a list of dictionaries with item and price keys. Example data is already available in the Python environment.',
      STARTER_CODE: `def process_sales(transactions):
    result = {}
    # Write your solution here
    return result`,
      EXPECTED_OUTPUT: `{'Laptop': 2400, 'Mouse': 25, 'Keyboard': 75}`,
      EXPECTED_ANSWER: `def process_sales(transactions):
    result = {}
    for row in transactions:
        if row["price"] > 0:
            result[row["item"]] = result.get(row["item"], 0) + row["price"]
    return result`
    }
  },
  sas: {
    label: 'SAS',
    setupLabel: 'SAS Dataset / Setup File',
    setupAccept: '.sas,.csv,.txt',
    questionAccept: '.docx,.doc,.txt,.md',
    setupSampleFileName: 'sas_dataset_setup_sample.sas',
    questionSampleFileName: 'sas_question_answer_sample.doc',
    questionInfoLabel: 'SAS Dataset Information',
    defaultTitle: 'SAS Regional Sales Summary',
    setupSampleContent: `DATA WORK.SALES_SUMMARY;
  INPUT Region $ Sales Returns;
  DATALINES;
Africa 51200 1020
Africa 184500 6800
Asia 52800 1400
Asia 240000 9500
;
RUN;`,
    questionSample: {
      TITLE: 'SAS Regional Sales Summary',
      QUESTION: 'Write a PROC MEANS program for WORK.SALES_SUMMARY to calculate MEAN, STD, MIN, and MAX for Sales and Returns grouped by Region.',
      DATASET_INFO: 'Dataset WORK.SALES_SUMMARY is already available with variables Region, Sales, and Returns.',
      STARTER_CODE: `PROC MEANS DATA=WORK.SALES_SUMMARY;
RUN;`,
      EXPECTED_OUTPUT: 'A grouped PROC MEANS summary showing mean, standard deviation, minimum, and maximum for Sales and Returns by Region.',
      EXPECTED_ANSWER: `PROC MEANS DATA=WORK.SALES_SUMMARY MEAN STD MIN MAX;
  CLASS Region;
  VAR Sales Returns;
RUN;`
    }
  },
  power_bi: {
    label: 'Power BI',
    setupLabel: 'Power BI Data / Model File',
    setupAccept: '.dax,.csv,.txt',
    questionAccept: '.docx,.doc,.txt,.md',
    setupSampleFileName: 'power_bi_model_context_sample.dax',
    questionSampleFileName: 'power_bi_question_answer_sample.doc',
    questionInfoLabel: 'Power BI Model Information',
    defaultTitle: 'Power BI YoY Growth Measure',
    setupSampleContent: `Total Revenue =
SUM(Sales[Revenue])

PY Revenue =
CALCULATE(
    [Total Revenue],
    SAMEPERIODLASTYEAR('Date'[Date])
)`,
    questionSample: {
      TITLE: 'Power BI YoY Growth Measure',
      QUESTION: 'Create a DAX measure named YoY Growth % that calculates year-over-year growth using [Total Revenue] and [PY Revenue].',
      MODEL_INFO: 'Available measures: [Total Revenue], [PY Revenue]. Use DIVIDE() so divide-by-zero cases return 0.',
      STARTER_CODE: `YoY Growth % =`,
      EXPECTED_OUTPUT: 'A percentage measure suitable for quarterly revenue visuals.',
      EXPECTED_ANSWER: `YoY Growth % =
DIVIDE(
    [Total Revenue] - [PY Revenue],
    [PY Revenue],
    0
)`
    }
  }
};

export function getPracticalConfig(appId) {
  return PRACTICAL_APP_CONFIG[appId] || PRACTICAL_APP_CONFIG.python;
}

export async function parsePracticalQuestionFile(file) {
  const rawText = file.name.toLowerCase().endsWith('.docx')
    ? await extractDocxText(file)
    : await file.text();
  const text = htmlToPlainText(rawText);
  const sections = extractTaggedSections(text);
  validatePracticalSections(sections);
  return sections;
}

export async function parsePracticalSetupFile(file) {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.xlsx')) {
    return '[Binary spreadsheet file uploaded. Preview is not available in this setup panel.]';
  }
  return file.text();
}

export function buildPracticalLab({ appId, questionSections, setupFileName, setupContent }) {
  const config = getPracticalConfig(appId);
  const info = questionSections.DATASET_INFO || questionSections.MODEL_INFO || questionSections.SETUP_INFO || '';
  const title = questionSections.TITLE || config.defaultTitle;
  return {
    id: `coding-${appId}-${Date.now()}`,
    domain: appId,
    type: 'compiler',
    title,
    description: questionSections.QUESTION,
    datasetInfo: info,
    starterCode: questionSections.STARTER_CODE || '',
    expectedOutput: questionSections.EXPECTED_OUTPUT || '',
    solutionCode: questionSections.EXPECTED_ANSWER,
    setupFileName,
    setupContent
  };
}

export function buildQuestionDocContent(appId) {
  const config = getPracticalConfig(appId);
  const sections = config.questionSample;
  const body = SECTION_KEYS
    .filter(key => sections[key])
    .map(key => `<p><strong>[${key}]</strong></p><pre>${escapeHtml(sections[key])}</pre>`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(sections.TITLE || config.defaultTitle)}</title></head><body>${body}</body></html>`;
}

function extractTaggedSections(text) {
  const sections = {};
  const pattern = new RegExp(`\\[(${SECTION_KEYS.join('|')})\\]`, 'gi');
  const matches = Array.from(text.matchAll(pattern));
  matches.forEach((match, index) => {
    const key = match[1].toUpperCase();
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
    sections[key] = text.slice(start, end).trim();
  });
  return sections;
}

function validatePracticalSections(sections) {
  if (!sections.QUESTION) {
    throw new Error('Question section missing. Please include [QUESTION] in the Word document.');
  }
  if (!sections.EXPECTED_ANSWER) {
    throw new Error('Expected answer section missing. Please include [EXPECTED_ANSWER] in the Word document.');
  }
}

function htmlToPlainText(input) {
  if (!/<[a-z][\s\S]*>/i.test(input)) return input;
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');
  return doc.body?.innerText || input.replace(/<[^>]*>/g, ' ');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function extractDocxText(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const entry = findZipEntry(bytes, 'word/document.xml');
  if (!entry) {
    throw new Error('Could not read question document. The .docx file does not contain word/document.xml.');
  }
  const xmlBytes = await readZipEntry(bytes, entry);
  const xml = new TextDecoder('utf-8').decode(xmlBytes);
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('Could not read question document. The Word XML is invalid.');
  }
  const paragraphs = Array.from(doc.getElementsByTagName('w:p')).map(paragraph => (
    Array.from(paragraph.getElementsByTagName('w:t')).map(node => node.textContent || '').join('')
  ));
  return paragraphs.join('\n');
}

function findZipEntry(bytes, targetName) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findEndOfCentralDirectory(view);
  if (eocdOffset < 0) return null;
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const entries = view.getUint16(eocdOffset + 10, true);
  let offset = centralDirectoryOffset;
  const decoder = new TextDecoder('utf-8');
  for (let i = 0; i < entries; i += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) return null;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + fileNameLength));
    if (name === targetName) {
      return { method, compressedSize, uncompressedSize, localHeaderOffset };
    }
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return null;
}

function findEndOfCentralDirectory(view) {
  for (let offset = view.byteLength - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset;
  }
  return -1;
}

async function readZipEntry(bytes, entry) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const offset = entry.localHeaderOffset;
  if (view.getUint32(offset, true) !== 0x04034b50) {
    throw new Error('Could not read question document. The .docx zip entry is invalid.');
  }
  const fileNameLength = view.getUint16(offset + 26, true);
  const extraLength = view.getUint16(offset + 28, true);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressed = bytes.slice(dataStart, dataStart + entry.compressedSize);
  if (entry.method === 0) return compressed;
  if (entry.method !== 8 || typeof DecompressionStream === 'undefined') {
    throw new Error('Could not read compressed .docx content in this browser.');
  }
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer()).slice(0, entry.uncompressedSize || undefined);
}
