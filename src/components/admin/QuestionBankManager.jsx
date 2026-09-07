import React, { useState } from 'react';
import { useExam } from '../../context/ExamContext';
import { DOMAINS } from '../../data/mockQuestionBank';
import { BulkUploadModal } from './BulkUploadModal';
import { Search, Plus, Upload, Filter, FileText, CheckCircle2 } from 'lucide-react';

export const QuestionBankManager = () => {
  const { questionBank, bulkUploadQuestions } = useExam();
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Filter questions
  const filteredQuestions = questionBank.filter(q => {
    const matchesDomain = selectedDomain === 'all' || q.domain === selectedDomain;
    const matchesSearch = !searchQuery || (q.question && q.question.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="space-y-6 select-none">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Question Bank Repository</h2>
          <p className="text-xs text-slate-500">
            Total Bank Pool: <strong className="text-sky-700 font-bold">{questionBank.length} Questions</strong> (Students receive a randomized 30-question subset)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Upload Questions</span>
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Bar */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by keyword..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-sky-500"
          />
        </div>

        {/* Domain Filter */}
        <div className="relative">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 outline-none capitalize"
          >
            <option value="all">All 9 Domains</option>
            {DOMAINS.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
            <tr>
              <th className="p-3 w-16">ID</th>
              <th className="p-3 w-32">Domain</th>
              <th className="p-3">Question Prompt</th>
              <th className="p-3 w-28">Type</th>
              <th className="p-3 w-24">Options</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredQuestions.map((q) => (
              <tr key={q.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono text-[11px] text-slate-500">{q.id}</td>
                <td className="p-3">
                  <span className="bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                    {q.domain?.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-3 font-semibold text-slate-900 leading-snug">
                  {q.question || q.title}
                </td>
                <td className="p-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${q.type === 'compiler' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'}`}>
                    {q.type?.toUpperCase()}
                  </span>
                </td>
                <td className="p-3 text-slate-500 font-mono text-[11px]">
                  {q.options ? `${q.options.length} Choices` : 'Compiler Code'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onUploadSuccess={(newList) => bulkUploadQuestions(newList)}
      />
    </div>
  );
};
