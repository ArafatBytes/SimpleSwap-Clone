"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { cryptocurrencies } from '../data/cryptocurrencies';

export default function Home() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [getAmount, setGetAmount] = useState('');
  const [selectedSendCrypto, setSelectedSendCrypto] = useState(cryptocurrencies[0]);
  const [selectedGetCrypto, setSelectedGetCrypto] = useState(cryptocurrencies[1]);
  const [showSendDropdown, setShowSendDropdown] = useState(false);
  const [showGetDropdown, setShowGetDropdown] = useState(false);

  const sendDropdownRef = useRef(null);
  const getDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (sendDropdownRef.current && !sendDropdownRef.current.contains(event.target)) {
        setShowSendDropdown(false);
      }
      if (getDropdownRef.current && !getDropdownRef.current.contains(event.target)) {
        setShowGetDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleNumberInput = (value, setter) => {
    // Allow empty string
    if (value === '') {
      setter('');
      return;
    }

    // Only allow numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "#062763" }}>
      <div className="absolute inset-0 bg-cover bg-no-repeat bg-center" style={{ 
        backgroundImage: `url('/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwMCIgaGVpZ2h0PSIxMjI1IiB2aWV3Qm94PSIwIDAgMTUwMCAxMjI1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8bWFzayBpZD0ibWFzazAiIG1hc2stdHlwZT0iYWxwaGEiIG1hc2tVbml0cz0idXNlclNwYWNlT25Vc2UiIHg9Ii0yMTAiIHk9.svg')`,
        opacity: 0.1
      }} />
      <div className="relative z-10">
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="border-b border-white/10 bg-[#062763]">
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
                    <Link href="/login" className="text-white hover:text-gray-300">Home</Link>
                    <Link href="/#how-it-works" className="text-[12px] sm:text-[14px] md:text-[16px] text-white/80 hover:text-white transition-colors">
                      How it works
                    </Link>
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
                          <button className="w-full text-white bg-[#0f75fc] hover:bg-[#123276] px-4 py-2 rounded-lg transition-colors text-sm">
                            Create a new exchange
                          </button>
                        </div>
                      )}
                    </div>
                  </nav>
                  <div className="flex gap-4">
                    <Link href="/login" className="text-white bg-[#173f88] hover:bg-[#173f88]/80 px-6 py-2.5 rounded-lg transition-colors">
                      Login
                    </Link>
                    <Link href="/signup" className="text-white bg-[#0f75fc] hover:bg-[#123276] px-6 py-2.5 rounded-lg transition-colors">
                      Get an Account
                    </Link>
                  </div>
                </div>
              </header>

              {/* Mobile Menu Dropdown */}
              <div 
                className={`xl:hidden fixed top-[72px] right-0 w-[300px] h-screen bg-[#010e27] transform transition-transform duration-300 ease-in-out ${
                  isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                } shadow-xl border-l border-white/10`}
              >
                <div className="px-6 py-6 space-y-4">
                  <Link href="/login" className="block text-white hover:text-gray-300 py-2 border-b border-white/10">
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
                        <button className="w-full text-white bg-[#0f75fc] hover:bg-[#123276] px-4 py-2 rounded-lg transition-colors text-sm">
                          Create a new exchange
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="pt-4 space-y-3">
                    <Link href="/login" className="block text-white bg-[#173f88] hover:bg-[#173f88]/80 px-6 py-2.5 rounded-lg transition-colors text-center">
                      Login
                    </Link>
                    <Link href="/signup" className="block text-white bg-[#0f75fc] hover:bg-[#123276] px-6 py-2.5 rounded-lg transition-colors text-center">
                      Get an Account
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <main>
          <div className="flex flex-col items-center pt-32">
            <h1 className="text-white font-medium" style={{ 
              fontFamily: 'Poppins, Inter, sans-serif',
              fontSize: 'min(8vw, 53px)'
            }}>Crypto Exchange</h1>
            <p className="text-white/80 mt-2 font-normal" style={{ 
              fontFamily: 'Poppins, Inter, sans-serif',
              fontSize: 'min(3.5vw, 19px)'
            }}>Free from sign-up, limits, complications</p>
            <div className="mt-8 bg-white rounded-[30px] p-6 sm:p-8 md:p-12 w-[90%] sm:w-full max-w-2xl mx-auto">
              <div className="flex justify-center">
                <h2 style={{ 
                  fontFamily: 'Poppins, Inter, sans-serif',
                  fontSize: 'min(3vw, 15px)',
                  fontWeight: '500',
                  color: '#3f5878'
                }}>Crypto Exchange</h2>
              </div>
              <div className="mt-8 flex flex-col gap-[8px]">
                <div className="w-full rounded-xl h-[70px] flex overflow-visible">
                  <div 
                    ref={sendDropdownRef}
                    className="w-[35%] h-full bg-[#edf1f7] flex items-center justify-between px-4 sm:px-6 relative cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSendDropdown(!showSendDropdown);
                      setShowGetDropdown(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src={selectedSendCrypto.icon} 
                        alt={selectedSendCrypto.symbol} 
                        className="w-5 h-5 sm:w-6 sm:h-6" 
                      />
                      <span className="text-[12px] sm:text-[14px] font-medium" style={{ 
                        fontFamily: 'Poppins, Inter, sans-serif',
                        color: '#3f5878'
                      }}>{selectedSendCrypto.symbol}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-[#3f5878]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                    
                    {showSendDropdown && (
                      <div className="absolute top-[70px] left-0 right-0 bg-white rounded-xl shadow-lg max-h-[300px] overflow-y-auto z-[100]">
                        {cryptocurrencies.map((crypto) => (
                          <div
                            key={crypto.symbol}
                            className="flex items-center gap-2 px-4 py-3 hover:bg-[#f7f9fc] cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSendCrypto(crypto);
                              setShowSendDropdown(false);
                            }}
                          >
                            <img src={crypto.icon} alt={crypto.symbol} className="w-5 h-5" />
                            <div>
                              <p className="text-[12px] font-medium text-[#3f5878]">{crypto.symbol}</p>
                              <p className="text-[10px] text-[#3f5878]/70">{crypto.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 bg-[#edf1f7] ml-[8px] flex items-center px-4 sm:px-6">
                    <input 
                      type="text"
                      value={sendAmount}
                      onChange={(e) => handleNumberInput(e.target.value, setSendAmount)}
                      placeholder="You Send" 
                      className="w-full bg-transparent outline-none text-[12px] sm:text-[14px] font-medium placeholder:text-[#3f5878]/50" 
                      style={{ 
                        fontFamily: 'Poppins, Inter, sans-serif',
                        color: '#3f5878'
                      }}
                    />
                  </div>
                </div>
                <div className="w-full rounded-xl h-[70px] flex overflow-visible">
                  <div 
                    ref={getDropdownRef}
                    className="w-[35%] h-full bg-[#edf1f7] flex items-center justify-between px-4 sm:px-6 relative cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGetDropdown(!showGetDropdown);
                      setShowSendDropdown(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src={selectedGetCrypto.icon} 
                        alt={selectedGetCrypto.symbol} 
                        className="w-5 h-5 sm:w-6 sm:h-6" 
                      />
                      <span className="text-[12px] sm:text-[14px] font-medium" style={{ 
                        fontFamily: 'Poppins, Inter, sans-serif',
                        color: '#3f5878'
                      }}>{selectedGetCrypto.symbol}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-[#3f5878]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                    
                    {showGetDropdown && (
                      <div className="absolute top-[70px] left-0 right-0 bg-white rounded-xl shadow-lg max-h-[300px] overflow-y-auto z-[100]">
                        {cryptocurrencies.map((crypto) => (
                          <div
                            key={crypto.symbol}
                            className="flex items-center gap-2 px-4 py-3 hover:bg-[#f7f9fc] cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGetCrypto(crypto);
                              setShowGetDropdown(false);
                            }}
                          >
                            <img src={crypto.icon} alt={crypto.symbol} className="w-5 h-5" />
                            <div>
                              <p className="text-[12px] font-medium text-[#3f5878]">{crypto.symbol}</p>
                              <p className="text-[10px] text-[#3f5878]/70">{crypto.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 bg-[#edf1f7] ml-[8px] flex items-center px-4 sm:px-6">
                    <input 
                      type="text"
                      value={getAmount}
                      onChange={(e) => handleNumberInput(e.target.value, setGetAmount)}
                      placeholder="You Get" 
                      className="w-full bg-transparent outline-none text-[12px] sm:text-[14px] font-medium placeholder:text-[#3f5878]/50" 
                      style={{ 
                        fontFamily: 'Poppins, Inter, sans-serif',
                        color: '#3f5878'
                      }}
                    />
                  </div>
                </div>
                <button 
                  className="w-full h-[70px] rounded-xl text-white font-semibold mt-4 transition-all duration-300 hover:bg-[#0956c8] hover:shadow-lg bg-[#0f75fc]"
                  style={{ 
                    fontFamily: 'Poppins, Inter, sans-serif',
                    fontSize: 'min(3.5vw, 16px)',
                    fontWeight: '600'
                  }}
                >
                  Exchange
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 grid-cols-1 gap-8 mt-48 xl:w-[1200px] sm:w-[600px] w-[90%] mx-auto">
              <div className="bg-[#0038c7] bg-opacity-20 rounded-[30px] p-8 sm:p-12 sm:h-[350px] xl:h-[300px] h-auto relative">
                <div className="flex justify-between items-center">
                  <div className="max-w-[60%]">
                    <p className="text-[14px] font-semibold" style={{ color: '#859ab5', paddingLeft: '8px' }}>
                      Privacy
                    </p>
                    <p className="text-[20px] xl:text-[24px] font-semibold text-white mt-4" style={{ paddingLeft: '8px' }}>
                      Sign-up is not required
                    </p>
                    <p className="text-[14px] xl:text-[16px] mt-2" style={{ color: '#c6d5ea', paddingLeft: '8px' }}>
                      SimpleSwap provides cryptocurrency exchange without registration.
                    </p>
                  </div>
                  <div className="absolute right-8 xl:right-12 top-1/2 transform -translate-y-1/2">
                    <img src="/picture1-017aef986c0e885636f8f840d9b9950b.png" alt="Privacy" className="w-24 xl:w-32 h-24 xl:h-32" />
                  </div>
                </div>
              </div>
              <div className="bg-[#0038c7] bg-opacity-20 rounded-[30px] p-8 sm:p-12 sm:h-[350px] xl:h-[300px] h-auto relative">
                <div className="flex justify-between items-center">
                  <div className="max-w-[60%]">
                    <p className="text-[14px] font-semibold" style={{ color: '#859ab5', paddingLeft: '8px' }}>
                      Wide choice
                    </p>
                    <p className="text-[20px] xl:text-[24px] font-semibold text-white mt-4" style={{ paddingLeft: '8px' }}>
                      1500 cryptocurrencies
                    </p>
                    <p className="text-[14px] xl:text-[16px] mt-2" style={{ color: '#c6d5ea', paddingLeft: '8px' }}>
                      Hundreds of crypto and fiat currencies are available for exchange.
                    </p>
                  </div>
                  <div className="absolute right-8 xl:right-12 top-1/2 transform -translate-y-1/2">
                    <img src="/picture2-5152c421af8e678203b7655f62780d46.png" alt="Wide choice" className="w-24 xl:w-32 h-24 xl:h-32" />
                  </div>
                </div>
              </div>
              <div className="bg-[#0038c7] bg-opacity-20 rounded-[30px] p-8 sm:p-12 sm:h-[350px] xl:h-[300px] h-auto relative">
                <div className="flex justify-between items-center">
                  <div className="max-w-[60%]">
                    <p className="text-[14px] font-semibold" style={{ color: '#859ab5', paddingLeft: '8px' }}>
                      24/7 support
                    </p>
                    <p className="text-[20px] xl:text-[24px] font-semibold text-white mt-4" style={{ paddingLeft: '8px' }}>
                      You won&apos;t be left alone
                    </p>
                    <p className="text-[14px] xl:text-[16px] mt-2" style={{ color: '#c6d5ea', paddingLeft: '8px' }}>
                      Our support team is easy to reach and ready to answer your questions.
                    </p>
                  </div>
                  <div className="absolute right-8 xl:right-12 top-1/2 transform -translate-y-1/2">
                    <img src="/picture3-3c002d66e84372393183095df5cb4fb7.png" alt="24/7 Support" className="w-24 xl:w-32 h-24 xl:h-32" />
                  </div>
                </div>
              </div>
              <div className="bg-[#0038c7] bg-opacity-20 rounded-[30px] p-8 sm:p-12 sm:h-[350px] xl:h-[300px] h-auto relative">
                <div className="flex justify-between items-center">
                  <div className="max-w-[60%]">
                    <p className="text-[14px] font-semibold" style={{ color: '#859ab5', paddingLeft: '8px' }}>
                      Safety
                    </p>
                    <p className="text-[20px] xl:text-[24px] font-semibold text-white mt-4" style={{ paddingLeft: '8px' }}>
                      Non-custodial
                    </p>
                    <p className="text-[14px] xl:text-[16px] mt-2" style={{ color: '#c6d5ea', paddingLeft: '8px' }}>
                      Crypto is sent directly to your wallet, we don&apos;t store it on our service.
                    </p>
                  </div>
                  <div className="absolute right-8 xl:right-12 top-1/2 transform -translate-y-1/2">
                    <img src="/picture4-9dd3430e0f4506b07e22b35c676f5322.png" alt="Safety" className="w-24 xl:w-32 h-24 xl:h-32" />
                  </div>
                </div>
              </div>
            </div>
            <div className="relative mt-48">
              <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-[30px] w-[83.3vw] max-w-[1000px] h-[250px] shadow-lg flex flex-col items-center justify-center py-8 sm:py-12 md:py-16">
                <h2 className="text-[24px] sm:text-[32px] md:text-[40px] font-semibold" style={{ color: '#141a2e' }}>
                  Start Swapping Crypto
                </h2>
                <p className="mt-2 sm:mt-4 text-[12px] sm:text-[14px] md:text-[16px] text-center max-w-[80%] sm:max-w-[70%] md:max-w-[60%] mx-auto" style={{ color: '#3f5878' }}>
                  Just make the first exchange to see how easy and profitable it is.
                </p>
                <button
                  className="mt-4 sm:mt-6 bg-gradient-to-r from-[#3F7AF7] to-[#7F31FF] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90 hover:scale-105 text-[12px] sm:text-[14px] md:text-[16px]"
                >
                  Create an exchange
                </button>
              </div>
            </div>
            <div className="w-full bg-white" id="how-it-works">
              <div className="max-w-[1200px] mx-auto pt-60 pb-40">
                <h2 className="text-center text-[24px] sm:text-[32px] md:text-[40px] font-semibold" style={{ color: '#141a2e' }}>How It Works</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mt-12 px-6 sm:px-8">
                  <div className="bg-[#f7f9fc] rounded-[20px] p-6 sm:p-8">
                    <div className="w-12 h-12 rounded-full bg-[#0f75fc] text-white flex items-center justify-center text-[18px] sm:text-[20px] font-semibold">1</div>
                    <h3 className="mt-4 text-[16px] sm:text-[18px] md:text-[20px] font-semibold" style={{ color: '#141a2e' }}>Choose crypto</h3>
                    <p className="mt-2 text-[12px] sm:text-[14px] text-[#3f5878]">Select the crypto you want to exchange and enter the amount.</p>
                  </div>
                  <div className="bg-[#f7f9fc] rounded-[20px] p-6 sm:p-8">
                    <div className="w-12 h-12 rounded-full bg-[#0f75fc] text-white flex items-center justify-center text-[18px] sm:text-[20px] font-semibold">2</div>
                    <h3 className="mt-4 text-[16px] sm:text-[18px] md:text-[20px] font-semibold" style={{ color: '#141a2e' }}>Enter address</h3>
                    <p className="mt-2 text-[12px] sm:text-[14px] text-[#3f5878]">Provide the wallet address for receiving your exchanged crypto.</p>
                  </div>
                  <div className="bg-[#f7f9fc] rounded-[20px] p-6 sm:p-8">
                    <div className="w-12 h-12 rounded-full bg-[#0f75fc] text-white flex items-center justify-center text-[18px] sm:text-[20px] font-semibold">3</div>
                    <h3 className="mt-4 text-[16px] sm:text-[18px] md:text-[20px] font-semibold" style={{ color: '#141a2e' }}>Make deposit</h3>
                    <p className="mt-2 text-[12px] sm:text-[14px] text-[#3f5878]">Send your crypto to the generated address to start the exchange.</p>
                  </div>
                  <div className="bg-[#f7f9fc] rounded-[20px] p-6 sm:p-8">
                    <div className="w-12 h-12 rounded-full bg-[#0f75fc] text-white flex items-center justify-center text-[18px] sm:text-[20px] font-semibold">4</div>
                    <h3 className="mt-4 text-[16px] sm:text-[18px] md:text-[20px] font-semibold" style={{ color: '#141a2e' }}>Get crypto</h3>
                    <p className="mt-2 text-[12px] sm:text-[14px] text-[#3f5878]">Receive your exchanged cryptocurrency in your wallet.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full" style={{ backgroundColor: '#010e27' }}>
              <div className="max-w-[1200px] mx-auto py-40">
              </div>
              <div className="w-full" style={{ backgroundColor: '#010c22' }}>
                <div className="max-w-[1200px] mx-auto py-8">
                  <p className="text-center text-[14px] font-semibold" style={{ color: '#859ab5' }}>
                  &copy; 2018-2024 SimpleSwap
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
