import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { adminService } from '../../api/index';

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('student'); // 'student', 'contractor', or 'staff'

  const [newUser, setNewUser] = useState({ name: '', email: '', password: 'Password@123', rollNumber: '', hostelId: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'student') {
        const res = await adminService.getStudents().catch(e => ({}));
        const studentsArray = (res.students || res.data?.students) || [];
        const formatted = (Array.isArray(studentsArray) ? studentsArray : []).map(s => ({
          _id: s._id,
          name: s.userId?.name || 'N/A',
          email: s.userId?.email || 'N/A',
          role: 'Student',
          id: s.rollNumber || 'N/A',
          activity: s.userId?.isActive ? 'Active' : 'Inactive',
          initials: (s.userId?.name || 'S')[0]
        }));
        setUsers(formatted);
      } else if (activeTab === 'contractor') {
        const res = await adminService.getContractors().catch(e => ({}));
        const contractorsArray = (res.contractors || res.data?.contractors) || [];
        const formatted = (Array.isArray(contractorsArray) ? contractorsArray : []).map(c => ({
          _id: c._id,
          name: c.name || 'N/A',
          email: c.email || 'N/A',
          role: 'Vendor',
          id: `#${c._id.slice(-5).toUpperCase()}`,
          activity: c.isActive ? 'Active' : 'Inactive',
          initials: (c.name || 'V')[0]
        }));
        setUsers(formatted);
      } else if (activeTab === 'staff') {
        const res = await adminService.getStaff().catch(e => ({}));
        const staffArray = (res.staff || res.data?.staff) || [];
        const formatted = (Array.isArray(staffArray) ? staffArray : []).map(s => ({
          _id: s._id,
          name: s.name || 'N/A',
          email: s.email || 'N/A',
          role: 'Staff',
          id: `#${s._id.slice(-5).toUpperCase()}`,
          activity: s.isActive ? 'Active' : 'Inactive',
          initials: (s.name || 'S')[0]
        }));
        setUsers(formatted);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'student') {
        await adminService.addStudent(newUser.name, newUser.email, newUser.rollNumber);
      } else if (activeTab === 'contractor') {
        await adminService.addContractor(newUser.name, newUser.email);
      } else {
        await adminService.addStaff(newUser.name, newUser.email, 'staff');
      }
      setShowModal(false);
      setNewUser({ name: '', email: '', password: 'Password@123', rollNumber: '', hostelId: '' });
      fetchData();
    } catch (err) {
      console.error('Error adding user:', err);
      alert(err.message || 'Failed to provision identity');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="admin" />
      <GlobalHeader title="User Directory" role="Admin" />

      <main className="ml-72 pt-24 px-8 pb-12">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Identity Hub</h2>
            <p className="text-on-surface-variant mt-2 text-lg">Centralized governance for all campus residents, vendors, and administrative nodes.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Provision Identity
          </button>
        </header>

        {/* User Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <UserMetric label="Current View" value={activeTab === 'student' ? 'Residents' : 'Vendors'} icon="group" color="primary" />
          <UserMetric label="Total Count" value={users.length} icon="analytics" color="secondary" />
          <UserMetric label="System Status" value="Online" icon="cloud_done" color="tertiary" />
          <UserMetric label="Global Access" value="Full" icon="key" color="primary" />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('student')}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'student' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
          >
            Residents
          </button>
          <button 
            onClick={() => setActiveTab('contractor')}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'contractor' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
          >
            Vendors
          </button>
          <button 
            onClick={() => setActiveTab('staff')}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'staff' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
          >
            Staff
          </button>
        </div>

        {/* Users Table */}
        <section className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-slate-100">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">Registered Identities</h3>
            <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-3 w-96 shadow-inner">
              <span className="material-symbols-outlined text-slate-300 text-lg">search</span>
              <input 
                type="text" 
                placeholder={`Search ${activeTab}s...`}
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 placeholder:text-slate-200 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="animate-spin text-4xl text-primary">⏳</div>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-6 pl-10 text-[10px] font-black uppercase tracking-widest text-slate-400">User Identity</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Master Role</th>
                  <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Master ID</th>
                  <th className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Network Presence</th>
                  <th className="py-6 pr-10 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Governance</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-slate-400 font-bold italic">No matching identities found.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="group hover:bg-slate-50/50 transition-colors border-t border-slate-50">
                      <td className="py-7 pl-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-primary text-lg">{user.initials}</div>
                          <div>
                            <p className="font-bold text-slate-900 tracking-tight">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-7">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          user.role === 'Admin' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 
                          user.role === 'Vendor' ? 'bg-amber-100 text-amber-700' : 
                          'bg-primary-container text-white shadow-lg shadow-primary/10'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-7 font-black text-slate-900 text-right pr-10">{user.id}</td>
                      <td className="py-7">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${user.activity === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                          <span className="text-slate-500 font-bold text-xs">{user.activity}</span>
                        </div>
                      </td>
                      <td className="py-7 pr-10 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary shadow-sm"><span className="material-symbols-outlined text-lg">edit</span></button>
                          <button className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-error shadow-sm"><span className="material-symbols-outlined text-lg">lock</span></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </section>

        {/* Provision Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-primary p-6 text-white px-10 flex justify-between items-center">
                <h3 className="text-xl font-bold">Provision Identity</h3>
                <button onClick={() => setShowModal(false)} className="hover:rotate-90 transition-transform"><span className="material-symbols-outlined">close</span></button>
              </div>
              <form onSubmit={handleAddUser} className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner focus:ring-2 ring-primary/20 transition-all"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Email</label>
                  <input 
                    required
                    type="email" 
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner focus:ring-2 ring-primary/20 transition-all"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                {activeTab === 'student' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Roll Number</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner focus:ring-2 ring-primary/20 transition-all"
                      value={newUser.rollNumber}
                      onChange={(e) => setNewUser({...newUser, rollNumber: e.target.value})}
                    />
                  </div>
                )}
                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest">Cancel</button>
                  <button type="submit" className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Provision</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const UserMetric = ({ label, value, icon, color }) => (
  <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all">
    <div className={`w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-inner`}>
      <span className="material-symbols-outlined text-2xl">{icon}</span>
    </div>
    <div className="mt-8">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-4xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

export default AdminUsers;

