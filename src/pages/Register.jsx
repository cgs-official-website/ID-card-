import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Upload, CheckCircle2, QrCode, User, Mail, Phone, MapPin, Calendar, Droplets, Briefcase, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// TODO: Replace these with your actual Cloudinary credentials
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const Register = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const empId = data.employeeId.trim().toUpperCase();
      let photoUrl = '';
      
      if (data.photo && data.photo[0]) {
        const file = data.photo[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to upload image to Cloudinary');
        }

        const cloudinaryData = await response.json();
        photoUrl = cloudinaryData.secure_url;
      }

      const employeeData = {
        id: empId,
        name: data.name || '',
        department: data.department || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        emergencyContact: data.emergencyContact || '',
        dateOfJoining: data.dateOfJoining || '',
        dateOfBirth: data.dateOfBirth || '',
        employeeType: data.employeeType || '',
        bloodGroup: data.bloodGroup || '',
        currentAddress: data.currentAddress || '',
        permanentAddress: data.permanentAddress || '',
        photoUrl: photoUrl || '',
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'employees', empId), employeeData);
      setSuccess(true);
    } catch (error) {
      console.error("Error adding employee:", error);
      alert("Error submitting registration. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full bg-slate-900/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all font-medium";
  const labelClasses = "text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1";

  if (success) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-600/20 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse"></div>
        </div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-12 text-center shadow-2xl relative z-10"
        >
          <div className="w-24 h-24 bg-primary-500/20 text-primary-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-primary-500/20 shadow-lg shadow-primary-500/10">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Registration Complete!</h2>
          <p className="text-slate-400 font-medium leading-relaxed mb-8">
            Your identity dossier has been successfully encrypted and stored in our secure registry.
          </p>
          <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 mb-8">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Next Step</p>
            <p className="text-white text-sm font-bold">Contact HR to activate your Digital ID Badge.</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-primary-600/20"
          >
            New Registration
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] py-12 px-4 relative overflow-x-hidden selection:bg-primary-500/30">
      
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-600/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain brightness-0 invert" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">ID Verify <span className="text-primary-400">Pro</span></h1>
          </div>
          <p className="text-slate-400 font-bold text-xs tracking-[0.2em] uppercase">Secure Identity Enrollment Portal</p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/40 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 overflow-hidden shadow-2xl shadow-slate-950/50"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 md:p-14 space-y-12">
            
            {/* Photo Upload Section */}
            <div className="flex flex-col items-center group">
              <div className="relative w-40 h-40 rounded-[3rem] border-2 border-dashed border-white/20 flex items-center justify-center bg-slate-950/50 mb-4 overflow-hidden cursor-pointer hover:border-primary-500 transition-all group shadow-inner">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-slate-500 group-hover:text-primary-400 transition-colors" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Image</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  {...register('photo', { onChange: handleImageChange, required: 'Profile photo is required' })}
                />
              </div>
              <p className="text-xs font-black text-white uppercase tracking-widest">Biometric Portrait *</p>
              {errors.photo && <p className="text-red-400 text-[10px] font-bold mt-2 uppercase">{errors.photo.message}</p>}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            {/* Form Content */}
            <div className="space-y-12">
              
              {/* Section: Basic Info */}
              <div>
                <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-500/20 text-primary-400 rounded-lg flex items-center justify-center border border-primary-500/20">
                    <User className="w-4 h-4" />
                  </div>
                  Personal Dossier
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className={labelClasses}>Full Identity Name *</label>
                    <div className="relative">
                      <input {...register('name', { required: 'Name is required' })} className={inputClasses} placeholder="e.g. Johnathan Doe" />
                    </div>
                    {errors.name && <p className="text-red-400 text-[10px] font-bold mt-1 uppercase">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className={labelClasses}>Employee ID Serial *</label>
                    <input {...register('employeeId', { required: 'Employee ID is required' })} className={`${inputClasses} font-mono`} placeholder="CGS-XXXXX" />
                    {errors.employeeId && <p className="text-red-400 text-[10px] font-bold mt-1 uppercase">{errors.employeeId.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className={labelClasses}>Blood Type Group *</label>
                    <select {...register('bloodGroup', { required: 'Blood Group is required' })} className={`${inputClasses} appearance-none`}>
                      <option value="" className="bg-slate-900">Select Type</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(type => (
                        <option key={type} value={type} className="bg-slate-900">{type}</option>
                      ))}
                    </select>
                    {errors.bloodGroup && <p className="text-red-400 text-[10px] font-bold mt-1 uppercase">{errors.bloodGroup.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className={labelClasses}>Department Vector *</label>
                    <select {...register('department', { required: 'Department is required' })} className={`${inputClasses} appearance-none`}>
                      <option value="" className="bg-slate-900">Select Department</option>
                      {['Management', 'Development', 'Designing', 'Business Development', 'Process Associate'].map(dept => (
                        <option key={dept} value={dept} className="bg-slate-900">{dept}</option>
                      ))}
                    </select>
                    {errors.department && <p className="text-red-400 text-[10px] font-bold mt-1 uppercase">{errors.department.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className={labelClasses}>Primary Contact Node *</label>
                    <input {...register('phoneNumber', { required: 'Contact is required' })} className={inputClasses} placeholder="+91 XXXXX XXXXX" />
                    {errors.phoneNumber && <p className="text-red-400 text-[10px] font-bold mt-1 uppercase">{errors.phoneNumber.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className={labelClasses}>Emergency Response Link *</label>
                    <input {...register('emergencyContact', { required: 'Emergency contact is required' })} className={inputClasses} placeholder="+91 XXXXX XXXXX" />
                    {errors.emergencyContact && <p className="text-red-400 text-[10px] font-bold mt-1 uppercase">{errors.emergencyContact.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className={labelClasses}>Temporal Birth Date *</label>
                    <input type="date" {...register('dateOfBirth', { required: 'DOB is required' })} className={inputClasses} />
                    {errors.dateOfBirth && <p className="text-red-400 text-[10px] font-bold mt-1 uppercase">{errors.dateOfBirth.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className={labelClasses}>Induction Date *</label>
                    <input type="date" {...register('dateOfJoining', { required: 'Joining date is required' })} className={inputClasses} />
                    {errors.dateOfJoining && <p className="text-red-400 text-[10px] font-bold mt-1 uppercase">{errors.dateOfJoining.message}</p>}
                  </div>
                  
                  <div className="md:col-span-2 space-y-1">
                    <label className={labelClasses}>Encrypted Communication Email *</label>
                    <input type="email" {...register('email', { required: 'Email is required' })} className={inputClasses} placeholder="name@company.com" />
                    {errors.email && <p className="text-red-400 text-[10px] font-bold mt-1 uppercase">{errors.email.message}</p>}
                  </div>
                </div>
              </div>

              {/* Section: Address */}
              <div>
                <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center border border-blue-500/20">
                    <MapPin className="w-4 h-4" />
                  </div>
                  Location Registry
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className={labelClasses}>Current Station *</label>
                    <textarea {...register('currentAddress', { required: 'Required' })} className={`${inputClasses} h-32 resize-none`} placeholder="Full residential coordinates..."></textarea>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClasses}>Permanent Base *</label>
                    <textarea {...register('permanentAddress', { required: 'Required' })} className={`${inputClasses} h-32 resize-none`} placeholder="Same as above or specific location..."></textarea>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-black py-5 px-4 rounded-3xl transition-all disabled:opacity-50 flex justify-center items-center gap-3 shadow-2xl shadow-primary-600/20 text-lg uppercase tracking-widest"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Encrypting Dossier...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-6 h-6" />
                    Submit Registration
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              <p className="text-center text-[10px] font-bold text-slate-500 mt-6 uppercase tracking-[0.2em]">
                Secure 256-bit AES Encryption Active
              </p>
            </div>
          </form>
        </motion.div>
      </div>

      <style jsx>{`
        .animate-pulse-slow {
          animation: pulse-slow 10s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.1); }
        }
        select option {
          background-color: #0f172a !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
};

export default Register;
