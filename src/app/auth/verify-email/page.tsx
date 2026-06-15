"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyEmailAction } from "@/app/actions";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setError("Verification token is missing. Please check your email link.");
        setLoading(false);
        return;
      }

      try {
        const res = await verifyEmailAction(token);
        if (res.success) {
          setSuccess(true);
          if (res.email) setEmail(res.email);
        } else {
          setError(res.error || "Verification failed. Token may have expired.");
        }
      } catch (err: any) {
        setError("An unexpected error occurred during verification.");
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-white p-8">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#4285F4] mx-auto" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">Verifying Email...</h2>
          <p className="mt-2 text-xs text-gray-400">
            Please wait while we confirm your email verification details.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-md space-y-8 rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
            Your email address {email && <strong>{email}</strong>} has been successfully verified. You can now access all features.
          </p>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <Link href="/auth/login">
              <Button className="w-full rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white py-5 cursor-pointer font-bold">
                Continue to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
        <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
          {error}
        </p>
        <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-2.5">
          <Link href="/account">
            <Button className="w-full rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white py-5 cursor-pointer font-bold">
              Return to Account Page
            </Button>
          </Link>
          <Link href="/auth/login" className="text-xs font-bold text-gray-400 hover:text-gray-600 underline">
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[70vh] items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#4285F4] mx-auto" />
          <p className="mt-3 text-sm text-gray-500 font-medium">Loading verification portal...</p>
        </div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
