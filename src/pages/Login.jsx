import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { QrCode, Lock, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Invalid credentials. Identity could not be verified.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden selection:bg-primary-500/30">
      
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-600/20 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150"></div>
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 md:p-14 text-center shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-500/20 transform rotate-12">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain brightness-0 invert" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">ID Verify <span className="text-primary-400">Pro</span></h1>
          <p className="text-slate-500 font-bold text-[10px] tracking-[0.3em] uppercase">Access Terminal</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-xs font-bold mb-8 border border-rose-500/20"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="text-left">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block ml-1">Identity Email</label>
            <div className="relative group">
              <input
                type="email"
                required
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@registry.com"
              />
            </div>
          </div>
          
          <div className="text-left">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block ml-1">Access Key</label>
            <div className="relative">
              <input
                type="password"
                required
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-black py-5 px-4 rounded-[2rem] transition-all disabled:opacity-50 flex justify-center items-center gap-3 shadow-2xl shadow-primary-600/20 text-xs uppercase tracking-widest mt-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Initialize Access
              </>
            )}
          </button>
        </form>

        <div className="mt-10 flex items-center justify-center gap-2">
          <Zap className="w-3 h-3 text-primary-500 animate-pulse" />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Secure Node 01 - Active</p>
        </div>
      </motion.div>

      <style jsx>{`
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default Login;
