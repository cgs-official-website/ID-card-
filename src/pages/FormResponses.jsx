import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Search, Calendar, Download, Trash2, Eye, X, ChevronLeft, ChevronRight,
  ShieldCheck, FileText, CheckCircle2, Award, ExternalLink, RefreshCw, BarChart2, Star, CheckSquare, Square
} from 'lucide-react';
import { exportToCSV, exportToXLSX } from '../utils/excelExporter';
import { 
  fetchFormDetails, fetchFormFields, fetchFormResponses, 
  deleteResponseObj, createAuditLogObj 
} from '../utils/dbHelper';

const FormResponses = () => {
  const { id: formId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Selection
  const [selectedResponseIds, setSelectedResponseIds] = useState([]);
  
  // View Details Modal
  const [activeResponse, setActiveResponse] = useState(null);
  
  // Export Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    format: 'xlsx', // 'xlsx' | 'csv'
    range: 'all' // 'all' | 'filtered' | 'selected'
  });

  // Submission stats
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    week: 0,
    month: 0
  });

  useEffect(() => {
    fetchFormAndResponses();
  }, [formId]);

  const fetchFormAndResponses = async () => {
    try {
      setLoading(true);
      
      // Fetch form title & logo
      const formData = await fetchFormDetails(formId);
      if (!formData) {
        alert("Form not found!");
        navigate('/form-builder');
        return;
      }
      setForm(formData);

      // Fetch Form fields
      const fetchedFields = await fetchFormFields(formId);
      setFields(fetchedFields);

      // Fetch Form Responses
      const fetchedResponses = await fetchFormResponses(formId);
      setResponses(fetchedResponses);

      // Calculate Stats
      calculateStats(fetchedResponses);

    } catch (error) {
      console.error("Error loading responses:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (resList) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;

    resList.forEach(res => {
      if (!res.dateObj) return;
      if (res.dateObj >= todayStart) todayCount++;
      if (res.dateObj >= weekStart) weekCount++;
      if (res.dateObj >= monthStart) monthCount++;
    });

    setStats({
      total: resList.length,
      today: todayCount,
      week: weekCount,
      month: monthCount
    });
  };

  const createAuditLog = async (action, details) => {
    try {
      await createAuditLogObj(action, formId, form?.title || 'Unknown Form', currentUser?.email || 'Admin');
    } catch (err) {
      console.error("Error generating audit log:", err);
    }
  };

  const handleDeleteResponse = async (resId) => {
    if (!window.confirm("Are you sure you want to delete this response?")) return;
    try {
      setLoading(true);
      await deleteResponseObj(formId, resId);
      
      await createAuditLog('Response Deleted', `Deleted Response ID: ${resId}`);
      await fetchFormAndResponses();
      setSelectedResponseIds(prev => prev.filter(id => id !== resId));
    } catch (err) {
      console.error("Error deleting response:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedResponseIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedResponseIds.length} selected responses?`)) return;
    try {
      setLoading(true);
      for (const resId of selectedResponseIds) {
        await deleteResponseObj(formId, resId);
      }

      await createAuditLog('Bulk Responses Deleted', `Deleted ${selectedResponseIds.length} responses.`);
      await fetchFormAndResponses();
      setSelectedResponseIds([]);
    } catch (err) {
      console.error("Bulk delete error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResponse = (resId, checked) => {
    if (checked) {
      setSelectedResponseIds(prev => [...prev, resId]);
    } else {
      setSelectedResponseIds(prev => prev.filter(id => id !== resId));
    }
  };

  const handleSelectAll = (checked, currentItems) => {
    if (checked) {
      const pageIds = currentItems.map(item => item.id);
      setSelectedResponseIds(prev => [...new Set([...prev, ...pageIds])]);
    } else {
      const pageIds = currentItems.map(item => item.id);
      setSelectedResponseIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  // Filter logic
  const filteredResponses = responses.filter(res => {
    // Search filter
    const serializedData = JSON.stringify(res.responseData || {}).toLowerCase();
    const matchesSearch = serializedData.includes(searchTerm.toLowerCase()) || 
                          res.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (res.ipAddress && res.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()));

    // Date range filter
    let matchesDate = true;
    if (res.dateObj) {
      if (dateRange.start) {
        matchesDate = matchesDate && res.dateObj >= new Date(dateRange.start);
      }
      if (dateRange.end) {
        const endDay = new Date(dateRange.end);
        endDay.setHours(23, 59, 59, 999); // Include entire end day
        matchesDate = matchesDate && res.dateObj <= endDay;
      }
    }

    return matchesSearch && matchesDate;
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentResponses = filteredResponses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage);

  // Trigger Excel/CSV Download
  const handleExportSubmit = async () => {
    let listToExport = [];
    if (exportConfig.range === 'all') {
      listToExport = responses;
    } else if (exportConfig.range === 'filtered') {
      listToExport = filteredResponses;
    } else if (exportConfig.range === 'selected') {
      listToExport = responses.filter(r => selectedResponseIds.includes(r.id));
    }

    if (listToExport.length === 0) {
      alert("No responses match the export criteria.");
      return;
    }

    // Set up Column definitions
    const headers = ['Response ID', 'Submission Date', 'User IP'];
    const keys = ['id', 'submittedAtStr', 'ipAddress'];

    const inputFields = fields.filter(f => !['heading', 'paragraph', 'divider', 'imageBlock'].includes(f.type));
    inputFields.forEach(field => {
      headers.push(field.label || field.id);
      keys.push(field.id);
    });

    const exportRows = listToExport.map(res => {
      let formattedDate = '';
      if (res.dateObj) {
        formattedDate = res.dateObj.toLocaleString();
      } else if (res.submittedAt && res.submittedAt !== 'Disabled') {
        const d = new Date(res.submittedAt);
        formattedDate = isNaN(d.getTime()) ? '' : d.toLocaleString();
      }

      const row = {
        id: res.id,
        submittedAtStr: formattedDate,
        ipAddress: (res.ipAddress && res.ipAddress !== 'Disabled' && res.ipAddress !== 'N/A') ? res.ipAddress : ''
      };

      inputFields.forEach(field => {
        let val = res.responseData?.[field.id];
        if (Array.isArray(val)) {
          val = val.join(', ');
        }
        row[field.id] = val !== undefined && val !== null ? val : '';
      });

      return row;
    });

    const safeTitle = form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${safeTitle}_responses_${Date.now()}`;

    if (exportConfig.format === 'csv') {
      exportToCSV(headers, exportRows, keys, fileName);
    } else {
      exportToXLSX(headers, exportRows, keys, fileName);
    }

    await createAuditLog('Response Exported', `Exported ${listToExport.length} rows to ${exportConfig.format.toUpperCase()}.`);
    setShowExportModal(false);
  };

  // Determine active columns to show in main response table (first 3 input fields)
  const previewFields = fields
    .filter(f => !['heading', 'paragraph', 'divider', 'imageBlock'].includes(f.type))
    .slice(0, 3);

  return (
    <div className="space-y-8 bg-transparent">
      
      {/* Upper Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Responses', val: stats.total, border: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400' },
          { label: 'Submissions Today', val: stats.today, border: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400' },
          { label: 'This Week', val: stats.week, border: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400' },
          { label: 'This Month', val: stats.month, border: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400' }
        ].map((s, idx) => (
          <div key={idx} className="bg-[#111111]/80 backdrop-blur-md p-5 rounded-2xl border border-[#222222]/50 shadow-md">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{s.label}</p>
            <div className="flex items-baseline justify-between mt-2">
              <h3 className="text-3xl font-black text-white">{s.val}</h3>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border ${s.border}`}>Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* Control Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex items-center gap-3">
          <Link to="/form-builder" className="p-2 hover:bg-[#1A1A1A] text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-1">{form?.title || 'Form Responses'}</h2>
            <p className="text-gray-400 text-sm font-medium">Browse, delete and export form submission entries</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {selectedResponseIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-5 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold border border-red-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedResponseIds.length})
            </button>
          )}

          <button
            onClick={() => setShowExportModal(true)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-white text-sm font-bold shadow-lg shadow-yellow-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Filter and Date parameters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search response data, IP..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto bg-[#111111]/50 p-2.5 border border-[#222222]/50 rounded-2xl">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold px-1 select-none">
            <Calendar className="w-4 h-4" />
            Date Filter:
          </div>
          <input
            type="date"
            className="rounded-lg border border-[#222222]/50 bg-black/50 px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
          <span className="text-gray-500 text-xs font-bold">to</span>
          <input
            type="date"
            className="rounded-lg border border-[#222222]/50 bg-black/50 px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
          {(dateRange.start || dateRange.end) && (
            <button 
              onClick={() => setDateRange({ start: '', end: '' })}
              className="text-xs text-red-400 font-bold ml-1.5 hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table container */}
      <div className="bg-[#111111]/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#222222]/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-black/60 text-gray-300 font-bold border-b border-[#222222]/50">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <button 
                    onClick={() => {
                      const allSelected = currentResponses.every(r => selectedResponseIds.includes(r.id));
                      handleSelectAll(!allSelected, currentResponses);
                    }}
                    className="p-1 text-gray-500 hover:text-white rounded transition-colors cursor-pointer"
                  >
                    {currentResponses.length > 0 && currentResponses.every(r => selectedResponseIds.includes(r.id)) ? (
                      <CheckSquare className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Response ID</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Submission Date</th>
                {previewFields.map(field => (
                  <th key={field.id} className="px-6 py-4 uppercase tracking-wider text-[10px] hidden md:table-cell max-w-[150px] truncate">
                    {field.label}
                  </th>
                ))}
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Submitter IP</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]/30">
              {loading ? (
                <tr>
                  <td colSpan={5 + previewFields.length} className="px-6 py-12 text-center text-white">
                    <div className="flex flex-col justify-center items-center gap-3">
                      <RefreshCw className="w-6 h-6 text-yellow-500 animate-spin" />
                      <span className="font-semibold">Loading responses...</span>
                    </div>
                  </td>
                </tr>
              ) : currentResponses.length === 0 ? (
                <tr>
                  <td colSpan={5 + previewFields.length} className="px-6 py-16 text-center text-white">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 text-gray-600 mb-2" />
                      <p className="font-medium text-gray-400">No submissions found matching filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentResponses.map((res) => {
                  const subDate = res.dateObj 
                    ? res.dateObj.toLocaleString() 
                    : 'Disabled';
                  const isChecked = selectedResponseIds.includes(res.id);

                  return (
                    <tr key={res.id} className={`hover:bg-[#1A1A1A]/30 transition-colors group ${isChecked ? 'bg-violet-950/10' : ''}`}>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => handleSelectResponse(res.id, !isChecked)}
                          className="p-1 text-gray-500 hover:text-white rounded transition-colors cursor-pointer"
                        >
                          {isChecked ? <CheckSquare className="w-4 h-4 text-yellow-500" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-mono text-xs text-yellow-400 bg-yellow-500/5 px-2 py-0.5 rounded border border-yellow-500/10 font-bold">
                          {res.id.slice(0, 10)}...
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs text-gray-300 font-medium">
                        {subDate}
                      </td>
                      {previewFields.map(field => {
                        let answer = res.responseData?.[field.id];
                        if (Array.isArray(answer)) {
                          answer = answer.join(', ');
                        }
                        const isLink = typeof answer === 'string' && answer.startsWith('http');
                        
                        return (
                          <td key={field.id} className="px-6 py-5 text-gray-400 text-xs truncate max-w-[150px] hidden md:table-cell">
                            {isLink ? (
                              <span className="text-yellow-400 font-bold flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                File Attach
                              </span>
                            ) : (
                              String(answer || '—')
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-5 text-xs text-gray-400 font-medium font-mono">
                        {res.ipAddress || 'Disabled'}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveResponse(res)}
                            className="p-2 bg-gray-900 border border-[#222222]/50 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all cursor-pointer"
                            title="View submission details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteResponse(res.id)}
                            className="p-2 bg-gray-900 border border-[#222222]/50 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-[#222222]/30 bg-black/20">
            <div className="text-sm text-gray-400">
              Showing <span className="font-semibold text-white">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-semibold text-white">{Math.min(indexOfLastItem, filteredResponses.length)}</span> of{" "}
              <span className="font-semibold text-white">{filteredResponses.length}</span> submissions
            </div>
            
            <div className="flex items-center justify-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-[#222222]/50 text-gray-400 hover:text-white rounded-xl disabled:opacity-40 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    currentPage === page 
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md' 
                      : 'border border-[#222222]/50 text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-[#222222]/50 text-gray-400 hover:text-white rounded-xl disabled:opacity-40 cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Response Details View Drawer Modal */}
      {activeResponse && (
        <div className="fixed inset-0 z-[100] flex justify-end p-0 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111111] border-l border-[#222222] w-full max-w-lg h-full flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-300">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#222222]/60 flex justify-between items-center bg-black/40">
              <div>
                <h3 className="text-lg font-black text-white">Response Details</h3>
                <p className="text-[10px] text-yellow-400 font-bold mt-1 font-mono">ID: {activeResponse.id}</p>
              </div>
              <button 
                onClick={() => setActiveResponse(null)}
                className="p-2 hover:bg-[#1A1A1A] rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scroll area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              
              {/* Submission Metadata info */}
              <div className="p-4 rounded-2xl bg-black/40 border border-[#222222]/50 grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-gray-500 uppercase text-[9px] tracking-wider block mb-1">Submitted at:</span>
                  <span className="text-gray-200">{activeResponse.dateObj ? activeResponse.dateObj.toLocaleString() : 'Disabled'}</span>
                </div>
                <div>
                  <span className="text-gray-500 uppercase text-[9px] tracking-wider block mb-1">Submitter IP:</span>
                  <span className="text-gray-200 font-mono">{activeResponse.ipAddress || 'Disabled'}</span>
                </div>
              </div>

              {/* Dynamic Q & A listings */}
              <div className="space-y-5">
                {fields.map((field) => {
                  if (field.type === 'divider') {
                    return <hr key={field.id} className="border-t border-[#222222]/60 py-0.5" />;
                  }
                  if (field.type === 'heading') {
                    return <h4 key={field.id} className="text-sm font-black text-gray-300 pt-2">{field.label}</h4>;
                  }
                  if (['paragraph', 'imageBlock'].includes(field.type)) {
                    return null;
                  }

                  let answer = activeResponse.responseData?.[field.id];
                  const hasAnswer = answer !== undefined && answer !== null && answer !== '';

                  return (
                    <div key={field.id} className="space-y-1.5 p-3 rounded-xl bg-black/20 border border-[#222222]/30">
                      <span className="text-gray-500 uppercase text-[9px] font-bold tracking-wider block">
                        {field.label || field.id}
                      </span>
                      
                      {!hasAnswer ? (
                        <span className="text-gray-500 text-xs italic">No response provided</span>
                      ) : (
                        <div className="text-gray-200 text-sm font-semibold whitespace-pre-wrap leading-relaxed">
                          
                          {/* Image rendering */}
                          {field.type === 'imageUpload' && typeof answer === 'string' && answer.startsWith('http') ? (
                            <div className="space-y-2 mt-1">
                              <a href={answer} target="_blank" rel="noopener noreferrer" className="inline-block relative group/img rounded-xl overflow-hidden border border-[#222222] max-w-[200px]">
                                <img src={answer} alt="Attachment" className="max-w-[200px] max-h-36 object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase">
                                  Open Original
                                </div>
                              </a>
                            </div>
                          ) : 
                          
                          /* Digital Signature Rendering */
                          field.type === 'signature' && typeof answer === 'string' && answer.startsWith('data:image') ? (
                            <div className="mt-1 p-2 rounded-xl bg-black border border-[#222222] max-w-[220px]">
                              <img src={answer} alt="Signature drawing" className="max-w-full h-auto bg-transparent invert brightness-200" />
                              <div className="text-[8px] font-black text-center text-gray-500 uppercase tracking-widest mt-1">DIGITAL SIGNATURE</div>
                            </div>
                          ) :
                          
                          /* General files link rendering */
                          field.type === 'fileUpload' && typeof answer === 'string' && answer.startsWith('http') ? (
                            <a 
                              href={answer} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/15 transition-all text-xs font-bold mt-1"
                            >
                              <FileText className="w-4 h-4" />
                              View Uploaded File
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) :
                          
                          field.type === 'rating' ? (
                            <div className="flex items-center gap-1 mt-1 text-yellow-400">
                              {Array.from({ length: answer }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-500" />
                              ))}
                              <span className="text-[10px] font-black text-gray-400 ml-1.5">({answer} Stars)</span>
                            </div>
                          ) :
                          
                          /* General answers default text representation */
                          Array.isArray(answer) ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {answer.map((tag, tIdx) => (
                                <span key={tIdx} className="bg-gray-900 border border-[#222222] px-2 py-0.5 rounded text-xs text-gray-200 font-bold capitalize">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            String(answer)
                          )}

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal footer action */}
            <div className="p-6 border-t border-[#222222]/60 bg-black/40 flex justify-end">
              <button
                onClick={() => setActiveResponse(null)}
                className="px-5 py-2.5 rounded-xl bg-gray-900 border border-[#222222] hover:bg-[#1A1A1A] text-gray-300 font-bold text-xs cursor-pointer transition-colors"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Export Configurations Modal Dialog */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111111] rounded-[2rem] shadow-2xl border border-[#222222] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-[#222222]/60 flex justify-between items-center bg-black/40">
              <h3 className="text-lg font-black text-white">Export Configurations</h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="p-1.5 hover:bg-[#1A1A1A] rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Select file format */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">File Format</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { format: 'xlsx', label: 'Excel (XLSX)', info: 'Styled cell grid' },
                    { format: 'csv', label: 'Comma CSV', info: 'Clean text tables' }
                  ].map((item) => (
                    <button
                      key={item.format}
                      onClick={() => setExportConfig({ ...exportConfig, format: item.format })}
                      className={`p-4 rounded-2xl text-left border cursor-pointer transition-all ${
                        exportConfig.format === item.format
                          ? 'bg-yellow-500/10 border-yellow-500 text-white'
                          : 'bg-black/40 border-[#222222] text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <div className="text-sm font-extrabold">{item.label}</div>
                      <div className="text-[9px] mt-1 text-gray-500">{item.info}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Select export row selection range */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Dataset Range</label>
                <div className="space-y-2">
                  {[
                    { range: 'all', label: 'All Responses', sub: `Export entire list (${responses.length} rows)` },
                    { range: 'filtered', label: 'Filtered List', sub: `Export query results (${filteredResponses.length} rows)` },
                    { 
                      range: 'selected', 
                      label: 'Selected Checkboxes', 
                      sub: `Export chosen entries (${selectedResponseIds.length} rows)`,
                      disabled: selectedResponseIds.length === 0 
                    }
                  ].map((item) => (
                    <button
                      key={item.range}
                      disabled={item.disabled}
                      onClick={() => setExportConfig({ ...exportConfig, range: item.range })}
                      className={`w-full p-3.5 rounded-2xl text-left border flex items-center justify-between cursor-pointer transition-all ${
                        item.disabled 
                          ? 'opacity-30 cursor-not-allowed bg-black/10 border-transparent text-gray-600'
                          : exportConfig.range === item.range
                          ? 'bg-yellow-500/10 border-yellow-500 text-white'
                          : 'bg-black/40 border-[#222222] text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[9px] text-gray-500 font-semibold mt-0.5">{item.sub}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        exportConfig.range === item.range ? 'border-yellow-500 bg-yellow-500' : 'border-gray-700'
                      }`}>
                        {exportConfig.range === item.range && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-[#222222]/60 bg-black/40 flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-3 border border-[#222222] hover:bg-[#1A1A1A] rounded-xl text-gray-300 font-bold text-xs cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleExportSubmit}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-yellow-500/20 cursor-pointer text-center"
              >
                Generate Export
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default FormResponses;
