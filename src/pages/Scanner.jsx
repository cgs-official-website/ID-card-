import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner';
import { QrCode, AlertCircle } from 'lucide-react';

const ScannerPage = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleScan = (result) => {
    if (result && result.length > 0) {
      const qrValue = result[0].rawValue;
      
      try {
        // Assume the QR value is either a full URL like https://domain.com/employee/EMP123 or just the ID EMP123
        if (qrValue.includes('/employee/')) {
          const urlParts = qrValue.split('/employee/');
          const id = urlParts[1];
          if (id) {
            navigate(`/employee/${id}`);
          } else {
            setError("Invalid QR Code format");
          }
        } else {
          // If it's just an ID
          navigate(`/employee/${qrValue}`);
        }
      } catch (err) {
        setError("Could not process QR Code");
      }
    }
  };

  const handleError = (error) => {
    console.error(error);
    if (error?.message?.includes("NotAllowedError")) {
      setError("Camera access was denied. Please allow camera permissions to use the scanner.");
    } else {
      setError("Camera error. Please ensure your device has a working camera.");
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Scan Employee ID</h2>
        <p className="text-slate-500 text-sm mt-1">Position the QR code within the frame to verify.</p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Scanner Error</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-3 text-sm font-medium text-red-700 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
          <div className="absolute top-8 left-8 right-8 z-10 flex justify-between">
            <div className="w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-lg"></div>
            <div className="w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-lg"></div>
          </div>
          <div className="absolute bottom-8 left-8 right-8 z-10 flex justify-between">
            <div className="w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-lg"></div>
            <div className="w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-lg"></div>
          </div>
          
          <div className="rounded-xl overflow-hidden aspect-square bg-black">
            <QrScanner
              onScan={handleScan}
              onError={handleError}
              components={{
                audio: false,
                finder: false, // We use our custom corner UI
              }}
              styles={{
                container: { width: '100%', height: '100%' }
              }}
            />
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-500">
            <QrCode className="w-5 h-5 animate-pulse text-primary-500" />
            <span className="font-medium text-sm">Scanning for QR code...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerPage;
