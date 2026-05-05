import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UserPlus, QrCode, LogOut, Copy } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col hidden md:flex shadow-sm">
        <div className="h-20 flex items-center px-8 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin</h1>
          </Link>
        </div>
        <nav className="flex-1 px-5 py-8 space-y-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 px-3">Main Menu</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm shadow-primary-100/50'
                    : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                <span className="text-sm font-semibold">{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-6 mt-6 border-t border-gray-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 px-3">Utilities</div>
            <button
              onClick={copyRegisterLink}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-slate-600 hover:bg-gray-50 hover:text-slate-900 text-left"
            >
              <Copy className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-semibold">Registration Link</span>
            </button>
          </div>
        </nav>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-red-600 hover:bg-red-50 text-left"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-bold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin</h1>
        </div>
        <button onClick={handleLogout} className="p-2 text-red-600 bg-red-50 rounded-xl transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:overflow-y-auto mt-20 md:mt-0 relative h-full overflow-hidden">
        <div className="flex-1 p-6 md:p-12 overflow-y-auto pb-44 md:pb-12 bg-gray-50/50">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl flex justify-around p-3 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                isActive ? 'text-primary-600 bg-primary-50/50' : 'text-slate-500'
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
