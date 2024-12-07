"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { cryptoCategories } from '../../data/cryptoCategories';
import { toast } from 'react-toastify';
import { getExchangeRate, getAllCurrencies } from '../../lib/api/simpleswap';
import { validateAddress } from '../../lib/utils/addressValidator';
import { 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon, 
  IdentificationIcon,
  UsersIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

export default function Exchange() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [getAmount, setGetAmount] = useState('');
  const [selectedSendCrypto, setSelectedSendCrypto] = useState(null);
  const [selectedGetCrypto, setSelectedGetCrypto] = useState(null);
  const [showSendDropdown, setShowSendDropdown] = useState(false);
  const [showGetDropdown, setShowGetDropdown] = useState(false);
  const [sendSearchQuery, setSendSearchQuery] = useState('');
  const [getSearchQuery, setGetSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState(1);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [extraId, setExtraId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [minAmountError, setMinAmountError] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isButtonClick, setIsButtonClick] = useState(false);
  const [cryptocurrencies, setCryptocurrencies] = useState([]);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [verificationCheckInterval, setVerificationCheckInterval] = useState(null);
  const [addressError, setAddressError] = useState('');

  const sendDropdownRef = useRef(null);
  const getDropdownRef = useRef(null);
  const accountDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sendDropdownRef.current && !sendDropdownRef.current.contains(event.target)) {
        setShowSendDropdown(false);
      }
      if (getDropdownRef.current && !getDropdownRef.current.contains(event.target)) {
        setShowGetDropdown(false);
      }
      if (!isButtonClick && accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setIsAccountDropdownOpen(false);
      }
      setIsButtonClick(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isButtonClick]);

  useEffect(() => {
    if (step === 4) {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = process.env.NEXT_PUBLIC_SIMPLESWAP_API_KEY;
      console.log('SimpleSwap API Key present:', !!apiKey);
      if (!apiKey) {
        console.error('SimpleSwap API key is not configured');
      }
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        setIsAuthenticated(data.isAuthenticated);
        setIsVerified(data.user?.isVerified || false);
        if (data.isAuthenticated && data.user?.email) {
          setUserEmail(data.user.email);
          localStorage.setItem('userEmail', data.user.email);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setIsVerified(false);
        setUserEmail('');
        localStorage.removeItem('userEmail');
      }
    };

    const fetchCurrencies = async () => {
      try {
        setIsLoading(true);
        const currencies = await getAllCurrencies();
        if (currencies.length > 0) {
          setCryptocurrencies(currencies);
          
          // Find BTC and ETH in the currencies list
          const btc = currencies.find(c => c.symbol.toUpperCase() === 'BTC');
          const eth = currencies.find(c => c.symbol.toUpperCase() === 'ETH');
          
          // Set BTC and ETH as default if found, otherwise use first two currencies
          setSelectedSendCrypto(btc || currencies[0]);
          setSelectedGetCrypto(eth || currencies[1]);
        }
      } catch (error) {
        console.error('Failed to fetch currencies:', error);
        toast.error('Failed to load currencies. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    fetchCurrencies();
  }, []);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    if (token && email) {
      setIsAuthenticated(true);
      setUserEmail(email);
    } else {
      setIsAuthenticated(false);
      setUserEmail('');
    }
  }, []);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const response = await fetch('/api/auth/verification-status');
        console.log('Verification status response:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Frontend received verification status:', data);
          setIsVerified(data.isVerified);
          console.log('Updated isVerified state:', data.isVerified);
        } else {
          const errorData = await response.json();
          console.error('Verification status error:', errorData);
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    if (isAuthenticated) {
      console.log('Starting verification status check for authenticated user');
      // Check immediately
      checkVerificationStatus();
      
      // Set up interval for periodic checks
      const interval = setInterval(checkVerificationStatus, 60000); // Check every minute
      setVerificationCheckInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      console.log('User not authenticated, clearing verification check interval');
      // Clear interval if user is not authenticated
      if (verificationCheckInterval) {
        clearInterval(verificationCheckInterval);
        setVerificationCheckInterval(null);
      }
      setIsVerified(false);
    }
  }, [isAuthenticated]);

  // Filter cryptocurrencies based on category and search query
  const getFilteredCryptos = (searchQuery, category = 'all') => {
    let filteredList = cryptocurrencies;

    // First filter by category
    if (category !== 'all') {
      filteredList = cryptocurrencies.filter(crypto => 
        cryptoCategories[category].includes(crypto.symbol.toUpperCase())
      );
    }

    // Then filter by search query if exists
    if (searchQuery) {
      return filteredList.filter(crypto => 
        crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filteredList;
  };

  // Get filtered lists for both dropdowns
  const filteredSendCryptos = getFilteredCryptos(sendSearchQuery, selectedCategory);
  const filteredGetCryptos = getFilteredCryptos(getSearchQuery, selectedCategory);

  const handleLogout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
    setUserEmail('');
    toast.info('Logging out...', {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      style: {
        background: 'rgba(23, 63, 136, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: '#fff',
      },
    });

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    setIsMobileMenuOpen(false);
  };

  const handleNumberInput = async (value, setter) => {
    // Allow empty string
    if (value === '') {
      setter('');
      if (setter === setSendAmount) {
        setGetAmount('');
        setMinAmountError(null);
      }
      return;
    }

    // Only allow numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setter(value);
      
      // If updating send amount, calculate and update get amount
      if (setter === setSendAmount && parseFloat(value) > 0) {
        try {
          const fromSymbol = selectedSendCrypto.symbol;
          const toSymbol = selectedGetCrypto.symbol;
          
          console.log('Requesting exchange rate for:', {
            fromSymbol,
            toSymbol,
            value
          });
          
          const result = await getExchangeRate(
            fromSymbol,
            toSymbol,
            value
          );
          
          console.log('Received exchange rate:', result);
          
          if (result.error === 'MIN_AMOUNT' && result.minAmount) {
            setGetAmount('');
            setMinAmountError({
              amount: result.minAmount,
              currency: result.currency
            });
          } else if (result.rate) {
            const formattedRate = parseFloat(result.rate).toFixed(8);
            console.log('Setting formatted rate:', formattedRate);
            setGetAmount(formattedRate);
            setMinAmountError(null);
          } else {
            setGetAmount('');
            setMinAmountError(null);
          }
        } catch (error) {
          console.error('Exchange rate error:', error);
          setGetAmount('');
          setMinAmountError(null);
        }
      }
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!selectedSendCrypto || !selectedGetCrypto || !sendAmount) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Show warning for unverified users attempting large transactions
      if (!isVerified && parseFloat(sendAmount) >= 1000) {
        toast.warning(
          'Important: For transactions of 1000+ units, ID verification is required to complete the exchange. Please verify your identity in your account settings.',
          {
            position: "top-center",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            style: {
              background: 'rgba(234, 179, 8, 0.9)',
              color: '#000',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '14px',
              maxWidth: '400px',
              textAlign: 'center'
            },
          }
        );
      }

      setStep(2);
    } else if (step === 2 && recipientAddress) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleExchange = async (e) => {
    e.preventDefault();

    if (!selectedSendCrypto || !selectedGetCrypto || !sendAmount || !recipientAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);

      // Debug logs
      console.log('Selected Send Crypto:', selectedSendCrypto);
      console.log('Selected Get Crypto:', selectedGetCrypto);
      console.log('Send Amount:', sendAmount);
      console.log('Recipient Address:', recipientAddress);

      // Format the request data exactly as SimpleSwap's example
      const exchangeData = {
        "fixed": false,
        "currency_from": selectedSendCrypto.symbol.toLowerCase(),
        "currency_to": selectedGetCrypto.symbol.toLowerCase(),
        "amount": sendAmount.toString(),
        "address_to": recipientAddress,
        "extra_id_to": extraId || "",
        "user_refund_address": "",
        "user_refund_extra_id": "",
        "isAuthenticated": isAuthenticated // Pass authentication status
      };

      console.log('Exchange Request Data:', JSON.stringify(exchangeData, null, 2));

      const response = await fetch('/api/create-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exchangeData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Exchange requested successfully');
        
        // Redirect to payment page with the necessary data
        router.push(`/payment?currency_from=${result.currency_from}&address_from=${result.address_from}&amount=${sendAmount}&exchange_id=${result.id}`);
      } else {
        toast.error(result.description || 'Failed to create exchange');
      }

    } catch (error) {
      console.error('Exchange error:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressChange = (e) => {
    const address = e.target.value;
    setRecipientAddress(address);
    
    if (selectedGetCrypto) {
      const validation = validateAddress(address, selectedGetCrypto.symbol);
      setAddressError(validation.message);
    }
  };

  const isNextButtonDisabled = () => {
    if (step === 1) {
      return !selectedSendCrypto || !selectedGetCrypto || !sendAmount || minAmountError;
    } else if (step === 2) {
      return !recipientAddress || addressError || isButtonClick;
    }
    return false;
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-[#041530] via-[#062763] to-[#041530]">
      <div className="absolute inset-0 bg-cover bg-no-repeat bg-center" style={{ 
        backgroundImage: `url('/images/bg.png')`,
        opacity: 0.2
      }}></div>
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="fixed top-0 left-0 right-0 z-[90]">
          <div className="border-b border-white/10 bg-gradient-to-b from-[#041530] to-[#062763]">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
              <header className="flex justify-between items-center py-4">
                <div className="flex items-center gap-2 text-white text-2xl font-bold">
                  <Image
                    src="/favicon1b66.ico"
                    alt="SimpleSwap Icon"
                    width={32}
                    height={32}
                    className="text-white"
                  />
                  <span className="text-[14px] sm:text-[16px] md:text-[18px] font-semibold text-white">SimpleSwap</span>
                </div>

                {/* Hamburger Menu for Mobile */}
                <div className="xl:hidden">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-white p-2"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden xl:flex items-center">
                  <nav className="flex gap-8 mr-8">
                    <Link href="/" className="text-white hover:text-gray-300">Home</Link>
                    <button 
                      onClick={() => scrollToSection('how-it-works')} 
                      className="text-[12px] sm:text-[14px] md:text-[16px] text-white/80 hover:text-white transition-colors"
                    >
                      How it works
                    </button>
                    <Link href="/blog" className="text-[12px] sm:text-[14px] md:text-[16px] text-white/80 hover:text-white transition-colors">
                      Blog
                    </Link>
                    <Link href="/faq" className="text-[12px] sm:text-[14px] md:text-[16px] text-white/80 hover:text-white transition-colors">
                      FAQ
                    </Link>
                    <Link href="/affiliate" className="text-white hover:text-gray-300">Affiliate</Link>
                    <div className="relative">
                      <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 text-white hover:text-gray-300"
                      >
                        <Image
                          src="/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTE3LjAxNyA0LjNINS40ODNhMi40OTcgMi40OTcgMCAwMC0yLjUgMi41djIuNzY2IiBzdHJva2U9IiNDNkQ1RUEiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2Ut.svg"
                          alt="Exchange Icon"
                          width={20}
                          height={20}
                          className="text-white"
                        />
                        <svg 
                          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg bg-[#173f88] py-4 px-4">
                          <p className="text-white text-sm mb-3">You don&apos;t have any exchanges yet</p>
                          <Link href="/exchange" className="block w-full text-white bg-[#0f75fc] hover:bg-[#123276] px-4 py-2 rounded-lg transition-colors text-sm text-center">
                            Create a new exchange
                          </Link>
                        </div>
                      )}
                    </div>
                  </nav>
                  <div className="flex gap-4">
                    {isAuthenticated ? (
                      <div className="relative" ref={accountDropdownRef}>
                        <button 
                          onClick={() => {
                            setIsButtonClick(true);
                            setIsAccountDropdownOpen(!isAccountDropdownOpen);
                          }}
                          className="flex items-center gap-2 text-white hover:text-gray-300 px-4 py-2 rounded-lg transition-colors"
                        >
                          <div className="p-1.5 bg-white/10 backdrop-blur-sm rounded-full">
                            <svg 
                              className="w-5 h-5" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                              />
                            </svg>
                          </div>
                          <span>My Account</span>
                          <svg 
                            className={`w-4 h-4 transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isAccountDropdownOpen && (
                          <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg bg-[#173f88] py-2">
                            <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-600 break-all flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-gray-300 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {userEmail}
                            </div>
                            <Link
                              href="/verification"
                              className={`w-full text-left px-4 py-2 text-white hover:bg-[#0f75fc] transition-colors flex items-center gap-2 ${isVerified ? 'pointer-events-none opacity-50' : ''}`}
                              onClick={(e) => {
                                if (isVerified) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                                />
                              </svg>
                              ID Verification
                              {isVerified && (
                                <div className="ml-2 p-1 rounded-full bg-green-500/20 backdrop-blur-sm">
                                  <svg 
                                    className="w-4 h-4 text-green-500" 
                                    fill="currentColor" 
                                    viewBox="0 0 20 20"
                                  >
                                    <path 
                                      fillRule="evenodd" 
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                                      clipRule="evenodd" 
                                    />
                                  </svg>
                                </div>
                              )}
                            </Link>
                            <Link
                              href="/referrals"
                              className="w-full text-left px-4 py-2 text-white hover:bg-[#0f75fc] transition-colors flex items-center gap-2"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M12 4.354a4 4 0 110 5.292M15 21H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z"
                                />
                              </svg>
                              Your Referrals
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-4 py-2 text-white hover:bg-[#0f75fc] transition-colors flex items-center gap-2"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                                />
                              </svg>
                              Logout
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <Link href="/login" className="text-white bg-[#173f88] hover:bg-[#173f88]/80 px-6 py-2.5 rounded-lg transition-colors">
                          Login
                        </Link>
                        <Link href="/signup" className="text-white bg-[#0f75fc] hover:bg-[#123276] px-6 py-2.5 rounded-lg transition-colors">
                          Get an account
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </header>

              {/* Mobile Menu Dropdown */}
              <div 
                className={`xl:hidden fixed top-[72px] right-0 w-[300px] h-screen bg-[#010e27] transform transition-transform duration-300 ease-in-out ${
                  isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                } shadow-xl border-l border-white/10 z-[100]`}
              >
                <div className="px-6 py-6 space-y-4">
                  <Link href="/" className="block text-white hover:text-gray-300 py-2 border-b border-white/10">
                    Home
                  </Link>
                  <button 
                    onClick={() => scrollToSection('how-it-works')}
                    className="block w-full text-left text-white hover:text-gray-300 py-2 border-b border-white/10"
                  >
                    How it works
                  </button>
                  <Link href="/blog" className="block text-white hover:text-gray-300 py-2 border-b border-white/10">
                    Blog
                  </Link>
                  <Link href="/faq" className="block text-white hover:text-gray-300 py-2 border-b border-white/10">
                    FAQ
                  </Link>
                  <Link href="/affiliate" className="block text-white hover:text-gray-300 py-2 border-b border-white/10">
                    Affiliate
                  </Link>
                  <div className="py-2 border-b border-white/10">
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center justify-between w-full text-white hover:text-gray-300"
                    >
                      My Exchanges
                      <svg 
                        className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isDropdownOpen && (
                      <div className="mt-2 rounded-lg bg-[#173f88] py-4 px-4">
                        <p className="text-white text-sm mb-3">You don&apos;t have any exchanges yet</p>
                        <Link href="/exchange" className="block w-full text-white bg-[#0f75fc] hover:bg-[#123276] px-4 py-2 rounded-lg transition-colors text-sm text-center">
                          Create a new exchange
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="pt-4 space-y-3">
                    {isAuthenticated ? (
                      <div className="relative" ref={accountDropdownRef}>
                        <button 
                          onClick={() => {
                            setIsButtonClick(true);
                            setIsAccountDropdownOpen(!isAccountDropdownOpen);
                          }}
                          className="flex items-center gap-2 text-white hover:text-gray-300 px-4 py-2 rounded-lg transition-colors w-full"
                        >
                          <div className="p-1.5 bg-white/10 backdrop-blur-sm rounded-full">
                            <svg 
                              className="w-5 h-5" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                              />
                            </svg>
                          </div>
                          <span>My Account</span>
                          <svg 
                            className={`w-4 h-4 transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isAccountDropdownOpen && (
                          <div className="mt-2 w-[calc(100%-48px)] mx-auto rounded-lg shadow-lg bg-[#173f88] py-2">
                            <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-600 break-all flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-gray-300 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {userEmail}
                            </div>
                            <Link
                              href="/verification"
                              className={`w-full text-left px-4 py-2 text-white hover:bg-[#0f75fc] transition-colors flex items-center gap-2 ${isVerified ? 'pointer-events-none opacity-50' : ''}`}
                              onClick={(e) => {
                                if (isVerified) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                                />
                              </svg>
                              ID Verification
                              {isVerified && (
                                <div className="ml-2 p-1 rounded-full bg-green-500/20 backdrop-blur-sm">
                                  <svg 
                                    className="w-4 h-4 text-green-500" 
                                    fill="currentColor" 
                                    viewBox="0 0 20 20"
                                  >
                                    <path 
                                      fillRule="evenodd" 
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                                      clipRule="evenodd" 
                                    />
                                  </svg>
                                </div>
                              )}
                            </Link>
                            <Link
                              href="/referrals"
                              className="w-full text-left px-4 py-2 text-white hover:bg-[#0f75fc] transition-colors flex items-center gap-2"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M12 4.354a4 4 0 110 5.292M15 21H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z"
                                />
                              </svg>
                              Your Referrals
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-4 py-2 text-white hover:bg-[#0f75fc] transition-colors flex items-center gap-2"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                                />
                              </svg>
                              Logout
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <Link href="/login" className="block text-white bg-[#173f88] hover:bg-[#173f88]/80 px-6 py-2.5 rounded-lg transition-colors text-center">
                          Login
                        </Link>
                        <Link href="/signup" className="block text-white bg-[#0f75fc] hover:bg-[#123276] px-6 py-2.5 rounded-lg transition-colors text-center">
                          Get an account
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-72px)]">
            <div className="max-w-7xl w-full mx-auto px-6 sm:px-8 lg:px-12 py-4 -mt-32">
              <div className="bg-white/10 backdrop-blur-lg rounded-[30px] p-6 sm:p-8 md:p-12 max-w-2xl mx-auto shadow-xl border border-white/20">
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-white text-xl sm:text-2xl font-medium">
                    Add Exchange Details
                  </h1>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((stepNum) => (
                      <div
                        key={stepNum}
                        className={`w-3 h-3 rounded-full ${
                          stepNum === step ? 'bg-[#0f75fc]' : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {step === 1 && (
                  <div className="space-y-4">
                    <div className="w-full rounded-xl h-[70px] flex overflow-visible relative z-30">
                      <div 
                        ref={sendDropdownRef}
                        className="w-[35%] h-full bg-white/5 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 relative cursor-pointer border-r border-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSendDropdown(!showSendDropdown);
                          setShowGetDropdown(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {selectedSendCrypto && (
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10">
                              <Image 
                                src={selectedSendCrypto.icon}
                                alt={selectedSendCrypto.name}
                                width={24}
                                height={24}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = '/images/default-crypto.png';
                                }}
                              />
                            </div>
                          )}
                          <span className="text-[12px] sm:text-[14px] font-medium text-white">
                            {selectedSendCrypto ? selectedSendCrypto.symbol.toUpperCase() : 'Select a cryptocurrency'}
                          </span>
                        </div>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {showSendDropdown && (
                          <div className="absolute top-full left-0 mt-2 w-[300px] max-h-[400px] overflow-y-auto bg-white/10 backdrop-blur-lg rounded-xl shadow-lg z-[60] border border-white/20">
                            <div className="p-4">
                              <input
                                type="text"
                                placeholder="Search cryptocurrency..."
                                value={sendSearchQuery}
                                onChange={(e) => setSendSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="w-full px-4 py-2 bg-white/10 rounded-lg outline-none text-white placeholder-white/50 text-sm"
                              />
                            </div>
                            <div className="flex flex-wrap gap-2 p-4 border-b border-[#1E3A8A]/20">
                              {Object.entries(cryptoCategories).map(([key, _]) => (
                                <button
                                  key={key}
                                  className={`px-3 py-1 rounded-full text-xs ${
                                    selectedCategory === key
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCategory(key);
                                  }}
                                >
                                  {key.charAt(0).toUpperCase() + key.slice(1)}
                                </button>
                              ))}
                            </div>
                            <div className="py-2">
                              {filteredSendCryptos.map((crypto) => (
                                <div
                                  key={crypto.symbol}
                                  className="flex items-center px-4 py-3 hover:bg-white/10 cursor-pointer"
                                  onClick={() => {
                                    setSelectedSendCrypto(crypto);
                                    setShowSendDropdown(false);
                                    setSendSearchQuery('');
                                  }}
                                >
                                  <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10">
                                    <Image
                                      src={crypto.icon}
                                      width={24}
                                      height={24}
                                      alt={crypto.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.src = '/images/default-crypto.png';
                                      }}
                                    />
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-white text-sm font-medium">{crypto.name}</div>
                                    <div className="text-white/70 text-xs">{crypto.symbol.toUpperCase()}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 bg-white/5 backdrop-blur-md flex items-center px-4 sm:px-6 relative">
                        <input 
                          type="text"
                          value={sendAmount}
                          onChange={(e) => handleNumberInput(e.target.value, setSendAmount)}
                          placeholder="You Send" 
                          className="w-full bg-transparent outline-none text-[12px] sm:text-[14px] font-medium text-white placeholder-white/50"
                        />
                        {minAmountError && (
                          <div className="absolute left-0 -bottom-7 text-xs text-yellow-400 bg-white/5 px-2 py-1 rounded-md border border-yellow-400/20">
                            Min amount: {minAmountError.amount} {minAmountError.currency}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full rounded-xl h-[70px] flex overflow-visible relative z-20 mt-4">
                      <div 
                        ref={getDropdownRef}
                        className="w-[35%] h-full bg-white/5 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 relative cursor-pointer border-r border-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowGetDropdown(!showGetDropdown);
                          setShowSendDropdown(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {selectedGetCrypto && (
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10">
                              <Image 
                                src={selectedGetCrypto.icon}
                                alt={selectedGetCrypto.name}
                                width={24}
                                height={24}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = '/images/default-crypto.png';
                                }}
                              />
                            </div>
                          )}
                          <span className="text-[12px] sm:text-[14px] font-medium text-white">
                            {selectedGetCrypto ? selectedGetCrypto.symbol.toUpperCase() : 'Select a cryptocurrency'}
                          </span>
                        </div>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {showGetDropdown && (
                          <div className="absolute top-full left-0 mt-2 w-[300px] max-h-[400px] overflow-y-auto bg-white/10 backdrop-blur-lg rounded-xl shadow-lg z-[55] border border-white/20">
                            <div className="p-4">
                              <input
                                type="text"
                                placeholder="Search cryptocurrency..."
                                value={getSearchQuery}
                                onChange={(e) => setGetSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="w-full px-4 py-2 bg-white/10 rounded-lg outline-none text-white placeholder-white/50 text-sm"
                              />
                            </div>
                            <div className="flex flex-wrap gap-2 p-4 border-b border-[#1E3A8A]/20">
                              {Object.entries(cryptoCategories).map(([key, _]) => (
                                <button
                                  key={key}
                                  className={`px-3 py-1 rounded-full text-xs ${
                                    selectedCategory === key
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCategory(key);
                                  }}
                                >
                                  {key.charAt(0).toUpperCase() + key.slice(1)}
                                </button>
                              ))}
                            </div>
                            <div className="py-2">
                              {filteredGetCryptos.map((crypto) => (
                                <div
                                  key={crypto.symbol}
                                  className="flex items-center px-4 py-3 hover:bg-white/10 cursor-pointer"
                                  onClick={() => {
                                    setSelectedGetCrypto(crypto);
                                    setShowGetDropdown(false);
                                    setGetSearchQuery('');
                                  }}
                                >
                                  <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10">
                                    <Image
                                      src={crypto.icon}
                                      width={24}
                                      height={24}
                                      alt={crypto.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.src = '/images/default-crypto.png';
                                      }}
                                    />
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-white text-sm font-medium">{crypto.name}</div>
                                    <div className="text-white/70 text-xs">{crypto.symbol.toUpperCase()}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 bg-white/5 backdrop-blur-md flex items-center px-4 sm:px-6">
                        <input 
                          type="text"
                          value={getAmount}
                          readOnly
                          placeholder="You Get" 
                          className="w-full bg-transparent outline-none text-[12px] sm:text-[14px] font-medium cursor-not-allowed text-white placeholder-white/50" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl">
                      <label className="block text-sm text-white mb-2">
                        Enter the recipient&apos;s {selectedGetCrypto?.name} address
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={recipientAddress}
                          onChange={handleAddressChange}
                          className={`w-full bg-white/10 backdrop-blur-md p-3 rounded-lg outline-none text-white placeholder-white/50 ${
                            addressError ? 'border border-red-500' : 'border border-transparent'
                          }`}
                          placeholder={`Enter ${selectedGetCrypto?.symbol.toUpperCase()} address`}
                        />
                        {addressError && (
                          <div className="absolute right-3 top-3 text-red-500">
                            <ExclamationCircleIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      {addressError && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          {addressError}
                        </p>
                      )}
                    </div>
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl">
                      <label className="block text-sm text-white mb-2">
                        Extra ID (optional)
                        <span className="text-xs text-white/50 ml-2">
                          Required for some currencies like XRP, XLM
                        </span>
                      </label>
                      <input
                        type="text"
                        value={extraId}
                        onChange={(e) => setExtraId(e.target.value)}
                        placeholder="Extra ID (if required)"
                        className="w-full bg-white/10 backdrop-blur-md p-3 rounded-lg outline-none text-white placeholder-white/50"
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl">
                      <h3 className="text-lg text-white mb-4">Review Exchange Details</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">You Send:</span>
                          <span className="text-white">{sendAmount} {selectedSendCrypto?.symbol}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">You Get:</span>
                          <span className="text-white">{getAmount} {selectedGetCrypto?.symbol}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Recipient Address:</span>
                          <span className="text-white truncate max-w-[250px]">{recipientAddress}</span>
                        </div>
                        {extraId && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/70">Extra ID:</span>
                            <span className="text-white">{extraId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-[#0f75fc]/20 backdrop-blur-md rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#0f75fc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white">Exchange in Progress</h3>
                    <p className="text-sm text-white/80">
                      Your exchange has been initiated. You will receive your {selectedGetCrypto?.symbol.toUpperCase()} soon.
                    </p>
                  </div>
                )}

                <form onSubmit={handleExchange} className="w-full max-w-4xl mx-auto">
                  <div className="mt-8 flex justify-between">
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="px-6 py-3 text-white hover:bg-white/5 rounded-lg transition-colors backdrop-blur-md"
                      >
                        Back
                      </button>
                    )}
                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="ml-auto px-6 py-3 bg-[#0f75fc] text-white rounded-lg hover:bg-[#0f75fc]/90 transition-colors"
                        disabled={
                          (step === 1 && (!sendAmount || !selectedSendCrypto || !selectedGetCrypto)) ||
                          (step === 2 && (!recipientAddress || addressError))
                        }
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="ml-auto px-6 py-3 bg-[#0f75fc] text-white rounded-lg hover:bg-[#0f75fc]/90 transition-colors"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating Exchange...' : 'Confirm Exchange'}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
