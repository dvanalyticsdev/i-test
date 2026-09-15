import React, { useEffect, useState } from 'react';
import { useExam } from '../../context/ExamContext';
import { downloadAssessmentExcelTemplate, parseAssessmentExcelFile } from '../../utils/assessmentDocumentUtils';
import {
  buildPracticalLab,
  buildQuestionDocContent,
  getPracticalConfig,
  parsePracticalQuestionFile,
  parsePracticalSetupFile
} from '../../utils/practicalAssessmentUtils';
import { Plus, Search, ChevronDown, FileText, Code2, Check, Calendar, Clock, X, Filter, Upload, ExternalLink, Trash2, Download } from 'lucide-react';

const APPLICATIONS = [
  { id: 'excel_ai', name: 'EXCEL AI' },
  { id: 'sql', name: 'SQL' },
  { id: 'power_bi', name: 'POWER BI' },
  { id: 'python', name: 'PYTHON' },
  { id: 'sas', name: 'SAS' },
  { id: 'ml', name: 'ML' },
  { id: 'gen_ai', name: 'GEN AI & AGENTIC AI' },
  { id: 'data_engineering', name: 'DATA ENGINEERING' },
  { id: 'mlops', name: 'MLOPS & LLMOPS' }
];

const SUPPORTED_COMPILER_APPLICATION_IDS = ['python', 'sql', 'sas', 'power_bi'];

// Helper to calculate 3-Stage Test Lifecycle State
export const getTestStage = (test) => {
  if (!test) return 'Scheduled';
  if (!test.scheduledStartIso || !test.scheduledEndIso) {
    if (test.status === 'Closed') return 'Closed';
    return 'Live';
  }
  const now = new Date().getTime();
  const start = new Date(test.scheduledStartIso).getTime();
  const end = new Date(test.scheduledEndIso).getTime();

  if (now < start) return 'Scheduled';
  if (now > end) return 'Closed';
  return 'Live';
};

