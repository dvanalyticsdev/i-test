import React, { useState } from 'react';
import { useExam } from '../../context/ExamContext';
import { DOMAINS, COURSES, BATCHES, ASSESSMENT_TYPES } from '../../data/mockQuestionBank';
import { Calendar, Plus, Clock, Code2, FileText, CheckCircle2, Search, ChevronDown, Check } from 'lucide-react';

export const TestScheduler = () => {
  const { scheduledTests, addScheduledTest, questionBank } = useExam();
  const [showModal, setShowModal] = useState(false);

  // Top Filter States
  const [filterCourse, setFilterCourse] = useState('All Courses');
  const [filterBatch, setFilterBatch] = useState('All Batches');

  // Modal Form States
  const [testTitle, setTestTitle] = useState('');
  const [assessmentType, setAssessmentType] = useState('compiler'); // 'compiler' | 'mcq' | 'hybrid'
  const [course, setCourse] = useState('AIML');
  const [selectedBatches, setSelectedBatches] = useState(['202601', '202101']);
  const [domain, setDomain] = useState('python');
  const [duration, setDuration] = useState(45);
  const [servedCount, setServedCount] = useState(30);

  // Batches Dropdown State inside Modal
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const [batchSearchQuery, setBatchSearchQuery] = useState('');

  // Batches Filter Dropdown State at Top
  const [topBatchDropdownOpen, setTopBatchDropdownOpen] = useState(false);
  const [topBatchSearchQuery, setTopBatchSearchQuery] = useState('');

  const filteredBatches = BATCHES.filter(b => b.toLowerCase().includes(batchSearchQuery.toLowerCase()));
  const topFilteredBatches = BATCHES.filter(b => b.toLowerCase().includes(topBatchSearchQuery.toLowerCase()));

  const toggleBatchSelection = (batchId) => {
    if (selectedBatches.includes(batchId)) {
      setSelectedBatches(selectedBatches.filter(b => b !== batchId));
    } else {
      setSelectedBatches([...selectedBatches, batchId]);
    }
  };

  const handleCreateTest = (e) => {
    e.preventDefault();
    const newTest = {
      id: `TEST-${domain.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      title: testTitle || `${domain.toUpperCase()} ${assessmentType === 'compiler' ? 'Hands-On Compiler Test' : 'Assessment'}`,
      domain: domain,
      assessmentType: assessmentType,
      course: course,
      targetBatches: selectedBatches.length > 0 ? selectedBatches : ['All Batches'],
      durationMinutes: Number(duration),
      totalPoolSize: questionBank.length,
      servedMcqCount: assessmentType === 'compiler' ? 0 : Number(servedCount),
      status: 'Active',
      scheduledFor: '2026-09-07 (Live)'
    };
    addScheduledTest(newTest);
    setShowModal(false);
    setTestTitle('');
  };

  // Filter scheduled tests by course and batch
  const displayedTests = scheduledTests.filter(t => {
    const matchesCourse = filterCourse === 'All Courses' || t.course === 'All Courses' || t.course === filterCourse;
    const matchesBatch = filterBatch === 'All Batches' || t.targetBatches?.includes('All Batches') || t.targetBatches?.includes(filterBatch);
    return matchesCourse && matchesBatch;
  });

  return (
    <div className="space-y-6 select-none">
      {/* Top Header & Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Assessment Scheduler & Configurator</h2>
            <p className="text-xs text-slate-500">
              Schedule Compiler-Only or MCQ Assessment tests, assign target courses & batches, and enforce anti-cheat policies.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Assessment</span>
          </button>
        </div>

        {/* Filter Dropdowns matching Images 2 & 3 */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs font-semibold">
          <span className="text-slate-500 font-bold">Filter By:</span>

          {/* Courses Dropdown */}
          <div className="relative">
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-semibold outline-none focus:border-sky-500 focus:bg-white"
            >
              {COURSES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Batches Dropdown with Search */}
          <div className="relative">
            <button
              onClick={() => setTopBatchDropdownOpen(!topBatchDropdownOpen)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-semibold flex items-center gap-2"
            >
              <span>{filterBatch}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {topBatchDropdownOpen && (
              <div className="absolute left-0 mt-1 w-56 bg-slate-900 text-slate-200 border border-slate-700 rounded-xl p-2 shadow-2xl z-30 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={topBatchSearchQuery}
                    onChange={(e) => setTopBatchSearchQuery(e.target.value)}
                    placeholder="Search batches..."
                    className="w-full bg-slate-950 border border-slate-800 pl-8 pr-2 py-1 rounded text-[11px] text-slate-200 outline-none"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                  <button
                    onClick={() => { setFilterBatch('All Batches'); setTopBatchDropdownOpen(false); }}
                    className={`w-full text-left px-2 py-1 rounded flex items-center justify-between ${filterBatch === 'All Batches' ? 'bg-sky-600 text-white font-bold' : 'hover:bg-slate-800'}`}
                  >
                    <span>All Batches</span>
                  </button>
                  {topFilteredBatches.map(b => (
                    <button
                      key={b}
                      onClick={() => { setFilterBatch(b); setTopBatchDropdownOpen(false); }}
                      className={`w-full text-left px-2 py-1 rounded flex items-center justify-between ${filterBatch === b ? 'bg-sky-600 text-white font-bold' : 'hover:bg-slate-800'}`}
                    >
                      <span>{b}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedTests.map((t) => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {t.domain.replace('_', ' ')}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                  t.assessmentType === 'compiler'
                    ? 'bg-purple-100 text-purple-900 border border-purple-300'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {t.assessmentType === 'compiler' ? 'Compiler Assessment Only (Hands-On Code)' : 'MCQ Assessment'}
                </span>
              </div>

              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {t.status}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 leading-snug">{t.title}</h3>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 font-medium text-slate-600">
              <div className="flex justify-between">
                <span>Target Course:</span>
                <strong className="text-slate-900 font-bold">{t.course || 'All Courses'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Assigned Batches:</span>
                <strong className="text-sky-700 font-mono">{t.targetBatches?.join(', ') || 'All Batches'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Question Format:</span>
                <strong className="text-slate-900">
                  {t.assessmentType === 'compiler' ? '5 Live Compiler Labs (No MCQs)' : `Serve ${t.servedMcqCount} of ${t.totalPoolSize} MCQs + Labs`}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Duration Limit:</span>
                <strong className="text-slate-900">{t.durationMinutes} Minutes</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Assessment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-extrabold text-slate-900">Schedule New Assessment</h3>
              <span className="text-xs text-sky-700 font-bold bg-sky-50 px-2.5 py-0.5 rounded-full">Admin Configurator</span>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-4 text-xs font-medium">
              {/* Assessment Title */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Assessment Title</label>
                <input
                  type="text"
                  required
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="e.g. Hands-On Python & SQL Compiler Test"
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl outline-none focus:border-sky-500 focus:bg-white text-slate-900 font-semibold"
                />
              </div>

              {/* Assessment Type Selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Assessment Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {ASSESSMENT_TYPES.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setAssessmentType(type.id)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        assessmentType === type.id
                          ? 'bg-sky-50 border-sky-500 text-sky-950 font-bold ring-1 ring-sky-400'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs font-bold leading-tight">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Course & Target Batches */}
              <div className="grid grid-cols-2 gap-3">
                {/* Target Course Dropdown */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Course</label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 rounded-xl outline-none focus:border-sky-500 font-semibold text-slate-800"
                  >
                    {COURSES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Target Batches Multi-Select Dropdown with Search Box */}
                <div className="relative">
                  <label className="block text-slate-700 font-bold mb-1">Target Batches</label>
                  <button
                    type="button"
                    onClick={() => setBatchDropdownOpen(!batchDropdownOpen)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 rounded-xl outline-none text-left font-semibold text-slate-800 flex items-center justify-between"
                  >
                    <span className="truncate">
                      {selectedBatches.length === 0 ? 'Select Batches...' : `${selectedBatches.length} Batches Selected`}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </button>

                  {/* Multi-Select Dropdown Overlay matching Image 3 */}
                  {batchDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-64 bg-slate-900 text-slate-200 border border-slate-700 rounded-xl p-3 shadow-2xl z-40 space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={batchSearchQuery}
                          onChange={(e) => setBatchSearchQuery(e.target.value)}
                          placeholder="Search batches..."
                          className="w-full bg-slate-950 border border-slate-800 pl-8 pr-2 py-1.5 rounded text-[11px] text-slate-200 outline-none"
                        />
                      </div>

                      <div className="max-h-44 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                        {filteredBatches.map(batchId => {
                          const isChecked = selectedBatches.includes(batchId);
                          return (
                            <label
                              key={batchId}
                              className="flex items-center gap-2 p-1.5 hover:bg-slate-800 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleBatchSelection(batchId)}
                                className="rounded text-sky-500 focus:ring-0 accent-sky-500"
                              />
                              <span className={isChecked ? 'text-sky-300 font-bold' : 'text-slate-300'}>{batchId}</span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedBatches([...BATCHES])}
                          className="text-[10px] text-sky-400 hover:underline"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setBatchDropdownOpen(false)}
                          className="text-[10px] bg-sky-600 text-white px-2 py-0.5 rounded font-bold"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Primary Domain & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Primary Domain</label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl outline-none font-semibold text-slate-800 capitalize"
                  >
                    {DOMAINS.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Served MCQs count (only visible for MCQ Assessment) */}
              {assessmentType === 'mcq' && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Served MCQs (Randomized Subset)</label>
                  <input
                    type="number"
                    value={servedCount}
                    onChange={(e) => setServedCount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl outline-none font-semibold text-slate-800"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md"
                >
                  Confirm & Schedule Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
