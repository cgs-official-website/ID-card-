import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Upload, CheckCircle2, QrCode, Crop } from 'lucide-react';
import ImageCropModal from '../components/ImageCropModal';
import NotifyModal from '../components/NotifyModal';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const Register = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [notify, setNotify] = useState(null); // { type, title, message }

  const showNotify = (type, title, message) => setNotify({ type, title, message });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setRawImageSrc(ev.target.result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (blob, dataUrl) => {
    setCroppedBlob(blob);
    setPreviewImage(dataUrl);
    setShowCropModal(false);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const empId = data.employeeId.trim().toUpperCase();
      let photoUrl = '';

      if (croppedBlob) {
        const formData = new FormData();
        formData.append('file', croppedBlob, 'photo.png');
        formData.append('upload_preset', UPLOAD_PRESET);
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: 'POST', body: formData }
        );
        const cloudinaryData = await response.json();
        photoUrl = cloudinaryData.secure_url;
      } else if (data.photo && data.photo[0]) {
        const file = data.photo[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: 'POST', body: formData }
        );
        const cloudinaryData = await response.json();
        photoUrl = cloudinaryData.secure_url;
      }

      const employeeData = {
        id: empId,
        name: data.name,
        role: data.role,
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
      showNotify('error', 'Registration Failed', 'Error submitting registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#131726]/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D334A]/50 p-12 text-center">
          <div className="w-20 h-20 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Registration Success!</h2>
          <p className="text-slate-400 mb-8">Your employee record has been successfully registered in the system.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/20"
          >
            Register Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      {notify && (
        <NotifyModal
          type={notify.type}
          title={notify.title}
          message={notify.message}
          onClose={() => setNotify(null)}
        />
      )}
      {showCropModal && rawImageSrc && (
        <ImageCropModal
          imageSrc={rawImageSrc}
          onCropComplete={handleCropComplete}
          onClose={() => setShowCropModal(false)}
        />
      )}

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center items-center gap-2 mb-4">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain bg-white p-1.5 rounded-xl shadow-sm" />
            <h1 className="text-2xl font-bold text-white tracking-tight">ID Card Registration</h1>
          </div>
          <p className="text-slate-400 font-medium">Complete the form below to enroll in the system</p>
        </div>

        <div className="bg-[#131726]/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D334A]/50 overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 md:p-12 space-y-10">

            {/* Photo Upload */}
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                {previewImage ? (
                  <div className="relative group">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-violet-500/40 shadow-lg shadow-violet-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => { setShowCropModal(true); }}
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                      <Crop className="w-6 h-6" />
                    </button>
                  </div>
                ) : (
                  <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-[#2D334A]/50 flex items-center justify-center bg-[#0B0F19]/50 overflow-hidden group hover:border-violet-500 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-slate-500 group-hover:text-violet-400 transition-colors" />
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleImageChange}
                    />
                  </div>
                )}
              </div>
              {!previewImage && (
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="photo-upload-hidden"
                  onChange={handleImageChange}
                  {...register('photo', { required: 'Photo is required' })}
                />
              )}
              <p className="text-sm font-bold text-slate-300">Profile Photo *</p>
              {!previewImage && (
                <label
                  htmlFor="photo-upload-hidden"
                  className="mt-2 text-xs text-violet-400 cursor-pointer hover:text-violet-300 transition-colors underline underline-offset-2"
                >
                  Click to upload & crop
                </label>
              )}
              {previewImage && (
                <label
                  className="mt-2 text-xs text-violet-400 cursor-pointer hover:text-violet-300 transition-colors underline underline-offset-2 flex items-center gap-1"
                >
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  Change Photo
                </label>
              )}
              {errors.photo && <p className="text-red-500 text-xs mt-1">{errors.photo.message}</p>}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name *</label>
                <input {...register('name', { required: 'Name is required' })} className="w-full rounded-xl border border-[#2D334A]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white bg-[#0B0F19]/50" placeholder="John Doe" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Employee ID *</label>
                <input {...register('employeeId', { required: 'Employee ID is required' })} className="w-full rounded-xl border border-[#2D334A]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white bg-[#0B0F19]/50" placeholder="CGS-001" />
                {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Department *</label>
                <select {...register('department', { required: 'Department is required' })} className="w-full rounded-xl border border-[#2D334A]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white bg-[#0B0F19]/50">
                  <option value="">Select Department</option>
                  <option value="Management">Management</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Development">Development & Designing</option>
                  <option value="Business Development">Business Development</option>
                  <option value="Process Associate">Associate</option>
                </select>
                {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Job Role *</label>
                <input {...register('role', { required: 'Role is required' })} className="w-full rounded-xl border border-[#2D334A]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white bg-[#0B0F19]/50" placeholder="e.g. Senior Developer" />
                {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Blood Group *</label>
                <select {...register('bloodGroup', { required: 'Required' })} className="w-full rounded-xl border border-[#2D334A]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white bg-[#0B0F19]/50">
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
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number *</label>
                <input {...register('phoneNumber', { required: 'Required' })} className="w-full rounded-xl border border-[#2D334A]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white bg-[#0B0F19]/50" placeholder="+91 1234567890" />
                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Emergency Contact *</label>
                <input {...register('emergencyContact', { required: 'Required' })} className="w-full rounded-xl border border-[#2D334A]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white bg-[#0B0F19]/50" placeholder="+91 1234567890" />
                {errors.emergencyContact && <p className="text-red-500 text-xs mt-1">{errors.emergencyContact.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address *</label>
                <input type="email" {...register('email', { required: 'Required' })} className="w-full rounded-xl border border-[#2D334A]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white bg-[#0B0F19]/50" placeholder="john@company.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Joining Date *</label>
                <input type="date" {...register('dateOfJoining', { required: 'Required' })} className="w-full rounded-xl border border-[#2D334A]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white bg-[#0B0F19]/50" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Date of Birth *</label>
                <input type="date" {...register('dateOfBirth', { required: 'Required' })} className="w-full rounded-xl border border-[#2D334A]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white bg-[#0B0F19]/50" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Employment Type *</label>
                <select {...register('employeeType', { required: 'Required' })} className="w-full rounded-xl border border-[#2D334A]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white bg-[#0B0F19]/50">
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Current Address *</label>
                <textarea {...register('currentAddress', { required: 'Required' })} rows="2" className="w-full rounded-xl border border-[#2D334A]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white bg-[#0B0F19]/50 resize-none" placeholder="Enter your full address"></textarea>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 flex justify-center items-center gap-2 text-lg"
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
