import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { canteenService } from '../../api/index';

const VendorFeedback = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await canteenService.getComplaints().catch(e => ({}));
      const complaintsArray = (response.complaints || response.data?.complaints) || [];
      setComplaints(Array.isArray(complaintsArray) ? complaintsArray : []);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolve = async (id) => {
    try {
      await canteenService.resolveComplaint(id, 'Resolved by vendor');
      fetchComplaints();
    } catch (err) {
      console.error('Error resolving complaint:', err);
      alert(err.message || 'Failed to resolve complaint');
    }
  };

  // Basic stats calculation
  const stats = {
    food: complaints.filter(c => c.category === 'food').length,
    hygiene: complaints.filter(c => c.category === 'hygiene').length,
    staff: complaints.filter(c => c.category === 'staff').length,
    other: complaints.filter(c => c.category === 'other' || c.category === 'service').length,
    total: complaints.length || 1
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="vendor" />
      <GlobalHeader title="Canteen Feedback" role="Vendor" />

      <main className="ml-72 pt-24 px-8 pb-12">
        <header className="mb-10">
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Canteen Sentiment</h2>
          <p className="text-on-surface-variant mt-2 text-lg">Real-time student feedback and complaints regarding your canteen's service.</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin text-4xl text-primary">⏳</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-3xl font-bold text-center">
            {error}
            <button onClick={fetchComplaints} className="ml-4 underline">Retry</button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-8 mb-12">
            <div className="col-span-12 lg:col-span-4 space-y-8">
              <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-900/20">
                <h3 className="text-xl font-bold mb-6">Quality Rating</h3>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl font-black text-primary">4.2</span>
                  <div className="flex flex-col">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4].map(i => <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                      <span className="material-symbols-outlined text-sm">star_half</span>
                    </div>
                    <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Based on {complaints.length} reviews</span>
                  </div>
                </div>
                <p className="text-xs opacity-50 leading-relaxed italic">"Students are generally happy with the variety, but mentioned food temperature consistency."</p>
              </div>
              
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold mb-6">Concerns by Category</h3>
                <div className="space-y-4">
                  <CategoryProgress label="Food Quality" percent={`${Math.round((stats.food / stats.total) * 100)}%`} color="primary" />
                  <CategoryProgress label="Staff / Service" percent={`${Math.round((stats.staff / stats.total) * 100)}%`} color="amber" />
                  <CategoryProgress label="Hygiene" percent={`${Math.round((stats.hygiene / stats.total) * 100)}%`} color="green" />
                  <CategoryProgress label="Other" percent={`${Math.round((stats.other / stats.total) * 100)}%`} color="slate" />
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8">
              <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <h3 className="text-xl font-bold">Active Concerns</h3>
                  <span className="px-4 py-1.5 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest">{complaints.length} Items</span>
                </div>
                <div className="divide-y divide-slate-50 overflow-y-auto no-scrollbar flex-1">
                  {complaints.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 font-bold">No complaints found. Keep up the good work!</div>
                  ) : (
                    complaints.map((item) => (
                      <div key={item._id} className="p-8 hover:bg-slate-50/50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">
                              {item._id.slice(-8).toUpperCase()} • {item.studentId?.userId?.name || 'Anonymous'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              item.status === 'resolved' ? 'bg-green-100 text-green-700 border-green-200' : 
                              item.status === 'in-progress' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                              'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {item.status}
                            </span>
                            {item.status !== 'resolved' && (
                              <button 
                                onClick={() => handleResolve(item._id)}
                                className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                title="Mark as Resolved"
                              >
                                <span className="material-symbols-outlined text-sm">done_all</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{item.description}</p>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-300 text-lg">category</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                          </div>
                          <div className="flex items-center gap-2 ml-auto">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-6 border-t border-slate-50 bg-slate-50/30">
                  <button className="w-full py-3 bg-white border border-slate-100 rounded-xl text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-primary transition-all shadow-sm">
                    View Full History
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const CategoryProgress = ({ label, percent, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
      <span className="text-slate-400">{label}</span>
      <span className={`text-${color === 'primary' ? 'primary' : color === 'amber' ? 'amber-500' : color === 'green' ? 'green-600' : 'slate-400'}`}>{percent}</span>
    </div>
    <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
      <div className={`h-full bg-${color === 'primary' ? 'primary' : color === 'amber' ? 'amber-500' : color === 'green' ? 'green-600' : 'slate-400'}`} style={{ width: percent }}></div>
    </div>
  </div>
);

export default VendorFeedback;

