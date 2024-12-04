'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function AdminPanel() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('verifications');
    const [verifications, setVerifications] = useState([]);
    const [exchanges, setExchanges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedVerification, setSelectedVerification] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchData();
    }, [activeTab, currentPage]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'verifications') {
                const res = await fetch(`/api/admin/verifications?page=${currentPage}`);
                const data = await res.json();
                if (data.success) {
                    setVerifications(data.data.verifications);
                    setTotalPages(data.data.pagination.pages);
                } else {
                    throw new Error(data.message);
                }
            } else {
                const res = await fetch(`/api/admin/exchanges?page=${currentPage}`);
                const data = await res.json();
                if (data.success) {
                    setExchanges(data.data.exchanges);
                    setTotalPages(data.data.pagination.pages);
                } else {
                    throw new Error(data.message);
                }
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch data');
            if (error.message.includes('Unauthorized')) {
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await fetch('/api/admin/verifications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, status }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Status updated successfully');
                // Remove the verification from the local state
                setVerifications(prev => prev.filter(v => v._id !== id));
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update status');
        }
    };

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setShowImageModal(true);
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
                        href="/"
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
                                setActiveTab('verifications');
                                setCurrentPage(1);
                            }}
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                activeTab === 'verifications'
                                    ? 'bg-[#0f75fc] text-white shadow-lg'
                                    : 'text-white/70 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            Verifications
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('exchanges');
                                setCurrentPage(1);
                            }}
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                activeTab === 'exchanges'
                                    ? 'bg-[#0f75fc] text-white shadow-lg'
                                    : 'text-white/70 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            Exchanges
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center">Loading...</div>
                ) : activeTab === 'verifications' ? (
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
                                        <p>Name: {verification.firstName} {verification.lastName}</p>
                                        <p>Email: {verification.email}</p>
                                        <p>Document Type: {verification.documentType}</p>
                                        <p>Document Number: {verification.documentNumber}</p>
                                        <p>Status: {verification.verificationStatus}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">
                                            Documents
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div 
                                                onClick={() => handleImageClick(verification.frontImage)}
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
                                                onClick={() => handleImageClick(verification.selfieImage)}
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
                                        onClick={() => handleUpdateStatus(verification._id, 'Verified')}
                                        className="px-4 py-2 bg-green-500 rounded hover:bg-green-600"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(verification._id, 'Rejected')}
                                        className="px-4 py-2 bg-red-500 rounded hover:bg-red-600"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {exchanges.map((exchange) => (
                            <div
                                key={exchange._id}
                                className="bg-white/10 rounded-lg p-6"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p>From: {exchange.fromCurrency}</p>
                                        <p>Amount: {exchange.fromAmount}</p>
                                    </div>
                                    <div>
                                        <p>To: {exchange.toCurrency}</p>
                                        <p>Amount: {exchange.toAmount}</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p>Status: {exchange.status}</p>
                                    <p>Created: {new Date(exchange.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                <div className="flex justify-center space-x-4 mt-8">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-blue-500 rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
        </div>
    );
}
