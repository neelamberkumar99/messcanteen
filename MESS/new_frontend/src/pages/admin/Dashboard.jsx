import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { adminService } from '../../api/index';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingComplaints: 0,
    unpaidBills: 0,
    activeDiets: 0
  });
  const [reports, setReports] = useState({
    monthlyRevenue: 0,
    fineCollected: 0,
    pendingDues: 0,
    revenueByMonth: []
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const results = await Promise.all([
        adminService.getStats().catch(e => ({})),
        adminService.getReports().catch(e => ({})),
        adminService.getContractorRequests().catch(e => ({}))
      ]);

      const statsRes = results[0] || {};
      const reportsRes = results[1] || {};
      const requestsRes = results[2] || {};

      setStats((statsRes.stats || statsRes.data?.stats || statsRes.data) || {
        totalStudents: 0,
        pendingComplaints: 0,
        unpaidBills: 0,
        activeDiets: 0
      });

      setReports((reportsRes.reports || reportsRes.data?.reports || reportsRes.data) || {
        monthlyRevenue: 0,
        fineCollected: 0,
        pendingDues: 0,
        revenueByMonth: []
      });

      const reqArray = (requestsRes.requests || requestsRes.data?.requests) || [];
      setPendingRequests(Array.isArray(reqArray) ? reqArray.filter(r => r.status === 'pending' || r.status === 'Open') : []);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolveRequest = async (id) => {
    try {
      await adminService.resolveContractorRequest(id, 'resolved', 'Approved by master control');
      fetchData();
    } catch (err) {
      console.error('Error resolving request:', err);
      alert(err.message || 'Failed to resolve request');
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="admin" />
      <GlobalHeader title="System Oversight" role="Admin" />

      <main className="ml-72 pt-24 px-8 pb-12">
        {/* Hero Section */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Master Control</h2>
            <p className="text-on-surface-variant mt-2 text-lg">Centralized governance for campus-wide culinary logistics.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">health_and_safety</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Health</p>
                <p className="text-sm font-black text-slate-900">Optimal</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin text-4xl text-primary">⏳</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-3xl font-bold text-center">
            {error}
            <button onClick={fetchData} className="ml-4 underline">Retry</button>
          </div>
        ) : (
          /* Bento Grid */
          <div className="grid grid-cols-12 gap-8 mb-8">
            {/* Revenue Analytics */}
            <div className="col-span-12 lg:col-span-8 bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">Financial Velocity</h3>
                  <p className="text-slate-500 text-sm mt-1">Global transaction volume across all canteens.</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Month</button>
                </div>
              </div>
              
              <div className="flex items-end gap-12 h-48 mb-8">
                {reports.revenueByMonth && reports.revenueByMonth.length > 0 ? (
                  reports.revenueByMonth.slice(-7).map((monthData, i) => {
                    const maxRev = Math.max(...reports.revenueByMonth.map(m => m.revenue), 1);
                    const height = (monthData.revenue / maxRev) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-4">
                        <div className="w-full bg-slate-50 rounded-full h-full relative overflow-hidden">
                          <div 
                            className={`absolute bottom-0 left-0 w-full rounded-full transition-all duration-1000 bg-primary`} 
                            style={{ height: `${height}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">M{monthData._id.month}</span>
                      </div>
                    );
                  })
                ) : (
                  [45, 65, 42, 85, 95, 75, 88].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4">
                      <div className="w-full bg-slate-50 rounded-full h-full relative overflow-hidden">
                        <div 
                          className={`absolute bottom-0 left-0 w-full rounded-full transition-all duration-1000 ${i === 6 ? 'bg-primary' : 'bg-slate-300'}`} 
                          style={{ height: `${height}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                    </div>
                  ))
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-50">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Revenue</p>
                  <p className="text-2xl font-black text-slate-900">₹{reports.monthlyRevenue}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fine Collected</p>
                  <p className="text-2xl font-black text-slate-900">₹{reports.fineCollected}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Dues</p>
                  <p className="text-2xl font-black text-primary">₹{reports.pendingDues}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Tasks */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-900/20">
                <h3 className="text-lg font-bold mb-6">Vendor Requests</h3>
                <div className="space-y-4 max-h-[250px] overflow-y-auto no-scrollbar">
                  {pendingRequests.length === 0 ? (
                    <p className="text-slate-500 text-sm italic">No pending requests</p>
                  ) : (
                    pendingRequests.map(req => (
                      <ApprovalTask 
                        key={req._id} 
                        label={req.title} 
                        sub={req.contractorId?.name || 'Contractor'} 
                        onClick={() => handleResolveRequest(req._id)}
                      />
                    ))
                  )}
                </div>
                <button className="w-full mt-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all">
                  View All Requests
                </button>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold mb-6">System Load</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Diets</span>
                      <span className="text-[10px] font-black text-primary">{stats.activeDiets}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-3/4 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Students</span>
                      <span className="text-[10px] font-black text-primary">{stats.totalStudents}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-full rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Canteen Health Monitors */}
        <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-50">
          <h3 className="text-2xl font-bold tracking-tight mb-8">System Health Pulse</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CanteenStatusCard name="Total Students" load="Optimal" orders={stats.totalStudents} status="optimal" icon="groups" />
            <CanteenStatusCard name="Pending Bills" load="Warning" orders={stats.unpaidBills} status="heavy" icon="receipt_long" />
            <CanteenStatusCard name="Open Complaints" load="Moderate" orders={stats.pendingComplaints} status="optimal" icon="feedback" />
          </div>
        </section>
      </main>
    </div>
  );
};

const ApprovalTask = ({ label, sub, onClick }) => (
  <div 
    onClick={onClick}
    className="flex items-center justify-between p-4 bg-white/5 rounded-2xl group hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/10"
  >
    <div>
      <p className="text-xs font-bold leading-none">{label}</p>
      <p className="text-[10px] opacity-70 mt-1">{sub}</p>
    </div>
    <span className="material-symbols-outlined text-sm opacity-50 group-hover:opacity-100 transition-opacity">chevron_right</span>
  </div>
);

const CanteenStatusCard = ({ name, load, orders, status, icon }) => (
  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-lg transition-all">
    <div className="flex justify-between items-start mb-6">
      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
        status === 'optimal' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
      }`}>
        {load}
      </span>
    </div>
    <h4 className="font-bold text-slate-900 mb-4">{name}</h4>
    <div className="grid grid-cols-1 gap-4">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Count</p>
        <p className="text-2xl font-black text-slate-900">{orders}</p>
      </div>
    </div>
  </div>
);

export default AdminDashboard;
