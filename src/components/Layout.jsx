import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UserPlus, QrCode, LogOut, Copy, ShieldCheck, Zap } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'framer-motion';

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

  const copyRegisterLink = () => {
    const link = `${window.location.origin}/register`;
    navigator.clipboard.writeText(link);
    alert('Registration link copied to clipboard!');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  ];

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden text-slate-200 selection:bg-primary-500/30">
      
      {/* Sidebar */}
      <aside className="w-80 bg-slate-900/50 backdrop-blur-2xl border-r border-white/5 flex flex-col hidden md:flex shadow-2xl relative z-20">
        <div className="h-24 flex items-center px-10 border-b border-white/5">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain brightness-0 invert" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">ID Verify <span className="text-primary-400">Pro</span></h1>
              <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] mt-1">COMMAND CENTER</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-6 py-10 space-y-2">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 px-4 flex items-center gap-2">
            <Zap className="w-3 h-3 text-primary-500" />
            Control Panel
          </div>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group overflow-hidden ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-blue-600/20 border border-white/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="text-sm font-black uppercase tracking-widest relative z-10">{item.name}</span>
                {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary-500 rounded-l-full shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>}
              </Link>
            );
          })}

          <div className="pt-8 mt-8 border-t border-white/5">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 px-4">Registry Access</div>
            <button
              onClick={copyRegisterLink}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-slate-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-white/5">
                <Copy className="w-5 h-5" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest">Copy Enrollment Link</span>
            </button>
          </div>
        </nav>

        <div className="p-8 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 font-black uppercase tracking-widest text-sm"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Dynamic Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary-600/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full"></div>
        </div>

        {/* Mobile Header */}
        <header className="md:hidden h-20 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain brightness-0 invert" />
            </div>
            <h1 className="text-lg font-black text-white tracking-tighter uppercase">ID Verify <span className="text-primary-400">Pro</span></h1>
          </div>
          <button onClick={handleLogout} className="p-2.5 text-rose-500 bg-rose-500/10 rounded-xl border border-rose-500/20">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 relative z-10 overflow-y-auto">
          <div className="p-6 md:p-14 max-w-7xl mx-auto pb-40 md:pb-14">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-8 left-6 right-6 bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-[2.5rem] flex justify-around p-3 z-50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-6 py-3 rounded-2xl transition-all ${
                  isActive ? 'text-primary-400 bg-primary-500/10 border border-primary-500/20' : 'text-slate-500'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.name}</span>
              </Link>
            );
          })}
          <button
            onClick={copyRegisterLink}
            className="flex flex-col items-center gap-1 px-6 py-3 rounded-2xl text-slate-500"
          >
            <Copy className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Layout;
