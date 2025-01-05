"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import Link from "next/link";
import ExchangeDialog from "@/components/admin/ExchangeDialog";

export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("verifications");
  const [verifications, setVerifications] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [lockedExchanges, setLockedExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [isExchangeDialogOpen, setIsExchangeDialogOpen] = useState(false);

  useEffect(() => {
    if (activeTab !== "failed") {
      fetchData();
    }
  }, [activeTab, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "verifications") {
        const res = await fetch(`/api/admin/verifications?page=${currentPage}`);
        const data = await res.json();
        if (data.success) {
          setVerifications(data.data.verifications);
          setTotalPages(data.data.pagination.pages);
        } else {
          throw new Error(data.message);
        }
      } else if (activeTab === "locked") {
        // Fetch only locked exchanges
        const res = await fetch(
          `/api/admin/exchanges?page=${currentPage}&status=locked&isLocked=true`
        );
        const data = await res.json();
        if (data.success) {
          setLockedExchanges(data.data.exchanges);
          setTotalPages(data.data.pagination.pages);
        } else {
          throw new Error(data.message);
        }
      } else {
        // Fetch regular (non-locked) exchanges
        const res = await fetch(
          `/api/admin/exchanges?page=${currentPage}&isLocked=false`
        );
        const data = await res.json();
        if (data.success) {
          setExchanges(data.data.exchanges);
          setTotalPages(data.data.pagination.pages);
        } else {
          throw new Error(data.message);
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch data");
      if (error.message.includes("Unauthorized")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Status updated successfully");
        // Remove the verification from the local state
        setVerifications((prev) => prev.filter((v) => v._id !== id));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleCompleteLockedExchange = async (exchangeId) => {
    try {
      const res = await fetch("/api/admin/exchanges/complete-locked", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ exchangeId }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Exchange marked as completed");
        fetchData(); // Refresh the data
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to complete exchange");
    }
  };

  const handleRemoveFailedExchange = async (id) => {
    try {
      const res = await fetch(`/api/admin/failed-exchanges?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Failed exchange removed successfully");
        setFailedExchanges((prev) =>
          prev.filter((exchange) => exchange._id !== id)
        );
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to remove exchange");
    }
  };

  const handleMarkComplete = (exchange) => {
    console.log("Opening dialog with exchange:", exchange);
    setSelectedExchange(exchange);
    setIsExchangeDialogOpen(true);
  };

  const handleExchangeConfirm = async (exchangeData) => {
    console.log("Exchange confirmed:", exchangeData);
    // Refresh the exchanges list after confirming
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#041E42] text-white">
      {/* Header */}
      <div className="border-b border-white/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Image
              src="/favicon1b66.ico"
              alt="SimpleSwap"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="text-xl font-semibold">Admin Panel</span>
          </div>
          <Link
            href="/exchange"
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors px-4 py-2 rounded-lg bg-[#173f88]/50 hover:bg-[#173f88] backdrop-blur-sm"
          >
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl p-1 rounded-xl inline-flex">
            <button
              onClick={() => {
                setActiveTab("verifications");
                setCurrentPage(1);
              }}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "verifications"
                  ? "bg-[#0f75fc] text-white shadow-lg"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Verifications
            </button>
            <button
              onClick={() => {
                setActiveTab("exchanges");
                setCurrentPage(1);
              }}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "exchanges"
                  ? "bg-[#0f75fc] text-white shadow-lg"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Exchanges
            </button>
            <button
              onClick={() => {
                setActiveTab("locked");
                setCurrentPage(1);
              }}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "locked"
                  ? "bg-[#0f75fc] text-white shadow-lg"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Locked Exchanges
            </button>
            <button
              onClick={() => {
                setActiveTab("failed");
                setCurrentPage(1);
              }}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "failed"
                  ? "bg-[#0f75fc] text-white shadow-lg"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Failed Exchanges
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : activeTab === "verifications" ? (
          <div className="space-y-4">
            {verifications.map((verification) => (
              <div
                key={verification._id}
                className="bg-white/10 rounded-lg p-6 space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Personal Information
                    </h3>
                    <p>
                      Name: {verification.firstName} {verification.lastName}
                    </p>
                    <p>Email: {verification.email}</p>
                    <p>Document Type: {verification.documentType}</p>
                    <p>Document Number: {verification.documentNumber}</p>
                    <p>Status: {verification.verificationStatus}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Documents</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div
                        onClick={() =>
                          handleImageClick(verification.frontImage)
                        }
                        className="cursor-pointer"
                      >
                        <img
                          src={verification.frontImage}
                          alt="Front"
                          className="w-full h-32 object-cover rounded"
                        />
                        <p className="text-center mt-1">Front</p>
                      </div>
                      <div
                        onClick={() => handleImageClick(verification.backImage)}
                        className="cursor-pointer"
                      >
                        <img
                          src={verification.backImage}
                          alt="Back"
                          className="w-full h-32 object-cover rounded"
                        />
                        <p className="text-center mt-1">Back</p>
                      </div>
                      <div
                        onClick={() =>
                          handleImageClick(verification.selfieImage)
                        }
                        className="cursor-pointer"
                      >
                        <img
                          src={verification.selfieImage}
                          alt="Selfie"
                          className="w-full h-32 object-cover rounded"
                        />
                        <p className="text-center mt-1">Selfie</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() =>
                      handleUpdateStatus(verification._id, "Verified")
                    }
                    className="px-4 py-2 bg-green-500 rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateStatus(verification._id, "Rejected")
                    }
                    className="px-4 py-2 bg-red-500 rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === "exchanges" ? (
          <div className="space-y-6">
            {exchanges.map((exchange) => (
              <div
                key={exchange.id}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10"
              >
                <div className="mb-4 pb-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white/90">
                      Exchange Details
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60">Exchange ID:</span>
                      <span className="font-mono bg-white/5 px-3 py-1 rounded-lg text-white/90">
                        {exchange.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Exchange Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white/90">
                      Exchange Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-white/60">From Currency:</p>
                        <p className="font-medium">
                          {exchange.currency_from?.toUpperCase()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-white/60">To Currency:</p>
                        <p className="font-medium">
                          {exchange.currency_to?.toUpperCase()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-white/60">Amount From:</p>
                        <p className="font-medium">{exchange.amount_from}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-white/60">Expected Amount:</p>
                        <p className="font-medium">
                          {exchange.expected_amount || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Address Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white/90">
                      Address Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-white/60">From Address:</p>
                        <p className="font-medium break-all">
                          {exchange.address_from || "Pending..."}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/60">To Address:</p>
                        <p className="font-medium break-all">
                          {exchange.address_to}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status and Additional Info */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-white/60">Status:</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1
                                            ${
                                              exchange.status === "finished"
                                                ? "bg-green-500/20 text-green-300"
                                                : exchange.status === "waiting"
                                                ? "bg-yellow-500/20 text-yellow-300"
                                                : exchange.status === "failed"
                                                ? "bg-red-500/20 text-red-300"
                                                : "bg-blue-500/20 text-blue-300"
                                            }`}
                    >
                      {exchange.status?.charAt(0).toUpperCase() +
                        exchange.status?.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white/60">Exchange Type:</p>
                    <p className="font-medium capitalize">{exchange.type}</p>
                  </div>
                  <div>
                    <p className="text-white/60">Created At:</p>
                    <p className="font-medium">
                      {new Date(exchange.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* User Information */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white/90 mb-4">
                    User Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-white/60">Authentication:</p>
                      <p className="font-medium">
                        {exchange.isLoggedIn
                          ? "Authenticated User"
                          : "Anonymous User"}
                      </p>
                    </div>
                    {exchange.isLoggedIn && (
                      <div>
                        <p className="text-white/60">User ID:</p>
                        <p className="font-medium break-all">
                          {exchange.userId}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-white/60">Exchange ID:</p>
                      <p className="font-medium break-all">{exchange.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === "locked" ? (
          <div className="space-y-6">
            {lockedExchanges.map((exchange) => (
              <div
                key={exchange.id}
                className="bg-red-500/10 backdrop-blur-sm rounded-lg p-6 border border-red-500/20"
              >
                <div className="mb-4 pb-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white/90">
                      Locked Exchange Details
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60">Exchange ID:</span>
                      <span className="font-mono bg-white/5 px-3 py-1 rounded-lg text-white/90">
                        {exchange.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                <div className="mb-4 pb-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white/90">
                    User Information
                  </h3>
                  <p className="text-white/60">
                    User ID:{" "}
                    <span className="font-medium text-white/90">
                      {exchange.userId || "Anonymous"}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Exchange Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white/90">
                      Current Exchange (USDT)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-white/60">From Currency:</p>
                        <p className="font-medium">
                          {exchange.currency_from?.toUpperCase()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-white/60">To Currency:</p>
                        <p className="font-medium">USDT</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-white/60">Amount From:</p>
                        <p className="font-medium">{exchange.amount_from}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-white/60">USDT Amount:</p>
                        <p className="font-medium text-green-400">
                          {exchange.amount_to} USDT
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Original Exchange Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white/90">
                      Original Request
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-white/60">To Currency:</p>
                        <p className="font-medium">
                          {exchange.originalCurrencyTo?.toUpperCase()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-white/60">To Address:</p>
                        <p className="font-medium break-all">
                          {exchange.originalAddressTo}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p className="text-white/60">Last Verification Check:</p>
                    <p className="font-medium">
                      {new Date(
                        exchange.verificationCheckedAt
                      ).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleMarkComplete(exchange)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Mark as Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-red-500/10 backdrop-blur-sm rounded-lg p-6 border border-red-500/20">
              <div className="mb-6 pb-4 border-b border-red-500/20">
                <h3 className="text-lg font-semibold text-red-400">
                  Recent Exchange Errors
                </h3>
                <p className="text-white/70 mt-2">
                  This section shows errors that occur during the exchange
                  process. Errors are displayed in real-time as they happen.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-white font-medium">Error Type</h4>
                      <p className="text-white/60 text-sm">
                        Exchange Process Error
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                      Failed
                    </span>
                  </div>
                  <p className="text-white/90 mb-2">
                    When errors occur during exchanges, they will appear here
                    with detailed information.
                  </p>
                  <div className="text-white/60 text-sm">
                    Monitor this section to track and address exchange-related
                    issues.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-500 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-500 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-4xl w-full mx-4">
            <div className="relative">
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-10 right-0 text-white"
              >
                Close
              </button>
              <img
                src={selectedImage}
                alt="Document"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      )}

      <ExchangeDialog
        open={isExchangeDialogOpen}
        onClose={() => setIsExchangeDialogOpen(false)}
        exchange={selectedExchange}
        onConfirm={handleExchangeConfirm}
      />
    </div>
  );
}
