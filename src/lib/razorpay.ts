import Razorpay from "razorpay";
import * as crypto from "crypto";

/**
 * Creates a Razorpay order in paisa (amount * 100).
 * Falls back to a simulated order object if API keys are missing.
 */
export async function createPaymentOrder(amount: number, receipt: string, keyId?: string | null, keySecret?: string | null) {

  if (!keyId || !keySecret) {
    console.log("⚠️ Razorpay API key credentials missing. Initializing simulated Payment Order ID.");
    return {
      id: `order_sim_${Math.random().toString(36).substring(2, 15)}`,
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt,
      simulated: true,
    };
  }

  try {
    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await instance.orders.create({
      amount: Math.round(amount * 100), // Razorpay requires sub-units (paisa)
      currency: "INR",
      receipt,
    });

    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      simulated: false,
    };
  } catch (error) {
    console.error("Razorpay API order creation failed:", error);
    return {
      id: `order_sim_${Math.random().toString(36).substring(2, 15)}`,
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt,
      simulated: true,
      error,
    };
  }
}

/**
 * Verifies Razorpay payment signatures using HMAC SHA256 hashing.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret?: string | null
) {
  if (!keySecret) {
    console.log("⚠️ Verification key secret missing. Simulated payment verification matches.");
    return true;
  }

  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    return generatedSignature === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}
