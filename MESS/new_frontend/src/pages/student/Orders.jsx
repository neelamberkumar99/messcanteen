import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { orderService } from '../../api/index';

const StudentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await orderService.getMyOrders();
        setOrders(response.orders || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Get the most recent active order
  const activeOrder = orders.find(o => o.status === 'pending' || o.status === 'in-prep' || o.status === 'ready');
  const completedOrders = orders.filter(o => o.status === 'fulfilled' || o.status === 'delivered' || o.status === 'completed');

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending':
      case 'in-prep':
        return { badge: 'bg-amber-100 text-amber-700', progress: 'w-1/3' };
      case 'ready':
        return { badge: 'bg-blue-100 text-blue-700', progress: 'w-2/3' };
      case 'fulfilled':
      case 'delivered':
      case 'completed':
        return { badge: 'bg-green-100 text-green-700', progress: 'w-full' };
      default:
        return { badge: 'bg-slate-100 text-slate-700', progress: 'w-1/4' };
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="student" />
      <GlobalHeader title="My Orders" role="Student" />

      <main className="ml-72 pt-24 px-8 pb-12">
        <header className="mb-10">
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Order Portfolio</h2>
          <p className="text-on-surface-variant mt-2 text-lg">Real-time tracking of your active culinary requests and transaction history.</p>
        </header>

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
              <p className="text-slate-500 font-bold">Loading your orders...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Active Order Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {activeOrder ? (
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <div>
                      <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${getStatusColor(activeOrder.status).badge}`}>
                        {activeOrder.status || 'In Progress'}
                      </span>
                      <h3 className="text-2xl font-bold mt-4">{activeOrder.items?.[0]?.itemId?.name || 'Your Order'}</h3>
                      <p className="text-slate-400 text-sm mt-1">Order #{activeOrder._id || activeOrder.id}</p>
                    </div>
                    <p className="text-3xl font-black text-primary">₹{(activeOrder.totalAmount || 0).toFixed(2)}</p>
                  </div>
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                      <span>Preparation Progress</span>
                      <span>Est. 5m</span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div className={`h-full bg-primary rounded-full animate-pulse ${getStatusColor(activeOrder.status).progress}`}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center justify-center">
                  <p className="text-slate-400 text-center">No active orders at the moment</p>
                </div>
              )}

              <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-xl shadow-slate-900/10 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Order Statistics</h3>
                  <p className="text-sm opacity-60">You have {orders.length} total orders on record.</p>
                </div>
                <div className="flex items-center gap-4 mt-8">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">receipt</span>
                  </div>
                  <p className="text-xs font-bold leading-relaxed">{completedOrders.length} orders completed successfully.</p>
                </div>
              </div>
            </div>

            {/* Order History */}
            <section className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-50">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-2xl font-bold tracking-tight">Recent Transactions</h3>
                <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {orders.length} Orders
                </span>
              </div>
              
              {orders.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 block">shopping_bag</span>
                  <p className="text-slate-400 font-bold">No orders yet. Start by placing an order from the canteen!</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="py-6 pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Order ID</th>
                      <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Items</th>
                      <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                      <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                      <th className="py-6 pr-8 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {orders.map((order) => (
                      <tr key={order._id || order.id} className="group hover:bg-slate-50 transition-colors border-t border-slate-50">
                        <td className="py-6 pl-8 font-black text-primary">#{order._id?.slice(-6) || order.id}</td>
                        <td className="py-6 font-bold text-slate-900">
                          <div className="flex flex-col gap-1">
                            {order.items?.map((i, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-slate-600">{i.itemId?.name || 'Item'}</span>
                                <span className="text-[10px] text-slate-400 font-normal">({i.quantity}x ₹{i.price})</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-6 font-black text-slate-900">₹{(order.totalAmount || 0).toFixed(2)}</td>
                        <td className="py-6 text-slate-500 font-medium">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="py-6 pr-8 text-right">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            order.status?.toLowerCase() === 'fulfilled' || order.status?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-700' : 
                            order.status?.toLowerCase() === 'ready' ? 'bg-blue-100 text-blue-700' : 
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {order.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default StudentOrders;
