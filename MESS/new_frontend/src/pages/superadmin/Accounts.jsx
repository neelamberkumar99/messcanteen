import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import superAdminService from '../../api/superAdminService';

const SuperAdminAccounts = () => {
  const [hostels, setHostels] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showHostelModal, setShowHostelModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedHostelId, setSelectedHostelId] = useState(null);

  // Form states
  const [hostelForm, setHostelForm] = useState({
    name: '', address: '', dietCutoffTime: '22:00', inventoryFreezeTime: '08:00', minDiets: 0, paymentDueDays: 7
  });
  const [adminForm, setAdminForm] = useState({
    name: '', email: '', password: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hostelsRes, adminsRes] = await Promise.all([
        superAdminService.getHostels(),
        superAdminService.getAdmins()
      ]);
      if (hostelsRes.success) setHostels(hostelsRes.data);
      if (adminsRes.success) setAdmins(adminsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateHostel = async (e) => {
    e.preventDefault();
    try {
      await superAdminService.createHostel(hostelForm);
      setShowHostelModal(false);
      setHostelForm({ name: '', address: '', dietCutoffTime: '22:00', inventoryFreezeTime: '08:00', minDiets: 0, paymentDueDays: 7 });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating hostel');
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await superAdminService.createAdmin({ ...adminForm, hostelId: selectedHostelId });
      setShowAdminModal(false);
      setAdminForm({ name: '', email: '', password: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating admin');
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="superadmin" />
      <GlobalHeader title="Master Account Governance" role="Super Admin" />

      <main className="ml-72 pt-24 px-8 pb-12">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Entity Federation</h2>
            <p className="text-on-surface-variant mt-2 text-lg">Provisioning and managing root-level nodes across the campus culinary network.</p>
          </div>
          <button 
            onClick={() => setShowHostelModal(true)}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            <span className="material-symbols-outlined">add_business</span>
            Federate New Hostel
          </button>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hostels.map((hostel) => {
              const hostelAdmins = admins.filter(a => a.hostelId?._id === hostel._id);
              
              return (
                <div key={hostel._id} className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-50 hover:shadow-xl transition-all group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black bg-primary-container/10 text-primary">
                        <span className="material-symbols-outlined text-3xl">domain</span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700">
                        Active
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2">{hostel.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{hostel.address || 'No Address'}</p>
                    
                    <div className="space-y-4 pt-6 border-t border-slate-50">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Admins Assigned</span>
                        <span className="text-xs font-black text-primary">{hostelAdmins.length}</span>
                      </div>
                      {hostelAdmins.map(admin => (
                        <div key={admin._id} className="bg-slate-50 p-2 rounded-lg flex items-center gap-2">
                           <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                           <span className="text-xs font-semibold">{admin.name} ({admin.email})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 mt-8 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => { setSelectedHostelId(hostel._id); setShowAdminModal(true); }}
                      className="py-3 bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-white rounded-xl text-[10px] font-black uppercase transition-all"
                    >
                      Assign Admin
                    </button>
                  </div>
                </div>
              );
            })}
            
            {hostels.length === 0 && (
              <div className="col-span-full text-center py-20 text-slate-400 font-medium">
                No Hostels federated yet.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Hostel Modal */}
      {showHostelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">Federate New Hostel</h3>
            <form onSubmit={handleCreateHostel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Hostel Name</label>
                <input required type="text" value={hostelForm.name} onChange={e => setHostelForm({...hostelForm, name: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. North Wing" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Address</label>
                <input type="text" value={hostelForm.address} onChange={e => setHostelForm({...hostelForm, address: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary" placeholder="Campus Location" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Diet Cutoff</label>
                  <input required type="time" value={hostelForm.dietCutoffTime} onChange={e => setHostelForm({...hostelForm, dietCutoffTime: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Inv. Freeze</label>
                  <input required type="time" value={hostelForm.inventoryFreezeTime} onChange={e => setHostelForm({...hostelForm, inventoryFreezeTime: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button type="button" onClick={() => setShowHostelModal(false)} className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-xl font-bold bg-primary text-white shadow-lg hover:scale-105 transition-transform">Create Hostel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">Assign Admin to Hostel</h3>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full Name</label>
                <input required type="text" value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary" placeholder="Admin Name" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email Address</label>
                <input required type="email" value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary" placeholder="admin@hostel.com" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Temporary Password</label>
                <input required type="password" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••" />
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button type="button" onClick={() => setShowAdminModal(false)} className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-xl font-bold bg-secondary text-white shadow-lg hover:scale-105 transition-transform">Assign Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminAccounts;
