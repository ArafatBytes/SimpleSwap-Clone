"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const mockTransactions = [
  {
    id: '1',
    timestamp: '2024-01-20T10:30:00Z',
    sendCurrency: {
      symbol: 'BTC',
      amount: 0.05,
    },
    receiveCurrency: {
      symbol: 'ETH',
      amount: 0.75,
    },
    status: 'completed',
    exchangeRate: '1 BTC = 15 ETH'
  },
  {
    id: '2',
    timestamp: '2024-01-19T15:45:00Z',
    sendCurrency: {
      symbol: 'ETH',
      amount: 2.0,
    },
    receiveCurrency: {
      symbol: 'USDT',
      amount: 4000,
    },
    status: 'completed',
    exchangeRate: '1 ETH = 2000 USDT'
  },
  {
    id: '3',
    timestamp: '2024-01-20T09:15:00Z',
    sendCurrency: {
      symbol: 'USDT',
      amount: 1000,
    },
    receiveCurrency: {
      symbol: 'BNB',
      amount: 3.5,
    },
    status: 'pending',
    exchangeRate: '1 USDT = 0.0035 BNB'
  }
];

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, pending
  const [sortBy, setSortBy] = useState('date'); // date, amount
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc

  useEffect(() => {
    // Simulate API call to fetch transactions
    const fetchTransactions = async () => {
      try {
        // In a real implementation, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        setTransactions(mockTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const getFilteredAndSortedTransactions = () => {
    let filtered = [...transactions];

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(t => t.status === filter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc'
          ? new Date(b.timestamp) - new Date(a.timestamp)
          : new Date(a.timestamp) - new Date(b.timestamp);
      }
      return 0;
    });

    return filtered;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#062763] via-[#041d47] to-[#031335] flex items-center justify-center">
        <div className="text-lg text-white">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#062763] via-[#041d47] to-[#031335]">
      {/* Header Section */}
      <div className="bg-[#062763]">
        <div className="max-w-7xl mx-auto">
          <header className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <Image
                src="/favicon1b66.ico"
                alt="SimpleSwap Icon"
                width={32}
                height={32}
                className="text-white"
              />
              <span className="text-[14px] sm:text-[16px] md:text-[18px] font-semibold text-white">SimpleSwap</span>
            </div>

            {/* Back Arrow with Text */}
            <Link 
              href="/" 
              className="text-white hover:text-gray-200 transition-colors flex items-center gap-2"
              aria-label="Back to Home"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="text-[14px] sm:text-[16px]">Back to home</span>
            </Link>
          </header>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 mt-8">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/20">
            <h1 className="text-3xl font-normal text-white text-center tracking-wide font-playfair">Transaction History</h1>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-white/20 flex flex-wrap gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30 font-light tracking-wide text-sm"
            >
              <option value="all" className="bg-[#062763]">All Status</option>
              <option value="completed" className="bg-[#062763]">Completed</option>
              <option value="pending" className="bg-[#062763]">Pending</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30 font-light tracking-wide text-sm"
            >
              <option value="date" className="bg-[#062763]">Sort by Date</option>
              <option value="amount" className="bg-[#062763]">Sort by Amount</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30 hover:bg-white/20 transition-colors font-light tracking-wide text-sm"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Transactions List */}
          <div className="divide-y divide-white/10">
            {getFilteredAndSortedTransactions().map((transaction) => (
              <div key={transaction.id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Transaction Info */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-6 rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg ${
                        transaction.sendCurrency.symbol === 'BTC' ? 'from-orange-400 to-orange-600 shadow-orange-500/20' :
                        transaction.sendCurrency.symbol === 'ETH' ? 'from-blue-400 to-blue-600 shadow-blue-500/20' :
                        transaction.sendCurrency.symbol === 'USDT' ? 'from-green-400 to-green-600 shadow-green-500/20' :
                        transaction.sendCurrency.symbol === 'BNB' ? 'from-yellow-400 to-yellow-600 shadow-yellow-500/20' :
                        'from-purple-400 to-purple-600 shadow-purple-500/20'
                      }`}>
                        <span className="text-white font-semibold text-[10px]">{transaction.sendCurrency.symbol}</span>
                      </div>
                      <div>
                        <div className="text-sm font-light tracking-wide text-white">
                          {transaction.sendCurrency.amount} {transaction.sendCurrency.symbol}
                        </div>
                      </div>
                    </div>

                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/60" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>

                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-6 rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg ${
                        transaction.receiveCurrency.symbol === 'BTC' ? 'from-orange-400 to-orange-600 shadow-orange-500/20' :
                        transaction.receiveCurrency.symbol === 'ETH' ? 'from-blue-400 to-blue-600 shadow-blue-500/20' :
                        transaction.receiveCurrency.symbol === 'USDT' ? 'from-green-400 to-green-600 shadow-green-500/20' :
                        transaction.receiveCurrency.symbol === 'BNB' ? 'from-yellow-400 to-yellow-600 shadow-yellow-500/20' :
                        'from-purple-400 to-purple-600 shadow-purple-500/20'
                      }`}>
                        <span className="text-white font-semibold text-[10px]">{transaction.receiveCurrency.symbol}</span>
                      </div>
                      <div>
                        <div className="text-sm font-light tracking-wide text-white">
                          {transaction.receiveCurrency.amount} {transaction.receiveCurrency.symbol}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status and Date */}
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wider uppercase
                      ${transaction.status === 'completed' 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      {transaction.status}
                    </span>
                    <span className="text-sm font-light tracking-wide text-white/70">
                      {formatDate(transaction.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Exchange Rate */}
                <div className="mt-2 text-sm font-light tracking-wide text-white/70">
                  Rate: {transaction.exchangeRate}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {getFilteredAndSortedTransactions().length === 0 && (
            <div className="px-6 py-8 text-center text-white/70 font-light tracking-wide">
              No transactions found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
