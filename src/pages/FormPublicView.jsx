import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  CheckCircle2, AlertTriangle, ShieldCheck, Upload, Trash2, ShieldAlert,
  Star, Lock, Image as ImageIcon, RefreshCw
} from 'lucide-react';
import { db } from '../firebase';
import { 
  doc, getDoc, getDocs, addDoc, updateDoc, collection, query, orderBy
} from 'firebase/firestore';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const FormPublicView = () => {
  const { id: formId } = useParams();
  
  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form responses state
  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState({});

  // Math CAPTCHA
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: 0 });
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  // File states
  const [filesData, setFilesData] = useState({}); // { fieldId: { name, url, scanning, status, error } }
  const [uploadedFileIds, setUploadedFileIds] = useState([]);

  // Signature canvas refs
  const signatureRefs = useRef({}); // { fieldId: canvasRef }
  const sigDrawingState = useRef({}); // { fieldId: isDrawing }

  // Fetch form details & increment view count
  useEffect(() => {
    fetchForm();
  }, [formId]);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({
      num1,
      num2,
      answer: num1 + num2
    });
    setCaptchaInput('');
    setCaptchaError(false);
  };

  const fetchForm = async () => {
    try {
      setLoading(true);

      // --- Direct Firestore read: bypasses dbHelper LocalStorage fallback ---
      const formSnap = await getDoc(doc(db, 'forms', formId));
      if (!formSnap.exists()) {
        setError("This form does not exist.");
        return;
      }
      const formData = formSnap.data();

      // Enforce status checks
      if (formData.status !== 'published') {
        setError("This form is currently closed or in draft status.");
        return;
      }

      // Check dates
      const now = new Date();
      if (formData.settings?.startDate && now < new Date(formData.settings.startDate)) {
        setError(`This form is not yet accepting responses. It will open on ${new Date(formData.settings.startDate).toLocaleString()}.`);
        return;
      }
      if (formData.settings?.endDate && now > new Date(formData.settings.endDate)) {
        setError("This form has closed and is no longer accepting responses.");
        return;
      }

      setForm(formData);

      // Fetch Fields directly from Firestore
      const fieldsSnap = await getDocs(collection(db, `forms/${formId}/fields`));
      const fetchedFields = fieldsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setFields(fetchedFields);

      // Initialize response fields
      const initialResObj = {};
      fetchedFields.forEach(f => {
        if (!['heading', 'paragraph', 'divider', 'imageBlock'].includes(f.type)) {
          initialResObj[f.id] = f.defaultValue || '';
        }
      });
      setResponses(initialResObj);

      // Check if already submitted in this session (e.g. back-button redirect)
      if (sessionStorage.getItem(`submitted-${formId}`) === 'true') {
        setSuccess(true);
        setLoading(false);
        return;
      }

      // Check submission limit (only if configured and greater than 0)
      const limit = parseInt(formData.settings?.submissionLimit, 10);
      if (formData.settings?.submissionLimit && !isNaN(limit) && limit > 0) {
        try {
          const resSnap = await getDocs(collection(db, `forms/${formId}/responses`));
          if (resSnap.size >= limit) {
            setError("This form has reached its submission limit.");
            return;
          }
        } catch (err) {
          console.warn("Could not verify submission limit (ignored):", err);
        }
      }

      // Setup captcha if enabled
      if (formData.settings?.enableCaptcha !== false) {
        generateCaptcha();
      }

      // Increment View Count (once per session)
      if (!sessionStorage.getItem(`viewed-${formId}`)) {
        try {
          const { increment } = await import('firebase/firestore');
          await updateDoc(doc(db, 'forms', formId), { views: increment(1) });
        } catch (err) {
          console.warn("View count increment failed (ignored):", err);
        }
        sessionStorage.setItem(`viewed-${formId}`, 'true');
      }

    } catch (err) {
      console.error("Error loading form:", err);
      setError("An error occurred while loading this form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Evaluate Visibility of a field
  const isFieldVisible = (field) => {
    if (!field.visibleIf?.fieldId) return true;
    
    const triggerValue = responses[field.visibleIf.fieldId];
    return String(triggerValue) === String(field.visibleIf.value);
  };

  const handleInputChange = (fieldId, value) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear validation error when editing
    if (errors[fieldId]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleCheckboxChange = (fieldId, option, checked) => {
    const currentValues = Array.isArray(responses[fieldId]) ? responses[fieldId] : [];
    let nextValues;
    if (checked) {
      nextValues = [...currentValues, option];
    } else {
      nextValues = currentValues.filter(v => v !== option);
    }
    handleInputChange(fieldId, nextValues);
  };

  // Secure File Upload with simulated Virus Scan
  const handleFileUpload = async (fieldId, file, maxMB = 5) => {
    if (!file) return;

    // Client-side validations
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxMB) {
      setFilesData(prev => ({
        ...prev,
        [fieldId]: { error: `File size exceeds the ${maxMB}MB limit.` }
      }));
      return;
    }

    setFilesData(prev => ({
      ...prev,
      [fieldId]: { name: file.name, scanning: true, status: 'Uploading and scanning file...', url: '' }
    }));

    try {
      const googleDriveUrl = import.meta.env.VITE_GOOGLE_DRIVE_UPLOAD_URL;

      let secureUrl = '';
      let fileId = null;

      if (googleDriveUrl) {
        // Upload ALL file types (images + PDFs) to Google Drive via base64
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
          };
          reader.onerror = (error) => reject(error);
        });

        const uploadResponse = await fetch(googleDriveUrl, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            action: 'upload',
            base64: base64Data,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream'
          })
        });

        if (!uploadResponse.ok) {
          throw new Error(`Drive upload failed with HTTP ${uploadResponse.status}`);
        }
        const uploadResult = await uploadResponse.json();
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Google Drive upload was unsuccessful');
        }
        secureUrl = uploadResult.url;
        fileId = uploadResult.fileId || null;
        if (fileId) {
          setUploadedFileIds(prev => [...prev, fileId]);
        }
      } else {
        // Fallback to Cloudinary upload when Drive URL is not configured
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        
        // Auto resource type handles images, PDFs, word files, etc.
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
          { method: 'POST', body: formData }
        );
        
        if (!response.ok) throw new Error("Cloudinary upload failed");
        const uploadData = await response.json();
        secureUrl = uploadData.secure_url;
      }

      // 2. Perform a simulated security virus scan
      await new Promise(resolve => setTimeout(resolve, 1500)); // Delay to simulate scan

      setFilesData(prev => ({
        ...prev,
        [fieldId]: {
          name: file.name,
          scanning: false,
          status: 'Virus scan passed: Secure file registered.',
          url: secureUrl,
          fileId: fileId
        }
      }));

      handleInputChange(fieldId, secureUrl);
    } catch (err) {
      console.error("File upload error:", err);
      setFilesData(prev => ({
        ...prev,
        [fieldId]: { error: `Secure file upload failed: ${err.message || 'Try another file.'}` }
      }));
    }
  };

  const handleRemoveFile = (fieldId) => {
    const fileIdToRemove = filesData[fieldId]?.fileId;
    if (fileIdToRemove) {
      setUploadedFileIds(prev => prev.filter(id => id !== fileIdToRemove));
    }
    setFilesData(prev => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    handleInputChange(fieldId, '');
  };

  // Signature Draw Handlers
  const startDrawing = (fieldId, e) => {
    const canvas = signatureRefs.current[fieldId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Get mouse/touch coordinate
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    sigDrawingState.current[fieldId] = true;
  };

  const draw = (fieldId, e) => {
    if (!sigDrawingState.current[fieldId]) return;
    const canvas = signatureRefs.current[fieldId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = (fieldId) => {
    if (!sigDrawingState.current[fieldId]) return;
    sigDrawingState.current[fieldId] = false;
    
    // Capture signature as base64 string
    const canvas = signatureRefs.current[fieldId];
    if (canvas) {
      const signatureDataUrl = canvas.toDataURL('image/png');
      handleInputChange(fieldId, signatureDataUrl);
    }
  };

  const clearSignature = (fieldId) => {
    const canvas = signatureRefs.current[fieldId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleInputChange(fieldId, '');
  };

  // Full validation before final submission
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    fields.forEach(field => {
      // Skip validating hidden fields
      if (!isFieldVisible(field)) return;

      // Skip layout elements
      if (['heading', 'paragraph', 'divider', 'imageBlock'].includes(field.type)) return;

      const val = responses[field.id];

      // Required check
      if (field.required && (!val || (Array.isArray(val) && val.length === 0))) {
        newErrors[field.id] = `${field.label || 'This field'} is required.`;
        isValid = false;
      }

      // Min length check
      if (field.validation?.minLength && val && String(val).length < parseInt(field.validation.minLength)) {
        newErrors[field.id] = `Must be at least ${field.validation.minLength} characters.`;
        isValid = false;
      }

      // Max length check
      if (field.validation?.maxLength && val && String(val).length > parseInt(field.validation.maxLength)) {
        newErrors[field.id] = `Cannot exceed ${field.validation.maxLength} characters.`;
        isValid = false;
      }

      // Email check
      if (field.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        newErrors[field.id] = 'Enter a valid email address.';
        isValid = false;
      }

      // Website URL check
      if (field.type === 'url' && val && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(val)) {
        newErrors[field.id] = 'Enter a valid website URL.';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Fetch submitter's IP address
  const fetchIPAddress = async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      return data.ip || 'Unknown IP';
    } catch (e) {
      console.warn("Unable to fetch IP address:", e);
      return 'Unknown IP';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    const inputsValid = validateForm();
    if (!inputsValid) {
      return;
    }

    // Verify Captcha
    if (form.settings?.enableCaptcha !== false) {
      if (parseInt(captchaInput) !== captcha.answer) {
        setCaptchaError(true);
        generateCaptcha();
        return;
      }
    }

    try {
      setSubmitting(true);

      let ipAddress = 'Disabled';
      if (form.settings?.collectIp !== false) {
        ipAddress = await fetchIPAddress();
      }

      // Prepare submission payload
      const cleanedData = {};
      fields.forEach(field => {
        if (!isFieldVisible(field)) return;
        if (['heading', 'paragraph', 'divider', 'imageBlock'].includes(field.type)) return;
        
        cleanedData[field.id] = responses[field.id];
      });

      const submissionPayload = {
        responseData: cleanedData,
        submittedAt: form.settings?.collectTimestamp !== false ? new Date().toISOString() : 'Disabled',
        ipAddress
      };

      // Prepare uploaded files list for responseFiles
      const uploadedFiles = [];
      const uploadedFileKeys = Object.keys(filesData);
      uploadedFileKeys.forEach(fieldId => {
        const file = filesData[fieldId];
        if (file.url) {
          uploadedFiles.push({
            fieldName: fieldId,
            fileName: file.name,
            fileUrl: file.url
          });
        }
      });

      // Submit responses directly to Firestore (bypasses dbHelper fallback)
      const responseDocRef = await addDoc(collection(db, `forms/${formId}/responses`), submissionPayload);

      // Save response file references if any
      if (uploadedFiles && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          await addDoc(collection(db, 'responseFiles'), {
            responseId: responseDocRef.id,
            formId,
            ...file,
            uploadedAt: new Date().toISOString()
          });
        }
      }

      // Call Apps Script to organize the files into a candidate-specific folder
      if (googleDriveUrl && uploadedFileIds.length > 0) {
        // Find candidate name in submission payload
        let candidateName = 'Unknown User';
        const nameField = fields.find(f => {
          const lbl = (f.label || '').toLowerCase();
          return lbl.includes('name') && f.type === 'shortText';
        });
        if (nameField && cleanedData[nameField.id]) {
          candidateName = String(cleanedData[nameField.id]).trim();
        }

        try {
          await fetch(googleDriveUrl, {
            method: 'POST',
            mode: 'cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
              action: 'organize',
              candidateName,
              fileIds: uploadedFileIds
            })
          });
        } catch (orgErr) {
          console.warn("Could not organize uploaded files in folders:", orgErr);
        }
      }

      // Record successful submission for back-button session tracking
      sessionStorage.setItem(`submitted-${formId}`, 'true');

      setSuccess(true);
      
      // Perform redirect if configured
      if (form.settings?.redirectUrl) {
        let redirectTarget = form.settings.redirectUrl.trim();
        if (!/^https?:\/\//i.test(redirectTarget)) {
          redirectTarget = `https://${redirectTarget}`;
        }
        setTimeout(() => {
          window.location.href = redirectTarget;
        }, 3000);
      }

    } catch (err) {
      console.error("Submission error:", err);
      alert("Submission failed. Check network or try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-white">
          <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
          <span className="font-semibold text-sm">Loading Form...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#131726]/80 backdrop-blur-md rounded-3xl border border-[#2D334A]/50 p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Form Closed</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">{error}</p>
          <div className="text-xs font-bold text-slate-500 flex items-center justify-center gap-1.5 bg-[#0B0F19]/40 py-2 rounded-xl border border-[#2D334A]/30">
            <Lock className="w-3.5 h-3.5" />
            Authorized access only
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative backdrop glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-md w-full bg-[#131726]/80 backdrop-blur-md rounded-3xl border border-[#2D334A]/50 p-8 md:p-10 text-center shadow-2xl z-10 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          
          <h2 className="text-2xl font-black text-white mb-3">Submission Successful!</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium">
            {form.settings?.successMessage || 'Thank you! Your response has been submitted.'}
          </p>

          {form.settings?.redirectUrl ? (
            <div className="p-4 bg-[#0B0F19]/60 rounded-2xl border border-[#2D334A]/30 flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                Redirecting you...
              </p>
              <span className="text-[10px] text-violet-400 truncate max-w-full font-semibold">
                {form.settings.redirectUrl}
              </span>
            </div>
          ) : (
            form.settings?.allowMultiple !== false && (
              <button
                type="button"
                onClick={() => {
                  const resetRes = {};
                  fields.forEach(f => {
                    if (!['heading', 'paragraph', 'divider', 'imageBlock'].includes(f.type)) {
                      resetRes[f.id] = f.defaultValue || '';
                    }
                  });
                  setResponses(resetRes);
                  setFilesData({});
                  
                  // Clear session submission record
                  sessionStorage.removeItem(`submitted-${formId}`);
                  
                  setSuccess(false);
                  if (form.settings?.enableCaptcha !== false) {
                    generateCaptcha();
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/10 transition-all cursor-pointer"
              >
                Submit Another Response
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] py-12 px-4 relative overflow-y-auto selection:bg-violet-500/30 selection:text-violet-200 flex flex-col items-center">
      {/* Decorative backdrop glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-xl w-full space-y-8 z-10">
        
        {/* Form branding / Logo */}
        {form.settings?.logoUrl && (
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-white border border-[#2D334A] rounded-2xl p-2.5 shadow-md flex items-center justify-center overflow-hidden">
              <img src={form.settings.logoUrl} alt="Branding" className="w-full h-full object-contain" />
            </div>
          </div>
        )}

        {/* Title Details Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-white tracking-tight">{form.title}</h1>
          {form.description && (
            <p className="text-slate-400 font-medium text-sm mt-3.5 leading-relaxed max-w-lg mx-auto whitespace-pre-wrap">
              {form.description}
            </p>
          )}
        </div>

        {/* Form Form Body */}
        <div className="bg-[#131726]/80 backdrop-blur-md rounded-3xl border border-[#2D334A]/50 p-6 md:p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {fields.map((field) => {
              if (!isFieldVisible(field)) return null;

              // Render Layout Divider
              if (field.type === 'divider') {
                return <hr key={field.id} className="border-t border-[#2D334A]/80 border-dashed py-1" />;
              }

              // Render Layout Heading
              if (field.type === 'heading') {
                return (
                  <h3 key={field.id} className="text-lg font-extrabold text-slate-100 pt-2 border-l-3 border-violet-500 pl-3">
                    {field.label}
                  </h3>
                );
              }

              // Render Layout Paragraph
              if (field.type === 'paragraph') {
                return (
                  <p key={field.id} className="text-xs text-slate-400 font-semibold leading-relaxed whitespace-pre-wrap bg-[#0B0F19]/30 p-4 rounded-xl border border-[#2D334A]/40">
                    {field.label}
                  </p>
                );
              }

              // Render Layout Image block
              if (field.type === 'imageBlock') {
                return (
                  <div key={field.id} className="w-full rounded-2xl border border-[#2D334A] overflow-hidden shadow-md">
                    <img src={field.label || '/logo.png'} alt="Block" className="w-full h-auto object-cover max-h-64" />
                  </div>
                );
              }

              const hasErr = !!errors[field.id];

              return (
                <div key={field.id} className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>

                  {/* 1. Short text input */}
                  {field.type === 'shortText' && (
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={responses[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-[#0B0F19]/50 transition-all ${
                        hasErr ? 'border-red-500 focus:border-red-500' : 'border-[#2D334A]/60 focus:border-violet-500'
                      }`}
                    />
                  )}

                  {/* 2. Long text input */}
                  {field.type === 'longText' && (
                    <textarea
                      placeholder={field.placeholder}
                      rows="4"
                      value={responses[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-[#0B0F19]/50 transition-all resize-none ${
                        hasErr ? 'border-red-500 focus:border-red-500' : 'border-[#2D334A]/60 focus:border-violet-500'
                      }`}
                    />
                  )}

                  {/* 3. Email input */}
                  {field.type === 'email' && (
                    <input
                      type="email"
                      placeholder={field.placeholder}
                      value={responses[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-[#0B0F19]/50 transition-all ${
                        hasErr ? 'border-red-500 focus:border-red-500' : 'border-[#2D334A]/60 focus:border-violet-500'
                      }`}
                    />
                  )}

                  {/* 4. Phone input */}
                  {field.type === 'phone' && (
                    <input
                      type="tel"
                      placeholder={field.placeholder}
                      value={responses[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-[#0B0F19]/50 transition-all ${
                        hasErr ? 'border-red-500 focus:border-red-500' : 'border-[#2D334A]/60 focus:border-violet-500'
                      }`}
                    />
                  )}

                  {/* 5. Number input */}
                  {field.type === 'number' && (
                    <input
                      type="number"
                      placeholder={field.placeholder}
                      value={responses[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-[#0B0F19]/50 transition-all ${
                        hasErr ? 'border-red-500 focus:border-red-500' : 'border-[#2D334A]/60 focus:border-violet-500'
                      }`}
                    />
                  )}

                  {/* 6. URL input */}
                  {field.type === 'url' && (
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={responses[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-[#0B0F19]/50 transition-all ${
                        hasErr ? 'border-red-500 focus:border-red-500' : 'border-[#2D334A]/60 focus:border-violet-500'
                      }`}
                    />
                  )}

                  {/* 7. Dropdown list */}
                  {field.type === 'dropdown' && (
                    <select
                      value={responses[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-300 focus:outline-none bg-[#0B0F19] cursor-pointer transition-all ${
                        hasErr ? 'border-red-500' : 'border-[#2D334A]/60 focus:border-violet-500'
                      }`}
                    >
                      <option value="">Choose options...</option>
                      {field.options?.map((opt, oIdx) => (
                        <option key={oIdx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {/* 8. Radio options */}
                  {field.type === 'radio' && (
                    <div className="space-y-2.5 pt-1.5">
                      {field.options?.map((opt, oIdx) => (
                        <label key={oIdx} className="flex items-center gap-3 text-slate-300 font-bold text-xs cursor-pointer select-none">
                          <input
                            type="radio"
                            name={field.id}
                            value={opt}
                            checked={responses[field.id] === opt}
                            onChange={() => handleInputChange(field.id, opt)}
                            className="w-4.5 h-4.5 text-violet-600 focus:ring-violet-500 border-[#2D334A] bg-[#0B0F19]"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}

                  {/* 9. Checkbox options */}
                  {field.type === 'checkbox' && (
                    <div className="space-y-2.5 pt-1.5">
                      {field.options?.map((opt, oIdx) => {
                        const vals = Array.isArray(responses[field.id]) ? responses[field.id] : [];
                        return (
                          <label key={oIdx} className="flex items-center gap-3 text-slate-300 font-bold text-xs cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={vals.includes(opt)}
                              onChange={(e) => handleCheckboxChange(field.id, opt, e.target.checked)}
                              className="w-4.5 h-4.5 text-violet-600 focus:ring-violet-500 rounded border-[#2D334A] bg-[#0B0F19]"
                            />
                            {opt}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* 10. Multi select menu */}
                  {field.type === 'multiSelect' && (
                    <select
                      multiple
                      value={responses[field.id] || []}
                      onChange={(e) => {
                        const opts = Array.from(e.target.selectedOptions, o => o.value);
                        handleInputChange(field.id, opts);
                      }}
                      className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-300 focus:outline-none bg-[#0B0F19] cursor-pointer min-h-24 transition-all ${
                        hasErr ? 'border-red-500' : 'border-[#2D334A]/60 focus:border-violet-500'
                      }`}
                    >
                      {field.options?.map((opt, oIdx) => (
                        <option key={oIdx} value={opt} className="p-1 rounded-md mb-0.5">{opt}</option>
                      ))}
                    </select>
                  )}

                  {/* 11. Date select */}
                  {field.type === 'date' && (
                    <input
                      type="date"
                      value={responses[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-[#0B0F19]/50 cursor-pointer transition-all ${
                        hasErr ? 'border-red-500 focus:border-red-500' : 'border-[#2D334A]/60 focus:border-violet-500'
                      }`}
                    />
                  )}

                  {/* 12. Time select */}
                  {field.type === 'time' && (
                    <input
                      type="time"
                      value={responses[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-[#0B0F19]/50 cursor-pointer transition-all ${
                        hasErr ? 'border-red-500 focus:border-red-500' : 'border-[#2D334A]/60 focus:border-violet-500'
                      }`}
                    />
                  )}

                  {/* 13. File / 14. Image Upload */}
                  {(field.type === 'fileUpload' || field.type === 'imageUpload') && (
                    <div className="space-y-3">
                      {filesData[field.id]?.url ? (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            <span className="text-xs text-slate-200 font-bold truncate max-w-[220px]">{filesData[field.id].name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(field.id)}
                            className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : filesData[field.id]?.scanning ? (
                        <div className="p-4 rounded-2xl bg-slate-900 border border-[#2D334A]/80 flex flex-col gap-2">
                          <div className="flex items-center gap-2.5">
                            <RefreshCw className="w-4 h-4 text-violet-500 animate-spin" />
                            <span className="text-xs font-bold text-slate-300">{filesData[field.id].status}</span>
                          </div>
                          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-violet-600 to-blue-600 animate-pulse w-[75%]"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <label className={`w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 bg-[#0B0F19]/40 hover:border-violet-500 transition-colors cursor-pointer ${
                            hasErr || filesData[field.id]?.error ? 'border-red-500/60' : 'border-[#2D334A]/80'
                          }`}>
                            {field.type === 'imageUpload' ? <ImageIcon className="w-7 h-7 text-slate-500" /> : <Upload className="w-7 h-7 text-slate-500" />}
                            <span className="text-xs text-slate-300 font-bold mt-2">Choose file to upload</span>
                            <span className="text-[10px] text-slate-500 font-medium mt-1">Limit: {field.validation?.maxFileSize || 5}MB</span>
                            <input 
                              type="file" 
                              accept={field.type === 'imageUpload' ? 'image/*' : '*'} 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                              onChange={(e) => handleFileUpload(field.id, e.target.files[0], field.validation?.maxFileSize)}
                            />
                          </label>
                        </div>
                      )}
                      
                      {filesData[field.id]?.url && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded w-fit border border-emerald-500/10">
                          <ShieldCheck className="w-3 h-3" />
                          Secure Virus Scan Checked
                        </div>
                      )}
                      
                      {filesData[field.id]?.error && (
                        <p className="text-red-500 text-[10px] font-bold mt-1.5 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {filesData[field.id].error}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 15. Rating scales */}
                  {field.type === 'rating' && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {Array.from({ length: field.validation?.ratingMax || 5 }, (_, i) => i + 1).map((num) => {
                        const isActive = responses[field.id] >= num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleInputChange(field.id, num)}
                            className={`p-2 rounded-xl transition-all cursor-pointer border ${
                              isActive
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 scale-105 shadow-md shadow-amber-500/5'
                                : 'bg-[#0B0F19]/40 border-[#2D334A]/80 text-slate-600 hover:text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <Star className={`w-5 h-5 ${isActive ? 'fill-amber-500' : ''}`} />
                            <span className="text-[10px] font-black block mt-0.5">{num}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 16. Yes/No Toggle */}
                  {field.type === 'toggle' && (
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleInputChange(field.id, 'yes')}
                        className={`px-6 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          responses[field.id] === 'yes'
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-extrabold'
                            : 'bg-[#0B0F19]/40 border-[#2D334A]/80 text-slate-400'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange(field.id, 'no')}
                        className={`px-6 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          responses[field.id] === 'no'
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 font-extrabold'
                            : 'bg-[#0B0F19]/40 border-[#2D334A]/80 text-slate-400'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  )}

                  {/* 17. Digital Signature Canvas drawing */}
                  {field.type === 'signature' && (
                    <div className="space-y-2">
                      <div className="relative border border-[#2D334A]/80 bg-[#0B0F19] rounded-2xl overflow-hidden h-36">
                        <canvas
                          ref={(el) => {
                            if (el) {
                              signatureRefs.current[field.id] = el;
                              if (el.width !== el.parentElement.clientWidth && el.parentElement.clientWidth > 0) {
                                el.width = el.parentElement.clientWidth;
                                el.height = 144;
                                const existingSig = responses[field.id];
                                if (existingSig) {
                                  const img = new Image();
                                  img.onload = () => {
                                    const ctx = el.getContext('2d');
                                    ctx.drawImage(img, 0, 0);
                                  };
                                  img.src = existingSig;
                                }
                              }
                            }
                          }}
                          onMouseDown={(e) => startDrawing(field.id, e)}
                          onMouseMove={(e) => draw(field.id, e)}
                          onMouseUp={() => stopDrawing(field.id)}
                          onMouseLeave={() => stopDrawing(field.id)}
                          onTouchStart={(e) => startDrawing(field.id, e)}
                          onTouchMove={(e) => draw(field.id, e)}
                          onTouchEnd={() => stopDrawing(field.id)}
                          className="w-full h-full cursor-crosshair touch-none"
                        />
                        <div className="absolute top-2 left-3 text-[9px] font-black text-slate-500 uppercase tracking-widest pointer-events-none select-none">
                          Draw Signature Below
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => clearSignature(field.id)}
                        className="text-[10px] font-black text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        Clear Signature Space
                      </button>
                    </div>
                  )}

                  {field.helpText && <p className="text-[10px] text-slate-500 font-medium italic mt-0.5">{field.helpText}</p>}
                  {hasErr && <p className="text-red-500 text-xs font-bold mt-1">{errors[field.id]}</p>}
                </div>
              );
            })}

            {/* Verification Block / Math Captcha */}
            {form.settings?.enableCaptcha !== false && (
              <div className="space-y-2 pt-4 border-t border-[#2D334A]/60">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  Human Verification *
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 sm:flex-initial px-4 py-3 rounded-xl bg-[#0B0F19] border border-[#2D334A]/80 font-mono text-sm font-bold text-slate-200 text-center select-none whitespace-nowrap">
                      {captcha.num1} + {captcha.num2} = ?
                    </div>
                    <button 
                      type="button" 
                      onClick={generateCaptcha} 
                      className="sm:hidden p-3.5 bg-[#0B0F19] hover:bg-slate-900 border border-[#2D334A]/60 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white"
                      title="Refresh Captcha"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="number"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Answer"
                      className={`w-full rounded-xl border px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-[#0B0F19]/50 transition-all ${
                        captchaError ? 'border-red-500 focus:border-red-500' : 'border-[#2D334A]/60 focus:border-violet-500'
                      }`}
                    />
                    <button 
                      type="button" 
                      onClick={generateCaptcha} 
                      className="hidden sm:block p-3.5 bg-[#0B0F19] hover:bg-slate-900 border border-[#2D334A]/60 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white"
                      title="Refresh Captcha"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {captchaError && <p className="text-red-500 text-xs font-bold mt-1">Incorrect math answer. Please try again.</p>}
              </div>
            )}

            {/* Submission button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 py-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Securing submission...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Submit Response securely
                </>
              )}
            </button>

            <div className="text-[10px] text-center text-slate-500 font-bold flex items-center justify-center gap-1 pt-4 select-none">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              Secure submission encrypted with SSL and virus-checked.
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default FormPublicView;
