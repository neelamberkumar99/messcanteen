import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { billingService } from '../../api/index';

const AdminPayments = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalCollection: 0,
    defaultRate: 0,
    overdueCount: 0,
    upiPercentage: 84 // Static placeholder as backend doesn't track method breakdown yet
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await billingService.getAllStudentBills().catch(e => ({}));
      const allBills = (res.bills || res.data?.bills) || [];
      setBills(allBills);
      
      // Calculate stats
      const totalCollection = allBills.filter(b => b.status === 'paid').reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
      const overdueCount = allBills.filter(b => b.status === 'overdue' || b.status === 'pending').length;
      const defaultRate = allBills.length > 0 ? ((overdueCount / allBills.length) * 100).toFixed(1) : 0;
      
      setStats(prev => ({
        ...prev,
        totalCollection,
        defaultRate,
        overdueCount
      }));
    } catch (err) {
      console.error('Error fetching global bills:', err);
      setError(err.message || 'Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="admin" />
      <GlobalHeader title="Revenue Orchestration" role="Admin" />

      <main className="ml-72 pt-24 px-8 pb-12">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Financial Governance</h2>
            <p className="text-on-surface-variant mt-2 text-lg">Overseeing global collections, settlement logic, and financial integrity.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={fetchData}
              className="bg-white px-8 py-4 rounded-2xl border border-slate-100 font-black text-[10px] uppercase tracking-widest text-slate-500 shadow-sm hover:bg-slate-50 transition-all"
            >
              Refresh Ledger
            </button>
            <button className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Settlement Hub</button>
          </div>
        </header>

        {/* Global Financial Bento Grid */}
        <div className="grid grid-cols-12 gap-8 mb-12">
          <div className="col-span-12 lg:col-span-8 bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl shadow-slate-900/20 relative overflow-hidden flex flex-col justify-between min-h-[320px]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Managed Collection</p>
                <h3 className="text-6xl font-black">₹ {stats.totalCollection.toLocaleString()}</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">System Status</p>
                <p className="text-2xl font-bold flex items-center justify-end gap-2 text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Active
                </p>
              </div>
            </div>
            <div className="relative z-10 pt-16">
              <div className="flex justify-between items-end mb-4 text-[10px] font-black uppercase tracking-widest">
                <span>Real-time Velocity</span>
                <span>Nominal</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[75%] rounded-full shadow-[0_0_20px_rgba(0,88,190,0.5)]"></div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Default Rate</p>
              <div>
                <h3 className="text-4xl font-black text-red-600">{stats.defaultRate}%</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">{stats.overdueCount} Records with overdue balances</p>
              </div>
            </div>
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:bg-primary transition-all">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white/60">Payment Method Mix</p>
              <div>
                <h3 className="text-4xl font-black text-slate-900 group-hover:text-white">{stats.upiPercentage}%</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 group-hover:text-white/60">Digital payment dominance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Collection Ledger */}
        <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="text-2xl font-bold tracking-tight">Financial Event Feed</h3>
            <div className="flex gap-4">
              <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary shadow-sm"><span className="material-symbols-outlined text-lg">filter_list</span></button>
            </div>
          </div>
          
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="animate-spin text-4xl text-primary">⏳</div>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-6 pl-10 text-[10px] font-black uppercase tracking-widest text-slate-400">Bill Ref</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Identity</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Month</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Hostel Node</th>
                  <th className="py-6 pr-10 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold divide-y divide-slate-50">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-20 text-center text-slate-400 font-bold italic">No financial events recorded.</td>
                  </tr>
                ) : (
                  bills.map((row) => (
                    <tr key={row._id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-6 pl-10 text-primary font-black uppercase tracking-widest text-[11px]">#{row._id.slice(-6).toUpperCase()}</td>
                      <td className="py-6 text-slate-900">{row.studentId?.userId?.name || 'Resident'}</td>
                      <td className="py-6 text-slate-900">₹{row.totalAmount}</td>
                      <td className="py-6 text-slate-500">{new Date(row.billingDate).toLocaleString('default', { month: 'long' })}</td>
                      <td className="py-6 text-slate-400 text-xs font-black uppercase tracking-widest">{row.studentId?.hostelId?.name || 'N/A'}</td>
                      <td className="py-6 pr-10 text-right">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          row.status === 'paid' ? 'bg-green-100 text-green-700' : 
                          row.status === 'overdue' ? 'bg-red-100 text-red-700' : 
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
          <div className="p-8 text-center bg-slate-50/30 border-t border-slate-50">
            <button 
              onClick={fetchData}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors"
            >
              Synchronize settlement engine
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminPayments;

