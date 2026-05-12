import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { canteenService } from '../../api/index';

const VendorItems = () => {
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Veg',
    isAvailable: true,
    imageUrl: ''
  });

  const [filter, setFilter] = useState('All Items');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await canteenService.getAllItems().catch(e => ({}));
      const itemsArray = (response.items || response.data?.items) || [];
      setItems(Array.isArray(itemsArray) ? itemsArray : []);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        price: item.price,
        category: item.category || 'Veg',
        isAvailable: item.isAvailable,
        imageUrl: item.imageUrl || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        price: '',
        category: 'Veg',
        isAvailable: true,
        imageUrl: ''
      });
    }
    setShowModal(true);
  };

  const handleSaveItem = async () => {
    if (!formData.name || !formData.price) return;
    
    try {
      if (editingItem) {
        await canteenService.editItem(editingItem._id || editingItem.id, {
          ...formData,
          price: Number(formData.price)
        });
      } else {
        await canteenService.addItem(
          formData.name,
          Number(formData.price),
          formData.category,
          formData.imageUrl,
          formData.isAvailable
        );
      }
      
      fetchItems();
      setShowModal(false);
    } catch (err) {
      console.error('Error saving item:', err);
      alert(err.message || 'Failed to save item');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await canteenService.deleteItem(id);
      fetchItems();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert(err.message || 'Failed to delete item');
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'All Items') return true;
    return item.category === filter;
  });

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="vendor" />
      <GlobalHeader title="Inventory Management" role="Vendor" />

      <main className="ml-72 pt-24 px-8 pb-12">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Canteen Menu</h2>
            <p className="text-on-surface-variant mt-2 text-lg">Manage your daily menu items, prices, and real-time availability.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Add New Item
          </button>
        </header>

        {/* Category Filter Bar */}
        <div className="flex gap-4 mb-10 overflow-x-auto no-scrollbar pb-2">
          {['All Items', 'Veg', 'Non-Veg', 'Beverage'].map((cat) => (
            <button 
              key={cat} 
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === cat ? 'bg-primary text-white shadow-lg shadow-primary/10' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading/Error States */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin text-4xl text-primary">⏳</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-3xl font-bold text-center">
            {error}
            <button onClick={fetchItems} className="ml-4 underline">Retry</button>
          </div>
        ) : (
          /* Items Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {filteredItems.map((item) => (
              <div key={item._id || item.id} className="bg-white rounded-[3rem] overflow-hidden shadow-sm hover:shadow-xl transition-all group border border-slate-50 p-2">
                <div className="h-48 relative overflow-hidden rounded-[2rem] bg-slate-50 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <span className="material-symbols-outlined text-slate-200 text-6xl">image</span>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-amber-500 text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-[10px] font-black">{item.rating || '5.0'}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{item.name}</h3>
                  <p className="text-xl font-black text-slate-900 mb-2">₹{item.price}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{item.category}</p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${item.isAvailable ? 'bg-primary' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${item.isAvailable ? 'left-6' : 'left-1'}`}></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(item)} className="text-slate-400 hover:text-primary transition-colors p-2"><span className="material-symbols-outlined text-lg">edit</span></button>
                      <button onClick={() => handleDeleteItem(item._id || item.id)} className="text-slate-400 hover:text-error transition-colors p-2"><span className="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => handleOpenModal()}
              className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-primary hover:text-primary transition-all p-12 group"
            >
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center group-hover:border-primary transition-all">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>
              <span className="text-xs font-black uppercase tracking-widest">New Menu Item</span>
            </button>
          </div>
        )}

        {/* Add/Edit Item Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              {/* Modal Header */}
              <div className="bg-primary p-5 flex justify-between items-center text-white px-8">
                <h3 className="text-lg font-bold">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
                <button onClick={() => setShowModal(false)} className="hover:rotate-90 transition-transform">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Item Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter item name..."
                    className="w-full bg-slate-50 border-none rounded-2xl p-3.5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Price (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        className="w-full bg-slate-50 border-none rounded-2xl p-3.5 pl-8 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Category</label>
                    <select 
                      className="w-full bg-slate-50 border-none rounded-2xl p-3.5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner cursor-pointer"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="Veg">Veg</option>
                      <option value="Non-Veg">Non-Veg</option>
                      <option value="Beverage">Beverage</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Image URL</label>
                  <input 
                    type="text" 
                    placeholder="https://..."
                    className="w-full bg-slate-50 border-none rounded-2xl p-3.5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setFormData({...formData, isAvailable: !formData.isAvailable})}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${formData.isAvailable ? 'bg-primary' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${formData.isAvailable ? 'left-7' : 'left-1'}`}></div>
                  </button>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3.5 bg-white text-slate-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-white/50 transition-all border border-slate-200 shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveItem}
                  className="px-8 py-3.5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Save Item
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorItems;

