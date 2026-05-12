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
      const results = await Promise.all([
        dietService.getVendorDietPlan().catch(e => ({})),
        adminService.getStats().catch(e => ({})),
        adminService.getNotificationLog().catch(e => ({}))
      ]);

      const dietRes = results[0] || {};
      const statsRes = results[1] || {};
      const notifRes = results[2] || {};

      // Priority: use hostel data from dietRes (direct for vendor)
      const hostelData = dietRes.hostel || statsRes.hostel || statsRes.data?.hostel || null;
      setHostel(hostelData);

      const schedule = (dietRes.dietPlan?.schedule || dietRes.plan?.schedule || dietRes.data?.plan?.schedule) || [];
      setMenu(Array.isArray(schedule) ? schedule : []);

      const stats = (statsRes.stats || statsRes.data?.stats) || {};
      setDietStats({
        totalStudents: stats.totalStudents || 0,
        activeDiets: stats.activeDiets || 0,
        mealStats: stats.mealStats || {},
        mealStatsTomorrow: stats.mealStatsTomorrow || {}
      });
      setNotifications(notifRes.notifications || []);
    } catch (err) {
      console.error('Error fetching vendor diets:', err);
      setError(err.message || 'Failed to load diet plans');
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
      await dietService.updateVendorDietPlan('Global Diet Plan', menu);
      setIsEditing(null);
      await fetchData();
    } catch (err) {
      console.error('Error saving diet plan:', err);
      setError(err.message || 'Failed to save diet plan');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (idx, mealType, value) => {
    const newMenu = [...menu];
    newMenu[idx][mealType] = value;
    setMenu(newMenu);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="vendor" />
      <GlobalHeader title="Weekly Menu Editor" role="Vendor" />

      <main className="ml-72 min-h-screen p-8 lg:p-12 pt-24">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Weekly Menu Editor</h1>
            <p className="text-on-surface-variant mt-2 max-w-md">Curate the culinary experience for the upcoming week.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => fetchData()}
              className="px-6 py-3 rounded-xl font-bold text-on-surface bg-surface-container-low hover:bg-surface-container-high transition-colors"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-3 rounded-xl font-bold text-white bg-primary shadow-xl shadow-primary/10 hover:shadow-primary/30 transition-all disabled:opacity-50"
            >
              Publish Menu
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-8 bg-red-50 text-red-600 p-6 rounded-3xl font-bold border border-red-100 flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)} className="text-sm underline">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* Main Editor Table Card */}
          <section className="bg-surface-container-lowest rounded-[3rem] p-10 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-bold flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">restaurant_menu</span>
                </div>
                Menu Orchestration Matrix
              </h2>
            </div>

            {loading && !menu.length ? (
              <div className="py-20 text-center">
                <div className="animate-spin text-4xl text-primary mb-4">⏳</div>
                <p className="text-slate-500 font-bold">Synchronizing dietary data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-4">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="pb-6 pl-4">Day Cycle</th>
                      {(hostel?.dietComponents || []).map(comp => (
                        <th key={comp.name} className="pb-6">{comp.name}</th>
                      ))}
                      <th className="pb-6 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menu.map((item, idx) => (
                      <tr key={idx} className={`group transition-all ${isEditing === idx ? 'bg-primary/5 rounded-2xl ring-1 ring-primary/20' : 'hover:bg-slate-50'}`}>
                        <td className="py-6 pl-4 rounded-l-2xl">
                          <span className="font-black text-slate-900 text-lg uppercase tracking-tight">{item.day}</span>
                        </td>
                        {(hostel?.dietComponents || []).map(comp => (
                          <td key={comp.name}>
                            {isEditing === idx ? (
                              <input
                                className="w-full bg-white border-none rounded-2xl shadow-inner focus:ring-4 focus:ring-primary/5 p-4 text-sm font-bold"
                                type="text"
                                value={(item.meals instanceof Map ? item.meals.get(comp.name) : item.meals?.[comp.name]) || ''}
                                onChange={(e) => {
                                  const newMenu = [...menu];
                                  if (!newMenu[idx].meals) newMenu[idx].meals = {};
                                  newMenu[idx].meals[comp.name] = e.target.value;
                                  setMenu(newMenu);
                                }}
                              />
                            ) : (
                              <div className="p-4 text-sm text-slate-600 font-bold">
                                {(item.meals instanceof Map ? item.meals.get(comp.name) : item.meals?.[comp.name]) || 'N/A'}
                              </div>
                            )}
                          </td>
                        ))}
                        <td className="py-6 pr-4 text-right rounded-r-2xl">
                          {isEditing === idx ? (
                            <button
                              onClick={handleSave}
                              className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">check</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEdit(idx)}
                              className="p-3 text-slate-300 hover:text-primary hover:bg-primary/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            >
                              <span className="material-symbols-outlined text-sm">edit_note</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default VendorDiets;

