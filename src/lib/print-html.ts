/**
 * HTML Thermal Print Utility
 */

import { Order, Table, Customer, User } from "@/app/context/AppContext";

export function printReceiptHtml(
  order: Order,
  paperWidth: "80mm" | "58mm",
  isKitchenTicket: boolean,
  tables: Table[],
  customers: Customer[],
  users: User[]
) {
  // Find related info
  const table = tables.find((t) => t.id === order.tableId);
  const customer = customers.find((c) => c.id === order.customerId);
  const cashier = users.find((u) => u.id === order.employeeId);

  const formattedDate = new Date(order.createdAt).toLocaleString("en-IN", {
    dateStyle: "short",
    timeStyle: "medium",
  });

  const widthCss = paperWidth === "58mm" ? "58mm" : "80mm";
  const paddingCss = paperWidth === "58mm" ? "2mm" : "4mm";

  let htmlContent = "";

  if (isKitchenTicket) {
    // ── KITCHEN TICKET LAYOUT ────────────────────────────────────────────────
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>KDS Ticket</title>
        <style>
          @page {
            size: ${widthCss} auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: ${paddingCss};
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            line-height: 1.4;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .header-title {
            font-size: 20px;
            border-bottom: 2px dashed #000;
            padding-bottom: 5px;
            margin-bottom: 10px;
          }
          .ticket-info {
            font-size: 14px;
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
          }
          .large-text {
            font-size: 18px;
          }
          .item-row {
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px dotted #000;
          }
          .item-header {
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            font-weight: bold;
          }
          .modifier-item {
            font-size: 13px;
            padding-left: 20px;
            font-style: italic;
          }
          .notes {
            font-size: 13px;
            padding-left: 20px;
            color: #444;
            margin-top: 3px;
          }
          .divider {
            border-top: 2px dashed #000;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="center bold header-title">
          KITCHEN TICKET
        </div>
        
        <div class="ticket-info">
          <div><span class="bold">Order No:</span> ${order.orderNumber}</div>
          <div class="large-text"><span class="bold">Table:</span> ${table ? table.tableNumber : "Takeaway / N/A"}</div>
          <div><span class="bold">Type:</span> ${order.type || "DINE_IN"}</div>
          <div><span class="bold">Time:</span> ${formattedDate}</div>
          ${order.notes ? `<div class="large-text bold" style="margin-top:5px; background:#eee; padding:2px;">Notes: ${order.notes}</div>` : ""}
        </div>

        <div class="items-section">
          ${order.items
            .filter(item => item.status !== "CANCELLED" as any)
            .map((item) => `
              <div class="item-row">
                <div class="item-header">
                  <span>${item.quantity}x ${item.name}</span>
                </div>
                ${
                  item.selectedModifiers && item.selectedModifiers.length > 0
                    ? item.selectedModifiers
                        .map(
                          (mod: any) => `
                        <div class="modifier-item">
                          + ${mod.groupName}: ${mod.name}
                        </div>
                      `
                        )
                        .join("")
                    : ""
                }
                ${item.notes ? `<div class="notes">Note: ${item.notes}</div>` : ""}
              </div>
            `)
            .join("")}
        </div>

        <div class="divider"></div>
        <div class="center bold" style="font-size: 12px;">
          Sent to Kitchen: ${new Date().toLocaleTimeString()}
        </div>
      </body>
      </html>
    `;
  } else {
    // ── CLIENT BILL LAYOUT ───────────────────────────────────────────────────
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Client Receipt</title>
        <style>
          @page {
            size: ${widthCss} auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: ${paddingCss};
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            line-height: 1.3;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .right { text-align: right; }
          .header {
            margin-bottom: 10px;
          }
          .brand-name {
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .meta-section {
            margin-bottom: 8px;
            font-size: 11px;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .double-divider {
            border-top: 2px dashed #000;
            margin: 6px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            text-align: left;
            font-weight: bold;
            border-bottom: 1px dashed #000;
            padding-bottom: 4px;
          }
          td {
            padding: 3px 0;
            vertical-align: top;
          }
          .item-name {
            font-weight: bold;
          }
          .item-modifiers {
            font-size: 10px;
            padding-left: 10px;
            font-style: italic;
          }
          .totals-table td {
            padding: 2px 0;
          }
          .grand-total {
            font-size: 14px;
            font-weight: bold;
          }
          .footer {
            margin-top: 15px;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header center">
          <div class="brand-name">ORDERHUB CAFÉ</div>
          <div>123 Gourmet Blvd, Food District</div>
          <div>Phone: +91 98765 43210</div>
          <div>GSTIN: 27AAAAA1111A1Z1</div>
        </div>

        <div class="divider"></div>

        <div class="meta-section">
          <div><span class="bold">Receipt:</span> ${order.orderNumber}</div>
          <div><span class="bold">Date   :</span> ${formattedDate}</div>
          <div><span class="bold">Type   :</span> ${order.type || "DINE_IN"}</div>
          ${table ? `<div><span class="bold">Table  :</span> ${table.tableNumber}</div>` : ""}
          ${customer ? `<div><span class="bold">Guest  :</span> ${customer.name} (${customer.phone || "N/A"})</div>` : ""}
          ${cashier ? `<div><span class="bold">Cashier:</span> ${cashier.name}</div>` : ""}
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th style="width: 50%;">Item</th>
              <th style="width: 15%; text-align: center;">Qty</th>
              <th style="width: 35%; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map((item) => {
                const totalItemPrice = (item.unitPrice + (item.selectedModifiers || []).reduce((acc: number, mod: any) => acc + (mod.priceAdjustment || 0), 0)) * item.quantity;
                return `
                  <tr>
                    <td>
                      <div class="item-name">${item.name}</div>
                      ${
                        item.selectedModifiers && item.selectedModifiers.length > 0
                          ? item.selectedModifiers
                              .map(
                                (mod: any) => `
                              <div class="item-modifiers">
                                + ${mod.name} ${mod.priceAdjustment > 0 ? `(₹${mod.priceAdjustment})` : ""}
                              </div>
                            `
                              )
                              .join("")
                          : ""
                      }
                      ${item.notes ? `<div class="item-modifiers" style="opacity: 0.8;">* ${item.notes}</div>` : ""}
                    </td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">₹${totalItemPrice.toFixed(2)}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>

        <div class="divider"></div>

        <table class="totals-table">
          <tr>
            <td>Subtotal</td>
            <td style="text-align: right;">₹${order.subtotal.toFixed(2)}</td>
          </tr>
          ${
            order.discounts > 0
              ? `
          <tr>
            <td>Discounts</td>
            <td style="text-align: right;">-₹${order.discounts.toFixed(2)}</td>
          </tr>
          `
              : ""
          }
          <tr>
            <td>CGST / SGST (5%)</td>
            <td style="text-align: right;">₹${order.tax.toFixed(2)}</td>
          </tr>
          <tr class="grand-total">
            <td style="padding-top: 6px;">GRAND TOTAL</td>
            <td style="text-align: right; padding-top: 6px;">₹${order.total.toFixed(2)}</td>
          </tr>
        </table>

        <div class="double-divider"></div>

        <div class="footer center">
          <div class="bold">THANK YOU FOR YOUR VISIT!</div>
          <div style="margin-top: 5px;">Powering Delicious Experiences</div>
          <div style="font-size: 9px; margin-top: 3px; opacity: 0.7;">System ID: ${order.id}</div>
        </div>
      </body>
      </html>
    `;
  }

  // Create iframe element
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  iframe.style.left = "-9999px";
  
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || (iframe.contentWindow ? iframe.contentWindow.document : null);
  if (!doc) {
    console.error("Could not obtain iframe document context for printing");
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Wait for content rendering or resources to load, then trigger print dialog
  setTimeout(() => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
    } catch (err) {
      console.error("HTML Direct Print trigger failed:", err);
    } finally {
      // Delay clean removal of iframe to avoid interfering with print operation
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  }, 350);
}
