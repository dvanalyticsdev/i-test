import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { QuestionBankManager } from './QuestionBankManager';
import { TestScheduler } from './TestScheduler';
import { StudentSubmissions } from './StudentSubmissions';
import { 
  Database, 
  Calendar, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight 
} from 'lucide-react';
import logo from '../../assets/DV-Logo.png';

export const AdminDashboard = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('scheduler'); // 'scheduler' | 'submissions'
  
  // Desktop collapse state (default open)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Mobile drawer open state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      id: 'scheduler',
      label: 'Test Scheduler',
      shortLabel: 'Scheduler',
      icon: Calendar
    },
    {
      id: 'submissions',
      label: 'Student Submissions',
      shortLabel: 'Submissions',
      icon: Users
    }
  ];

  const handleSelectTab = (id) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs sticky top-0 z-40">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-3">
            <img src={logo} alt="DV Analytics" className="h-7 sm:h-8 object-contain" />
            <div className="h-4 w-px bg-slate-200"></div>
            <h1 className="text-xs sm:text-sm font-bold text-[#051f40] tracking-wide uppercase">
              Administrator Console
            </h1>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Body Area: Sidebar + Full Width Expanding Workspace */}
      <div className="flex-1 flex relative w-full">
        {/* Mobile Backdrop Overlay */}
        {isMobileMenuOpen && (
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-40 md:hidden transition-opacity"
          />
        )}

        {/* Left Side Navigation Panel */}
        <aside
          onClick={(e) => {
            // When collapsed on desktop, clicking anywhere on the collapsed sidebar expands it
            if (isSidebarCollapsed && window.innerWidth >= 768) {
              setIsSidebarCollapsed(false);
            }
          }}
          className={`
            fixed md:sticky top-[53px] left-0 h-[calc(100vh-53px)] bg-white border-r border-slate-200 z-40
            flex flex-col justify-between transition-all duration-300 ease-in-out shadow-xs group/sidebar
            ${/* Mobile Drawer logic */ ''}
            ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
            ${/* Desktop Collapsed vs Expanded width */ ''}
            ${isSidebarCollapsed ? 'md:w-16 md:cursor-pointer md:hover:border-sky-300' : 'md:w-64 lg:w-72'}
          `}
          title={isSidebarCollapsed ? "Click sidebar to expand" : undefined}
        >
          {/* Subtle edge toggle tab to collapse/expand anytime */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsSidebarCollapsed(!isSidebarCollapsed);
            }}
            className={`hidden md:flex absolute -right-3 top-5 w-6 h-6 bg-white border border-slate-300 hover:border-sky-500 rounded-full items-center justify-center text-slate-500 hover:text-sky-600 shadow-sm hover:shadow transition z-50`}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>

          {/* Sidebar Top: Nav Options */}
          <div className="p-3 space-y-2">
            {/* Mobile-only close button */}
            <div className="flex items-center justify-end pb-1 md:hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileMenuOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Buttons List */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`
                      w-full flex items-center rounded-xl transition-all duration-200 text-left relative group
                      ${isSidebarCollapsed ? 'md:justify-center md:px-2 md:py-3' : 'px-3.5 py-3 justify-between'}
                      ${
                        isActive
                          ? 'bg-[#051f40] text-white font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
                      }
                    `}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-orange-400' : 'text-slate-500 group-hover:text-[#051f40]'}`} />
                      
                      {/* Label visible when not collapsed or on mobile */}
                      <span
                        className={`text-xs truncate transition-opacity duration-200 ${
                          isSidebarCollapsed ? 'md:hidden' : 'block'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {/* Tooltip on collapsed state for desktop */}
                    {isSidebarCollapsed && (
                      <div className="hidden md:group-hover:flex absolute left-full ml-2.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl whitespace-nowrap z-50 pointer-events-none items-center gap-1.5">
                        <span>{item.label}</span>
                        <ChevronRight className="w-3 h-3 text-sky-400" />
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>


        </aside>

        {/* Main Content Area - Expands to occupy full available width */}
        <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 transition-all duration-300">
          {activeTab === 'questions' && <QuestionBankManager />}
          {activeTab === 'scheduler' && <TestScheduler />}
          {activeTab === 'submissions' && <StudentSubmissions />}
        </main>
      </div>
    </div>
  );
};

