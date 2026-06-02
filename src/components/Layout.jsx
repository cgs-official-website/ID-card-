import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Copy, Award, Check, ReceiptText, History, FileText, Menu, X } from 'lucide-react';
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
        <nav className="flex-1 px-5 py-8 space-y-3">
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
          <div className="relative w-full bg-[#131726] border-t border-[#2D334A] rounded-t-[2.5rem] p-6 pb-12 z-10 shadow-2xl flex flex-col gap-6 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">More Options</h3>
                <p className="text-xs font-semibold text-slate-500">Access utilities and settings</p>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-[#1E243D] rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Options grid list */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Invoice History */}
              <Link
                to="/invoice-history"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-4 rounded-2xl border text-left flex flex-col gap-2.5 transition-all ${
                  location.pathname === '/invoice-history'
                    ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white border-transparent'
                    : 'bg-[#0B0F19]/40 border-[#2D334A]/50 text-slate-300 hover:text-white'
                }`}
              >
                <History className="w-5 h-5" />
                <div>
                  <div className="text-xs font-extrabold">Invoice History</div>
                  <div className="text-[9px] text-slate-500 font-bold mt-0.5">View saved billing logs</div>
                </div>
              </Link>
              
              {/* Form Builder */}
              <Link
                to="/form-builder"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-4 rounded-2xl border text-left flex flex-col gap-2.5 transition-all ${
                  location.pathname === '/form-builder'
                    ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white border-transparent'
                    : 'bg-[#0B0F19]/40 border-[#2D334A]/50 text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-5 h-5" />
                <div>
                  <div className="text-xs font-extrabold">Form Builder</div>
                  <div className="text-[9px] text-slate-500 font-bold mt-0.5">Build & publish custom forms</div>
                </div>
              </Link>
            </div>

            {/* Utility links */}
            <div className="bg-[#0B0F19]/30 rounded-2xl border border-[#2D334A]/40 p-4 space-y-1.5">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Utilities</div>
              
              <button
                onClick={() => { copyRegisterLink(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#1E243D]/50 text-slate-300 hover:text-white transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold">Employee Reg Link</span>
                </div>
                {copiedLink === 'register' && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
              
              <button
                onClick={() => { copyCertificateLink(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#1E243D]/50 text-slate-300 hover:text-white transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold">Certificate Reg Link</span>
                </div>
                {copiedLink === 'certificate' && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>

            {/* Logout button */}
            <button
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
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
