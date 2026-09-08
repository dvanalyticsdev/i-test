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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <img src={logo} alt="DV Logo" className="h-8 object-contain" />
          <div className="h-5 w-px bg-slate-200"></div>
          <div>
            <h1 className="text-sm font-bold text-slate-900">Student Assessment Portal</h1>
            <p className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>LMS ID: <strong className="text-sky-700 font-mono">{user?.lmsId}</strong></span>
              <span>•</span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">{studentCourse}</span>
              <span>•</span>
              <span className="bg-sky-50 text-sky-800 px-2 py-0.5 rounded font-mono font-bold">Batch: {studentBatch}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-xs font-medium text-slate-700">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{user?.name}</span>
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

        {/* Assigned Assessments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Assigned Assessments</h2>
              <span className="text-xs text-slate-500 font-medium">Filtered for {studentCourse} | Batch {studentBatch}</span>
            </div>
            <span className="text-xs bg-sky-50 text-sky-700 px-3 py-1 rounded-full font-bold border border-sky-200">
              {assignedTests.length} Live Exams Assigned
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedTests.map((test) => (
              <div
                key={test.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="bg-sky-100 text-sky-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      {test.domain.replace('_', ' ')}
                    </span>

                    {/* Assessment Type Badge */}
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      test.assessmentType === 'compiler'
                        ? 'bg-purple-100 text-purple-900 border border-purple-300'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {test.assessmentType === 'compiler' ? 'Compiler Assessment Only (Hands-On Code)' : 'MCQ Assessment'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {test.title}
                  </h3>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1 mb-4 text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span>Target Course:</span>
                      <strong className="text-slate-800">{test.course}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Assigned Batches:</span>
                      <strong className="text-sky-700 font-mono">{test.targetBatches?.join(', ')}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration & Format:</span>
                      <strong className="text-slate-800">
                        {test.durationMinutes} Mins • {test.assessmentType === 'compiler' ? '5 Compiler Labs' : `Serve ${test.servedMcqCount} MCQs`}
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    // Immediately transition interface into true browser fullscreen mode using Fullscreen API on user gesture
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
                  }}
                  className={`w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 ${
                    test.assessmentType === 'compiler' ? 'bg-purple-700 hover:bg-purple-800 shadow-purple-100' : 'bg-sky-600 hover:bg-sky-700 shadow-sky-100'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {test.assessmentType === 'compiler' ? 'Launch Live Compiler Test Session' : 'Start Secured Test Session'}
                  </span>
                </button>
              </div>
            ))}
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
