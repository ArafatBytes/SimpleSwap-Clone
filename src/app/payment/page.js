"use client";

import Image from "next/image";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  cryptoCategories,
  getCoinsByCategory,
} from "../../data/cryptoCategories";
import { getExchangeRate, getAllCurrencies } from "../../lib/api/simpleswap";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  IdentificationIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { validateAddress } from "../../lib/utils/addressValidator";
import { toast } from "react-toastify";

function PaymentPageContent() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sendAmount, setSendAmount] = useState("");
  const [getAmount, setGetAmount] = useState("");
  const [selectedSendCrypto, setSelectedSendCrypto] = useState(null);
  const [selectedGetCrypto, setSelectedGetCrypto] = useState(null);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [cryptocurrencies, setCryptocurrencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [step, setStep] = useState(5); // Always set to 5 for payment page
  const [recipientAddress, setRecipientAddress] = useState("");
  const [extraId, setExtraId] = useState("");
  const [refundAddress, setRefundAddress] = useState("");
  const [refundExtraId, setRefundExtraId] = useState("");
  const [exchangeData, setExchangeData] = useState(null);
  const [exchangeStatus, setExchangeStatus] = useState(null);
  const [userExchanges, setUserExchanges] = useState([]);
  const [isLoadingExchanges, setIsLoadingExchanges] = useState(false);

  const accountDropdownRef = useRef(null);
  const searchParams = useSearchParams();
  const exchangeId = searchParams.get("exchange_id");

  // Load exchange data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);

        // Fetch currencies first as we need them
        const currencies = await getAllCurrencies();
        if (!currencies.length) {
          throw new Error("Failed to load currencies");
        }
        setCryptocurrencies(currencies);

        // Get exchange ID from URL
        const params = new URLSearchParams(window.location.search);
        let encodedId = params.get("exchange_id");

        if (encodedId) {
          // Simple decoding: remove first (5) and last (3) characters
          const decodedId = encodedId.slice(1, -1);

          // Fetch exchange data from database
          const response = await fetch(`/api/exchange/${decodedId}`);
          const dbData = await response.json();

          if (!response.ok) {
            throw new Error(dbData.error || "Failed to fetch exchange data");
          }

          // Then fetch detailed exchange data from SimpleSwap API
          const apiResponse = await fetch(
            `https://api.simpleswap.io/get_exchange?api_key=${process.env.NEXT_PUBLIC_SIMPLESWAP_API_KEY}&id=${decodedId}`
          );
          const apiData = await apiResponse.json();

          if (!apiResponse.ok) {
            throw new Error("Failed to fetch exchange data from SimpleSwap");
          }

          // Find the cryptocurrencies in our list
          const sendCrypto = currencies.find(
            (c) => c.symbol.toLowerCase() === dbData.currency_from.toLowerCase()
          );
          const getCrypto = currencies.find(
            (c) => c.symbol.toLowerCase() === dbData.currency_to.toLowerCase()
          );

          if (!sendCrypto || !getCrypto) {
            throw new Error("Invalid currencies in exchange data");
          }

          // Merge data from both sources
          const mergedData = {
            ...dbData,
            ...apiData,
            id: decodedId,
          };

          // Update state with merged exchange data
          setSelectedSendCrypto(sendCrypto);
          setSelectedGetCrypto(getCrypto);
          setSendAmount(
            apiData.amount_from || mergedData.expected_amount || ""
          );
          setGetAmount(apiData.amount_to || ""); // Get amount_to from SimpleSwap API
          setRecipientAddress(mergedData.address_to || "");
          setExtraId(mergedData.extra_id_to || "");
          setRefundAddress(mergedData.user_refund_address || "");
          setRefundExtraId(mergedData.user_refund_extra_id || "");
          setExchangeData(mergedData);
          setExchangeStatus(mergedData);
        } else {
          router.replace("/exchange");
        }
      } catch (error) {
        console.error("Failed to initialize data:", error);
        toast.error("Failed to load initial data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [router]);

  // Keep the auth check effect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check");
        const data = await response.json();
        setIsAuthenticated(data.isAuthenticated);
        setIsVerified(data.user?.isVerified || false);
        if (data.isAuthenticated && data.user?.email) {
          setUserEmail(data.user.email);
          localStorage.setItem("userEmail", data.user.email);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        setIsVerified(false);
        setUserEmail("");
        localStorage.removeItem("userEmail");
      }
    };

    checkAuth();
  }, []);

  // Poll exchange status
  useEffect(() => {
    if (!exchangeData?.id) return;

    const fetchStatus = async () => {
      try {
        console.log("Polling exchange status for ID:", exchangeData.id);

        // Fetch status directly from SimpleSwap API
        const response = await fetch(
          `https://api.simpleswap.io/get_exchange?api_key=${process.env.NEXT_PUBLIC_SIMPLESWAP_API_KEY}&id=${exchangeData.id}`
        );
        if (!response.ok) throw new Error("Failed to fetch exchange status");

        const data = await response.json();
        console.log("Current exchange status:", {
          id: exchangeData.id,
          status: data.status,
          previousStatus: exchangeStatus?.status,
          timestamp: new Date().toISOString(),
        });

        setExchangeStatus(data);

        // Show KYC popup when status becomes confirming
        if (
          data.status === "confirming" &&
          exchangeStatus?.status !== "confirming"
        ) {
          toast.info(
            <div className="flex items-start gap-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-500 flex-shrink-0"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M15 8h2" />
                <path d="M15 12h2" />
                <path d="M7 16h10" />
                <circle cx="16" cy="16" r="6" fill="#3b82f6" stroke="none" />
                <path
                  d="M14 16l1.5 1.5 2.5-2.5"
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>
              <div className="text-center flex-1">
                <p className="mb-4">
                  This transaction exceeds your account limits, to continue
                  please:
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => {
                      window.location.href = "/verification";
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Submit KYC
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = `mailto:mdarafat1661@gmail.com?subject=Refund Request for Transaction&body=Hello, I would like to request a refund for my transaction.`;
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Request Refund
                  </button>
                </div>
              </div>
            </div>,
            {
              position: "top-center",
              autoClose: false,
              hideProgressBar: false,
              closeOnClick: false,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              style: {
                background: "rgba(0, 0, 0, 0.9)",
                padding: "20px",
                borderRadius: "12px",
                minWidth: "400px",
                width: "fit-content",
                color: "white",
              },
              icon: false,
            }
          );
        }

        // Only show status change toasts for completed or error states
        if (
          data.status === "finished" &&
          exchangeStatus?.status !== "finished"
        ) {
          console.log("Exchange completed successfully!");
          toast.success("Exchange completed successfully!");
        } else if (
          ["failed", "refunded", "expired"].includes(data.status) &&
          !["failed", "refunded", "expired"].includes(exchangeStatus?.status)
        ) {
          console.log("Exchange error status:", data.status);
          toast.error(`Exchange ${data.status}`);
        }
      } catch (error) {
        console.error("Error fetching exchange status:", error);
      }
    };

    // Initial fetch
    console.log("Starting exchange status polling...");
    fetchStatus();

    // Set up polling every 10 seconds
    const intervalId = setInterval(fetchStatus, 10000);

    // Cleanup interval on unmount
    return () => {
      console.log("Stopping exchange status polling...");
      clearInterval(intervalId);
    };
  }, [exchangeData?.id, exchangeStatus?.status]);

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    setIsAuthenticated(false);
    setUserEmail("");
    toast.info("Logging out...");

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setIsMobileMenuOpen(false); // Close mobile menu if open
  };

  // Update the Home navigation buttons
  const handleHomeClick = () => {
    // Navigate using window.location
    window.location.href = "/exchange";
    setIsMobileMenuOpen(false);
  };

  // Update the browser history handling
  useEffect(() => {
    const handleRouteChange = () => {
      const newExchangeId = new URLSearchParams(window.location.search).get(
        "exchange_id"
      );
      if (newExchangeId !== exchangeId) {
        setIsLoading(true);
      }
    };

    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, [exchangeId]);

  // Add this function to fetch user exchanges
  const fetchUserExchanges = async () => {
    if (!isAuthenticated) return;

    setIsLoadingExchanges(true);
    try {
      const response = await fetch("/api/user/exchanges");
      const data = await response.json();

      if (data.success) {
        const exchanges = data.data.exchanges;
        const updatedExchanges = [...exchanges];

        // Only fetch status for exchanges that are not in final state
        for (let i = 0; i < exchanges.length; i++) {
          const exchange = exchanges[i];
          const finalStates = ["finished", "failed", "refunded", "expired"];

          if (!finalStates.includes(exchange.status)) {
            try {
              const statusResponse = await fetch(
                `https://api.simpleswap.io/get_exchange?api_key=${process.env.NEXT_PUBLIC_SIMPLESWAP_API_KEY}&id=${exchange.id}`
              );
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                updatedExchanges[i] = {
                  ...exchange,
                  status: statusData.status,
                };
              }
              // Add a small delay between requests
              if (i < exchanges.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
            } catch (error) {
              console.error(
                `Failed to fetch status for exchange ${exchange.id}:`,
                error
              );
            }
          }
        }
        setUserExchanges(updatedExchanges);
      }
    } catch (error) {
      console.error("Failed to fetch user exchanges:", error);
    } finally {
      setIsLoadingExchanges(false);
    }
  };

  // Add useEffect to fetch exchanges when dropdown is opened
  useEffect(() => {
    if (isDropdownOpen) {
      fetchUserExchanges();
    }
  }, [isDropdownOpen, isAuthenticated]);

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: "#062763" }}
    >
      <div
        className="absolute inset-0 bg-cover bg-no-repeat bg-center"
        style={{
          backgroundImage: `url('/images/bg.png')`,
          opacity: 0.4,
        }}
      ></div>
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
                  <span className="text-[14px] sm:text-[16px] md:text-[18px] font-semibold text-white">
                    SimpleSwap
                  </span>
                </div>

                {/* Hamburger Menu for Mobile */}
                <div className="xl:hidden">
                  <button
                    id="mobile-menu-button"
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
                    {/* Replace Link with button for Home navigation */}
                    <button
                      onClick={handleHomeClick}
                      className="text-white hover:text-gray-300"
                    >
                      Home
                    </button>
                    <button
                      onClick={() => scrollToSection("how-it-works")}
                      className="text-[12px] sm:text-[14px] md:text-[16px] text-white/80 hover:text-white transition-colors"
                    >
                      How it works
                    </button>
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
                        <span>Exchange</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            isDropdownOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg bg-[#173f88] py-4 px-4">
                          {isAuthenticated ? (
                            <>
                              {isLoadingExchanges ? (
                                <div className="flex justify-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                </div>
                              ) : userExchanges.length > 0 ? (
                                <>
                                  <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                    {userExchanges.map((exchange) => (
                                      <div
                                        key={exchange.id}
                                        onClick={() => {
                                          // Simple encoding: add 5 at start and 3 at end
                                          const encodedId = `5${exchange.id}3`;
                                          window.location.href = `/payment?exchange_id=${encodedId}`;
                                        }}
                                        className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-white">
                                              {exchange.currency_from.toUpperCase()}{" "}
                                              →{" "}
                                              {exchange.currency_to.toUpperCase()}
                                            </span>
                                          </div>
                                          <span
                                            className={`text-xs px-2 py-1 rounded ${
                                              exchange.status === "finished"
                                                ? "bg-green-500/20 text-green-400"
                                                : exchange.status === "waiting"
                                                ? "bg-yellow-500/20 text-yellow-400"
                                                : exchange.status ===
                                                  "confirming"
                                                ? "bg-blue-500/20 text-blue-400"
                                                : exchange.status ===
                                                  "exchanging"
                                                ? "bg-purple-500/20 text-purple-400"
                                                : exchange.status ===
                                                    "failed" ||
                                                  exchange.status ===
                                                    "expired" ||
                                                  exchange.status === "refunded"
                                                ? "bg-red-500/20 text-red-400"
                                                : "bg-gray-500/20 text-gray-400"
                                            }`}
                                          >
                                            {exchange.status
                                              .charAt(0)
                                              .toUpperCase() +
                                              exchange.status.slice(1)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-300">
                                          <span>
                                            {exchange.amount_from}{" "}
                                            {exchange.currency_from.toUpperCase()}
                                          </span>
                                          <span>
                                            {exchange.amount_to}{" "}
                                            {exchange.currency_to.toUpperCase()}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-4 pt-3 border-t border-white/10">
                                    <button
                                      onClick={() => {
                                        window.location.href = "/exchange";
                                      }}
                                      className="block w-full text-white bg-[#0f75fc] hover:bg-[#123276] px-4 py-2 rounded-lg transition-colors text-sm text-center"
                                    >
                                      Create a new exchange
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="text-white text-sm mb-3">
                                    You don&apos;t have any exchanges yet
                                  </p>
                                  <button
                                    onClick={() => {
                                      window.location.href = "/exchange";
                                    }}
                                    className="block w-full text-white bg-[#0f75fc] hover:bg-[#123276] px-4 py-2 rounded-lg transition-colors text-sm text-center"
                                  >
                                    Create a new exchange
                                  </button>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-white text-sm mb-3">
                                You don&apos;t have any exchanges yet
                              </p>
                              <button
                                onClick={() => {
                                  window.location.href = "/exchange";
                                }}
                                className="block w-full text-white bg-[#0f75fc] hover:bg-[#123276] px-4 py-2 rounded-lg transition-colors text-sm text-center"
                              >
                                Create a new exchange
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </nav>
                  <div className="flex gap-4">
                    {isAuthenticated ? (
                      <div className="relative" ref={accountDropdownRef}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // For desktop version, allow clicking anywhere on the button
                            if (!isMobileMenuOpen) {
                              setIsAccountDropdownOpen(!isAccountDropdownOpen);
                              return;
                            }
                            // For mobile version, only toggle on arrow click
                            const dropdownArrow =
                              e.target.closest(".dropdown-arrow");
                            if (dropdownArrow) {
                              setIsAccountDropdownOpen(!isAccountDropdownOpen);
                            }
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
                            className={`dropdown-arrow w-4 h-4 transition-transform ${
                              isAccountDropdownOpen ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        {isAccountDropdownOpen && (
                          <div className="absolute right-0 mt-2 w-[calc(100%+24px)] -ml-4 rounded-lg shadow-lg bg-[#173f88] py-2">
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
                              className={`w-full text-left px-4 py-2 text-white hover:bg-[#0f75fc] transition-colors flex items-center gap-2 ${
                                isVerified
                                  ? "opacity-50 pointer-events-none"
                                  : ""
                              }`}
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
                        <Link
                          href="/login"
                          className="text-white bg-[#173f88] hover:bg-[#173f88]/80 px-6 py-2.5 rounded-lg transition-colors"
                        >
                          Login
                        </Link>
                        <Link
                          href="/signup"
                          className="text-white bg-[#0f75fc] hover:bg-[#123276] px-6 py-2.5 rounded-lg transition-colors"
                        >
                          Get an account
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </header>

              {/* Mobile Menu Dropdown */}
              <div
                id="mobile-menu"
                className={`xl:hidden fixed top-[72px] right-0 w-[300px] h-screen bg-[#010e27] transform transition-transform duration-300 ease-in-out ${
                  isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
                } shadow-xl border-l border-white/10 z-[100]`}
              >
                <div className="px-6 py-6 space-y-4">
                  {/* Also update the mobile menu Home link */}
                  <button
                    onClick={handleHomeClick}
                    className="block w-full text-left text-white hover:text-gray-300 py-2 border-b border-white/10"
                  >
                    Home
                  </button>
                  <button
                    onClick={() => {
                      scrollToSection("how-it-works");
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left text-white hover:text-gray-300 py-2 border-b border-white/10"
                  >
                    How it works
                  </button>
                  {/* Exchange Section */}
                  <div className="py-2 border-b border-white/10">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center justify-between w-full text-white hover:text-gray-300"
                    >
                      <div className="flex items-center gap-2">
                        <Image
                          src="/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTE3LjAxNyA0LjNINS40ODNhMi40OTcgMi40OTcgMCAwMC0yLjUgMi41djIuNzY2IiBzdHJva2U9IiNDNkQ1RUEiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2Ut.svg"
                          alt="Exchange Icon"
                          width={20}
                          height={20}
                          className="text-white"
                        />
                        <span>Exchange</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {isDropdownOpen && (
                      <div className="mt-2 rounded-lg bg-[#173f88] py-4 px-4">
                        <p className="text-white text-sm mb-3">
                          You don&apos;t have any exchanges yet
                        </p>
                        <button
                          onClick={() => {
                            window.location.href = "/exchange";
                          }}
                          className="block w-full text-white bg-[#0f75fc] hover:bg-[#123276] px-4 py-2 rounded-lg transition-colors text-sm text-center"
                        >
                          Create a new exchange
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Mobile Account Section */}
                  <div className="pt-4">
                    {isAuthenticated ? (
                      <div className="space-y-4">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setIsAccountDropdownOpen(!isAccountDropdownOpen)
                            }
                            className="flex items-center justify-between w-full text-white hover:text-gray-300 px-4 py-2 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2">
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
                            </div>
                            <svg
                              className={`w-4 h-4 transition-transform ${
                                isAccountDropdownOpen ? "rotate-180" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                          {isAccountDropdownOpen && (
                            <div className="mt-2 rounded-lg bg-[#173f88] py-2">
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
                                className={`w-full text-left px-4 py-2 text-white hover:bg-[#0f75fc] transition-colors flex items-center gap-2 ${
                                  isVerified
                                    ? "opacity-50 pointer-events-none"
                                    : ""
                                }`}
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
                                onClick={() => setIsMobileMenuOpen(false)}
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
                                onClick={() => {
                                  handleLogout();
                                  setIsMobileMenuOpen(false);
                                }}
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
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Link
                          href="/login"
                          className="block w-full text-center text-white bg-[#173f88] hover:bg-[#173f88]/80 px-6 py-2.5 rounded-lg transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Login
                        </Link>
                        <Link
                          href="/signup"
                          className="block w-full text-center text-white bg-[#0f75fc] hover:bg-[#123276] px-6 py-2.5 rounded-lg transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Get an account
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <main>
          <div className="flex flex-col items-center pt-32 relative">
            <div
              className="absolute inset-0 bg-cover bg-no-repeat bg-center z-[1]"
              style={{
                backgroundImage: `url('/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwMCIgaGVpZ2h0PSIxMjI1IiB2aWV3Qm94PSIwIDAgMTUwMCAxMjI1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8bWFzayBpZD0ibWFzazAiIG1hc2stdHlwZT0iYWxwaGEiIG1hc2tVbml0cz0idXNlclNwYWNlT25Vc2UiIHg9Ii0yMTAiIHk9.svg')`,
                opacity: 0.3,
                height: "100vh",
              }}
            ></div>
            <div className="relative z-[2] w-full flex flex-col items-center">
              <h1
                className="text-white font-medium"
                style={{
                  fontFamily: "Poppins, Inter, sans-serif",
                  fontSize: "min(8vw, 53px)",
                }}
              >
                Crypto Exchange
              </h1>
              <p
                className="text-white/80 mt-2 font-normal"
                style={{
                  fontFamily: "Poppins, Inter, sans-serif",
                  fontSize: "min(3.5vw, 19px)",
                }}
              >
                Free from sign-up, limits, complications
              </p>

              <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-[30px] p-6 sm:p-8 md:p-12 w-[90%] sm:w-full max-w-2xl mx-auto border border-white/20 shadow-xl relative z-[2]">
                <div className="flex justify-center">
                  <h2
                    style={{
                      fontFamily: "Poppins, Inter, sans-serif",
                      fontSize: "min(4.5vw, 24px)",
                      fontWeight: "500",
                      color: "white",
                    }}
                  >
                    Crypto Exchange
                  </h2>
                </div>

                <div className="mt-8 mb-12 relative">
                  {/* Progress line */}
                  <div className="absolute top-5 left-0 w-full h-[2px] bg-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-in-out"
                      style={{
                        width:
                          exchangeStatus?.status === "finished"
                            ? "100%"
                            : exchangeStatus?.status === "confirming"
                            ? "75%"
                            : exchangeStatus?.status === "exchanging"
                            ? "50%"
                            : exchangeStatus?.status === "waiting"
                            ? "25%"
                            : exchangeStatus?.status === "failed" ||
                              exchangeStatus?.status === "refunded" ||
                              exchangeStatus?.status === "expired"
                            ? "100%"
                            : "0%",
                        backgroundColor:
                          exchangeStatus?.status === "failed" ||
                          exchangeStatus?.status === "refunded" ||
                          exchangeStatus?.status === "expired"
                            ? "#EF4444"
                            : undefined,
                      }}
                    />
                  </div>

                  {/* Status Steps */}
                  <div className="flex justify-between relative">
                    {[
                      {
                        title: "Waiting",
                        description: "Waiting for deposit",
                        status: "waiting",
                      },
                      {
                        title: "Exchanging",
                        description: "Exchange in progress",
                        status: "exchanging",
                      },
                      {
                        title: "Confirming",
                        description: "Confirming transaction",
                        status: "confirming",
                      },
                      {
                        title: "Completed",
                        description: "Exchange completed",
                        status: "finished",
                      },
                    ].map((statusStep) => {
                      const isActive =
                        exchangeStatus?.status === statusStep.status;
                      const isPassed =
                        exchangeStatus?.status === "finished" ||
                        (exchangeStatus?.status === "confirming" &&
                          statusStep.status !== "finished") ||
                        (exchangeStatus?.status === "exchanging" &&
                          ["waiting", "exchanging"].includes(
                            statusStep.status
                          )) ||
                        (exchangeStatus?.status === "waiting" &&
                          statusStep.status === "waiting");
                      const isError = [
                        "failed",
                        "refunded",
                        "expired",
                      ].includes(exchangeStatus?.status);

                      return (
                        <div
                          key={statusStep.status}
                          className="flex flex-col items-center"
                        >
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 ${
                              isError
                                ? "bg-red-500"
                                : isActive || isPassed
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30"
                                : "bg-white/5 border border-white/10"
                            }`}
                          >
                            {isPassed || isActive ? (
                              <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <span className="text-lg font-semibold text-white/50">
                                •
                              </span>
                            )}
                          </div>
                          <div className="mt-4 text-center">
                            <div
                              className={`text-sm font-medium transition-colors duration-300 ${
                                isError
                                  ? "text-red-500"
                                  : isActive || isPassed
                                  ? "text-white"
                                  : "text-white/50"
                              }`}
                            >
                              {statusStep.title}
                            </div>
                            <div
                              className={`text-xs mt-1 transition-colors duration-300 ${
                                isError
                                  ? "text-red-400"
                                  : isActive || isPassed
                                  ? "text-white/70"
                                  : "text-white/30"
                              }`}
                            >
                              {statusStep.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-[8px]">
                  {step === 1 && (
                    <>
                      <div className="w-full rounded-xl h-[70px] flex overflow-visible relative">
                        <div
                          ref={sendDropdownRef}
                          className="w-[35%] h-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-between px-4 sm:px-6 relative cursor-pointer rounded-xl"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSendDropdown(!showSendDropdown);
                            setShowGetDropdown(false);
                          }}
                          style={{ zIndex: showSendDropdown ? 50 : 1 }}
                        >
                          <div className="flex items-center gap-2">
                            {selectedSendCrypto && (
                              <img
                                src={selectedSendCrypto.icon}
                                alt={selectedSendCrypto.symbol}
                                className="w-5 h-5 sm:w-6 sm:h-6"
                              />
                            )}
                            <span className="text-[12px] sm:text-[14px] font-semibold text-white">
                              {selectedSendCrypto
                                ? selectedSendCrypto.symbol.toUpperCase()
                                : "Select"}
                            </span>
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 sm:w-5 sm:h-5 text-white/70"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                            />
                          </svg>

                          {showSendDropdown && (
                            <div className="fixed top-[75px] left-0 w-[calc(90vw-2rem)] max-w-[calc(32rem-2rem)] sm:w-[calc(100vw-5rem)] md:w-[calc(100vw-7rem)] bg-white/20 backdrop-blur-2xl border border-white/20 rounded-xl shadow-2xl overflow-y-auto z-[100] max-h-[50vh]">
                              <div className="bg-white/10 backdrop-blur-xl p-2 border-b border-white/20">
                                <input
                                  type="text"
                                  placeholder="Search cryptocurrency..."
                                  value={sendSearchQuery}
                                  onChange={(e) =>
                                    setSendSearchQuery(e.target.value)
                                  }
                                  className="w-full px-3 py-2 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 focus:outline-none focus:border-blue-500 text-sm text-white placeholder-white/50"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="flex flex-wrap gap-2 p-4 border-b border-white/20">
                                {Object.entries(cryptoCategories).map(
                                  ([key, _]) => (
                                    <button
                                      key={key}
                                      className={`px-3 py-1 rounded-full text-xs ${
                                        selectedCategory === key
                                          ? "bg-blue-500 text-white"
                                          : "bg-white/10 backdrop-blur-xl text-white/70 hover:bg-white/20"
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCategory(key);
                                      }}
                                    >
                                      {key.charAt(0).toUpperCase() +
                                        key.slice(1)}
                                    </button>
                                  )
                                )}
                              </div>
                              <div className="bg-white/10">
                                {filteredSendCryptos.map((crypto) => (
                                  <div
                                    key={crypto.symbol}
                                    className="flex items-center gap-2 px-4 py-3 hover:bg-white/20 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Calculate immediately when changing crypto with current values
                                      debouncedCalculateRate(true, {
                                        amount: sendAmount,
                                        fromCrypto: crypto,
                                        toCrypto: selectedGetCrypto,
                                      });
                                      handleSendCryptoSelect(crypto);
                                      setShowSendDropdown(false);
                                      setSendSearchQuery("");
                                    }}
                                  >
                                    <img
                                      src={crypto.icon}
                                      alt={crypto.symbol}
                                      className="w-5 h-5"
                                    />
                                    <div>
                                      <p className="text-[12px] font-semibold text-white">
                                        {crypto.symbol.toUpperCase()}
                                      </p>
                                      <p className="text-[10px] text-white/70">
                                        {crypto.name}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 ml-[8px] flex items-center px-4 sm:px-6 relative rounded-xl">
                          <input
                            type="text"
                            value={sendAmount}
                            onChange={(e) =>
                              handleNumberInput(e.target.value, setSendAmount)
                            }
                            placeholder="You Send"
                            className="w-full bg-transparent outline-none text-[12px] sm:text-[14px] font-medium text-white placeholder-white/50"
                            style={{
                              fontFamily: "Poppins, Inter, sans-serif",
                            }}
                          />
                        </div>
                        {minAmountError && (
                          <div className="absolute left-[calc(35%+16px)] top-[70px] text-xs text-yellow-300 bg-yellow-500/10 backdrop-blur-md px-2 py-1 rounded-lg z-[9999]">
                            Min amount: {minAmountError.amount}{" "}
                            {minAmountError.currency}
                          </div>
                        )}
                        {isCalculating && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/30"></div>
                          </div>
                        )}
                      </div>
                      <div className="w-full rounded-xl h-[70px] flex overflow-visible">
                        <div
                          ref={getDropdownRef}
                          className="w-[35%] h-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-between px-4 sm:px-6 relative cursor-pointer rounded-xl"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowGetDropdown(!showGetDropdown);
                            setShowSendDropdown(false);
                          }}
                          style={{ zIndex: showGetDropdown ? 50 : 1 }}
                        >
                          <div className="flex items-center gap-2">
                            {selectedGetCrypto && (
                              <img
                                src={selectedGetCrypto.icon}
                                alt={selectedGetCrypto.symbol}
                                className="w-5 h-5 sm:w-6 sm:h-6"
                              />
                            )}
                            <span className="text-[12px] sm:text-[14px] font-semibold text-white">
                              {selectedGetCrypto
                                ? selectedGetCrypto.symbol.toUpperCase()
                                : "Select"}
                            </span>
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 sm:w-5 sm:h-5 text-white/70"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                            />
                          </svg>

                          {showGetDropdown && (
                            <div className="fixed top-[75px] left-0 w-[calc(90vw-2rem)] max-w-[calc(32rem-2rem)] sm:w-[calc(100vw-5rem)] md:w-[calc(100vw-7rem)] bg-white/20 backdrop-blur-2xl border border-white/20 rounded-xl shadow-2xl overflow-y-auto z-[100] max-h-[50vh]">
                              <div className="bg-white/10 backdrop-blur-xl p-2 border-b border-white/20">
                                <input
                                  type="text"
                                  placeholder="Search cryptocurrency..."
                                  value={getSearchQuery}
                                  onChange={(e) =>
                                    setGetSearchQuery(e.target.value)
                                  }
                                  className="w-full px-3 py-2 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 focus:outline-none focus:border-blue-500 text-sm text-white placeholder-white/50"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="flex flex-wrap gap-2 p-4 border-b border-white/20">
                                {Object.entries(cryptoCategories).map(
                                  ([key, _]) => (
                                    <button
                                      key={key}
                                      className={`px-3 py-1 rounded-full text-xs ${
                                        selectedCategory === key
                                          ? "bg-blue-500 text-white"
                                          : "bg-white/10 backdrop-blur-xl text-white/70 hover:bg-white/20"
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCategory(key);
                                      }}
                                    >
                                      {key.charAt(0).toUpperCase() +
                                        key.slice(1)}
                                    </button>
                                  )
                                )}
                              </div>
                              <div className="bg-white/10">
                                {filteredGetCryptos.map((crypto) => (
                                  <div
                                    key={crypto.symbol}
                                    className="flex items-center gap-2 px-4 py-3 hover:bg-white/20 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Calculate immediately when changing crypto with current values
                                      debouncedCalculateRate(true, {
                                        amount: sendAmount,
                                        fromCrypto: selectedSendCrypto,
                                        toCrypto: crypto,
                                      });
                                      handleGetCryptoSelect(crypto);
                                      setShowGetDropdown(false);
                                      setGetSearchQuery("");
                                    }}
                                  >
                                    <img
                                      src={crypto.icon}
                                      alt={crypto.symbol}
                                      className="w-5 h-5"
                                    />
                                    <div>
                                      <p className="text-[12px] font-semibold text-white">
                                        {crypto.symbol.toUpperCase()}
                                      </p>
                                      <p className="text-[10px] text-white/70">
                                        {crypto.name}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 ml-[8px] flex items-center px-4 sm:px-6 rounded-xl">
                          <input
                            type="text"
                            value={getAmount}
                            readOnly
                            placeholder="You Get"
                            className="w-full bg-transparent outline-none text-[12px] sm:text-[14px] font-medium text-white placeholder-white/50 cursor-not-allowed"
                            style={{
                              fontFamily: "Poppins, Inter, sans-serif",
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="recipientAddress"
                          className="block text-sm font-medium text-white mb-2"
                        >
                          Recipient {selectedGetCrypto?.symbol.toUpperCase()}{" "}
                          Address
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="recipientAddress"
                            value={recipientAddress}
                            onChange={handleAddressChange}
                            className={`w-full p-4 rounded-lg bg-white/10 border ${
                              addressError
                                ? "border-red-500"
                                : "border-white/20"
                            } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder={`Enter your ${selectedGetCrypto?.symbol.toUpperCase()} address`}
                          />
                          {addressError && (
                            <p className="mt-2 text-sm text-red-500">
                              {addressError}
                            </p>
                          )}
                        </div>
                      </div>

                      {selectedGetCrypto?.has_extra_id && (
                        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4">
                          <label className="block text-sm font-medium text-white mb-2">
                            Extra ID (Optional)
                          </label>
                          <input
                            type="text"
                            value={extraId}
                            onChange={(e) => setExtraId(e.target.value)}
                            className="w-full bg-white/5 backdrop-blur-md rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/10"
                            placeholder="Enter Extra ID if required"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4">
                        <label className="block text-sm font-medium text-white mb-2">
                          Refund Address (Optional)
                        </label>
                        <input
                          type="text"
                          value={refundAddress}
                          onChange={handleRefundAddressChange}
                          placeholder={`Enter ${
                            selectedSendCrypto?.symbol || "crypto"
                          } refund address`}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                        />
                        {refundAddressError && (
                          <p className="mt-2 text-sm text-red-400">
                            {refundAddressError}
                          </p>
                        )}
                      </div>

                      {selectedSendCrypto?.has_extra_id && (
                        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4">
                          <label className="block text-sm font-medium text-white mb-2">
                            Refund Extra ID (Optional)
                          </label>
                          <input
                            type="text"
                            value={refundExtraId}
                            onChange={(e) => setRefundExtraId(e.target.value)}
                            placeholder="Enter refund extra ID if required"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {step === 4 && (
                    <div className="bg-white/5 backdrop-blur-md rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Confirm Exchange Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/70">You Send:</span>
                          <span className="text-white font-medium">
                            {sendAmount}{" "}
                            {selectedSendCrypto?.symbol.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">You Get:</span>
                          <span className="text-white font-medium">
                            {getAmount}{" "}
                            {selectedGetCrypto?.symbol.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">
                            Recipient Address:
                          </span>
                          <span className="text-white font-medium break-all">
                            {recipientAddress.slice(0, 10)}...
                            {recipientAddress.slice(-10)}
                          </span>
                        </div>
                        {extraId && (
                          <div className="flex justify-between">
                            <span className="text-white/70">Extra ID:</span>
                            <span className="text-white font-medium">
                              {extraId}
                            </span>
                          </div>
                        )}
                        {refundAddress && (
                          <div className="flex justify-between">
                            <span className="text-white/70">
                              Refund Address:
                            </span>
                            <span className="text-white font-medium break-all">
                              {refundAddress.slice(0, 10)}...
                              {refundAddress.slice(-10)}
                            </span>
                          </div>
                        )}
                        {refundExtraId && (
                          <div className="flex justify-between">
                            <span className="text-white/70">
                              Refund Extra ID:
                            </span>
                            <span className="text-white font-medium">
                              {refundExtraId}
                            </span>
                          </div>
                        )}
                        <div className="mt-6">
                          <button
                            onClick={handleExchange}
                            disabled={isLoading}
                            className={`w-full h-[50px] rounded-xl text-white font-semibold transition-all duration-300 hover:bg-[#0956c8] hover:shadow-lg bg-[#0f75fc] ${
                              isLoading ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            {isLoading
                              ? "Creating Exchange..."
                              : "Create Exchange"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 5 && exchangeData && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <p className="text-lg mb-2 text-white">Please send</p>
                        <div className="flex items-center justify-center">
                          <p
                            className="text-4xl font-bold text-green-400 mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              const textToCopy = `${sendAmount} ${selectedSendCrypto?.symbol.toUpperCase()}`;
                              navigator.clipboard.writeText(textToCopy);
                              toast.success("Amount copied to clipboard!");
                            }}
                          >
                            {sendAmount}{" "}
                            {selectedSendCrypto?.symbol.toUpperCase()}
                          </p>
                        </div>
                        <p className="text-sm text-gray-400">
                          to complete your exchange
                        </p>
                      </div>

                      {/* Loading Spinner */}
                      {exchangeStatus?.status &&
                        !["finished", "failed", "refunded", "expired"].includes(
                          exchangeStatus.status
                        ) && (
                          <div className="flex flex-col items-center justify-center space-y-3 mb-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <p className="text-white/70 text-sm">
                              Your transaction will automatically be detected
                            </p>
                          </div>
                        )}

                      {exchangeStatus?.status === "finished" ? (
                        <div className="bg-white rounded-lg p-8 text-center">
                          <h2 className="text-[24px] font-semibold text-gray-900 mb-4">
                            Finished successfully
                          </h2>
                          <div className="flex items-center justify-center gap-4 mb-8">
                            <div className="flex items-center gap-2">
                              <img
                                src={selectedSendCrypto?.icon}
                                alt={selectedSendCrypto?.symbol}
                                className="w-8 h-8"
                              />
                              <span className="text-lg font-medium text-gray-900">
                                {sendAmount}{" "}
                                {selectedSendCrypto?.symbol.toUpperCase()}
                              </span>
                            </div>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-6 h-6 text-gray-400"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                              />
                            </svg>
                            <div className="flex items-center gap-2">
                              <img
                                src={selectedGetCrypto?.icon}
                                alt={selectedGetCrypto?.symbol}
                                className="w-8 h-8"
                              />
                              <span className="text-lg font-medium text-gray-900">
                                {getAmount}{" "}
                                {selectedGetCrypto?.symbol.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              window.location.href = "/exchange";
                            }}
                            className="bg-[#0f75fc] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#0956c8] transition-colors"
                          >
                            Start a new exchange
                          </button>
                          <button
                            onClick={() => {
                              window.location.reload();
                            }}
                            className="ml-4 text-gray-500 hover:text-gray-700"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="bg-[#0B1426]/80 backdrop-blur-sm p-6 rounded-lg border border-blue-900/50">
                          <div className="flex flex-col gap-4">
                            <div className="w-full space-y-4">
                              <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm p-4 rounded-lg">
                                <div className="break-all text-white text-sm">
                                  {exchangeData?.address_from ||
                                    "Loading address..."}
                                </div>
                                <button
                                  onClick={() => {
                                    if (exchangeData?.address_from) {
                                      navigator.clipboard.writeText(
                                        exchangeData.address_from
                                      );
                                      toast.success(
                                        "Address copied to clipboard!"
                                      );
                                    }
                                  }}
                                  className="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                    />
                                  </svg>
                                </button>
                              </div>

                              {/* Exchange Details */}
                              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-white/70">Status</span>
                                  <span className="text-white font-medium">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800`}
                                    >
                                      {exchangeStatus?.status}
                                    </span>
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/70">
                                    Payment Wallet Address
                                  </span>
                                  <span className="text-white font-medium break-all">
                                    {exchangeData?.address_from}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/70">
                                    You Send
                                  </span>
                                  <span className="text-white font-medium">
                                    {sendAmount}{" "}
                                    {selectedSendCrypto?.symbol.toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/70">You Get</span>
                                  <span className="text-white font-medium">
                                    {exchangeData?.isLocked ? (
                                      <>
                                        {exchangeData?.originalCurrencyTo?.toUpperCase()}{" "}
                                        (amount will be calculated at current
                                        rate)
                                      </>
                                    ) : (
                                      <>
                                        {getAmount}{" "}
                                        {selectedGetCrypto?.symbol.toUpperCase()}
                                      </>
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/70">
                                    Recipient Address
                                  </span>
                                  <span className="text-white font-medium break-all">
                                    {exchangeData?.isLocked ? (
                                      exchangeData?.originalAddressTo
                                    ) : (
                                      <>
                                        {recipientAddress.slice(0, 10)}...
                                        {recipientAddress.slice(-10)}
                                      </>
                                    )}
                                  </span>
                                </div>
                                {extraId && (
                                  <div className="flex justify-between">
                                    <span className="text-white/70">
                                      Extra ID
                                    </span>
                                    <span className="text-white font-medium">
                                      {extraId}
                                    </span>
                                  </div>
                                )}
                                {refundAddress && (
                                  <div className="flex justify-between">
                                    <span className="text-white/70">
                                      Refund Address
                                    </span>
                                    <span className="text-white font-medium break-all">
                                      {refundAddress.slice(0, 10)}...
                                      {refundAddress.slice(-10)}
                                    </span>
                                  </div>
                                )}
                                {refundExtraId && (
                                  <div className="flex justify-between">
                                    <span className="text-white/70">
                                      Refund Extra ID
                                    </span>
                                    <span className="text-white font-medium">
                                      {refundExtraId}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Warning Message */}
                              <div className="bg-yellow-500/10 backdrop-blur-sm p-4 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <svg
                                    className="w-6 h-6 text-yellow-500 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                  </svg>
                                  <div>
                                    <p className="text-yellow-500 font-medium">
                                      Important:
                                    </p>
                                    <ul className="text-yellow-500/80 text-sm mt-1 list-disc list-inside space-y-1">
                                      <li>
                                        Send only{" "}
                                        {selectedSendCrypto?.symbol.toUpperCase()}{" "}
                                        to this address
                                      </li>
                                      <li>
                                        Minimum amount: {sendAmount}{" "}
                                        {selectedSendCrypto?.symbol.toUpperCase()}
                                      </li>
                                      <li>Send only one transaction</li>
                                      <li>
                                        {exchangeData?.isLocked ? (
                                          <>
                                            Your{" "}
                                            {exchangeData?.originalCurrencyTo?.toUpperCase()}{" "}
                                            will be sent to:{" "}
                                            {exchangeData?.originalAddressTo}
                                          </>
                                        ) : (
                                          <>
                                            Your{" "}
                                            {selectedGetCrypto?.symbol.toUpperCase()}{" "}
                                            will be sent to:{" "}
                                            {recipientAddress.slice(0, 10)}...
                                            {recipientAddress.slice(-10)}
                                          </>
                                        )}
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-4 mt-4">
                        {step > 1 && step !== 5 && (
                          <button
                            onClick={handleBack}
                            className="flex-1 h-[70px] rounded-xl font-semibold transition-all duration-300 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md"
                            style={{
                              fontFamily: "Poppins, Inter, sans-serif",
                              fontSize: "min(4vw, 18px)",
                            }}
                          >
                            Back
                          </button>
                        )}

                        {step < 4 && (
                          <button
                            onClick={handleNext}
                            className={`flex-1 h-[70px] rounded-xl text-white font-semibold transition-all duration-300 hover:bg-[#0956c8] hover:shadow-lg bg-[#0f75fc] ${
                              isNextButtonDisabled()
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            style={{
                              fontFamily: "Poppins, Inter, sans-serif",
                              fontSize: "min(4vw, 18px)",
                            }}
                          >
                            Next
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <div className="grid sm:grid-cols-2 grid-cols-1 gap-8 mt-64 xl:w-[1200px] sm:w-[600px] w-[90%] mx-auto">
        <div className="bg-[#0038c7] bg-opacity-20 rounded-[30px] p-8 sm:p-12 sm:h-[350px] xl:h-[300px] h-auto relative">
          <div className="flex justify-between items-center">
            <div className="max-w-[60%]">
              <p
                className="text-[14px] font-semibold"
                style={{ color: "#859ab5", paddingLeft: "8px" }}
              >
                Privacy
              </p>
              <p
                className="text-[20px] xl:text-[24px] font-semibold text-white mt-4"
                style={{ paddingLeft: "8px" }}
              >
                Sign-up is not required
              </p>
              <p
                className="text-[14px] xl:text-[16px] mt-2"
                style={{ color: "#c6d5ea", paddingLeft: "8px" }}
              >
                SimpleSwap provides cryptocurrency exchange without
                registration.
              </p>
            </div>
            <div className="absolute right-8 xl:right-12 top-1/2 transform -translate-y-1/2">
              <img
                src="/picture1-017aef986c0e885636f8f840d9b9950b.png"
                alt="Privacy"
                className="w-24 xl:w-32 h-24 xl:h-32"
              />
            </div>
          </div>
        </div>
        <div className="bg-[#0038c7] bg-opacity-20 rounded-[30px] p-8 sm:p-12 sm:h-[350px] xl:h-[300px] h-auto relative">
          <div className="flex justify-between items-center">
            <div className="max-w-[60%]">
              <p
                className="text-[14px] font-semibold"
                style={{ color: "#859ab5", paddingLeft: "8px" }}
              >
                Wide choice
              </p>
              <p
                className="text-[20px] xl:text-[24px] font-semibold text-white mt-4"
                style={{ paddingLeft: "8px" }}
              >
                1500 cryptocurrencies
              </p>
              <p
                className="text-[14px] xl:text-[16px] mt-2"
                style={{ color: "#c6d5ea", paddingLeft: "8px" }}
              >
                Hundreds of crypto and fiat currencies are available for
                exchange.
              </p>
            </div>
            <div className="absolute right-8 xl:right-12 top-1/2 transform -translate-y-1/2">
              <img
                src="/picture2-5152c421af8e678203b7655f62780d46.png"
                alt="Wide choice"
                className="w-24 xl:w-32 h-24 xl:h-32"
              />
            </div>
          </div>
        </div>
        <div className="bg-[#0038c7] bg-opacity-20 rounded-[30px] p-8 sm:p-12 sm:h-[350px] xl:h-[300px] h-auto relative">
          <div className="flex justify-between items-center">
            <div className="max-w-[60%]">
              <p
                className="text-[14px] font-semibold"
                style={{ color: "#859ab5", paddingLeft: "8px" }}
              >
                Safety
              </p>
              <p
                className="text-[20px] xl:text-[24px] font-semibold text-white mt-4"
                style={{ paddingLeft: "8px" }}
              >
                Non-custodial
              </p>
              <p
                className="text-[14px] xl:text-[16px] mt-2"
                style={{ color: "#c6d5ea", paddingLeft: "8px" }}
              >
                Crypto is sent directly to your wallet, we don&apos;t store it
                on our service.
              </p>
            </div>
            <div className="absolute right-8 xl:right-12 top-1/2 transform -translate-y-1/2">
              <img
                src="/picture4-9dd3430e0f4506b07e22b35c676f5322.png"
                alt="Safety"
                className="w-24 xl:w-32 h-24 xl:h-32"
              />
            </div>
          </div>
        </div>
        <div className="bg-[#0038c7] bg-opacity-20 rounded-[30px] p-8 sm:p-12 sm:h-[350px] xl:h-[300px] h-auto relative">
          <div className="flex justify-between items-center">
            <div className="max-w-[60%]">
              <p
                className="text-[14px] font-semibold"
                style={{ color: "#859ab5", paddingLeft: "8px" }}
              >
                24/7 support
              </p>
              <p
                className="text-[20px] xl:text-[24px] font-semibold text-white mt-4"
                style={{ paddingLeft: "8px" }}
              >
                You won&apos;t be left alone
              </p>
              <p
                className="text-[14px] xl:text-[16px] mt-2"
                style={{ color: "#c6d5ea", paddingLeft: "8px" }}
              >
                Our support team is easy to reach and ready to answer your
                questions.
              </p>
            </div>
            <div className="absolute right-8 xl:right-12 top-1/2 transform -translate-y-1/2">
              <img
                src="/picture3-3c002d66e84372393183095df5cb4fb7.png"
                alt="24/7 Support"
                className="w-24 xl:w-32 h-24 xl:h-32"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="relative mt-64">
        <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-[30px] w-[83.3vw] max-w-[1000px] h-[250px] shadow-lg flex flex-col items-center justify-center py-8 sm:py-12 md:py-16">
          <h2
            className="text-[24px] sm:text-[32px] md:text-[40px] font-semibold"
            style={{ color: "#141a2e" }}
          >
            Start Swapping Crypto
          </h2>
          <p
            className="mt-2 sm:mt-4 text-[12px] sm:text-[14px] md:text-[16px] text-center max-w-[80%] sm:max-w-[70%] md:max-w-[60%] mx-auto"
            style={{ color: "#3f5878" }}
          >
            Just make the first exchange to see how easy and profitable it is.
          </p>
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/exchange";
            }}
            className="mt-4 sm:mt-6 bg-gradient-to-r from-[#3F7AF7] to-[#7F31FF] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90 hover:scale-105 text-[12px] sm:text-[14px] md:text-[16px]"
          >
            Create an exchange
          </Link>
        </div>
      </div>
      <div className="w-full bg-white" id="how-it-works">
        <div className="max-w-[1200px] mx-auto pt-60 pb-40">
          <h2
            className="text-center text-[24px] sm:text-[32px] md:text-[40px] font-semibold"
            style={{ color: "#141a2e" }}
          >
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mt-12 px-6 sm:px-8">
            <div className="bg-[#f7f9fc] rounded-[20px] p-6 sm:p-8">
              <div className="w-12 h-12 rounded-full bg-[#0f75fc] text-white flex items-center justify-center text-[18px] sm:text-[20px] font-semibold">
                1
              </div>
              <h3
                className="mt-4 text-[16px] sm:text-[18px] md:text-[20px] font-semibold"
                style={{ color: "#141a2e" }}
              >
                Choose crypto
              </h3>
              <p className="mt-2 text-[12px] sm:text-[14px] text-[#3f5878]">
                Select the crypto you want to exchange and enter the amount.
              </p>
            </div>
            <div className="bg-[#f7f9fc] rounded-[20px] p-6 sm:p-8">
              <div className="w-12 h-12 rounded-full bg-[#0f75fc] text-white flex items-center justify-center text-[18px] sm:text-[20px] font-semibold">
                2
              </div>
              <h3
                className="mt-4 text-[16px] sm:text-[18px] md:text-[20px] font-semibold"
                style={{ color: "#141a2e" }}
              >
                Enter address
              </h3>
              <p className="mt-2 text-[12px] sm:text-[14px] text-[#3f5878]">
                Provide the wallet address for receiving your exchanged crypto.
              </p>
            </div>
            <div className="bg-[#f7f9fc] rounded-[20px] p-6 sm:p-8">
              <div className="w-12 h-12 rounded-full bg-[#0f75fc] text-white flex items-center justify-center text-[18px] sm:text-[20px] font-semibold">
                3
              </div>
              <h3
                className="mt-4 text-[16px] sm:text-[18px] md:text-[20px] font-semibold"
                style={{ color: "#141a2e" }}
              >
                Make deposit
              </h3>
              <p className="mt-2 text-[12px] sm:text-[14px] text-[#3f5878]">
                Send your crypto to the generated address to start the exchange.
              </p>
            </div>
            <div className="bg-[#f7f9fc] rounded-[20px] p-6 sm:p-8">
              <div className="w-12 h-12 rounded-full bg-[#0f75fc] text-white flex items-center justify-center text-[18px] sm:text-[20px] font-semibold">
                4
              </div>
              <h3
                className="mt-4 text-[16px] sm:text-[18px] md:text-[20px] font-semibold"
                style={{ color: "#141a2e" }}
              >
                Get crypto
              </h3>
              <p className="mt-2 text-[12px] sm:text-[14px] text-[#3f5878]">
                Receive your exchanged cryptocurrency in your wallet.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full" style={{ backgroundColor: "#010e27" }}>
        <div className="max-w-[1200px] mx-auto pt-60 pb-40"></div>
        <div className="w-full" style={{ backgroundColor: "#010c22" }}>
          <div className="max-w-[1200px] mx-auto py-8">
            <p
              className="text-center text-[14px] font-semibold"
              style={{ color: "#859ab5" }}
            >
              &copy; 2018-2024 SimpleSwap
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#062763" }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}
