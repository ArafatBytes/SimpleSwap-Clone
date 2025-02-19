"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    router.push("/login");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", formData.email);
        router.push("/exchange");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Something went wrong");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-black">
      {/* Header */}
      <header className="bg-transparent border-b border-gray-800">
        <nav className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4">
          <div className="flex justify-between items-center">
            <Link
              href="/exchange"
              className="flex items-center gap-2 text-white text-2xl font-bold"
            >
              <Image
                src="/favicon1b66.ico"
                alt="SimpleSwap Icon"
                width={32}
                height={32}
                className="text-white"
              />
              <span className="text-[14px] sm:text-[16px] md:text-[18px] font-semibold">
                <span
                  style={{
                    color: "#67e8f9",
                    textShadow: "0 0 2px rgba(103, 232, 249, 0.3)",
                  }}
                >
                  Simple
                </span>
                <span
                  style={{
                    color: "#c084fc",
                    textShadow: "0 0 2px rgba(192, 132, 252, 0.3)",
                  }}
                >
                  2
                </span>
                <span
                  style={{
                    color: "#67e8f9",
                    textShadow: "0 0 2px rgba(103, 232, 249, 0.3)",
                  }}
                >
                  Swap
                </span>
              </span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
            >
              <span className="text-sm">Back to Home</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center flex-1 min-h-[calc(100vh-73px)] px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md backdrop-blur-md bg-white/10 rounded-[30px] p-8 shadow-xl border border-white/20">
          <div className="text-center">
            <h2
              className="text-white text-2xl font-medium mb-2"
              style={{ fontFamily: "Poppins, Inter, sans-serif" }}
            >
              Welcome Back
            </h2>
            <p
              className="text-gray-300 text-sm"
              style={{ fontFamily: "Poppins, Inter, sans-serif" }}
            >
              Sign in to continue with Simple2Swap
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-12 space-y-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-200"
                  style={{ fontFamily: "Poppins, Inter, sans-serif" }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#0f75fc] text-white placeholder-gray-400 backdrop-blur-sm"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-200"
                  style={{ fontFamily: "Poppins, Inter, sans-serif" }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="mt-1 block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#0f75fc] text-white placeholder-gray-400 backdrop-blur-sm"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {showPassword ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="text-center">
              <p
                className="text-sm text-gray-300"
                style={{ fontFamily: "Poppins, Inter, sans-serif" }}
              >
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-[#0f75fc] hover:text-[#123276]"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
