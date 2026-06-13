/**
 * Generates a thermal-style receipt and opens the browser print dialog
 * so the user can save it as a PDF.
 *
 * No external libraries required — uses a hidden iframe with print-only CSS.
 */

export interface ReceiptData {
  orderNumber: string;
  createdAt: string;
  cashierName: string;
  guestName: string;
  tableNumber: string;
  items: { name: string; quantity: number; total: number }[];
  subtotal: number;
  tax: number;
  discounts: number;
  total: number;
  paymentMethod: string;
  paymentReference?: string;
}

export function downloadReceiptPDF(data: ReceiptData) {
  const html = buildReceiptHTML(data);

  // Use a hidden iframe so we don't navigate away from the page
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:80mm;height:0;border:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for fonts/images to load then print
  iframe.contentWindow?.addEventListener("load", () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Clean up after print dialog closes
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 250);
  });
}

function buildReceiptHTML(d: ReceiptData): string {
  const itemRows = d.items
    .map(
      (it) => `
      <tr>
        <td style="padding:2px 0;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${it.name}</td>
        <td style="padding:2px 4px;text-align:center;">${it.quantity}</td>
        <td style="padding:2px 0;text-align:right;">$${it.total.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const discountRow =
    d.discounts > 0
      ? `<tr><td colspan="2" style="text-align:right;padding:1px 0;">Discounts:</td><td style="text-align:right;padding:1px 0;color:#dc2626;">-$${d.discounts.toFixed(2)}</td></tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Receipt – ${d.orderNumber}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 6mm 4mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #1c1917;
      width: 72mm;
    }
    .center { text-align: center; }
    .right  { text-align: right; }
    .bold   { font-weight: 700; }
    .dashed { border-top: 1px dashed #a8a29e; margin: 6px 0; }
    h1 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; }
    th { font-weight: 700; border-bottom: 1px dashed #a8a29e; padding: 3px 0; font-size: 10px; }
    .totals td { padding: 1px 0; }
    .grand-total { font-size: 13px; font-weight: 900; border-top: 1px dashed #a8a29e; padding-top: 4px; }
    .footer { font-size: 9px; color: #78716c; text-align: center; margin-top: 8px; }
    @media print {
      html, body { width: 80mm; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="center" style="margin-bottom:8px;">
    <h1>Odoo Cafe POS</h1>
    <div>Ground Floor, Main Block</div>
    <div>Phone: +1 555 CAFE</div>
    <div style="font-size:9px;color:#a8a29e;margin-top:2px;">─── TAX INVOICE ───</div>
  </div>

  <!-- Order info -->
  <div class="dashed"></div>
  <table class="totals" style="margin-bottom:4px;">
    <tr><td class="bold">Order:</td><td class="right">${d.orderNumber}</td></tr>
    <tr><td class="bold">Date:</td><td class="right">${new Date(d.createdAt).toLocaleString()}</td></tr>
    <tr><td class="bold">Cashier:</td><td class="right">${d.cashierName}</td></tr>
    <tr><td class="bold">Guest:</td><td class="right">${d.guestName}</td></tr>
    <tr><td class="bold">Table:</td><td class="right">${d.tableNumber}</td></tr>
  </table>

  <!-- Items -->
  <div class="dashed"></div>
  <table>
    <thead>
      <tr>
        <th style="text-align:left;">Item</th>
        <th style="text-align:center;width:30px;">Qty</th>
        <th style="text-align:right;width:60px;">Price</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <!-- Totals -->
  <div class="dashed"></div>
  <table class="totals">
    <tr><td colspan="2" style="text-align:right;padding:1px 0;">Subtotal:</td><td style="text-align:right;padding:1px 0;">$${d.subtotal.toFixed(2)}</td></tr>
    <tr><td colspan="2" style="text-align:right;padding:1px 0;">Tax:</td><td style="text-align:right;padding:1px 0;">$${d.tax.toFixed(2)}</td></tr>
    ${discountRow}
    <tr class="grand-total"><td colspan="2" style="text-align:right;">TOTAL PAID:</td><td style="text-align:right;">$${d.total.toFixed(2)}</td></tr>
  </table>

  <!-- Payment -->
  <div class="dashed"></div>
  <table class="totals">
    <tr><td class="bold">Payment:</td><td class="right">${d.paymentMethod}</td></tr>
    ${d.paymentReference ? `<tr><td></td><td class="right" style="font-size:9px;color:#78716c;">${d.paymentReference}</td></tr>` : ""}
  </table>

  <!-- Footer -->
  <div class="dashed"></div>
  <div class="footer">
    <div class="bold" style="font-size:11px;color:#1c1917;margin-bottom:2px;">THANK YOU FOR YOUR VISIT!</div>
    <div>Please come again • Powered by OrderHub</div>
  </div>
</body>
</html>`;
}
