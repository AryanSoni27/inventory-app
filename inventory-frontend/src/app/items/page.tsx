'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import StockModal from '@/components/StockModal';
import AddItemModal from '@/components/AddItemModal';

interface Item {
  id: number;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stockModal, setStockModal] = useState<{
    isOpen: boolean;
    itemId: number;
    itemName: string;
    type: 'ADD' | 'REMOVE';
  }>({ isOpen: false, itemId: 0, itemName: '', type: 'ADD' });
  const router = useRouter();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/items/${id}`);
      fetchItems();
    } catch (error: unknown) {
      const errMsg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error deleting item';
      alert(errMsg);
    }
  };

  const getQuantityColor = (qty: number) => {
    if (qty < 5) return 'bg-red-100 text-red-700';
    if (qty <= 10) return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{items.length} items in stock</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Add Item</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 sm:p-16 text-center">
          <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">No items yet</h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-4">Get started by adding your first inventory item.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add First Item
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="text-right py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{item.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{item.unit || '—'}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getQuantityColor(item.quantity)}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900 font-medium">
                      {item.price ? `₹${Number(item.price).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/items/${item.id}`)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setStockModal({ isOpen: true, itemId: item.id, itemName: item.name, type: 'ADD' })}
                          className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all"
                        >
                          + Stock
                        </button>
                        <button
                          onClick={() => setStockModal({ isOpen: true, itemId: item.id, itemName: item.name, type: 'REMOVE' })}
                          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                        >
                          Sell
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
              >
                {/* Item header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getQuantityColor(item.quantity)}`}>
                    {item.quantity} {item.unit || 'pcs'}
                  </span>
                </div>

                {/* Item meta */}
                <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                  {item.price ? (
                    <span className="font-medium text-gray-700">₹{Number(item.price).toFixed(2)}</span>
                  ) : null}
                  {item.price ? (
                    <span>Total: ₹{(item.quantity * Number(item.price)).toFixed(2)}</span>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/items/${item.id}`)}
                    className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all text-center"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setStockModal({ isOpen: true, itemId: item.id, itemName: item.name, type: 'ADD' })}
                    className="flex-1 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all text-center"
                  >
                    + Stock
                  </button>
                  <button
                    onClick={() => setStockModal({ isOpen: true, itemId: item.id, itemName: item.name, type: 'REMOVE' })}
                    className="flex-1 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all text-center"
                  >
                    Sell
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="p-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchItems}
      />
      <StockModal
        isOpen={stockModal.isOpen}
        onClose={() => setStockModal({ ...stockModal, isOpen: false })}
        itemId={stockModal.itemId}
        itemName={stockModal.itemName}
        type={stockModal.type}
        onSuccess={fetchItems}
      />
    </div>
  );
}
