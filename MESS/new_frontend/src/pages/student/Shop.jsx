import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { canteenService, orderService } from '../../api/index';

const StudentShop = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [notes, setNotes] = useState('');

  // Fetch available items on component mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await canteenService.getAvailableItems();
        setItems(response.items || response.data || []);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError(err.message || 'Failed to load items');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const addToCart = (item) => {
    setCart([...cart, { ...item, cartId: Date.now() }]);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(i => i.cartId !== cartId));
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      alert('Please add items to your cart');
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = cart.map(item => ({
        itemId: item._id || item.id,
        quantity: 1
      }));

      const response = await orderService.placeOrder(orderItems, notes);
      
      setSuccessMessage(`Order placed successfully! Order ID: ${response.order?._id || 'N/A'}`);
      setCart([]);
      setNotes('');
      setShowCart(false);

      // Clear message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      alert('Failed to place order: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price || 0), 0);

  // Get unique categories from items
  const categories = ['All', ...new Set(items.map(i => i.category || 'Other'))];
  
  const filteredItems = activeCategory === 'All' 
    ? items 
    : items.filter(i => (i.category || 'Other') === activeCategory);

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="student" />
      <GlobalHeader title="Canteen Catalog" role="Student" />

      <main className="ml-72 pt-24 px-8 pb-12">
        {/* Search & Hero */}
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Culinary Catalog</h2>
            <p className="text-on-surface-variant mt-2 text-lg">Curated selections from the finest campus kitchens, delivered in minutes.</p>
          </div>
          <button 
            onClick={() => setShowCart(true)}
            className="bg-white p-2 rounded-2xl border border-slate-100 flex items-center gap-2 shadow-sm group hover:border-primary transition-all active:scale-95"
          >
            <div className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20">
              <span className="material-symbols-outlined text-sm">shopping_bag</span>
              Cart ({cart.length})
            </div>
          </button>
        </header>

        {/* Categories */}
        <div className="flex gap-4 mb-12 overflow-x-auto no-scrollbar pb-2">
          {categories.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'bg-white text-slate-400 hover:bg-slate-50 shadow-sm border border-slate-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-8 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">check_circle</span>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p className="text-slate-500 font-bold">Loading menu items...</p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 block">shopping_bag</span>
              <p className="text-slate-400 font-bold">No items available in this category</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {filteredItems.map((item) => (
            <div key={item._id || item.id} className="bg-white rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all group border border-slate-50 flex flex-col p-2">
              <div className="h-64 relative overflow-hidden rounded-[2.5rem]">
                <img src={item.imageUrl || item.image || 'https://via.placeholder.com/400'} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500"></div>
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-xs font-black text-slate-900">{item.rating || '4.5'}</span>
                </div>
                <button 
                  onClick={() => addToCart(item)}
                  className="absolute bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-primary/40 translate-y-24 group-hover:translate-y-0 transition-transform duration-500 hover:scale-110 active:scale-95"
                >
                  <span className="material-symbols-outlined text-2xl font-black">add</span>
                </button>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary leading-none">{item.category}</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">₹{(item.price || 0).toFixed(2)}</p>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex-1 tracking-tight">{item.name}</h3>
                <div className="flex gap-4 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-300">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    8m Prep
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-300">
                    <span className="material-symbols-outlined text-sm">eco</span>
                    Organic
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

        {/* Cart Modal */}
        {showCart && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCart(false)}></div>
            <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="bg-primary p-6 text-white flex justify-between items-center px-8">
                <h3 className="text-xl font-bold">Shopping Cart</h3>
                <button onClick={() => setShowCart(false)}><span className="material-symbols-outlined">close</span></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-6xl text-slate-100 mb-4">shopping_basket</span>
                    <p className="text-slate-400 font-bold">Your cart is empty</p>
                  </div>
                ) : (
                  cart.map((i) => (
                    <div key={i.cartId} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <img src={i.imageUrl || i.image || 'https://via.placeholder.com/64'} className="w-16 h-16 rounded-2xl object-cover" alt={i.name} />
                        <div>
                          <p className="font-bold text-slate-900">{i.name}</p>
                          <p className="text-xs font-black text-primary">₹{(i.price || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(i.cartId)}
                        className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Notes Section */}
              {cart.length > 0 && (
                <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Add Special Instructions</label>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-50"
                    placeholder="Any special requests or dietary needs..."
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={submitting}
                  ></textarea>
                </div>
              )}

              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estimated Total</span>
                  <span className="text-3xl font-black text-slate-900">₹{total.toFixed(2)}</span>
                </div>
                <button 
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={cart.length === 0 || submitting}
                  onClick={placeOrder}
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">done</span>
                      Confirm Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Floating Actions */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl px-10 py-5 rounded-full shadow-2xl flex items-center gap-10 z-40 border border-white/10 text-white animate-in slide-in-from-bottom-10 duration-1000">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/40">
              <span className="material-symbols-outlined text-xl">fastfood</span>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 leading-none mb-1.5">Next Meal Hub</p>
              <p className="text-sm font-bold leading-none tracking-tight">Mediterranean Fusion Lunch • 12:30 PM</p>
            </div>
          </div>
          <div className="w-px h-10 bg-white/10"></div>
          <button className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors">Set Smart Reminder</button>
        </div>
      </main>
    </div>
  );
};

export default StudentShop;
