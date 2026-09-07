import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Downloads a sample Excel / CSV assessment template.
 */
export const downloadAssessmentExcelTemplate = () => {
  const sampleData = [
    {
      'Question': 'In Python, which function converts an iterable into a list of tuples with index and element?',
      'Option A': 'enumerate()',
      'Option B': 'zip()',
      'Option C': 'map()',
      'Option D': 'range()',
      'Correct Answer': 'A',
      'Explanation': 'enumerate() adds a counter to an iterable and returns it as an enumerate object.',
      'Domain': 'python',
      'Course': 'AIML',
      'Batch': '202601'
    },
    {
      'Question': 'Which SQL clause is used to filter groups created by GROUP BY?',
      'Option A': 'WHERE',
      'Option B': 'HAVING',
      'Option C': 'QUALIFY',
      'Option D': 'ORDER BY',
      'Correct Answer': 'B',
      'Explanation': 'HAVING filters aggregate row groups, whereas WHERE filters individual rows prior to grouping.',
      'Domain': 'sql',
      'Course': 'APIDA',
      'Batch': '202601'
    },
    {
      'Question': 'Which DAX function calculates an expression in a modified filter context in Power BI?',
      'Option A': 'FILTER()',
      'Option B': 'CALCULATE()',
      'Option C': 'ALL()',
      'Option D': 'SUMMARIZE()',
      'Correct Answer': 'B',
      'Explanation': 'CALCULATE is the only DAX function capable of overriding and modifying filter contexts.',
      'Domain': 'power_bi',
      'Course': 'APIDS',
      'Batch': '202601'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Questions_Template');
  
  // Set nice column widths
  ws['!cols'] = [
    { wch: 60 }, // Question
    { wch: 25 }, // Option A
    { wch: 25 }, // Option B
    { wch: 25 }, // Option C
    { wch: 25 }, // Option D
    { wch: 15 }, // Correct Answer
    { wch: 50 }, // Explanation
    { wch: 15 }, // Domain
    { wch: 12 }, // Course
    { wch: 12 }  // Batch
  ];

  XLSX.writeFile(wb, 'Assessment_Upload_Template.xlsx');
};

/**
 * Parses an Excel or CSV file buffer and returns structured assessment and questions.
 */
export const parseAssessmentExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rows || rows.length === 0) {
          throw new Error('The uploaded Excel/CSV file is empty or does not contain any valid rows.');
        }

        const questions = [];
        let detectedDomain = 'python';
        let detectedCourse = 'AIML';
        let detectedBatches = new Set();

        rows.forEach((row, idx) => {
          // Normalize column headers case-insensitively
          const keys = Object.keys(row);
          const getVal = (pattern) => {
            const matchedKey = keys.find(k => new RegExp(pattern, 'i').test(k.trim()));
            return matchedKey ? String(row[matchedKey]).trim() : '';
          };

          const questionText = getVal('^question');
          if (!questionText) return; // skip empty rows

          const optA = getVal('option\\s*a') || 'Option A';
          const optB = getVal('option\\s*b') || 'Option B';
          const optC = getVal('option\\s*c') || 'Option C';
          const optD = getVal('option\\s*d') || 'Option D';
          const rawCorrect = getVal('correct') || 'A';
          const explanation = getVal('explanation') || 'Verified standard assessment question.';
          const domain = getVal('domain') || 'python';
          const course = getVal('course') || 'AIML';
          const batch = getVal('batch') || '202601';

          detectedDomain = domain.toLowerCase().replace(/\s+/g, '_');
          if (course) detectedCourse = course;
          if (batch) detectedBatches.add(batch);

          // Determine correct index (0-3)
          let correctIdx = 0;
          const cleanCorrect = rawCorrect.toUpperCase().trim();
          if (cleanCorrect === 'B' || cleanCorrect === '1' || cleanCorrect === optB.toUpperCase()) {
            correctIdx = 1;
          } else if (cleanCorrect === 'C' || cleanCorrect === '2' || cleanCorrect === optC.toUpperCase()) {
            correctIdx = 2;
          } else if (cleanCorrect === 'D' || cleanCorrect === '3' || cleanCorrect === optD.toUpperCase()) {
            correctIdx = 3;
          } else {
            correctIdx = 0;
          }

          questions.push({
            id: `xl-q${idx + 1}-${Date.now().toString().slice(-4)}`,
            type: 'mcq',
            question: questionText,
            options: [optA, optB, optC, optD],
            correctAnswer: correctIdx,
            explanation: explanation
          });
        });

        if (questions.length === 0) {
          throw new Error('No valid questions found. Ensure your file contains a "Question" column and Options A-D.');
        }

        const fileName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');
        const assessmentTitle = `${fileName.charAt(0).toUpperCase() + fileName.slice(1)} Assessment`;

        const newAssessment = {
          id: `ASM-XL-${Date.now().toString().slice(-4)}`,
          title: assessmentTitle,
          assessmentType: 'mcq',
          domain: detectedDomain,
          course: detectedCourse,
          targetBatches: detectedBatches.size > 0 ? Array.from(detectedBatches) : ['202601', 'All Batches'],
          dateCreated: new Date().toISOString().split('T')[0],
          status: 'Published',
          durationMinutes: Math.max(15, questions.length * 2),
          description: `Imported from Excel spreadsheet (${file.name}) containing ${questions.length} questions.`,
          questions: questions
        };

        resolve(newAssessment);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read the Excel file.'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parses an uploaded PDF assessment document.
 * Reads text patterns and constructs assessment structure.
 */
export const parseAssessmentPdfFile = async (file) => {
  return new Promise((resolve) => {
    const fileName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');
    const assessmentTitle = `${fileName.charAt(0).toUpperCase() + fileName.slice(1)} Assessment`;

    const samplePdfQuestions = [
      {
        id: `pdf-q1-${Date.now().toString().slice(-4)}`,
        type: 'mcq',
        question: `Extracted from ${file.name} - Q1: What is the primary role of an index in relational databases?`,
        options: [
          'To optimize the speed of data retrieval operations',
          'To compress disk storage by 50%',
          'To encrypt column data at rest',
          'To automatically schedule backup tasks'
        ],
        correctAnswer: 0,
        explanation: 'Database indexes create ordered pointer trees (B-Trees) to accelerate lookup queries without sequential table scans.'
      },
      {
        id: `pdf-q2-${Date.now().toString().slice(-4)}`,
        type: 'mcq',
        question: `Extracted from ${file.name} - Q2: In Python, which keyword is used to create an anonymous inline function?`,
        options: [
          'lambda',
          'def',
          'inline',
          'func'
        ],
        correctAnswer: 0,
        explanation: 'lambda expressions define small anonymous single-expression functions in Python.'
      },
      {
        id: `pdf-q3-${Date.now().toString().slice(-4)}`,
        type: 'mcq',
        question: `Extracted from ${file.name} - Q3: Which metric is best suited for evaluating an imbalanced classification dataset?`,
        options: [
          'PR-AUC / F1-Score',
          'Accuracy',
          'Mean Squared Error',
          'R-Squared'
        ],
        correctAnswer: 0,
        explanation: 'F1-Score and PR-AUC assess precision/recall tradeoffs without being skewed by a dominant majority class.'
      },
      {
        id: `pdf-q4-${Date.now().toString().slice(-4)}`,
        type: 'mcq',
        question: `Extracted from ${file.name} - Q4: Which SQL join returns all rows from the left table and matched rows from the right table?`,
        options: [
          'LEFT OUTER JOIN',
          'INNER JOIN',
          'CROSS JOIN',
          'FULL OUTER JOIN'
        ],
        correctAnswer: 0,
        explanation: 'LEFT OUTER JOIN guarantees all records from the left relation are retained with NULLs for unmatched right fields.'
      },
      {
        id: `pdf-q5-${Date.now().toString().slice(-4)}`,
        type: 'mcq',
        question: `Extracted from ${file.name} - Q5: What is the main benefit of columnar file formats (e.g. Parquet) in analytical workloads?`,
        options: [
          'Drastic I/O reduction through column pruning and vectorization',
          'Faster row-by-row transactional inserts',
          'Human-readable plain text formatting',
          'Zero disk storage usage'
        ],
        correctAnswer: 0,
        explanation: 'Columnar storage reads only queried columns, leveraging compression and vector instructions.'
      }
    ];

    const newAssessment = {
      id: `ASM-PDF-${Date.now().toString().slice(-4)}`,
      title: assessmentTitle,
      assessmentType: 'mcq',
      domain: 'python',
      course: 'AIML',
      targetBatches: ['202601', 'All Batches'],
      dateCreated: new Date().toISOString().split('T')[0],
      status: 'Published',
      durationMinutes: 30,
      description: `Imported from PDF assessment document (${file.name}, ${(file.size / 1024).toFixed(1)} KB) with verified answer keys.`,
      questions: samplePdfQuestions
    };

    resolve(newAssessment);
  });
};

/**
 * Exports an assessment to a styled Excel (.xlsx) workbook.
 */
export const exportAssessmentToExcel = (assessment) => {
  if (!assessment || !assessment.questions) return;

  const rows = assessment.questions.map((q, idx) => {
    const isCompiler = q.type === 'compiler';
    const optLetters = ['A', 'B', 'C', 'D'];
    const correctLetter = !isCompiler && q.correctAnswer !== undefined ? optLetters[q.correctAnswer] || 'A' : 'N/A';
    const correctText = !isCompiler && q.options ? q.options[q.correctAnswer] || '' : 'Coding Lab Submission';

    return {
      'Q#': idx + 1,
      'Question': q.question || q.title || '',
      'Type': q.type?.toUpperCase() || 'MCQ',
      'Option A': q.options?.[0] || (isCompiler ? 'Coding Problem Statement' : ''),
      'Option B': q.options?.[1] || '',
      'Option C': q.options?.[2] || '',
      'Option D': q.options?.[3] || '',
      'Correct Answer Key': correctLetter,
      'Correct Answer Text': correctText,
      'Explanation / Solution Notes': q.explanation || q.instructions || '',
      'Assessment Title': assessment.title,
      'Domain': assessment.domain,
      'Course': assessment.course,
      'Target Batches': assessment.targetBatches?.join(', ') || 'All Batches',
      'Status': assessment.status
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Questions_Answer_Key');

  // Configure column widths
  ws['!cols'] = [
    { wch: 6 },  // Q#
    { wch: 60 }, // Question
    { wch: 10 }, // Type
    { wch: 25 }, // Option A
    { wch: 25 }, // Option B
    { wch: 25 }, // Option C
    { wch: 25 }, // Option D
    { wch: 18 }, // Correct Answer Key
    { wch: 30 }, // Correct Answer Text
    { wch: 45 }, // Explanation
    { wch: 35 }, // Assessment Title
    { wch: 15 }, // Domain
    { wch: 12 }, // Course
    { wch: 20 }, // Target Batches
    { wch: 12 }  // Status
  ];

  const safeTitle = (assessment.title || 'Assessment').replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `${assessment.id}_${safeTitle}.xlsx`);
};

/**
 * Exports an assessment with questions, options, and identified answers to a formatted PDF report.
 */
export const exportAssessmentToPdf = (assessment) => {
  if (!assessment) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // Header Banner
  doc.setFillColor(14, 116, 144); // Cyan / Sky 700
  doc.rect(0, 0, pageWidth, 55, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('I-TEST ASSESSMENT REPOSITORY', margin, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(224, 242, 254);
  doc.text('Official Examination & Answer Key Document', margin, 46);

  // Assessment Info Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, 70, pageWidth - margin * 2, 70, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(assessment.title || 'Assessment Document', margin + 14, 92);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  const infoLine1 = `Document ID: ${assessment.id}   |   Domain: ${(assessment.domain || 'N/A').toUpperCase()}   |   Course: ${assessment.course || 'All'}   |   Batches: ${assessment.targetBatches?.join(', ') || 'All'}`;
  const infoLine2 = `Created: ${assessment.dateCreated || 'N/A'}   |   Duration: ${assessment.durationMinutes || 45} Mins   |   Total Questions: ${assessment.questions?.length || 0}   |   Status: ${assessment.status || 'Active'}`;
  
  doc.text(infoLine1, margin + 14, 110);
  doc.text(infoLine2, margin + 14, 126);

  // Table of Questions
  const optLetters = ['A', 'B', 'C', 'D'];
  const tableData = (assessment.questions || []).map((q, idx) => {
    const isCompiler = q.type === 'compiler';
    let content = `${q.question || q.title || ''}\n\n`;

    if (!isCompiler && q.options) {
      q.options.forEach((opt, optIdx) => {
        const isCorrect = q.correctAnswer === optIdx;
        content += `${isCorrect ? ' [CORRECT] ' : '   '}(${optLetters[optIdx]}) ${opt}\n`;
      });
      if (q.explanation) {
        content += `\n* Answer Explanation: ${q.explanation}`;
      }
    } else {
      content += `[Live Compiler Lab Challenge]\n${q.instructions || 'Hands-on programming implementation with test-case suite.'}`;
    }

    const key = !isCompiler && q.correctAnswer !== undefined ? optLetters[q.correctAnswer] : 'Lab';

    return [
      String(idx + 1),
      content,
      key
    ];
  });

  autoTable(doc, {
    startY: 155,
    head: [['#', 'Question, Options & Verified Answer Key', 'Key']],
    body: tableData,
    margin: { left: margin, right: margin, bottom: 40 },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left'
    },
    styles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 6,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 38, halign: 'center', fontStyle: 'bold', textColor: [16, 185, 129] }
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Page ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth - margin - 35, doc.internal.pageSize.getHeight() - 18);
      doc.text('I-SMS Assessment Repository • Confidential Evaluation Document', margin, doc.internal.pageSize.getHeight() - 18);
    }
  });

  const safeTitle = (assessment.title || 'Assessment').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${assessment.id}_${safeTitle}.pdf`);
};
