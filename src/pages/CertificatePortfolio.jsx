import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ShieldCheck, Download, Printer, Copy, Check, Award, Building2, CalendarDays, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import CertificateSVG from '../components/CertificateSVG';
import NotifyModal from '../components/NotifyModal';

const CertificatePortfolio = () => {
  const { id } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [notify, setNotify] = useState(null);
  const certificateRef = useRef();

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'employees', id.toUpperCase());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().isCertificate) {
          setCert(docSnap.data());
        } else {
          setError('Certificate Credential Not Found');
        }
      } catch (err) {
        console.error("Error fetching certificate:", err);
        setError('Security Verification Failure: Unable to fetch credentials.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCertificate();
  }, [id]);

  const [downloading, setDownloading] = useState(false);

  const copyVerificationLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = () => {
    try {
      setDownloading(true);
      const svgElement = document.getElementById('portfolio-cert-svg');
      if (!svgElement) {
        setNotify({ type: 'error', title: 'Export Failed', message: 'Unable to find certificate structure. Please try again.' });
        setDownloading(false);
        return;
      }

      // Explicitly load the background template image
      const bgImg = new Image();
      
      bgImg.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Use 2000x1414 resolution for high print quality
        canvas.width = 2000;
        canvas.height = 1414;
        
        // Fill white background first
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the template background image explicitly
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

        // Clone the SVG so we can manipulate it before serializing
        const clonedSvg = svgElement.cloneNode(true);
        
        // Remove the <image> tag from the SVG clone to avoid CORS/taint issues on canvas
        const images = clonedSvg.getElementsByTagName('image');
        while (images.length > 0) {
          images[0].parentNode.removeChild(images[0]);
        }

        // CRITICAL FIX: Set SVG background to transparent so it doesn't hide the bgImg we just drew on the canvas!
        clonedSvg.style.background = 'transparent';
        
        // Ensure intrinsic dimensions are absolute pixels, not percentages, for proper canvas rendering
        clonedSvg.setAttribute('width', '1000');
        clonedSvg.setAttribute('height', '707');

        // Now convert and draw the cleaned SVG (which contains only masks and dynamic text)
        const svgString = new XMLSerializer().serializeToString(clonedSvg);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);
        
        const svgImg = new Image();
        svgImg.onload = () => {
          ctx.drawImage(svgImg, 0, 0, canvas.width, canvas.height);
          
          // Trigger download
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `${cert.candidateName.replace(/\s+/g, '_')}_Certificate.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
          
          URL.revokeObjectURL(blobURL);
          setDownloading(false);
        };
        svgImg.onerror = () => {
          console.error("Error drawing SVG onto canvas");
          setDownloading(false);
        };
        svgImg.src = blobURL;
      };

      bgImg.onerror = () => {
        console.error("Error loading background template image for export");
        setDownloading(false);
      };

      // Set the appropriate template image URL
      bgImg.src = cert.type === 'Internship' ? '/internship_template.png' : '/training_template.png';
      
    } catch (err) {
      console.error("Error exporting PNG:", err);
      setNotify({ type: 'error', title: 'Export Failed', message: 'Error generating image. Try printing as PDF instead.' });
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-[#2D334A]/50 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-400 font-bold text-xs tracking-[0.3em] uppercase">Verifying Certificate Integrity...</p>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-[#131726]/80 backdrop-blur-md p-12 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D334A]/50 max-w-sm w-full text-center"
        >
          <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-rose-500/20">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-white mb-4 tracking-tight">Security & Integrity Alert</h2>
          <p className="text-slate-400 font-medium leading-relaxed mb-8">{error}</p>
          <button onClick={() => window.location.reload()} className="w-full py-4 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold rounded-2xl hover:from-violet-500 hover:to-blue-500 transition-all shadow-lg shadow-violet-500/20">
            Retry Verification
          </button>
        </motion.div>
      </div>
    );
  }

  const certificateUrl = `${window.location.origin}/certificate/${id.toUpperCase()}`;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans overflow-x-hidden selection:bg-violet-500/30 selection:text-violet-200 relative print:bg-white print:text-black">
      {notify && (
        <NotifyModal type={notify.type} title={notify.title} message={notify.message} onClose={() => setNotify(null)} />
      )}
      
      {/* Print-only CSS layout to hide dashboard components and print ONLY the certificate SVG */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          #portfolio-cert-svg {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      {/* Decorative background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 no-print">
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-violet-600/15 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-[50%] h-[50%] bg-blue-600/15 blur-[150px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-16 flex flex-col items-center">
        
        {/* Verification Status Badge */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center mb-10 no-print"
        >
          <div className="flex items-center gap-3 bg-[#131726]/90 backdrop-blur-md px-6 py-3 rounded-full border border-violet-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.5)] mb-4">
            <div className="w-8 h-8 bg-gradient-to-tr from-violet-600 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30">
              <img src="/logo.png" alt="CGS Logo" className="w-5 h-5 object-contain bg-white p-0.5 rounded-md" />
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <h1 className="text-sm font-black text-white tracking-wider uppercase">CGS Official Verification</h1>
          </div>
          
          <div className="bg-violet-500/15 text-violet-300 px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.2)] flex items-center gap-2 animate-pulse">
            <ShieldCheck className="w-4 h-4" />
            Verified Digital Credential
          </div>
        </motion.div>

        {/* Certificate Display Area */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-4xl print-area mb-10"
        >
          <div ref={certificateRef} className="w-full bg-slate-900/50 p-2 md:p-4 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-sm print:bg-white print:p-0 print:border-none">
            <CertificateSVG 
              id="portfolio-cert-svg"
              candidateName={cert.candidateName}
              domain={cert.domain}
              duration={cert.duration}
              certificateCode={cert.id}
              type={cert.type}
              qrUrl={certificateUrl}
            />
          </div>
        </motion.div>

        {/* Portfolio Control Panel & Details */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch no-print"
        >
          {/* Main info panel */}
          <div className="md:col-span-7 bg-[#131726]/80 backdrop-blur-md rounded-3xl border border-[#2D334A]/50 p-8 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/20 flex-shrink-0">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Certificate Awarded To</p>
                <h2 className="text-2xl font-black text-white tracking-tight leading-none">{cert.candidateName}</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#0B0F19]/60 p-4 rounded-2xl border border-[#2D334A]/40">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-violet-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Domain</p>
                </div>
                <p className="text-white font-bold text-sm">{cert.domain}</p>
              </div>
              <div className="bg-[#0B0F19]/60 p-4 rounded-2xl border border-[#2D334A]/40">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="w-3.5 h-3.5 text-violet-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Program Type</p>
                </div>
                <p className="text-white font-bold text-sm">{cert.type}</p>
              </div>
              <div className="bg-[#0B0F19]/60 p-4 rounded-2xl border border-[#2D334A]/40 col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays className="w-3.5 h-3.5 text-violet-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Duration</p>
                </div>
                <p className="text-white font-bold text-sm">{cert.duration}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-[#2D334A]/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-violet-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cert ID</span>
              </div>
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent font-black tracking-wider text-sm">{cert.id}</span>
            </div>
          </div>

          {/* Action Panel */}
          <div className="md:col-span-5 bg-[#131726]/80 backdrop-blur-md rounded-3xl border border-[#2D334A]/50 p-8 flex flex-col justify-center space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center mb-2">Certificate Actions</p>
            <button
              onClick={handleDownloadPNG}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-70 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-violet-500/25"
            >
              <Download className={`w-5 h-5 ${downloading ? 'animate-bounce' : ''}`} />
              {downloading ? 'Generating HD PNG...' : 'Download Certificate'}
            </button>

            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-3 bg-[#1E243D] hover:bg-[#252B48] text-white font-bold py-4 rounded-xl transition-all border border-[#2D334A]"
            >
              <Printer className="w-5 h-5" />
              Print / Save as PDF
            </button>

            <button
              onClick={copyVerificationLink}
              className="w-full flex items-center justify-center gap-3 bg-[#1E243D] hover:bg-[#252B48] text-white font-bold py-4 rounded-xl transition-all border border-[#2D334A]"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Link Copied!' : 'Copy Verification Link'}
            </button>

            <div className="pt-4 border-t border-[#2D334A]/50 text-center">
              <p className="text-[10px] text-slate-500 font-medium">Issued by Carrezza Global Solutions</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <img src="/logo.png" alt="CGS" className="w-6 h-6 object-contain bg-white p-0.5 rounded-md shadow-sm" />
                <span className="text-xs font-black text-white tracking-widest uppercase">CGS</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer branding */}
        <div className="mt-16 text-center text-xs text-slate-600 no-print">
          <p>© {new Date().getFullYear()} Carrezza Global Solutions. All credentials verified and secured.</p>
        </div>

      </div>
    </div>
  );
};

export default CertificatePortfolio;
