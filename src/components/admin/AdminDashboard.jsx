import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { QuestionBankManager } from './QuestionBankManager';
import { TestScheduler } from './TestScheduler';
import { StudentSubmissions } from './StudentSubmissions';
import { Database, Calendar, Users, BarChart3, LogOut } from 'lucide-react';
import logo from '../../assets/DV-Logo.png';

export const AdminDashboard = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'scheduler' | 'submissions'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <img src={logo} alt="DV Logo" className="h-8 object-contain" />
          <div className="h-5 w-px bg-slate-200"></div>
          <div>
            <h1 className="text-sm font-bold text-slate-900">Administrator Console</h1>
            <span className="text-[11px] text-sky-700 font-bold">Content, Scheduler & Proctoring Control</span>
          </div>
        </div>

        <div className="flex items-center gap-3">

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
      <main className="max-w-7xl mx-auto w-full p-6 space-y-6 flex-1">
        {/* Navigation Tabs */}
        <div className="bg-white border border-slate-200 p-1.5 rounded-2xl flex flex-wrap gap-2 shadow-xs text-xs font-bold">
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex-1 py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'questions'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Question Bank & Bulk Upload</span>
          </button>

          <button
            onClick={() => setActiveTab('scheduler')}
            className={`flex-1 py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'scheduler'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Test Scheduler & Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex-1 py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'submissions'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Submissions & Proctor Logs</span>
          </button>
        </div>

        {/* Tab Views */}
        <div>
          {activeTab === 'questions' && <QuestionBankManager />}
          {activeTab === 'scheduler' && <TestScheduler />}
          {activeTab === 'submissions' && <StudentSubmissions />}
        </div>
      </main>
    </div>
  );
};
