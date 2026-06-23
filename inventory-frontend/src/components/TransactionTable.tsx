'use client';

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

interface TransactionTableProps {
  transactions: Transaction[];
  showItemName?: boolean;
}

export default function TransactionTable({ transactions, showItemName = false }: TransactionTableProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 sm:py-12">
        <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-gray-500 text-sm">No transactions yet</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              {showItemName && (
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
              )}
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Done By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-600">{formatDate(tx.createdAt)}</td>
                {showItemName && (
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{tx.itemName}</td>
                )}
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    tx.transactionType === 'ADD'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {tx.transactionType === 'ADD' ? '↑' : '↓'}
                    {tx.transactionType}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm font-semibold text-gray-900">{tx.quantity}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{tx.note || '—'}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{tx.username}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden divide-y divide-gray-100">
        {transactions.map((tx) => (
          <div key={tx.id} className="px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  tx.transactionType === 'ADD'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {tx.transactionType === 'ADD' ? '↑' : '↓'}
                  {tx.transactionType}
                </span>
                <span className="text-sm font-bold text-gray-900">×{tx.quantity}</span>
              </div>
              <span className="text-xs text-gray-400">{formatDateShort(tx.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 truncate">
                {showItemName && <span className="font-medium text-gray-700">{tx.itemName} · </span>}
                {tx.note || 'No note'}
              </div>
              <span className="text-xs text-gray-400 ml-2 flex-shrink-0">by {tx.username}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
