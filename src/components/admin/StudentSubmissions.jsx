import React, { useMemo } from 'react';
import { useExam } from '../../context/ExamContext';
import { FileSpreadsheet, ExternalLink, BarChart2, Calendar } from 'lucide-react';

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

export const StudentSubmissions = () => {
  const { submissions, scheduledTests } = useExam();

  // Derive unique assessment titles & stats for Test-Wise Reports
  const testWiseStats = useMemo(() => {
    const map = new Map();
    submissions.forEach(s => {
      const title = s.testTitle || 'Untitled Assessment';
      if (!map.has(title)) {
        const matchTest = (scheduledTests || []).find(t => t.title === title);
        const testDate = matchTest?.scheduledStartFormatted || matchTest?.scheduledFor || (s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '2026-09-07');
        
        const rawApps = matchTest?.domains || (matchTest?.domain ? [matchTest.domain] : [s.domain || 'python']);
        const apps = rawApps.map(dId => APPLICATIONS.find(a => a.id === dId)?.name || dId.toUpperCase());
        
        const courses = matchTest?.courses || (matchTest?.course ? (Array.isArray(matchTest.course) ? matchTest.course : [matchTest.course]) : ['AIML']);
        
        const batches = matchTest?.targetBatches || (matchTest?.batch ? [matchTest.batch] : ['202601']);

        map.set(title, { 
          title, 
          date: testDate, 
          apps, 
          courses, 
          batches, 
          total: 0, 
          clean: 0, 
          warning: 0, 
          disqualified: 0 
        });
      }
      const stat = map.get(title);
      stat.total += 1;
      const status = (s.cheatingStatus || '').toLowerCase();
      if (status.includes('disqualified')) {
        stat.disqualified += 1;
      } else if (status.includes('warning') && !status.includes('clean')) {
        stat.warning += 1;
      } else {
        stat.clean += 1;
      }
    });
    return Array.from(map.values());
  }, [submissions, scheduledTests]);

  // Open Test Report in a NEW TAB
  const openTestReportInNewTab = (testTitle) => {
    const targetUrl = `${window.location.origin}/admin/report?test=${encodeURIComponent(testTitle || 'all')}`;
    window.open(targetUrl, '_blank');
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Test-Wise Submission Reports Cards Section Only */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-[#051f40] uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#ef5323]" />
              Test-Wise Submission Summaries
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium shrink-0">
            {testWiseStats.length} Assessments Active
          </span>
        </div>

        {testWiseStats.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            No assessment submission records available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {testWiseStats.map((stat, idx) => (
              <div
                key={idx}
                onClick={() => openTestReportInNewTab(stat.title)}
                className="bg-slate-50 hover:bg-orange-50/30 p-5 rounded-2xl border border-slate-200/80 hover:border-orange-300 transition duration-150 cursor-pointer group flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#051f40] group-hover:text-[#ef5323] transition leading-snug line-clamp-2">
                      {stat.title}
                    </h4>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#ef5323] shrink-0 mt-0.5" />
                  </div>

                  {/* Clean Metadata Section: Application, Course, Batch */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2 text-xs mt-3">
                    {/* Application */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium w-20 shrink-0">Application:</span>
                      <div className="flex flex-wrap gap-1">
                        {stat.apps.map((appName, i) => (
                          <span key={i} className="bg-slate-100 border border-slate-200/60 text-slate-800 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                            {appName}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Course */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium w-20 shrink-0">Course:</span>
                      <div className="flex flex-wrap gap-1">
                        {stat.courses.map((cName, i) => (
                          <span key={i} className="bg-slate-100 border border-slate-200/60 text-[#051f40] font-semibold px-2 py-0.5 rounded-md text-[11px]">
                            {cName}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Batch */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium w-20 shrink-0">Batch:</span>
                      <div className="flex flex-wrap gap-1">
                        {stat.batches.map((bId, i) => (
                          <span key={i} className="bg-slate-100 border border-slate-200/60 text-slate-700 font-mono text-[11px] px-2 py-0.5 rounded-md">
                            {bId}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Date & Attempt Stats */}
                  <div className="space-y-1.5 mt-3 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#051f40] font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-[#ef5323]" />
                      <span>Date: <strong>{stat.date}</strong></span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span><strong>{stat.total}</strong> Attempts</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium"><strong>{stat.clean}</strong> Clean</span>
                      <span>•</span>
                      <span className="text-rose-700 font-medium"><strong>{stat.disqualified}</strong> Disqualified</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#051f40] group-hover:text-[#ef5323] transition">
                  <span className="flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-orange-400" />
                    <span>View Full Test Report</span>
                  </span>
                  <span>&rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
