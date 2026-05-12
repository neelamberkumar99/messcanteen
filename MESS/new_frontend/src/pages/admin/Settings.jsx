import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { adminService } from '../../api/index';

const AdminSettings = () => {
  const [hostel, setHostel] = useState(null);
  const [fineRules, setFineRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);

  const [billingForm, setBillingForm] = useState({
    paymentDueDays: 7,
    provider: 'upi',
    upiId: '',
    accountName: '',
    accountNumber: '',
    ifsc: '',
    minDiets: 0,
    dietCutoffTime: '08:00',
    dietComponents: []
  });

  const [showComponentModal, setShowComponentModal] = useState(false);
  const [newComponent, setNewComponent] = useState({ name: '', price: 0, time: '08:00', includeInDiet: true });

  const [fineForm, setFineForm] = useState({
    slabs: [
      { fromDay: 1, toDay: 7, perDayFine: 10 },
      { fromDay: 8, toDay: 30, perDayFine: 20 }
    ]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, fineRes] = await Promise.all([
        adminService.getStats(),
        adminService.getFineRules()
      ]);
      
      const hostelData = statsRes.hostel || statsRes.data?.hostel;
      setHostel(hostelData);
      
      if (hostelData) {
        setBillingForm({
          paymentDueDays: hostelData.paymentDueDays || 7,
          provider: hostelData.paymentMethod?.provider || 'upi',
          upiId: hostelData.paymentMethod?.upiId || '',
          accountName: hostelData.paymentMethod?.accountName || '',
          accountNumber: hostelData.paymentMethod?.accountNumber || '',
          ifsc: hostelData.paymentMethod?.ifsc || '',
          minDiets: hostelData.minDiets || 0,
          dietCutoffTime: hostelData.dietCutoffTime || '08:00',
          dietComponents: hostelData.dietComponents || []
        });
      }

      const rules = fineRes.rules || fineRes.data?.rules || [];
      setFineRules(rules);
      if (rules.length > 0) {
        setFineForm({ slabs: rules[0].slabs });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.message || 'Failed to load system parameters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBillingSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await adminService.setDietRules({
        hostelId: hostel._id,
        dietComponents: billingForm.dietComponents,
        minDiets: billingForm.minDiets,
        dietCutoffTime: billingForm.dietCutoffTime
      });
      await adminService.setPaymentDueDays(billingForm.paymentDueDays);
      await adminService.setPaymentMethod({
        provider: billingForm.provider,
        upiId: billingForm.upiId,
        accountName: billingForm.accountName,
        accountNumber: billingForm.accountNumber,
        ifsc: billingForm.ifsc
      });
      alert('Institutional parameters synchronized successfully');
    } catch (err) {
      alert('Failed to update parameters: ' + (err.message || 'Unknown error'));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleFineSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await adminService.setFineRules({
        hostelId: hostel._id,
        adminId: hostel.adminId,
        slabs: fineForm.slabs
      });
      alert('Fine engine rules updated successfully');
    } catch (err) {
      alert('Failed to update fine rules: ' + (err.message || 'Unknown error'));
    } finally {
      setSaveLoading(false);
    }
  };

  const addSlab = () => {
    setFineForm({
      ...fineForm,
      slabs: [...fineForm.slabs, { fromDay: 0, toDay: 0, perDayFine: 0 }]
    });
  };

  const removeSlab = (index) => {
    const newSlabs = [...fineForm.slabs];
    newSlabs.splice(index, 1);
    setFineForm({ ...fineForm, slabs: newSlabs });
  };

  const updateSlab = (index, field, value) => {
    const newSlabs = [...fineForm.slabs];
    newSlabs[index][field] = Number(value);
    setFineForm({ ...fineForm, slabs: newSlabs });
  };

  const addComponent = () => {
    if (!newComponent.name) return;
    setBillingForm({
      ...billingForm,
      dietComponents: [...billingForm.dietComponents, { ...newComponent, isActive: true }]
    });
    setNewComponent({ name: '', price: 0, time: '08:00', includeInDiet: true });
    setShowComponentModal(false);
  };

  const removeComponent = (idx) => {
    const updated = [...billingForm.dietComponents];
    updated.splice(idx, 1);
    setBillingForm({ ...billingForm, dietComponents: updated });
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="admin" />
      <GlobalHeader title="System Configuration" role="Admin" />

      <main className="ml-72 pt-24 px-8 pb-12">
        <header className="mb-10">
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight text-slate-900">Governance Control</h2>
          <p className="text-on-surface-variant mt-2 text-lg">Define financial engines, payment gateways, and dynamic diet components.</p>
        </header>

        {loading ? (
          <div className="py-20 flex justify-center"><div className="animate-spin text-4xl">⏳</div></div>
        ) : (
          <div className="grid grid-cols-12 gap-10">
            {/* Billing & Payment Section */}
            <div className="col-span-12 lg:col-span-7 space-y-10">
              <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined font-black">restaurant</span>
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">Dietary Architecture</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowComponentModal(true)}
                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Define Meal Type
                  </button>
                </div>

                <form onSubmit={handleBillingSave} className="space-y-8">
                  {/* Dynamic Components List */}
                  <div className="space-y-4 mb-10">
                    {billingForm.dietComponents.length === 0 ? (
                      <div className="py-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No diet components defined yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {billingForm.dietComponents.map((comp, idx) => (
                          <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between group">
                            <div className="flex items-center gap-6">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 font-black text-xs shadow-sm">
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="font-black text-slate-900 uppercase tracking-tight">{comp.name}</h4>
                                <div className="flex gap-4 mt-1">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">₹{comp.price}</span>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">🕒 {comp.time || '08:00'}</span>
                                  {comp.includeInDiet && <span className="text-[9px] font-black uppercase tracking-widest text-green-500">Included in Min Diet</span>}
                                </div>
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={() => removeComponent(idx)}
                              className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global Opt-out Cutoff (Daily)</label>
                      <input 
                        type="time" 
                        value={billingForm.dietCutoffTime || '08:00'}
                        onChange={(e) => setBillingForm({ ...billingForm, dietCutoffTime: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Min Diets (Number)</label>
                      <input 
                        type="number" 
                        value={billingForm.minDiets}
                        onChange={(e) => setBillingForm({ ...billingForm, minDiets: Number(e.target.value) })}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Grace Period (Days)</label>
                      <input 
                        type="number" 
                        value={billingForm.paymentDueDays}
                        onChange={(e) => setBillingForm({ ...billingForm, paymentDueDays: Number(e.target.value) })}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Provider</label>
                      <select 
                        value={billingForm.provider}
                        onChange={(e) => setBillingForm({ ...billingForm, provider: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner appearance-none"
                      >
                        <option value="upi">UPI (Direct)</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  {billingForm.provider === 'upi' ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional UPI ID</label>
                      <input 
                        type="text" 
                        placeholder="e.g. mess@upi"
                        value={billingForm.upiId}
                        onChange={(e) => setBillingForm({ ...billingForm, upiId: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-8">
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Holder Name</label>
                        <input 
                          type="text" 
                          value={billingForm.accountName}
                          onChange={(e) => setBillingForm({ ...billingForm, accountName: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Number</label>
                        <input 
                          type="text" 
                          value={billingForm.accountNumber}
                          onChange={(e) => setBillingForm({ ...billingForm, accountNumber: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">IFSC Code</label>
                        <input 
                          type="text" 
                          value={billingForm.ifsc}
                          onChange={(e) => setBillingForm({ ...billingForm, ifsc: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner"
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={saveLoading}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {saveLoading ? 'Syncing...' : 'Update Billing Parameters'}
                  </button>
                </form>
              </section>
            </div>

            {/* Fine Engine Section */}
            <div className="col-span-12 lg:col-span-5 space-y-10">
              <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="flex items-center gap-4 mb-10 text-error">
                  <div className="w-12 h-12 bg-error/10 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined font-black text-2xl">gavel</span>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900">Fine Engine (Slabs)</h3>
                </div>

                <form onSubmit={handleFineSave} className="space-y-6">
                  {fineForm.slabs.map((slab, idx) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] relative group border border-transparent hover:border-slate-200 transition-all">
                      <button 
                        type="button" 
                        onClick={() => removeSlab(idx)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-white text-error rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400">Days Range</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              value={slab.fromDay}
                              onChange={(e) => updateSlab(idx, 'fromDay', e.target.value)}
                              className="w-full bg-white rounded-xl p-2 text-xs font-bold border-none shadow-sm"
                            />
                            <span className="text-slate-300">to</span>
                            <input 
                              type="number" 
                              value={slab.toDay}
                              onChange={(e) => updateSlab(idx, 'toDay', e.target.value)}
                              className="w-full bg-white rounded-xl p-2 text-xs font-bold border-none shadow-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400">Fine / Day (₹)</label>
                          <input 
                            type="number" 
                            value={slab.perDayFine}
                            onChange={(e) => updateSlab(idx, 'perDayFine', e.target.value)}
                            className="w-full bg-white rounded-xl p-2 text-xs font-bold border-none shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button 
                    type="button" 
                    onClick={addSlab}
                    className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border-2 border-dashed border-slate-200"
                  >
                    + Add New Slab
                  </button>

                  <button 
                    type="submit" 
                    disabled={saveLoading}
                    className="w-full py-5 bg-error text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-error/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {saveLoading ? 'Deploying...' : 'Apply Fine Rules'}
                  </button>
                </form>
              </section>
            </div>
          </div>
        )}
        {/* Define Component Modal */}
        {showComponentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowComponentModal(false)}></div>
            <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-primary p-6 text-white px-10 flex justify-between items-center">
                <h3 className="text-xl font-bold uppercase tracking-tight">Define Meal Type</h3>
                <button onClick={() => setShowComponentModal(false)}><span className="material-symbols-outlined">close</span></button>
              </div>
              <div className="p-10 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Component Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Snacks, Milk, Fruit"
                    value={newComponent.name}
                    onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unit Price (₹)</label>
                  <input 
                    type="number" 
                    value={newComponent.price}
                    onChange={(e) => setNewComponent({ ...newComponent, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Service Time (HH:MM 24h)</label>
                  <input 
                    type="time" 
                    value={newComponent.time}
                    onChange={(e) => setNewComponent({ ...newComponent, time: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner"
                  />
                </div>
                <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Include in Diet</p>
                      <p className="text-[9px] text-slate-400 font-bold">Counts towards monthly minimum</p>
                   </div>
                   <button 
                      type="button"
                      onClick={() => setNewComponent({ ...newComponent, includeInDiet: !newComponent.includeInDiet })}
                      className={`w-12 h-6 rounded-full transition-all relative ${newComponent.includeInDiet ? 'bg-primary' : 'bg-slate-200'}`}
                   >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newComponent.includeInDiet ? 'right-1' : 'left-1'}`}></div>
                   </button>
                </div>
                <button 
                  onClick={addComponent}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10"
                >
                  Confirm Definition
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminSettings;
