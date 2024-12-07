"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Image from 'next/image';
import Link from 'next/link';

// Map SimpleSwap API statuses to our display statuses
const StatusMapping = {
  waiting: 'Pending deposit',
  confirming: 'Confirming',
  exchanging: 'Exchanging',
  sending: 'Sending',
  finished: 'Sending', // Show as sending until complete
  failed: 'Failed',
  refunded: 'Refunded',
  expired: 'Expired'
};

const ExchangeStatus = {
  PENDING_DEPOSIT: 'Pending deposit',
  CONFIRMING: 'Confirming',
  EXCHANGING: 'Exchanging',
  SENDING: 'Sending',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  EXPIRED: 'Expired'
};

const ProgressBar = ({ currentStatus }) => {
  const statuses = [
    ExchangeStatus.PENDING_DEPOSIT,
    ExchangeStatus.CONFIRMING,
    ExchangeStatus.EXCHANGING,
    ExchangeStatus.SENDING
  ];

  const getCurrentStep = () => {
    // Handle error states
    if (['Failed', 'Refunded', 'Expired'].includes(currentStatus)) {
      return 0; // Reset progress bar for error states
    }
    return statuses.indexOf(currentStatus) + 1;
  };

  return (
    <div className="mb-8">
      <div className="relative">
        {/* Background line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-700 -translate-y-1/2" />
        
        {/* Progress line */}
        <div 
          className={`absolute top-1/2 left-0 h-1 -translate-y-1/2 transition-all duration-500 ease-out ${
            ['Failed', 'Refunded', 'Expired'].includes(currentStatus)
              ? 'bg-red-500'
              : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
          }`}
          style={{ 
            width: `${((getCurrentStep() - 1) / (statuses.length - 1)) * 100}%`
          }}
        />

        {/* Status points */}
        <div className="relative flex justify-between">
          {statuses.map((status, index) => {
            const isCompleted = index < getCurrentStep() - 1;
            const isCurrent = index === getCurrentStep() - 1;
            const isPending = index > getCurrentStep() - 1;
            const isError = ['Failed', 'Refunded', 'Expired'].includes(currentStatus);

            return (
              <div key={status} className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300 ease-out
                    ${isError ? 'bg-red-500/20 border-2 border-red-500' : ''}
                    ${!isError && isCompleted ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-purple-500/30' : ''}
                    ${!isError && isCurrent ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-pink-500/30 scale-110' : ''}
                    ${!isError && isPending ? 'bg-gray-700' : ''}
                    ${!isError && (isCompleted || isCurrent) ? 'border-none' : 'border-2 border-gray-600'}
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className={`text-sm ${isCurrent ? 'text-white' : 'text-gray-400'}`}>
                      {index + 1}
                    </span>
                  )}
                </div>

                <div
                  className={`
                    mt-3 text-sm font-medium transition-all duration-300
                    ${isError ? 'text-red-400' : ''}
                    ${!isError && isCompleted ? 'text-purple-400' : ''}
                    ${!isError && isCurrent ? 'text-pink-400 scale-105' : ''}
                    ${!isError && isPending ? 'text-gray-500' : ''}
                  `}
                >
                  {status}
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  {isCompleted && "Completed"}
                  {isCurrent && "In Progress"}
                  {isPending && "Waiting"}
                  {isError && currentStatus}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Header = () => {
  return (
    <div className="absolute top-0 left-0 right-0 border-b border-white/10">
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Image
            src="/favicon1b66.ico"
            alt="SimpleSwap"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
            SimpleSwap
          </span>
        </div>

        {/* Back button */}
        <div className="flex items-center space-x-2">
          <Link 
            href="/"
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group"
          >
            <svg
              className="w-5 h-5 transform transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Loading component
const LoadingState = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-black text-white">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="animate-pulse flex flex-col items-center justify-center space-y-4">
        <div className="h-8 bg-blue-700/20 rounded w-64"></div>
        <div className="h-4 bg-blue-700/20 rounded w-48"></div>
        <div className="h-32 bg-blue-700/20 rounded w-full max-w-md"></div>
      </div>
    </div>
  </div>
);

// Client Component that uses useSearchParams
const PaymentContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentDetails, setPaymentDetails] = useState({
    currency_from: searchParams.get('currency_from') || '',
    address_from: searchParams.get('address_from') || '',
    amount: searchParams.get('amount') || '',
    exchange_id: searchParams.get('exchange_id') || ''
  });
  const [currentStatus, setCurrentStatus] = useState(ExchangeStatus.PENDING_DEPOSIT);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(paymentDetails.address_from);
      toast.success('Address copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy address');
    }
  };

  // Fetch exchange status
  useEffect(() => {
    if (!paymentDetails.exchange_id) {
      console.error('No exchange ID provided');
      return;
    }

    // Log exchange ID when component mounts
    console.log('🔄 Tracking Exchange ID:', paymentDetails.exchange_id);

    const fetchStatus = async () => {
      try {
        console.log('\n--- Fetching Exchange Status ---');
        console.log('📊 Exchange ID:', paymentDetails.exchange_id);
        
        const response = await fetch(
          `https://api.simpleswap.io/get_exchange?api_key=${process.env.NEXT_PUBLIC_SIMPLESWAP_API_KEY}&id=${paymentDetails.exchange_id}`,
          {
            headers: {
              'accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch exchange status');
        }

        const data = await response.json();
        
        // Log full response data
        console.log('📡 API Response:', {
          status: data.status,
          type: typeof data.status,
          timestamp: new Date().toLocaleTimeString(),
          fullData: data
        });

        // Map API status to our display status
        const mappedStatus = StatusMapping[data.status] || currentStatus;
        console.log('🔄 Status Mapping:', {
          apiStatus: data.status,
          mappedStatus: mappedStatus,
          previousStatus: currentStatus
        });

        setCurrentStatus(mappedStatus);

        // Show toast for completed or error states
        if (data.status === 'finished') {
          toast.success('Exchange completed successfully!');
          console.log('✅ Exchange completed!');
        } else if (['failed', 'refunded', 'expired'].includes(data.status)) {
          toast.error(`Exchange ${data.status}`);
          console.log('❌ Exchange error:', data.status);
        }
      } catch (error) {
        console.error('❌ Error fetching exchange status:', error);
        toast.error('Failed to update exchange status');
      }
    };

    // Initial fetch
    fetchStatus();

    // Set up polling every 10 seconds
    const intervalId = setInterval(() => {
      console.log('\n⏰ Polling interval triggered');
      fetchStatus();
    }, 10000);

    // Cleanup interval on unmount
    return () => {
      console.log('🧹 Cleaning up status polling');
      clearInterval(intervalId);
    };
  }, [paymentDetails.exchange_id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1426] via-[#0B1426] to-[#06090F] text-white flex items-center justify-center">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto rounded-2xl shadow-2xl overflow-hidden">
          {/* Glassy background wrapper */}
          <div className="backdrop-blur-xl bg-white/5 p-8 relative">
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-xy"></div>
            
            {/* Content */}
            <div className="relative">
              <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">Complete Your Payment</h1>
              
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-lg mb-2">Please send</p>
                  <p className="text-4xl font-bold text-green-400 mb-2">{paymentDetails.amount} {paymentDetails.currency_from.toUpperCase()}</p>
                  <p className="text-sm text-gray-400">to the following address</p>
                </div>

                <div className="bg-[#0B1426]/80 backdrop-blur-sm p-4 rounded-lg border border-blue-900/50">
                  <div className="flex items-center justify-between">
                    <div className="break-all">{paymentDetails.address_from}</div>
                    <button
                      onClick={handleCopyAddress}
                      className="ml-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <ProgressBar currentStatus={currentStatus} />

                <div className="bg-yellow-900/20 backdrop-blur-sm border border-yellow-700/30 text-yellow-200 p-4 rounded-lg">
                  <h2 className="font-bold mb-2">Important:</h2>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Send only {paymentDetails.currency_from.toUpperCase()} to this address</li>
                    <li>The payment should be sent in a single transaction</li>
                    <li>Make sure to send the exact amount shown above</li>
                    <li>The exchange rate will be locked after receiving the payment</li>
                  </ul>
                </div>

                <div className="text-center text-sm text-gray-400">
                  <p>The exchange will start automatically after receiving your payment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Payment Component with Suspense
export default function Payment() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PaymentContent />
    </Suspense>
  );
}
