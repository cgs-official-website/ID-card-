import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Award, Download, X, Eye, Copy, Trash2, ExternalLink, Plus, Check, Briefcase, GraduationCap, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CertificateSVG from '../components/CertificateSVG';
import NotifyModal from '../components/NotifyModal';

const CertificatesDashboard = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [notify, setNotify] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();
  const showNotify = (type, title, message) => setNotify({ type, title, message });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTypeFilter, certificates]);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(cert => cert.isCertificate);
      setCertificates(data);
    } catch (error) {
      console.error("Error fetching certificates: ", error);
    } finally {
      setLoading(false);
    }
  };

  const copyRegisterLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/register-certificate`);
    showNotify('success', 'Link Copied!', 'Certificate registration link has been copied to clipboard.');
  };

  const copyPortfolioLink = (cert) => {
    navigator.clipboard.writeText(`${window.location.origin}/certificate/${cert.id}`);
    setCopiedId(cert.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (cert) => setPendingDelete(cert);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteDoc(doc(db, 'employees', pendingDelete.id));
      fetchCertificates();
      showNotify('success', 'Deleted', 'Certificate record deleted successfully.');
    } catch (error) {
      console.error('Error deleting certificate:', error);
      showNotify('error', 'Delete Failed', 'Failed to delete certificate record.');
    } finally {
      setPendingDelete(null);
    }
  };

  // Certificate Counts Calculations
  const totalCount = certificates.length;
  const internshipCount = certificates.filter(cert => cert.type?.toLowerCase() === 'internship').length;
  const trainingCount = certificates.filter(cert => cert.type?.toLowerCase() === 'training').length;

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      cert.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = 
      selectedTypeFilter === 'All' || 
      cert.type?.toLowerCase() === selectedTypeFilter.toLowerCase();

    return matchesSearch && matchesType;
  });

  // Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCertificates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage);

  return (
    <div className="space-y-8">
      {notify && <NotifyModal type={notify.type} title={notify.title} message={notify.message} onClose={() => setNotify(null)} />}
      {pendingDelete && (
        <NotifyModal
          type="confirm"
          title="Delete Certificate?"
          message={`Are you sure you want to delete the certificate for ${pendingDelete?.candidateName}?`}
          confirmText="Yes, Delete"
          cancelText="Cancel"
          onClose={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
      
      {/* Data Count Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Certificates Card */}
        <div 
          onClick={() => setSelectedTypeFilter('All')}
          className={`premium-card cursor-pointer p-6 flex items-center justify-between group ${
            selectedTypeFilter === 'All'
              ? 'border-yellow-500 shadow-lg shadow-yellow-500/20 bg-[#1A1A1A]'
              : 'border-[#222222]/50 hover:border-[#3E4566] hover:bg-[#161616]'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-white font-bold uppercase tracking-wider text-xs">Total Certificates</p>
              {selectedTypeFilter === 'All' && (
                <span className="text-[10px] bg-yellow-500/20 text-yellow-300 font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">Active</span>
              )}
            </div>
            <h3 className="text-4xl font-black text-white">{totalCount}</h3>
            <p className="text-xs text-gray-400 mt-1 font-medium">All issued credentials</p>
          </div>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all ${
            selectedTypeFilter === 'All'
              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
              : 'bg-yellow-500/10 text-white border-yellow-500/20 group-hover:bg-yellow-500/20'
          }`}>
            <Award className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Internship Certificates Card */}
        <div 
          onClick={() => setSelectedTypeFilter('Internship')}
          className={`premium-card cursor-pointer p-6 flex items-center justify-between group ${
            selectedTypeFilter === 'Internship'
              ? 'border-yellow-500 shadow-lg shadow-yellow-500/20 bg-[#1A1A1A]'
              : 'border-[#222222]/50 hover:border-[#3E4566] hover:bg-[#161616]'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-white font-bold uppercase tracking-wider text-xs">Internship Certificates</p>
              {selectedTypeFilter === 'Internship' && (
                <span className="text-[10px] bg-yellow-500/20 text-yellow-300 font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">Active</span>
              )}
            </div>
            <h3 className="text-4xl font-black text-white">{internshipCount}</h3>
            <p className="text-xs text-gray-400 mt-1 font-medium">Internship track credentials</p>
          </div>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all ${
            selectedTypeFilter === 'Internship'
              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 group-hover:bg-yellow-500/20'
          }`}>
            <Briefcase className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        {/* Training Certificates Card */}
        <div 
          onClick={() => setSelectedTypeFilter('Training')}
          className={`premium-card cursor-pointer p-6 flex items-center justify-between group ${
            selectedTypeFilter === 'Training'
              ? 'border-yellow-500 shadow-lg shadow-yellow-500/20 bg-[#1A1A1A]'
              : 'border-[#222222]/50 hover:border-[#3E4566] hover:bg-[#161616]'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-white font-bold uppercase tracking-wider text-xs">Training Certificates</p>
              {selectedTypeFilter === 'Training' && (
                <span className="text-[10px] bg-yellow-500/20 text-yellow-300 font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">Active</span>
              )}
            </div>
            <h3 className="text-4xl font-black text-white">{trainingCount}</h3>
            <p className="text-xs text-gray-400 mt-1 font-medium">Training program credentials</p>
          </div>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all ${
            selectedTypeFilter === 'Training'
              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 group-hover:bg-yellow-500/20'
          }`}>
            <GraduationCap className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-1">Certificates</h2>
          <p className="text-white text-sm font-medium">Manage and generate digital certificates and student portfolios</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Type Filter Pills */}
          <div className="flex items-center gap-1 bg-[#111111]/80 p-1.5 rounded-2xl border border-[#222222]/50">
            <button
              onClick={() => setSelectedTypeFilter('All')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTypeFilter === 'All'
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]/50'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setSelectedTypeFilter('Internship')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTypeFilter === 'Internship'
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]/50'
              }`}
            >
              Internship ({internshipCount})
            </button>
            <button
              onClick={() => setSelectedTypeFilter('Training')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTypeFilter === 'Training'
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]/50'
              }`}
            >
              Training ({trainingCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 lg:flex-none lg:w-72">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search certificates..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <button
            onClick={copyRegisterLink}
            className="premium-button-secondary py-3 text-sm"
          >
            <Copy className="w-4 h-4" />
            Copy Reg Link
          </button>

          <Link
            to="/register-certificate"
            className="premium-button-primary py-3 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Certificate
          </Link>
        </div>
      </div>

      {/* Table view */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-black/60 text-white font-bold border-b border-[#222222]/50">
              <tr>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Candidate</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Certificate Code</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Domain & Type</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Duration</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]/30">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-white">
                    <div className="flex flex-col justify-center items-center gap-4">
                      <div className="w-8 h-8 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium">Loading certificate records...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-white">
                    <div className="flex flex-col items-center gap-2">
                      <Award className="w-10 h-10 text-white mb-2" />
                      <p className="font-medium text-white">No certificates found matching "{searchTerm}"</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((cert) => (
                  <tr key={cert.id} className="hover:bg-[#1A1A1A]/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold flex-shrink-0 border border-yellow-500/30">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-white text-base block leading-none mb-1">{cert.candidateName}</span>
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{cert.type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-black text-white border border-[#222222]/50">
                        {cert.id}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-white">{cert.domain}</div>
                      <div className="text-white text-[10px] uppercase font-black tracking-tight">Carrezza Global Solutions</div>
                    </td>
                    <td className="px-8 py-5 text-white font-medium">{cert.duration}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedCertificate(cert)}
                          className="p-2 text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all"
                          title="View Certificate"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => copyPortfolioLink(cert)}
                          className="p-2 text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all"
                          title="Copy Portfolio Link"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                        <Link 
                          to={`/admin/certificate/${cert.id}`}
                          className="p-2 text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all"
                          title="Manage / Edit"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(cert)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete Certificate"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-[#222222]/30 bg-black/20">
            <div className="text-sm text-gray-400">
              Showing <span className="font-semibold text-white">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-semibold text-white">{Math.min(indexOfLastItem, filteredCertificates.length)}</span> of{" "}
              <span className="font-semibold text-white">{filteredCertificates.length}</span> certificates
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-[#222222]/50 text-gray-300 hover:bg-[#1A1A1A] disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    currentPage === page
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg shadow-yellow-500/20"
                      : "border border-[#222222]/50 text-gray-300 hover:bg-[#1A1A1A]"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-[#222222]/50 text-gray-300 hover:bg-[#1A1A1A] disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Certificate Viewer Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="glass-panel rounded-[2.5rem] w-full max-w-4xl overflow-hidden relative flex flex-col">
            <div className="p-6 pb-4 flex justify-between items-center border-b border-[#222222]/50">
              <div>
                <h3 className="text-xl font-bold text-white">Certificate Preview</h3>
                <p className="text-xs text-gray-400">ID: {selectedCertificate.id} • Recipient: {selectedCertificate.candidateName}</p>
              </div>
              <button 
                onClick={() => setSelectedCertificate(null)}
                className="p-2 hover:bg-[#1A1A1A] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-8 bg-black overflow-y-auto max-h-[70vh] flex items-center justify-center">
              <div className="w-full max-w-3xl">
                <CertificateSVG
                  candidateName={selectedCertificate.candidateName}
                  domain={selectedCertificate.domain}
                  duration={selectedCertificate.duration}
                  certificateCode={selectedCertificate.id}
                  type={selectedCertificate.type}
                  qrUrl={`${window.location.origin}/certificate/${selectedCertificate.id}`}
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-[#222222]/50 bg-[#111111] flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedCertificate(null);
                  navigate(`/admin/certificate/${selectedCertificate.id}`);
                }}
                className="premium-button-secondary py-3 text-sm"
              >
                Manage Credentials
              </button>
              <a
                href={`${window.location.origin}/certificate/${selectedCertificate.id}`}
                target="_blank"
                rel="noreferrer"
                className="premium-button-primary py-3 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View Student Portfolio
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificatesDashboard;
