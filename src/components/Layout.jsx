import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Copy, Award, Check, ReceiptText, History, FileText, Menu, X, ClipboardCheck, ChevronRight, Sun, Moon, Table } from 'lucide-react';
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
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

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
    { name: 'Live Sheets', mobileName: 'Sheets', path: '/live-sheets', icon: Table },
  ];

  return (
    <div className="flex h-screen bg-black overflow-hidden selection:bg-yellow-500/30 selection:text-yellow-200">
      {/* Sidebar */}
      <aside className="w-72 bg-[#111111]/98 backdrop-blur-2xl border-r border-[#222222]/60 flex flex-col hidden md:flex shadow-[6px_0_32px_rgba(0,0,0,0.35)] z-20 relative">
        {/* Logo Header */}
        <div className="h-20 flex items-center px-6 border-b border-[#222222]/60">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-md flex-shrink-0 overflow-hidden ring-2 ring-yellow-400/20 group-hover:ring-yellow-400/50 transition-all duration-300">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight leading-none" style={{color: 'inherit'}}>Admin Panel</h1>
              <p className="text-[10px] font-semibold tracking-wider mt-0.5" style={{color: '#facc15cc'}}>CGS Management</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-[9px] font-black uppercase tracking-[0.25em] mb-5 px-3" style={{color: 'rgba(156,163,175,0.6)'}}>Navigation</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition-all duration-300 group overflow-hidden ${
                  isActive
                    ? 'shadow-[0_4px_24px_rgba(234,179,8,0.35)] border border-yellow-400/30'
                    : 'hover:bg-white/[0.06] border border-transparent'
                }`}
                style={isActive
                  ? {
                      background: 'linear-gradient(135deg, #facc15 0%, #f59e0b 100%)',
                      color: '#000',
                    }
                  : { color: 'rgba(209,213,219,0.9)' }
                }
              >
                {/* Shimmer effect on active */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out pointer-events-none" />
                )}

                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  isActive
                    ? 'bg-black/20 shadow-inner'
                    : 'bg-[#1A1A1A] group-hover:bg-[#252525]'
                }`}>
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-yellow-400'}`} style={{width: '18px', height: '18px'}} />
                </div>

                <span className={`text-sm ${isActive ? 'font-black tracking-tight' : 'font-semibold'}`}>{item.name}</span>

                {isActive && (
                  <div className="ml-auto flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-40"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-black/50"></span>
                    </span>
                  </div>
                )}
              </Link>
            );
          })}

          <div className="pt-5 mt-5 border-t border-[#222222]/60">
            <div className="text-[9px] font-black uppercase tracking-[0.25em] mb-3 px-3" style={{color: 'rgba(156,163,175,0.6)'}}>Quick Links</div>
            <button
              onClick={copyRegisterLink}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-300 hover:bg-white/[0.06] text-left mb-1 group" style={{color: 'rgba(209,213,219,0.9)'}}
            >
              <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] group-hover:bg-[#222222] flex items-center justify-center flex-shrink-0 transition-all">
                {copiedLink === 'register' ? <Check className="w-4 h-4 text-yellow-400" /> : <Copy className="w-4 h-4 text-gray-500 group-hover:text-yellow-400" />}
              </div>
              <span className="text-sm font-semibold">{copiedLink === 'register' ? 'Link Copied!' : 'Employee Reg Link'}</span>
            </button>
            <button
              onClick={copyCertificateLink}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-300 hover:bg-white/[0.06] text-left group" style={{color: 'rgba(209,213,219,0.9)'}}
            >
              <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] group-hover:bg-[#222222] flex items-center justify-center flex-shrink-0 transition-all">
                {copiedLink === 'certificate' ? <Check className="w-4 h-4 text-yellow-400" /> : <Copy className="w-4 h-4 text-gray-500 group-hover:text-yellow-400" />}
              </div>
              <span className="text-sm font-semibold">{copiedLink === 'certificate' ? 'Link Copied!' : 'Certificate Reg Link'}</span>
            </button>
          </div>
        </nav>

        {/* Bottom Controls */}
        <div className="p-4 border-t border-[#222222]/60 space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-300 hover:bg-white/[0.06] text-left cursor-pointer group" style={{color: 'rgba(209,213,219,0.9)'}}
          >
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] group-hover:bg-yellow-500/20 flex items-center justify-center flex-shrink-0 transition-all">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-yellow-400" />}
            </div>
            <span className="text-sm font-semibold">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            <div className="ml-auto">
              <div className={`w-8 h-4 rounded-full transition-all duration-300 relative ${
                theme === 'light' ? 'bg-yellow-400' : 'bg-[#333333]'
              }`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${
                  theme === 'light' ? 'left-4' : 'left-0.5'
                }`} />
              </div>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-300 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 flex items-center justify-center flex-shrink-0 transition-all">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-20 bg-[#111111]/90 backdrop-blur-xl border-b border-[#222222]/50 flex items-center justify-between px-6 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm flex-shrink-0 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2.5 bg-[#1A1A1A]/50 hover:bg-[#1A1A1A] text-gray-300 rounded-xl transition-colors cursor-pointer">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-yellow-400" />}
          </button>
          <button onClick={handleLogout} className="p-2 text-red-400 bg-red-500/10 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:overflow-y-auto mt-20 md:mt-0 relative h-full overflow-hidden">
        {/* Ambient atmospheric glows */}
        <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-yellow-500/15 blur-[120px] rounded-full pointer-events-none z-0 opacity-60"></div>
        <div className="fixed bottom-[-10%] left-[-5%] w-[35%] h-[35%] bg-yellow-500/15 blur-[120px] rounded-full pointer-events-none z-0 opacity-60"></div>
        <div className="fixed top-[40%] left-[20%] w-[25%] h-[25%] bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none z-0 opacity-40"></div>
        
        <div className="flex-1 p-6 md:p-12 overflow-y-auto pb-44 md:pb-12 bg-transparent relative z-10">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 bg-[#111111]/90 backdrop-blur-lg border border-[#222222]/50 shadow-2xl rounded-2xl flex justify-around p-2.5 gap-1 z-50">
        {navItems.slice(0, 3).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                isActive ? 'text-white bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg shadow-yellow-500/20' : 'text-gray-500'
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
            mobileMenuOpen ? 'text-white bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg' : 'text-gray-500'
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
            className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          />
          
          {/* Drawer container */}
          <div className="relative w-full bg-[#111111] border-t border-[#222222]/80 rounded-t-[2.5rem] p-8 pb-16 z-10 shadow-2xl flex flex-col gap-8 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#222222]/40 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">More Options</h3>
                <p className="text-xs font-semibold text-gray-500 mt-1">Access administration tools & link utilities</p>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 bg-[#1A1A1A]/50 hover:bg-[#1A1A1A] rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Options list */}
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1.5 mb-1">Modules</div>

              {/* Invoice History */}
              <Link
                to="/invoice-history"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-4.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  location.pathname === '/invoice-history'
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-transparent shadow-lg shadow-yellow-500/10'
                    : 'bg-black/40 border-[#222222]/50 text-gray-300 hover:text-white hover:border-[#222222]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${location.pathname === '/invoice-history' ? 'bg-white/10 text-white' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold">Invoice History</div>
                    <div className="text-[10px] text-gray-500 font-semibold mt-0.5">View saved billing and invoices</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </Link>
              
              {/* Form Builder */}
              <Link
                to="/form-builder"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-4.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  location.pathname === '/form-builder'
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-transparent shadow-lg shadow-yellow-500/10'
                    : 'bg-black/40 border-[#222222]/50 text-gray-300 hover:text-white hover:border-[#222222]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${location.pathname === '/form-builder' ? 'bg-white/10 text-white' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold">Form Builder</div>
                    <div className="text-[10px] text-gray-500 font-semibold mt-0.5">Build & publish custom client forms</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </Link>

              {/* Attendance Tracker */}
              <Link
                to="/attendance-tracker"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-4.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  location.pathname === '/attendance-tracker'
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-transparent shadow-lg shadow-yellow-500/10'
                    : 'bg-black/40 border-[#222222]/50 text-gray-300 hover:text-white hover:border-[#222222]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${location.pathname === '/attendance-tracker' ? 'bg-white/10 text-white' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold">Attendance Tracker</div>
                    <div className="text-[10px] text-gray-500 font-semibold mt-0.5">Aggregate, separate & download logs</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </Link>

              {/* Live Sheets */}
              <Link
                to="/live-sheets"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-4.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  location.pathname === '/live-sheets'
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-transparent shadow-lg shadow-yellow-500/10'
                    : 'bg-black/40 border-[#222222]/50 text-gray-300 hover:text-white hover:border-[#222222]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${location.pathname === '/live-sheets' ? 'bg-white/10 text-white' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    <Table className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold">Live Sheets</div>
                    <div className="text-[10px] text-gray-500 font-semibold mt-0.5">Live Excel-like sheets</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </Link>
            </div>

            {/* Utility links */}
            <div className="bg-black/30 rounded-[1.75rem] border border-[#222222]/40 p-5 space-y-3">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Utilities</div>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { copyRegisterLink(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-between p-3.5 bg-[#111111]/40 hover:bg-[#1A1A1A]/50 border border-[#222222]/40 rounded-xl text-gray-300 hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gray-900 border border-[#222222]/50 rounded-lg text-gray-500">
                      <Copy className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">Employee Reg Link</span>
                  </div>
                  {copiedLink === 'register' ? <Check className="w-4 h-4 text-yellow-400 font-extrabold" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
                </button>
                
                <button
                  onClick={() => { copyCertificateLink(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-between p-3.5 bg-[#111111]/40 hover:bg-[#1A1A1A]/50 border border-[#222222]/40 rounded-xl text-gray-300 hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gray-900 border border-[#222222]/50 rounded-lg text-gray-500">
                      <Copy className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">Certificate Reg Link</span>
                  </div>
                  {copiedLink === 'certificate' ? <Check className="w-4 h-4 text-yellow-400 font-extrabold" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
                </button>
              </div>
            </div>

            {/* Theme switcher */}
            <button
              onClick={() => { toggleTheme(); }}
              className="w-full py-4 bg-black/40 hover:bg-[#1A1A1A]/50 border border-[#222222]/40 text-gray-300 hover:text-white font-extrabold rounded-2xl text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-yellow-400" />}
              {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </button>

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
