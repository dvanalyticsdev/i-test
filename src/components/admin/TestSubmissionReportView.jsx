import React, { useMemo } from 'react';
import { useExam } from '../../context/ExamContext';
import logo from '../../assets/DV-Logo.png';
import { Printer, Download, CheckCircle2, AlertTriangle, ShieldAlert, FileText, ArrowLeft, Users, Award, Shield } from 'lucide-react';

export const TestSubmissionReportView = ({ testTitle: propTestTitle }) => {
  const { submissions, scheduledTests } = useExam();

  // Extract testTitle from prop or URL search param
  const testTitle = useMemo(() => {
    if (propTestTitle) return propTestTitle;
    const params = new URLSearchParams(window.location.search);
    return params.get('test') || params.get('report') || '';
  }, [propTestTitle]);

  // Filter submissions for this specific test, or all if none specified
  const testSubmissions = useMemo(() => {
    if (!testTitle || testTitle === 'all') return submissions;
    return submissions.filter(s => s.testTitle === testTitle || s.testTitle?.toLowerCase() === testTitle.toLowerCase());
  }, [submissions, testTitle]);

  // Find matching scheduled test details if available
  const testMeta = useMemo(() => {
    return scheduledTests.find(t => t.title === testTitle) || {
      title: testTitle || 'Overall Assessment Report',
      domain: 'Analytics & Coding',
      durationMinutes: 45,
      servedMcqCount: 30
    };
  }, [scheduledTests, testTitle]);

  // Calculate statistics
  const totalSubmissions = testSubmissions.length;
  const cleanCount = testSubmissions.filter(s => s.cheatingStatus?.toLowerCase().includes('clean')).length;
  const warningCount = testSubmissions.filter(s => s.cheatingStatus?.toLowerCase().includes('warning') && !s.cheatingStatus?.toLowerCase().includes('clean')).length;
  const disqualifiedCount = testSubmissions.filter(s => s.cheatingStatus?.toLowerCase().includes('disqualified')).length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (testSubmissions.length === 0) return;
    const headers = ['Student Name', 'LMS ID', 'Assessment Title', 'Score', 'Proctoring Status', 'Compiler Status', 'Submitted At'];
    const rows = testSubmissions.map(s => [
      `"${s.studentName || ''}"`,
      `"${s.studentId || ''}"`,
      `"${s.testTitle || ''}"`,
      `"${s.score || ''}"`,
      `"${s.cheatingStatus || ''}"`,
      `"${s.compilerStatus || ''}"`,
      `"${s.submittedAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Report_${(testTitle || 'Submissions').replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-8 select-none print:p-0 print:bg-white">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Navigation & Action Controls (Hidden on Print) */}
        <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.close()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Close Tab</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs font-bold text-slate-700">Test-Wise Executive Submission Report</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#051f40] hover:bg-[#1b2a60] text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Printable Executive Report Container */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
          
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-4">
              <img src={logo} alt="DV Analytics" className="h-10 object-contain" />
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-[#051f40] tracking-tight">
                  {testTitle || 'All Assessments'} Submission Report
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official Candidate Performance & Anti-Cheat Audit Summary
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500 space-y-1">
              <div><strong className="text-slate-700 font-bold">Report Date:</strong> {new Date().toLocaleDateString()}</div>
              <div><strong className="text-slate-700 font-bold">Generated By:</strong> Administrator Portal</div>
              <div className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px] uppercase">
                Confidential Document
              </div>
            </div>
          </div>

          {/* Key Metrics Executive Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Total Attempts
              </div>
              <div className="text-2xl font-black text-[#051f40]">{totalSubmissions}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Candidates evaluated</div>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 text-center">
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Clean Passes
              </div>
              <div className="text-2xl font-black text-emerald-700">{cleanCount}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">0 Security Warnings</div>
            </div>

            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 text-center">
              <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Warnings Logged
              </div>
              <div className="text-2xl font-black text-amber-700">{warningCount}</div>
              <div className="text-[10px] text-amber-600 mt-0.5">Minor infractions</div>
            </div>

            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200/80 text-center">
              <div className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Disqualified
              </div>
              <div className="text-2xl font-black text-rose-700">{disqualifiedCount}</div>
              <div className="text-[10px] text-rose-600 mt-0.5">Terminated on strikes</div>
            </div>
          </div>

          {/* Candidate Breakdown Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#051f40] uppercase tracking-wide">
                Candidate Breakdown ({testSubmissions.length})
              </h2>
              <span className="text-xs text-slate-400">Detailed Results</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Candidate Name</th>
                    <th className="p-3">LMS ID</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Proctoring Status</th>
                    <th className="p-3">Code / Compiler Status</th>
                    <th className="p-3 text-right">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {testSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                        No candidate submission records found for this assessment.
                      </td>
                    </tr>
                  ) : (
                    testSubmissions.map((sub, index) => {
                      const isDisqualified = sub.cheatingStatus?.toLowerCase().includes('disqualified');
                      const isClean = sub.cheatingStatus?.toLowerCase().includes('clean');

                      return (
                        <tr key={sub.id || index} className="hover:bg-slate-50/70">
                          <td className="p-3 font-mono text-slate-400 text-[11px]">{index + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{sub.studentName}</td>
                          <td className="p-3 font-mono text-slate-600 text-[11px]">{sub.studentId}</td>
                          <td className="p-3 font-bold text-slate-900">{sub.score}</td>
                          <td className="p-3">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isDisqualified 
                                ? 'bg-rose-100 text-rose-800' 
                                : isClean 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {sub.cheatingStatus}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-600">{sub.compilerStatus}</td>
                          <td className="p-3 text-right text-slate-500 text-[11px]">
                            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Document Footer */}
          <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>DV Analytics Executive Assessment Engine</span>
            <span>Generated for Evaluation & Compliance Purposes</span>
          </div>

        </div>
      </div>
    </div>
  );
};
