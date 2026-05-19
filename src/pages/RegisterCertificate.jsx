import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle2, Award, Copy, ExternalLink, QrCode, Check } from 'lucide-react';
import CertificateSVG from '../components/CertificateSVG';
import NotifyModal from '../components/NotifyModal';

const RegisterCertificate = () => {
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: {
      type: 'Internship',
      certificateCode: 'CGSC001',
      domain: 'Web Development',
      duration: 'April 16 2026 to June 01 2026'
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredCode, setRegisteredCode] = useState('');
  const [notify, setNotify] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const showNotify = (type, title, message) => setNotify({ type, title, message });
  
  const watchValues = watch();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const certId = data.certificateCode.trim().toUpperCase();
      
      // Check if certificate code already exists
      const docRef = doc(db, 'employees', certId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        showNotify('error', 'Code Exists', 'A certificate with this Certificate Code already exists. Please choose a unique code.');
        setLoading(false);
        return;
      }

      const certificateData = {
        id: certId,
        candidateName: data.candidateName.trim(),
        domain: data.domain.trim(),
        duration: data.duration.trim(),
        type: data.type,
        isCertificate: true,
        createdAt: serverTimestamp()
      };

      await setDoc(docRef, certificateData);
      setRegisteredCode(certId);
      setSuccess(true);
    } catch (error) {
      console.error('Error registering certificate:', error);
      showNotify('error', 'Registration Failed', 'Error submitting certificate data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyPortfolioLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/certificate/${registeredCode}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (success) {
    const portfolioUrl = `${window.location.origin}/certificate/${registeredCode}`;
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6 py-12">
        {notify && <NotifyModal type={notify.type} title={notify.title} message={notify.message} onClose={() => setNotify(null)} />}
        <div className="max-w-4xl w-full bg-[#131726]/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D334A]/50 p-8 md:p-12 text-center space-y-8">
          <div className="w-20 h-20 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <div>
            <h2 className="text-3xl font-black text-white mb-2">Certificate Registered Successfully!</h2>
            <p className="text-slate-400 font-medium">The certificate has been successfully compiled and verified.</p>
          </div>

          {/* Dynamic Certificate Preview */}
          <div className="border border-[#2D334A]/50 rounded-2xl overflow-hidden max-w-2xl mx-auto shadow-inner bg-[#0B0F19] p-4">
            <CertificateSVG 
              candidateName={watchValues.candidateName}
              domain={watchValues.domain}
              duration={watchValues.duration}
              certificateCode={registeredCode}
              type={watchValues.type}
              qrUrl={portfolioUrl}
            />
          </div>

          <div className="max-w-md mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <button 
              onClick={copyPortfolioLink}
              className="flex items-center justify-center gap-2 py-3 px-6 bg-[#1E243D] hover:bg-[#252B48] text-white font-bold rounded-xl transition-all border border-[#2D334A]"
            >
              <Copy className="w-5 h-5" />
              Copy Portfolio Link
            </button>
            <a 
              href={portfolioUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/20"
            >
              <ExternalLink className="w-5 h-5" />
              View Portfolio
            </a>
          </div>

          <div className="pt-6 border-t border-[#2D334A]/50">
            <button 
              onClick={() => {
                setSuccess(false);
                reset();
              }}
              className="text-violet-400 font-bold hover:underline"
            >
              Register Another Certificate
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      {notify && <NotifyModal type={notify.type} title={notify.title} message={notify.message} onClose={() => setNotify(null)} />}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Registration Form (7 cols) */}
        <div className="lg:col-span-6 space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start items-center gap-2 mb-4">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain bg-white p-1.5 rounded-xl shadow-sm" />
              <h1 className="text-3xl font-black text-white tracking-tight">Certificate Registrar</h1>
            </div>
            <p className="text-slate-400 font-medium">Verify credentials and generate digital portfolios dynamically.</p>
          </div>

          <div className="bg-[#131726]/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D334A]/50 overflow-hidden">
            <form onSubmit={handleSubmit(onSubmit)} className="p-8 md:p-10 space-y-6">
              
              {/* Certificate Type Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Certificate Type *</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    watchValues.type === 'Internship' 
                      ? 'border-violet-500 bg-violet-500/20 text-violet-300 font-bold' 
                      : 'border-[#2D334A]/50 text-slate-500 hover:bg-[#1E243D]/50'
                  }`}>
                    <input type="radio" value="Internship" className="hidden" {...register('type')} />
                    <Award className="w-5 h-5" />
                    Internship
                  </label>
                  <label className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    watchValues.type === 'Training' 
                      ? 'border-violet-500 bg-violet-500/20 text-violet-300 font-bold' 
                      : 'border-[#2D334A]/50 text-slate-500 hover:bg-[#1E243D]/50'
                  }`}>
                    <input type="radio" value="Training" className="hidden" {...register('type')} />
                    <Award className="w-5 h-5" />
                    Training
                  </label>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Candidate Name *</label>
                  <input 
                    {...register('candidateName', { required: 'Candidate Name is required' })} 
                    className="w-full rounded-xl border border-[#2D334A]/50 bg-[#0B0F19]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white font-medium" 
                    placeholder="Enter Candidate Full Name" 
                  />
                  {errors.candidateName && <p className="text-red-400 text-xs mt-1">{errors.candidateName.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Domain *</label>
                  <input 
                    {...register('domain', { required: 'Domain is required' })} 
                    className="w-full rounded-xl border border-[#2D334A]/50 bg-[#0B0F19]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white font-medium" 
                    placeholder="e.g. Web Development" 
                  />
                  {errors.domain && <p className="text-red-400 text-xs mt-1">{errors.domain.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Certificate Code *</label>
                    <input 
                      {...register('certificateCode', { required: 'Code is required' })} 
                      className="w-full rounded-xl border border-[#2D334A]/50 bg-[#0B0F19]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white font-medium" 
                      placeholder="e.g. CGSC001" 
                    />
                    {errors.certificateCode && <p className="text-red-400 text-xs mt-1">{errors.certificateCode.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Duration *</label>
                    <input 
                      {...register('duration', { required: 'Duration is required' })} 
                      className="w-full rounded-xl border border-[#2D334A]/50 bg-[#0B0F19]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white font-medium" 
                      placeholder="April 16 2026 to June 01 2026" 
                    />
                    {errors.duration && <p className="text-red-400 text-xs mt-1">{errors.duration.message}</p>}
                  </div>
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
                    Registering...
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    Generate & Verify Certificate
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Live Preview (5 cols) */}
        <div className="lg:col-span-6 space-y-6 lg:sticky lg:top-12">
          <div className="text-center lg:text-left">
            <h3 className="text-lg font-black text-white">Dynamic Certificate Preview</h3>
            <p className="text-sm text-slate-400">Live preview of how the generated certificate will look.</p>
          </div>
          
          <div className="border border-[#2D334A]/50 rounded-3xl overflow-hidden bg-[#0B0F19] shadow-[0_8px_30px_rgb(0,0,0,0.3)] p-4 transition-all">
            <CertificateSVG 
              candidateName={watchValues.candidateName || 'YOUR NAME HERE'}
              domain={watchValues.domain || 'Web Development'}
              duration={watchValues.duration || 'April 16 2026 to June 01 2026'}
              certificateCode={watchValues.certificateCode || 'CGSC001'}
              type={watchValues.type}
              qrUrl={`${window.location.origin}/certificate/${watchValues.certificateCode || 'TEMP'}`}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default RegisterCertificate;
