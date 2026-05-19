import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { QrCode, Lock } from 'lucide-react';

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
      setError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#131726]/80 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D334A]/50 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Admin Login</h2>
          <p className="text-slate-400 text-sm mt-1">Sign in to manage employee ID cards</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm mb-6 border border-red-500/30 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full rounded-lg bg-[#0B0F19]/50 border border-[#2D334A]/50 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-shadow text-white placeholder:text-slate-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@company.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full rounded-lg bg-[#0B0F19]/50 border border-[#2D334A]/50 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-shadow text-white placeholder:text-slate-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-70 flex justify-center items-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
