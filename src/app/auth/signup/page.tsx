"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const { signup } = useStore();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await signup(name.trim(), email.trim(), password);
      if (res.success) {
        router.push("/account");
      } else {
        setError(res.error || "Failed to create account.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        
        {/* Header Title */}
        <div className="text-center">
          <span className="text-[11px] font-bold text-[#4285F4] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
            Stack Shack Nutrition
          </span>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight">Create Account</h2>
          <p className="mt-2 text-xs text-gray-400">
            Sign up to track purchases, save products, and customize plans.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Full Name</label>
            <input
              type="text"
              required
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-[#F8F9FA] px-4 py-2.5 text-sm text-gray-800 outline-none border border-transparent focus:border-[#4285F4] focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Email Address</label>
            <input
              type="email"
              required
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-[#F8F9FA] px-4 py-2.5 text-sm text-gray-800 outline-none border border-transparent focus:border-[#4285F4] focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-[#F8F9FA] px-4 py-2.5 text-sm text-gray-800 outline-none border border-transparent focus:border-[#4285F4] focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Confirm Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl bg-[#F8F9FA] px-4 py-2.5 text-sm text-gray-800 outline-none border border-transparent focus:border-[#4285F4] focus:bg-white transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50/50 p-3 rounded-xl border border-red-100/30">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold py-6 mt-4 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {loading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4.5 w-4.5" />
                <span>Create Account</span>
              </>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-50">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-bold text-[#4285F4] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
