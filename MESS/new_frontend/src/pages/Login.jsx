import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading && user) {
      const roleRouteMap = {
        'student': '/student/dashboard',
        'vendor': '/vendor/dashboard',
        'contractor': '/vendor/dashboard',
        'admin': '/admin/dashboard',
        'superadmin': '/superadmin/dashboard',
      };
      const route = roleRouteMap[user.role?.toLowerCase()] || '/student/dashboard';
      navigate(route);
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  // Demo credentials for testing (updated to match seed data)
  const demoCredentials = {
    student: { email: 'neel@student.com', password: 'password123' },
    vendor: { email: 'vendor@mess.com', password: 'password123' },
    admin: { email: 'admin@mess.com', password: 'password123' },
    superadmin: { email: 'superadmin@mess.com', password: 'password123' },
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      
      // Navigate based on user role
      const roleRouteMap = {
        'student': '/student/dashboard',
        'vendor': '/vendor/dashboard',
        'contractor': '/vendor/dashboard',
        'admin': '/admin/dashboard',
        'superadmin': '/superadmin/dashboard',
      };

      const route = roleRouteMap[userData?.role?.toLowerCase()] || '/student/dashboard';
      navigate(route);
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError('');
    setLoading(true);

    try {
      const creds = demoCredentials[role];
      const userData = await login(creds.email, creds.password);
      
      const routeMap = {
        student: '/student/dashboard',
        vendor: '/vendor/dashboard',
        admin: '/admin/dashboard',
        superadmin: '/superadmin/dashboard',
      };

      navigate(routeMap[role]);
    } catch (err) {
      setError(`Demo login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-container flex items-center justify-center min-h-screen font-body-md text-on-surface antialiased p-8">
      {/* Main Container */}
      <main className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-100 p-12 flex flex-col gap-10">
          {/* Header */}
          <div className="text-center flex flex-col items-center gap-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
              </div>
              <span className="text-4xl font-black text-slate-900 tracking-tight">Concierge</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 font-medium">Sign in to your premium management suite</p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-6" onSubmit={handleManualLogin}>
            {error && (
              <div className="bg-error/5 border border-error/20 text-error text-[10px] font-black uppercase tracking-widest p-4 rounded-xl text-center">
                {error}
              </div>
            )}
            
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1" htmlFor="email">Email Address</label>
              <input 
                className="block w-full rounded-2xl border-slate-100 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-inner disabled:opacity-50" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com" 
                type="email"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1" htmlFor="password">Password</label>
              <input 
                className="block w-full rounded-2xl border-slate-100 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-inner disabled:opacity-50" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                type="password"
                required
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between mt-2 px-1">
              <div className="flex items-center gap-3">
                <input className="h-5 w-5 rounded-lg border-slate-200 text-primary focus:ring-primary/20 disabled:opacity-50" id="remember" type="checkbox" disabled={loading}/>
                <label className="text-xs font-bold text-slate-500" htmlFor="remember">Remember me</label>
              </div>
              <a className="text-xs font-black text-primary hover:underline transition-colors uppercase tracking-widest" href="#">Forgot password?</a>
            </div>

            <button 
              className="w-full bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl py-5 mt-4 hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Signing in...
                </>
              ) : (
                'Secure Login'
              )}
            </button>
          </form>
        </div>

        {/* Role Selection Demo Section */}
        <div className="mt-12 flex flex-col gap-6 items-center">
          <div className="flex flex-col items-center">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Demo Access</h2>
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter mt-1">Quick login for testing</p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full">
            <RoleButton 
              icon="school" 
              label="Student" 
              onClick={() => handleDemoLogin('student')}
              loading={loading}
            />
            <RoleButton 
              icon="storefront" 
              label="Vendor" 
              onClick={() => handleDemoLogin('vendor')}
              loading={loading}
            />
            <RoleButton 
              icon="admin_panel_settings" 
              label="Admin" 
              onClick={() => handleDemoLogin('admin')}
              loading={loading}
            />
            <RoleButton 
              icon="security" 
              label="Super Admin" 
              onClick={() => handleDemoLogin('superadmin')}
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

const RoleButton = ({ icon, label, onClick, loading }) => (
  <button 
    onClick={onClick}
    disabled={loading}
    className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary hover:shadow-2xl hover:shadow-primary/5 transition-all group active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-3xl">{icon}</span>
    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{label}</span>
  </button>
);

export default Login;
