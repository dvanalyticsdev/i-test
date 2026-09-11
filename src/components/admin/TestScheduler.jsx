import React, { useState } from 'react';
import { useExam } from '../../context/ExamContext';
import { BATCHES } from '../../data/mockQuestionBank';
import { Plus, Search, ChevronDown, FileText, Code2, Check, Calendar, Clock, X, Filter, Upload, ExternalLink } from 'lucide-react';

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

const COURSE_OPTIONS = ['AIML', 'APCFCS', 'APIDA', 'APIDS', 'DAS', 'FDE', 'Excel AI & Automation', 'SQL & Data Analytics'];

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
  const { scheduledTests, addScheduledTest, assessments } = useExam();
  const [showModal, setShowModal] = useState(false);

  // Top Filter States (Multi-Select & Lifecycle Filters)
  const [topApplications, setTopApplications] = useState(['All Applications']);
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
  const [assessmentType, setAssessmentType] = useState('mcq'); // 'mcq' | 'practical' | 'hybrid'
  const [mcqFileId, setMcqFileId] = useState('');
  const [practicalFileId, setPracticalFileId] = useState('');

  // File Upload vs Select States
  const [mcqSourceMode, setMcqSourceMode] = useState('upload'); // 'upload' | 'select'
  const [practicalSourceMode, setPracticalSourceMode] = useState('upload'); // 'upload' | 'select'
  const [mcqUploadedFile, setMcqUploadedFile] = useState(null);
  const [practicalUploadedFile, setPracticalUploadedFile] = useState(null);
  
  // Date & Time Scheduling States
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [duration, setDuration] = useState(45);

  // Multi-select states inside modal
  const [selectedApplications, setSelectedApplications] = useState(['python']);
  const [selectedCourses, setSelectedCourses] = useState(['AIML']);
  const [selectedBatches, setSelectedBatches] = useState(['202601']);

  // Modal Dropdown Toggle States
  const [appDropdownOpen, setAppDropdownOpen] = useState(false);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const [modalBatchSearch, setModalBatchSearch] = useState('');

  const topFilteredBatches = BATCHES.filter(b => b.toLowerCase().includes(topBatchSearchQuery.toLowerCase()));
  const modalFilteredBatches = BATCHES.filter(b => b.toLowerCase().includes(modalBatchSearch.toLowerCase().trim()));

  // Separate assessment files by type for selection
  const mcqFiles = (assessments || []).filter(a => a.assessmentType === 'mcq' || !a.assessmentType);
  const practicalFiles = (assessments || []).filter(a => a.assessmentType === 'compiler');

  // File Input Handlers
  const handleMcqFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMcqUploadedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        rawFile: file
      });
      setMcqFileId(`uploaded-mcq-${Date.now()}`);
    }
  };

  const handlePracticalFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPracticalUploadedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        rawFile: file
      });
      setPracticalFileId(`uploaded-[#practical-${Date.now()}`);
    }
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

  // Top Application Filter Toggle
  const toggleTopApplication = (appId) => {
    if (appId === 'All Applications') {
      setTopApplications(['All Applications']);
      return;
    }
    const filtered = topApplications.filter(a => a !== 'All Applications');
    if (filtered.includes(appId)) {
      const next = filtered.filter(a => a !== appId);
      setTopApplications(next.length > 0 ? next : ['All Applications']);
    } else {
      setTopApplications([...filtered, appId]);
    }
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
  const toggleApplication = (appId) => {
    if (selectedApplications.includes(appId)) {
      const next = selectedApplications.filter(a => a !== appId);
      setSelectedApplications(next.length > 0 ? next : ['python']);
    } else {
      setSelectedApplications([...selectedApplications, appId]);
    }
  };

  const toggleCourse = (cName) => {
    if (cName === 'All Courses') {
      setSelectedCourses(['All Courses']);
      return;
    }
    const filtered = selectedCourses.filter(c => c !== 'All Courses');
    if (filtered.includes(cName)) {
      const next = filtered.filter(c => c !== cName);
      setSelectedCourses(next.length > 0 ? next : ['AIML']);
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
      setSelectedBatches(next.length > 0 ? next : ['202601']);
    } else {
      setSelectedBatches([...filtered, bId]);
    }
  };

  const handleCreateTest = (e) => {
    e.preventDefault();

    const selectedMcqDoc = mcqFiles.find(a => a.id === mcqFileId);
    const selectedPracticalDoc = practicalFiles.find(a => a.id === practicalFileId);
    const appNames = selectedApplications.map(id => APPLICATIONS.find(a => a.id === id)?.name || id).join(', ');

    const { startObj, endObj } = computeStartAndEndTimes();

    const mcqName = (mcqSourceMode === 'upload' && mcqUploadedFile) 
      ? mcqUploadedFile.name 
      : (selectedMcqDoc?.title || 'Default MCQ Question File');

    const practicalName = (practicalSourceMode === 'upload' && practicalUploadedFile) 
      ? practicalUploadedFile.name 
      : (selectedPracticalDoc?.title || 'Default Compiler Challenge File');

    const newTest = {
      id: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      title: testTitle || `Assessment (${appNames})`,
      domains: selectedApplications,
      domain: selectedApplications[0] || 'python',
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
      practicalFileId: (assessmentType === 'practical' || assessmentType === 'hybrid') ? (practicalFileId || 'practical-custom') : null,
      practicalFileName: (assessmentType === 'practical' || assessmentType === 'hybrid') ? practicalName : null,
      status: 'Active'
    };

    addScheduledTest(newTest);
    setShowModal(false);

    // Reset Form
    setTestTitle('');
    setMcqFileId('');
    setPracticalFileId('');
    setMcqUploadedFile(null);
    setPracticalUploadedFile(null);
    setAssessmentType('mcq');
    setSelectedApplications(['python']);
    setSelectedCourses(['AIML']);
    setSelectedBatches(['202601']);
  };

  // Filter scheduled tests
  const displayedTests = scheduledTests.filter(t => {
    const stage = getTestStage(t);

    // 0. Application Filter
    const appMatch = topApplications.includes('All Applications') || 
      (t.domains && t.domains.some(d => topApplications.includes(d))) ||
      topApplications.includes(t.domain);

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
    setTopApplications(['All Applications']);
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

  const hasTopFilters = !topApplications.includes('All Applications') || !topCourses.includes('All Courses') || !topBatches.includes('All Batches') || filterStatus !== 'All Statuses' || filterDate !== '';
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
                {topApplications.includes('All Applications')
                  ? 'All Applications'
                  : topApplications.map(id => APPLICATIONS.find(a => a.id === id)?.name || id).join(', ')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {topAppDropdownOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl p-2 shadow-xl z-30 space-y-1 max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => toggleTopApplication('All Applications')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                    topApplications.includes('All Applications') ? 'bg-[#051f40] text-white' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>All Applications</span>
                </button>

                {APPLICATIONS.map(app => {
                  const isSelected = topApplications.includes(app.id);
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => toggleTopApplication(app.id)}
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

                {COURSE_OPTIONS.map(c => {
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
            const displayApps = rawApps.map(dId => APPLICATIONS.find(a => a.id === dId)?.name || dId.toUpperCase());

            const displayCourses = (t.courses && t.courses.length > 0)
              ? t.courses
              : (t.course ? (Array.isArray(t.course) ? t.course : t.course.split(', ')) : ['AIML']);

            const displayBatches = (t.targetBatches && t.targetBatches.length > 0)
              ? t.targetBatches
              : (t.batch ? [t.batch] : ['202601']);

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

              {/* Field 2: Target Applications Dropdown (Multi-Select) */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Applications ({selectedApplications.length} Selected)
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
                    {selectedApplications.map(id => APPLICATIONS.find(a => a.id === id)?.name || id).join(', ')}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                {appDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl p-2 shadow-2xl z-30 space-y-1 max-h-48 overflow-y-auto">
                    {APPLICATIONS.map(app => {
                      const isSelected = selectedApplications.includes(app.id);
                      return (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => toggleApplication(app.id)}
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
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#ef5323]" />
                        <span>MCQ Question File</span>
                      </label>                      
                      
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

                    {mcqSourceMode === 'upload' ? (
                      <div className="bg-white border-2 border-dashed border-slate-200 hover:border-[#ef5323] transition rounded-xl p-3.5 text-center relative cursor-pointer group">
                        <input
                          type="file"
                          accept=".csv,.json,.xlsx,.pdf,.txt"
                          onChange={handleMcqFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        {mcqUploadedFile ? (
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-left truncate">
                              <FileText className="w-5 h-5 text-[#ef5323] shrink-0" />
                              <div className="truncate">
                                <p className="font-bold text-slate-800 truncate">{mcqUploadedFile.name}</p>
                                <p className="text-[10px] text-slate-400">{mcqUploadedFile.size} • Ready for test</p>
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
                            <p className="text-[10px] text-slate-400">Upload .CSV, .JSON, .XLSX, .PDF, or .TXT file</p>
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
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>Practical / Compiler File</span>
                      </label>

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

                    {practicalSourceMode === 'upload' ? (
                      <div className="bg-white border-2 border-dashed border-slate-200 hover:border-purple-500 transition rounded-xl p-3.5 text-center relative cursor-pointer group">
                        <input
                          type="file"
                          accept=".json,.py,.sql,.zip,.pdf,.txt"
                          onChange={handlePracticalFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        {practicalUploadedFile ? (
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-left truncate">
                              <Code2 className="w-5 h-5 text-purple-600 shrink-0" />
                              <div className="truncate">
                                <p className="font-bold text-slate-800 truncate">{practicalUploadedFile.name}</p>
                                <p className="text-[10px] text-slate-400">{practicalUploadedFile.size} • Ready for test</p>
                              </div>
                            </div>
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full shrink-0">
                              Uploaded
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Upload className="w-5 h-5 text-slate-400 group-hover:text-purple-600 mx-auto transition" />
                            <p className="text-xs font-bold text-slate-700">Click or Drag & Drop Practical File</p>
                            <p className="text-[10px] text-slate-400">Upload .JSON, .PY, .SQL, .ZIP, .PDF, or .TXT file</p>
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
                    {COURSE_OPTIONS.map(c => {
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
