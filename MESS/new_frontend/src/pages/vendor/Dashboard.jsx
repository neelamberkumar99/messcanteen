import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { adminService, dietService, orderService } from '../../api/index';
import { useAuth } from '../../context/AuthContext';

const VendorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeDiets: 0,
    mealStats: {},
    mealStatsTomorrow: {},
    totalOrdersToday: 0,
    revenueToday: 0
  });

  const [notifications, setNotifications] = useState([]);
  const [hostel, setHostel] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, notifRes, dietRes] = await Promise.all([
        adminService.getStats().catch(e => ({ data: { stats: {} } })),
        adminService.getNotificationLog().catch(e => ({ notifications: [] })),
        dietService.getVendorDietPlan().catch(e => ({ hostel: null }))
      ]);

      const statsData = statsRes.data?.stats || statsRes.stats || {};
      setStats(statsData);
      setNotifications(Array.isArray(notifRes.notifications) ? notifRes.notifications : []);
      setHostel(dietRes.hostel || statsRes.hostel || null);
    } catch (err) {
      console.error('Error fetching vendor stats:', err);
      setError('Failed to refresh dynamic dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="vendor" />
      <GlobalHeader title="Kitchen Command Center" role="Vendor" />

      <main className="ml-72 min-h-screen p-8 lg:p-12 pt-24">
        {/* Deeply Dynamic Header */}
        <header className="mb-12 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-sm animate-pulse">sensors</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Live Data Link Active • {hostel?.name || 'Authorized Hostel'}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Bonjour, {user?.name?.split(' ')[0] || 'Chef'}</h1>
            <p className="text-on-surface-variant mt-2 max-w-md">Real-time dietary orchestration and inventory intelligence.</p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all font-bold text-sm"
          >
            <span className={`material-symbols-outlined text-primary ${loading ? 'animate-spin' : ''}`}>sync</span>
            Force Refresh
          </button>
        </header>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            icon="group" 
            label="Hostel Strength" 
            value={stats.totalStudents || 0} 
            sub="Registered Students"
            color="primary" 
          />
          <StatCard 
            icon="check_circle" 
            label="Active Diets" 
            value={stats.activeDiets || 0} 
            sub="Opted-In Today"
            color="success" 
          />
          <StatCard 
            icon="payments" 
            label="Today's Revenue" 
            value={`₹${(stats.revenueToday || 0).toLocaleString()}`} 
            sub="Canteen Transactions"
            color="secondary" 
          />
          <StatCard 
            icon="shopping_cart" 
            label="Live Orders" 
            value={stats.totalOrdersToday || 0} 
            sub="Today's Fulfillment"
            color="tertiary" 
          />
        </div>

        {/* Dynamic Matrix Layout */}
        <div className="grid grid-cols-12 gap-8">
          {/* Live Headcount Matrix */}
          <section className="col-span-12 lg:col-span-8 bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-50">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">analytics</span>
                Live Headcount Orchestration
              </h2>
              <div className="flex gap-2">
                <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-full">TODAY</span>
                <span className="px-4 py-1.5 bg-slate-50 text-slate-400 text-[10px] font-black rounded-full uppercase">Tomorrow Forecast</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Object.entries(stats.mealStats || {}).length > 0 ? (
                Object.entries(stats.mealStats).map(([meal, count]) => (
                  <MealMetric 
                    key={meal} 
                    label={meal} 
                    count={count} 
                    tomorrow={stats.mealStatsTomorrow?.[meal] || 0} 
                  />
                ))
              ) : (
                <div className="col-span-3 py-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                  <p className="text-slate-400 font-bold">No diet components configured.</p>
                </div>
              )}
            </div>
            
            {/* Real-time Activity Feed */}
            <div className="mt-12 pt-10 border-t border-slate-50">
               <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary text-sm">notifications_active</span>
                 Recent Activity Stream
               </h3>
               <div className="space-y-4 max-h-64 overflow-y-auto no-scrollbar pr-2">
                 {notifications.length > 0 ? (
                   notifications.slice(0, 5).map((n, i) => (
                     <ActivityItem 
                       key={i}
                       title={n.title}
                       message={n.message}
                       time={new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       type={n.type}
                     />
                   ))
                 ) : (
                   <p className="text-slate-400 italic text-sm">No recent activity detected.</p>
                 )}
               </div>
            </div>
          </section>

          {/* Side Intelligence: Stock & Alerts */}
          <aside className="col-span-12 lg:col-span-4 space-y-8">
            {/* Stock Intelligence */}
            <div className="bg-surface-container-low p-8 rounded-[2.5rem]">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">inventory_2</span>
                Stock Intelligence
              </h3>
              <div className="space-y-6">
                <StockIndicator label="Basmati Rice" value="85%" status="optimal" />
                <StockIndicator label="Cooking Oil" value="12%" status="critical" />
                <StockIndicator label="Milk Supply" value={stats.activeDiets > 100 ? '45%' : '75%'} status={stats.activeDiets > 100 ? 'low' : 'optimal'} />
                <StockIndicator label="LPG Gas" value="62%" status="optimal" />
              </div>
              <button className="w-full mt-8 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all">
                Generate Procurement List
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
              <h3 className="text-xl font-bold mb-6">Vendor Operations</h3>
              <div className="grid grid-cols-2 gap-4">
                <QuickAction icon="qr_code_scanner" label="Scan POS" color="bg-primary" />
                <QuickAction icon="menu_book" label="Edit Menu" color="bg-secondary" />
                <QuickAction icon="warning" label="Report Issue" color="bg-error" />
                <QuickAction icon="settings" label="Settings" color="bg-white/10" />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, color }) => {
  const colors = {
    primary: 'text-primary bg-primary/10',
    success: 'text-green-600 bg-green-50',
    secondary: 'text-blue-600 bg-blue-50',
    tertiary: 'text-purple-600 bg-purple-50',
  };
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 hover:shadow-md transition-all group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${colors[color]}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-[10px]">{label}</h3>
      <p className="text-3xl font-black mt-1 text-slate-900">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>
    </div>
  );
};

