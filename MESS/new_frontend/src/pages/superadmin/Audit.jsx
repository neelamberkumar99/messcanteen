import React from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';

const SuperAdminAudit = () => {
  const logs = [
    { time: '11:58:24', action: 'Master Key Rotation', target: 'System-Alpha', severity: 'Low', status: 'Success' },
    { time: '11:45:12', action: 'Permission Escalation', target: 'Admin #004', severity: 'Critical', status: 'Blocked' },
    { time: '11:32:05', action: 'Bulk Database Export', target: 'Financial-Replica-1', severity: 'High', status: 'Success' },
    { time: '11:10:48', action: 'Node Synchronization', target: 'Canteen-North-05', severity: 'Low', status: 'Success' },
    { time: '10:55:12', action: 'DDoS Mitigation Triggered', target: 'Edge-Gateway-3', severity: 'Critical', status: 'Active' },
  ];

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="superadmin" />
      <GlobalHeader title="Cryptographic Audit" role="Super Admin" />

      <main className="ml-72 pt-24 px-8 pb-12">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Security Timeline</h2>
            <p className="text-on-surface-variant mt-2 text-lg">Incorruptible immutable ledger of all high-level system mutations and security events.</p>
          </div>
          <div className="flex gap-4">
            <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-slate-900/20">
              <span className="material-symbols-outlined text-sm">terminal</span>
              Live Shell Access
            </button>
          </div>
        </header>

        {/* Global Security Grid */}
        <div className="grid grid-cols-12 gap-8 mb-12">
          <div className="col-span-12 lg:col-span-4 bg-error-container text-on-error-container p-10 rounded-[3rem] shadow-xl shadow-error/20 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">High-Severity Events</h3>
              <p className="text-sm opacity-80 font-medium">Critical system mutations detected in the last 24 hours.</p>
            </div>
            <p className="text-6xl font-black mt-12">08</p>
          </div>

          <div className="col-span-12 lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-50 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            <h3 className="text-xl font-bold mb-8 relative z-10">Threat Distribution</h3>
            <div className="flex items-end gap-12 h-32 relative z-10">
              {[40, 20, 60, 30, 80, 45, 90].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4">
                  <div className="w-full bg-slate-50 rounded-full h-full relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-full bg-slate-900/10 rounded-full h-full"></div>
                    <div className={`absolute bottom-0 left-0 w-full rounded-full transition-all duration-1000 ${h > 70 ? 'bg-error' : 'bg-slate-400'}`} style={{ height: `${h}%` }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Feed */}
        <section className="bg-slate-900 text-white rounded-[3.5rem] p-12 shadow-2xl shadow-slate-900/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className="relative z-10 flex justify-between items-center mb-10">
            <h3 className="text-2xl font-bold tracking-tight">System Mutation Ledger</h3>
            <div className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">Streaming Data</div>
          </div>
          <div className="space-y-4 relative z-10">
            {logs.map((log, i) => (
              <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
                <div className="flex items-center gap-8">
                  <p className="text-[10px] font-mono opacity-40 group-hover:opacity-100 transition-opacity">{log.time}</p>
                  <div className="w-px h-8 bg-white/10"></div>
                  <div>
                    <p className="font-bold text-white leading-none">{log.action}</p>
                    <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mt-1">Target: {log.target}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                    log.severity === 'Critical' ? 'bg-error text-white shadow-lg shadow-error/40' : 
                    log.severity === 'High' ? 'bg-amber-500 text-slate-900' : 'bg-white/10 text-white/60'
                  }`}>
                    {log.severity}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${log.status === 'Success' ? 'text-green-400' : 'text-error animate-pulse'}`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SuperAdminAudit;
