"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendForgotPasswordEmailAction } from "@/app/actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    try {
      const res = await sendForgotPasswordEmailAction(email);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || "Failed to send reset link.");
      }
    } catch (e) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-md space-y-8 rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Link Sent!</h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
            We have sent password reset instructions to <strong>{email}</strong>. For the simulation, you can also reset your password directly using the mock link below.
          </p>
          <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-2.5">
            <Link href="/auth/reset-password">
              <Button className="w-full rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white py-5">
                Go to Reset Password Screen
              </Button>
            </Link>
            <Link href="/auth/login" className="text-xs font-bold text-gray-400 hover:text-gray-600 underline">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        
        {/* Header */}
        <div className="text-center">
          <span className="text-[11px] font-bold text-[#4285F4] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
            Stack Shack Nutrition
          </span>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight">Recover Password</h2>
          <p className="mt-2 text-xs text-gray-400">
            Enter your email below and we will send you a secure password reset link.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
                <Mail className="h-4.5 w-4.5" />
                <span>Send Reset Link</span>
              </>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-50">
          Remember your password?{" "}
          <Link href="/auth/login" className="font-bold text-[#4285F4] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
