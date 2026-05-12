import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { billingService, dietService, orderService } from '../../api/index';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(0);
  const [bill, setBill] = useState(null);
  const [dietPlan, setDietPlan] = useState(null);
  const [hostel, setHostel] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  const [dietStatus, setDietStatus] = useState({ active: true });

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const results = await Promise.all([
          billingService.getLiveBill().catch(e => ({})),
          dietService.getDietPlan().catch(e => ({})),
          orderService.getMyOrders().catch(e => ({})),
          dietService.getDietStatus().catch(e => ({}))
        ]);

        const billRes = results[0] || {};
        const dietRes = results[1] || {};
        const ordersRes = results[2] || {};
        const statusRes = results[3] || {};

        const billData = billRes.data || billRes || { total: 0 };
        const dietData = (dietRes.plan || dietRes.data?.plan) || [];
        const hostelData = dietRes.hostel || dietRes.data?.hostel || null;
        const ordersData = (ordersRes.orders || ordersRes.data?.orders || ordersRes.data) || [];
        const statusData = statusRes.data || { status: true, mealsOff: [] };
        // Map backend 'status' to frontend 'active' for compatibility if needed, or just use status
        statusData.active = statusData.status;

        setBill(billData);
        setBalance(billData?.total || 0);
        setDietPlan(Array.isArray(dietData) ? dietData : []);
        setHostel(hostelData);
        setRecentOrders(Array.isArray(ordersData) ? ordersData.slice(0, 5) : []);
        setDietStatus(statusData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleMealToggle = async (mealName, date = null) => {
    try {
      setLoading(true);
      await dietService.toggleMeal(mealName, date);
      alert(`Preference for ${mealName} updated.`);
      // Refresh status
      const statusRes = await dietService.getDietStatus();
      const statusData = statusRes.data || { status: true, mealsOff: [], tomorrow: { status: true, mealsOff: [] } };
      statusData.active = statusData.status;
      setDietStatus(statusData);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to toggle meal');
    } finally {
      setLoading(false);
    }
  };

  const handleDietToggle = async () => {
    try {
      setLoading(true);
      if (dietStatus.active) {
        await dietService.toggleDietOff();
        alert('Diet turned OFF for today. Notification sent to vendor.');
      } else {
        await dietService.toggleDietOn();
        alert('Diet turned ON for today.');
      }
      // Refresh status
      const statusRes = await dietService.getDietStatus();
      const statusData = statusRes.data || { status: true, mealsOff: [] };
      statusData.active = statusData.status;
      setDietStatus(statusData);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to toggle diet');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get today's meals from the diet plan
  const getDayMeals = (offset = 0) => {
    if (!dietPlan || !Array.isArray(dietPlan)) return null;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + offset);
    const dayName = days[targetDate.getDay()];
    return dietPlan.find(d => d.day === dayName) || null;
  };

  const todayMeals = getDayMeals(0);
  const tomorrowMeals = getDayMeals(1);

  const getMealStatus = (mealTime) => {
    if (!dietStatus.active) return 'off';
    
    const now = new Date();
    const [hours, minutes] = (mealTime || '00:00').split(':').map(Number);
    const mealDate = new Date();
    mealDate.setHours(hours, minutes, 0, 0);

    const diffInMinutes = (now - mealDate) / (1000 * 60);

    if (diffInMinutes > 60) return 'served'; // More than an hour ago
    if (diffInMinutes >= -30 && diffInMinutes <= 60) return 'active'; // Within window
    return 'locked'; // Future
  };


  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="student" />
      
      <GlobalHeader role="Student" />

      {/* Main Content Canvas */}
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
              <p className="text-slate-500 font-bold">Loading your dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Metrics Header */}
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Bonjour, {user?.name?.split(' ')[0] || 'Student'}.</h2>
                <p className="text-on-surface-variant mt-2 text-lg">Your culinary journey for today is perfectly orchestrated.</p>
              </div>
              <div className="bg-surface-container-low px-6 py-3 rounded-2xl flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Amount Due</span>
                  <span className="text-2xl font-black text-primary">₹{(balance || 0).toFixed(2)}</span>
                </div>
                <button className="bg-white p-2 rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>

            {/* Bento Layout: Spending & Meal Status */}
            <div className="grid grid-cols-12 gap-6 mb-8">
              {/* Spending Cards Group */}
              <div className="col-span-12 lg:col-span-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <MetricCard icon="analytics" label="Monthly Total" value={`₹${(bill?.total || 0).toFixed(2)}`} color="primary" />
                  <MetricCard icon="restaurant_menu" label="Diet Total" value={`₹${(bill?.diet?.dietCharges || 0).toFixed(2)}`} color="tertiary" />
                  <MetricCard icon="shopping_bag" label="Canteen Total" value={`₹${(bill?.canteen?.canteenCharges || 0).toFixed(2)}`} color="secondary" />
                </div>

                {/* Menu Scroller Section */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold tracking-tight">This Week's Menu</h3>
                    <div className="flex gap-2">
                      <button className="p-2 bg-white rounded-full text-slate-400 hover:text-primary"><span className="material-symbols-outlined">chevron_left</span></button>
                      <button className="p-2 bg-white rounded-full text-slate-400 hover:text-primary"><span className="material-symbols-outlined">chevron_right</span></button>
                    </div>
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                    {dietPlan && dietPlan.length > 0 ? (
                      dietPlan.map((dayData, idx) => (
                        <MenuDayCard 
                          key={idx}
                          day={dayData.day} 
                          date={""}
                          meals={hostel?.dietComponents?.map(c => ({
                            name: (dayData.meals instanceof Map ? dayData.meals.get(c.name) : dayData.meals?.[c.name]) || 'N/A',
                            label: c.name
                          })) || []} 
                          active={dayData.day === (['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()])}
                        />
                      ))
                    ) : (
                      <div className="p-10 bg-surface-container-lowest rounded-3xl w-full text-center text-slate-400 font-medium">
                        No diet plan available for your hostel yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dietary Orchestration: Today & Tomorrow */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                {/* Today */}
                <div className="bg-surface-container-low p-8 rounded-[2.5rem]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">schedule</span>
                      Today's Orchestration
                    </h3>
                  </div>
                  <div className="space-y-6">
                    {todayMeals && hostel?.dietComponents ? (
                      hostel.dietComponents.map((comp, idx) => {
                        const isMealOff = dietStatus.mealsOff?.includes(comp.name);
                        return (
                          <TimelineStep 
                            key={idx}
                            status={getMealStatus(comp.time || "08:00")} 
                            time={comp.time || "08:00"} 
                            label={comp.name} 
                            sub={(todayMeals.meals instanceof Map ? todayMeals.meals.get(comp.name) : todayMeals.meals?.[comp.name]) || 'N/A'} 
                            onToggle={() => handleMealToggle(comp.name)}
                            isActive={!isMealOff && dietStatus.active}
                          />
                        );
                      })
                    ) : (
                      <p className="text-slate-400 text-sm italic">No meals scheduled for today.</p>
                    )}
                  </div>
                </div>

                {/* Tomorrow */}
                <div className="bg-surface-container-low p-8 rounded-[2.5rem]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-500">
                      <span className="material-symbols-outlined">next_plan</span>
                      Tomorrow's Forecast
                    </h3>
                  </div>
                  <div className="space-y-6">
                    {tomorrowMeals && hostel?.dietComponents ? (
                      hostel.dietComponents.map((comp, idx) => {
                        const isMealOff = dietStatus.tomorrow?.mealsOff?.includes(comp.name);
                        const tomorrowDate = new Date();
                        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                        return (
                          <TimelineStep 
                            key={idx}
                            status="locked" // Always locked/future for tomorrow
                            time={comp.time || "08:00"} 
                            label={comp.name} 
                            sub={(tomorrowMeals.meals instanceof Map ? tomorrowMeals.meals.get(comp.name) : tomorrowMeals.meals?.[comp.name]) || 'N/A'} 
                            onToggle={() => handleMealToggle(comp.name, tomorrowDate.toISOString())}
                            isActive={!isMealOff && dietStatus.tomorrow?.status}
                          />
                        );
                      })
                    ) : (
                      <p className="text-slate-400 text-sm italic">No meals scheduled for tomorrow.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Canteen Orders Table */}
            <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold tracking-tight">Recent Culinary Orders</h3>
                <button className="text-primary font-bold text-sm hover:underline">View Transaction Ledger</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-on-surface-variant/60 text-[10px] font-black uppercase tracking-widest">
                      <th className="pb-6 pl-4">Service Date</th>
                      <th className="pb-6">Item Description</th>
                      <th className="pb-6">Amount</th>
                      <th className="pb-6 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {recentOrders && recentOrders.length > 0 ? (
                      recentOrders.map((order, idx) => (
                        <OrderTableRow 
                          key={order._id || idx}
                          date={new Date(order.createdAt).toLocaleString()} 
                          item={
                            <div className="flex flex-col gap-0.5">
                              {order.items?.map((i, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-slate-700">{i.itemId?.name || 'Item'}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">({i.quantity}x ₹{i.price})</span>
                                </div>
                              ))}
                            </div>
                          } 
                          amount={`₹${(order.totalAmount || 0).toFixed(2)}`} 
                          status={order.status?.toUpperCase()} 
                          isError={order.status === 'rejected' || order.status === 'cancelled'} 
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-10 text-center text-slate-400">No recent orders found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      <button className="fixed bottom-10 right-10 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-3xl">shopping_cart</span>
      </button>
    </div>
  );
};

const MetricCard = ({ icon, label, value, color }) => (
  <div className={`bg-surface-container-lowest p-6 rounded-[2rem] flex flex-col justify-between shadow-sm border-l-4 border-${color} group hover:bg-${color}-container hover:text-white transition-all duration-300`}>
    <div>
      <span className={`material-symbols-outlined text-${color} group-hover:text-white mb-4`}>{icon}</span>
      <h3 className="text-sm font-bold text-on-surface-variant group-hover:text-white/80">{label}</h3>
    </div>
    <p className="text-3xl font-black mt-4">{value}</p>
  </div>
);

const MenuDayCard = ({ day, date, meals, active }) => (
  <div className={`flex-shrink-0 w-64 ${active ? 'bg-primary-container text-white shadow-xl shadow-blue-500/20' : 'bg-surface-container-lowest text-on-surface shadow-sm'} p-5 rounded-3xl transition-shadow`}>
    <div className="flex justify-between items-center mb-4">
      <span className="font-bold">{day}</span>
      {date && <span className={`text-[10px] ${active ? 'opacity-70' : 'text-slate-400'}`}>{date}</span>}
    </div>
    <div className="space-y-4">
      {meals.map((m, i) => (
        <div key={i} className="flex gap-3">
          <div className={`w-1 h-8 ${active ? (i % 2 === 0 ? 'bg-white' : 'bg-white/30') : (i % 2 === 0 ? 'bg-primary' : 'bg-slate-200')} rounded-full`}></div>
          <div>
            <p className={`text-[10px] uppercase font-bold ${active ? 'opacity-70' : 'text-slate-400'}`}>{m.label}</p>
            <p className="text-sm font-medium">{m.name}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TimelineStep = ({ status, time, label, sub, highlight, deadlinePassed, onToggle, isActive }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${status === 'served' ? 'bg-green-500 text-white' : status === 'active' ? 'bg-primary text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
        <span className="material-symbols-outlined text-sm">{status === 'served' ? 'check' : status === 'active' ? 'notifications_active' : 'lock'}</span>
      </div>
      <div className="w-0.5 h-full bg-slate-200 -mt-1"></div>
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-start">
        <h4 className={`font-bold text-slate-900`}>{label}</h4>
        {time && <span className={`text-[10px] font-black ${status === 'active' ? 'text-primary' : 'text-slate-500'}`}>{time}</span>}
      </div>
      <p className={`text-xs text-slate-500 mb-2`}>{sub}</p>
      {status === 'served' && <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">SERVED AT {time}</span>}
      {(status === 'active' || status === 'locked') && (
        <div className="bg-white p-3 rounded-2xl border border-primary/10 shadow-sm mt-2">
          <p className="text-[10px] text-slate-600 mb-2 leading-relaxed">
            {status === 'active' ? 'Currently serving. Too late to toggle.' : 'Scheduled for later.'} 
            Rule: Toggle before previous meal starts.
          </p>
          <button 
            onClick={onToggle}
            disabled={status === 'active'}
            className={`w-full py-2 ${status === 'active' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : (isActive ? 'bg-slate-50 hover:bg-red-50 text-red-600' : 'bg-primary text-white')} text-[10px] font-bold rounded-xl transition-all shadow-sm active:scale-95`}
          >
            {status === 'active' ? 'LOCKED' : (isActive ? 'OPT-OUT OF THIS MEAL' : 'OPT-IN TO THIS MEAL')}
          </button>
        </div>
      )}
    </div>
  </div>
);

const OrderTableRow = ({ date, item, amount, status, isError }) => (
  <tr className="hover:bg-surface-container-low transition-colors group">
    <td className="py-4 pl-4 rounded-l-2xl font-medium text-slate-500">{date}</td>
    <td className="py-4 font-bold text-slate-900">{item}</td>
    <td className="py-4 font-black text-primary">{amount}</td>
    <td className="py-4 pr-4 rounded-r-2xl">
      <span className={`px-3 py-1 ${isError ? 'bg-error-container text-on-error-container' : 'bg-green-100 text-green-700'} text-[10px] font-black rounded-full`}>{status}</span>
    </td>
  </tr>
);

export default StudentDashboard;

