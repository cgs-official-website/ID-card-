import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Mail, Phone, UserCircle2, Calendar, Briefcase, HeartPulse, MapPin, ShieldCheck, Cake, Award, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

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
        console.error('Error fetching employee:', err);
        setError('Unable to verify identity. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-[#2D334A]/40 rounded-full" />
            <div className="absolute inset-0 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-[6px] border-4 border-blue-500/30 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-slate-400 font-bold text-xs tracking-[0.4em] uppercase">Validating Identity...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#131726]/80 backdrop-blur-md p-12 rounded-[3rem] border border-[#2D334A]/50 max-w-sm w-full text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
            <ShieldCheck className="w-10 h-10 text-rose-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold rounded-2xl hover:from-violet-500 hover:to-blue-500 transition-all"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const fadeUp = { hidden: { y: 24, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 90, damping: 18 } } };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white overflow-x-hidden selection:bg-violet-500/30">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[55%] h-[55%] bg-violet-700/10 blur-[160px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[45%] h-[45%] bg-blue-700/10 blur-[130px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 md:py-16 space-y-8">

        {/* ── Header ── */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center gap-3 mb-4">
          <div className="flex items-center gap-3 bg-[#131726]/80 backdrop-blur-md px-6 py-3 rounded-full border border-[#2D334A]/60 shadow-xl">
            <img src="/logo.png" alt="CGS" className="w-9 h-9 object-contain bg-white p-1.5 rounded-xl shadow-sm" />
            <div className="h-6 w-px bg-[#2D334A]" />
            <span className="text-base font-black tracking-wider text-white uppercase">CGS Verified ID</span>
          </div>
          <div className="flex items-center gap-2 bg-violet-500/10 text-violet-300 text-[10px] font-black uppercase tracking-[0.25em] px-4 py-1.5 rounded-full border border-violet-500/25">
            <ShieldCheck className="w-3.5 h-3.5" /> Authenticated Identity
          </div>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">

          {/* ── Hero Card ── */}
          <motion.div variants={fadeUp}>
            <div className="relative bg-gradient-to-br from-[#131726] to-[#0d1220] rounded-[3rem] border border-[#2D334A]/60 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
              {/* decorative gradient bar at top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-blue-500 to-violet-600" />
              {/* decorative circles */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/5 rounded-full border border-violet-500/10" />
              <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-blue-600/5 rounded-full border border-blue-500/10" />

              <div className="relative p-8 md:p-14 flex flex-col md:flex-row items-center md:items-start gap-10">
                {/* Photo */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-blue-500 rounded-[3rem] blur-xl opacity-20" />
                  <div className="relative w-44 h-44 md:w-56 md:h-56 rounded-[2.5rem] overflow-hidden bg-[#1E243D] border-2 border-[#2D334A]/60 shadow-2xl">
                    {employee.photoUrl ? (
                      <img src={employee.photoUrl} alt={employee.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600/20 to-blue-600/20">
                        <UserCircle2 className="w-28 h-28 text-slate-600" />
                      </div>
                    )}
                  </div>
                  {/* badge */}
                  <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-tr from-violet-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/30 border border-white/10">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/15 text-violet-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-violet-500/25 mb-5">
                    {employee.employeeType || 'Full-time Employee'}
                  </span>

                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-2">
                    {employee.name}
                  </h2>
                  <p className="text-violet-400 font-bold text-lg mb-6 flex items-center justify-center md:justify-start gap-2">
                    <Briefcase className="w-4 h-4" />
                    {employee.role || 'Professional'} · {employee.department}
                  </p>

                  {/* Quick stats row */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-7">
                    <div className="bg-[#0B0F19]/60 border border-[#2D334A]/50 rounded-2xl px-4 py-3">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Employee ID</p>
                      <p className="text-white font-black text-sm">{employee.id}</p>
                    </div>
                    <div className="bg-rose-500/8 border border-rose-500/20 rounded-2xl px-4 py-3">
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Blood Group</p>
                      <p className="text-rose-400 font-black text-sm flex items-center gap-1.5">
                        <HeartPulse className="w-3.5 h-3.5" />{employee.bloodGroup || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-blue-500/8 border border-blue-500/20 rounded-2xl px-4 py-3 col-span-2 md:col-span-1">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Department</p>
                      <p className="text-blue-300 font-black text-sm">{employee.department}</p>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex gap-3 justify-center md:justify-start">
                    <a
                      href={`tel:${employee.phoneNumber || employee.personalContact}`}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <Phone className="w-4 h-4" /> Call Now
                    </a>
                    <a
                      href={`tel:${employee.emergencyContact}`}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <HeartPulse className="w-4 h-4" /> For Emergency
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Info Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Contact */}
            <motion.div variants={fadeUp} className="bg-[#131726]/80 backdrop-blur-md rounded-[2.5rem] border border-[#2D334A]/50 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-500/15 rounded-2xl flex items-center justify-center border border-blue-500/20">
                  <Phone className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Contact Details</h3>
              </div>
              <div className="space-y-5">
                {[
                  { icon: <Mail className="w-4 h-4" />, label: 'Email', value: employee.email, href: `mailto:${employee.email}`, color: 'text-violet-400' },
                  { icon: <Phone className="w-4 h-4" />, label: 'Phone', value: employee.phoneNumber || employee.personalContact || 'N/A', href: `tel:${employee.phoneNumber || employee.personalContact}`, color: 'text-emerald-400' },
                  { icon: <MapPin className="w-4 h-4" />, label: 'Address', value: employee.currentAddress || 'N/A', href: null, color: 'text-amber-400' },
                ].map(({ icon, label, value, href, color }) => (
                  <div key={label} className="flex items-start gap-4 group">
                    <div className={`w-9 h-9 rounded-xl bg-[#1E243D] flex items-center justify-center flex-shrink-0 border border-[#2D334A]/40 ${color}`}>
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
                      {href ? (
                        <a href={href} className={`font-bold break-all text-sm ${color} hover:underline underline-offset-2 transition-all`}>{value}</a>
                      ) : (
                        <p className="text-white font-semibold text-sm leading-snug">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Registry */}
            <motion.div variants={fadeUp} className="bg-[#131726]/80 backdrop-blur-md rounded-[2.5rem] border border-[#2D334A]/50 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-amber-500/15 rounded-2xl flex items-center justify-center border border-amber-500/20">
                  <Calendar className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Registry Details</h3>
              </div>
              <div className="space-y-5">
                {[
                  { icon: <Zap className="w-4 h-4" />, label: 'Joining Date', value: employee.dateOfJoining || 'N/A', color: 'text-violet-400' },
                  { icon: <Cake className="w-4 h-4" />, label: 'Date of Birth', value: employee.dateOfBirth || 'N/A', color: 'text-pink-400' },
                  { icon: <Briefcase className="w-4 h-4" />, label: 'Employment Type', value: employee.employeeType || 'Full-time', color: 'text-blue-400' },
                ].map(({ icon, label, value, color }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl bg-[#1E243D] flex items-center justify-center flex-shrink-0 border border-[#2D334A]/40 ${color}`}>
                      {icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
                      <p className="text-white font-semibold text-sm">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Emergency */}
              <div className="mt-6 p-5 bg-rose-500/8 border border-rose-500/20 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center border border-rose-500/30 flex-shrink-0">
                  <HeartPulse className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Emergency Contact</p>
                  <a href={`tel:${employee.emergencyContact}`} className="text-white font-black text-base hover:text-rose-300 transition-colors">
                    {employee.emergencyContact || 'N/A'}
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Footer ── */}
          <motion.div variants={fadeUp} className="text-center pt-4 pb-8">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#2D334A]" />
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#2D334A]" />
              </div>
              <p className="text-slate-600 text-[11px] font-bold uppercase tracking-[0.3em]">Official Secure Registry</p>
              <p className="text-slate-600 text-xs max-w-xs leading-relaxed">
                Verified & authorized by CGS security protocols · {new Date().toLocaleDateString()}
              </p>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
