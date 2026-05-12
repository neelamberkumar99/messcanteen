import React from 'react';
import Sidebar from '../components/Sidebar';
import GlobalHeader from '../components/GlobalHeader';
import { useAuth } from '../context/AuthContext';

const Support = () => {
  const { user } = useAuth();

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role={user?.role || 'student'} />
      <GlobalHeader title="Concierge Support" role="Support" />

      <main className="ml-72 pt-24 px-8 pb-12">
        <header className="mb-10">
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Help Center</h2>
          <p className="text-on-surface-variant mt-2 text-lg">Resolve queries, explore documentation, and connect with system architects.</p>
        </header>

        {/* Support Bento Grid */}
        <div className="grid grid-cols-12 gap-8 mb-12">
          {/* Main FAQ Area */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-50">
              <h3 className="text-2xl font-bold mb-8">Frequently Asked Questions</h3>
              <div className="space-y-6">
                <FAQItem 
                  question="How do I top up my culinary credits?" 
                  answer="Navigate to your Billing section and select 'Add Credits'. You can use any major UPI app, credit card, or net banking portal to settle your dues instantly."
                />
                <FAQItem 
                  question="My order was cancelled, when will I get a refund?" 
                  answer="Refunds are processed automatically and typically reflect in your wallet within 15-30 minutes of cancellation. If it takes longer, please open a priority ticket."
                />
                <FAQItem 
                  question="Can I change my diet plan mid-week?" 
                  answer="Diet plans can be modified anytime, but changes will take effect from the following Monday to ensure kitchen synchronization."
                />
                <FAQItem 
                  question="What should I do if my QR code isn't scanning?" 
                  answer="Ensure your screen brightness is at maximum. If the issue persists, you can use your Student ID number at any canteen terminal for manual entry."
                />
              </div>
            </div>

            <div className="bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000"></div>
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <h4 className="text-3xl font-black mb-4">Knowledge Base</h4>
                  <p className="text-slate-400 max-w-md text-sm font-medium leading-relaxed">Access the complete MessERP technical manual, including API documentation for vendors and policy guidelines for students.</p>
                  <button className="mt-8 px-8 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">Explore Documentation</button>
                </div>
                <span className="material-symbols-outlined text-[120px] text-white/5 group-hover:rotate-12 transition-transform">menu_book</span>
              </div>
            </div>
          </div>

          {/* Contact & Status Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold mb-8">Direct Assistance</h3>
              <div className="space-y-4">
                <ContactOption icon="support_agent" label="Live Architect" sub="Available 09:00 - 22:00" active />
                <ContactOption icon="mail" label="Priority Email" sub="Response within 2 hours" />
                <ContactOption icon="call" label="Emergency Line" sub="Critical food safety issues" />
              </div>
            </div>

            <div className="bg-primary/5 p-10 rounded-[3rem] border border-primary/10">
              <h3 className="text-xl font-bold text-primary mb-6">System Health</h3>
              <div className="space-y-4">
                <StatusRow label="Main Database" status="Operational" color="green" />
                <StatusRow label="Payment Gateway" status="Operational" color="green" />
                <StatusRow label="Canteen Terminals" status="Degraded" color="amber" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-8 uppercase tracking-widest text-center">Last synced: 2m ago</p>
            </div>

            <div className="bg-white border border-slate-100 p-10 rounded-[3rem] shadow-sm text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-slate-400">rate_review</span>
              </div>
              <h4 className="text-lg font-bold mb-2">Open a Ticket</h4>
              <p className="text-xs text-slate-500 mb-6 font-medium">Can't find what you need? Describe your issue and we'll resolve it.</p>
              <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]">New Priority Ticket</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const FAQItem = ({ question, answer }) => (
  <details className="group border-b border-slate-50 pb-6 cursor-pointer">
    <summary className="flex justify-between items-center list-none">
      <span className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">{question}</span>
      <span className="material-symbols-outlined text-slate-300 group-open:rotate-180 transition-transform">expand_more</span>
    </summary>
    <p className="mt-4 text-slate-500 leading-relaxed font-medium text-sm">{answer}</p>
  </details>
);

const ContactOption = ({ icon, label, sub, active }) => (
  <button className="w-full p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-all flex items-center gap-4 group">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all'}`}>
      <span className="material-symbols-outlined text-xl">{icon}</span>
    </div>
    <div className="text-left">
      <p className="text-sm font-bold text-slate-900">{label}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{sub}</p>
    </div>
  </button>
);

const StatusRow = ({ label, status, color }) => (
  <div className="flex justify-between items-center">
    <span className="text-xs font-bold text-slate-600">{label}</span>
    <div className="flex items-center gap-2">
      <div className={`w-1.5 h-1.5 rounded-full bg-${color === 'green' ? 'green-500' : 'amber-500'}`}></div>
      <span className={`text-[10px] font-black uppercase tracking-widest ${color === 'green' ? 'text-green-600' : 'text-amber-600'}`}>{status}</span>
    </div>
  </div>
);

export default Support;
