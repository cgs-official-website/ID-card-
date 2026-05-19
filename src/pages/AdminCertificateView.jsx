import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Edit2, Check, X, Calendar, Award, ExternalLink, Copy, Trash2, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import CertificateSVG from '../components/CertificateSVG';
import NotifyModal from '../components/NotifyModal';

const AdminCertificateView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notify, setNotify] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const showNotify = (type, title, message) => setNotify({ type, title, message });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchCertificate();
  }, [id]);

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'employees', id.toUpperCase());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().isCertificate) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setCert(data);
        reset(data);
      } else {
        setError('Certificate record not found');
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching certificate data');
    } finally {
      setLoading(false);
    }
  };

  const onUpdate = async (data) => {
    try {
      setUpdating(true);
      const docRef = doc(db, 'employees', id.toUpperCase());
      const newId = data.id.trim().toUpperCase();
      const certificateData = { id: newId, candidateName: data.candidateName.trim(), domain: data.domain.trim(), duration: data.duration.trim(), type: data.type, isCertificate: true };
      if (newId !== id.toUpperCase()) {
        const newDocRef = doc(db, 'employees', newId);
        const newDocSnap = await getDoc(newDocRef);
        if (newDocSnap.exists()) {
          showNotify('error', 'ID Conflict', 'A certificate with this Code already exists. Please use a unique Code.');
          setUpdating(false);
          return;
        }
        await setDoc(newDocRef, { ...cert, ...certificateData });
        await deleteDoc(docRef);
        setCert({ ...cert, ...certificateData });
        setIsEditing(false);
        showNotify('success', 'Record Updated', 'Certificate Code and record updated successfully!');
        navigate(`/admin/certificate/${newId}`, { replace: true });
      } else {
        await updateDoc(docRef, certificateData);
        setCert({ ...cert, ...certificateData });
        setIsEditing(false);
        showNotify('success', 'Record Updated', 'Certificate data updated successfully!');
      }
    } catch (err) {
      console.error('Error updating certificate:', err);
      showNotify('error', 'Update Failed', 'Failed to update certificate data.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => setPendingDelete(true);

  const confirmDelete = async () => {
    try {
      setUpdating(true);
      await deleteDoc(doc(db, 'employees', id.toUpperCase()));
      navigate('/certificates');
    } catch (err) {
      console.error('Error deleting certificate:', err);
      showNotify('error', 'Delete Failed', 'Failed to delete certificate record.');
    } finally {
      setUpdating(false);
    }
  };

  const copyPortfolioLink = () => {
    const link = `${window.location.origin}/certificate/${cert.id}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-rose-500/10 p-12 rounded-[2.5rem] text-center border border-rose-500/20">
        <X className="w-16 h-16 text-rose-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">{error}</h3>
        <Link to="/certificates" className="mt-6 inline-block text-violet-400 font-bold hover:underline">Back to Certificates</Link>
      </div>
    );
  }

  const portfolioUrl = `${window.location.origin}/certificate/${cert.id}`;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {notify && (
        <NotifyModal type={notify.type} title={notify.title} message={notify.message} onClose={() => setNotify(null)} />
      )}
      {pendingDelete && (
        <NotifyModal
          type="confirm"
          title="Delete Certificate?"
          message={`Are you sure you want to permanently delete the certificate for ${cert?.candidateName}? This cannot be undone.`}
          confirmText="Yes, Delete"
          cancelText="Cancel"
          onClose={() => setPendingDelete(false)}
          onConfirm={confirmDelete}
        />
      )}
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/certificates" className="p-3 bg-[#131726] hover:bg-[#1E243D] rounded-2xl border border-[#2D334A]/50 transition-all shadow-sm">
            <ArrowLeft className="w-6 h-6 text-slate-300" />
          </Link>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Certificate Details</h2>
            <p className="text-slate-400 font-medium text-sm">Manage or modify credentials for {cert.candidateName}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              if (isEditing) reset(cert);
              setIsEditing(!isEditing);
            }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-2xl border transition-all ${
              isEditing 
              ? 'bg-[#1E243D] text-slate-300 border-[#2D334A]/50 hover:bg-[#252B48]' 
              : 'bg-[#131726] text-violet-400 border-[#2D334A]/50 hover:bg-[#1E243D]'
            }`}
          >
            {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
            {isEditing ? 'Cancel Edit' : 'Edit Credentials'}
          </button>
          
          <button
            onClick={handleDelete}
            disabled={updating}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
            Delete Certificate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Info Form/Detail Col */}
        <div className="lg:col-span-6">
          {isEditing ? (
            <form onSubmit={handleSubmit(onUpdate)} className="bg-[#131726]/80 backdrop-blur-md rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D334A]/50 overflow-hidden">
              <div className="p-8 md:p-10 space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-500/20 text-violet-400 rounded-lg flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  Edit Information
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Certificate Code / ID</label>
                    <input {...register('id', { required: true })} className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Candidate Name</label>
                    <input {...register('candidateName', { required: true })} className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Domain</label>
                    <input {...register('domain', { required: true })} className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Duration</label>
                    <input {...register('duration', { required: true })} className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Certificate Type</label>
                    <select {...register('type', { required: true })} className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white">
                      <option value="Internship">Internship</option>
                      <option value="Training">Training</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
                >
                  {updating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-6 h-6" />}
                  {updating ? 'Saving Changes...' : 'Update Certificate'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-[#131726]/80 backdrop-blur-md rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D334A]/50 overflow-hidden h-full flex flex-col justify-between">
              <div className="p-8 md:p-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold border border-blue-500/30">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Certificate Code: {cert.id}</span>
                    <h3 className="text-2xl font-black text-white leading-tight">{cert.candidateName}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#2D334A]/50">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Program Type</span>
                    <p className="text-slate-200 font-bold mt-1 text-base">{cert.type}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Domain</span>
                    <p className="text-slate-200 font-bold mt-1 text-base">{cert.domain}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</span>
                    <p className="text-slate-200 font-bold mt-1 text-base">{cert.duration}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Status</span>
                    <p className="text-emerald-400 font-black mt-1 text-base flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Active & Verified
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-[#0B0F19]/30 border-t border-[#2D334A]/50 flex flex-col gap-3">
                <button
                  onClick={copyPortfolioLink}
                  className="w-full flex items-center justify-center gap-3 bg-[#1E243D] hover:bg-[#252B48] text-white font-black py-4 px-6 rounded-2xl border border-[#2D334A]/50 transition-all shadow-sm"
                >
                  <Copy className="w-5 h-5" />
                  Copy Student Portfolio Link
                </button>
                <a
                  href={portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg shadow-violet-500/20"
                >
                  <ExternalLink className="w-5 h-5" />
                  View Public Portfolio
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Certificate Display Col */}
        <div className="lg:col-span-6 space-y-6">
          <div className="text-center lg:text-left">
            <h3 className="text-lg font-black text-white">Verified Certificate Image</h3>
            <p className="text-sm text-slate-400">Live preview generated for this credential.</p>
          </div>
          
          <div className="border border-[#2D334A]/50 rounded-3xl overflow-hidden bg-[#0B0F19] shadow-[0_8px_30px_rgb(0,0,0,0.3)] p-4">
            <CertificateSVG
              candidateName={cert.candidateName}
              domain={cert.domain}
              duration={cert.duration}
              certificateCode={cert.id}
              type={cert.type}
              qrUrl={portfolioUrl}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminCertificateView;
