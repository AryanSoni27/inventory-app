'use client';

import { useState } from 'react';
import api from '@/lib/api';

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: number;
  itemName: string;
  type: 'ADD' | 'REMOVE';
  onSuccess: () => void;
}

export default function StockModal({ isOpen, onClose, itemId, itemName, type, onSuccess }: StockModalProps) {
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/transactions', {
        itemId,
        transactionType: type,
        quantity: parseInt(quantity) || 1,
        note,
      });
      setQuantity('1');
      setNote('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'An error occurred';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm modal-overlay" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 modal-content">
        <div className={`px-6 py-4 rounded-t-xl border-b ${type === 'ADD' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
          }`}>
          <h3 className={`text-lg font-semibold ${type === 'ADD' ? 'text-emerald-800' : 'text-red-800'
            }`}>
            {type === 'ADD' ? '📦 Add Stock' : '📤 Remove Stock'}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{itemName}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Note <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={type === 'ADD' ? 'e.g. Restock from supplier' : 'e.g. Sold to customer'}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 ${type === 'ADD'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
                }`}
            >
              {loading ? 'Processing...' : type === 'ADD' ? 'Add Stock' : 'Remove Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
