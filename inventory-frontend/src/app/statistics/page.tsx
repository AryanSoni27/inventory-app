'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import api from '@/lib/api';
import { DateRangePicker, Range } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

// --- Types ---
interface SummaryData {
  totalTransactions: number;
  totalQuantitySold: number;
  totalQuantityRestocked: number;
  totalItemsAffected: number;
  mostSoldItem: { itemId: number; itemName: string; totalQuantity: number } | null;
  mostRestockedItem: { itemId: number; itemName: string; totalQuantity: number } | null;
}

interface TrendDataPoint {
  period: string;
  label: string;
  sold: number;
  restocked: number;
  net: number;
}

interface ItemBreakdown {
  itemId: number;
  itemName: string;
  unit: string;
  totalSold: number;
  totalRestocked: number;
  transactionCount: number;
  lastTransactionDate: string;
}

interface ItemBreakdownPage {
  content: ItemBreakdown[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

interface Presets {
  [key: string]: { startDate: string; endDate: string };
}

// --- CountUp Component ---
const CountUp = ({ end, duration = 1000 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count.toLocaleString()}</span>;
};

// --- Main Page ---
export default function StatisticsPage() {
  const router = useRouter();

  // States
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<Range[]>([{
    startDate: new Date(dateRange.startDate),
    endDate: new Date(dateRange.endDate),
    key: 'selection'
  }]);

  const [activePreset, setActivePreset] = useState('thisMonth');
  const [transactionType, setTransactionType] = useState<'ALL' | 'REMOVE' | 'ADD'>('ALL');
  const [groupBy, setGroupBy] = useState('monthly');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState('sold');
  const [searchQuery, setSearchQuery] = useState('');

  // Data States
  const [presets, setPresets] = useState<Presets | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [itemsData, setItemsData] = useState<ItemBreakdownPage | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Presets on Mount
  useEffect(() => {
    api.get('/statistics/presets').then(res => {
      setPresets(res.data);
      if (res.data.thisMonth) {
        setDateRange(res.data.thisMonth);
      }
    }).catch(console.error);
  }, []);

  // Fetch Main Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };
      if (transactionType !== 'ALL') params.type = transactionType;

      const itemsParams = { ...params, sortBy, page, size };
      const trendParams = { ...params, groupBy };

      const [summaryRes, trendRes, itemsRes] = await Promise.all([
        api.get('/statistics/summary', { params }),
        api.get('/statistics/trends', { params: trendParams }),
        api.get('/statistics/items', { params: itemsParams })
      ]);

      setSummaryData(summaryRes.data);
      setTrendData(trendRes.data.data);
      setItemsData(itemsRes.data);
    } catch (error) {
      console.error("Failed to fetch statistics", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, transactionType, groupBy, page, size, sortBy]);

  useEffect(() => {
    if (presets) fetchData();
  }, [fetchData, presets]);

  // Handlers
  const handlePresetClick = (presetKey: string) => {
    if (presets && presets[presetKey]) {
      setActivePreset(presetKey);
      setDateRange(presets[presetKey]);
      setShowDatePicker(false);
    } else if (presetKey === 'custom') {
      setActivePreset('custom');
      setShowDatePicker(true);
    }
  };

  const handleApplyCustomDate = () => {
    if (tempDateRange[0].startDate && tempDateRange[0].endDate) {
      setDateRange({
        startDate: tempDateRange[0].startDate.toISOString().split('T')[0],
        endDate: tempDateRange[0].endDate.toISOString().split('T')[0]
      });
      setShowDatePicker(false);
    }
  };

  const handleExportCSV = () => {
    if (!itemsData || !itemsData.content) return;
    
    const headers = ['Item Name', 'Unit', 'Total Sold', 'Total Restocked', 'Total Transactions', 'Last Activity Date'];
    const rows = itemsData.content.map(item => [
      `"${item.itemName.replace(/"/g, '""')}"`,
      item.unit || '',
      item.totalSold,
      item.totalRestocked,
      item.transactionCount,
      item.lastTransactionDate ? format(parseISO(item.lastTransactionDate), 'yyyy-MM-dd HH:mm') : ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory-stats-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredItems = useMemo(() => {
    if (!itemsData) return [];
    if (!searchQuery) return itemsData.content;
    return itemsData.content.filter(item => 
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [itemsData, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* SECTION 1 — HEADER + FILTER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Statistics & Analytics</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Track your inventory movement over time</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'thisWeek', label: 'This Week' },
              { key: 'thisMonth', label: 'This Month' },
              { key: 'thisQuarter', label: 'This Quarter' },
              { key: 'thisYear', label: 'This Year' },
              { key: 'lastWeek', label: 'Last Week' },
              { key: 'lastMonth', label: 'Last Month' },
              { key: 'lastQuarter', label: 'Last Quarter' },
              { key: 'custom', label: 'Custom ▼' }
            ].map(preset => (
              <button
                key={preset.key}
                onClick={() => handlePresetClick(preset.key)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all ${
                  activePreset === preset.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-gray-200 hidden lg:block mx-2"></div>

          <div className="flex items-center gap-2 w-full lg:w-auto mt-4 lg:mt-0">
            <span className="text-sm font-medium text-gray-700">Type:</span>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'REMOVE', label: 'Sold Only' },
                { key: 'ADD', label: 'Restock' }
              ].map(type => (
                <button
                  key={type.key}
                  onClick={() => setTransactionType(type.key as 'ALL' | 'REMOVE' | 'ADD')}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                    transactionType === type.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {showDatePicker && (
          <div className="mt-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
            <div className="overflow-x-auto pb-4">
              <DateRangePicker
                ranges={tempDateRange}
                onChange={item => setTempDateRange([item.selection])}
                months={2}
                direction="horizontal"
                className="bg-transparent"
                rangeColors={['#4f46e5']}
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowDatePicker(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleApplyCustomDate} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm">Apply Range</button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2 — SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          {
            title: 'Total Sold',
            value: summaryData?.totalQuantitySold || 0,
            color: 'red',
            icon: '🔴',
            subtext: summaryData?.mostSoldItem ? `Most sold: ${summaryData.mostSoldItem.itemName} (${summaryData.mostSoldItem.totalQuantity})` : 'No items sold'
          },
          {
            title: 'Total Restocked',
            value: summaryData?.totalQuantityRestocked || 0,
            color: 'green',
            icon: '🟢',
            subtext: summaryData?.mostRestockedItem ? `Most restock: ${summaryData.mostRestockedItem.itemName} (${summaryData.mostRestockedItem.totalQuantity})` : 'No items restocked'
          },
          {
            title: 'Items Affected',
            value: summaryData?.totalItemsAffected || 0,
            color: 'blue',
            icon: '📦',
            subtext: 'Distinct items with activity'
          },
          {
            title: 'Total Transactions',
            value: summaryData?.totalTransactions || 0,
            color: 'indigo',
            icon: '🔄',
            subtext: 'Total stock movements'
          }
        ].map((card, i) => (
          <div key={i} className={`bg-white rounded-xl border border-${card.color}-100 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-medium text-gray-500">{card.icon} {card.title}</h3>
            </div>
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1 mb-2"></div>
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                <CountUp end={card.value} /> {card.title.includes('Total') && !card.title.includes('Transactions') ? 'pcs' : card.title.includes('Items') ? 'items' : 'txns'}
              </p>
            )}
            <p className="text-xs text-gray-500 truncate">{loading ? <span className="inline-block h-4 w-32 bg-gray-200 animate-pulse rounded"></span> : card.subtext}</p>
            <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-10 bg-${card.color}-500`}></div>
          </div>
        ))}
      </div>

      {/* SECTION 3 — TREND CHART */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Stock Movement Over Time</h2>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {['daily', 'weekly', 'monthly', 'quarterly'].map(g => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                  groupBy === g ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading chart data...</div>
          ) : trendData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              <p>No transactions in this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontSize: '13px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />
                {transactionType !== 'ADD' && <Bar dataKey="sold" name="Sold" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={50} />}
                {transactionType !== 'REMOVE' && <Bar dataKey="restocked" name="Restocked" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />}
                <Line type="monotone" dataKey="net" name="Net Change" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* SECTION 4 — PER ITEM BREAKDOWN TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Item-wise Breakdown</h2>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-48">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="sold">Most Sold ▼</option>
                <option value="restocked">Most Restocked</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Item Name</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Total Sold</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Total Restocked</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Trend</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Txns</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-gray-500"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">No items found for the selected period</td></tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const total = item.totalSold + item.totalRestocked;
                  const soldPct = total > 0 ? (item.totalSold / total) * 100 : 0;
                  const restockedPct = total > 0 ? (item.totalRestocked / total) * 100 : 0;

                  return (
                    <tr key={item.itemId} onClick={() => router.push(`/items/${item.itemId}`)} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                      <td className="py-4 px-6 text-sm text-gray-500">{page * size + idx + 1}</td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.itemName}</span>
                        {item.unit && <span className="ml-2 text-xs text-gray-400">({item.unit})</span>}
                      </td>
                      <td className="py-4 px-6"><span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-red-50 text-red-700">{item.totalSold}</span></td>
                      <td className="py-4 px-6"><span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">{item.totalRestocked}</span></td>
                      <td className="py-4 px-6">
                        {total > 0 ? (
                          <div className="w-20 h-2 bg-gray-100 rounded-full flex overflow-hidden">
                            <div style={{ width: `${soldPct}%` }} className="bg-red-500"></div>
                            <div style={{ width: `${restockedPct}%` }} className="bg-emerald-500"></div>
                          </div>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{item.transactionCount}</td>
                      <td className="py-4 px-6 text-sm text-gray-500 whitespace-nowrap">
                        {item.lastTransactionDate ? formatDistanceToNow(parseISO(item.lastTransactionDate), { addSuffix: true }) : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {itemsData && itemsData.totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium">{page * size + 1}</span> to <span className="font-medium">{Math.min((page + 1) * size, itemsData.totalElements)}</span> of <span className="font-medium">{itemsData.totalElements}</span> items
            </p>
            <div className="flex items-center gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Previous</button>
              <div className="flex gap-1 hidden sm:flex">
                {Array.from({ length: itemsData.totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-all ${
                      page === i ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button disabled={page === itemsData.totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Next</button>
            </div>
            <div className="hidden sm:block">
              <select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium outline-none">
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
