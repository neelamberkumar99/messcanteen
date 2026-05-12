import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { adminService } from '../../api/index';

const AdminFeedback = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    resolutionRate: '0%',
    avgResponse: '0h',
    satisfiedStudents: '0%'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await adminService.getComplaints().catch(e => ({}));
      const complaintsArray = (res.complaints || res.data?.complaints) || [];
      setComplaints(Array.isArray(complaintsArray) ? complaintsArray : []);
      
      // Mock stats calculation for now based on data
      const resolvedCount = (res.complaints || res.data?.complaints || []).filter(c => c.status === 'resolved').length;
      const totalCount = (res.complaints || res.data?.complaints || []).length;
      const rate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
      
      setStats({
        resolutionRate: `${rate}%`,
        avgResponse: '1.4h', // Static for now as backend doesn't provide avg time yet
        satisfiedStudents: '88%' // Static placeholder
      });
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolve = async (id) => {
    const resolution = window.prompt('Enter resolution notes:');
    if (resolution === null) return;
    
    try {
      await adminService.resolveComplaint(id, resolution);
      fetchData();
    } catch (err) {
      console.error('Error resolving complaint:', err);
      alert(err.message || 'Failed to resolve complaint');
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="admin" />
      <GlobalHeader title="Feedback Administration" role="Admin" />

      <main className="ml-72 pt-24 px-8 pb-12">
        {/* Admin Header */}
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Stakeholder Sentiment</h2>
            <p className="text-on-surface-variant mt-2 text-lg">Moderating and resolving student concerns across the campus network.</p>
          </div>
          <div className="flex gap-4">
            <button className="bg-white px-8 py-4 rounded-2xl border border-slate-100 font-black text-[10px] uppercase tracking-widest text-slate-500 shadow-sm hover:bg-slate-50 transition-all">Export Analytics</button>
            <button className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Analyze Trends</button>
          </div>
        </header>

        {/* Analytics Row */}
        <div className="grid grid-cols-12 gap-8 mb-12">
          <div className="col-span-12 lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold tracking-tight mb-8">Resolution Velocity</h3>
              <div className="flex items-end gap-6 h-48 mb-8">
                {[60, 45, 80, 70, 95, 85, 100].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                    <div className="w-full bg-slate-50 rounded-full h-full relative overflow-hidden shadow-inner">
                      <div className="absolute bottom-0 left-0 w-full bg-primary/20 group-hover:bg-primary transition-all rounded-full" style={{ height: `${h}%` }}></div>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-8">
            <StatCard icon="task_alt" label="Resolution Rate" value={stats.resolutionRate} color="green" />
            <StatCard icon="avg_time" label="Avg. Response" value={stats.avgResponse} color="blue" />
            <StatCard icon="sentiment_satisfied" label="Satisfied Students" value={stats.satisfiedStudents} color="amber" />
          </div>
        </div>

        {/* Global Feedback Feed */}
        <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="text-2xl font-bold tracking-tight">Active Complaint Queue</h3>
            <div className="flex gap-2">
              <span className="px-6 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10">Live Feed</span>
            </div>
          </div>
          
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="animate-spin text-4xl text-primary">⏳</div>
            </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50/20">
                  <th className="py-6 pl-10 text-[10px] font-black uppercase tracking-widest text-slate-400">Reference</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Identity</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Concerns</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Severity</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Lifecycle</th>
                  <th className="py-6 pr-10 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Governance</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-20 text-center text-slate-400 font-bold italic">No complaints found.</td>
                  </tr>
                ) : (
                  complaints.map((item) => (
                    <tr key={item._id} className="group hover:bg-slate-50/50 transition-colors border-t border-slate-50">
                      <td className="py-7 pl-10 font-black text-primary uppercase tracking-widest text-xs">#{item._id.slice(-6).toUpperCase()}</td>
                      <td className="py-7">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 text-xs uppercase">{(item.studentName || 'S')[0]}</div>
                          <span className="font-bold text-slate-900 tracking-tight">{item.studentName}</span>
                        </div>
                      </td>
                      <td className="py-7">
                        <p className="font-bold text-slate-900 leading-none mb-1.5">{item.title}</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">{item.type} • {new Date(item.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="py-7 text-center">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                          item.severity === 'High' ? 'bg-red-100 text-red-600' : 
                          item.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {item.severity || 'Medium'}
                        </span>
                      </td>
                      <td className="py-7">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          item.status === 'resolved' ? 'bg-green-100 text-green-700 border-green-200' : 
                          item.status === 'inprogress' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-7 pr-10 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status !== 'resolved' && (
                            <button 
                              onClick={() => handleResolve(item._id)}
                              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-slate-900/10"
                            >
                              Resolve
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
          <div className="p-10 border-t border-slate-50 bg-slate-50/30 text-center">
            <button 
              onClick={fetchData}
              className="text-slate-300 font-black text-[10px] uppercase tracking-[0.3em] hover:text-primary transition-colors"
            >
              Synchronize Immutable Ledger
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
    <div className={`w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-inner`}>
      <span className="material-symbols-outlined text-2xl">{icon}</span>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-2xl font-black text-slate-900">{value}</h4>
    </div>
  </div>
);

export default AdminFeedback;

