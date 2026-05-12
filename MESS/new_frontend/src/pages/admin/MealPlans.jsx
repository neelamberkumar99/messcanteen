import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { adminService } from '../../api/index';

const AdminMealPlans = () => {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editFormData, setEditFormData] = useState({}); // Dynamic keys based on components

  const fetchData = async () => {
    try {
      setLoading(true);
      const statsRes = await adminService.getStats().catch(e => ({}));
      const hostelData = statsRes.hostel || statsRes.data?.hostel || null;
      setHostel(hostelData);
    } catch (err) {
      console.error('Error fetching diet plans:', err);
      setError(err.message || 'Failed to load meal architectures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (day) => {
    setEditingDay(day);
    // Initialize form with existing meal values or empty string
    const initialData = {};
    (hostel?.dietComponents || []).forEach(comp => {
      initialData[comp.name] = (day.meals instanceof Map ? day.meals.get(comp.name) : day.meals?.[comp.name]) || '';
    });
    setEditFormData(initialData);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!hostel) return;

    setSaveLoading(true);
    try {
      const updatedSchedule = hostel.dietPlan.schedule.map(d => 
        d.day === editingDay.day ? { ...d, meals: editFormData } : d
      );

      await adminService.setDietRules({
        hostelId: hostel._id,
        dietPlan: {
          ...hostel.dietPlan,
          schedule: updatedSchedule
        }
      });

      setShowEditModal(false);
      fetchData();
      alert('Meal plan updated successfully');
    } catch (err) {
      console.error('Error saving meal plan:', err);
      alert('Failed to save meal plan: ' + (err.message || 'Unknown error'));
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="admin" />
      <GlobalHeader title="Meal Plan Architecture" role="Admin" />

      <main className="ml-72 pt-24 px-8 pb-12">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Dining Abstractions</h2>
            <p className="text-on-surface-variant mt-2 text-lg">Designing and auditing meal plan structures for the campus ecosystem.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add_box</span>
            Draft New Plan
          </button>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <PlanStat label="Active Configuration" value={hostel?.dietPlan?.title || 'Standard'} icon="list_alt" color="primary" />
          <PlanStat label="Price Per Day" value={`₹${hostel?.dietPricePerDay || 0}`} icon="payments" color="secondary" />
          <PlanStat label="Min Duration" value={`${hostel?.minDietDays || 0} Days`} icon="timer" color="tertiary" />
          <PlanStat label="Cutoff Time" value={hostel?.dietCutoffTime || '00:00'} icon="schedule" color="primary" />
        </div>

        {/* Plans Table */}
        <section className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-slate-100">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="text-2xl font-bold tracking-tight">Active Meal Matrix</h3>
            <span className="px-6 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10">Master Schedule</span>
          </div>
          
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="animate-spin text-4xl text-primary">⏳</div>
            </div>
          ) : !hostel?.dietPlan?.schedule || hostel.dietPlan.schedule.length === 0 ? (
            <div className="py-20 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">restaurant</span>
              <p className="text-slate-400 font-bold uppercase tracking-widest">No master schedule defined for this hostel.</p>
            </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-6 pl-10 text-[10px] font-black uppercase tracking-widest text-slate-400">Temporal Node</th>
                  {(hostel?.dietComponents || []).map(comp => (
                    <th key={comp.name} className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">{comp.name}</th>
                  ))}
                  <th className="py-6 pr-10 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Governance</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {hostel.dietPlan.schedule.map((day, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50/50 transition-colors border-t border-slate-50">
                    <td className="py-7 pl-10 font-black text-primary uppercase tracking-widest text-xs">{day.day}</td>
                    {(hostel?.dietComponents || []).map(comp => (
                      <td key={comp.name} className="py-7">
                        <p className="font-bold text-slate-900 tracking-tight">
                          {(day.meals instanceof Map ? day.meals.get(comp.name) : day.meals?.[comp.name]) || 'N/A'}
                        </p>
                      </td>
                    ))}
                    <td className="py-7 pr-10 text-right">
                      <button 
                        onClick={() => handleEditClick(day)}
                        className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:text-primary shadow-sm group-hover:border-primary transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">edit_square</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
            <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-primary p-6 text-white px-10 flex justify-between items-center">
                <h3 className="text-xl font-bold uppercase tracking-tight">Edit Menu: {editingDay?.day}</h3>
                <button onClick={() => setShowEditModal(false)}><span className="material-symbols-outlined">close</span></button>
              </div>
              <form onSubmit={handleSaveEdit} className="p-10 space-y-8">
                {(hostel?.dietComponents || []).map(comp => (
                  <div key={comp.name} className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{comp.name}</label>
                    <input 
                      required
                      type="text" 
                      value={editFormData[comp.name] || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, [comp.name]: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner focus:ring-2 ring-primary/20 transition-all"
                    />
                  </div>
                ))}
                <button 
                  type="submit" 
                  disabled={saveLoading}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 disabled:opacity-50"
                >
                  {saveLoading ? 'Syncing...' : 'Update Matrix'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* New Plan Modal Placeholder */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-primary p-6 text-white px-10 flex justify-between items-center">
                <h3 className="text-xl font-bold">Draft Plan</h3>
                <button onClick={() => setShowModal(false)}><span className="material-symbols-outlined">close</span></button>
              </div>
              <form className="p-10 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plan Designation</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Executive Platinum"
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner focus:ring-2 ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Daily Price (₹)</label>
                  <input 
                    required
                    type="number" 
                    placeholder="0"
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner focus:ring-2 ring-primary/20 transition-all"
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10">Initialize Draft</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const PlanStat = ({ label, value, icon, color }) => (
  <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-xl transition-all">
    <div className={`w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-inner`}>
      <span className="material-symbols-outlined text-2xl">{icon}</span>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

export default AdminMealPlans;
