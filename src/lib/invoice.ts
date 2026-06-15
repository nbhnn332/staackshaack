import { Order, Product } from "./mock-db";
import { formatINR, parseAddress } from "@/lib/utils";

/**
 * Builds a clean, responsive HTML template for customer receipts and invoices.
 */
export function generateInvoiceHTML(
  order: Order,
  resolvedProducts: { [id: string]: Product }
): string {
  const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

    const orderItemsHTML = order.items
    .map((item) => {
      const p = resolvedProducts[item.productId];
      const name = item.productName || (p ? p.name : "Sports Supplement Item");
      const lineTotal = item.price * item.quantity;
      const imgUrl = item.productImage || (p?.images?.[0] || "");
      const weightLabel = `${item.weight || 1} ${item.weightUnit || 'kg'}`;
      
      return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: left; font-size: 14px; color: #1F2937;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${imgUrl ? `<img src="${imgUrl}" alt="${name}" style="width: 32px; height: 32px; object-fit: contain; border-radius: 4px; border: 1px solid #F3F4F6; background: #fff;" />` : ''}
            <strong>${name}</strong>
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: center; font-size: 13px; color: #6B7280;">
          ${weightLabel}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: center; font-size: 14px; color: #4B5563;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right; font-size: 14px; color: #4B5563;">
          ${formatINR(item.price)}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right; font-size: 14px; font-weight: bold; color: #1F2937;">
          ${formatINR(lineTotal)}
        </td>
      </tr>
    `;
    })
    .join("");

  const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${order.invoiceNumber || order.id}</title>
    </head>
    <body style="font-family: 'Outfit', sans-serif; background-color: #FFFFFF; color: #1F2937; margin: 0; padding: 20px; text-align: center;">
      <div style="max-w: 600px; margin: 0 auto; border: 1px solid #F3F4F6; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); text-align: left;">
        
        <!-- Header logo -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F3F4F6; padding-bottom: 24px;">
          <div>
            <h1 style="font-size: 20px; font-weight: 800; color: #1F2937; margin: 0; text-transform: uppercase;">
              Stack Shack<span style="color: #4285F4;"> Nutrition</span>
            </h1>
            <p style="font-size: 12px; color: #9CA3AF; margin: 4px 0 0 0;">Premium Athletic Supplements</p>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; font-size: 11px; font-weight: bold; background-color: #E8F0FE; color: #4285F4; padding: 4px 12px; border-radius: 9999px;">
              ${order.paymentStatus === "PAID" ? "PAID RECEIPT" : "INVOICE: PENDING"}
            </span>
            <p style="font-size: 12px; color: #4B5563; margin: 6px 0 0 0;">${order.invoiceNumber || `INV-${order.id.substring(0, 8).toUpperCase()}`}</p>
          </div>
        </div>

        <!-- Info Grid -->
        <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-top: 24px;">
          <div>
            <h5 style="font-size: 10px; font-weight: bold; color: #9CA3AF; text-transform: uppercase; margin: 0 0 6px 0; letter-spacing: 0.05em;">Billed To</h5>
            <p style="font-size: 13px; font-weight: bold; color: #1F2937; margin: 0;">${order.name}</p>
            <p style="font-size: 12px; color: #4B5563; margin: 2px 0 0 0;">${order.email}</p>
            ${(() => {
              const parsed = parseAddress(order.address);
              if (typeof parsed === 'string') {
                return `<p style="font-size: 12px; color: #4B5563; margin: 2px 0 0 0; max-width: 200px; line-height: 1.4;">${order.address}</p>`;
              } else {
                return `
                  <p style="font-size: 12px; color: #4B5563; margin: 2px 0 0 0;">Mobile: ${parsed.mobile}</p>
                  <p style="font-size: 12px; color: #4B5563; margin: 6px 0 0 0; max-width: 200px; line-height: 1.4;">
                    ${parsed.house}${parsed.street ? `, ${parsed.street}` : ""}<br>
                    PO: ${parsed.postOffice}<br>
                    ${parsed.city}, ${parsed.district}<br>
                    ${parsed.state} - ${parsed.pin}${parsed.country ? `<br>${parsed.country}` : ''}
                  </p>
                `;
              }
            })()}
          </div>
          <div style="text-align: right;">
            <h5 style="font-size: 10px; font-weight: bold; color: #9CA3AF; text-transform: uppercase; margin: 0 0 6px 0; letter-spacing: 0.05em;">Order Details</h5>
            <p style="font-size: 12px; color: #4B5563; margin: 0;"><strong>Date:</strong> ${dateStr}</p>
            <p style="font-size: 12px; color: #4B5563; margin: 2px 0 0 0;"><strong>Status:</strong> ${order.status}</p>
            ${order.trackingNumber ? `<p style="font-size: 12px; color: #4B5563; margin: 2px 0 0 0;"><strong>Tracking:</strong> ${order.trackingNumber}</p>` : ""}
          </div>
        </div>

        <!-- Invoice Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 32px;">
          <thead>
            <tr style="background-color: #F9FAFB;">
              <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: bold; color: #9CA3AF; text-transform: uppercase; border-bottom: 1px solid #E5E7EB;">Item</th>
              <th style="padding: 12px; text-align: center; font-size: 11px; font-weight: bold; color: #9CA3AF; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; width: 60px;">Weight</th>
              <th style="padding: 12px; text-align: center; font-size: 11px; font-weight: bold; color: #9CA3AF; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; width: 60px;">Qty</th>
              <th style="padding: 12px; text-align: right; font-size: 11px; font-weight: bold; color: #9CA3AF; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; width: 80px;">Rate</th>
              <th style="padding: 12px; text-align: right; font-size: 11px; font-weight: bold; color: #9CA3AF; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; width: 100px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${orderItemsHTML}
          </tbody>
        </table>

        <!-- Summary Calculation -->
        <div style="margin-top: 24px; text-align: right; width: 220px; margin-left: auto;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4B5563; margin-bottom: 6px;">
            <span>Subtotal:</span>
            <span>${formatINR(subtotal)}</span>
          </div>
          ${order.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #EF4444; margin-bottom: 6px; font-weight: 500;">
              <span>Discount (${order.couponCode || "Coupon"}):</span>
              <span>-${formatINR(order.discount)}</span>
            </div>
          ` : ""}
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4B5563; margin-bottom: 6px;">
            <span>Tax:</span>
            <span>${formatINR(order.tax)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4B5563; margin-bottom: 6px;">
            <span>Shipping:</span>
            <span>${order.shippingFee === 0 ? "FREE" : formatINR(order.shippingFee)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; color: #1F2937; margin-top: 12px; pt-12; border-top: 2px solid #F3F4F6;">
            <span>Total:</span>
            <span>${formatINR(order.total)}</span>
          </div>
        </div>

        <!-- Footer terms -->
        <div style="margin-top: 40px; border-top: 1px solid #F3F4F6; pt-20; text-align: center; font-size: 11px; color: #9CA3AF; line-height: 1.5;">
          <p style="margin: 0 0 4px 0;">If you have any questions about this invoice, please email support@stackshack.com</p>
          <p style="margin: 0;">Thank you for stacking with Stack Shack Nutrition!</p>
        </div>

      </div>
    </body>
    </html>
  `;
}
