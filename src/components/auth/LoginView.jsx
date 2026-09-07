import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DOMAINS, COURSES, BATCHES } from '../../data/mockQuestionBank';
import { User, Lock, KeyRound, Sparkles, GraduationCap, Users } from 'lucide-react';
import logo from '../../assets/DV-Logo.png';

export const LoginView = () => {
  const { loginStudent, loginAdmin } = useAuth();
  const [role, setRole] = useState('student');

  // Student Form states
  const [lmsId, setLmsId] = useState('STU-99214');
  const [studentName, setStudentName] = useState('Alex Mercer');
  const [studentCourse, setStudentCourse] = useState('AIML');
  const [studentBatch, setStudentBatch] = useState('202601');

  // Admin Form states
  const [adminEmail, setAdminEmail] = useState('admin@platform.com');
  const [adminPassword, setAdminPassword] = useState('admin123');

  const [errorMessage, setErrorMessage] = useState('');

  const handleStudentSubmit = (e) => {
    e.preventDefault();
    if (!lmsId.trim()) {
      setErrorMessage('Please enter your LMS ID.');
      return;
    }
    loginStudent(lmsId, studentName, studentCourse, studentBatch);
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    const res = loginAdmin(adminEmail, adminPassword);
    if (!res.success) {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans select-none">
      {/* Top Bar */}
      <header className="w-full bg-white border-b border-slate-200 px-6 sm:px-8 py-3.5 flex items-center shadow-xs sticky top-0 z-20">
        <div className="flex items-center gap-3.5">
          <img src={logo} alt="DV Analytics" className="h-8 sm:h-9 object-contain" />
          <div className="h-5 w-px bg-slate-200"></div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
            Secure Assessment & Compiler Testing Portal
          </span>
        </div>
      </header>

      {/* Hero & Login Section */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 sm:py-10 flex flex-col items-center justify-center gap-8">
        {/* Upper Heading Section */}
        <div className="text-center space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-sky-800 shadow-2xs">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Multi-Domain MCQ & Live Compiler Platform</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
            Secure Assessment Platform with Live Coding & Course/Batch Scheduling
          </h1>
        </div>

        {/* Authentication Card Below Heading */}
        <div className="w-full max-w-lg">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
            {/* Role Tab Selector */}
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 mb-6 text-xs font-bold">
              <button
                onClick={() => { setRole('student'); setErrorMessage(''); }}
                className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  role === 'student' ? 'bg-white text-sky-800 shadow-xs border border-slate-200 font-extrabold' : 'text-slate-500'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Student LMS Portal</span>
              </button>

              <button
                onClick={() => { setRole('admin'); setErrorMessage(''); }}
                className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  role === 'admin' ? 'bg-white text-sky-800 shadow-xs border border-slate-200 font-extrabold' : 'text-slate-500'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="bg-rose-50 text-rose-800 border border-rose-200 p-3 rounded-xl text-xs font-medium mb-4">
                {errorMessage}
              </div>
            )}

            {/* Student Form */}
            {role === 'student' ? (
              <form onSubmit={handleStudentSubmit} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Student LMS ID</label>
                  <input
                    type="text"
                    required
                    value={lmsId}
                    onChange={(e) => setLmsId(e.target.value)}
                    placeholder="e.g. STU-99214"
                    className="w-full bg-slate-50 border border-slate-300 px-3.5 py-2.5 rounded-xl font-mono text-slate-900 outline-none focus:border-sky-500 focus:bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 px-3.5 py-2.5 rounded-xl text-slate-900 outline-none focus:border-sky-500 focus:bg-white font-semibold"
                  />
                </div>

                {/* Course and Batch selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                      <span>Course</span>
                    </label>
                    <select
                      value={studentCourse}
                      onChange={(e) => setStudentCourse(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl font-semibold text-slate-800 outline-none focus:border-sky-500"
                    >
                      {COURSES.filter(c => c !== 'All Courses').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-sky-600" />
                      <span>Batch</span>
                    </label>
                    <select
                      value={studentBatch}
                      onChange={(e) => setStudentBatch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl font-mono font-semibold text-slate-800 outline-none focus:border-sky-500"
                    >
                      {BATCHES.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Demo Quick-Fill Options */}
                <div className="pt-1">
                  <span className="text-[11px] text-slate-500 font-medium block mb-1.5">Quick Demo Student Profiles:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setLmsId('STU-99214'); setStudentName('Alex Mercer'); setStudentCourse('AIML'); setStudentBatch('202601'); }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-mono border border-slate-300"
                    >
                      AIML (Alex / 202601)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLmsId('STU-48102'); setStudentName('Jordan Vance'); setStudentCourse('FDE'); setStudentBatch('202101'); }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-mono border border-slate-300"
                    >
                      FDE (Jordan / 202101)
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-100 transition mt-3"
                >
                  Authenticate & Launch Student Portal
                </button>
              </form>
            ) : (
              /* Admin Form */
              <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Admin Email Address</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 px-3.5 py-2.5 rounded-xl text-slate-900 outline-none focus:border-sky-500 focus:bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 px-3.5 py-2.5 rounded-xl text-slate-900 outline-none focus:border-sky-500 focus:bg-white font-semibold"
                  />
                </div>

                <div className="pt-2">
                  <span className="text-[11px] text-slate-500 font-medium block mb-1.5">Admin Demo Credentials:</span>
                  <button
                    type="button"
                    onClick={() => { setAdminEmail('admin@platform.com'); setAdminPassword('admin123'); }}
                    className="px-2.5 py-1 bg-sky-50 text-sky-800 rounded-lg text-[11px] font-mono border border-sky-200"
                  >
                    Auto-fill (admin@platform.com / admin123)
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-100 transition mt-4"
                >
                  Log In to Admin Console
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-3.5 px-6 text-center text-xs text-slate-500 font-medium">
        Secure Assessment & Multi-Domain Testing Platform &copy; 2026. Clean Light Mode Theme.
      </footer>
    </div>
  );
};
