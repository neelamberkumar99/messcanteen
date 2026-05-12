import React from 'react';
import { useAuth } from '../context/AuthContext';

const GlobalHeader = ({ title = "Activities", role = "User" }) => {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-72 bg-white/80 backdrop-blur-xl z-40 px-10 py-5 flex justify-between items-center border-b border-slate-100 shadow-sm shadow-slate-900/5">
      <div className="flex items-center bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-2xl w-[400px] transition-all focus-within:border-primary/30 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-primary/5">
        <span className="material-symbols-outlined text-slate-400 mr-3 text-xl">search</span>
        <input className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 font-medium" placeholder={`Search for ${title.toLowerCase()}...`} type="text"/>
      </div>
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-end">
          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full tracking-widest uppercase mb-1">{role} Node</span>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">System Health: Nominal</p>
        </div>
        <div className="h-8 w-px bg-slate-100"></div>
        <button className="relative text-slate-400 hover:text-primary transition-all hover:scale-110 active:scale-95">
          <span className="material-symbols-outlined text-2xl">notifications</span>
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-error rounded-full border-2 border-white shadow-sm"></span>
        </button>
        <div className="flex items-center gap-4 group cursor-pointer pl-2">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900 leading-none group-hover:text-primary transition-colors">
              {user?.name || 'Authorized User'}
            </p>
            <p className="text-[10px] text-slate-500 font-bold mt-1.5 uppercase tracking-widest">
              ID: #{String(user?._id || user?.id || '29401').slice(-5).toUpperCase()}
            </p>
          </div>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all shadow-md overflow-hidden">
              {user?.avatar ? (
                <img alt="User avatar" className="w-full h-full object-cover" src={user.avatar}/>
              ) : (
                <span className="material-symbols-outlined text-slate-300">person</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
