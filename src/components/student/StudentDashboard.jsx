import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useExam } from '../../context/ExamContext';
import { DOMAINS } from '../../data/mockQuestionBank';
import { ShieldAlert, Play, Clock, CheckCircle2, FileText, UserCheck, AlertTriangle, LogOut, Code2, GraduationCap, Users } from 'lucide-react';
import logo from '../../assets/DV-Logo.png';

export const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { scheduledTests, startExamSession, submissions } = useExam();

  // Filter tests assigned to student's course & batch
  const studentCourse = user?.course || 'AIML';
  const studentBatch = user?.batch || '202601';

  const assignedTests = scheduledTests.filter(test => {
    const matchesCourse = test.course === 'All Courses' || test.course === studentCourse;
    const matchesBatch = test.targetBatches?.includes('All Batches') || test.targetBatches?.includes(studentBatch);
    return matchesCourse && matchesBatch;
  });

  // Filter completed tests for this student
  const studentSubmissions = submissions.filter(s => s.studentId === user?.lmsId || s.studentId === user?.id);

  // 8 Target Test Categories matching the reference wireframe
  const TEST_CATEGORIES = [
    {
      id: 'excel',
      title: 'EXCEL TEST',
      domain: 'excel_ai',
      matcher: (t) => t.domain === 'excel_ai' || t.title.toLowerCase().includes('excel')
    },
    {
      id: 'sql',
      title: 'SQL TEST',
      domain: 'sql',
      matcher: (t) => t.domain === 'sql' || t.title.toLowerCase().includes('sql')
    },
    {
      id: 'python',
      title: 'PYTHON TEST',
      domain: 'python',
      matcher: (t) => t.domain === 'python' || t.title.toLowerCase().includes('python')
    },
    {
      id: 'sas',
      title: 'SAS TEST',
      domain: 'sas',
      matcher: (t) => t.domain === 'sas' || t.title.toLowerCase().includes('sas')
    },
    {
      id: 'ml',
      title: 'ML TEST',
      domain: 'ml',
      matcher: (t) => t.domain === 'ml' || t.title.toLowerCase().includes('machine learning') || (t.title.toLowerCase().includes(' ml ') && !t.title.toLowerCase().includes('html'))
    },
    {
      id: 'gen_ai',
      title: 'GEN AI TEST',
      domain: 'gen_ai',
      matcher: (t) => t.domain === 'gen_ai' || t.title.toLowerCase().includes('gen ai') || t.title.toLowerCase().includes('generative ai')
    },
    {
      id: 'mlops',
      title: 'MLOPS TEST',
      domain: 'mlops',
      matcher: (t) => (t.domain === 'mlops' && !t.title.toLowerCase().includes('llmops')) || (t.title.toLowerCase().includes('mlops') && !t.title.toLowerCase().includes('llmops'))
    },
    {
      id: 'llmops',
      title: 'LLMOPS TEST',
      domain: 'llmops',
      matcher: (t) => t.domain === 'llmops' || t.title.toLowerCase().includes('llmops')
    }
  ];

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
      // Handled safely
    }
    startExamSession(test, user);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <img src={logo} alt="DV Logo" className="h-9 object-contain" />
          <div className="h-6 w-px bg-slate-200"></div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Student Assessment Portal</h1>
            <p className="text-xs sm:text-[13px] text-slate-600 flex items-center gap-2.5 mt-0.5">
              <span>LMS ID: <strong className="text-sky-700 font-mono font-bold text-xs sm:text-[13px]">{user?.lmsId}</strong></span>
              <span className="text-slate-400">•</span>
              <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-md font-bold text-xs sm:text-[12px]">{studentCourse}</span>
              <span className="text-slate-400">•</span>
              <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded-md font-mono font-bold text-xs sm:text-[12px]">Batch: {studentBatch}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full text-sm font-medium text-slate-700">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-900 text-sm">{user?.name}</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full p-6 space-y-6 flex-1">
        {/* Anti-Cheat Integrity Warning Box */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-white border border-amber-200 rounded-2xl p-4 flex items-start gap-4 shadow-xs">
          <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              Proctoring Guard Policy Notice
              <span className="bg-amber-200 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Strict 2 Warnings</span>
            </h3>
            <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
              All assessments strictly enforce automated anti-cheating controls including fullscreen lockdown, tab-switching detection, copy-paste blocking, and multi-display monitoring.
              <strong> Exceeding 2 warnings will automatically terminate your test, log you out, and mark your score as DISQUALIFIED (CHEATING DETECTED).</strong>
            </p>
          </div>
        </div>

        {/* Assigned Assessments - 8 Test Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Assigned Assessments</h2>
              <span className="text-xs text-slate-500 font-medium">Filtered for {studentCourse} | Batch {studentBatch}</span>
            </div>
            <span className="text-xs bg-sky-50 text-sky-700 px-3 py-1 rounded-full font-bold border border-sky-200">
              {assignedTests.length} Live Exams Assigned
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEST_CATEGORIES.map((cat) => {
              const activeTest = assignedTests.find((t) => cat.matcher(t));
              const isActive = Boolean(activeTest);

              return (
                <div key={cat.id} className="flex flex-col">
                  {/* Card Rectangle - with subtle light blue shade */}
                  <div
                    onClick={() => isActive && handleLaunchExam(activeTest)}
                    className={`h-40 sm:h-44 rounded-2xl flex flex-col items-center justify-center p-4 text-center select-none transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-b from-sky-50 via-sky-50/50 to-white border border-sky-200 hover:border-sky-400 hover:shadow-md hover:scale-[1.02] shadow-xs cursor-pointer'
                        : 'bg-gradient-to-b from-sky-50/30 to-slate-50/50 border border-slate-200 opacity-60 cursor-default'
                    }`}
                  >
                    <span
                      className={`text-base sm:text-lg tracking-wider uppercase leading-snug ${
                        isActive ? 'text-slate-900 font-bold' : 'text-slate-400 font-semibold'
                      }`}
                    >
                      {cat.title}
                    </span>
                  </div>

                  {/* Dual Action / Status Buttons */}
                  <div className="flex items-center gap-2 mt-2 w-full">
                    <button
                      type="button"
                      disabled={!isActive}
                      onClick={() => isActive && handleLaunchExam(activeTest)}
                      className={`flex-1 py-1.5 px-2 text-center text-xs uppercase font-bold tracking-wider rounded-lg transition-colors select-none ${
                        isActive
                          ? 'bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 shadow-xs cursor-pointer'
                          : 'bg-slate-100 text-slate-400/50 border border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      ACTIVE
                    </button>
                    <div
                      className={`flex-1 py-1.5 px-2 text-center text-xs uppercase tracking-wider rounded-lg select-none ${
                        isActive
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 font-medium'
                          : 'bg-slate-200 text-slate-600 border border-slate-300 font-semibold'
                      }`}
                    >
                      IN-ACTIVE
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* History / Previous Submissions */}
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 mb-3">Your Submission History</h2>
          {studentSubmissions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
              No completed assessment records found for LMS ID {user?.lmsId}.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-3">Test Title</th>
                    <th className="p-3">Submitted At</th>
                    <th className="p-3">Score Record</th>
                    <th className="p-3">Proctoring Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {studentSubmissions.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{sub.testTitle}</td>
                      <td className="p-3 text-slate-500">{sub.submittedAt}</td>
                      <td className="p-3 font-bold text-slate-800">{sub.score}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            sub.status.includes('DISQUALIFIED')
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