const MealMetric = ({ label, count, tomorrow }) => (
  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-primary/20 transition-all">
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-4xl font-black text-slate-900">{count}</span>
      <span className="text-xs font-bold text-slate-400">Students</span>
    </div>
    <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center">
      <span className="text-[10px] font-bold text-slate-500">Tomorrow:</span>
      <span className="text-xs font-black text-primary">{tomorrow}</span>
    </div>
  </div>
);

const ActivityItem = ({ title, message, time, type }) => {
  const icons = {
    diet: { name: 'restaurant', color: 'bg-amber-100 text-amber-600' },
    order: { name: 'shopping_cart', color: 'bg-blue-100 text-blue-600' },
    payment: { name: 'payments', color: 'bg-green-100 text-green-600' },
    default: { name: 'info', color: 'bg-slate-100 text-slate-600' }
  };
  const icon = icons[type] || icons.default;
  return (
    <div className="flex gap-4 group">
      <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${icon.color}`}>
        <span className="material-symbols-outlined text-sm">{icon.name}</span>
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          <span className="text-[10px] font-bold text-slate-400">{time}</span>
        </div>
        <p className="text-xs text-slate-500 line-clamp-1 group-hover:line-clamp-none transition-all">{message}</p>
      </div>
    </div>
  );
};

const StockIndicator = ({ label, value, status }) => {
  const colors = {
    optimal: 'bg-green-500',
    low: 'bg-amber-500',
    critical: 'bg-red-500'
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <span className="text-xs font-black text-slate-900">{value}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${colors[status]} rounded-full`} style={{ width: value }}></div>
      </div>
    </div>
  );
};

const QuickAction = ({ icon, label, color }) => (
  <button className={`${color} p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg`}>
    <span className="material-symbols-outlined text-xl">{icon}</span>
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

export default VendorDashboard;
