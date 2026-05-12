import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import GlobalHeader from '../components/GlobalHeader';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [activeToggles, setActiveToggles] = useState({
    tfa: true,
    encryption: true,
    persistence: false
  });

  const toggle = (key) => {
    setActiveToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role={user?.role || 'student'} />
      <GlobalHeader title="System Preferences" role={user?.role?.toUpperCase() || 'USER'} />

      <main className="ml-72 pt-24 px-8 pb-12">
        <header className="mb-10">
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Preferences</h2>
          <p className="text-on-surface-variant mt-2 text-lg">Tailor your culinary interface and security protocols.</p>
        </header>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8 bg-white rounded-[3rem] p-12 shadow-sm border border-slate-50">
            <div className="space-y-12">
              {/* Profile Section */}
              <section>
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person</span>
                  Identity Profile
                </h3>
                <div className="grid grid-cols-2 gap-8">
                  <SettingsInput label="Full Name" value={user?.name || 'Alex Rivera'} />
                  <SettingsInput label="Master ID" value={user?.id || '#29401'} disabled />
                  <SettingsInput label="Email Node" value={user?.email || 'user@campus.edu'} />
                  <SettingsInput label="Preferred Wing" value="North Wing Main" />
                </div>
              </section>

              {/* Security Section */}
              <section className="pt-12 border-t border-slate-50">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">security</span>
                  Security Protocols
                </h3>
                <div className="space-y-6">
                  <ToggleSwitch 
                    label="Two-Factor Authentication" 
                    sub="Biometric verification for large transactions." 
                    active={activeToggles.tfa}
                    onToggle={() => toggle('tfa')}
                  />
                  <ToggleSwitch 
                    label="Order Encryption" 
                    sub="Immutable receipt generation for audit logs." 
                    active={activeToggles.encryption}
                    onToggle={() => toggle('encryption')}
                  />
                  <ToggleSwitch 
                    label="Session Persistence" 
                    sub="Extend login duration for trusted devices." 
                    active={activeToggles.persistence}
                    onToggle={() => toggle('persistence')}
                  />
                </div>
              </section>

              <div className="pt-12 border-t border-slate-50 flex justify-end gap-4">
                <button className="px-8 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold hover:bg-slate-100 transition-all text-xs uppercase tracking-widest">Discard</button>
                <button 
                  onClick={() => alert('Settings mutations synchronized with system master.')}
                  className="px-10 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                >
                  Save Mutations
                </button>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl shadow-slate-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <h3 className="text-xl font-bold mb-4 relative z-10">Master Authority</h3>
              <p className="text-sm opacity-60 leading-relaxed relative z-10">Your account is governed by the Campus Culinary Council. Any high-level modifications require Tier-1 verification.</p>
              <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">verified_user</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Identity Verified</p>
                  <p className="text-xs font-bold opacity-40">System-wide Trust Index: 9.8</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const SettingsInput = ({ label, value, disabled }) => (
  <div>
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{label}</label>
    <input 
      type="text" 
      defaultValue={value} 
      disabled={disabled}
      className={`w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary/5 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 shadow-inner'}`} 
    />
  </div>
);

const ToggleSwitch = ({ label, sub, active, onToggle }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-bold text-slate-900">{label}</p>
      <p className="text-xs text-slate-400 mt-1 font-medium">{sub}</p>
    </div>
    <button 
      onClick={onToggle}
      className={`w-14 h-8 rounded-full relative transition-all duration-300 ${active ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-200'}`}
    >
      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 ${active ? 'left-7' : 'left-1'}`}></div>
    </button>
  </div>
);

export default Settings;
