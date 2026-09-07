import React, { useState } from 'react';
import { useExam } from '../../context/ExamContext';
import { DOMAINS, COURSES } from '../../data/mockQuestionBank';
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
  Clock, 
  FileCode2, 
  Filter, 
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  Plus,
  FileSpreadsheet
} from 'lucide-react';
import { downloadAssessmentExcelTemplate } from '../../utils/assessmentDocumentUtils';

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
    <div className="space-y-6 select-none animate-fadeIn">
      {/* Top Banner & KPI Stats */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-extrabold text-slate-900">Assessment Document Repository</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            File-organized assessment repository. Click any assessment document to inspect questions, options, and verified answer keys.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadAssessmentExcelTemplate}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl font-bold text-xs border border-slate-300 transition"
            title="Download blank sample Excel assessment template"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel Template</span>
          </button>

          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-sky-100 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Import Assessment (Excel / PDF / JSON)</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Assessment Files</span>
            <span className="text-2xl font-extrabold text-slate-900">{totalAssessments}</span>
            <span className="text-[10px] text-slate-500 block font-medium">Ready documents</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Question Pool</span>
            <span className="text-2xl font-extrabold text-slate-900">{totalQuestionsPool}</span>
            <span className="text-[10px] text-slate-500 block font-medium">Questions across all files</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Active Testing</span>
            <span className="text-2xl font-extrabold text-emerald-700">{activeAssessmentsCount}</span>
            <span className="text-[10px] text-slate-500 block font-medium">Live assigned assessments</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Covered Domains</span>
            <span className="text-2xl font-extrabold text-slate-900">{uniqueDomainsCount}</span>
            <span className="text-[10px] text-slate-500 block font-medium">Domain specializations</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search, Filter, Sort, and View Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assessment name, domain, course..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-sky-500 focus:bg-white transition font-medium"
            />
          </div>

          {/* Domain Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 outline-none capitalize focus:border-sky-500 focus:bg-white"
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
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 focus:bg-white"
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
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 focus:bg-white"
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
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 focus:bg-white"
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
            Showing <strong className="text-slate-800 font-bold">{sortedAssessments.length}</strong> of {totalAssessments} assessment files
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-bold ${
                viewMode === 'grid' ? 'bg-white text-sky-700 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-bold ${
                viewMode === 'table' ? 'bg-white text-sky-700 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Document List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {sortedAssessments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Assessment Files Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No assessment documents match your current filter and search criteria. Try clearing filters or uploading a new assessment.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedDomain('all'); setSelectedType('all'); setSelectedStatus('all'); }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Document Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAssessments.map((assessment) => {
            const isCompiler = assessment.assessmentType === 'compiler';
            const qCount = assessment.questions?.length || 0;

            return (
              <div
                key={assessment.id}
                onClick={() => setSelectedAssessmentId(assessment.id)}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-sky-400 p-5 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top Accent Color Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  isCompiler ? 'bg-purple-500' : 'bg-sky-500'
                }`} />

                <div className="space-y-3">
                  {/* File Header / Badges */}
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isCompiler ? 'bg-purple-50 text-purple-600' : 'bg-sky-50 text-sky-600'
                      }`}>
                        {isCompiler ? <Code2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="font-mono text-[10px] font-bold text-slate-400 block leading-tight">
                          {assessment.id}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase text-slate-500">
                          {assessment.domain?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                        assessment.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : assessment.status === 'Published'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {assessment.status}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition leading-snug line-clamp-2">
                      {assessment.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {assessment.description || 'Comprehensive evaluation assessment with complete answer keys.'}
                    </p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1.5 font-medium text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-slate-400" />
                        <span>Course:</span>
                      </span>
                      <strong className="text-slate-800">{assessment.course || 'All Courses'}</strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>Batches:</span>
                      </span>
                      <strong className="text-sky-700 font-mono text-[10px] truncate max-w-[140px]">
                        {assessment.targetBatches?.join(', ') || 'All Batches'}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Created:</span>
                      </span>
                      <strong className="text-slate-700 font-mono">{assessment.dateCreated}</strong>
                    </div>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                    <span className="bg-sky-100 text-sky-900 px-2 py-0.5 rounded-md font-mono text-[11px]">
                      {qCount} {isCompiler ? 'Labs' : 'Qs'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {isCompiler ? 'Compiler Labs' : 'Questions'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(e, assessment.id, assessment.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete assessment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    
                    <span className="text-xs font-bold text-sky-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                      <span>View File</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Structured Document Table View */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-3 w-28">Document ID</th>
                <th className="p-3">Assessment Name</th>
                <th className="p-3 w-36">Type</th>
                <th className="p-3 w-32">Domain / Course</th>
                <th className="p-3 w-28">Date Created</th>
                <th className="p-3 w-28">Questions</th>
                <th className="p-3 w-28">Status</th>
                <th className="p-3 text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedAssessments.map((assessment) => {
                const isCompiler = assessment.assessmentType === 'compiler';
                const qCount = assessment.questions?.length || 0;

                return (
                  <tr
                    key={assessment.id}
                    onClick={() => setSelectedAssessmentId(assessment.id)}
                    className="hover:bg-sky-50/50 cursor-pointer transition"
                  >
                    <td className="p-3 font-mono text-[11px] text-sky-700 font-bold">
                      {assessment.id}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 leading-snug">{assessment.title}</div>
                      <span className="text-[11px] text-slate-500 line-clamp-1">{assessment.description}</span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        isCompiler ? 'bg-purple-100 text-purple-900 border border-purple-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isCompiler ? <Code2 className="w-3 h-3 text-purple-600" /> : <FileText className="w-3 h-3 text-sky-600" />}
                        <span>{isCompiler ? 'Compiler' : 'MCQ'}</span>
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800 capitalize">{assessment.domain?.replace('_', ' ')}</div>
                      <span className="text-[11px] text-slate-500 font-medium">{assessment.course || 'All Courses'}</span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-600">
                      {assessment.dateCreated}
                    </td>
                    <td className="p-3">
                      <span className="bg-sky-50 text-sky-800 font-mono font-bold px-2 py-0.5 rounded border border-sky-200">
                        {qCount} {isCompiler ? 'Labs' : 'Qs'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          assessment.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : assessment.status === 'Published'
                            ? 'bg-sky-50 text-sky-800 border-sky-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {assessment.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAssessmentId(assessment.id); }}
                        className="inline-flex items-center gap-1 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold px-3 py-1.5 rounded-lg border border-sky-200 transition"
                      >
                        <span>Open</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onUploadSuccess={(newAssessment) => addAssessment(newAssessment)}
      />
    </div>
  );
};
