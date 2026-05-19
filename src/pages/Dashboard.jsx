import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, User, QrCode as QrCodeIcon, Download, X, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCode } from 'react-qr-code';

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [totalIdCards, setTotalIdCards] = useState(0);
  const [totalCertificates, setTotalCertificates] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const qrRef = useRef();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const allData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const idCards = allData.filter(emp => !emp.isCertificate);
      const certs = allData.filter(emp => emp.isCertificate);
      
      setTotalIdCards(idCards.length);
      setTotalCertificates(certs.length);
      setEmployees(idCards);
    } catch (error) {
      console.error("Error fetching employees: ", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = (emp) => {
    const svg = document.getElementById(`qr-${emp.id}`);
    if (!svg) {
      // Just open the QR modal if not visible
      setSelectedEmployee(emp);
      return;
    }
    
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
      downloadLink.download = `${emp.name}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 bg-transparent">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#131726]/80 backdrop-blur-md p-6 rounded-3xl border border-[#2D334A]/50 shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-between">
          <div>
            <p className="text-white font-bold uppercase tracking-wider text-xs mb-1">Total ID Cards</p>
            <h3 className="text-4xl font-black text-white">{totalIdCards}</h3>
          </div>
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
            <User className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="bg-[#131726]/80 backdrop-blur-md p-6 rounded-3xl border border-[#2D334A]/50 shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-between">
          <div>
            <p className="text-white font-bold uppercase tracking-wider text-xs mb-1">Total Certificates</p>
            <h3 className="text-4xl font-black text-white">{totalCertificates}</h3>
          </div>
          <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center border border-violet-500/20">
            <QrCodeIcon className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-1">ID Card Dashboard</h2>
          <p className="text-white text-sm font-medium">Manage and view all registered employee records</p>
        </div>
        
        <div className="relative w-full lg:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search by name, ID or department..."
            className="pl-12 w-full rounded-2xl border border-[#2D334A]/50 bg-[#131726]/50 px-5 py-3.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all placeholder:text-slate-500 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-[#131726]/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D334A]/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0B0F19]/60 text-white font-bold border-b border-[#2D334A]/50">
              <tr>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Employee</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Employee ID</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Role & Dept</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px] hidden md:table-cell">Email Address</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D334A]/30">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-white">
                    <div className="flex flex-col justify-center items-center gap-4">
                      <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium">Loading employee records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-white">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-10 h-10 text-white mb-2" />
                      <p className="font-medium text-white">No employees found matching "{searchTerm}"</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#1E243D]/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold flex-shrink-0 overflow-hidden shadow-sm border border-violet-500/30">
                          {emp.photoUrl ? (
                            <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-6 h-6" />
                          )}
                        </div>
                        <span className="font-bold text-slate-100 text-base">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-[#0B0F19] text-white border border-[#2D334A]/50">
                        {emp.id}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-white">{emp.role || 'N/A'}</div>
                      <div className="text-white text-[10px] uppercase font-black tracking-tight">{emp.department}</div>
                    </td>
                    <td className="px-8 py-5 text-white font-medium hidden md:table-cell">{emp.email}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedEmployee(emp)}
                          className="p-2 text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all"
                          title="View QR"
                        >
                          <QrCodeIcon className="w-5 h-5" />
                        </button>
                        <Link 
                          to={`/admin/employee/${emp.id}`}
                          className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                          title="Manage"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Viewer Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#131726] rounded-[2.5rem] shadow-2xl border border-[#2D334A] w-full max-w-sm overflow-hidden">
            <div className="p-8 pb-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Employee QR</h3>
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="p-2 hover:bg-[#1E243D] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 pt-4 text-center">
              <div className="bg-white p-8 rounded-[2rem] mb-6 inline-block">
                <QRCode
                  id={`qr-${selectedEmployee.id}`}
                  value={`${window.location.origin}/employee/${selectedEmployee.id}`}
                  size={200}
                  level="H"
                />
              </div>
              
              <div className="mb-6">
                <p className="text-lg font-bold text-white mb-0">{selectedEmployee.name}</p>
                <p className="text-sm font-semibold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent uppercase tracking-wider">{selectedEmployee.role} • {selectedEmployee.department}</p>
                <p className="text-xs font-bold text-slate-500 mt-1">ID: {selectedEmployee.id}</p>
              </div>
              
              <button
                onClick={() => downloadQR(selectedEmployee)}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-violet-500/20 transition-all"
              >
                <Download className="w-5 h-5" />
                Download PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
