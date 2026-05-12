import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { billingService } from '../../api/index';

const StudentBill = () => {
  const [bill, setBill] = useState(null);
  const [history, setHistory] = useState([]);
  const [dailyDues, setDailyDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch bill and history on component mount
  useEffect(() => {
    const fetchBillData = async () => {
      try {
        setLoading(true);
        const [billRes, historyRes, breakdownRes] = await Promise.all([
          billingService.getLiveBill(),
          billingService.getBillHistory(),
          billingService.getDailyBreakdown()
        ]);
        setBill(billRes.data || billRes);
        setHistory(historyRes.bills || []);
        setDailyDues(breakdownRes.data || []);
      } catch (err) {
        console.error('Error fetching bill:', err);
        setError(err.message || 'Failed to load bill data');
      } finally {
        setLoading(false);
      }
    };

    fetchBillData();
  }, []);

  const handlePayment = async () => {
    alert('Online payment gateway integration coming soon. For now, please pay at the warden office.');
  };

  const transactions = history.filter(h => h.status === 'paid') || [];

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="student" />
      <GlobalHeader title="Financial Ledger" role="Student" />

      <main className="ml-72 pt-24 px-8 pb-12">
        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p className="text-slate-500 font-bold">Loading your bill...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Page Header */}
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Monthly Financial Record</h2>
                <p className="text-on-surface-variant mt-2 text-lg">Detailed breakdown of your mess and canteen charges for the current cycle.</p>
              </div>
              <button 
                className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                onClick={handlePayment}
              >
                <span className="material-symbols-outlined text-lg">payments</span>
                Pay Current Due
              </button>
            </div>

            {/* Summary Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <SummaryCard icon="payments" label="Total Accrued" sub="Current Cycle" value={`₹${(bill?.total || 0).toFixed(2)}`} color="primary" />
              <SummaryCard icon="restaurant_menu" label="Diet Total" value={`₹${(bill?.diet?.dietCharges || 0).toFixed(2)}`} color="secondary" />
              <SummaryCard icon="shopping_cart" label="Canteen Total" value={`₹${(bill?.canteen?.canteenCharges || 0).toFixed(2)}`} color="tertiary" />
              <SummaryCard icon="report_problem" label="Overdue Fines" value={`₹${(bill?.fines || 0).toFixed(2)}`} color="error" />
            </div>

            <div className="grid grid-cols-12 gap-10">
              {/* Main Content Column */}
              <div className="col-span-12 lg:col-span-8 space-y-10">
                {/* Table Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900">Daily Charge Breakdown</h3>
                  <div className="flex gap-2">
                     <span className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-400">Current Month</span>
                  </div>
                </div>

                {/* Daily Dues Table */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Diet</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Canteen</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Fine</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {dailyDues.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-8 py-12 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-20">
                              <span className="material-symbols-outlined text-6xl">receipt_long</span>
                              <p className="text-slate-400 font-bold uppercase tracking-widest">No charges recorded yet this month</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        dailyDues.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6 text-sm font-bold text-slate-900">
                              {row.isAdjustment ? (
                                <span className="text-primary flex items-center gap-2">
                                  <span className="material-symbols-outlined text-xs">info</span>
                                  {row.label}
                                </span>
                              ) : (
                                new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              )}
                            </td>
                            <td className="px-8 py-6 text-sm font-medium text-slate-600 text-right">₹{(row.diet || 0).toFixed(2)}</td>
                            <td className="px-8 py-6 text-sm font-medium text-slate-600 text-right">₹{(row.canteen || 0).toFixed(2)}</td>
                            <td className="px-8 py-6 text-sm font-bold text-red-600 text-right">₹{(row.fine || 0).toFixed(2)}</td>
                            <td className="px-8 py-6 text-sm font-black text-slate-900 text-right">₹{(row.total || 0).toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Monthly Bill History Section */}
                <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <h3 className="text-xl font-bold tracking-tight">Settled Monthly Bills</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Bill Period</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Accrued Amount</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Paid Amount</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {history.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest opacity-30">
                              No historical records found
                            </td>
                          </tr>
                        ) : (
                          history.map((bill, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-8 py-6 text-sm font-bold text-slate-900">
                                {new Date(bill.year, bill.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                              </td>
                              <td className="px-8 py-6 text-sm font-black text-slate-900 text-right">₹{(bill.totalAmount || 0).toFixed(2)}</td>
                              <td className="px-8 py-6 text-sm font-black text-green-600 text-right">₹{(bill.paidAmount || 0).toFixed(2)}</td>
                              <td className="px-8 py-6 text-right">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  bill.status === 'paid' ? 'bg-green-100 text-green-700' : 
                                  bill.status === 'unpaid' ? 'bg-amber-100 text-amber-700' : 
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {bill.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* Sidebar Column */}
              <div className="col-span-12 lg:col-span-4 space-y-10">
                {/* Fine Logic Breakdown */}
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
                  <div className="flex items-center gap-4 mb-8 text-slate-900">
                    <div className="p-3 bg-slate-50 rounded-2xl">
                      <span className="material-symbols-outlined text-2xl font-black">policy</span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">Billing Policy</h3>
                  </div>
                  <div className="space-y-6">
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Bills are generated on the <span className="text-slate-900 font-bold">1st of every month</span> for the preceding cycle. All canteen and mess charges are consolidated into a single post-paid invoice.
                    </p>
                    <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                       <div className="flex justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-400">Grace Period</span>
                          <span className="text-[10px] font-black uppercase text-slate-900">7 Days</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-400">Late Fee</span>
                          <span className="text-[10px] font-black uppercase text-slate-900">₹10 / Day</span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Offline Payment Info */}
                <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-900/10">
                  <h4 className="text-xl font-bold mb-4">Payment Methods</h4>
                  <p className="text-sm text-slate-400 mb-8 font-medium leading-relaxed">
                    We support both online and offline settlements. For cash or cheque payments, please visit the hostel accounts office between 10 AM and 4 PM.
                  </p>
                  <div className="flex items-center gap-3 text-primary">
                     <span className="material-symbols-outlined">call</span>
                     <span className="text-xs font-black uppercase tracking-widest">+91 98765 43210</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Download FAB */}
      <button className="fixed bottom-10 right-10 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all z-50 group">
        <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">download</span>
      </button>
    </div>
  );
};

const SummaryCard = ({ icon, label, sub, value, color }) => (
  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
    <div className="flex items-center justify-between mb-8">
      <div className={`w-12 h-12 bg-${color}/10 rounded-2xl flex items-center justify-center text-${color} group-hover:bg-${color} group-hover:text-white transition-all`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    <div>
      {sub && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{sub}</p>}
      <h3 className="text-3xl font-black text-slate-900">{value}</h3>
    </div>
  </div>
);

export default StudentBill;
