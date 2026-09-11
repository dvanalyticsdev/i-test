import React, { useState } from 'react';
import { useExam } from '../../context/ExamContext';
import { DOMAINS } from '../../data/mockQuestionBank';
import { BulkUploadModal } from './BulkUploadModal';
import { AssessmentDetailView } from './AssessmentDetailView';
import { 
  Search, 
  Upload, 
  FileText, 
  Code2, 
  Calendar, 
  GraduationCap, 
  Users, 
  Layers, 
  ChevronRight, 
  LayoutGrid, 
  List, 
  Trash2, 
  CheckCircle2,
  BookOpen
} from 'lucide-react';

export const QuestionBankManager = () => {
  const { assessments, deleteAssessment, addAssessment } = useExam();
  
  // View State
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'mcq' | 'compiler'
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'Active' | 'Published' | 'Draft'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name' | 'questions'

  // If an assessment is selected, render the detailed assessment viewer
  if (selectedAssessmentId) {
    return (
      <AssessmentDetailView
        assessmentId={selectedAssessmentId}
        onBack={() => setSelectedAssessmentId(null)}
      />
    );
  }

  // Filter assessments
  const filteredAssessments = (assessments || []).filter(item => {
    const matchesDomain = selectedDomain === 'all' || item.domain === selectedDomain;
    const matchesType = selectedType === 'all' || item.assessmentType === selectedType;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      item.title.toLowerCase().includes(query) ||
      item.domain?.toLowerCase().includes(query) ||
      item.course?.toLowerCase().includes(query) ||
      item.id?.toLowerCase().includes(query);

    return matchesDomain && matchesType && matchesStatus && matchesSearch;
  });

  // Sort assessments
  const sortedAssessments = [...filteredAssessments].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.dateCreated) - new Date(a.dateCreated);
    }
    if (sortBy === 'oldest') {
      return new Date(a.dateCreated) - new Date(b.dateCreated);
    }
    if (sortBy === 'name') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'questions') {
      return (b.questions?.length || 0) - (a.questions?.length || 0);
    }
    return 0;
  });

  // Calculate high-level summary KPIs
  const totalAssessments = assessments?.length || 0;
  const totalQuestionsPool = (assessments || []).reduce((acc, a) => acc + (a.questions?.length || 0), 0);
  const activeAssessmentsCount = (assessments || []).filter(a => a.status === 'Active').length;
  const uniqueDomainsCount = new Set((assessments || []).map(a => a.domain)).size;

  const handleDelete = (e, id, title) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${title}" from the repository?`)) {
      deleteAssessment(id);
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Top Banner & KPI Stats */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#ef5323]" />
            <h2 className="text-base font-bold text-[#051f40]">Assessment Document Repository</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            File-organized assessment repository. Click any assessment document to inspect questions, options, and answer keys.
          </p>
        </div>

        <button
          onClick={() => setIsBulkOpen(true)}
          className="inline-flex items-center gap-2 bg-[#051f40] hover:bg-[#1b2a60] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
        >
          <Upload className="w-4 h-4 text-orange-400" />
          <span>Import Assessment (Excel / PDF / JSON)</span>
        </button>
      </div>

      {/* KPI Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assessment Files</span>
            <span className="text-2xl font-black text-[#051f40] mt-0.5 block">{totalAssessments}</span>
            <span className="text-[10px] text-slate-400 font-medium">Ready documents</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Question Pool</span>
            <span className="text-2xl font-black text-[#051f40] mt-0.5 block">{totalQuestionsPool}</span>
            <span className="text-[10px] text-slate-400 font-medium">Across all files</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Testing</span>
            <span className="text-2xl font-black text-emerald-700 mt-0.5 block">{activeAssessmentsCount}</span>
            <span className="text-[10px] text-emerald-600 font-medium">Assigned live</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Covered Domains</span>
            <span className="text-2xl font-black text-[#051f40] mt-0.5 block">{uniqueDomainsCount}</span>
            <span className="text-[10px] text-slate-400 font-medium">Specializations</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search, Filter, and Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assessment name, domain, course..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-[#ef5323] focus:bg-white transition font-medium"
            />
          </div>

          {/* Domain Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#ef5323] cursor-pointer"
            >
              <option value="all">All Domains</option>
              {DOMAINS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Assessment Type Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#ef5323] cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="mcq">MCQ Assessment</option>
              <option value="compiler">Compiler Assessment</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#ef5323] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#ef5323] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="questions">Question Count</option>
            </select>
          </div>
        </div>

        {/* View mode toggle & Results count */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div>
            Showing <strong>{sortedAssessments.length}</strong> of {totalAssessments} assessment files
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-[#051f40] shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-[#051f40] shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Table Display */}
      {sortedAssessments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-3 shadow-xs">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Assessment Files Found</h3>
          <button
            onClick={() => { setSearchQuery(''); setSelectedDomain('all'); setSelectedType('all'); setSelectedStatus('all'); }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAssessments.map((assessment) => {
            const isCompiler = assessment.assessmentType === 'compiler';
            const qCount = assessment.questions?.length || 0;

            return (
              <div
                key={assessment.id}
                onClick={() => setSelectedAssessmentId(assessment.id)}
                className="group bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 p-5 shadow-xs hover:shadow-md transition duration-150 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                        {isCompiler ? <Code2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="font-mono text-[10px] font-bold text-slate-400 block leading-tight">
                          {assessment.id}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          {assessment.domain?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase border ${
                        assessment.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : assessment.status === 'Published'
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {assessment.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#051f40] group-hover:text-[#ef5323] transition leading-snug line-clamp-2">
                      {assessment.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {assessment.description || 'Assessment file with verified answer keys.'}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1.5 font-medium text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Course:</span>
                      <strong className="text-slate-800">{assessment.course || 'All Courses'}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Batches:</span>
                      <strong className="text-slate-700 font-mono text-[10px] truncate max-w-[140px]">
                        {assessment.targetBatches?.join(', ') || 'All Batches'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold">
                    {qCount} {isCompiler ? 'Labs' : 'Qs'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(e, assessment.id, assessment.title)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition"
                      title="Delete assessment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-xs font-bold text-[#051f40] group-hover:text-[#ef5323] flex items-center gap-0.5 transition">
                      <span>View File</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-3.5">Document ID</th>
                <th className="p-3.5">Assessment Name</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Domain</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedAssessments.map((assessment) => (
                <tr
                  key={assessment.id}
                  onClick={() => setSelectedAssessmentId(assessment.id)}
                  className="hover:bg-slate-50/70 cursor-pointer transition"
                >
                  <td className="p-3.5 font-mono text-[11px] text-slate-700 font-bold">{assessment.id}</td>
                  <td className="p-3.5 font-bold text-[#051f40]">{assessment.title}</td>
                  <td className="p-3.5 uppercase font-mono text-[10px] text-slate-500">{assessment.assessmentType}</td>
                  <td className="p-3.5 text-slate-600">{assessment.domain}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      {assessment.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-bold text-[#051f40]">View File &rarr;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onUploadSuccess={(newAssessment) => {
          if (newAssessment && addAssessment) {
            addAssessment(newAssessment);
          }
        }}
      />
    </div>
  );
};
