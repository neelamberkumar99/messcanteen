import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import GlobalHeader from '../../components/GlobalHeader';
import { canteenService, orderService } from '../../api/index';

const VendorPOS = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch available items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await canteenService.getAvailableItems();
        setItems(response.items || response.data || []);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError('Failed to load items');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Handle student search
  useEffect(() => {
    const searchStudents = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setIsSearching(true);
        const response = await canteenService.searchStudents(searchQuery);
        setSearchResults(response.students || []);
      } catch (err) {
        console.error('Error searching students:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchStudents, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const addToCart = (item) => {
    setCart([...cart, { ...item, cartId: Date.now() }]);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(i => i.cartId !== cartId));
  };

  const placeOrder = async () => {
    if (!selectedStudent) {
      alert('Please select a student first');
      return;
    }
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = cart.map(item => ({
        itemId: item._id,
        quantity: 1
      }));

      const studentUserId = selectedStudent.userId?._id || selectedStudent.userId;
      await orderService.createOrderForStudent(studentUserId, orderItems);
      
      setSuccessMessage(`Order placed successfully for ${selectedStudent.userId?.name || 'Student'}`);
      setCart([]);
      setSelectedStudent(null);
      setSearchQuery('');
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      alert('Failed to place order: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar role="vendor" />
      <GlobalHeader title="Point of Sale" role="Vendor" />

      <main className="ml-72 pt-24 px-8 pb-12">
        <header className="mb-10">
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight">Vendor POS</h2>
          <p className="text-on-surface-variant mt-2 text-lg">Direct order entry for students without mobile access.</p>
        </header>

        {successMessage && (
          <div className="mb-8 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">check_circle</span>
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Student Search & Items */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* Student Search Section */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person_search</span>
                1. Select Student
              </h3>
              
              <div className="relative">
                <div className={`flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border ${selectedStudent ? 'border-primary bg-primary/5' : 'border-slate-100'}`}>
                  <span className="material-symbols-outlined text-slate-400">search</span>
                  <input 
                    type="text" 
                    placeholder="Search by Name, Roll No, or Email..." 
                    className="bg-transparent border-none focus:ring-0 flex-1 text-sm font-bold"
                    value={selectedStudent ? selectedStudent.userId?.name : searchQuery}
                    onChange={(e) => {
                      if (selectedStudent) setSelectedStudent(null);
                      setSearchQuery(e.target.value);
                    }}
                  />
                  {selectedStudent && (
                    <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-red-500">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && !selectedStudent && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-64 overflow-y-auto">
                    {searchResults.map(student => (
                      <button 
                        key={student._id}
                        onClick={() => {
                          setSelectedStudent(student);
                          setSearchResults([]);
                        }}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                      >
                        <div className="text-left">
                          <p className="font-bold text-slate-900">{student.userId?.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{student.rollNumber} • {student.roomNumber}</p>
                        </div>
                        <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100">add_circle</span>
                      </button>
                    ))}
                  </div>
                )}
                {isSearching && (
                  <div className="absolute right-4 top-4">
                    <div className="animate-spin text-primary">⏳</div>
                  </div>
                )}
              </div>
            </section>

            {/* Items Grid */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">restaurant_menu</span>
                2. Select Items
              </h3>
              
              {loading ? (
                <div className="py-10 text-center text-slate-400">Loading catalog...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {items.map(item => (
                    <button 
                      key={item._id}
                      onClick={() => addToCart(item)}
                      className="p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary hover:shadow-lg transition-all text-left flex flex-col gap-4 group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <span className="material-symbols-outlined">fastfood</span>
                        </div>
                        <span className="font-black text-slate-900">₹{item.price}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">{item.category}</p>
                        <p className="font-bold text-slate-900 line-clamp-1">{item.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Checkout */}
          <div className="col-span-12 lg:col-span-4">
            <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-900/20 sticky top-24">
              <h3 className="text-xl font-bold mb-8">Order Summary</h3>
              
              <div className="space-y-6 mb-10 max-h-96 overflow-y-auto no-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-10 opacity-30">
                    <span className="material-symbols-outlined text-4xl mb-2">shopping_basket</span>
                    <p className="text-xs font-bold uppercase tracking-widest">Cart Empty</p>
                  </div>
                ) : (
                  cart.map(i => (
                    <div key={i.cartId} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary rounded-full"></div>
                        <div>
                          <p className="text-sm font-bold">{i.name}</p>
                          <p className="text-[10px] text-white/50">₹{i.price}</p>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(i.cartId)} className="text-white/20 hover:text-red-400">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-white/10 pt-8 space-y-4">
                <div className="flex justify-between items-center text-white/60">
                  <span className="text-[10px] font-black uppercase tracking-widest">Customer</span>
                  <span className="text-xs font-bold">{selectedStudent?.userId?.name || 'Not Selected'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest">Grand Total</span>
                  <span className="text-3xl font-black text-primary">₹{total.toFixed(2)}</span>
                </div>
                
                <button 
                  disabled={submitting || !selectedStudent || cart.length === 0}
                  onClick={placeOrder}
                  className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-primary hover:text-white transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Processing...' : (
                    <>
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      Complete Checkout
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VendorPOS;
