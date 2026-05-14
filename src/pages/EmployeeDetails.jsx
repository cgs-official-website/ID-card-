import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Mail, Phone, Building, UserCircle2, Calendar, Briefcase, HeartPulse, MapPin, ShieldCheck, ExternalLink, Cake, Award, Globe } from 'lucide-react';
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
        setError('Error connecting to database');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-slate-900 to-blue-900/20"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center gap-8"
        >
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-primary-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 border-4 border-blue-500/20 rounded-full animate-pulse"></div>
          </div>
          <div className="text-center">
            <h2 className="text-white text-xl font-black tracking-widest uppercase mb-2">ID Verify Pro</h2>
            <p className="text-primary-400 font-bold text-xs animate-pulse">AUTHENTICATING SECURE IDENTITY...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-slate-950 to-slate-950"></div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/5 backdrop-blur-2xl p-12 rounded-[3rem] border border-white/10 max-w-sm w-full text-center shadow-2xl relative z-10"
        >
          <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 transform -rotate-12 border border-red-500/20 shadow-lg shadow-red-500/10">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 tracking-tight leading-tight">Verification Failed</h2>
          <p className="text-slate-400 font-medium leading-relaxed mb-8">{error || 'This digital identity could not be verified in our secure registry.'}</p>
          <button onClick={() => window.location.reload()} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all">
            Retry Verification
          </button>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-primary-500/30 selection:text-white overflow-x-hidden">
      
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-600/20 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[100px] rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-16">
        
        {/* Navigation / Brand Header */}
        <motion.div 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center mb-16 px-4"
        >
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-xl">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
              <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain brightness-0 invert" />
            </div>
            <span className="font-black text-white tracking-tighter text-sm uppercase">ID Verify <span className="text-primary-400">Pro</span></span>
          </div>
          <div className="flex gap-2">
            <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-500/20">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Secure Identity
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Profile Hero Section */}
          <motion.div 
            variants={itemVariants}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-blue-600 rounded-[3.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-slate-900/40 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 p-8 md:p-14 overflow-hidden shadow-2xl">
              
              {/* Decorative Background Element */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary-500/10 blur-3xl rounded-full"></div>
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16 relative z-10">
                
                {/* Photo Container */}
                <div className="relative">
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    className="w-48 h-48 md:w-64 md:h-64 rounded-[3.5rem] p-1.5 bg-gradient-to-br from-white/20 to-white/5 shadow-2xl relative overflow-hidden"
                  >
                    <div className="w-full h-full rounded-[3rem] overflow-hidden bg-slate-800 flex items-center justify-center">
                      {employee.photoUrl ? (
                        <img src={employee.photoUrl} alt={employee.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle2 className="w-32 h-32 text-slate-700" />
                      )}
                    </div>
                  </motion.div>
                  {/* Badge */}
                  <div className="absolute -bottom-4 -right-4 bg-primary-500 text-white p-4 rounded-3xl shadow-xl border-4 border-slate-900 transform rotate-12">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                <div className="text-center md:text-left flex-1">
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/10 text-primary-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-6 border border-primary-500/20"
                  >
                    {employee.employeeType || 'Professional Profile'}
                  </motion.div>
                  
                  <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 leading-[0.9]">
                    {employee.name.split(' ').map((word, i) => (
                      <span key={i} className={i % 2 !== 0 ? "text-transparent bg-clip-text bg-gradient-to-br from-primary-400 to-blue-500" : ""}>
                        {word}{' '}
                      </span>
                    ))}
                  </h1>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-400 font-bold mb-8">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                      <Briefcase className="w-4 h-4 text-primary-400" />
                      {employee.department}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      {employee.currentAddress?.split(',')[0] || 'Remote'}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="bg-slate-950/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-inner">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Badge ID</p>
                      <p className="text-white font-mono font-bold">{employee.id}</p>
                    </div>
                    <div className="bg-rose-500/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-rose-500/20 shadow-inner">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Blood Type</p>
                      <p className="text-rose-500 font-bold flex items-center gap-2">
                        <HeartPulse className="w-3.5 h-3.5" />
                        {employee.bloodGroup}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Contact Card */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-slate-900/40 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Globe className="w-24 h-24 text-primary-400" />
              </div>
              
              <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/20 text-primary-400 rounded-xl flex items-center justify-center border border-primary-500/20">
                  <Phone className="w-5 h-5" />
                </div>
                Connectivity
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Official Email</p>
                  <p className="text-lg font-bold text-white break-all">{employee.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Voice Call</p>
                  <p className="text-lg font-bold text-white">{employee.phoneNumber || employee.personalContact || 'N/A'}</p>
                </div>
                <div className="sm:col-span-2 pt-4 flex gap-4">
                  <a href={`mailto:${employee.email}`} className="p-4 bg-primary-500/10 text-primary-400 rounded-2xl border border-primary-500/20 hover:bg-primary-500 hover:text-white transition-all">
                    <Mail className="w-6 h-6" />
                  </a>
                  <a href={`tel:${employee.phoneNumber || employee.personalContact}`} className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all">
                    <Phone className="w-6 h-6" />
                  </a>
                  <div className="flex-1"></div>
                  <div className="flex gap-2">
                    <button className="p-4 bg-white/5 text-slate-400 rounded-2xl border border-white/10 hover:text-white transition-all"><Globe className="w-5 h-5" /></button>
                    <button className="p-4 bg-white/5 text-slate-400 rounded-2xl border border-white/10 hover:text-white transition-all"><Mail className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Timeline / Dates Card */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bg-slate-900/40 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 shadow-2xl"
            >
              <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
                  <Calendar className="w-5 h-5" />
                </div>
                Registry
              </h3>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-1 px-0.5 bg-gradient-to-b from-primary-500 to-transparent rounded-full"></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Joined Fleet</p>
                    <p className="text-lg font-bold text-white">{employee.dateOfJoining || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1 px-0.5 bg-gradient-to-b from-blue-500 to-transparent rounded-full"></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Born On</p>
                    <p className="text-lg font-bold text-white">{employee.dateOfBirth || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Emergency & Address */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="md:col-span-3 bg-gradient-to-br from-rose-500/10 to-slate-900/40 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 shadow-2xl flex flex-col md:flex-row gap-10 items-center"
            >
              <div className="flex-1 w-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <HeartPulse className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-white font-black uppercase tracking-widest text-xs">Emergency Response</h4>
                    <p className="text-2xl font-black text-rose-500 leading-none mt-1">{employee.emergencyContact}</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm font-medium leading-relaxed italic">
                  "In case of emergency, the above contact is authorized to receive medical and operational updates."
                </p>
              </div>
              
              <div className="w-px h-20 bg-white/10 hidden md:block"></div>
              
              <div className="flex-1 w-full">
                <h4 className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-3">Primary Station</h4>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0 mt-1" />
                  <p className="text-white font-bold text-lg leading-tight">{employee.currentAddress}</p>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Action Footer */}
          <motion.div 
            variants={itemVariants}
            className="pt-12 text-center"
          >
            <div className="inline-flex flex-col items-center gap-6">
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em]">Digital Seal</p>
                <div className="bg-white/5 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center shadow-inner">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-black text-xs">VERIFIED IDENTITY</p>
                    <p className="text-slate-500 font-mono text-[10px]">AUTH_HASH: {id.substring(0, 12)}...</p>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 font-medium text-[10px] max-w-xs">
                This identity profile is encrypted and verified by the ID Verify Pro Secure Registry on {new Date().toLocaleDateString()}.
              </p>
            </div>
          </motion.div>

        </motion.div>
      </div>
      
      {/* Custom Styles for Noise and Animations */}
      <style jsx>{`
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDetails;
