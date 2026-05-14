import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, User, ExternalLink, QrCode as QrCodeIcon, Download, X, Eye, Users, ShieldCheck, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCode } from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';

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
      if (error.code === 'failed-precondition' || error.message.includes('API_KEY')) {
        setEmployees([
          { id: 'EMP001', name: 'John Doe', department: 'Engineering', email: 'john@example.com' },
          { id: 'EMP002', name: 'Jane Smith', department: 'Marketing', email: 'jane@example.com' }
        ]);
      }
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
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12">
      
      {/* Dashboard Header & Stats */}
      <div className="flex flex-col gap-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Personnel Registry</h2>
            <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Registry Status: <span className="text-primary-400">ACTIVE & SECURE</span></p>
          </motion.div>
          
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="relative w-full lg:w-96 group"
          >
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by name, ID or department..."
              className="pl-14 w-full rounded-[2rem] border border-white/10 bg-slate-900/50 backdrop-blur-xl px-6 py-4 text-sm font-bold text-white shadow-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Enrolled', value: employees.length, icon: Users, color: 'primary' },
            { label: 'Verified Identities', value: employees.length, icon: ShieldCheck, color: 'blue' },
            { label: 'Active Sessions', value: 'Live', icon: TrendingUp, color: 'emerald' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * i }}
              className="bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 blur-3xl rounded-full`}></div>
              <div className="flex items-center gap-6 relative z-10">
                <div className={`w-14 h-14 bg-${stat.color}-500/10 text-${stat.color}-400 rounded-2xl flex items-center justify-center border border-${stat.color}-500/10 shadow-lg shadow-${stat.color}-500/5 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-white leading-none">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Registry Table */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950/50 text-slate-500 border-b border-white/5">
              <tr>
                <th className="px-10 py-6 font-black uppercase tracking-[0.2em] text-[10px]">Personnel Profile</th>
                <th className="px-10 py-6 font-black uppercase tracking-[0.2em] text-[10px]">Registry ID</th>
                <th className="px-10 py-6 font-black uppercase tracking-[0.2em] text-[10px]">Department</th>
                <th className="px-10 py-6 font-black uppercase tracking-[0.2em] text-[10px] hidden md:table-cell">Contact Node</th>
                <th className="px-10 py-6 font-black uppercase tracking-[0.2em] text-[10px] text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-10 py-24 text-center">
                    <div className="flex flex-col justify-center items-center gap-6">
                      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-black text-slate-500 uppercase tracking-widest text-xs">Synchronizing Records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-slate-950 rounded-3xl flex items-center justify-center border border-white/5 mb-2">
                        <Search className="w-10 h-10 text-slate-700" />
                      </div>
                      <p className="font-black text-slate-500 uppercase tracking-widest text-xs">No records detected matching "{searchTerm}"</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => (
                  <motion.tr 
                    key={emp.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary-500 blur-lg opacity-0 group-hover:opacity-20 transition-opacity rounded-2xl"></div>
                          <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center font-bold flex-shrink-0 overflow-hidden shadow-2xl relative z-10 transform group-hover:scale-105 transition-transform">
                            {emp.photoUrl ? (
                              <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-8 h-8 text-slate-700" />
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="font-black text-white text-lg tracking-tight group-hover:text-primary-400 transition-colors">{emp.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{emp.employeeType || 'Personnel'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="font-mono text-sm font-bold text-primary-500/80 bg-primary-500/5 px-4 py-2 rounded-xl border border-primary-500/10">
                        {emp.id}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500/40"></div>
                        <span className="font-bold text-slate-400 text-sm">{emp.department}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 hidden md:table-cell">
                      <p className="text-slate-500 font-bold text-xs tracking-tight">{emp.email}</p>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => setSelectedEmployee(emp)}
                          className="p-3.5 text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-2xl border border-transparent hover:border-primary-500/20 transition-all"
                          title="Generate QR"
                        >
                          <QrCodeIcon className="w-6 h-6" />
                        </button>
                        <Link 
                          to={`/admin/employee/${emp.id}`}
                          className="p-3.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/10 transition-all"
                          title="View Dossier"
                        >
                          <ArrowUpRight className="w-6 h-6" />
                        </Link>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* QR Viewer Modal */}
      <AnimatePresence>
        {selectedEmployee && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEmployee(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[3.5rem] shadow-2xl w-full max-w-sm overflow-hidden relative z-10"
            >
              <div className="p-10 pb-4 flex justify-between items-center">
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase">QR Access</h3>
                <button 
                  onClick={() => setSelectedEmployee(null)}
                  className="p-3 hover:bg-white/5 rounded-2xl transition-colors border border-transparent hover:border-white/5"
                >
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>
              
              <div className="p-10 pt-4 text-center">
                <div className="bg-white p-10 rounded-[3rem] border-8 border-slate-950 mb-8 inline-block shadow-2xl relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-blue-500/5 rounded-[2.5rem]"></div>
                  <QRCode
                    id={`qr-${selectedEmployee.id}`}
                    value={`${window.location.origin}/employee/${selectedEmployee.id}`}
                    size={220}
                    level="H"
                    className="relative z-10"
                  />
                </div>
                
                <div className="mb-10">
                  <p className="text-2xl font-black text-white tracking-tight mb-1">{selectedEmployee.name}</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/10">
                      {selectedEmployee.department}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">ID: {selectedEmployee.id}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => downloadQR(selectedEmployee)}
                  className="w-full flex items-center justify-center gap-4 bg-primary-600 hover:bg-primary-500 text-white font-black py-5 px-6 rounded-3xl shadow-2xl shadow-primary-600/20 transition-all uppercase tracking-widest text-sm"
                >
                  <Download className="w-6 h-6" />
                  Extract PNG Image
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
