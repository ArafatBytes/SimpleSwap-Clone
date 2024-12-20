"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Verification() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    documentType: "passport",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    documentNumber: "",
  });
  const [files, setFiles] = useState({
    frontImage: null,
    backImage: null,
    selfieImage: null,
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: uploadedFiles } = e.target;
    if (uploadedFiles.length > 0) {
      setFiles((prev) => ({
        ...prev,
        [name]: uploadedFiles[0],
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      submitData.append(key, formData[key]);
    });
    Object.keys(files).forEach((key) => {
      if (files[key]) {
        submitData.append(key, files[key]);
      }
    });

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        body: submitData,
      });

      const data = await response.json();

      if (response.ok) {
        // Show success toast before redirecting
        toast.success("Documents submitted successfully! Redirecting...", {
          position: "top-right",
          autoClose: 2000, // Slightly shorter than redirect time
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });

        // Redirect after toast shows
        setTimeout(() => {
          router.push("/exchange");
        }, 2500);
      } else if (response.status === 401) {
        toast.error("Please login first", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
        setTimeout(() => {
          router.push("/login");
        }, 2500);
      } else {
        throw new Error(data.message || "Failed to submit documents");
      }
    } catch (error) {
      toast.error(
        error.message || "Error submitting documents. Please try again.",
        {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        }
      );
    } finally {
      setLoading(false);
    }
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
            <span className="text-xl font-semibold">SimpleSwap</span>
          </div>
          <Link
            href="/exchange"
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
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
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">ID Verification</h1>

        {/* Main Form with glassy background */}
        <div className="backdrop-blur-md bg-white/10 rounded-lg p-6 shadow-lg border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Document Type Selection */}
            <div>
              <label className="block mb-2">Document Type</label>
              <select
                name="documentType"
                value={formData.documentType}
                onChange={handleInputChange}
                className="w-full p-3 rounded bg-[#041E42] border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="passport">Passport</option>
                <option value="nationalId">National ID Card</option>
                <option value="drivingLicense">Driving License</option>
              </select>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 rounded bg-[#041E42] border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 rounded bg-[#041E42] border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 rounded bg-[#041E42] border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-2">Document Number</label>
                <input
                  type="text"
                  name="documentNumber"
                  value={formData.documentNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 rounded bg-[#041E42] border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Document Upload Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Document Upload</h3>

              <div>
                <label className="block mb-2">Front Side of Document</label>
                <input
                  type="file"
                  name="frontImage"
                  onChange={handleFileChange}
                  accept="image/*"
                  required
                  className="w-full p-3 rounded bg-[#041E42] border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-2">Back Side of Document</label>
                <input
                  type="file"
                  name="backImage"
                  onChange={handleFileChange}
                  accept="image/*"
                  required
                  className="w-full p-3 rounded bg-[#041E42] border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-2">Selfie with Document</label>
                <input
                  type="file"
                  name="selfieImage"
                  onChange={handleFileChange}
                  accept="image/*"
                  required
                  className="w-full p-3 rounded bg-[#041E42] border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <p className="text-sm text-gray-400 mt-1">
                  Please take a photo of yourself holding your ID document
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit for Verification"}
            </button>
          </form>
        </div>

        {/* Instructions with glassy background */}
        <div className="mt-8 backdrop-blur-md bg-white/10 rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-semibold mb-4">Important Instructions</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Make sure all document images are clear and readable</li>
            <li>File size should not exceed 5MB per image</li>
            <li>Accepted formats: JPG, PNG, PDF</li>
            <li>
              Your selfie should clearly show both your face and the document
            </li>
            <li>All information on the document should be clearly visible</li>
          </ul>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
