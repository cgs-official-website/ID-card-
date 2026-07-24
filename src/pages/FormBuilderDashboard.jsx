import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, Plus, Search, Eye, Edit2, Copy, Archive, Trash2, Download, 
  ExternalLink, Settings, X, ShieldAlert, Check, Calendar, Activity, RefreshCw, BarChart2
} from 'lucide-react';
import { exportToCSV, exportToXLSX } from '../utils/excelExporter';
import { 
  fetchFormsList, duplicateFormObj, archiveFormObj, deleteFormObj, 
  fetchAuditLogsList, createAuditLogObj, fetchFormResponses, fetchFormFields,
  updateFormStatusObj, getNextFormId
} from '../utils/dbHelper';

const FormBuilderDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    responses: 0
  });

  // Modal and Logs state
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);
  
  // Alert/Confirm modal state
  const [confirmModal, setConfirmModal] = useState(null); // { type, formId, action, title, text }

  // State to track active dropdown menus ('settings-{formId}' or 'export-{formId}')
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    fetchForms();
  }, []);

  useEffect(() => {
    const closeMenus = () => {
      setActiveMenu(null);
    };
    document.addEventListener('click', closeMenus);
    return () => document.removeEventListener('click', closeMenus);
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const formsData = await fetchFormsList();
      setForms(formsData);
      
      // Calculate Stats
      const statObj = {
        total: formsData.length,
        published: formsData.filter(f => f.status === 'published').length,
        draft: formsData.filter(f => f.status === 'draft').length,
        archived: formsData.filter(f => f.status === 'archived').length,
        responses: formsData.reduce((acc, curr) => acc + (curr.responsesCount || 0), 0)
      };
      setStats(statObj);
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const createAuditLog = async (action, formId, formTitle) => {
    try {
      await createAuditLogObj(action, formId, formTitle, currentUser?.email || 'Admin');
    } catch (err) {
      console.error("Error creating audit log:", err);
    }
  };

  const handleDuplicate = async (form) => {
    try {
      setLoading(true);
      const newId = await getNextFormId(forms);
      const newFormDoc = {
        title: `${form.title} (Copy)`,
        description: form.description || '',
        status: 'draft',
        settings: {
          ...form.settings,
          submissionLimit: form.settings?.submissionLimit || '',
          startDate: form.settings?.startDate || '',
          endDate: form.settings?.endDate || ''
        },
        createdBy: currentUser?.email || 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Fetch fields of original form
      const fieldsList = await fetchFormFields(form.id);

      // Duplicate
      await duplicateFormObj(form.id, newId, newFormDoc, fieldsList);

      await createAuditLog('Form Duplicated', newId, newFormDoc.title);
      await fetchForms();
    } catch (error) {
      console.error("Error duplicating form:", error);
    } finally {
      setLoading(false);
      setConfirmModal(null);
    }
  };

  const handleArchive = async (formId, currentStatus) => {
    try {
      setLoading(true);
      const title = forms.find(f => f.id === formId)?.title || 'Unknown Form';
      const nextStatus = await archiveFormObj(formId, currentStatus);

      await createAuditLog(
        nextStatus === 'archived' ? 'Form Archived' : 'Form Restored',
        formId,
        title
      );
      await fetchForms();
    } catch (error) {
      console.error("Error archiving form:", error);
    } finally {
      setLoading(false);
      setConfirmModal(null);
    }
  };

  const handleDelete = async (formId, formTitle) => {
    try {
      setLoading(true);
      await deleteFormObj(formId);
      await createAuditLog('Form Deleted', formId, formTitle);
      await fetchForms();
    } catch (error) {
      console.error("Error deleting form:", error);
    } finally {
      setLoading(false);
      setConfirmModal(null);
    }
  };

  const handleStatusChange = async (formId, nextStatus) => {
    try {
      setLoading(true);
      const title = forms.find(f => f.id === formId)?.title || 'Unknown Form';
      await updateFormStatusObj(formId, nextStatus);

      let logAction = 'Form Published';
      if (nextStatus === 'draft') logAction = 'Form Reverted to Draft';
      else if (nextStatus === 'archived') logAction = 'Form Archived';

      await createAuditLog(logAction, formId, title);
      await fetchForms();
    } catch (error) {
      console.error("Error updating form status:", error);
      alert("Failed to update status. Check console logs.");
    } finally {
      setLoading(false);
      setConfirmModal(null);
    }
  };


  const fetchAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const logs = await fetchAuditLogsList();
      setAuditLogs(logs);
      setShowLogsModal(true);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleExportResponses = async (form, format) => {
    try {
      const responses = await fetchFormResponses(form.id);

      if (responses.length === 0) {
        alert("No responses available to export.");
        return;
      }

      // Get fields list to map headings
      const fields = await fetchFormFields(form.id);

      const headers = ['Response ID', 'Submission Date', 'User IP'];
      const keys = ['id', 'submittedAtStr', 'ipAddress'];

      fields.forEach(field => {
        if (['heading', 'paragraph', 'divider', 'imageBlock'].includes(field.type)) return;
        headers.push(field.label || field.id);
        keys.push(field.id);
      });

      const exportRows = responses.map(res => {
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

        // Fill field answers
        fields.forEach(field => {
          if (['heading', 'paragraph', 'divider', 'imageBlock'].includes(field.type)) return;
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

      if (format === 'csv') {
        exportToCSV(headers, exportRows, keys, fileName);
      } else {
        exportToXLSX(headers, exportRows, keys, fileName);
      }

      await createAuditLog('Responses Exported', form.id, form.title);
    } catch (error) {
      console.error("Error exporting responses:", error);
    }
  };

  const copyFormLink = (formId) => {
    const url = `${window.location.origin}/f/${formId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(formId);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          form.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && form.status === statusFilter;
  });

  return (
    <div className="space-y-8 bg-transparent">
      {/* Upper Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Forms', val: stats.total, color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
          { label: 'Published', val: stats.published, color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
          { label: 'Drafts', val: stats.draft, color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
          { label: 'Archived', val: stats.archived, color: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
          { label: 'Total Submissions', val: stats.responses, color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400', wide: true }
        ].map((s, idx) => (
          <div 
            key={idx} 
            className={`bg-[#111111]/80 backdrop-blur-md p-5 rounded-2xl border border-[#222222]/50 flex flex-col justify-between shadow-lg ${s.wide ? 'col-span-2 md:col-span-3 lg:col-span-1' : ''}`}
          >
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{s.label}</p>
            <div className="flex items-baseline justify-between mt-2">
              <h3 className="text-3xl font-black text-white">{s.val}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${s.color}`}>Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* Control Actions Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-1">Custom Forms Builder</h2>
          <p className="text-gray-400 text-sm font-medium">Build, publish, and view answers for client/internal forms</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={fetchAuditLogs}
            className="px-5 py-3 rounded-xl border border-[#222222]/50 bg-[#111111]/50 hover:bg-[#1A1A1A] text-gray-300 text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
          >
            <Activity className="w-4 h-4" />
            Audit Logs
          </button>
          
          <Link
            to="/form-builder/create"
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-white text-sm font-bold shadow-lg shadow-yellow-500/20 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Create Form
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search forms by title, ID..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-[#111111]/50 p-1 border border-[#222222]/50 rounded-xl w-full md:w-auto overflow-x-auto">
          {['all', 'published', 'draft', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === status 
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Forms Table Card */}
      <div className="bg-[#111111]/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#222222]/50 overflow-hidden">
        <div className="overflow-x-auto">
          {/* Desktop Table View */}
          <table className="hidden md:table w-full text-sm text-left">
            <thead className="bg-black/60 text-gray-300 font-bold border-b border-[#222222]/50">
              <tr>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Form Details</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px] text-center">Status</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px] text-center">Responses</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Dates</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]/30">
              {filteredForms.map((form) => {
                const createdDate = form.createdAt?.toDate 
                  ? form.createdAt.toDate().toLocaleDateString()
                  : new Date(form.createdAt).toLocaleDateString();
                
                const updatedDate = form.updatedAt?.toDate 
                  ? form.updatedAt.toDate().toLocaleDateString()
                  : new Date(form.updatedAt).toLocaleDateString();

                return (
                  <tr key={form.id} className="hover:bg-[#1A1A1A]/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div>
                        <div className="font-bold text-gray-100 text-base">{form.title}</div>
                        <div className="text-gray-400 text-xs mt-1 flex items-center gap-2">
                          <span className="bg-black px-2 py-0.5 rounded border border-[#222222]/40 font-mono text-[10px]">ID: {form.id}</span>
                          <span className="truncate max-w-[200px]">{form.description || 'No description'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        form.status === 'published' 
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' 
                          : form.status === 'archived'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }`}>
                        {form.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <Link 
                        to={`/form-builder/responses/${form.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 rounded-lg text-xs font-black text-gray-200 border border-[#222222]/50 hover:bg-gray-800 transition-colors"
                      >
                        {form.responsesCount}
                      </Link>
                    </td>
                    <td className="px-6 py-5 text-xs text-gray-400">
                      <div>Created: <span className="text-gray-200 font-medium">{createdDate}</span></div>
                      <div className="mt-1">Updated: <span className="text-gray-200 font-medium">{updatedDate}</span></div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Public Link Copy Button */}
                        <button
                          onClick={() => copyFormLink(form.id)}
                          className="p-2 bg-gray-900 border border-[#222222]/50 text-gray-400 hover:text-white hover:border-yellow-500/50 rounded-lg transition-all cursor-pointer"
                          title={
                            form.status === 'published' 
                              ? "Copy Share Link (Published & Active)" 
                              : form.status === 'archived'
                              ? "Copy Share Link (Archived - Closed)"
                              : "Copy Share Link (Draft - Publish to enable responses)"
                          }
                        >
                          {copiedLink === form.id ? <Check className="w-4 h-4 text-yellow-400" /> : <ExternalLink className="w-4 h-4" />}
                        </button>

                        {/* Analytics view */}
                        <Link
                          to={`/form-builder/analytics/${form.id}`}
                          className="p-2 bg-gray-900 border border-[#222222]/50 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all"
                          title="Analytics Dashboard"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </Link>

                        {/* Responses list */}
                        <Link
                          to={`/form-builder/responses/${form.id}`}
                          className="p-2 bg-gray-900 border border-[#222222]/50 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all"
                          title="View Responses"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Quick Excel Export dropdown */}
                        <div className="relative">
                          <button
                            disabled={form.responsesCount === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenu(activeMenu === `export-${form.id}` ? null : `export-${form.id}`);
                            }}
                            className={`p-2 rounded-lg border transition-all ${
                              form.responsesCount > 0
                                ? 'bg-gray-900 border-[#222222]/50 text-gray-400 hover:text-yellow-400 cursor-pointer'
                                : 'opacity-40 text-gray-600 border-transparent cursor-not-allowed'
                            }`}
                            title="Export Responses"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {form.responsesCount > 0 && (
                            <div className={`absolute right-0 bottom-full mb-1 w-28 bg-[#181D30] border border-[#222222] rounded-xl shadow-2xl overflow-hidden z-30 ${activeMenu === `export-${form.id}` ? 'block' : 'hidden'}`}>
                              <button 
                                onClick={() => handleExportResponses(form, 'csv')}
                                className="w-full px-3 py-2 text-left text-xs font-bold text-gray-300 hover:bg-gray-800 transition-colors cursor-pointer"
                              >
                                Export CSV
                              </button>
                              <button 
                                onClick={() => handleExportResponses(form, 'xlsx')}
                                className="w-full px-3 py-2 text-left text-xs font-bold text-gray-300 hover:bg-gray-800 transition-colors border-t border-[#222222]/50 cursor-pointer"
                              >
                                Export Excel
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Settings / Edit */}
                        <Link
                          to={`/form-builder/edit/${form.id}`}
                          className="p-2 bg-gray-900 border border-[#222222]/50 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all"
                          title="Edit Form"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>

                        {/* Actions trigger */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenu(activeMenu === `settings-${form.id}` ? null : `settings-${form.id}`);
                            }}
                            className="p-2 bg-gray-900 border border-[#222222]/50 text-gray-400 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="More Options"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <div className={`absolute right-0 bottom-full mb-1 w-32 bg-[#181D30] border border-[#222222] rounded-xl shadow-2xl overflow-hidden z-30 ${activeMenu === `settings-${form.id}` ? 'block' : 'hidden'}`}>
                            <button 
                              onClick={() => setConfirmModal({
                                type: 'duplicate',
                                form,
                                title: 'Duplicate Form?',
                                text: `Are you sure you want to clone "${form.title}"? A new draft copy will be created.`
                              })}
                              className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-gray-500" />
                              Duplicate
                            </button>
                            <button 
                              onClick={() => setConfirmModal({
                                type: 'archive',
                                formId: form.id,
                                action: form.status,
                                title: form.status === 'archived' ? 'Restore Form?' : 'Archive Form?',
                                text: form.status === 'archived' 
                                  ? `This will restore "${form.title}" back to draft state, allowing submissions to be re-enabled.`
                                  : `This will archive "${form.title}". Users will no longer be able to submit responses until restored.`
                              })}
                              className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-gray-300 hover:bg-gray-800 hover:text-white transition-colors border-t border-[#222222]/50 flex items-center gap-2 cursor-pointer"
                            >
                              <Archive className="w-3.5 h-3.5 text-gray-500" />
                              {form.status === 'archived' ? 'Restore' : 'Archive'}
                            </button>
                            {form.status === 'draft' ? (
                              <button 
                                onClick={() => setConfirmModal({
                                  type: 'status',
                                  formId: form.id,
                                  nextStatus: 'published',
                                  formTitle: form.title,
                                  title: 'Publish Form?',
                                  text: `This will publish "${form.title}" and make it active. Anyone with the link will be able to submit responses.`
                                })}
                                className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 transition-colors border-t border-[#222222]/50 flex items-center gap-2 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 text-yellow-500" />
                                Publish Form
                              </button>
                            ) : form.status === 'published' ? (
                              <button 
                                onClick={() => setConfirmModal({
                                  type: 'status',
                                  formId: form.id,
                                  nextStatus: 'draft',
                                  formTitle: form.title,
                                  title: 'Revert to Draft?',
                                  text: `This will change "${form.title}" status to Draft. Public users won't be able to submit responses until it is published again.`
                                })}
                                className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 transition-colors border-t border-[#222222]/50 flex items-center gap-2 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-yellow-500" />
                                Revert to Draft
                              </button>
                            ) : null}
                            <button 
                              onClick={() => setConfirmModal({
                                type: 'delete',
                                formId: form.id,
                                formTitle: form.title,
                                title: 'Permanently Delete?',
                                text: `Warning: This will permanently delete "${form.title}", its fields, and ALL its responses. This action CANNOT be undone.`
                              })}
                              className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border-t border-[#222222]/50 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile Card List View */}
          <div className="flex flex-col gap-4 p-4 md:hidden">
            {filteredForms.map((form) => {
              const createdDate = form.createdAt?.toDate 
                ? form.createdAt.toDate().toLocaleDateString()
                : new Date(form.createdAt).toLocaleDateString();

              return (
                <div key={form.id} className="bg-[#181D30]/60 p-5 rounded-2xl border border-[#222222]/40 flex flex-col gap-4">
                  {/* Header */}
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-extrabold text-white text-base leading-snug">{form.title}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${
                        form.status === 'published' 
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' 
                          : form.status === 'archived'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }`}>
                        {form.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-1">ID: {form.id}</div>
                    {form.description && <p className="text-xs text-gray-400 mt-2 leading-relaxed">{form.description}</p>}
                  </div>

                  {/* Summary row */}
                  <div className="grid grid-cols-2 gap-2 bg-black/40 border border-[#222222]/30 p-3 rounded-xl text-center text-xs">
                    <div>
                      <div className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">Responses</div>
                      <Link 
                        to={`/form-builder/responses/${form.id}`}
                        className="inline-block mt-1 font-black text-gray-200 bg-gray-900 border border-[#222222]/40 px-2.5 py-0.5 rounded-lg hover:text-white transition-colors"
                      >
                        {form.responsesCount}
                      </Link>
                    </div>
                    <div>
                      <div className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">Created Date</div>
                      <div className="mt-1 font-bold text-gray-300">{createdDate}</div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#222222]/30">
                    <div className="flex items-center gap-1.5">
                      {/* Copy Link */}
                      <button
                        onClick={() => copyFormLink(form.id)}
                        className="p-2.5 bg-gray-900 border border-[#222222]/50 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Copy Share Link"
                      >
                        {copiedLink === form.id ? <Check className="w-3.5 h-3.5 text-yellow-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
                      </button>
                      {/* Analytics */}
                      <Link
                        to={`/form-builder/analytics/${form.id}`}
                        className="p-2.5 bg-gray-900 border border-[#222222]/50 text-gray-400 hover:text-yellow-400 rounded-lg transition-colors"
                        title="Analytics"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                      </Link>
                      {/* Responses */}
                      <Link
                        to={`/form-builder/responses/${form.id}`}
                        className="p-2.5 bg-gray-900 border border-[#222222]/50 text-gray-400 hover:text-yellow-400 rounded-lg transition-colors"
                        title="View Responses"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      {/* Edit */}
                      <Link
                        to={`/form-builder/edit/${form.id}`}
                        className="p-2.5 bg-gray-900 border border-[#222222]/50 text-gray-400 hover:text-yellow-400 rounded-lg transition-colors"
                        title="Edit Form"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Quick Options */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === `settings-mobile-${form.id}` ? null : `settings-mobile-${form.id}`);
                        }}
                        className="p-2.5 bg-gray-900 border border-[#222222]/50 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Options
                      </button>
                      <div className={`absolute right-0 bottom-full mb-1.5 w-36 bg-[#181D30] border border-[#222222] rounded-xl shadow-2xl overflow-hidden z-30 ${activeMenu === `settings-mobile-${form.id}` ? 'block' : 'hidden'}`}>
                        <button 
                          onClick={() => setConfirmModal({
                            type: 'duplicate',
                            form,
                            title: 'Duplicate Form?',
                            text: `Are you sure you want to clone "${form.title}"?`
                          })}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-gray-500" />
                          Duplicate
                        </button>
                        <button 
                          onClick={() => setConfirmModal({
                            type: 'archive',
                            formId: form.id,
                            action: form.status,
                            title: form.status === 'archived' ? 'Restore Form?' : 'Archive Form?',
                            text: form.status === 'archived' 
                              ? `Restore "${form.title}" to draft state?`
                              : `Archive "${form.title}"?`
                          })}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-gray-300 hover:bg-gray-800 transition-colors border-t border-[#222222]/50 flex items-center gap-2 cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5 text-gray-500" />
                          {form.status === 'archived' ? 'Restore' : 'Archive'}
                        </button>
                        {form.status === 'draft' ? (
                          <button 
                            onClick={() => setConfirmModal({
                              type: 'status',
                              formId: form.id,
                              nextStatus: 'published',
                              formTitle: form.title,
                              title: 'Publish Form?',
                              text: `Publish "${form.title}" and make it active?`
                            })}
                            className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-yellow-400 hover:bg-yellow-500/10 transition-colors border-t border-[#222222]/50 flex items-center gap-2 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 text-yellow-500" />
                            Publish Form
                          </button>
                        ) : form.status === 'published' ? (
                          <button 
                            onClick={() => setConfirmModal({
                              type: 'status',
                              formId: form.id,
                              nextStatus: 'draft',
                              formTitle: form.title,
                              title: 'Revert to Draft?',
                              text: `Revert "${form.title}" to draft?`
                            })}
                            className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-yellow-400 hover:bg-yellow-500/10 transition-colors border-t border-[#222222]/50 flex items-center gap-2 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-yellow-500" />
                            Revert Draft
                          </button>
                        ) : null}
                        <button 
                          onClick={() => setConfirmModal({
                            type: 'delete',
                            formId: form.id,
                            formTitle: form.title,
                            title: 'Delete Form?',
                            text: `Permanently delete "${form.title}"?`
                          })}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors border-t border-[#222222]/50 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="bg-[#111111] rounded-[2rem] shadow-2xl border border-[#222222] w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 pb-2 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className={`w-5 h-5 ${confirmModal.type === 'delete' ? 'text-red-400' : 'text-yellow-400'}`} />
                {confirmModal.title}
              </h3>
              <button onClick={() => setConfirmModal(null)} className="p-1.5 hover:bg-[#1A1A1A] rounded-full transition-colors cursor-pointer">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 pt-2">
              <p className="text-sm font-medium text-gray-400 leading-relaxed mb-6">
                {confirmModal.text}
              </p>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3 border border-[#222222]/80 hover:bg-[#1A1A1A] text-gray-300 font-bold rounded-xl transition-all cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmModal.type === 'duplicate') handleDuplicate(confirmModal.form);
                    else if (confirmModal.type === 'archive') handleArchive(confirmModal.formId, confirmModal.action);
                    else if (confirmModal.type === 'delete') handleDelete(confirmModal.formId, confirmModal.formTitle);
                    else if (confirmModal.type === 'status') handleStatusChange(confirmModal.formId, confirmModal.nextStatus);
                  }}
                  className={`flex-1 py-3 font-bold rounded-xl transition-all text-white text-sm shadow-md cursor-pointer ${
                    confirmModal.type === 'delete' 
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-900/20' 
                      : 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-violet-900/20'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="bg-[#111111] rounded-[2rem] shadow-2xl border border-[#222222] w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[#222222]/50 flex justify-between items-center bg-black/40">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-yellow-400" />
                  System Activity & Audit Logs
                </h3>
                <p className="text-gray-400 text-xs font-semibold mt-1">Authorized actions and tracking history</p>
              </div>
              <button 
                onClick={() => setShowLogsModal(false)} 
                className="p-2 hover:bg-[#1A1A1A] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 max-h-[500px] overflow-y-auto">
              {loadingLogs ? (
                <div className="flex flex-col justify-center items-center py-12 gap-3 text-white">
                  <RefreshCw className="w-8 h-8 text-yellow-500 animate-spin" />
                  <span className="font-semibold text-sm">Loading activity records...</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 font-bold">No system activities recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log) => {
                    const logDate = log.timestamp?.toDate 
                      ? log.timestamp.toDate().toLocaleString()
                      : new Date(log.timestamp).toLocaleString();
                    
                    return (
                      <div key={log.id} className="p-4 rounded-xl bg-black/40 border border-[#222222]/40 hover:border-yellow-500/20 transition-all flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              log.action.includes('Delete')
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : log.action.includes('Export')
                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {log.action}
                            </span>
                            <span className="text-gray-300 text-sm font-semibold">{log.formTitle}</span>
                          </div>
                          <p className="text-gray-400 text-xs mt-2 font-medium">
                            Triggered by: <span className="text-gray-200 font-bold">{log.user}</span>
                          </p>
                          {log.formId && (
                            <p className="text-gray-500 font-mono text-[9px] mt-1">Form ID: {log.formId}</p>
                          )}
                        </div>
                        <div className="text-right text-[10px] text-gray-500 font-bold whitespace-nowrap flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {logDate}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-[#222222]/50 bg-black/20 flex justify-end">
              <button
                onClick={() => setShowLogsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-gray-900 border border-[#222222]/80 hover:bg-[#1A1A1A] text-gray-300 font-semibold text-sm cursor-pointer"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormBuilderDashboard;
