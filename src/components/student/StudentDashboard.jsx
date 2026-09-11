import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useExam } from '../../context/ExamContext';
import { 
  ShieldAlert, 
  Play, 
  Clock, 
  Calendar, 
  FileText, 
  UserCheck, 
  LogOut, 
  Code2, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Award,
  Layers
} from 'lucide-react';
import logo from '../../assets/DV-Logo.png';

const APPLICATIONS_MAP = {
  excel_ai: 'EXCEL AI',
  sql: 'SQL',
  power_bi: 'POWER BI',
  python: 'PYTHON',
  sas: 'SAS',
  ml: 'ML',
  gen_ai: 'GEN AI & AGENTIC AI',
  data_engineering: 'DATA ENGINEERING',
  mlops: 'MLOPS & LLMOPS'
};

export const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { scheduledTests, startExamSession, submissions } = useExam();
  const [activeTab, setActiveTab] = useState('assessments'); // 'assessments' | 'history'

  const studentCourse = user?.course || 'AIML';
  const studentBatch = user?.batch || '202601';

  // Filter scheduled tests created by admin that match student's course & batch
  const assignedTests = (scheduledTests || []).filter(test => {
    const matchesCourse = !test.courses || test.courses.includes('All Courses') || test.courses.includes(studentCourse) || test.course === 'All Courses' || test.course === studentCourse;
    const matchesBatch = !test.targetBatches || test.targetBatches.includes('All Batches') || test.targetBatches.includes(studentBatch);
    return matchesCourse && matchesBatch;
  });

  // Filter completed test submissions for this student
  const studentSubmissions = (submissions || []).filter(
    s => s.studentId === user?.lmsId || s.studentId === user?.id || s.studentName === user?.name
  );

  // Helper to compute 3-Stage Test Lifecycle State for student
  const getTestStage = (test) => {
    if (!test) return { stage: 'Scheduled', label: 'UPCOMING', canLaunch: false };
    if (!test.scheduledStartIso || !test.scheduledEndIso) {
      if (test.status === 'Closed') return { stage: 'Closed', label: 'EXPIRED', canLaunch: false };
      return { stage: 'Live', label: 'LIVE NOW', canLaunch: true };
    }
    const now = new Date().getTime();
    const start = new Date(test.scheduledStartIso).getTime();
    const end = new Date(test.scheduledEndIso).getTime();

    if (now < start) return { stage: 'Scheduled', label: 'UPCOMING', canLaunch: false };
    if (now > end) return { stage: 'Closed', label: 'EXPIRED', canLaunch: false };
    return { stage: 'Live', label: 'LIVE NOW', canLaunch: true };
  };

  const handleLaunchExam = (test) => {
    if (!test) return;
    try {
      const docEl = document.documentElement;
      const requestFull = 
        docEl.requestFullscreen ||
        docEl.webkitRequestFullscreen ||
        docEl.mozRequestFullScreen ||
        docEl.msRequestFullscreen;
      if (requestFull) {
        requestFull.call(docEl).catch(() => {});
      }
    } catch (e) {
      // Safe fallback
    }
    startExamSession(test, user);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-3 sm:gap-4">
          <img src={logo} alt="DV Logo" className="h-9 w-auto object-contain" />
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Student Assessment Portal</h1>
            <p className="text-xs text-slate-600 flex flex-wrap items-center gap-2 mt-0.5 font-medium">
              <span>LMS ID: <strong className="text-[#051f40] font-mono font-bold">{user?.lmsId || 'STU-48102'}</strong></span>
              <span className="text-slate-300">•</span>
              <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-md font-bold text-[11px]">{studentCourse}</span>
              <span className="text-slate-300">•</span>
              <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-md font-mono font-bold text-[11px]">Batch: {studentBatch}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-900">{user?.name || 'Student Candidate'}</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        
        {/* Student Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('assessments')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition ${
                activeTab === 'assessments'
                  ? 'bg-[#051f40] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className={`w-4 h-4 ${activeTab === 'assessments' ? 'text-orange-400' : 'text-slate-400'}`} />
              <span>Assigned Assessments</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'assessments' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {assignedTests.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition ${
                activeTab === 'history'
                  ? 'bg-[#051f40] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Award className={`w-4 h-4 ${activeTab === 'history' ? 'text-orange-400' : 'text-slate-400'}`} />
              <span>Submission History</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'history' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {studentSubmissions.length}
              </span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
            Course: <strong>{studentCourse}</strong> | Batch: <strong>{studentBatch}</strong>
          </span>
        </div>

        {/* TAB 1: Assigned Assessments */}
        {activeTab === 'assessments' && (
          <div className="space-y-6">
            {/* Anti-Cheat Integrity Warning Notice Banner */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-white border border-amber-200 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
              <div className="w-9 h-9 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-amber-950 flex items-center gap-2">
                  Proctoring Security Policy Notice
                  <span className="bg-amber-200 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Strict 2 Warnings</span>
                </h3>
                <p className="text-xs text-amber-900/80 mt-1 leading-relaxed font-medium">
                  Assessments strictly enforce automated proctoring including fullscreen lockdown, tab-switching detection, copy-paste protection, and multi-display tracking.
                  <strong> Exceeding 2 warnings will automatically terminate your test and mark your score as DISQUALIFIED.</strong>
                </p>
              </div>
            </div>

            {/* Admin-Scheduled Tests List */}
            {assignedTests.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-xs">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No Scheduled Assessments Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  There are currently no active or upcoming assessments scheduled by the administrator for <strong>{studentCourse}</strong> (Batch <strong>{studentBatch}</strong>).
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedTests.map((test) => {
                  const { stage, label, canLaunch } = getTestStage(test);
                  const isHybrid = test.assessmentType === 'hybrid';
                  const isPractical = test.assessmentType === 'compiler' || test.assessmentType === 'practical';

                  // Application & metadata badges
                  const rawApps = test.domains || (test.domain ? [test.domain] : ['python']);
                  const displayApps = rawApps.map(dId => APPLICATIONS_MAP[dId] || dId.toUpperCase());
                  const displayCourses = test.courses || (test.course ? (Array.isArray(test.course) ? test.course : [test.course]) : [studentCourse]);
                  const displayBatches = test.targetBatches || [studentBatch];

                  return (
                    <div
                      key={test.id}
                      className={`bg-white border rounded-2xl p-5 shadow-xs transition duration-150 flex flex-col justify-between space-y-4 ${
                        canLaunch ? 'border-emerald-300 hover:border-emerald-500 hover:shadow-md' : 'border-slate-200/80'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                            isHybrid
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : isPractical
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-orange-50 text-[#ef5323] border-orange-200'
                          }`}>
                            {isHybrid ? 'MCQ + Practical' : isPractical ? 'Practical Only' : 'MCQ Assessment'}
                          </span>

                          {/* Status Badge */}
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
                            {label}
                          </span>
                        </div>

                        {/* Test Title */}
                        <h3 className="text-base font-bold text-[#051f40] leading-snug">{test.title}</h3>

                        {/* Test Metadata Box */}
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-2 text-xs">
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
                        </div>
                      </div>

                      {/* Footer Info & Action Button */}
                      <div className="space-y-3 pt-2.5 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#ef5323]" />
                            <span>Start: <strong className="text-[#051f40] font-bold">{test.scheduledStartFormatted || test.scheduledFor || 'Live'}</strong></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Duration: <strong className="text-slate-800">{test.durationMinutes} mins</strong></span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!canLaunch}
                          onClick={() => canLaunch && handleLaunchExam(test)}
                          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                            canLaunch
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              : stage === 'Scheduled'
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          }`}
                        >
                          {canLaunch ? (
                            <>
                              <Play className="w-4 h-4 text-emerald-200 fill-current" />
                              <span>Start Assessment Now</span>
                            </>
                          ) : stage === 'Scheduled' ? (
                            <span>Upcoming Test (Not Started Yet)</span>
                          ) : (
                            <span>Assessment Test Closed</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Submission History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-[#051f40]">Your Submission Records & Verified Scores</h3>
                <span className="text-xs text-slate-500 font-medium">LMS ID: {user?.lmsId || 'STU-48102'}</span>
              </div>

              {studentSubmissions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  No completed assessment records found for your LMS ID.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Assessment Title</th>
                        <th className="p-3.5">Submitted At</th>
                        <th className="p-3.5">Score</th>
                        <th className="p-3.5">Proctoring Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentSubmissions.map((sub, idx) => {
                        const isDisqualified = (sub.cheatingStatus || sub.status || '').toLowerCase().includes('disqualified');
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3.5 font-bold text-[#051f40]">{sub.testTitle}</td>
                            <td className="p-3.5 text-slate-500">{sub.submittedAt}</td>
                            <td className="p-3.5 font-extrabold text-slate-900">{sub.score}</td>
                            <td className="p-3.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  isDisqualified
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}
                              >
                                {isDisqualified ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                {sub.cheatingStatus || sub.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
