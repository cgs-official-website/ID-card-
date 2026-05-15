import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Download, UserCircle2, MapPin, Mail, Phone, Edit2, Check, X, Calendar, Briefcase, HeartPulse, ExternalLink, Cake } from 'lucide-react';
import { QRCode } from 'react-qr-code';
import { useForm } from 'react-hook-form';

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
        setError('Employee not found');
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching employee data');
    } finally {
      setLoading(false);
    }
  };

  const onUpdate = async (data) => {
    try {
      setUpdating(true);
      const docRef = doc(db, 'employees', id);
      const newId = data.id.trim().toUpperCase();

      if (newId !== id) {
        // ID changed, need to migrate document
        const newDocRef = doc(db, 'employees', newId);
        const newDocSnap = await getDoc(newDocRef);
        
        if (newDocSnap.exists()) {
          alert('An employee with this ID already exists. Please use a unique ID.');
          setUpdating(false);
          return;
        }

        // Create new document with new ID
        await setDoc(newDocRef, { ...employee, ...data, id: newId });
        // Delete old document
        await deleteDoc(docRef);
        
        setEmployee({ ...employee, ...data, id: newId });
        setIsEditing(false);
        alert('Employee ID and record updated successfully!');
        // Navigate to the new URL since the ID has changed
        navigate(`/admin/employee/${newId}`, { replace: true });
      } else {
        // ID hasn't changed, just update existing document
        await updateDoc(docRef, data);
        setEmployee({ ...employee, ...data });
        setIsEditing(false);
        alert('Employee data updated successfully!');
      }
    } catch (err) {
      console.error("Error updating:", err);
      alert('Failed to update employee data.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${employee.name}? This action cannot be undone.`)) {
      try {
        setUpdating(true);
        await deleteDoc(doc(db, 'employees', id));
        alert('Employee record deleted successfully.');
        navigate('/');
      } catch (err) {
        console.error("Error deleting:", err);
        alert('Failed to delete employee record.');
      } finally {
        setUpdating(false);
      }
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
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-200 transition-all shadow-sm">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </Link>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Employee Details</h2>
            <p className="text-slate-500 font-medium text-sm">View or modify record for {employee.name}</p>
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
              ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200' 
              : 'bg-white text-primary-600 border-primary-200 hover:bg-primary-50'
            }`}
          >
            {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
          
          <button
            onClick={handleDelete}
            disabled={updating}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-2xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all disabled:opacity-50"
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
            <form onSubmit={handleSubmit(onUpdate)} className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 md:p-12 space-y-8">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  Edit Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Employee ID</label>
                    <input {...register('id', { required: true })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                    <input {...register('name', { required: true })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Department</label>
                    <select {...register('department', { required: true })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold">
                      <option value="Management">Management</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Development">Development</option>
                      <option value="Designing">Designing</option>
                      <option value="Business Development">Business Development</option>
                      <option value="Process Associate">Process Associate</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Job Role</label>
                    <input {...register('role', { required: true })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Joining Date</label>
                    <input type="date" {...register('dateOfJoining')} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Date of Birth</label>
                    <input type="date" {...register('dateOfBirth')} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                    <input {...register('email', { required: true })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                    <input {...register('phoneNumber', { required: true })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Emergency Contact</label>
                    <input {...register('emergencyContact')} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Blood Group</label>
                    <input {...register('bloodGroup')} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Employee Type</label>
                    <select {...register('employeeType')} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold">
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Current Address</label>
                  <textarea {...register('currentAddress')} rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold resize-none" />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary-600/20 disabled:opacity-50"
                >
                  {updating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-6 h-6" />}
                  {updating ? 'Saving Changes...' : 'Update Record'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center md:items-start border-b border-gray-50">
                <div className="w-40 h-40 rounded-[2.5rem] bg-slate-50 p-1 border border-white shadow-lg overflow-hidden flex-shrink-0">
                  {employee.photoUrl ? (
                    <img src={employee.photoUrl} alt={employee.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-200">
                      <UserCircle2 className="w-20 h-20" />
                    </div>
                  )}
                </div>
                <div className="text-center md:text-left flex-1">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-4">
                    ID: {employee.id}
                  </div>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">{employee.name}</h3>
                  <p className="text-slate-500 text-xl font-medium mt-1">{employee.role || 'No Role'} • {employee.department}</p>
                  
                  <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                    <span className="bg-primary-50 text-primary-700 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border border-primary-100">
                      {employee.employeeType || 'Full-time'}
                    </span>
                    <span className="bg-rose-50 text-rose-600 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border border-rose-100 flex items-center gap-2">
                      <HeartPulse className="w-3.5 h-3.5" />
                      {employee.bloodGroup}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-12 border-b border-gray-50 bg-gray-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  
                  {/* Email */}
                  <div className="flex items-start gap-4 group min-w-0">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                      <p className="text-slate-800 font-bold text-base break-all leading-tight">{employee.email}</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-4 group min-w-0">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Primary Location</p>
                      <p className="text-slate-800 font-bold text-base leading-tight">{employee.currentAddress || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-4 group min-w-0">
                    <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                        <p className="text-slate-800 font-bold text-base">{employee.phoneNumber || employee.personalContact || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Emergency */}
                  <div className="flex items-start gap-4 group min-w-0">
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Emergency Contact</p>
                      <p className="text-slate-800 font-bold text-base">{employee.emergencyContact || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Joining Date */}
                  <div className="flex items-start gap-4 group min-w-0">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Joining Date</p>
                      <p className="text-slate-800 font-bold text-base">{employee.dateOfJoining || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="flex items-start gap-4 group min-w-0">
                    <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Cake className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date of Birth</p>
                      <p className="text-slate-800 font-bold text-base">{employee.dateOfBirth || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Employee Type */}
                  <div className="flex items-start gap-4 group min-w-0">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employment Type</p>
                      <p className="text-slate-800 font-bold text-base">{employee.employeeType || 'Full-time'}</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar QR Col */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 text-center sticky top-8">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Management QR</h3>
            <p className="text-xs text-slate-500 font-medium mb-8">This QR stays unique and permanent</p>
            
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 inline-block mb-8 shadow-inner group">
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
              className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-xl shadow-slate-900/10"
            >
              <Download className="w-5 h-5" />
              Download QR Image
            </button>
            
            <div className="mt-6 pt-6 border-t border-gray-50 flex flex-col gap-4">
              <Link 
                to={`/employee/${employee.id}`} 
                target="_blank"
                className="flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-bold transition-all"
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
