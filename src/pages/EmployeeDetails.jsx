import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Mail, Phone, Building, UserCircle2, Calendar, Briefcase, HeartPulse, MapPin, ShieldCheck, ExternalLink, MessageSquare } from 'lucide-react';
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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-100 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">Verifying Digital Identity</p>
        </motion.div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-red-50 max-w-sm w-full text-center"
        >
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 transform -rotate-12">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Access Denied</h2>
          <p className="text-slate-500 font-medium leading-relaxed">{error || 'This digital identity could not be verified in our secure registry.'}</p>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-primary-100 selection:text-primary-900">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary-200/20 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-200/20 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-indigo-100/30 blur-[150px] rounded-full"></div>
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-12 md:py-20">
        
        {/* Header / Logo */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-center mb-12"
        >
          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md px-6 py-3 rounded-full border border-white shadow-sm">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-black text-slate-900 tracking-tighter text-lg uppercase">ID Verify Pro</span>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Profile Hero Card */}
          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-white p-8 md:p-12 relative overflow-hidden"
          >
            {/* Top Right Status */}
            <div className="absolute top-8 right-8">
              <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-emerald-100">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Verified
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary-500 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2.5rem] bg-slate-50 p-1.5 border border-white shadow-lg relative overflow-hidden transform group-hover:scale-[1.02] transition-transform duration-500">
                  <div className="w-full h-full rounded-[2rem] overflow-hidden bg-white flex items-center justify-center">
                    {employee.photoUrl ? (
                      <img src={employee.photoUrl} alt={employee.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <UserCircle2 className="w-24 h-24 text-slate-200" />
                    )}
                  </div>
                </div>
              </div>

              <div className="text-center md:text-left">
                <div className="text-primary-600 font-black text-xs uppercase tracking-[0.3em] mb-3">
                  {employee.employeeType || 'Employee'}
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2 leading-tight">
                  {employee.name}
                </h1>
                <p className="text-slate-500 text-lg font-medium">{employee.department}</p>
                
                <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                  <span className="bg-slate-50 text-slate-600 px-4 py-2 rounded-2xl text-xs font-bold border border-slate-100">
                    ID: {employee.id}
                  </span>
                  <span className="bg-red-50 text-red-600 px-4 py-2 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-2">
                    <HeartPulse className="w-3.5 h-3.5" />
                    {employee.bloodGroup}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/30 hover:shadow-2xl transition-all duration-500 group">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Professional Email</p>
              <p className="text-lg font-bold text-slate-800 break-all">{employee.email}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/30 hover:shadow-2xl transition-all duration-500 group">
              <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Primary Phone</p>
              <p className="text-lg font-bold text-slate-800">{employee.phoneNumber}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/30 hover:shadow-2xl transition-all duration-500 group">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Employment Details</p>
              <p className="text-lg font-bold text-slate-800">{employee.department}</p>
              <p className="text-slate-400 font-medium text-sm mt-1">Joined {employee.dateOfJoining}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/30 hover:shadow-2xl transition-all duration-500 group">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Primary Location</p>
              <p className="text-lg font-bold text-slate-800">{employee.currentAddress}</p>
            </motion.div>

          </div>

          {/* Emergency Section */}
          <motion.div variants={itemVariants} className="bg-rose-50 rounded-[2.5rem] border border-rose-100 p-8 flex items-center justify-between group">
            <div>
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Emergency Contact</p>
              <p className="text-xl font-black text-rose-600">{employee.emergencyContact}</p>
            </div>
            <div className="w-14 h-14 bg-white text-rose-500 rounded-2xl flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform">
              <HeartPulse className="w-7 h-7" />
            </div>
          </motion.div>

          {/* Footer Actions */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 pt-4">
            <a 
              href={`mailto:${employee.email}`}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-5 px-8 rounded-3xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-slate-900/10"
            >
              <Mail className="w-5 h-5" />
              Send Email
            </a>
            <a 
              href={`tel:${employee.phoneNumber}`}
              className="flex-1 bg-white hover:bg-slate-50 text-slate-900 font-bold py-5 px-8 rounded-3xl flex items-center justify-center gap-3 transition-all border border-slate-200 transform active:scale-95 shadow-sm"
            >
              <Phone className="w-5 h-5 text-primary-600" />
              Call Now
            </a>
          </motion.div>

          <motion.p 
            variants={itemVariants}
            className="text-center text-slate-400 font-medium text-xs pt-8 pb-4"
          >
            Digital Identity verified on {new Date().toLocaleDateString()}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