export const TestScheduler = () => {
  const { scheduledTests, addScheduledTest, deleteScheduledTest, assessments, addAssessment } = useExam();
  const [showModal, setShowModal] = useState(false);

  // Top Filter States
  const [topApplication, setTopApplication] = useState('All Applications');
  const [topCourses, setTopCourses] = useState(['All Courses']);
  const [topBatches, setTopBatches] = useState(['All Batches']);
  const [filterStatus, setFilterStatus] = useState('All Statuses'); // 'All Statuses' | 'Scheduled' | 'Live' | 'Closed'
  const [filterDate, setFilterDate] = useState('');

  // Top Filter Dropdown Toggles
  const [topAppDropdownOpen, setTopAppDropdownOpen] = useState(false);
  const [topCourseDropdownOpen, setTopCourseDropdownOpen] = useState(false);
  const [topBatchDropdownOpen, setTopBatchDropdownOpen] = useState(false);
  const [topBatchSearchQuery, setTopBatchSearchQuery] = useState('');

  // Modal Form States
  const [testTitle, setTestTitle] = useState('');
  const [students, setStudents] = useState([]);
  const [assessmentType, setAssessmentType] = useState('mcq'); // 'mcq' | 'practical' | 'hybrid'
  const [mcqFileId, setMcqFileId] = useState('');
  const [practicalFileId, setPracticalFileId] = useState('');

  // File Upload vs Select States
  const [mcqSourceMode, setMcqSourceMode] = useState('upload'); // 'upload' | 'select'
  const [practicalSourceMode, setPracticalSourceMode] = useState('upload'); // 'upload' | 'select'
  const [mcqUploadedFile, setMcqUploadedFile] = useState(null);
  const [mcqParsedAssessment, setMcqParsedAssessment] = useState(null);
  const [practicalSetupFile, setPracticalSetupFile] = useState(null);
  const [practicalQuestionFile, setPracticalQuestionFile] = useState(null);
  const [practicalQuestionSections, setPracticalQuestionSections] = useState(null);
  const [practicalParsedAssessment, setPracticalParsedAssessment] = useState(null);
  
  // Date & Time Scheduling States
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [duration, setDuration] = useState(45);

  // Application is single-select; course and batch can still target multiple groups.
  const [selectedApplication, setSelectedApplication] = useState('python');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);

  // Modal Dropdown Toggle States
  const [appDropdownOpen, setAppDropdownOpen] = useState(false);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const [modalBatchSearch, setModalBatchSearch] = useState('');

  const courseOptions = buildUniqueOptions(students, ['courses', 'course']);
  const batchOptions = buildUniqueOptions(students, ['batches', 'batch']);
  const topFilteredBatches = batchOptions.filter(b => b.toLowerCase().includes(topBatchSearchQuery.toLowerCase()));
  const modalFilteredBatches = batchOptions.filter(b => b.toLowerCase().includes(modalBatchSearch.toLowerCase().trim()));
  const isCompilerAssessment = assessmentType === 'practical' || assessmentType === 'hybrid';
  const availableApplications = isCompilerAssessment
    ? APPLICATIONS.filter(app => SUPPORTED_COMPILER_APPLICATION_IDS.includes(app.id))
    : APPLICATIONS;
  const practicalConfig = getPracticalConfig(selectedApplication);

  useEffect(() => {
    if (!isCompilerAssessment) return;
    if (!SUPPORTED_COMPILER_APPLICATION_IDS.includes(selectedApplication)) {
      setSelectedApplication('python');
    }
  }, [isCompilerAssessment, selectedApplication]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/students')
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data.success) setStudents(data.students || []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (selectedCourses.length === 0 && courseOptions.length > 0) {
      setSelectedCourses([courseOptions[0]]);
    }
    if (selectedBatches.length === 0 && batchOptions.length > 0) {
      setSelectedBatches([batchOptions[0]]);
    }
  }, [courseOptions, batchOptions, selectedCourses.length, selectedBatches.length]);

  // Separate assessment files by type for selection
  const mcqFiles = (assessments || []).filter(a => a.assessmentType === 'mcq' || !a.assessmentType);
  const practicalFiles = (assessments || []).filter(a => a.assessmentType === 'compiler');

  // File Input Handlers
  const handleMcqFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        window.alert('Please upload MCQ questions in .xlsx format only.');
        e.target.value = '';
        return;
      }
      try {
        const parsedAssessment = await parseAssessmentExcelFile(file);
        const uploadedId = `uploaded-mcq-${Date.now()}`;
        const uploadedAssessment = {
          ...parsedAssessment,
          id: uploadedId,
          title: file.name.replace(/\.[^/.]+$/, ''),
          questions: parsedAssessment.questions || []
        };
        setMcqParsedAssessment(uploadedAssessment);
        setMcqUploadedFile({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          questionCount: uploadedAssessment.questions.length,
          rawFile: file
        });
        setMcqFileId(uploadedId);
        addAssessment(uploadedAssessment);
      } catch (err) {
        window.alert(err.message || 'Unable to read the uploaded .xlsx question file.');
        setMcqParsedAssessment(null);
        setMcqUploadedFile(null);
        setMcqFileId('');
        e.target.value = '';
      }
    }
  };

  const handlePracticalSetupFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedExtensions = practicalConfig.setupAccept.split(',');
    if (!allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      window.alert(`"${file.name}" is not valid for ${practicalConfig.label}. Allowed: ${practicalConfig.setupAccept}`);
      e.target.value = '';
      return;
    }
    try {
      const content = await parsePracticalSetupFile(file);
      setPracticalSetupFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        content
      });
      if (practicalQuestionSections) {
        const lab = buildPracticalLab({
          appId: selectedApplication,
          questionSections: practicalQuestionSections,
          setupFileName: file.name,
          setupContent: content
        });
        setPracticalParsedAssessment(prev => prev ? {
          ...prev,
          title: lab.title,
          questions: [lab]
        } : prev);
      }
    } catch (err) {
      window.alert(err.message || 'Unable to read the practical setup/data file.');
      setPracticalSetupFile(null);
      e.target.value = '';
    }
  };

  const handlePracticalQuestionFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedExtensions = practicalConfig.questionAccept.split(',');
    if (!allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      window.alert(`"${file.name}" is not a supported question document. Allowed: ${practicalConfig.questionAccept}`);
      e.target.value = '';
      return;
    }
    try {
      const questionSections = await parsePracticalQuestionFile(file);
      const uploadedId = `uploaded-practical-${Date.now()}`;
      const lab = buildPracticalLab({
        appId: selectedApplication,
        questionSections,
        setupFileName: practicalSetupFile?.name || '',
        setupContent: practicalSetupFile?.content || ''
      });
      const uploadedAssessment = {
        id: uploadedId,
        title: lab.title,
        domain: selectedApplication,
        assessmentType: 'compiler',
        questions: [lab]
      };
      setPracticalQuestionFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        questionTitle: lab.title
      });
      setPracticalQuestionSections(questionSections);
      setPracticalParsedAssessment(uploadedAssessment);
      setPracticalFileId(uploadedId);
      addAssessment(uploadedAssessment);
    } catch (err) {
      window.alert(err.message || 'Unable to read the question or expected answer from the Word document.');
      setPracticalQuestionFile(null);
      setPracticalQuestionSections(null);
      setPracticalParsedAssessment(null);
      setPracticalFileId('');
      e.target.value = '';
    }
  };

  const downloadTextFile = (fileName, content) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadPracticalSetupSample = (appId) => {
    const sample = getPracticalConfig(appId);
    downloadTextFile(sample.setupSampleFileName, sample.setupSampleContent);
  };

  const downloadPracticalQuestionSample = (appId) => {
    const sample = getPracticalConfig(appId);
    downloadTextFile(sample.questionSampleFileName, buildQuestionDocContent(appId));
  };

  // Compute End Date & Time based on start + duration
  const computeStartAndEndTimes = () => {
    try {
      const [year, month, day] = startDate.split('-').map(Number);
      const [hours, minutes] = startTime.split(':').map(Number);
      const startObj = new Date(year, month - 1, day, hours, minutes);
      const endObj = new Date(startObj.getTime() + Number(duration) * 60000);
      return { startObj, endObj };
    } catch (e) {
      const now = new Date();
      return { startObj: now, endObj: new Date(now.getTime() + Number(duration) * 60000) };
    }
  };

  const selectTopApplication = (appId) => {
    setTopApplication(appId);
    setTopAppDropdownOpen(false);
  };

  // Top Course Filter Toggle
  const toggleTopCourse = (cName) => {
    if (cName === 'All Courses') {
      setTopCourses(['All Courses']);
      return;
    }
    const filtered = topCourses.filter(c => c !== 'All Courses');
    if (filtered.includes(cName)) {
      const next = filtered.filter(c => c !== cName);
      setTopCourses(next.length > 0 ? next : ['All Courses']);
    } else {
      setTopCourses([...filtered, cName]);
    }
  };

  // Top Batch Filter Toggle
  const toggleTopBatch = (bId) => {
    if (bId === 'All Batches') {
      setTopBatches(['All Batches']);
      return;
    }
    const filtered = topBatches.filter(b => b !== 'All Batches');
    if (filtered.includes(bId)) {
      const next = filtered.filter(b => b !== bId);
      setTopBatches(next.length > 0 ? next : ['All Batches']);
    } else {
      setTopBatches([...filtered, bId]);
    }
  };

  // Modal Toggle Handlers
  const selectApplication = (appId) => {
    if (isCompilerAssessment && !SUPPORTED_COMPILER_APPLICATION_IDS.includes(appId)) return;
    setSelectedApplication(appId);
    setPracticalSetupFile(null);
    setPracticalQuestionFile(null);
    setPracticalQuestionSections(null);
    setPracticalParsedAssessment(null);
    setPracticalFileId('');
    setAppDropdownOpen(false);
  };

  const toggleCourse = (cName) => {
    if (cName === 'All Courses') {
      setSelectedCourses(['All Courses']);
      return;
    }
    const filtered = selectedCourses.filter(c => c !== 'All Courses');
    if (filtered.includes(cName)) {
      const next = filtered.filter(c => c !== cName);
      setSelectedCourses(next.length > 0 ? next : courseOptions.slice(0, 1));
    } else {
      setSelectedCourses([...filtered, cName]);
    }
  };

  const toggleBatch = (bId) => {
    if (bId === 'All Batches') {
      setSelectedBatches(['All Batches']);
      return;
    }
    const filtered = selectedBatches.filter(b => b !== 'All Batches');
    if (filtered.includes(bId)) {
      const next = filtered.filter(b => b !== bId);
      setSelectedBatches(next.length > 0 ? next : batchOptions.slice(0, 1));
    } else {
      setSelectedBatches([...filtered, bId]);
    }
  };

  const handleCreateTest = (e) => {
    e.preventDefault();

    const selectedMcqDoc = mcqSourceMode === 'upload'
      ? mcqParsedAssessment
      : mcqFiles.find(a => a.id === mcqFileId);
    const selectedPracticalDoc = practicalSourceMode === 'upload'
      ? practicalParsedAssessment
      : practicalFiles.find(a => a.id === practicalFileId);
    const supportedApplication = isCompilerAssessment && !SUPPORTED_COMPILER_APPLICATION_IDS.includes(selectedApplication)
      ? 'python'
      : selectedApplication;
    const appName = APPLICATIONS.find(a => a.id === supportedApplication)?.name || supportedApplication;

    const { startObj, endObj } = computeStartAndEndTimes();

    const mcqName = (mcqSourceMode === 'upload' && mcqUploadedFile) 
      ? mcqUploadedFile.name 
      : (selectedMcqDoc?.title || 'Default MCQ Question File');
    const mcqQuestions = (assessmentType === 'mcq' || assessmentType === 'hybrid')
      ? (selectedMcqDoc?.questions || [])
      : [];

    if (isCompilerAssessment && practicalSourceMode === 'upload' && (!practicalSetupFile || !practicalParsedAssessment)) {
      window.alert(`Please upload both the ${practicalConfig.setupLabel} and the Word question document with [QUESTION] and [EXPECTED_ANSWER].`);
      return;
    }

    const practicalName = (practicalSourceMode === 'upload' && practicalQuestionFile) 
      ? `${practicalSetupFile?.name || 'Setup/Data'} + ${practicalQuestionFile.name}`
      : (selectedPracticalDoc?.title || 'Default Compiler Challenge File');
    const practicalQuestions = (assessmentType === 'practical' || assessmentType === 'hybrid')
      ? (selectedPracticalDoc?.questions || [])
      : [];

    const newTest = {
      id: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      title: testTitle || `Assessment (${appName})`,
      domains: [supportedApplication],
      domain: supportedApplication,
      application: supportedApplication,
      applications: [supportedApplication],
      assessmentType: assessmentType === 'hybrid' ? 'hybrid' : (assessmentType === 'practical' ? 'compiler' : 'mcq'),
      courses: selectedCourses,
      course: selectedCourses.join(', '),
      targetBatches: selectedBatches,
      durationMinutes: Number(duration),
      scheduledStartIso: startObj.toISOString(),
      scheduledEndIso: endObj.toISOString(),
      scheduledStartFormatted: `${startDate} ${startTime}`,
      scheduledFor: `${startDate} at ${startTime}`,
      mcqFileId: (assessmentType === 'mcq' || assessmentType === 'hybrid') ? (mcqFileId || 'mcq-custom') : null,
      mcqFileName: (assessmentType === 'mcq' || assessmentType === 'hybrid') ? mcqName : null,
      mcqQuestions,
      mcqQuestionCount: mcqQuestions.length,
      servedMcqCount: mcqQuestions.length || undefined,
      practicalFileId: (assessmentType === 'practical' || assessmentType === 'hybrid') ? (practicalFileId || 'practical-custom') : null,
      practicalFileName: (assessmentType === 'practical' || assessmentType === 'hybrid') ? practicalName : null,
      practicalQuestions,
      practicalQuestionCount: practicalQuestions.length,
      status: 'Active'
    };

    addScheduledTest(newTest);
    setShowModal(false);

    // Reset Form
    setTestTitle('');
    setMcqFileId('');
    setPracticalFileId('');
    setMcqUploadedFile(null);
    setMcqParsedAssessment(null);
    setPracticalSetupFile(null);
    setPracticalQuestionFile(null);
    setPracticalQuestionSections(null);
    setPracticalParsedAssessment(null);
    setAssessmentType('mcq');
    setSelectedApplication('python');
    setSelectedCourses(courseOptions.slice(0, 1));
    setSelectedBatches(batchOptions.slice(0, 1));
  };

  // Filter scheduled tests
  const displayedTests = scheduledTests.filter(t => {
    const stage = getTestStage(t);

    // 0. Application Filter
    const testApplication = (t.domains && t.domains.length > 0 ? t.domains[0] : t.domain) || '';
    const appMatch = topApplication === 'All Applications' || testApplication === topApplication;

    // 1. Course Filter
    const courseMatch = topCourses.includes('All Courses') || 
      (t.courses && t.courses.some(c => topCourses.includes(c))) || 
      topCourses.includes(t.course);

    // 2. Batch Filter
    const batchMatch = topBatches.includes('All Batches') || 
      (t.targetBatches && t.targetBatches.some(b => topBatches.includes(b)));

    // 3. Status Lifecycle Filter (Scheduled, Live, Closed)
    const statusMatch = filterStatus === 'All Statuses' || stage.toLowerCase() === filterStatus.toLowerCase();

    // 4. Date Filter
    const dateMatch = !filterDate || (t.scheduledStartIso && t.scheduledStartIso.startsWith(filterDate)) || (t.scheduledFor && t.scheduledFor.includes(filterDate));

    return appMatch && courseMatch && batchMatch && statusMatch && dateMatch;
  });

  const resetTopFilters = () => {
    setTopApplication('All Applications');
    setTopCourses(['All Courses']);
    setTopBatches(['All Batches']);
    setFilterStatus('All Statuses');
    setFilterDate('');
  };

  // Open Test Details in a NEW TAB
  const openTestDetailsInNewTab = (testId, testTitle) => {
    const targetUrl = `${window.location.origin}/admin/test-details?id=${encodeURIComponent(testId)}&test=${encodeURIComponent(testTitle)}`;
    window.open(targetUrl, '_blank');
  };

  const handleDeleteTest = (event, test) => {
    event.stopPropagation();
    const confirmed = window.confirm(`Delete "${test.title}"? This removes the test for all admins and students.`);
    if (confirmed) deleteScheduledTest(test.id);
  };

  const hasTopFilters = topApplication !== 'All Applications' || !topCourses.includes('All Courses') || !topBatches.includes('All Batches') || filterStatus !== 'All Statuses' || filterDate !== '';
  const { startObj: previewStart, endObj: previewEnd } = computeStartAndEndTimes();

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Header Bar & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#051f40]">Test Scheduler</h2>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-[#051f40] hover:bg-[#1b2a60] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-orange-400" />
            <span>Schedule New Assessment</span>
          </button>
        </div>

        {/* Top Filter Bar with Unified Matching Custom UI */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs font-semibold">
          <span className="text-slate-500 flex items-center gap-1">
            Filter By:
          </span>

          {/* 1. Application Filter (Matching Custom Multi-Select Dropdown) */}
          <div className="relative">
            <button
              onClick={() => {
                setTopAppDropdownOpen(!topAppDropdownOpen);
                setTopCourseDropdownOpen(false);
                setTopBatchDropdownOpen(false);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-semibold flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition"
            >
              <span>
                {topApplication === 'All Applications'
                  ? 'All Applications'
                  : APPLICATIONS.find(a => a.id === topApplication)?.name || topApplication}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {topAppDropdownOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl p-2 shadow-xl z-30 space-y-1 max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => selectTopApplication('All Applications')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                    topApplication === 'All Applications' ? 'bg-[#051f40] text-white' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>All Applications</span>
                </button>

                {APPLICATIONS.map(app => {
                  const isSelected = topApplication === app.id;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => selectTopApplication(app.id)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                        isSelected ? 'bg-[#051f40] text-white' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{app.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Course Filter (Matching Custom Multi-Select Dropdown) */}
          <div className="relative">
            <button
              onClick={() => {
                setTopCourseDropdownOpen(!topCourseDropdownOpen);
                setTopAppDropdownOpen(false);
                setTopBatchDropdownOpen(false);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-semibold flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition"
            >
              <span>{topCourses.includes('All Courses') ? 'All Courses' : topCourses.join(', ')}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {topCourseDropdownOpen && (
              <div className="absolute left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl p-2 shadow-xl z-30 space-y-1 max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => toggleTopCourse('All Courses')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                    topCourses.includes('All Courses') ? 'bg-[#051f40] text-white' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>All Courses</span>
                </button>

                {courseOptions.map(c => {
                  const isSelected = topCourses.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleTopCourse(c)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                        isSelected ? 'bg-[#051f40] text-white' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{c}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Batch Filter (Matching Searchable Multi-Select Dropdown) */}
          <div className="relative">
            <button
              onClick={() => {
                setTopBatchDropdownOpen(!topBatchDropdownOpen);
                setTopAppDropdownOpen(false);
                setTopCourseDropdownOpen(false);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-semibold flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition"
            >
              <span>{topBatches.includes('All Batches') ? 'All Batches' : topBatches.join(', ')}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {topBatchDropdownOpen && (
              <div className="absolute left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl p-2 shadow-xl z-30 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={topBatchSearchQuery}
                    onChange={(e) => setTopBatchSearchQuery(e.target.value)}
                    placeholder="Search batches..."
                    className="w-full bg-slate-50 border border-slate-200 pl-8 pr-2 py-1.5 rounded-lg text-xs text-slate-800 outline-none"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-[11px]">
                  <button
                    onClick={() => toggleTopBatch('All Batches')}
                    className={`w-full text-left px-2 py-1 rounded flex items-center justify-between cursor-pointer transition ${
                      topBatches.includes('All Batches') ? 'bg-[#051f40] text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>All Batches</span>
                  </button>
                  {topFilteredBatches.map(b => {
                    const isSelected = topBatches.includes(b);
                    return (
                      <button
                        key={b}
                        onClick={() => toggleTopBatch(b)}
                        className={`w-full text-left px-2 py-1 rounded flex items-center justify-between cursor-pointer transition ${
                          isSelected ? 'bg-[#051f40] text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span>{b}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Lifecycle Status Filter (Scheduled / Live / Closed) - NO EMOJIS OR ICONS */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-semibold outline-none focus:border-[#ef5323] cursor-pointer"
          >
            <option value="All Statuses">All Lifecycle States</option>
            <option value="Scheduled">Scheduled (Upcoming)</option>
            <option value="Live">Live (Running Now)</option>
            <option value="Closed">Closed (Completed)</option>
          </select>

          {/* 5. Date Filter */}
          <div className="relative flex items-center">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#ef5323] cursor-pointer"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="ml-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear date filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Reset Filters Button */}
          <button
            onClick={resetTopFilters}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl border border-slate-200 cursor-pointer transition text-xs ml-auto"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Scheduled Tests Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedTests.length === 0 ? (
          <div className="col-span-2 bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Tests Found</h4>
            <p className="text-xs text-slate-500">No assessment tests match your active filter criteria.</p>
            {hasTopFilters && (
              <button
                onClick={resetTopFilters}
                className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          displayedTests.map((t) => {
            const stage = getTestStage(t);
            const isHybrid = t.assessmentType === 'hybrid';
            const isPractical = t.assessmentType === 'compiler' || t.assessmentType === 'practical';

            // Extract display arrays for Application, Course, and Batches
            const rawApps = (t.domains && t.domains.length > 0)
              ? t.domains
              : (t.domain ? [t.domain] : ['python']);
            const displayApps = rawApps.slice(0, 1).map(dId => APPLICATIONS.find(a => a.id === dId)?.name || dId.toUpperCase());

            const displayCourses = (t.courses && t.courses.length > 0)
              ? t.courses
              : (t.course ? (Array.isArray(t.course) ? t.course : t.course.split(', ')) : []);

            const displayBatches = (t.targetBatches && t.targetBatches.length > 0)
              ? t.targetBatches
              : (t.batch ? [t.batch] : []);

            return (
              <div 
                key={t.id} 
                onClick={() => openTestDetailsInNewTab(t.id, t.title)}
                className="bg-white border border-slate-200/80 hover:border-orange-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition duration-150 space-y-3.5 flex flex-col justify-between cursor-pointer group"
              >
                <div className="space-y-3">
                  {/* Top Row: Assessment Type Badge & Lifecycle Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                      isHybrid
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : isPractical
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-orange-50 text-[#ef5323] border-orange-200'
                    }`}>
                      {isHybrid ? 'MCQ + Practical' : isPractical ? 'Practical Only' : 'MCQ Only'}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* 3-Stage Lifecycle Badge: Scheduled -> Live -> Closed */}
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                        stage === 'Live'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : stage === 'Scheduled'
                          ? 'bg-sky-50 text-sky-700 border-sky-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          stage === 'Live' ? 'bg-emerald-500 animate-pulse' : stage === 'Scheduled' ? 'bg-sky-500' : 'bg-slate-400'
                        }`} />
                        {stage.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => handleDeleteTest(event, t)}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-red-100 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 transition cursor-pointer"
                        title="Delete test"
                        aria-label={`Delete ${t.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Test Title with External Link Icon */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-[#051f40] group-hover:text-[#ef5323] transition leading-snug">{t.title}</h3>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#ef5323] transition shrink-0 mt-0.5" />
                  </div>

                  {/* Clean Card Details Container: Application, Course, Batch */}
                  <div className="bg-slate-50 group-hover:bg-orange-50/20 p-3.5 rounded-xl border border-slate-200/70 group-hover:border-orange-200 transition space-y-2 text-xs">
                    {/* Application Row */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium w-20 shrink-0">Application:</span>
                      <div className="flex flex-wrap gap-1">
                        {displayApps.map((appName, idx) => (
                          <span key={idx} className="bg-white border border-slate-200 text-slate-800 font-semibold px-2 py-0.5 rounded-md text-[11px] shadow-2xs">
                            {appName}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Course Row */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium w-20 shrink-0">Course:</span>
                      <div className="flex flex-wrap gap-1">
                        {displayCourses.map((cName, idx) => (
                          <span key={idx} className="bg-white border border-slate-200 text-[#051f40] font-semibold px-2 py-0.5 rounded-md text-[11px] shadow-2xs">
                            {cName}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Batch Row */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium w-20 shrink-0">Batch:</span>
                      <div className="flex flex-wrap gap-1">
                        {displayBatches.map((bId, idx) => (
                          <span key={idx} className="bg-white border border-slate-200 text-slate-700 font-mono text-[11px] px-2 py-0.5 rounded-md shadow-2xs">
                            {bId}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Files info if attached */}
                    {(t.mcqFileName || t.practicalFileName) && (
                      <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[11px]">
                        {t.mcqFileName && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <span className="text-slate-400 font-medium">MCQ File:</span>
                            <strong className="text-slate-800 truncate">{t.mcqFileName}</strong>
                          </div>
                        )}
                        {t.practicalFileName && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <span className="text-slate-400 font-medium">Practical File:</span>
                            <strong className="text-slate-800 truncate">{t.practicalFileName}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Test Schedule Date, Time & Action Footer */}
                <div className="space-y-2 pt-2.5 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#ef5323]" />
                      <span>Start: <strong className="text-[#051f40] font-bold">{t.scheduledStartFormatted || t.scheduledFor || 'Live'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Duration: <strong className="text-slate-800">{t.durationMinutes} mins</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-[#051f40] group-hover:text-[#ef5323] transition pt-1">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#ef5323]" />
                      <span>Inspect Questions & Answer Key</span>
                    </span>
                    <span>&rarr;</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Assessment Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#051f40]">Schedule New Assessment</h3>
              <span className="text-xs text-slate-400">Configure Schedule & Files</span>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-4">
              {/* Field 1: Assessment Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assessment Title</label>
                <input
                  type="text"
                  required
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="e.g. Python, SQL & ML Evaluation Exam"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#ef5323]"
                />
              </div>

              {/* Date & Time Selection Section */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <span className="block text-xs font-bold text-[#051f40] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#ef5323]" />
                  Schedule Start Date & Time
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      required
                      min={5}
                      max={360}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span>Starts: <strong>{previewStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                  <span>Ends Automatically: <strong>{previewEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                </div>
              </div>

              {/* Field 2: Target Application Dropdown */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Application
                </label>
                
                <button
                  type="button"
                  onClick={() => {
                    setAppDropdownOpen(!appDropdownOpen);
                    setCourseDropdownOpen(false);
                    setBatchDropdownOpen(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold flex items-center justify-between outline-none focus:border-[#ef5323] cursor-pointer"
                >
                  <span className="truncate">
                    {availableApplications.find(a => a.id === selectedApplication)?.name || selectedApplication}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                {appDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl p-2 shadow-2xl z-30 space-y-1 max-h-48 overflow-y-auto">
                    {availableApplications.map(app => {
                      const isSelected = selectedApplication === app.id;
                      return (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => selectApplication(app.id)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                            isSelected ? 'bg-[#051f40] text-white' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span>{app.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Field 3: Test Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Test Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssessmentType('mcq')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      assessmentType === 'mcq'
                        ? 'bg-[#051f40] text-white border-[#051f40]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    MCQ Only
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssessmentType('practical')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      assessmentType === 'practical'
                        ? 'bg-[#051f40] text-white border-[#051f40]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Practical Only
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssessmentType('hybrid')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      assessmentType === 'hybrid'
                        ? 'bg-[#051f40] text-white border-[#051f40]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    MCQ + Practical
                  </button>
                </div>
              </div>

              {/* Field 4: Separate File Upload / Selection */}
              <div className="space-y-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                {/* MCQ File Upload Section */}
                {(assessmentType === 'mcq' || assessmentType === 'hybrid') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#ef5323]" />
                        <span>MCQ Question File</span>
                      </label>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={downloadAssessmentExcelTemplate}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-orange-200 bg-orange-50 text-[#ef5323] text-[10px] font-bold hover:bg-orange-100 transition"
                        >
                          <Download className="w-3 h-3" />
                          <span>Sample XLSX</span>
                        </button>
                        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setMcqSourceMode('upload')}
                            className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition ${
                              mcqSourceMode === 'upload' ? 'bg-[#051f40] text-white' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Upload File
                          </button>
                          <button
                            type="button"
                            onClick={() => setMcqSourceMode('select')}
                            className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition ${
                              mcqSourceMode === 'select' ? 'bg-[#051f40] text-white' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Select Existing
                          </button>
                        </div>
                      </div>
                    </div>

                    {mcqSourceMode === 'upload' ? (
                      <div className="bg-white border-2 border-dashed border-slate-200 hover:border-[#ef5323] transition rounded-xl p-3.5 text-center relative cursor-pointer group">
                        <input
                          type="file"
                          accept=".xlsx"
                          onChange={handleMcqFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        {mcqUploadedFile ? (
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-left truncate">
                              <FileText className="w-5 h-5 text-[#ef5323] shrink-0" />
                              <div className="truncate">
                                <p className="font-bold text-slate-800 truncate">{mcqUploadedFile.name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {mcqUploadedFile.size} • {mcqUploadedFile.questionCount || 0} questions parsed
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full shrink-0">
                              Uploaded
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#ef5323] mx-auto transition" />
                            <p className="text-xs font-bold text-slate-700">Click or Drag & Drop MCQ File</p>
                            <p className="text-[10px] text-slate-400">Upload .XLSX only</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <select
                        value={mcqFileId}
                        onChange={(e) => setMcqFileId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium outline-none focus:border-[#ef5323]"
                      >
                        <option value="">-- Choose MCQ Assessment File --</option>
                        {mcqFiles.map(file => (
                          <option key={file.id} value={file.id}>
                            {file.title} ({file.questions?.length || 0} MCQs - {file.domain})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Practical File Upload Section */}
                {(assessmentType === 'practical' || assessmentType === 'hybrid') && (
                  <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>{practicalConfig.label} Practical Package</span>
                      </label>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => downloadPracticalSetupSample(selectedApplication)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-[10px] font-bold hover:bg-purple-100 transition"
                        >
                          <Download className="w-3 h-3" />
                          <span>Setup Sample</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadPracticalQuestionSample(selectedApplication)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-[10px] font-bold hover:bg-purple-100 transition"
                        >
                          <Download className="w-3 h-3" />
                          <span>Question Doc Sample</span>
                        </button>
                        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setPracticalSourceMode('upload')}
                            className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition ${
                              practicalSourceMode === 'upload' ? 'bg-[#051f40] text-white' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Upload File
                          </button>
                          <button
                            type="button"
                            onClick={() => setPracticalSourceMode('select')}
                            className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition ${
                              practicalSourceMode === 'select' ? 'bg-[#051f40] text-white' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Select Existing
                          </button>
                        </div>
                      </div>
                    </div>

                    {practicalSourceMode === 'upload' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white border-2 border-dashed border-slate-200 hover:border-purple-500 transition rounded-xl p-3.5 text-center relative cursor-pointer group min-h-[106px]">
                          <input
                            type="file"
                            accept={practicalConfig.setupAccept}
                            onChange={handlePracticalSetupFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                          />
                          {practicalSetupFile ? (
                            <div className="flex items-center justify-between text-xs h-full">
                              <div className="flex items-center gap-2 text-left truncate">
                                <Code2 className="w-5 h-5 text-purple-600 shrink-0" />
                                <div className="truncate">
                                  <p className="font-bold text-slate-800 truncate">{practicalSetupFile.name}</p>
                                  <p className="text-[10px] text-slate-400">{practicalSetupFile.size} • setup/data ready</p>
                                </div>
                              </div>
                              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full shrink-0">
                                Uploaded
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <Upload className="w-5 h-5 text-slate-400 group-hover:text-purple-600 mx-auto transition" />
                              <p className="text-xs font-bold text-slate-700">{practicalConfig.setupLabel}</p>
                              <p className="text-[10px] text-slate-400">Upload {practicalConfig.setupAccept}</p>
                            </div>
                          )}
                        </div>

                        <div className="bg-white border-2 border-dashed border-slate-200 hover:border-purple-500 transition rounded-xl p-3.5 text-center relative cursor-pointer group min-h-[106px]">
                          <input
                            type="file"
                            accept={practicalConfig.questionAccept}
                            onChange={handlePracticalQuestionFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                          />
                          {practicalQuestionFile ? (
                            <div className="flex items-center justify-between text-xs h-full">
                              <div className="flex items-center gap-2 text-left truncate">
                                <FileText className="w-5 h-5 text-purple-600 shrink-0" />
                                <div className="truncate">
                                  <p className="font-bold text-slate-800 truncate">{practicalQuestionFile.name}</p>
                                  <p className="text-[10px] text-slate-400">{practicalQuestionFile.size} • question and answer parsed</p>
                                </div>
                              </div>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full shrink-0">
                                Valid
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <Upload className="w-5 h-5 text-slate-400 group-hover:text-purple-600 mx-auto transition" />
                              <p className="text-xs font-bold text-slate-700">Question Word Document</p>
                              <p className="text-[10px] text-slate-400">Must include [QUESTION] and [EXPECTED_ANSWER]</p>
                            </div>
                          )}
                        </div>

                        {practicalParsedAssessment && (
                          <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-3 py-2 text-[11px] font-semibold">
                            Parsed: {practicalParsedAssessment.title} • {practicalConfig.questionInfoLabel}, starter code, and hidden expected answer saved.
                          </div>
                        )}
                      </div>
                    ) : (
                      <select
                        value={practicalFileId}
                        onChange={(e) => setPracticalFileId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium outline-none focus:border-[#ef5323]"
                      >
                        <option value="">-- Choose Practical Assessment File --</option>
                        {practicalFiles.map(file => (
                          <option key={file.id} value={file.id}>
                            {file.title} ({file.questions?.length || 0} Compiler Labs - {file.domain})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Field 5: Target Courses Dropdown (Multi-Select) */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Courses ({selectedCourses.join(', ')})
                </label>
                
                <button
                  type="button"
                  onClick={() => {
                    setCourseDropdownOpen(!courseDropdownOpen);
                    setAppDropdownOpen(false);
                    setBatchDropdownOpen(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold flex items-center justify-between outline-none focus:border-[#ef5323] cursor-pointer"
                >
                  <span className="truncate">{selectedCourses.join(', ')}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                {courseDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl p-2 shadow-2xl z-30 space-y-1 max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => toggleCourse('All Courses')}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                        selectedCourses.includes('All Courses') ? 'bg-[#051f40] text-white' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>All Courses</span>
                      {selectedCourses.includes('All Courses') && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                    </button>
                    {courseOptions.map(c => {
                      const isSelected = selectedCourses.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCourse(c)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                            isSelected ? 'bg-[#051f40] text-white' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span>{c}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Field 6: Target Batches Dropdown (Searchable & Multi-Select) */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Batches ({selectedBatches.join(', ')})
                </label>
                
                <button
                  type="button"
                  onClick={() => {
                    setBatchDropdownOpen(!batchDropdownOpen);
                    setAppDropdownOpen(false);
                    setCourseDropdownOpen(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold flex items-center justify-between outline-none focus:border-[#ef5323] cursor-pointer"
                >
                  <span className="truncate">{selectedBatches.join(', ')}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                {batchDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl p-2 shadow-2xl z-30 space-y-2 max-h-56 overflow-y-auto">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={modalBatchSearch}
                        onChange={(e) => setModalBatchSearch(e.target.value)}
                        placeholder="Search batch number... e.g. 2026"
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 font-mono text-[11px]">
                      <button
                        type="button"
                        onClick={() => toggleBatch('All Batches')}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                          selectedBatches.includes('All Batches') ? 'bg-[#051f40] text-white' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span>All Batches</span>
                        {selectedBatches.includes('All Batches') && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                      </button>

                      {modalFilteredBatches.map(b => {
                        const isSelected = selectedBatches.includes(b);
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => toggleBatch(b)}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                              isSelected ? 'bg-[#051f40] text-white' : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span>{b}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#051f40] hover:bg-[#1b2a60] transition cursor-pointer"
                >
                  Schedule Test Window
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function buildUniqueOptions(records, fields) {
  const values = new Set();
  records.forEach(record => {
    fields.forEach(field => {
      toList(record?.[field]).forEach(value => values.add(value));
    });
  });
  return Array.from(values).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function toList(value) {
  if (Array.isArray(value)) return value.map(String).map(item => item.trim()).filter(Boolean);
  if (!value) return [];
  return String(value).split(',').map(item => item.trim()).filter(Boolean);
}
