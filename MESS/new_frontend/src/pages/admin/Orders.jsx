import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { orderService } from '../../api/index';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    dailyVolume: 0,
    activeDeliveries: 0,
    avgFulfillmentTime: '12.4m'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await orderService.getAllOrders().catch(e => ({}));
      const allOrders = (res.orders || res.data?.orders) || [];
      setOrders(allOrders);
      
      // Calculate stats
      const today = new Date().setHours(0, 0, 0, 0);
      const dailyVolume = allOrders.filter(o => new Date(o.createdAt) >= today).length;
      const activeDeliveries = allOrders.filter(o => ['pending', 'preparing'].includes(o.status)).length;
      
      setStats(prev => ({
        ...prev,
        dailyVolume,
        activeDeliveries
      }));
    } catch (err) {
      console.error('Error fetching global orders:', err);
      setError(err.message || 'Failed to load system-wide logistics');
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
      <GlobalHeader title="System-Wide Logistics" role="Admin" />

      <main className="ml-72 pt-24 px-8 pb-12">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Global Fulfillment</h2>
            <p className="text-on-surface-variant mt-2 text-lg">Monitoring cross-platform transaction integrity and delivery velocity.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Status:</span>
              <span className="flex items-center gap-2 text-green-600 font-bold text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Nominal
              </span>
            </div>
            <button 
              onClick={fetchData}
              className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </header>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-900/10">
            <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest mb-4">Daily Volume</h3>
            <p className="text-5xl font-black">{stats.dailyVolume}</p>
            <p className="text-xs text-green-400 mt-4 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              System Nominal
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Avg. Fulfilment Time</h3>
            <p className="text-5xl font-black text-slate-900">{stats.avgFulfillmentTime}</p>
            <p className="text-xs text-slate-500 mt-4 font-bold uppercase tracking-widest">Across all nodes</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Active Deliveries</h3>
            <p className="text-5xl font-black text-primary">{stats.activeDeliveries}</p>
            <p className="text-xs text-slate-500 mt-4 font-bold uppercase tracking-widest">Real-time transit nodes</p>
          </div>
        </div>

        {/* Global Feed Table */}
        <section className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-50">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">Global Service Feed</h3>
            <div className="flex gap-2">
              <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-primary transition-all"><span className="material-symbols-outlined">filter_list</span></button>
              <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-primary transition-all"><span className="material-symbols-outlined">download</span></button>
            </div>
          </div>
          
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="animate-spin text-4xl text-primary">⏳</div>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-6 pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Master Ref</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Identity</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Vendor Node</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                  <th className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Status Node</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-slate-400 font-bold italic">No system transactions logged.</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="group hover:bg-slate-50/50 transition-colors border-t border-slate-50">
                      <td className="py-6 pl-8 font-black text-primary">#{order._id.slice(-6).toUpperCase()}</td>
                      <td className="py-6">
                        <div>
                          <p className="text-slate-900 font-bold">{order.studentId?.userId?.name || 'N/A'}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{order.studentId?.rollNumber || 'Resident'}</p>
                        </div>
                      </td>
                      <td className="py-6 text-slate-600">{order.canteenId?.name || 'Canteen Node'}</td>
                      <td className="py-6 font-black text-slate-900 text-right pr-8">₹{order.totalAmount}</td>
                      <td className="py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminOrders;

