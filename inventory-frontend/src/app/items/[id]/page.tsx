'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import StockModal from '@/components/StockModal';
import TransactionTable from '@/components/TransactionTable';

interface Item {
  id: number;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  transactions: Transaction[];
}

interface Transaction {
  id: number;
  itemId: number;
  itemName: string;
  username: string;
  transactionType: string;
  quantity: number;
  note: string;
  createdAt: string;
}

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [stockModal, setStockModal] = useState<{
    isOpen: boolean;
    type: 'ADD' | 'REMOVE';
  }>({ isOpen: false, type: 'ADD' });

  const id = params.id as string;

  const fetchItem = useCallback(async () => {
    try {
      const res = await api.get(`/items/${id}`);
      setItem(res.data);
    } catch (error) {
      console.error('Error fetching item:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const getQuantityColor = (qty: number) => {
    if (qty < 5) return 'text-red-600 bg-red-50 border-red-200';
    if (qty <= 10) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-semibold text-gray-900">Item not found</h2>
        <button onClick={() => router.push('/items')} className="mt-4 text-indigo-600 text-sm hover:underline">
          ← Back to Inventory
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push('/items')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4 sm:mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Inventory
      </button>

      {/* Item Detail Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
        {/* Header — stacked on mobile, side-by-side on desktop */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{item.name}</h1>
            {item.description && (
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setStockModal({ isOpen: true, type: 'ADD' })}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Stock
            </button>
            <button
              onClick={() => setStockModal({ isOpen: true, type: 'REMOVE' })}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              Sell / Use
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-5 sm:mt-6">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Quantity</p>
            <p className={`text-xl sm:text-2xl font-bold mt-1 inline-flex items-center px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg border ${getQuantityColor(item.quantity)}`}>
              {item.quantity}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Unit</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900 mt-1">{item.unit || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Price</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900 mt-1">
              {item.price ? `₹${Number(item.price).toFixed(2)}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Value</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900 mt-1">
              {item.price ? `₹${(item.quantity * Number(item.price)).toFixed(2)}` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Transaction History</h2>
          <p className="text-xs sm:text-sm text-gray-500">All stock movements for this item</p>
        </div>
        <TransactionTable transactions={item.transactions || []} />
      </div>

      {/* Stock Modal */}
      <StockModal
        isOpen={stockModal.isOpen}
        onClose={() => setStockModal({ ...stockModal, isOpen: false })}
        itemId={item.id}
        itemName={item.name}
        type={stockModal.type}
        onSuccess={fetchItem}
      />
    </div>
  );
}
