import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { studentService } from '../../api/index';

const StudentFeedback = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [formData, setFormData] = useState({
    category: 'food',
    title: '',
    description: '',
    anonymous: false
  });

  // Fetch existing complaints on component mount
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const response = await studentService.getComplaints();
        const complaintsList = Array.isArray(response) ? response : (response.complaints || response.data || []);
        setComplaints(complaintsList);
      } catch (err) {
        console.error('Error fetching complaints:', err);
        setError(err.message || 'Failed to load complaints');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await studentService.submitComplaint(
        formData.title,
        formData.category,
        formData.description,
        formData.anonymous
      );

      const newComplaint = response.complaint || response.data;
      if (newComplaint) {
        setComplaints([newComplaint, ...complaints]);
      }

      setFormData({
        category: 'food',
        title: '',
        description: '',
        anonymous: false
      });

      setSuccessMessage(`Feedback submitted successfully! Tracking ID: ${newComplaint?._id || 'N/A'}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="student" />
      <GlobalHeader title="Complaints & Feedback" role="Student" />

      <main className="ml-72 pt-24 px-8 pb-12">
        {/* Intro Section */}
        <section className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 z-0"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Your Feedback Matters</h2>
            <p className="text-slate-500 text-lg max-w-3xl leading-relaxed font-medium">
              At Culinary Concierge, we are committed to providing a high-quality dining experience. Use this portal to report issues with food quality, service, hygiene, or facilities.
            </p>
            <div className="mt-8 flex gap-8">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                <span className="text-[10px] uppercase tracking-widest font-black">24h Response Time</span>
              </div>
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined text-lg">verified_user</span>
                <span className="text-[10px] uppercase tracking-widest font-black">Anonymous Options</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-12 gap-10">
          {/* Submit Form Column */}
          <div className="col-span-12 lg:col-span-5 space-y-8">
            <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">edit_note</span>
                </div>
                <h3 className="text-xl font-bold tracking-tight">Submit Feedback</h3>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined">check_circle</span>
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Category</label>
                  <select 
                    className="w-full rounded-2xl border-none bg-slate-50 focus:ring-4 focus:ring-primary/5 text-sm font-bold p-4 shadow-inner cursor-pointer disabled:opacity-50"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    disabled={submitting}
                  >
                    <option value="food">Food Quality</option>
                    <option value="hygiene">Hygiene & Sanitation</option>
                    <option value="staff">Staff Behavior</option>
                    <option value="infrastructure">Infrastructure/Seating</option>
                    <option value="billing">Billing</option>
                    <option value="service">Service</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Subject</label>
                  <input 
                    required
                    className="w-full rounded-2xl border-none bg-slate-50 focus:ring-4 focus:ring-primary/5 text-sm font-bold p-4 shadow-inner disabled:opacity-50" 
                    placeholder="Brief summary..." 
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Description</label>
                  <textarea
                    required
                    className="w-full rounded-2xl border-none bg-slate-50 focus:ring-4 focus:ring-primary/5 text-sm font-bold p-4 shadow-inner disabled:opacity-50" 
                    placeholder="Provide details..." 
                    rows="5"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    disabled={submitting}
                  ></textarea>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, anonymous: !formData.anonymous})}
                    disabled={submitting}
                    className={`w-10 h-5 rounded-full relative transition-all duration-300 disabled:opacity-50 ${formData.anonymous ? 'bg-primary' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${formData.anonymous ? 'left-6' : 'left-1'}`}></div>
                  </button>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Submit anonymously</label>
                </div>
                <button className="w-full py-5 bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50" type="submit" disabled={submitting}>
                  {submitting ? (
                    <span className="animate-spin text-lg">⏳</span>
                  ) : (
                    <span className="material-symbols-outlined text-lg">send</span>
                  )}
                  Submit Feedback
                </button>
              </form>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
              <div className="relative z-10">
                <h4 className="text-xl font-bold mb-3">Emergency?</h4>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed font-medium">For immediate food safety concerns, contact the on-duty supervisor.</p>
                <a className="inline-flex items-center gap-4 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest transition-all" href="tel:+919876543210">
                  <span className="material-symbols-outlined text-lg">call</span>
                  Direct Hotline
                </a>
              </div>
              <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-white/5 text-[140px] font-thin">support_agent</span>
            </div>
          </div>

          {/* History Column */}
          <div className="col-span-12 lg:col-span-7">
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30 px-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl text-slate-300 shadow-sm flex items-center justify-center">
                    <span className="material-symbols-outlined">history</span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Timeline</h3>
                </div>
                <span className="px-5 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10">Active: {complaints.length}</span>
              </div>

              {loading ? (
                <div className="p-10 flex items-center justify-center">
                  <div className="animate-spin text-2xl text-primary">⏳</div>
                </div>
              ) : complaints.length === 0 ? (
                <div className="p-10 text-center text-slate-400">No history found.</div>
              ) : (
                <div className="divide-y divide-slate-50 overflow-y-auto no-scrollbar">
                  {complaints.map((item) => (
                    <div key={item._id} className="p-10 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-primary transition-colors">{item.title}</h4>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">#{item._id.slice(-6).toUpperCase()}</span>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          item.status === 'resolved' ? 'bg-green-100 text-green-700 border-green-200' : 
                          item.status === 'in-progress' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                          'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-300 text-sm">category</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                        </div>
                        <button className="text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:translate-x-2 transition-all">
                          View Details
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <StatCard icon="task_alt" label="Resolution Rate" value="94.2%" color="green" />
          <StatCard icon="avg_time" label="Avg. Resolution" value="18.5 hrs" color="blue" />
          <StatCard icon="pending_actions" label="Pending Tasks" value={complaints.filter(c => c.status !== 'resolved').length.toString().padStart(2, '0')} color="amber" />
        </section>
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-8 group hover:shadow-xl transition-all">
    <div className={`w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all shadow-inner`}>
      <span className="material-symbols-outlined text-2xl">{icon}</span>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
      <h4 className="text-2xl font-black text-slate-900">{value}</h4>
    </div>
  </div>
);

export default StudentFeedback;
