'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

interface ItemSummary {
  itemName: string;
  soldQuantity: number;
  restockedQuantity: number;
  transactionCount: number;
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

interface Statistics {
  totalSoldQuantity: number;
  totalRestockedQuantity: number;
  totalTransactions: number;
  itemSummaries: ItemSummary[];
  transactions: Transaction[];
}

type FilterType = 'ALL' | 'REMOVE' | 'ADD';

function getDefaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    start: start.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0],
  };
}

export default function StatisticsPage() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [data, setData] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { start: startDate, end: endDate };
      if (filter !== 'ALL') params.type = filter;
      const res = await api.get('/transactions/statistics', { params });
      setData(res.data);
    } catch {
      setError('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, filter]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const setPreset = (preset: 'week' | 'month' | 'quarter') => {
    const now = new Date();
    let start: Date;
    if (preset === 'week') {
      const day = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    } else if (preset === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
    }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Statistics</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Track sold and restocked items over time</p>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6">
        {/* Date range */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4 mb-4">
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setPreset('week')} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">
            This Week
          </button>
          <button onClick={() => setPreset('month')} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">
            This Month
          </button>
          <button onClick={() => setPreset('quarter')} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">
            This Quarter
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {([
            { key: 'ALL', label: 'All' },
            { key: 'REMOVE', label: 'Sold' },
            { key: 'ADD', label: 'Restocked' },
          ] as { key: FilterType; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${
                filter === tab.key
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <div className="bg-white rounded-xl border border-red-200 p-4 sm:p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Total Sold</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{data.totalSoldQuantity.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-emerald-200 p-4 sm:p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Total Restocked</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{data.totalRestockedQuantity.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-blue-200 p-4 sm:p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Total Transactions</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{data.totalTransactions.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Item Breakdown */}
          {data.itemSummaries.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Item Breakdown</h2>
                <p className="text-xs sm:text-sm text-gray-500">Per-item sold & restocked summary</p>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sold</th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Restocked</th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.itemSummaries.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-6 text-sm font-semibold text-gray-900">{item.itemName}</td>
                        <td className="py-3 px-6">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            {item.soldQuantity}
                          </span>
                        </td>
                        <td className="py-3 px-6">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            {item.restockedQuantity}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-600">{item.transactionCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {data.itemSummaries.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.itemName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.transactionCount} transactions</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        -{item.soldQuantity}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        +{item.restockedQuantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Transactions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">All Transactions</h2>
              <p className="text-xs sm:text-sm text-gray-500">{data.transactions.length} transactions in selected period</p>
            </div>

            {data.transactions.length === 0 ? (
              <div className="p-8 sm:p-16 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">No transactions found</h3>
                <p className="text-xs text-gray-500">Try adjusting the date range or filter.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-6 text-sm font-semibold text-gray-900">{tx.itemName}</td>
                          <td className="py-3 px-6">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              tx.transactionType === 'REMOVE'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {tx.transactionType === 'REMOVE' ? '↓ Sold' : '↑ Restocked'}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-sm font-medium text-gray-900">{tx.quantity}</td>
                          <td className="py-3 px-6 text-sm text-gray-600">{tx.username}</td>
                          <td className="py-3 px-6 text-sm text-gray-500 max-w-xs truncate">{tx.note || '—'}</td>
                          <td className="py-3 px-6 text-xs text-gray-500 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {data.transactions.map((tx) => (
                    <div key={tx.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm font-semibold text-gray-900 truncate">{tx.itemName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{tx.username} · {formatDate(tx.createdAt)}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                          tx.transactionType === 'REMOVE'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {tx.transactionType === 'REMOVE' ? '↓ Sold' : '↑ Restocked'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-medium text-gray-900">Qty: {tx.quantity}</span>
                        {tx.note && <span className="text-gray-500 truncate">{tx.note}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
