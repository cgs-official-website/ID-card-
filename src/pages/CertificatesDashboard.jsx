import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Award, Download, X, Eye, Copy, Trash2, ExternalLink, Plus, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CertificateSVG from '../components/CertificateSVG';
import NotifyModal from '../components/NotifyModal';

const CertificatesDashboard = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [notify, setNotify] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();
  const showNotify = (type, title, message) => setNotify({ type, title, message });

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

  const filteredCertificates = certificates.filter(cert => 
    cert.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    cert.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {/* Data Count */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#131726]/80 backdrop-blur-md p-6 rounded-3xl border border-[#2D334A]/50 shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-between">
          <div>
            <p className="text-white font-bold uppercase tracking-wider text-xs mb-1">Total Certificates</p>
            <h3 className="text-4xl font-black text-white">{certificates.length}</h3>
          </div>
          <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center border border-violet-500/20">
            <Award className="w-8 h-8 text-white" />
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
          {/* Search Input */}
          <div className="relative flex-1 lg:flex-none lg:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search certificates..."
              className="pl-12 w-full rounded-2xl border border-[#2D334A]/50 bg-[#131726]/50 px-5 py-3.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all placeholder:text-slate-500 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <button
            onClick={copyRegisterLink}
            className="flex items-center justify-center gap-2 bg-[#1E243D] hover:bg-[#252B48] text-white border border-[#2D334A]/50 px-5 py-3.5 rounded-2xl text-sm font-bold shadow-sm transition-all"
          >
            <Copy className="w-4 h-4" />
            Copy Reg Link
          </button>

          <Link
            to="/register-certificate"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white px-5 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-violet-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Certificate
          </Link>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-[#131726]/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D334A]/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0B0F19]/60 text-white font-bold border-b border-[#2D334A]/50">
              <tr>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Candidate</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Certificate Code</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Domain & Type</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Duration</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D334A]/30">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-white">
                    <div className="flex flex-col justify-center items-center gap-4">
                      <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium">Loading certificate records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-white">
                    <div className="flex flex-col items-center gap-2">
                      <Award className="w-10 h-10 text-white mb-2" />
                      <p className="font-medium text-white">No certificates found matching "{searchTerm}"</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-[#1E243D]/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 border border-blue-500/30">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-white text-base block leading-none mb-1">{cert.candidateName}</span>
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{cert.type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-[#0B0F19] text-white border border-[#2D334A]/50">
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
                          className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                          title="View Certificate"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => copyPortfolioLink(cert)}
                          className="p-2 text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all"
                          title="Copy Portfolio Link"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                        <Link 
                          to={`/admin/certificate/${cert.id}`}
                          className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                          title="Manage / Edit"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(cert)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
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
      </div>

      {/* Certificate Viewer Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#131726] rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden relative flex flex-col border border-[#2D334A]/50">
            <div className="p-6 pb-4 flex justify-between items-center border-b border-[#2D334A]/50">
              <div>
                <h3 className="text-xl font-bold text-white">Certificate Preview</h3>
                <p className="text-xs text-slate-400">ID: {selectedCertificate.id} • Recipient: {selectedCertificate.candidateName}</p>
              </div>
              <button 
                onClick={() => setSelectedCertificate(null)}
                className="p-2 hover:bg-[#1E243D] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 bg-[#0B0F19] overflow-y-auto max-h-[70vh] flex items-center justify-center">
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
            
            <div className="p-6 border-t border-[#2D334A]/50 bg-[#131726] flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedCertificate(null);
                  navigate(`/admin/certificate/${selectedCertificate.id}`);
                }}
                className="px-6 py-3 border border-[#2D334A] hover:bg-[#1E243D] text-white font-bold rounded-xl text-sm transition-all"
              >
                Manage Credentials
              </button>
              <a
                href={`${window.location.origin}/certificate/${selectedCertificate.id}`}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-violet-500/20"
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
