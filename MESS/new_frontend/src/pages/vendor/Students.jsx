import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { canteenService } from '../../api/index';

const VendorStudents = () => {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudents = async (query = '') => {
    try {
      setLoading(true);
      setError(null);
      const response = await canteenService.searchStudents(query);
      setStudents(response.students || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load student profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch some students on mount (even if query is empty, maybe backend should return all?)
    // For now, let's just search if query exists or leave it empty if backend returns nothing for empty search.
    fetchStudents(searchQuery);
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents(searchQuery);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="vendor" />
      <GlobalHeader title="Member Directory" role="Vendor" />

      <main className="ml-72 pt-24 px-8 pb-12">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Subscriber Insights</h2>
            <p className="text-on-surface-variant mt-2 text-lg">Maintaining personalized culinary profiles for every resident.</p>
          </div>
          <div className="flex gap-4">
            <form onSubmit={handleSearchSubmit} className="bg-white px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400">search</span>
              <input 
                type="text" 
                placeholder="Search by name or roll no..." 
                className="bg-transparent border-none focus:ring-0 text-sm font-bold"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </form>
            <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all">Export List</button>
          </div>
        </header>

        {error && (
          <div className="mb-8 bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin text-4xl text-primary mb-4">⏳</div>
            <p className="text-slate-500 font-bold">Retrieving profiles...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
             <span className="material-symbols-outlined text-6xl mb-4 opacity-20">group</span>
             <p className="font-bold">No students found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {students.map((student) => (
              <div key={student._id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50 hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-2xl font-black text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    {student.userId?.name ? student.userId.name[0] : 'S'}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    student.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {student.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">{student.userId?.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{student.rollNumber}</p>
                
                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room</span>
                    <span className="text-sm font-bold text-slate-700">{student.roomNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diet Status</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${student.dietStatus ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {student.dietStatus ? 'Subscribed' : 'Off'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</span>
                    <span className="text-[10px] font-bold text-slate-700 truncate max-w-[120px]">{student.userId?.email}</span>
                  </div>
                </div>
                <button className="w-full mt-8 py-4 bg-slate-50 hover:bg-primary hover:text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all">
                  View Full Profile
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorStudents;
