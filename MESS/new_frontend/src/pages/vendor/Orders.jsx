import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { orderService } from '../../api/index';

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All Active');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await orderService.getPendingOrders().catch(e => ({}));
      const ordersArray = (res.orders || res.data?.orders) || [];
      setOrders(Array.isArray(ordersArray) ? ordersArray : []);
    } catch (err) {
      console.error('Error fetching vendor orders:', err);
      setError(err.message || 'Failed to load order stream');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      // Note: This endpoint may not exist in backend yet
      // For now, use approveOrder for pending orders
      if (newStatus === 'approved') {
        await orderService.approveOrder(id);
      } else if (newStatus === 'rejected') {
        await orderService.rejectOrder(id, 'Status updated');
      }
      fetchData();
    } catch (err) {
      console.error('Error updating order status:', err);
      alert(err.message || 'Failed to update order status');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'All Active') return ['pending', 'preparing', 'ready'].includes(order.status);
    if (filter === 'Preparation') return order.status === 'preparing';
    if (filter === 'Ready for Pickup') return order.status === 'ready';
    if (filter === 'Completed') return order.status === 'completed';
    if (filter === 'Canceled') return order.status === 'cancelled';
    return true;
  });

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="vendor" />
      <GlobalHeader title="Order Management" role="Vendor" />

      <main className="ml-72 pt-24 px-8 pb-12">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Order Stream</h2>
            <p className="text-on-surface-variant mt-2 text-lg">Managing the flow of gourmet experiences across all service points.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={fetchData}
              className="bg-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 border border-slate-100 hover:bg-slate-50 shadow-sm transition-all"
            >
              Refresh Feed
            </button>
            <button className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Live Queue</button>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="bg-white p-2 rounded-[1.5rem] border border-slate-100 flex items-center gap-2 mb-10 w-max shadow-sm">
          {['All Active', 'Preparation', 'Ready for Pickup', 'Completed', 'Canceled'].map((f) => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <section className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-slate-100">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="text-2xl font-bold tracking-tight">Active Fulfillment Loop</h3>
            <span className="px-6 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10">Live Stream</span>
          </div>
          
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="animate-spin text-4xl text-primary">⏳</div>
            </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-6 pl-10 text-[10px] font-black uppercase tracking-widest text-slate-400">Order Ref</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Culinary Item</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Guest Name</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="py-6 pr-10 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Governance</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-20 text-center text-slate-400 font-bold italic">No orders found in this category.</td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="group hover:bg-slate-50/50 transition-colors border-t border-slate-50">
                      <td className="py-7 pl-10 font-black text-primary uppercase tracking-widest text-xs">#{order._id.slice(-6).toUpperCase()}</td>
                      <td className="py-7">
                        <p className="font-bold text-slate-900">{(order.items || []).map(i => i.name).join(', ') || 'Item'}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Canteen Node</p>
                      </td>
                      <td className="py-7 text-right font-black text-slate-900 pr-10">₹{order.totalAmount}</td>
                      <td className="py-7">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-500">{(order.studentId?.userId?.name || 'S')[0]}</div>
                          <div>
                            <p className="font-bold text-slate-900 leading-none">{order.studentId?.userId?.name || 'N/A'}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-7">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          order.status === 'ready' ? 'bg-green-100 text-green-700 border-green-200' : 
                          order.status === 'preparing' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                          order.status === 'completed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-7 pr-10 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.status === 'pending' && (
                            <button 
                              onClick={() => handleUpdateStatus(order._id, 'preparing')}
                              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-slate-900/10"
                            >
                              Approve
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button 
                              onClick={() => handleUpdateStatus(order._id, 'ready')}
                              className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
                            >
                              Mark Ready
                            </button>
                          )}
                          {order.status === 'ready' && (
                            <button 
                              onClick={() => handleUpdateStatus(order._id, 'completed')}
                              className="px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-green-500/20"
                            >
                              Complete
                            </button>
                          )}
                          <button className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm">
                            <span className="material-symbols-outlined text-lg">more_horiz</span>
                          </button>
                        </div>
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

export default VendorOrders;

