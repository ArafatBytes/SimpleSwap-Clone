"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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
                  SimpleSwap
                </div>
                <div className="flex items-center">
                  <nav className="flex gap-8 mr-8">
                    <Link href="/" className="text-white hover:text-gray-300">Home</Link>
                    <button 
                      onClick={() => scrollToSection('how-it-works')} 
                      className="text-white hover:text-gray-300"
                    >
                      How it works
                    </button>
                    <Link href="/blog" className="text-white hover:text-gray-300">Blog</Link>
                    <Link href="/faq" className="text-white hover:text-gray-300">FAQ</Link>
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
                          <p className="text-white text-sm mb-3">You don't have any exchanges yet</p>
                          <button className="w-full text-white bg-[#0f75fc] hover:bg-[#123276] px-4 py-2 rounded-lg transition-colors text-sm">
                            Create a new exchange
                          </button>
                        </div>
                      )}
                    </div>
                  </nav>
                  <div className="flex gap-4">
                    <Link href="#" className="text-white bg-[#173f88] hover:bg-[#173f88]/80 px-6 py-2.5 rounded-lg transition-colors">
                      Login
                    </Link>
                    <Link href="#" className="text-white bg-[#0f75fc] hover:bg-[#123276] px-6 py-2.5 rounded-lg transition-colors">
                      Get an Account
                    </Link>
                  </div>
                </div>
              </header>
            </div>
          </div>
        </div>
        <main>
          <div className="flex flex-col items-center pt-32">
            <h1 className="text-white font-medium" style={{ 
              fontFamily: 'Poppins, Inter, sans-serif',
              fontSize: '53px'
            }}>Crypto Exchange</h1>
            <p className="text-white/80 mt-2 font-normal" style={{ 
              fontFamily: 'Poppins, Inter, sans-serif',
              fontSize: '19px'
            }}>Free from sign-up, limits, complications</p>
            <div className="mt-8 bg-white rounded-[30px] p-12 w-full max-w-2xl mx-auto">
              <div className="flex justify-center -mt-6">
                <h2 style={{ 
                  fontFamily: 'Poppins, Inter, sans-serif',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#3f5878'
                }}>Crypto Exchange</h2>
              </div>
              <div className="mt-8 flex flex-col gap-[1px]">
                <div className="w-full rounded-xl h-[70px] flex overflow-hidden">
                  <div className="w-[70%] p-6 flex justify-between items-center" style={{ backgroundColor: 'rgba(220, 227, 237, 0.5)' }}>
                    <p style={{ 
                      fontFamily: 'Poppins, Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#3f5878'
                    }}>You send</p>
                    <input 
                      type="text"
                      pattern="[0-9]*[.]?[0-9]+"
                      placeholder="0.00"
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        textAlign: 'right',
                        fontFamily: 'Poppins, Inter, sans-serif',
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#000000',
                        width: '150px'
                      }}
                      onKeyPress={(e) => {
                        if (!/[\d.]/.test(e.key)) {
                          e.preventDefault();
                        }
                        if (e.key === '.' && e.target.value.includes('.')) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                  <div className="w-[30%] p-6 border-l-2 border-white" style={{ backgroundColor: 'rgba(220, 227, 237, 0.7)' }}>
                    {/* 30% width content */}
                  </div>
                </div>

                <div className="flex justify-end my-4">
                  <button 
                    className="bg-white hover:bg-gray-50 rounded-full px-2 py-1.5 shadow-md transition-all duration-300 hover:shadow-lg cursor-pointer"
                    onClick={() => {
                      // Handle swap direction logic here
                    }}
                  >
                    <Image 
                      src="/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTguMDc2IDE2LjgzN2EuNTM4LjUzOCAwIDAxLS4zODMuMTYzLjUyOS41MjkgMCAwMS0uMzgyLS4xNjNMNS4xNTggMTQuNjRBLjU1My41NTMgMCAwMTUgMTQuMjVh.svg"
                      alt="Exchange direction"
                      width={24}
                      height={24}
                    />
                  </button>
                </div>

                <div className="w-full rounded-xl h-[70px] flex overflow-hidden">
                  <div className="w-[70%] p-6 flex justify-between items-center" style={{ backgroundColor: 'rgba(220, 227, 237, 0.5)' }}>
                    <p style={{ 
                      fontFamily: 'Poppins, Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#3f5878'
                    }}>You get</p>
                    <input 
                      type="text"
                      pattern="[0-9]*[.]?[0-9]+"
                      placeholder="0.00"
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        textAlign: 'right',
                        fontFamily: 'Poppins, Inter, sans-serif',
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#000000',
                        width: '150px'
                      }}
                      onKeyPress={(e) => {
                        if (!/[\d.]/.test(e.key)) {
                          e.preventDefault();
                        }
                        if (e.key === '.' && e.target.value.includes('.')) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                  <div className="w-[30%] p-6 border-l-2 border-white" style={{ backgroundColor: 'rgba(220, 227, 237, 0.7)' }}>
                    {/* 30% width content */}
                  </div>
                </div>
                <button 
                  className="w-full h-[70px] rounded-xl text-white font-semibold mt-4 transition-all duration-300 hover:bg-[#0956c8] hover:shadow-lg bg-[#0f75fc]"
                  style={{ 
                    fontFamily: 'Poppins, Inter, sans-serif',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  Exchange
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 mt-48" style={{ width: '1200px' }}>
              <div className="bg-[#0038c7] bg-opacity-20 rounded-[30px] p-12 h-[250px] relative">
                <div className="flex justify-between items-center">
                  <div className="max-w-[60%]">
                    <p className="text-[14px] font-semibold" style={{ color: '#859ab5', paddingLeft: '8px' }}>
                      Privacy
                    </p>
                    <p className="text-[24px] font-semibold text-white mt-4" style={{ paddingLeft: '8px' }}>
                      Sign-up is not required
                    </p>
                    <p className="text-[16px] mt-2" style={{ color: '#c6d5ea', paddingLeft: '8px' }}>
                      SimpleSwap provides cryptocurrency exchange without registration.
                    </p>
                  </div>
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                    <img src="/picture1-017aef986c0e885636f8f840d9b9950b.png" alt="Privacy" className="w-32 h-32" />
                  </div>
                </div>
              </div>
              <div className="bg-[#0038c7] bg-opacity-20 rounded-[30px] p-12 mt-8 h-[250px] relative">
                <div className="flex justify-between items-center">
                  <div className="max-w-[60%]">
                    <p className="text-[14px] font-semibold" style={{ color: '#859ab5', paddingLeft: '8px' }}>
                      Wide choice
                    </p>
                    <p className="text-[24px] font-semibold text-white mt-4" style={{ paddingLeft: '8px' }}>
                      1500 cryptocurrencies
                    </p>
                    <p className="text-[16px] mt-2" style={{ color: '#c6d5ea', paddingLeft: '8px' }}>
                      Hundreds of crypto and fiat currencies are available for exchange.
                    </p>
                  </div>
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                    <img src="/picture2-5152c421af8e678203b7655f62780d46.png" alt="Wide choice" className="w-32 h-32" />
                  </div>
                </div>
              </div>
              <div className="bg-[#0038c7] bg-opacity-20 rounded-[30px] p-12 h-[250px] relative">
                <div className="flex justify-between items-center">
                  <div className="max-w-[60%]">
                    <p className="text-[14px] font-semibold" style={{ color: '#859ab5', paddingLeft: '8px' }}>
                      24/7 support
                    </p>
                    <p className="text-[24px] font-semibold text-white mt-4" style={{ paddingLeft: '8px' }}>
                      You won't be left alone
                    </p>
                    <p className="text-[16px] mt-2" style={{ color: '#c6d5ea', paddingLeft: '8px' }}>
                      Our support team is easy to reach and ready to answer your questions.
                    </p>
                  </div>
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                    <img src="/picture3-3c002d66e84372393183095df5cb4fb7.png" alt="24/7 Support" className="w-32 h-32" />
                  </div>
                </div>
              </div>
              <div className="bg-[#0038c7] bg-opacity-20 rounded-[30px] p-12 mt-8 h-[250px] relative">
                <div className="flex justify-between items-center">
                  <div className="max-w-[60%]">
                    <p className="text-[14px] font-semibold" style={{ color: '#859ab5', paddingLeft: '8px' }}>
                      Safety
                    </p>
                    <p className="text-[24px] font-semibold text-white mt-4" style={{ paddingLeft: '8px' }}>
                      Non-custodial
                    </p>
                    <p className="text-[16px] mt-2" style={{ color: '#c6d5ea', paddingLeft: '8px' }}>
                      Crypto is sent directly to your wallet, we don't store it on our service.
                    </p>
                  </div>
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                    <img src="/picture4-9dd3430e0f4506b07e22b35c676f5322.png" alt="Safety" className="w-32 h-32" />
                  </div>
                </div>
              </div>
            </div>
            <div className="relative mt-48">
              <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-[30px] w-[1000px] h-[250px] shadow-lg flex flex-col items-center justify-center py-16">
                <h2 className="text-[40px] font-semibold" style={{ color: '#141a2e' }}>
                  Start Swapping Crypto
                </h2>
                <p className="mt-4 text-[16px]" style={{ color: '#3f5878' }}>
                  Just make the first exchange to see how easy and profitable it is.
                </p>
                <button
                  className="mt-6 bg-gradient-to-r from-[#3F7AF7] to-[#7F31FF] text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90 hover:scale-105"
                >
                  Create an exchange
                </button>
              </div>
            </div>
            <div className="w-full bg-white" id="how-it-works">
              <div className="max-w-[1200px] mx-auto pt-60 pb-40">
                <h2 className="text-[40px] font-medium" style={{ color: '#252c44' }}>
                  How It Works
                </h2>
                <div className="flex justify-between mt-12">
                  <div className="max-w-[250px]">
                    <h3 className="text-[17px] font-semibold" style={{ color: '#252c44' }}>
                      Choose a currency pair
                    </h3>
                    <p className="mt-2 text-[15px]" style={{ color: '#3f5878' }}>
                      Select currencies you want to swap and click the Exchange button.
                    </p>
                  </div>
                  <div className="max-w-[250px]">
                    <h3 className="text-[17px] font-semibold" style={{ color: '#252c44' }}>
                      Enter the recipient's address
                    </h3>
                    <p className="mt-2 text-[15px]" style={{ color: '#3f5878' }}>
                      The currency you want to receive will be sent to this address after the exchange.
                    </p>
                  </div>
                  <div className="max-w-[250px]">
                    <h3 className="text-[17px] font-semibold" style={{ color: '#252c44' }}>
                      Send and receive coins
                    </h3>
                    <p className="mt-2 text-[15px]" style={{ color: '#3f5878' }}>
                      To continue, send the indicated amount of coins to the deposit address.
                    </p>
                  </div>
                  <div className="max-w-[250px]">
                    <h3 className="text-[17px] font-semibold" style={{ color: '#252c44' }}>
                      That's all!
                    </h3>
                    <p className="mt-2 text-[15px]" style={{ color: '#3f5878' }}>
                      The exchange status "Finished" means that the swap process is over.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full" style={{ backgroundColor: '#010e27' }}>
              <div className="max-w-[1200px] mx-auto py-40">
              </div>
              <div className="w-full" style={{ backgroundColor: '#010c22' }}>
                <div className="max-w-[1200px] mx-auto py-8">
                  <p className="text-center text-[16px] font-semibold" style={{ color: '#859ab5' }}>
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
