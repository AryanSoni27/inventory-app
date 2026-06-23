'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import TransactionTable from '@/components/TransactionTable';

interface Item {
  id: number;
  name: string;
  quantity: number;
  price: number;
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

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, txRes] = await Promise.all([
        api.get('/items'),
        api.get('/transactions/recent'),
      ]);
      setItems(itemsRes.data);
      setTransactions(txRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalItems = items.length;
  const lowStockItems = items.filter((item) => item.quantity < 5).length;
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0);

  const stats = [
    {
      label: 'Total Items',
      value: totalItems,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Low Stock Items',
      value: lowStockItems,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      color: 'bg-amber-50 text-amber-600',
      borderColor: 'border-amber-200',
    },
    {
      label: 'Total Stock Value',
      value: `₹${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-emerald-50 text-emerald-600',
      borderColor: 'border-emerald-200',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Overview of your inventory status</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-xl border ${stat.borderColor} p-4 sm:p-6 hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <p className="text-xs sm:text-sm text-gray-500">Last 10 stock movements across all items</p>
        </div>
        <TransactionTable transactions={transactions} showItemName={true} />
      </div>
    </div>
  );
}
