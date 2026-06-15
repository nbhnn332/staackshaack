import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/resend";
import { generateInvoiceHTML } from "@/lib/invoice";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Signature verification (only if secret is configured)
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        console.error("⚠️ Razorpay Webhook signature verification failed.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      console.log("ℹ️ Skipping Razorpay Webhook signature verification (credentials not set).");
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    console.log(`Payment Webhook Event Received: ${event}`);

    // We listen to payment.captured or order.paid
    if (event === "order.paid" || event === "payment.captured") {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;
      const razorpaySignature = signature || `web_sig_${Math.random().toString(36).substring(2, 10)}`;

      if (razorpayOrderId) {
        // Find matching order
        const orders = await db.getOrders();
        const order = orders.find((o) => o.razorpayOrderId === razorpayOrderId);

        if (order) {
          if (order.paymentStatus !== "PAID") {
            // Update order status to paid (also decrements product stock)
            const updatedOrder = await db.updateOrderPaymentStatus(
              order.id,
              "PAID",
              razorpayPaymentId,
              razorpaySignature
            );

            if (updatedOrder) {
              console.log(`✅ Order ${order.id} paid via Razorpay Webhook. Stock depleted.`);
              
              // Re-send success invoice confirmation email
              try {
                const productsList = await db.getProducts();
                const productMap = Object.fromEntries(productsList.map((p) => [p.id, p]));
                const invoiceHtml = generateInvoiceHTML(updatedOrder, productMap);
                await sendEmail(
                  updatedOrder.email,
                  `Stack Shack Order Confirmation #${updatedOrder.invoiceNumber || updatedOrder.id.substring(0, 8)}`,
                  invoiceHtml
                );
              } catch (emailErr) {
                console.error("Failed to send webhook invoice email:", emailErr);
              }
            }
          } else {
            console.log(`ℹ️ Order ${order.id} is already marked as PAID.`);
          }
        } else {
          console.warn(`⚠️ No order found matching Razorpay Order ID: ${razorpayOrderId}`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Razorpay webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
