import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { dietService } from '../../api/index';

const StudentHistory = () => {
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dietStatus, setDietStatus] = useState({});

  // Fetch meal plan and diet status on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch diet plan (meal schedule)
        const planRes = await dietService.getDietPlan();
        setDietPlan(planRes.plan || []);

        // Fetch diet status (breakfast/lunch/dinner on/off)
        const statusRes = await dietService.getDietStatus();
        setDietStatus(statusRes.data || statusRes);
      } catch (err) {
        console.error('Error fetching meal plan:', err);
        setError(err.message || 'Failed to load meal plan. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDietToggle = async (mealName) => {
    try {
      setLoading(true);
      await dietService.toggleMeal(mealName);
      // Refetch status
      const statusRes = await dietService.getDietStatus();
      const statusData = statusRes.data || { status: true, mealsOff: [] };
      statusData.active = statusData.status;
      setDietStatus(statusData);
    } catch (err) {
      console.error('Error toggling diet:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update diet status.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface text-on-surface min-h-screen">
        <Sidebar role="student" />
        <GlobalHeader role="Student" />
        <main className="ml-72 pt-24 px-8 pb-12 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-on-surface-variant">Loading meal plan...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="student" />
      <GlobalHeader title="Meal Architecture" role="Student" />

      <main className="ml-72 pt-24 px-8 pb-12">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        {/* Elite Resident Dining Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container rounded-[2.5rem] p-10 text-white mb-10 flex justify-between items-center shadow-xl shadow-primary/10">
          <div>
            <h2 className="text-4xl font-black mb-2 tracking-tight">Weekly Culinary Matrix</h2>
            <p className="text-white/70 text-lg font-medium tracking-tight">Your hostel's orchestrated menu and dietary controls.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white/20 transition-all border border-white/10"
            >
              Sync Schedule
            </button>
          </div>
        </div>

        {/* Weekly Menu Matrix */}
        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 mb-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">restaurant_menu</span>
              </div>
              The Weekly Schedule
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-4">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th className="pb-4 pl-4">Day Cycle</th>
                  <th className="pb-4">Breakfast</th>
                  <th className="pb-4">Lunch</th>
                  <th className="pb-4 pr-4">Dinner</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {Array.isArray(dietPlan) && dietPlan.length > 0 ? (
                  dietPlan.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-6 pl-4 rounded-l-2xl">
                        <span className="font-black text-slate-900 uppercase tracking-tighter text-lg">{row.day}</span>
                      </td>
                      <td className="py-6">
                        <p className="font-bold text-slate-600 group-hover:text-primary transition-colors">{row.meals?.Breakfast || 'N/A'}</p>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">08:00 AM</p>
                      </td>
                      <td className="py-6">
                        <p className="font-bold text-slate-600 group-hover:text-primary transition-colors">{row.meals?.Lunch || 'N/A'}</p>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">01:00 PM</p>
                      </td>
                      <td className="py-6 pr-4 rounded-r-2xl">
                        <p className="font-bold text-slate-600 group-hover:text-primary transition-colors">{row.meals?.Dinner || 'N/A'}</p>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">08:00 PM</p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-10 text-center text-slate-400 font-bold uppercase tracking-widest">
                      No orchestration found. Contact Central Control.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Diet On/Off Control Section */}
        <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-2 flex items-center gap-4">
              <span className="material-symbols-outlined text-primary text-3xl">tune</span>
              Dietary Precision Control
            </h3>
            <p className="text-slate-400 text-sm mb-10 max-w-2xl leading-relaxed">
              Activate or hibernate your meal subscription for specific time windows. Precision adjustments allow for optimized resource allocation across the campus kitchen.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {dietStatus?.hostel?.dietComponents?.map((comp, idx) => {
                const isMealOff = dietStatus.mealsOff?.includes(comp.name);
                return (
                  <DietControlCard 
                    key={idx}
                    mealType={comp.name} 
                    icon={idx === 0 ? "wb_sunny" : idx === 1 ? "lunch_dining" : "dark_mode"} 
                    label={comp.name}
                    isActive={!isMealOff && dietStatus.active}
                    onToggle={() => handleDietToggle(comp.name)}
                  />
                );
              })}
              {!dietStatus?.hostel?.dietComponents && (
                <p className="text-slate-400 italic">No dynamic components defined. Using legacy controls.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const DietControlCard = ({ mealType, icon, label, isActive, onToggle }) => {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await onToggle();
    } catch (err) {
      console.error('Error toggling diet:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all group">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
            <span className="material-symbols-outlined text-2xl">{icon}</span>
          </div>
          <h4 className="text-lg font-black tracking-tight">{label}</h4>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isActive ? 'bg-primary/20 text-primary' : 'bg-white/10 text-slate-500'}`}>
          {isActive ? 'ACTIVE' : 'HIBERNATED'}
        </div>
      </div>
      
      <div className="grid grid-cols-1">
        <button 
          onClick={handleToggle}
          disabled={loading}
          className={`py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isActive ? 'bg-slate-700 text-white' : 'bg-primary text-white shadow-xl shadow-primary/20'}`}
        >
          {loading ? 'Processing...' : (isActive ? 'Hibernate Meal' : 'Activate Meal')}
        </button>
      </div>
    </div>
  );
};

export default StudentHistory;
