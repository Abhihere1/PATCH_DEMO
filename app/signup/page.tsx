"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !email || !password) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error || "Signup failed");
      } else {
        sessionStorage.setItem("signup_success", "Account created! Please sign in.");
        router.push("/login");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="auth-layout" className="min-h-screen flex">
      {/* Left panel */}
      <div
        data-testid="brand-panel"
        className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{
          background: "linear-gradient(135deg, #FFF7F7 0%, #FFF0F0 40%, #FFE8E8 100%)",
        }}
      >
        <div>
          <div className="flex items-center gap-2 mb-16">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold text-base">
              P
            </div>
            <span className="font-bold text-gray-900 text-lg">Patch</span>
          </div>

          <h1 data-testid="brand-hero-title" className="text-4xl font-bold text-gray-900 leading-tight mb-3">
            Discount Tire<br />Information Center
          </h1>
          <p data-testid="brand-hero-subtitle" className="text-xl text-gray-600">
            IT support, resolved faster.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { value: "< 2 min", label: "Avg. Resolution" },
            { value: "94%", label: "Self-Serve Rate" },
            { value: "24/7", label: "Always Available" },
            { value: "100+", label: "KB Articles" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/60 rounded-xl p-4 backdrop-blur"
            >
              <p className="text-2xl font-bold text-red-600">{stat.value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div
        data-testid="form-panel"
        className="flex flex-1 items-center justify-center p-8 bg-white"
      >
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 data-testid="form-heading" className="text-2xl font-bold text-gray-900">
              Create an account
            </h2>
            <p className="text-sm text-gray-500 mt-1">Join the Discount Tire portal</p>
          </div>

          <form data-testid="signup-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                data-testid="username-label"
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username
              </label>
              <input
                id="username"
                data-testid="username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your name"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors"
                autoComplete="username"
              />
            </div>

            <div>
              <label
                data-testid="email-label"
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                data-testid="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                data-testid="password-label"
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                data-testid="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p data-testid="signup-error" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              data-testid="signup-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm mt-2"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              data-testid="signin-link"
              className="text-red-600 font-medium hover:text-red-700 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
