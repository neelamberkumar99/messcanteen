import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { orderService, adminService, dietService } from '../../api/index';

const VendorDashboard = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingCount: 0,
    approvedCount: 0,
    topSellers: []
  });
  const [dietStats, setDietStats] = useState({
    totalStudents: 0,
    totalDietOn: 0,
    activeDiets: 0,
    mealStats: {},
    mealStatsTomorrow: {}
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const results = await Promise.all([
        orderService.getPendingOrders().catch(e => ({})),
        orderService.getOrderSummary().catch(e => ({})),
        adminService.getStats().catch(e => ({})),
        adminService.getNotificationLog().catch(e => ({}))
      ]);
      
      const ordersRes = results[0] || {};
      const summaryRes = results[1] || {};
      const statsRes = results[2] || {};
      const notifRes = results[3] || {};
      
      const ordersArray = (ordersRes.orders || ordersRes.data?.orders || ordersRes.data) || [];
      setPendingOrders(Array.isArray(ordersArray) ? ordersArray : []);
      setSummary((summaryRes.summary || summaryRes.data?.summary || summaryRes.data) || {
        totalOrders: 0,
        totalRevenue: 0,
        pendingCount: 0,
        approvedCount: 0,
        topSellers: []
      });

      const stats = (statsRes.stats || statsRes.data?.stats) || {};
      const hostelInfo = statsRes.hostel || statsRes.data?.hostel || {};
      setDietStats({
        hostelName: hostelInfo.name || '',
        totalStudents: stats.totalStudents || 0,
        totalDietOn: stats.totalDietOn || 0,
        activeDiets: stats.activeDiets || 0,
        mealStats: stats.mealStats || {},
        mealStatsTomorrow: stats.mealStatsTomorrow || {}
      });
      setNotifications(notifRes.notifications || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id) => {
    try {
      await orderService.approveOrder(id);
      fetchData();
    } catch (err) {
      console.error('Error approving order:', err);
      alert(err.message || 'Failed to approve order');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection:');
    if (reason === null) return;
    
    try {
      await orderService.rejectOrder(id, reason);
      fetchData();
    } catch (err) {
      console.error('Error rejecting order:', err);
      alert(err.message || 'Failed to reject order');
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="vendor" />
      <GlobalHeader title="Kitchen Orchestration" role="Vendor" />

      <main className="ml-72 pt-24 px-8 pb-12">
        {/* Hero Section */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-sm">location_on</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {dietStats.hostelName || 'Verifying Hostel...'}
              </span>
            </div>
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Kitchen Command</h2>
            <p className="text-on-surface-variant mt-2 text-lg">Real-time oversight of your culinary operations and delivery flow.</p>
          </div>
          <div className="bg-primary/5 px-6 py-4 rounded-[2rem] border border-primary/10 flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Active Orders</span>
              <span className="text-2xl font-black text-primary">{summary.pendingCount} Units</span>
            </div>
            <div className="w-px h-10 bg-primary/10"></div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Today's Rev.</span>
              <span className="text-2xl font-black text-secondary">₹{summary.totalRevenue}</span>
            </div>
          </div>
        </div>

        {/* Dietary Preference Cards - Today */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-2 h-8 bg-primary rounded-full"></div>
          <h3 className="text-xl font-bold tracking-tight">Today's Meal Headcount</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <DietPlanCard title="Total Students" count={`${dietStats.totalStudents} Units`} status="Hostel Census" />
          <DietPlanCard title="Diets Currently ON" count={`${dietStats.totalDietOn} Students`} status="Global Status" />
          {Object.entries(dietStats.mealStats || {}).map(([meal, count]) => (
            <DietPlanCard key={meal} title={meal} count={`${count} Diets`} status="Live Headcount" />
          ))}
        </div>

        {loading && pendingOrders.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin text-4xl text-primary">⏳</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-3xl font-bold text-center">
            {error}
            <button onClick={fetchData} className="ml-4 underline">Retry</button>
          </div>
        ) : (
          /* Bento Grid Layout */
          <div className="grid grid-cols-12 gap-8 mb-8">
            {/* Live Order Queue */}
            <div className="col-span-12 lg:col-span-8 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold tracking-tight">Live Order Queue</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">{summary.approvedCount} Fulfilled</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase">{pendingOrders.length} Pending</span>
                </div>
              </div>
              <div className="space-y-4">
                {pendingOrders.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 font-bold border-2 border-dashed border-slate-50 rounded-3xl">
                    No pending orders in the queue.
                  </div>
                ) : (
                  pendingOrders.map(order => (
                    <OrderQueueItem 
                      key={order._id} 
                      id={`#${order._id.slice(-4).toUpperCase()}`} 
                      name={order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')} 
                      time={new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                      student={order.studentId?.userId?.name || 'Student'}
                      status="pending"
                      onApprove={() => handleApprove(order._id)}
                      onReject={() => handleReject(order._id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Activity Ledger Sidebar */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-fit">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">notifications_active</span>
                  </div>
                  <h3 className="text-lg font-bold">Dietary Activity</h3>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {notifications.length === 0 ? (
                    <p className="text-slate-400 text-xs italic p-4 bg-slate-50 rounded-2xl">No recent diet updates.</p>
                  ) : (
                    notifications.map((notif, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[11px] font-bold text-slate-700 leading-relaxed mb-1">{notif.message}</p>
                        <p className="text-[9px] text-slate-400">{new Date(notif.createdAt).toLocaleTimeString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold mb-6">Top Sellers Today</h3>
                <div className="space-y-6">
                  {summary.topSellers && summary.topSellers.length > 0 ? (
                    summary.topSellers.map((item, idx) => (
                      <TopSellerItem key={idx} name={item.name} price={`₹${item.price}`} count={`${item.totalSold} sold`} />
                    ))
                  ) : (
                    <p className="text-slate-400 text-sm italic">No data yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Quick Glance */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold tracking-tight">Stock Intelligence</h3>
            <button className="text-primary font-bold text-sm hover:underline">Manage Inventory</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StockIndicator label="Basmati Rice" value="85%" status="optimal" />
            <StockIndicator label="Cooking Oil" value="12%" status="critical" />
            <StockIndicator label="Vegetables" value="45%" status="low" />
            <StockIndicator label="Spices Mix" value="92%" status="optimal" />
          </div>
        </section>
      </main>
    </div>
  );
};

const OrderQueueItem = ({ id, name, time, student, status, onApprove, onReject }) => (
  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
    <div className="flex items-center gap-4">
      <div className={`w-2 h-10 rounded-full ${status === 'ready' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{id} • {student} • {time}</p>
        <p className="font-bold text-slate-900 line-clamp-1">{name}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <button 
        onClick={onApprove}
        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
      >
        APPROVE
      </button>
      <button 
        onClick={onReject}
        className="p-2 text-slate-300 hover:text-error transition-all"
        title="Reject Order"
      >
        <span className="material-symbols-outlined text-lg">cancel</span>
      </button>
    </div>
  </div>
);

const TopSellerItem = ({ name, price, count }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
        <span className="material-symbols-outlined text-primary text-sm">restaurant</span>
      </div>
      <div>
        <p className="font-bold text-slate-900 leading-none">{name}</p>
        <p className="text-[10px] text-slate-500 mt-1">{price}</p>
      </div>
    </div>
    <span className="text-xs font-black text-primary">{count}</span>
  </div>
);

const StockIndicator = ({ label, value, status }) => (
  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-50">
    <div className="flex justify-between items-center mb-3">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <span className={`w-2 h-2 rounded-full ${status === 'optimal' ? 'bg-green-500' : status === 'low' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
    </div>
    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full ${status === 'optimal' ? 'bg-green-500' : status === 'low' ? 'bg-amber-500' : 'bg-red-500'}`}
        style={{ width: value }}
      ></div>
    </div>
    <p className="text-sm font-black mt-2 text-slate-900">{value}</p>
  </div>
);

const DietPlanCard = ({ title, count, status }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{status}</p>
    <h3 className="text-xl font-black text-slate-900">{title}</h3>
    <p className="text-sm font-bold text-primary mt-1">{count}</p>
  </div>
);

export default VendorDashboard;
