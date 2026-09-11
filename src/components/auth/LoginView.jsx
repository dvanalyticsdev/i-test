import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/DV-Logo.png';

export const LoginView = ({ isAdminMode = false, navigateTo }) => {
  const { loginStudent, loginAdmin } = useAuth();

  // Student Form states
  const [lmsId, setLmsId] = useState('');

  // Admin Form states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!lmsId.trim()) {
      setErrorMessage('Please enter your LMS ID.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    const res = await loginStudent(lmsId.trim());
    setIsSubmitting(false);
    if (!res.success) setErrorMessage(res.message);
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setErrorMessage('Please enter both admin email and password.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);
    const res = await loginAdmin(adminEmail.trim(), adminPassword.trim());
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.message);
    }
  };

  const handleSwitchMode = (targetPath) => {
    setErrorMessage('');
    if (navigateTo) {
      navigateTo(targetPath);
    } else {
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans select-none antialiased relative">
      {/* Header Bar */}
      <header className="w-full px-4 sm:px-8 py-3.5 flex justify-between items-center border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <img src={logo} alt="DV Analytics" className="h-8 sm:h-9 object-contain" />
          <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>
          
          {/* Header Branding - "DV ELITE TEST" ONLY for Student Portal */}
          {!isAdminMode ? (
            <span className="text-base sm:text-lg font-extrabold text-[#ef5323] tracking-wide uppercase">
              DV ELITE TEST
            </span>
          ) : (
            <span className="text-base sm:text-lg font-extrabold text-[#051f40] tracking-wide uppercase">
              ADMIN PORTAL
            </span>
          )}
        </div>

        {/* Navigation Switcher between separate URLs */}
        {isAdminMode ? (
          <button
            type="button"
            onClick={() => handleSwitchMode('/student/login')}
            className="text-xs font-bold text-[#051f40] hover:text-[#ef5323] px-3.5 py-2 rounded-xl border border-slate-200 hover:border-[#ef5323]/40 bg-white hover:bg-slate-50 transition cursor-pointer"
          >
            Student Portal
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleSwitchMode('/admin/login')}
            className="text-xs font-bold text-[#051f40] hover:text-[#ef5323] px-3.5 py-2 rounded-xl border border-slate-200 hover:border-[#ef5323]/40 bg-white hover:bg-slate-50 transition cursor-pointer"
          >
            Admin Login
          </button>
        )}
      </header>

      {/* Main Centered Login Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:py-12 flex items-center justify-center relative z-10">
        <div className="w-full max-w-md">
          {/* Main Floating Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8 relative overflow-hidden transition-all">
            
            {/* Top Accent Line */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${isAdminMode ? 'bg-[#051f40]' : 'bg-[#ef5323]'}`} />

            {/* Centered DV Logo directly above the login form */}
            <div className="flex flex-col items-center justify-center text-center mb-6 pt-2">
              <img 
                src={logo} 
                alt="DV Analytics Logo" 
                className="h-12 sm:h-14 w-auto object-contain mb-3" 
              />
              
              {!isAdminMode ? (
                <div>
                  <h2 className="text-lg font-bold text-[#051f40] tracking-tight">Student Portal Sign-In</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Enter your student details to begin your session</p>
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-bold text-[#051f40] tracking-tight">
                    Administrator Authentication
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Authorized access for faculty & administrators</p>
                </div>
              )}
            </div>

            {/* Error Alert Banner */}
            {errorMessage && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl text-center animate-in fade-in">
                {errorMessage}
              </div>
            )}

            {/* Student Login Form */}
            {!isAdminMode ? (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                {/* Field 1: LMS ID */}
                <div>
                  <label className="block text-xs font-bold text-[#051f40] uppercase tracking-wider mb-1.5">
                    LMS ID
                  </label>
                  <input
                    type="text"
                    required
                    value={lmsId}
                    onChange={(e) => setLmsId(e.target.value)}
                    placeholder="Enter your LMS ID"
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 font-medium text-sm rounded-xl border border-slate-200 focus:border-[#ef5323] focus:ring-2 focus:ring-[#ef5323]/15 outline-none transition-all"
                  />
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3.5 px-6 bg-[#051f40] hover:bg-[#1b2a60] active:bg-[#031428] text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0 text-center cursor-pointer"
                >
                  {isSubmitting ? 'VERIFYING...' : 'LOGIN'}
                </button>
              </form>
            ) : (
              /* Admin Login Form */
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                {/* Admin Email */}
                <div>
                  <label className="block text-xs font-bold text-[#051f40] uppercase tracking-wider mb-1.5">
                    Admin ID
                  </label>
                  <input
                    type="text"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Admin ID"
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 font-medium text-sm rounded-xl border border-slate-200 focus:border-[#ef5323] focus:ring-2 focus:ring-[#ef5323]/15 outline-none transition-all"
                  />
                </div>

                {/* Admin Password */}
                <div>
                  <label className="block text-xs font-bold text-[#051f40] uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 font-medium text-sm rounded-xl border border-slate-200 focus:border-[#ef5323] focus:ring-2 focus:ring-[#ef5323]/15 outline-none transition-all"
                  />
                </div>

                {/* Submit Admin Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3.5 px-6 bg-[#051f40] hover:bg-[#1b2a60] active:bg-[#031428] text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0 text-center cursor-pointer"
                >
                  {isSubmitting ? 'VERIFYING...' : 'LOGIN'}
                </button>

              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white relative z-10">
        DV Analytics &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
};
