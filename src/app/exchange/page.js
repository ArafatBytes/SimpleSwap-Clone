"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { cryptoCategories } from '../../data/cryptoCategories';
import { toast } from 'react-toastify';
import { getExchangeRate, getAllCurrencies } from '../../lib/api/simpleswap';

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
  const [walletAddress, setWalletAddress] = useState('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isButtonClick, setIsButtonClick] = useState(false);
  const [cryptocurrencies, setCryptocurrencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [minAmountError, setMinAmountError] = useState(null);

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
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    if (token) {
      setIsAuthenticated(true);
      setUserEmail(email || '');
    }
  }, []);

  useEffect(() => {
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

    fetchCurrencies();
  }, []);

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

  const handleLogout = () => {
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
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        color: 'white'
      }
    });
    
    setTimeout(() => {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      window.location.reload();
    }, 2000);
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

  const handleNext = () => {
    if (step === 1 && sendAmount && selectedSendCrypto && selectedGetCrypto) {
      setStep(2);
    } else if (step === 2 && walletAddress) {
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
                    <Link href="/dashboard" className="text-white hover:text-gray-300">Dashboard</Link>
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
                  <Link href="/dashboard" className="block text-white hover:text-gray-300 py-2 border-b border-white/10">
                    Dashboard
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
                      <div className="relative">
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
                            <Image 
                              src={selectedSendCrypto.icon} 
                              alt={selectedSendCrypto.name}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full"
                            />
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
                                  <Image
                                    src={crypto.icon}
                                    width={24}
                                    height={24}
                                    alt={crypto.name}
                                    className="rounded-full"
                                  />
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
                            <Image 
                              src={selectedGetCrypto.icon} 
                              alt={selectedGetCrypto.name}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full"
                            />
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
                                  <Image
                                    src={crypto.icon}
                                    width={24}
                                    height={24}
                                    alt={crypto.name}
                                    className="rounded-full"
                                  />
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
                  <div className="space-y-4">
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl">
                      <label className="block text-sm text-white mb-2">
                        Enter your {selectedGetCrypto ? selectedGetCrypto.name : 'selected cryptocurrency'} wallet address
                      </label>
                      <input
                        type="text"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder="Wallet Address"
                        className="w-full bg-white/10 backdrop-blur-md p-3 rounded-lg outline-none text-white placeholder-white/50"
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl">
                      <h3 className="text-lg text-white mb-4">Send your {selectedSendCrypto ? selectedSendCrypto.name : 'selected cryptocurrency'}</h3>
                      <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg">
                        <p className="text-sm text-white/80 mb-2">Send exactly:</p>
                        <p className="text-lg font-medium text-white">{sendAmount} {selectedSendCrypto ? selectedSendCrypto.symbol.toUpperCase() : ''}</p>
                        <p className="text-sm text-white/80 mt-4 mb-2">To address:</p>
                        <p className="text-sm font-medium text-white break-all">
                          0x1234567890abcdef1234567890abcdef12345678
                        </p>
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
                      Your exchange has been initiated. You will receive your {selectedGetCrypto ? selectedGetCrypto.symbol.toUpperCase() : 'selected cryptocurrency'} soon.
                    </p>
                  </div>
                )}

                <div className="mt-8 flex justify-between">
                  {step > 1 && (
                    <button
                      onClick={handleBack}
                      className="px-6 py-3 text-white hover:bg-white/5 rounded-lg transition-colors backdrop-blur-md"
                    >
                      Back
                    </button>
                  )}
                  {step < 4 && (
                    <button
                      onClick={handleNext}
                      className="ml-auto px-6 py-3 bg-[#0f75fc] text-white rounded-lg hover:bg-[#0f75fc]/90 transition-colors"
                      disabled={
                        (step === 1 && (!sendAmount || !selectedSendCrypto || !selectedGetCrypto)) ||
                        (step === 2 && !walletAddress)
                      }
                    >
                      {step === 3 ? 'Confirm Exchange' : 'Next'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
