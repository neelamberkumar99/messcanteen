import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ role }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const isVendor = role === 'vendor';
  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin';
  const isStudent = role === 'student';

  return (
    <aside className="h-screen w-72 fixed left-0 top-0 bg-white border-r border-slate-100 flex flex-col py-8 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Brand Header */}
      <div className="px-8 mb-12 flex items-center gap-4">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant_menu</span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Concierge</h1>
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">Management Suite</p>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1 px-4 overflow-y-auto no-scrollbar">
        {isStudent && (
          <>
            <SidebarLink to="/student/dashboard" icon="dashboard" label="Dashboard" />
            <SidebarLink to="/student/history" icon="calendar_today" label="Meal Plans" />
            <SidebarLink to="/student/orders" icon="fastfood" label="Orders" />
            <SidebarLink to="/student/bill" icon="account_balance_wallet" label="Payments" />
            <SidebarLink to="/student/feedback" icon="rate_review" label="Feedback" />
          </>
        )}

        {isVendor && (
          <>
            <SidebarLink to="/vendor/dashboard" icon="dashboard" label="Dashboard" />
            <SidebarLink to="/vendor/diets" icon="restaurant_menu" label="Diet Mgmt" />
            <SidebarLink to="/vendor/items" icon="fastfood" label="Canteen Items" />
            <SidebarLink to="/vendor/orders" icon="list_alt" label="Orders" />
            <SidebarLink to="/vendor/students" icon="group" label="Students" />
            <SidebarLink to="/vendor/feedback" icon="rate_review" label="Feedback" />
          </>
        )}

        {isAdmin && (
          <>
            <SidebarLink to="/admin/dashboard" icon="dashboard" label="Dashboard" />
            <SidebarLink to="/admin/meal-plans" icon="calendar_today" label="Meal Plans" />
            <SidebarLink to="/admin/orders" icon="fastfood" label="Orders" />
            <SidebarLink to="/admin/payments" icon="account_balance_wallet" label="Payments" />
            <SidebarLink to="/admin/feedback" icon="rate_review" label="Feedback" />
            <SidebarLink to="/admin/users" icon="group" label="User Mgmt" />
            <SidebarLink to="/admin/settings" icon="settings_applications" label="System Settings" />
          </>
        )}

        {isSuperAdmin && (
          <>
            <SidebarLink to="/superadmin/dashboard" icon="dashboard" label="Dashboard" />
            <SidebarLink to="/superadmin/accounts" icon="group" label="Accounts" />
            <SidebarLink to="/superadmin/audit" icon="history_edu" label="Audit Log" />
          </>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto px-6 pt-6 flex flex-col gap-4 border-t border-slate-50">
        {(isStudent || isVendor) && (
          <button 
            onClick={() => {
              if (isVendor) navigate('/vendor/pos');
              else navigate('/student/shop');
            }}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-900/10 group"
          >
            <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">add_circle</span>
            Order Now
          </button>
        )}
        <div className="flex flex-col gap-1 mt-2">
          <NavLink to="/settings" className="flex items-center gap-4 px-5 py-3 text-slate-500 hover:text-primary transition-all rounded-xl hover:bg-slate-50">
            <span className="material-symbols-outlined text-xl">settings</span>
            <span className="text-sm font-bold">Settings</span>
          </NavLink>
          <NavLink to="/support" className="flex items-center gap-4 px-5 py-3 text-slate-500 hover:text-primary transition-all rounded-xl hover:bg-slate-50">
            <span className="material-symbols-outlined text-xl">help_outline</span>
            <span className="text-sm font-bold">Support</span>
          </NavLink>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-5 py-3 text-error hover:text-error/80 transition-all rounded-xl hover:bg-error/5 w-full text-left"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="text-sm font-bold">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

const SidebarLink = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-4 px-6 py-4 rounded-[1.25rem] transition-all duration-300 group ${
        isActive
          ? 'bg-primary text-white shadow-xl shadow-primary/20 font-bold scale-[1.02]'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`
    }
  >
    <span className={`material-symbols-outlined text-xl transition-transform group-hover:scale-110`}>
      {icon}
    </span>
    <span className="text-sm tracking-tight font-bold">{label}</span>
  </NavLink>
);

export default Sidebar;
