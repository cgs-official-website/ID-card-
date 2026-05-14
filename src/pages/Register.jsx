import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Upload, CheckCircle2, QrCode } from 'lucide-react';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const Register = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
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

        const cloudinaryData = await response.json();
        photoUrl = cloudinaryData.secure_url;
      }

      const employeeData = {
        id: empId,
        name: data.name,
        department: data.department,
        email: data.email,
        phoneNumber: data.phoneNumber,
        emergencyContact: data.emergencyContact,
        dateOfJoining: data.dateOfJoining,
        dateOfBirth: data.dateOfBirth,
        employeeType: data.employeeType || 'Full-time',
        bloodGroup: data.bloodGroup,
        currentAddress: data.currentAddress,
        permanentAddress: data.permanentAddress || data.currentAddress,
        photoUrl: photoUrl,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'employees', empId), employeeData);
      setSuccess(true);
    } catch (error) {
      console.error("Error adding employee:", error);
      alert("Error submitting registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Success!</h2>
          <p className="text-slate-500 mb-8">Your employee record has been successfully registered in the system.</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors"
          >
            Register Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center items-center gap-2 mb-4">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ID Card Registration</h1>
          </div>
          <p className="text-slate-500 font-medium">Complete the form below to enroll in the system</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 md:p-12 space-y-10">
            
            {/* Photo Upload */}
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 mb-4 overflow-hidden group hover:border-primary-500 transition-colors">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary-500 transition-colors" />
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  {...register('photo', { onChange: handleImageChange, required: 'Photo is required' })}
                />
              </div>
              <p className="text-sm font-bold text-slate-700">Profile Photo *</p>
              {errors.photo && <p className="text-red-500 text-xs mt-1">{errors.photo.message}</p>}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name *</label>
                <input {...register('name', { required: 'Name is required' })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-slate-900" placeholder="John Doe" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Employee ID *</label>
                <input {...register('employeeId', { required: 'Employee ID is required' })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-slate-900" placeholder="CGS-001" />
                {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Department *</label>
                <select {...register('department', { required: 'Department is required' })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-slate-900 bg-white">
                  <option value="">Select Department</option>
                  <option value="Management">Management</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Development">Development</option>
                  <option value="Designing">Designing</option>
                  <option value="Business Development">Business Development</option>
                  <option value="Process Associate">Process Associate</option>
                </select>
                {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Blood Group *</label>
                <select {...register('bloodGroup', { required: 'Required' })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-slate-900 bg-white">
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
                {errors.bloodGroup && <p className="text-red-500 text-xs mt-1">{errors.bloodGroup.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number *</label>
                <input {...register('phoneNumber', { required: 'Required' })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-slate-900" placeholder="+91 1234567890" />
                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Emergency Contact *</label>
                <input {...register('emergencyContact', { required: 'Required' })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-slate-900" placeholder="+91 1234567890" />
                {errors.emergencyContact && <p className="text-red-500 text-xs mt-1">{errors.emergencyContact.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address *</label>
                <input type="email" {...register('email', { required: 'Required' })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-slate-900" placeholder="john@company.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Joining Date *</label>
                <input type="date" {...register('dateOfJoining', { required: 'Required' })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-slate-900" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Date of Birth *</label>
                <input type="date" {...register('dateOfBirth', { required: 'Required' })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-slate-900" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Employment Type *</label>
                <select {...register('employeeType', { required: 'Required' })} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-slate-900 bg-white">
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Current Address *</label>
                <textarea {...register('currentAddress', { required: 'Required' })} rows="2" className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-slate-900 resize-none" placeholder="Enter your full address"></textarea>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary-600/20 disabled:opacity-50 flex justify-center items-center gap-2 text-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                'Register Employee'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
