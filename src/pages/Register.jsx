import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Upload, CheckCircle2, QrCode } from 'lucide-react';

// TODO: Replace these with your actual Cloudinary credentials
const CLOUD_NAME = "dwrhl0we1";
const UPLOAD_PRESET = "ID-Card";

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
        name: data.name,
        department: data.department,
        email: data.email,
        phoneNumber: data.phoneNumber,
        personalContact: data.personalContact,
        emergencyContact: data.emergencyContact,
        dateOfJoining: data.dateOfJoining,
        employeeType: data.employeeType,
        bloodGroup: data.bloodGroup,
        currentAddress: data.currentAddress,
        permanentAddress: data.permanentAddress,
        photoUrl: photoUrl,
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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Registration Successful!</h2>
          <p className="text-slate-500 mb-6">
            Your details have been securely submitted. Please contact your HR department or administrator to receive your ID card and QR Code.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">ID Verify Pro</h1>
          </div>
          <p className="text-slate-500 mt-2">Please fill out the form below to generate your official ID card.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
            
            {/* Photo Upload */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 mb-3 overflow-hidden group cursor-pointer hover:border-primary-400 transition-colors">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary-500 transition-colors" />
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  {...register('photo', { onChange: handleImageChange, required: 'Profile photo is required' })}
                />
              </div>
              <p className="text-sm font-medium text-slate-700">Upload Profile Photo *</p>
              {errors.photo && <p className="text-red-500 text-xs mt-1">{errors.photo.message}</p>}
            </div>

            <hr className="border-gray-100" />

            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name *</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Employee ID *</label>
                  <input
                    {...register('employeeId', { required: 'Employee ID is required' })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                    placeholder="CGS-12345"
                  />
                  {errors.employeeId && <p className="text-red-500 text-xs">{errors.employeeId.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Blood Group *</label>
                  <select
                    {...register('bloodGroup', { required: 'Blood Group is required' })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                  {errors.bloodGroup && <p className="text-red-500 text-xs">{errors.bloodGroup.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Department *</label>
                  <select
                    {...register('department', { required: 'Department is required' })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white font-medium"
                  >
                    <option value="">Select Department</option>
                    <option value="Management">Management</option>
                    <option value="Development">Development</option>
                    <option value="Designing">Designing</option>
                    <option value="Business Development">Business Development</option>
                    <option value="Process Associate">Process Associate</option>
                  </select>
                  {errors.department && <p className="text-red-500 text-xs">{errors.department.message}</p>}
                </div>

                {/* <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Phone Number *</label>
                  <input
                    {...register('phoneNumber', { 
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: 'Enter a valid 10-digit Indian mobile number'
                      }
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="10-digit Mobile Number"
                    maxLength={10}
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-xs">{errors.phoneNumber.message}</p>}
                </div> */}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Personal Contact *</label>
                  <input
                    {...register('personalContact', { required: 'Personal contact is required' })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+91-xxxxxxxxxx"
                  />
                  {errors.personalContact && <p className="text-red-500 text-xs">{errors.personalContact.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Emergency Contact *</label>
                  <input
                    {...register('emergencyContact', { required: 'Emergency contact is required' })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+91-xxxxxxxxxx"
                  />
                  {errors.emergencyContact && <p className="text-red-500 text-xs">{errors.emergencyContact.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Date of Joining *</label>
                  <input
                    type="date"
                    {...register('dateOfJoining', { required: 'Date of joining is required' })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors.dateOfJoining && <p className="text-red-500 text-xs">{errors.dateOfJoining.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Employee Type *</label>
                  <select
                    {...register('employeeType', { required: 'Employee type is required' })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select Type</option>
                    <option value="Full-time">Full-time</option>
                    {/* <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option> */}
                    <option value="Intern">Intern</option>
                  </select>
                  {errors.employeeType && <p className="text-red-500 text-xs">{errors.employeeType.message}</p>}
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    {...register('email', { required: 'Email is required' })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="john@company.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Address Info */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Address Details</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Current Address *</label>
                  <textarea
                    {...register('currentAddress', { required: 'Current Address is required' })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows="3"
                    placeholder="123 Main St, City, Country, ZIP"
                  ></textarea>
                  {errors.currentAddress && <p className="text-red-500 text-xs">{errors.currentAddress.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Permanent Address *</label>
                  <textarea
                    {...register('permanentAddress', { required: 'Permanent Address is required' })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows="3"
                    placeholder="Same as above or different address..."
                  ></textarea>
                  {errors.permanentAddress && <p className="text-red-500 text-xs">{errors.permanentAddress.message}</p>}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3.5 px-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-sm text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting Registration...
                  </>
                ) : (
                  'Submit Registration'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
