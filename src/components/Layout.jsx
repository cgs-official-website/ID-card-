import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Copy, Award, Check } from 'lucide-react';
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
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Certificates', path: '/certificates', icon: Award },
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
      <div className="md:hidden fixed bottom-6 left-6 right-6 bg-[#131726]/90 backdrop-blur-lg border border-[#2D334A]/50 shadow-2xl rounded-2xl flex justify-around p-3 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                isActive ? 'text-white bg-gradient-to-r from-violet-600 to-blue-600 shadow-lg shadow-violet-500/20' : 'text-slate-500'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
            </Link>
          );
        })}
        <button
          onClick={copyRegisterLink}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-slate-500"
        >
          <Copy className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Link</span>
        </button>
      </div>
    </div>
  );
};

export default Layout;
