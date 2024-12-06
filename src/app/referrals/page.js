"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ReferralDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (!data.isAuthenticated) {
          router.push('/login');
          return;
        }

        setIsAuthenticated(true);
        setUserEmail(data.user.email || '');
        setReferralCode(data.user.referralCode || '');
        setReferralCount(data.user.referralCount || 0);
        setReferralEarnings(data.user.referralEarnings || 0);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const copyReferralLink = () => {
    const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-black text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-blue-700/20 rounded w-64"></div>
            <div className="h-4 bg-blue-700/20 rounded w-48"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-black flex flex-col">
      {/* Header */}
      <header className="bg-transparent border-b border-gray-800">
        <nav className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/favicon1b66.ico"
                alt="SimpleSwap Icon"
                width={32}
                height={32}
              />
              <span className="text-[14px] sm:text-[16px] md:text-[18px] font-semibold text-white">
                SimpleSwap
              </span>
            </Link>

            {/* Back to Home Link */}
            <Link 
              href="/" 
              className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors duration-200"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-7xl">
          <div className="bg-blue-900/20 backdrop-blur-sm rounded-lg p-8 border border-blue-500/20">
            <h1 className="text-3xl font-bold text-white mb-8 text-center">Referral Dashboard</h1>
            
            {/* Referral Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-800/20 rounded-lg p-6 border border-blue-500/20">
                <h3 className="text-lg font-semibold text-white mb-2">Your Referral Code</h3>
                <p className="text-2xl font-bold text-blue-400">{referralCode}</p>
              </div>
              
              <div className="bg-blue-800/20 rounded-lg p-6 border border-blue-500/20">
                <h3 className="text-lg font-semibold text-white mb-2">Total Referrals</h3>
                <p className="text-2xl font-bold text-blue-400">{referralCount}</p>
              </div>
              
              <div className="bg-blue-800/20 rounded-lg p-6 border border-blue-500/20">
                <h3 className="text-lg font-semibold text-white mb-2">Total Earnings</h3>
                <p className="text-2xl font-bold text-blue-400">${(referralEarnings || 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Referral Link Section */}
            <div className="bg-blue-800/20 rounded-lg p-6 border border-blue-500/20 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Your Referral Link</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <input
                  type="text"
                  value={`${process.env.NEXT_PUBLIC_SITE_URL || typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${referralCode}`}
                  className="flex-1 bg-blue-900/40 border border-blue-500/30 rounded-lg px-4 py-2 text-white text-sm min-w-0"
                  readOnly
                />
                <button
                  onClick={copyReferralLink}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* How it Works */}
            <div className="bg-blue-800/20 rounded-lg p-6 border border-blue-500/20">
              <h3 className="text-xl font-semibold text-white mb-4">How it Works</h3>
              <div className="space-y-4 text-gray-300">
                <p>1. Share your unique referral link with friends</p>
                <p>2. When they sign up using your link, they become your referral</p>
                <p>3. Earn 0.5% of the transaction amount when your referrals make exchanges</p>
                <p>4. Track your earnings and referrals in this dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
