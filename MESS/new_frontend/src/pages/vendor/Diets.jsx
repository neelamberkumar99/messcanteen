import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { dietService, adminService } from '../../api/index';

const VendorDiets = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(null);
  const [menu, setMenu] = useState([]);
  const [dietStats, setDietStats] = useState({
    totalStudents: 0,
    activeDiets: 0
  });

  const [hostel, setHostel] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await Promise.all([
        dietService.getVendorDietPlan().catch(e => ({ error: e })),
        adminService.getStats().catch(e => ({ error: e })),
        adminService.getNotificationLog().catch(e => ({ error: e }))
      ]);

      const dietRes = results[0];
      const statsRes = results[1];
      const notifRes = results[2];

      if (dietRes.error && statsRes.error) {
        throw new Error('Failed to connect to server. Please ensure you are assigned to a hostel.');
      }

      // Priority: use hostel data from dietRes (direct for vendor)
      const hostelData = dietRes.hostel || statsRes.hostel || statsRes.data?.hostel || null;
      setHostel(hostelData);

      const schedule = (dietRes.dietPlan?.schedule || dietRes.plan?.schedule || dietRes.data?.plan?.schedule) || [];
      
      if (Array.isArray(schedule) && schedule.length > 0) {
        setMenu(schedule);
      } else {
        // Initialize default 7-day schedule if empty
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        setMenu(days.map(day => ({ day, meals: {} })));
      }

      const stats = (statsRes.stats || statsRes.data?.stats) || {};
      setDietStats({
        totalStudents: stats.totalStudents || 0,
        activeDiets: stats.activeDiets || 0,
        mealStats: stats.mealStats || {},
        mealStatsTomorrow: stats.mealStatsTomorrow || {},
        typicalHeadcount: hostelData?.typicalHeadcount || 0
      });
      setNotifications(Array.isArray(notifRes.notifications) ? notifRes.notifications : []);
    } catch (err) {
      console.error('Error fetching vendor diets:', err);
      setError(err.message || 'Failed to load diet plans. Ensure you are an authorized vendor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (idx) => {
    setIsEditing(idx);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Ensure meals is an object for each entry
      const sanitizedMenu = menu.map(item => ({
        ...item,
        meals: item.meals instanceof Map ? Object.fromEntries(item.meals) : (item.meals || {})
      }));
      
      await dietService.updateVendorDietPlan('Global Diet Plan', sanitizedMenu);
      setIsEditing(null);
      await fetchData();
    } catch (err) {
      console.error('Error saving diet plan:', err);
      setError(err.message || 'Failed to save diet plan');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the menu to default 7 days? All current entries will be lost.')) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      setMenu(days.map(day => ({ day, meals: {} })));
    }
  };

  const getDayHeadcount = (dayName) => {
    const today = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const tomorrow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][(new Date().getDay() + 1) % 7];
    
    if (dayName === today) return dietStats.mealStats;
    if (dayName === tomorrow) return dietStats.mealStatsTomorrow;
    return null;
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="vendor" />
      <GlobalHeader title="Weekly Menu Editor" role="Vendor" />

      <main className="ml-72 min-h-screen p-8 lg:p-12 pt-24">
        <header className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-sm">location_on</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {hostel?.name || 'Authorized Canteen'} • {dietStats.typicalHeadcount} Baseline Subscribers
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Menu Orchestration Matrix</h1>
            <p className="text-on-surface-variant mt-2 max-w-md">Curate the culinary experience and monitor real-time subscriptions.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors text-xs uppercase tracking-widest"
            >
              Reset Cycle
            </button>
            <button
              onClick={handleSave}
              disabled={loading || isEditing === null}
              className={`px-8 py-3 rounded-xl font-bold text-white shadow-xl transition-all disabled:opacity-50 ${isEditing !== null ? 'bg-primary shadow-primary/30 hover:scale-105' : 'bg-slate-300 shadow-none'}`}
            >
              {isEditing !== null ? 'Commit Changes' : 'Publish Menu'}
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-8 bg-red-50 text-red-600 p-6 rounded-3xl font-bold border border-red-100 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-sm underline">Dismiss</button>
          </div>
        )}

        {!hostel?.dietComponents?.length && !loading && (
          <div className="mb-8 bg-amber-50 text-amber-700 p-8 rounded-[2.5rem] border border-amber-100 flex flex-col gap-4">
            <h3 className="text-xl font-black flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span>
              Configuration Required
            </h3>
            <p className="text-sm font-bold opacity-80">
              Dietary components (Breakfast, Lunch, etc.) have not been configured for this hostel. 
              Please contact the Administrator to set up the diet structure in System Settings.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* Main Editor Table Card */}
          <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 overflow-hidden relative">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-bold flex items-center gap-4 text-slate-900">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">restaurant_menu</span>
                </div>
                Weekly Orchestration
              </h2>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Enrollment Sync Active</span>
                 </div>
              </div>
            </div>

            {loading && !menu.length ? (
              <div className="py-20 text-center">
                <div className="animate-spin text-4xl text-primary mb-4">⏳</div>
                <p className="text-slate-500 font-bold">Synchronizing dietary matrix...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-4">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="pb-6 pl-6">Day Cycle</th>
                      {(hostel?.dietComponents || []).map(comp => (
                        <th key={comp.name} className="pb-6 text-center">{comp.name}</th>
                      ))}
                      <th className="pb-6 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menu.map((item, idx) => {
                      const dayHeadcount = getDayHeadcount(item.day);
                      return (
                        <tr key={idx} className={`group transition-all ${isEditing === idx ? 'bg-primary/5 rounded-2xl ring-2 ring-primary/20 scale-[1.01]' : 'hover:bg-slate-50/50'}`}>
                          <td className="py-6 pl-6 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100">
                            <span className="font-black text-slate-900 text-lg uppercase tracking-tight">{item.day}</span>
                            {dayHeadcount && (
                              <div className="mt-1 flex items-center gap-1 text-primary">
                                <span className="material-symbols-outlined text-[10px]">sensors</span>
                                <span className="text-[9px] font-black uppercase tracking-widest">Live Day</span>
                              </div>
                            )}
                          </td>
                          {(hostel?.dietComponents || []).map(comp => {
                            const mealValue = (item.meals instanceof Map ? item.meals.get(comp.name) : item.meals?.[comp.name]) || '';
                            const mealCount = dayHeadcount ? dayHeadcount[comp.name] : null;
                            
                            return (
                              <td key={comp.name} className="border-y border-transparent group-hover:border-slate-100 px-4">
                                {isEditing === idx ? (
                                  <div className="relative group/input">
                                    <input
                                      className="w-full bg-white border border-slate-100 rounded-2xl shadow-inner focus:ring-4 focus:ring-primary/10 p-4 text-sm font-bold placeholder:text-slate-200 outline-none transition-all"
                                      type="text"
                                      placeholder={`What's for ${comp.name}?`}
                                      value={mealValue}
                                      onChange={(e) => {
                                        const newMenu = [...menu];
                                        if (!newMenu[idx].meals) newMenu[idx].meals = {};
                                        newMenu[idx].meals[comp.name] = e.target.value;
                                        setMenu(newMenu);
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="text-center flex flex-col items-center gap-1">
                                    <div className="text-sm font-bold">
                                      {mealValue ? (
                                        <span className="text-slate-900">{mealValue}</span>
                                      ) : (
                                        <span className="text-slate-300 italic font-medium">Not set</span>
                                      )}
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${mealCount !== null ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-400'}`}>
                                      {mealCount !== null ? `${mealCount} Subscribers` : `${dietStats.typicalHeadcount} Baseline`}
                                    </div>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-6 pr-6 text-right rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100">
                            {isEditing === idx ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setIsEditing(null)}
                                  className="p-3 text-slate-400 hover:text-slate-600 transition-all"
                                  title="Cancel"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                                <button
                                  onClick={handleSave}
                                  className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
                                  title="Save Day"
                                >
                                  <span className="material-symbols-outlined text-sm font-black">check</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEdit(idx)}
                                className="p-3 text-slate-300 hover:text-primary hover:bg-primary/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                title="Edit Day Menu"
                              >
                                <span className="material-symbols-outlined text-sm">edit_note</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Background Decoration */}
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 -z-10"></div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default VendorDiets;
