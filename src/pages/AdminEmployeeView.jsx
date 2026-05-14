import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Download, UserCircle2, MapPin, Mail, Phone, Edit2, Check, X, Calendar, Briefcase, HeartPulse, ExternalLink, Cake, Trash2, ShieldCheck, Sparkles } from 'lucide-react';
import { QRCode } from 'react-qr-code';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';

const AdminEmployeeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const qrRef = useRef();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'employees', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setEmployee(data);
        reset(data);
      } else {
        setError('Employee record not found in the secure registry.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure: Unable to fetch identity data.');
    } finally {
      setLoading(false);
    }
  };

  const onUpdate = async (data) => {
    try {
      setUpdating(true);
      const docRef = doc(db, 'employees', id);
      await updateDoc(docRef, data);
      setEmployee({ ...employee, ...data });
      setIsEditing(false);
      // Premium toast could be added here, but alert for simplicity
      alert('Dossier updated successfully!');
    } catch (err) {
      console.error("Error updating:", err);
      alert('Failed to synchronize updates.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`PERMANENT DELETION WARNING: Are you sure you want to purge the record for ${employee.name}?`)) {
      try {
        setUpdating(true);
        await deleteDoc(doc(db, 'employees', id));
        alert('Identity record purged successfully.');
        navigate('/');
      } catch (err) {
        console.error("Error deleting:", err);
        alert('Failed to purge record.');
      } finally {
        setUpdating(false);
      }
    }
  };

  const downloadQR = () => {
    const svg = qrRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_${employee.name}_${employee.id}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em]">Decrypting Profile...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mt-12 bg-slate-900/40 backdrop-blur-3xl p-16 rounded-[3.5rem] text-center border border-white/5 shadow-2xl"
      >
        <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-500/20">
          <X className="w-12 h-12" />
        </div>
        <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{error}</h3>
        <Link to="/" className="inline-flex items-center gap-2 text-primary-400 font-black uppercase tracking-widest text-xs hover:text-primary-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Return to Hub
        </Link>
      </motion.div>
    );
  }

  const qrUrl = `${window.location.origin}/employee/${employee.id}`;

  const inputClasses = "w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold";
  const labelClasses = "text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block ml-1";

  return (
    <div className="max-w-7xl mx-auto pb-24">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-6"
        >
          <Link to="/" className="p-4 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-white/10 transition-all shadow-xl">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter">Dossier Management</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Active Record: {employee.name}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex flex-wrap gap-4"
        >
          <button
            onClick={() => {
              if (isEditing) reset(employee);
              setIsEditing(!isEditing);
            }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs py-4 px-8 rounded-2xl border transition-all ${
              isEditing 
              ? 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700' 
              : 'bg-primary-600 text-white border-primary-500 shadow-xl shadow-primary-600/20 hover:bg-primary-500'
            }`}
          >
            {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
          
          <button
            onClick={handleDelete}
            disabled={updating}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs py-4 px-8 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-all disabled:opacity-50 shadow-xl shadow-rose-500/5"
          >
            <Trash2 className="w-5 h-5" />
            Purge Record
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Main Content Area */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.form 
                key="edit-mode"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleSubmit(onUpdate)} 
                className="bg-slate-900/40 backdrop-blur-3xl rounded-[3.5rem] shadow-2xl border border-white/10 overflow-hidden"
              >
                <div className="p-10 md:p-14 space-y-12">
                  <h3 className="text-2xl font-black text-white flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-500/20 text-primary-400 rounded-xl flex items-center justify-center border border-primary-500/20">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    Identity Synchronization
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-1">
                      <label className={labelClasses}>Full Identity Name</label>
                      <input {...register('name', { required: true })} className={inputClasses} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Department Vector</label>
                      <select {...register('department', { required: true })} className={`${inputClasses} appearance-none`}>
                        <option value="Management" className="bg-slate-900">Management</option>
                        <option value="Development" className="bg-slate-900">Development</option>
                        <option value="Designing" className="bg-slate-900">Designing</option>
                        <option value="Business Development" className="bg-slate-900">Business Development</option>
                        <option value="Process Associate" className="bg-slate-900">Process Associate</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Temporal Birth Date</label>
                      <input type="date" {...register('dateOfBirth')} className={inputClasses} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Contact Email Node</label>
                      <input {...register('email', { required: true })} className={inputClasses} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Primary Phone Link</label>
                      <input {...register('phoneNumber', { required: true })} className={inputClasses} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Emergency Response Link</label>
                      <input {...register('emergencyContact')} className={inputClasses} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Blood Type Group</label>
                      <input {...register('bloodGroup')} className={inputClasses} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Employment Class</label>
                      <select {...register('employeeType')} className={`${inputClasses} appearance-none`}>
                        <option value="Full-time" className="bg-slate-900">Full-time</option>
                        <option value="Part-time" className="bg-slate-900">Part-time</option>
                        <option value="Contract" className="bg-slate-900">Contract</option>
                        <option value="Intern" className="bg-slate-900">Intern</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={labelClasses}>Primary Station Coordinates (Address)</label>
                    <textarea {...register('currentAddress')} rows="3" className={`${inputClasses} resize-none`} />
                  </div>

                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-black py-6 rounded-3xl flex items-center justify-center gap-4 transition-all shadow-2xl shadow-primary-600/20 disabled:opacity-50 uppercase tracking-widest text-sm"
                  >
                    {updating ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-6 h-6" />}
                    {updating ? 'Synchronizing...' : 'Apply Registry Updates'}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="view-mode"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900/40 backdrop-blur-3xl rounded-[3.5rem] shadow-2xl border border-white/10 overflow-hidden"
              >
                {/* Profile Hero */}
                <div className="p-10 md:p-14 flex flex-col md:flex-row gap-12 items-center md:items-start border-b border-white/5 bg-gradient-to-br from-primary-500/5 to-transparent">
                  <div className="w-48 h-48 rounded-[3.5rem] bg-slate-950 p-1.5 border border-white/10 shadow-2xl relative overflow-hidden flex-shrink-0 group">
                    <div className="absolute inset-0 bg-primary-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-full h-full rounded-[3rem] overflow-hidden bg-slate-900 flex items-center justify-center relative z-10">
                      {employee.photoUrl ? (
                        <img src={employee.photoUrl} alt={employee.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle2 className="w-24 h-24 text-slate-800" />
                      )}
                    </div>
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <div className="inline-flex items-center gap-3 px-5 py-2 bg-slate-950/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-6 border border-white/5 shadow-inner">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary-500" />
                      ID: {employee.id}
                    </div>
                    <h3 className="text-5xl font-black text-white tracking-tighter leading-tight mb-2">{employee.name}</h3>
                    <p className="text-primary-400 text-xl font-bold tracking-tight uppercase">{employee.department}</p>
                    
                    <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
                      <div className="bg-white/5 text-slate-300 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 shadow-sm">
                        {employee.employeeType || 'Full-time'}
                      </div>
                      <div className="bg-rose-500/10 text-rose-500 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-500/10 flex items-center gap-2 shadow-sm">
                        <HeartPulse className="w-4 h-4" />
                        {employee.bloodGroup}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Grid */}
                <div className="p-10 md:p-14 bg-slate-950/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                    
                    {[
                      { icon: Mail, label: 'Contact Email', value: employee.email, color: 'blue' },
                      { icon: MapPin, label: 'Station Coordinates', value: employee.currentAddress || 'N/A', color: 'indigo' },
                      { icon: Phone, label: 'Primary Link', value: employee.phoneNumber || employee.personalContact || 'N/A', color: 'cyan' },
                      { icon: HeartPulse, label: 'Emergency Node', value: employee.emergencyContact || 'N/A', color: 'rose' },
                      { icon: Calendar, label: 'Induction Date', value: employee.dateOfJoining || 'N/A', color: 'amber' },
                      { icon: Cake, label: 'Temporal Birth', value: employee.dateOfBirth || 'N/A', color: 'pink' },
                      { icon: Briefcase, label: 'Registry Status', value: employee.employeeType || 'Full-time', color: 'emerald' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-6 group">
                        <div className={`w-12 h-12 bg-${item.color}-500/10 text-${item.color}-400 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform border border-${item.color}-500/10 shadow-lg shadow-${item.color}-500/5`}>
                          <item.icon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{item.label}</p>
                          <p className="text-white font-bold text-lg leading-tight break-all">{item.value}</p>
                        </div>
                      </div>
                    ))}

                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar QR & Actions */}
        <div className="lg:col-span-4 space-y-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/40 backdrop-blur-3xl rounded-[3.5rem] shadow-2xl border border-white/10 p-10 text-center sticky top-10"
          >
            <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">Access Key</h3>
            <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] mb-10">PERMANENT REGISTRY QR</p>
            
            <div className="bg-white p-10 rounded-[3rem] border-8 border-slate-950 inline-block mb-10 shadow-2xl group transition-all relative">
               <div className="absolute inset-0 bg-primary-500/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <QRCode
                value={qrUrl}
                size={200}
                level="H"
                ref={qrRef}
                className="mx-auto relative z-10 group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            
            <button
              onClick={downloadQR}
              className="w-full flex items-center justify-center gap-4 bg-slate-950 hover:bg-black text-white font-black py-5 px-6 rounded-3xl transition-all shadow-2xl border border-white/5 uppercase tracking-widest text-xs"
            >
              <Download className="w-5 h-5 text-primary-400" />
              Download Key Image
            </button>
            
            <div className="mt-10 pt-10 border-t border-white/5 flex flex-col gap-6">
              <Link 
                to={`/employee/${employee.id}`} 
                target="_blank"
                className="flex items-center justify-center gap-3 text-xs text-primary-400 hover:text-primary-300 font-black uppercase tracking-widest transition-all group"
              >
                Preview Public Portfolio
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminEmployeeView;
