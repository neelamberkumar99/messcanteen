import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { superAdminService } from '../../api/index';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalHostels: 0,
    totalStudents: 0,
    totalAdmins: 0,
    totalRevenue: 0,
    activeBills: 0,
    pendingComplaints: 0
  });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ title: '', message: '', target: 'all' });
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await superAdminService.getSystemStats();
        setStats(res.data || stats);
      } catch (err) {
        console.error('Error fetching global stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    setPublishing(true);
    try {
      await superAdminService.publishAnnouncement(notice);
      alert('Announcement broadcasted across the network.');
      setNotice({ title: '', message: '', target: 'all' });
    } catch (err) {
      alert('Broadcast failed: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="superadmin" />
      <GlobalHeader title="System Master Console" role="Super Admin" />

      <main className="ml-72 pt-24 px-8 pb-12">
        {/* Hero Metrics Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Master Orchestration</h2>
            <p className="text-on-surface-variant mt-2 text-lg">High-level oversight of global culinary logistics and system health.</p>
          </div>
          <div className="bg-white px-6 py-4 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Global Revenue</span>
              <span className="text-2xl font-black text-primary">₹{(stats.totalRevenue || 0).toLocaleString()}</span>
            </div>
            <div className="w-px h-10 bg-slate-100"></div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Active Nodes</span>
              <span className="text-2xl font-black text-slate-900">{stats.totalHostels} Hostels</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 mb-12">
          {/* Announcement Panel */}
          <div className="col-span-12 lg:col-span-7 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
             <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                   <span className="material-symbols-outlined font-black">campaign</span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Global Proclamation</h3>
             </div>

             <form onSubmit={handlePublish} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">Notice Heading</label>
                   <input 
                      required
                      type="text" 
                      value={notice.title}
                      onChange={(e) => setNotice({...notice, title: e.target.value})}
                      placeholder="Maintenance Alert / Policy Update"
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">Recipient Audience</label>
                   <select 
                      value={notice.target}
                      onChange={(e) => setNotice({...notice, target: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner appearance-none"
                   >
                      <option value="all">Entire Ecosystem (Everyone)</option>
                      <option value="students">Students Only</option>
                      <option value="admins">Administrators Only</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">Message Payload</label>
                   <textarea 
                      required
                      value={notice.message}
                      onChange={(e) => setNotice({...notice, message: e.target.value})}
                      placeholder="Enter the critical announcement details..."
                      rows="4"
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner"
                   ></textarea>
                </div>
                <button 
                   disabled={publishing}
                   className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                   {publishing ? 'Broadcasting...' : 'Publish Globally'}
                </button>
             </form>
          </div>

          {/* Real-time Stats Column */}
          <div className="col-span-12 lg:col-span-5 space-y-8">
             <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl">
                <h3 className="text-xl font-bold mb-8">Ecosystem Vitality</h3>
                <div className="space-y-8">
                   <StatRow label="Active Students" value={stats.totalStudents} total={stats.totalStudents + 500} color="primary" />
                   <StatRow label="System Administrators" value={stats.totalAdmins} total={stats.totalAdmins + 20} color="secondary" />
                   <StatRow label="Pending Complaints" value={stats.pendingComplaints} total={100} color="error" inverse />
                </div>
             </div>

             <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
                <h3 className="text-xl font-bold mb-6">Financial Audit</h3>
                <div className="grid grid-cols-2 gap-8 mb-8">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unpaid Invoices</p>
                      <p className="text-2xl font-black text-error">{stats.activeBills}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Scale</p>
                      <p className="text-2xl font-black text-slate-900">{stats.totalBills} Bills</p>
                   </div>
                </div>
                <button className="w-full py-4 bg-slate-50 group-hover:bg-primary group-hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                   View Global Ledger
                </button>
             </div>
          </div>
        </div>

        {/* Audit Pipeline Summary */}
        <section className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-50">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-bold tracking-tight">Security & Governance Ledger</h3>
            <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Full Audit Access</button>
          </div>
          <div className="space-y-4">
            <AuditRow time="20:28:15" action="Ecosystem Stat Sync" target="Global-Cluster" status="success" />
            <AuditRow time="20:25:12" action="Permission Escalation" target="Admin #004" status="warning" />
            <AuditRow time="20:20:05" action="Bulk Database Index" target="Financial-Replica-1" status="success" />
          </div>
        </section>
      </main>
    </div>
  );
};

const StatRow = ({ label, value, total, color, inverse = false }) => {
   const percent = Math.min(100, (value / (total || 1)) * 100);
   return (
      <div className="space-y-2">
         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-400">{label}</span>
            <span className={inverse ? 'text-error' : 'text-primary'}>{value}</span>
         </div>
         <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
               className={`h-full rounded-full ${color === 'primary' ? 'bg-primary' : color === 'secondary' ? 'bg-secondary' : 'bg-error'}`} 
               style={{ width: `${percent}%` }}
            ></div>
         </div>
      </div>
   );
};

const AuditRow = ({ time, action, target, status }) => (
  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
    <div className="flex items-center gap-8">
      <p className="text-[10px] font-black font-mono text-slate-400">{time}</p>
      <div className="w-px h-6 bg-slate-200"></div>
      <div>
        <p className="font-bold text-slate-900">{action}</p>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Target: {target}</p>
      </div>
    </div>
    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status === 'success' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
      }`}>
      {status}
    </div>
  </div>
);

export default SuperAdminDashboard;
