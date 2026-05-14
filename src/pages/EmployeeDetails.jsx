import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Mail, Phone, Building, UserCircle2, Calendar, Briefcase, HeartPulse, MapPin, ShieldCheck, ExternalLink, Cake, Award, Globe, Zap, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeDetails = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'employees', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setEmployee({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Employee Profile Not Found');
        }
      } catch (err) {
        console.error("Error fetching employee:", err);
        setError('Connection Security Alert: Unable to verify identity.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-primary-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-400 font-bold text-xs tracking-[0.3em] uppercase">Validating Identity...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 max-w-sm w-full text-center"
        >
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-rose-100">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Security Alert</h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-8">{error}</p>
          <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
            Retry Scan
          </button>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-600 selection:bg-primary-500/10 selection:text-primary-700 font-sans overflow-x-hidden">
      
      {/* Decorative Light Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-500/5 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10 md:py-20">
        
        {/* Brand Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center mb-16"
        >
          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-8 py-4 rounded-[2rem] border border-white shadow-xl shadow-slate-200/50 mb-4">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <img src="/logo.png" alt="Office Logo" className="w-6 h-6 object-contain brightness-0 invert" />
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase">ID Verify <span className="text-primary-600">Pro</span></h1>
          </div>
          <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100 shadow-sm flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Authenticated Identity Dossier
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Main ID Card Section */}
          <motion.div variants={itemVariants} className="relative">
            <div className="bg-white rounded-[4rem] border border-white shadow-2xl shadow-slate-300/40 p-8 md:p-14 overflow-hidden relative group">
              
              {/* Card Design Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 border border-slate-100/50"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-50 rounded-full -ml-16 -mb-16 border border-primary-100/30"></div>
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-12 relative z-10">
                
                {/* Photo Portrait */}
                <div className="relative group/photo">
                  <div className="absolute inset-0 bg-primary-500 blur-2xl opacity-10 group-hover/photo:opacity-20 transition-opacity"></div>
                  <div className="w-48 h-48 md:w-64 md:h-64 rounded-[3.5rem] p-1 bg-white shadow-2xl relative z-10 overflow-hidden border border-slate-100">
                    <div className="w-full h-full rounded-[3rem] overflow-hidden bg-slate-50 flex items-center justify-center">
                      {employee.photoUrl ? (
                        <img src={employee.photoUrl} alt={employee.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle2 className="w-32 h-32 text-slate-200" />
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-primary-500 text-white p-4 rounded-3xl shadow-xl border-4 border-white transform rotate-6 z-20">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                <div className="text-center md:text-left flex-1 py-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6 border border-primary-100">
                    {employee.employeeType || 'Full-time Employee'}
                  </div>
                  
                  <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-4">
                    {employee.name}
                  </h2>
                  
                  <p className="text-xl font-bold text-slate-400 mb-8 tracking-tight flex items-center justify-center md:justify-start gap-3">
                    <Briefcase className="w-5 h-5 text-primary-500" />
                    {employee.department}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100 shadow-sm group hover:bg-white transition-colors">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Badge ID</p>
                      <p className="text-slate-900 font-black tracking-tight">{employee.id}</p>
                    </div>
                    <div className="bg-rose-50 px-6 py-4 rounded-3xl border border-rose-100 shadow-sm group hover:bg-white transition-colors">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Blood Group</p>
                      <p className="text-rose-600 font-black flex items-center gap-2">
                        <HeartPulse className="w-4 h-4" />
                        {employee.bloodGroup}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Info Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Contact & Station */}
            <motion.div variants={itemVariants} className="bg-white rounded-[3.5rem] p-10 border border-white shadow-xl shadow-slate-200/50">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                Contact Network
              </h3>
              
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Digital Mail</p>
                    <p className="text-slate-900 font-bold">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Direct Link</p>
                    <p className="text-slate-900 font-bold">{employee.phoneNumber || employee.personalContact || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Primary Station</p>
                    <p className="text-slate-900 font-bold leading-tight">{employee.currentAddress}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Registry Info */}
            <motion.div variants={itemVariants} className="bg-white rounded-[3.5rem] p-10 border border-white shadow-xl shadow-slate-200/50">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                Registry Temporal
              </h3>
              
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Induction Date</p>
                    <p className="text-slate-900 font-bold">{employee.dateOfJoining || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Cake className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date of Birth</p>
                    <p className="text-slate-900 font-bold">{employee.dateOfBirth || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-5 pt-4">
                  <div className="w-full bg-rose-50 p-6 rounded-[2rem] border border-rose-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Emergency Response</p>
                      <p className="text-rose-600 font-black text-lg leading-none">{employee.emergencyContact}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer Branding */}
          <motion.div variants={itemVariants} className="pt-12 text-center">
            <div className="inline-flex flex-col items-center gap-6">
              <div className="h-px w-24 bg-slate-200"></div>
              <div className="flex items-center gap-4 text-slate-300">
                <ShieldCheck className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Official Secure Registry</span>
              </div>
              <p className="text-slate-400 font-medium text-xs max-w-xs leading-relaxed">
                This identity profile is verified and authorized by the company security protocols as of {new Date().toLocaleDateString()}.
              </p>
            </div>
          </motion.div>

        </motion.div>
      </div>

      <style jsx>{`
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDetails;
