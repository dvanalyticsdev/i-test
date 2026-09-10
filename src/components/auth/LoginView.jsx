import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, User } from 'lucide-react';
import logo from '../../assets/DV-Logo.png';

export const LoginView = () => {
  const { loginStudent, loginAdmin } = useAuth();
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Student Form states
  const [lmsId, setLmsId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
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
    if (!studentName.trim()) {
      setErrorMessage('Please enter your Name.');
      return;
    }
    setErrorMessage('');
    loginStudent(lmsId.trim(), studentName.trim(), studentCourse, studentBatch, mobileNo.trim());
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setErrorMessage('Please enter both admin email and password.');
      return;
    }
    setErrorMessage('');
    const res = loginAdmin(adminEmail.trim(), adminPassword.trim());
    if (!res.success) {
      setErrorMessage(res.message);
    }
  };

  const fillDemo = (id, name, course, batch, phone) => {
    setLmsId(id);
    setStudentName(name);
    setStudentCourse(course);
    setStudentBatch(batch);
    setMobileNo(phone);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans select-none antialiased">
      {/* Top Utility Bar with Logo & Admin Switcher */}
      <header className="w-full px-6 py-3.5 flex justify-between items-center border-b border-[#e2e8f0] bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <img src={logo} alt="DV Analytics" className="h-9 sm:h-10 object-contain" />
          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
          <span className="text-xs font-bold text-[#051f40] uppercase tracking-wider hidden sm:inline-block">
            Online Examination Portal
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsAdminMode(!isAdminMode);
            setErrorMessage('');
          }}
          className="text-[#051f40] hover:text-[#ef5323] hover:border-[#ef5323] font-bold flex items-center gap-1.5 transition cursor-pointer px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs"
        >
          {isAdminMode ? (
            <>
              <User className="w-3.5 h-3.5" />
              <span>Student Portal</span>
            </>
          ) : (
            <>
              <KeyRound className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </>
          )}
        </button>
      </header>

      {/* Main Centered Authentication Section */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center -mt-6 sm:-mt-10">
        {/* Brand Header */}
        <div className="text-center mb-8 sm:mb-10 select-none">
          <h1 className="text-3xl sm:text-4xl md:text-[2.25rem] font-bold text-[#ef5323] tracking-wide uppercase">
            DV ELITE TEST
          </h1>
        </div>

        {/* Error Banner if any */}
        {errorMessage && (
          <div className="w-full max-w-xl mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium text-center rounded-xl animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Student Form (Structured 3-Row Layout with Simple Clean Styling) */}
        {!isAdminMode ? (
          <form onSubmit={handleStudentSubmit} className="w-full max-w-xl flex flex-col items-center">
            <div className="w-full space-y-3.5">
              {/* Row 1: LMS ID */}
              <div className="flex items-stretch shadow-xs rounded-xl">
                <div className="bg-[#051f40] text-white font-medium text-xs sm:text-[0.85rem] px-4 sm:px-5 py-3.5 w-36 sm:w-44 flex items-center justify-start tracking-wider uppercase shrink-0 rounded-l-xl select-none">
                  LMS ID :
                </div>
                <input
                  type="text"
                  required
                  value={lmsId}
                  onChange={(e) => setLmsId(e.target.value)}
                  placeholder="STU-99214"
                  className="flex-1 bg-[#f9fafb] hover:bg-[#f3f4f6] focus:bg-white px-4 py-3.5 text-[#1f2937] font-normal text-sm sm:text-[0.95rem] outline-none border border-[#d1d5db] border-l-0 rounded-r-xl focus:border-[#ef5323] focus:ring-2 focus:ring-[#ef5323]/15 transition-all"
                />
              </div>

              {/* Row 2: NAME */}
              <div className="flex items-stretch shadow-xs rounded-xl">
                <div className="bg-[#051f40] text-white font-medium text-xs sm:text-[0.85rem] px-4 sm:px-5 py-3.5 w-36 sm:w-44 flex items-center justify-start tracking-wider uppercase shrink-0 rounded-l-xl select-none">
                  NAME :
                </div>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="flex-1 bg-[#f9fafb] hover:bg-[#f3f4f6] focus:bg-white px-4 py-3.5 text-[#1f2937] font-normal text-sm sm:text-[0.95rem] outline-none border border-[#d1d5db] border-l-0 rounded-r-xl focus:border-[#ef5323] focus:ring-2 focus:ring-[#ef5323]/15 transition-all"
                />
              </div>

              {/* Row 3: MOBILE NO */}
              <div className="flex items-stretch shadow-xs rounded-xl">
                <div className="bg-[#051f40] text-white font-medium text-xs sm:text-[0.85rem] px-4 sm:px-5 py-3.5 w-36 sm:w-44 flex items-center justify-start tracking-wider uppercase shrink-0 rounded-l-xl select-none">
                  MOBILE NO :
                </div>
                <input
                  type="tel"
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value)}
                  placeholder="9876543210"
                  className="flex-1 bg-[#f9fafb] hover:bg-[#f3f4f6] focus:bg-white px-4 py-3.5 text-[#1f2937] font-normal text-sm sm:text-[0.95rem] outline-none border border-[#d1d5db] border-l-0 rounded-r-xl focus:border-[#ef5323] focus:ring-2 focus:ring-[#ef5323]/15 transition-all"
                />
              </div>
            </div>

            {/* Centered Navy LOGIN Button styled simply */}
            <button
              type="submit"
              className="bg-[#051f40] hover:bg-[#1b2a60] active:bg-[#031428] text-white font-medium text-sm sm:text-base tracking-wider uppercase px-16 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer mt-8"
            >
              LOGIN
            </button>

            {/* Discreet Quick Fill links */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
              <span className="text-[11px] text-slate-400 font-medium">Quick Fill:</span>
              <button
                type="button"
                onClick={() => fillDemo('STU-99214', 'Alex Mercer', 'AIML', '202601', '9876543210')}
                className="text-[#051f40] hover:text-[#ef5323] font-semibold underline underline-offset-2 cursor-pointer transition"
              >
                Alex Mercer
              </button>
              <span className="text-slate-300">&bull;</span>
              <button
                type="button"
                onClick={() => fillDemo('STU-48102', 'Jordan Vance', 'FDE', '202101', '9123456780')}
                className="text-[#051f40] hover:text-[#ef5323] font-semibold underline underline-offset-2 cursor-pointer transition"
              >
                Jordan Vance
              </button>
            </div>
          </form>
        ) : (
          /* Admin Login Form */
          <form onSubmit={handleAdminSubmit} className="w-full max-w-xl flex flex-col items-center">
            <div className="text-center mb-6">
              <span className="text-xs font-bold text-[#ef5323] uppercase tracking-[1.5px]">
                Administrator Authentication
              </span>
            </div>

            <div className="w-full space-y-3.5">
              {/* Row 1: EMAIL */}
              <div className="flex items-stretch shadow-xs rounded-xl">
                <div className="bg-[#051f40] text-white font-medium text-xs sm:text-[0.85rem] px-4 sm:px-5 py-3.5 w-36 sm:w-44 flex items-center justify-start tracking-wider uppercase shrink-0 rounded-l-xl select-none">
                  EMAIL :
                </div>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@platform.com"
                  className="flex-1 bg-[#f9fafb] hover:bg-[#f3f4f6] focus:bg-white px-4 py-3.5 text-[#1f2937] font-normal text-sm sm:text-[0.95rem] outline-none border border-[#d1d5db] border-l-0 rounded-r-xl focus:border-[#ef5323] focus:ring-2 focus:ring-[#ef5323]/15 transition-all"
                />
              </div>

              {/* Row 2: PASSWORD */}
              <div className="flex items-stretch shadow-xs rounded-xl">
                <div className="bg-[#051f40] text-white font-medium text-xs sm:text-[0.85rem] px-4 sm:px-5 py-3.5 w-36 sm:w-44 flex items-center justify-start tracking-wider uppercase shrink-0 rounded-l-xl select-none">
                  PASSWORD :
                </div>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-[#f9fafb] hover:bg-[#f3f4f6] focus:bg-white px-4 py-3.5 text-[#1f2937] font-normal text-sm sm:text-[0.95rem] outline-none border border-[#d1d5db] border-l-0 rounded-r-xl focus:border-[#ef5323] focus:ring-2 focus:ring-[#ef5323]/15 transition-all"
                />
              </div>
            </div>

            {/* Admin LOGIN Button */}
            <button
              type="submit"
              className="bg-[#051f40] hover:bg-[#1b2a60] active:bg-[#031428] text-white font-medium text-sm sm:text-base tracking-wider uppercase px-16 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer mt-8"
            >
              LOGIN
            </button>

            <div className="mt-6 flex items-center gap-3 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => {
                  setAdminEmail('admin@platform.com');
                  setAdminPassword('admin123');
                }}
                className="text-[#051f40] hover:text-[#ef5323] font-semibold underline underline-offset-2 cursor-pointer transition"
              >
                Auto-fill Admin Credentials
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="w-full py-4 text-center text-xs text-[#555555]">
        DV Analytics &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
};
