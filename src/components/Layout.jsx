import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Copy, Award, Check, ReceiptText, History, FileText, Menu, X, ClipboardCheck, ChevronRight } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useState } from 'react';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const [copiedLink, setCopiedLink] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const copyRegisterLink = () => {
    const link = `${window.location.origin}/register`;
    navigator.clipboard.writeText(link);
    setCopiedLink('register');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const copyCertificateLink = () => {
    const link = `${window.location.origin}/register-certificate`;
    navigator.clipboard.writeText(link);
    setCopiedLink('certificate');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const navItems = [
    { name: 'Dashboard', mobileName: 'Dash', path: '/', icon: LayoutDashboard },
    { name: 'Certificates', mobileName: 'Certs', path: '/certificates', icon: Award },
    { name: 'Invoice Generator', mobileName: 'Invoice', path: '/invoice-generator', icon: ReceiptText },
    { name: 'Invoice History', mobileName: 'History', path: '/invoice-history', icon: History },
    { name: 'Form Builder', mobileName: 'Forms', path: '/form-builder', icon: FileText },
    { name: 'Attendance Tracker', mobileName: 'Attendance', path: '/attendance-tracker', icon: ClipboardCheck },
  ];

  return (
    <div className="flex h-screen bg-[#0B0F19] overflow-hidden selection:bg-violet-500/30 selection:text-violet-200">
      {/* Sidebar */}
      <aside className="w-72 bg-[#131726] border-r border-[#2D334A]/50 flex flex-col hidden md:flex shadow-2xl z-20 relative">
        <div className="h-20 flex items-center px-8 border-b border-[#2D334A]/50">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm flex-shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Admin Panel</h1>
          </Link>
        </div>
        <nav className="flex-1 px-5 py-8 space-y-3 overflow-y-auto pr-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 px-3">Main Menu</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/20'
                    : 'text-slate-400 hover:bg-[#1E243D]/50 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="text-sm font-semibold">{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-6 mt-6 border-t border-[#2D334A]/50">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 px-3">Utilities</div>
            <button
              onClick={copyRegisterLink}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-slate-400 hover:bg-[#1E243D]/50 hover:text-white text-left mb-2"
            >
              {copiedLink === 'register' ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-500" />}
              <span className="text-sm font-semibold">{copiedLink === 'register' ? 'Copied!' : 'Employee Reg Link'}</span>
            </button>
            <button
              onClick={copyCertificateLink}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-slate-400 hover:bg-[#1E243D]/50 hover:text-white text-left"
            >
              {copiedLink === 'certificate' ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-500" />}
              <span className="text-sm font-semibold">{copiedLink === 'certificate' ? 'Copied!' : 'Certificate Reg Link'}</span>
            </button>
          </div>
        </nav>

        <div className="p-6 border-t border-[#2D334A]/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-red-400 hover:bg-red-500/10 text-left"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-bold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-20 bg-[#131726]/80 backdrop-blur-md border-b border-[#2D334A]/50 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm flex-shrink-0 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Admin Panel</h1>
        </div>
        <button onClick={handleLogout} className="p-2 text-red-400 bg-red-500/10 rounded-xl transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:overflow-y-auto mt-20 md:mt-0 relative h-full overflow-hidden">
        {/* Deep space glows */}
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
        
        <div className="flex-1 p-6 md:p-12 overflow-y-auto pb-44 md:pb-12 bg-transparent relative z-10">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 bg-[#131726]/90 backdrop-blur-lg border border-[#2D334A]/50 shadow-2xl rounded-2xl flex justify-around p-2.5 gap-1 z-50">
        {navItems.slice(0, 3).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                isActive ? 'text-white bg-gradient-to-r from-violet-600 to-blue-600 shadow-lg shadow-violet-500/20' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">{item.mobileName}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
            mobileMenuOpen ? 'text-white bg-gradient-to-r from-violet-600 to-blue-600 shadow-lg' : 'text-slate-500'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">More</span>
        </button>
      </div>

      {/* Mobile More Options Slide-up Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex items-end justify-center">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          />
          
          {/* Drawer container */}
          <div className="relative w-full bg-[#131726] border-t border-[#2D334A]/80 rounded-t-[2.5rem] p-8 pb-16 z-10 shadow-2xl flex flex-col gap-8 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2D334A]/40 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">More Options</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">Access administration tools & link utilities</p>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 bg-[#1E243D]/50 hover:bg-[#1E243D] rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Options list */}
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1.5 mb-1">Modules</div>

              {/* Invoice History */}
              <Link
                to="/invoice-history"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-4.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  location.pathname === '/invoice-history'
                    ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white border-transparent shadow-lg shadow-violet-500/10'
                    : 'bg-[#0B0F19]/40 border-[#2D334A]/50 text-slate-300 hover:text-white hover:border-[#2D334A]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${location.pathname === '/invoice-history' ? 'bg-white/10 text-white' : 'bg-violet-500/10 text-violet-400'}`}>
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold">Invoice History</div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5">View saved billing and invoices</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </Link>
              
              {/* Form Builder */}
              <Link
                to="/form-builder"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-4.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  location.pathname === '/form-builder'
                    ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white border-transparent shadow-lg shadow-violet-500/10'
                    : 'bg-[#0B0F19]/40 border-[#2D334A]/50 text-slate-300 hover:text-white hover:border-[#2D334A]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${location.pathname === '/form-builder' ? 'bg-white/10 text-white' : 'bg-blue-500/10 text-blue-400'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold">Form Builder</div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Build & publish custom client forms</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </Link>

              {/* Attendance Tracker */}
              <Link
                to="/attendance-tracker"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-4.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  location.pathname === '/attendance-tracker'
                    ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white border-transparent shadow-lg shadow-violet-500/10'
                    : 'bg-[#0B0F19]/40 border-[#2D334A]/50 text-slate-300 hover:text-white hover:border-[#2D334A]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${location.pathname === '/attendance-tracker' ? 'bg-white/10 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold">Attendance Tracker</div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Aggregate, separate & download logs</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </Link>
            </div>

            {/* Utility links */}
            <div className="bg-[#0B0F19]/30 rounded-[1.75rem] border border-[#2D334A]/40 p-5 space-y-3">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Utilities</div>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { copyRegisterLink(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-between p-3.5 bg-[#131726]/40 hover:bg-[#1E243D]/50 border border-[#2D334A]/40 rounded-xl text-slate-300 hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-900 border border-[#2D334A]/50 rounded-lg text-slate-500">
                      <Copy className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">Employee Reg Link</span>
                  </div>
                  {copiedLink === 'register' ? <Check className="w-4 h-4 text-emerald-400 font-extrabold" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
                </button>
                
                <button
                  onClick={() => { copyCertificateLink(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-between p-3.5 bg-[#131726]/40 hover:bg-[#1E243D]/50 border border-[#2D334A]/40 rounded-xl text-slate-300 hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-900 border border-[#2D334A]/50 rounded-lg text-slate-500">
                      <Copy className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">Certificate Reg Link</span>
                  </div>
                  {copiedLink === 'certificate' ? <Check className="w-4 h-4 text-emerald-400 font-extrabold" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
                </button>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              className="w-full py-4.5 bg-red-500/5 hover:bg-red-500/10 text-red-400 border border-red-500/20 hover:border-red-500/35 font-extrabold rounded-2xl text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer mt-1"
            >
              <LogOut className="w-4 h-4" />
              Sign Out Securely
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
