import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCollabStore } from '../stores/useCollabStore';
import { Loader2 } from 'lucide-react';

import { API_URL } from '../config';

const Login = () => {
  const { token, setTokenAndUser } = useCollabStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) navigate('/dashboard');
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email, password } : { name, email, password };
      
      const res = await axios.post(`${API_URL}${endpoint}`, payload);
      const { accessToken, ...userData } = res.data.data;
      setTokenAndUser(accessToken, userData);
      // Wait a moment for UX so the spinner doesn't flash too instantly if backend is fast
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.map(e => e.message).join(', '));
      } else {
        setError(err.response?.data?.message || 'Authentication failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-canvas relative">
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md p-8 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl flex flex-col items-center">
        
        {/* Back to Home & Logo */}
        <div className="w-full flex items-center justify-between mb-8">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium flex items-center gap-1">
             &larr; Home
          </button>
          <img src="/logo.webp" alt="Rove" className="h-10 w-10 object-contain shadow-sm border border-slate-200 rounded-lg p-1 bg-white" />
          <div className="w-12"></div> {/* Spacer for centering */}
        </div>

        <h2 className="text-2xl font-black text-center text-slate-900 mb-8 tracking-tight">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          {!isLogin && (
            <input 
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50"
              type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading}
            />
          )}
          <input 
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50"
            type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading}
          />
          <input 
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50"
            type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading}
          />

          {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-4 px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            className="text-blue-600 hover:text-blue-800 font-bold transition-colors underline decoration-2 underline-offset-2"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
