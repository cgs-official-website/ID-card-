import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Download, UserCircle2, MapPin, Mail, Phone, Edit2, Check, X, Calendar, Briefcase, HeartPulse, ExternalLink, Cake, Crop } from 'lucide-react';
import { QRCode } from 'react-qr-code';
import { useForm } from 'react-hook-form';
import NotifyModal from '../components/NotifyModal';
import ImageCropModal from '../components/ImageCropModal';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const AdminEmployeeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const qrRef = useRef();
  const [notify, setNotify] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const showNotify = (type, title, message) => setNotify({ type, title, message });

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
        setError('Employee not found');
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching employee data');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
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
    setPhotoPreview(dataUrl);
    setShowCropModal(false);
  };

  const onUpdate = async (data) => {
    try {
      setUpdating(true);
      const docRef = doc(db, 'employees', id);
      const newId = data.id.trim().toUpperCase();

      let photoUrl = employee.photoUrl || '';
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
      }

      if (newId !== id) {
        const newDocRef = doc(db, 'employees', newId);
        const newDocSnap = await getDoc(newDocRef);
        if (newDocSnap.exists()) {
          showNotify('error', 'ID Conflict', 'An employee with this ID already exists. Please use a unique ID.');
          setUpdating(false);
          return;
        }
        await setDoc(newDocRef, { ...employee, ...data, id: newId, photoUrl });
        await deleteDoc(docRef);
        setEmployee({ ...employee, ...data, id: newId, photoUrl });
        setIsEditing(false);
        showNotify('success', 'Record Updated', 'Employee ID and record updated successfully!');
        navigate(`/admin/employee/${newId}`, { replace: true });
      } else {
        await updateDoc(docRef, { ...data, photoUrl });
        setEmployee({ ...employee, ...data, photoUrl });
        setIsEditing(false);
        showNotify('success', 'Record Updated', 'Employee data updated successfully!');
      }
    } catch (err) {
      console.error("Error updating:", err);
      showNotify('error', 'Update Failed', 'Failed to update employee data.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    setPendingDelete(true);
  };

  const confirmDelete = async () => {
    try {
      setUpdating(true);
      await deleteDoc(doc(db, 'employees', id));
      navigate('/');
    } catch (err) {
      console.error("Error deleting:", err);
      showNotify('error', 'Delete Failed', 'Failed to delete employee record.');
    } finally {
      setUpdating(false);
    }
  };

  const downloadQR = () => {
    const svg = qrRef.current;
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
      downloadLink.download = `${employee.name}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-red-50 p-12 rounded-[2.5rem] text-center border border-red-100">
        <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-800">{error}</h3>
        <Link to="/" className="mt-6 inline-block text-primary-600 font-bold hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const qrUrl = `${window.location.origin}/employee/${employee.id}`;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {notify && (
        <NotifyModal
          type={notify.type}
          title={notify.title}
          message={notify.message}
          onClose={() => setNotify(null)}
        />
      )}
      {pendingDelete && (
        <NotifyModal
          type="confirm"
          title="Delete Employee?"
          message={`Are you sure you want to permanently delete ${employee?.name}? This action cannot be undone.`}
          confirmText="Yes, Delete"
          cancelText="Cancel"
          onClose={() => setPendingDelete(false)}
          onConfirm={confirmDelete}
        />
      )}
      {showCropModal && rawImageSrc && (
        <ImageCropModal
          imageSrc={rawImageSrc}
          onCropComplete={handleCropComplete}
          onClose={() => setShowCropModal(false)}
        />
      )}
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-3 bg-[#131726] hover:bg-[#1E243D] rounded-2xl border border-[#2D334A]/50 transition-all shadow-sm">
            <ArrowLeft className="w-6 h-6 text-slate-300" />
          </Link>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Employee Details</h2>
            <p className="text-slate-400 font-medium text-sm">View or modify record for {employee.name}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              if (isEditing) reset(employee);
              setIsEditing(!isEditing);
            }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-2xl border transition-all ${
              isEditing 
              ? 'bg-[#1E243D] text-slate-300 border-[#2D334A]/50 hover:bg-[#252B48]' 
              : 'bg-[#131726] text-violet-400 border-[#2D334A]/50 hover:bg-[#1E243D]'
            }`}
          >
            {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
          
          <button
            onClick={handleDelete}
            disabled={updating}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5" />
            Delete Record
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Info Col */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <form onSubmit={handleSubmit(onUpdate)} className="bg-[#131726]/80 backdrop-blur-md rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D334A]/50 overflow-hidden">
              <div className="p-8 md:p-12 space-y-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-500/20 text-violet-400 rounded-lg flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  Edit Information
                </h3>

                {/* Photo update in edit form */}
                <div className="flex items-center gap-5">
                  <div className="relative group">
                    {(photoPreview || employee.photoUrl) ? (
                      <img
                        src={photoPreview || employee.photoUrl}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-violet-500/40"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center border-2 border-dashed border-violet-500/40">
                        <UserCircle2 className="w-10 h-10 text-violet-400" />
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Crop className="w-5 h-5 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Profile Photo</p>
                    <label className="mt-1 text-xs text-violet-400 cursor-pointer hover:text-violet-300 transition-colors underline underline-offset-2">
                      Click photo to change & crop
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Employee ID</label>
                    <input {...register('id', { required: true })} className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                    <input {...register('name', { required: true })} className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Department</label>
                    <select {...register('department', { required: true })} className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white">
                      <option value="Management">Management</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Development">Development & Designing</option>
                      {/* <option value="Designing">Designing</option> */}
                      <option value="Business Development">Business Development</option>
                      <option value="Process Associate">Associate</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Job Role</label>
                    <input {...register('role', { required: true })} className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Joining Date</label>
                    <input type="date" {...register('dateOfJoining')} className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Date of Birth</label>
                    <input type="date" {...register('dateOfBirth')} className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                    <input {...register('email', { required: true })} className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                    <input {...register('phoneNumber', { required: true })} className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Emergency Contact</label>
                    <input {...register('emergencyContact')} className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Blood Group</label>
                    <input {...register('bloodGroup')} className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Employee Type</label>
                    <select {...register('employeeType')} className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white">
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Current Address</label>
                  <textarea {...register('currentAddress')} rows="3" className="w-full bg-[#0B0F19]/50 border border-[#2D334A]/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-bold text-white resize-none" />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
                >
                  {updating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-6 h-6" />}
                  {updating ? 'Saving Changes...' : 'Update Record'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-[#131726]/80 backdrop-blur-md rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D334A]/50 overflow-hidden">
              <div className="p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center md:items-start border-b border-[#2D334A]/50">
                <div className="w-40 h-40 rounded-[2.5rem] bg-[#0B0F19] p-1 border border-[#2D334A]/50 shadow-lg overflow-hidden flex-shrink-0">
                  {employee.photoUrl ? (
                    <img src={employee.photoUrl} alt={employee.name} className="w-full h-full object-cover rounded-[2rem]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-violet-500/20 text-violet-400 rounded-[2rem]">
                      <UserCircle2 className="w-20 h-20" />
                    </div>
                  )}
                </div>
                <div className="text-center md:text-left flex-1">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1E243D] text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-4">
                    ID: {employee.id}
                  </div>
                  <h3 className="text-4xl font-black text-white tracking-tight leading-tight">{employee.name}</h3>
                  <p className="text-slate-400 text-xl font-medium mt-1">{employee.role || 'No Role'} • {employee.department}</p>
                  
                  <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                    <span className="bg-violet-500/20 text-violet-300 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border border-violet-500/30">
                      {employee.employeeType || 'Full-time'}
                    </span>
                    <span className="bg-rose-500/20 text-rose-400 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border border-rose-500/30 flex items-center gap-2">
                      <HeartPulse className="w-3.5 h-3.5" />
                      {employee.bloodGroup}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-12 border-b border-[#2D334A]/50 bg-[#0B0F19]/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  
                  {/* Email */}
                  <div className="flex items-start gap-4 group min-w-0">
                    <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                      <p className="text-slate-200 font-bold text-base break-all leading-tight">{employee.email}</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-4 group min-w-0">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Primary Location</p>
                      <p className="text-slate-200 font-bold text-base leading-tight">{employee.currentAddress || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-4 group min-w-0">
                    <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                        <p className="text-slate-200 font-bold text-base">{employee.phoneNumber || employee.personalContact || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Emergency */}
                  <div className="flex items-start gap-4 group min-w-0">
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Emergency Contact</p>
                      <p className="text-slate-200 font-bold text-base">{employee.emergencyContact || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Joining Date */}
                  <div className="flex items-start gap-4 group min-w-0">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Joining Date</p>
                      <p className="text-slate-200 font-bold text-base">{employee.dateOfJoining || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="flex items-start gap-4 group min-w-0">
                    <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Cake className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date of Birth</p>
                      <p className="text-slate-200 font-bold text-base">{employee.dateOfBirth || 'N/A'}</p>
                    </div>
                  </div>                  {/* Employee Type */}
                  <div className="flex items-start gap-4 group min-w-0">
                    <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employment Type</p>
                      <p className="text-slate-200 font-bold text-base">{employee.employeeType || 'Full-time'}</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar QR Col */}
        <div className="space-y-8">
          <div className="bg-[#131726]/80 backdrop-blur-md rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D334A]/50 p-8 text-center sticky top-8">
            <h3 className="text-xl font-bold text-white mb-2">Management QR</h3>
            <p className="text-xs text-slate-400 font-medium mb-8">This QR stays unique and permanent</p>
            
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 inline-block mb-8 shadow-inner group">
              <QRCode
                value={qrUrl}
                size={200}
                level="H"
                ref={qrRef}
                className="mx-auto group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            
            <button
              onClick={downloadQR}
              className="w-full flex items-center justify-center gap-3 bg-[#1E243D] hover:bg-[#252B48] border border-[#2D334A] text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg"
            >
              <Download className="w-5 h-5" />
              Download QR Image
            </button>
            
            <div className="mt-6 pt-6 border-t border-[#2D334A]/50 flex flex-col gap-4">
              <Link 
                to={`/employee/${employee.id}`} 
                target="_blank"
                className="flex items-center justify-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-bold transition-all"
              >
                Preview Portfolio View
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEmployeeView;
