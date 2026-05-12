import React from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';

const SuperAdminAccounts = () => {
  const accounts = [
    { name: 'North Wing Canteen', type: 'Vendor', owner: 'Maria Garcia', status: 'Active', load: '78%' },
    { name: 'Campus Admin Office', type: 'Admin', owner: 'Sarah Smith', status: 'Active', load: 'Low' },
    { name: 'Global Fusion Hub', type: 'Vendor', owner: 'Julian Chen', status: 'Maintenance', load: '0%' },
    { name: 'Faculty Dining HQ', type: 'Admin', owner: 'Alex Rivera', status: 'Active', load: 'High' },
  ];

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
          <button className="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all">
            <span className="material-symbols-outlined">add_business</span>
            Federate New Node
          </button>
        </header>

        {/* Account Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {accounts.map((acc, i) => (
            <div key={i} className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-50 hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${acc.type === 'Vendor' ? 'bg-secondary-container/10 text-secondary' : 'bg-primary-container/10 text-primary'}`}>
                  <span className="material-symbols-outlined text-3xl">{acc.type === 'Vendor' ? 'storefront' : 'admin_panel_settings'}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  acc.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {acc.status}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2">{acc.name}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{acc.type} Node</p>
              
              <div className="space-y-4 pt-6 border-t border-slate-50">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Master Controller</span>
                  <span className="text-xs font-bold text-slate-700">{acc.owner}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Resource Load</span>
                  <span className="text-xs font-black text-primary">{acc.load}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-8 opacity-0 group-hover:opacity-100 transition-all">
                <button className="py-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all">Configure</button>
                <button className="py-3 bg-slate-50 hover:bg-error-container hover:text-on-error-container rounded-xl text-[10px] font-black uppercase transition-all">Suspend</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminAccounts;
