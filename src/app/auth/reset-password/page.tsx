"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { resetPasswordWithTokenAction } from "@/app/actions";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token is missing. Please request a new password reset link.");
      return;
    }

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
      const res = await resetPasswordWithTokenAction(token, password);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || "Failed to reset password.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
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
          <h2 className="text-2xl font-bold text-gray-900">Password Reset!</h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
            Your password has been successfully reset. You can now sign in using your new credentials.
          </p>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <Link href="/auth/login">
              <Button className="w-full rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white py-5 cursor-pointer">
                Sign In to Account
              </Button>
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
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight">Reset Password</h2>
          <p className="mt-2 text-xs text-gray-400">
            Create a strong new password below.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">New Password</label>
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

          {!token && (
            <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100/30">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>No token found. Please use the reset link sent to your email.</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold py-6 mt-4 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {loading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <>
                <KeyRound className="h-4.5 w-4.5" />
                <span>Reset Password</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[70vh] items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#4285F4] mx-auto" />
          <p className="mt-3 text-sm text-gray-500 font-medium">Loading password reset form...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
