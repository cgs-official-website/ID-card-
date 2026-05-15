import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, User, QrCode as QrCodeIcon, Download, X, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCode } from 'react-qr-code';

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
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
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees: ", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = (emp) => {
    const svg = document.getElementById(`qr-${emp.id}`);
    if (!svg) {
      alert("Please click 'View QR' first to generate the download data.");
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
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Employees</h2>
          <p className="text-slate-500 text-sm font-medium">Manage and view all registered employee records</p>
        </div>
        
        <div className="relative w-full lg:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, ID or department..."
            className="pl-12 w-full rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder:text-slate-400 text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-slate-500 font-bold border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Employee</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Employee ID</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Role & Dept</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px] hidden md:table-cell">Email Address</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-slate-500">
                    <div className="flex flex-col justify-center items-center gap-4">
                      <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium">Loading employee records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-10 h-10 text-slate-200 mb-2" />
                      <p className="font-medium text-slate-400">No employees found matching "{searchTerm}"</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold flex-shrink-0 overflow-hidden shadow-sm border border-primary-100/50">
                          {emp.photoUrl ? (
                            <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-6 h-6" />
                          )}
                        </div>
                        <span className="font-bold text-slate-900 text-base">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/50">
                        {emp.id}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-700">{emp.role || 'N/A'}</div>
                      <div className="text-slate-400 text-[10px] uppercase font-black tracking-tight">{emp.department}</div>
                    </td>
                    <td className="px-8 py-5 text-slate-500 font-medium hidden md:table-cell">{emp.email}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedEmployee(emp)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          title="View QR"
                        >
                          <QrCodeIcon className="w-5 h-5" />
                        </button>
                        <Link 
                          to={`/admin/employee/${emp.id}`}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-8 pb-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Employee QR</h3>
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 pt-4 text-center">
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-6 inline-block">
                <QRCode
                  id={`qr-${selectedEmployee.id}`}
                  value={`${window.location.origin}/employee/${selectedEmployee.id}`}
                  size={200}
                  level="H"
                />
              </div>
              
              <div className="mb-6">
                <p className="text-lg font-bold text-slate-900 mb-0">{selectedEmployee.name}</p>
                <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider">{selectedEmployee.role} • {selectedEmployee.department}</p>
                <p className="text-xs font-bold text-slate-400 mt-1">ID: {selectedEmployee.id}</p>
              </div>
              
              <button
                onClick={() => downloadQR(selectedEmployee)}
                className="w-full flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-primary-600/20 transition-all"
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
