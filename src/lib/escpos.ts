/**
 * ESC/POS Binary Code Builder & USB Web Serial Printer Driver
 */

export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.initialize();
  }

  initialize() {
    this.buffer.push(0x1b, 0x40); // ESC @
    return this;
  }

  alignLeft() {
    this.buffer.push(0x1b, 0x61, 0x00); // ESC a 0
    return this;
  }

  alignCenter() {
    this.buffer.push(0x1b, 0x61, 0x01); // ESC a 1
    return this;
  }

  alignRight() {
    this.buffer.push(0x1b, 0x61, 0x02); // ESC a 2
    return this;
  }

  bold(enable: boolean) {
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00); // ESC E n
    return this;
  }

  fontSize(width: 1 | 2, height: 1 | 2) {
    let size = 0x00;
    if (width === 2) size |= 0x10;
    if (height === 2) size |= 0x01;
    this.buffer.push(0x1d, 0x21, size); // GS ! n
    return this;
  }

  text(str: string) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  line(str: string = "") {
    this.text(str);
    this.buffer.push(0x0a); // LF
    return this;
  }

  feed(lines: number = 1) {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  divider(paperWidth: "80mm" | "58mm" = "80mm", char: string = "-") {
    const cols = paperWidth === "80mm" ? 48 : 32;
    this.line(char.repeat(cols));
    return this;
  }

  twoColumn(left: string, right: string, paperWidth: "80mm" | "58mm" = "80mm") {
    const cols = paperWidth === "80mm" ? 48 : 32;
    const leftLen = left.length;
    const rightLen = right.length;
    const spaces = Math.max(1, cols - leftLen - rightLen);
    this.line(left + " ".repeat(spaces) + right);
    return this;
  }

  cut() {
    this.buffer.push(0x1d, 0x56, 0x41, 0x00); // GS V 65 0
    return this;
  }

  kickDrawer() {
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa); // ESC p 0 25 250
    return this;
  }

  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  toBase64(): string {
    const bytes = this.build();
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export async function printToUsbSerial(
  base64Data: string,
  vendorId?: string,
  productId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (typeof window === "undefined" || !("navigator" in window) || !("serial" in (window.navigator as any))) {
      return {
        success: false,
        error: "Web Serial API is not supported in this browser environment. Please use Google Chrome or Microsoft Edge."
      };
    }

    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    let port: any;

    if (vendorId && productId) {
      const ports = await (window.navigator as any).serial.getPorts();
      const vId = parseInt(vendorId, 16);
      const pId = parseInt(productId, 16);
      
      port = ports.find((p: any) => {
        const info = p.getInfo();
        return info.usbVendorId === vId && info.usbProductId === pId;
      });
    }

    if (!port) {
      port = await (window.navigator as any).serial.requestPort();
    }

    await port.open({ baudRate: 9600 });
    const writer = port.writable.getWriter();
    await writer.write(bytes);
    writer.releaseLock();
    await port.close();

    return { success: true };
  } catch (err: any) {
    console.error("USB Serial Printing Error:", err);
    return {
      success: false,
      error: err.message || "USB device connection or write failed"
    };
  }
}

export function compileReceiptEscPos(
  order: any,
  paperWidth: "80mm" | "58mm",
  tables: any[],
  customers: any[],
  users: any[]
): string {
  const builder = new EscPosBuilder();
  const table = tables.find((t) => t.id === order.tableId);
  const customer = customers.find((c) => c.id === order.customerId);
  const cashier = users.find((u) => u.id === order.employeeId);

  const formattedDate = new Date(order.createdAt).toLocaleString("en-IN", {
    dateStyle: "short",
    timeStyle: "medium",
  });

  builder.alignCenter().bold(true).fontSize(2, 2).line("ORDERHUB CAFE");
  builder.fontSize(1, 1).bold(false)
    .line("123 Gourmet Blvd, Food District")
    .line("Phone: +91 98765 43210")
    .line("GSTIN: 27AAAAA1111A1Z1")
    .divider(paperWidth, "=");

  builder.alignLeft()
    .line(`Receipt: ${order.orderNumber}`)
    .line(`Date   : ${formattedDate}`)
    .line(`Type   : ${order.type || "DINE_IN"}`);

  if (table) builder.line(`Table  : ${table.tableNumber}`);
  if (customer) builder.line(`Guest  : ${customer.name} (${customer.phone || "N/A"})`);
  if (cashier) builder.line(`Cashier: ${cashier.name}`);

  builder.divider(paperWidth, "-");

  // Items header
  if (paperWidth === "80mm") {
    // 48 columns: Name (24), Qty (6), Price (18)
    builder.line("Item                     Qty      Price (INR)");
  } else {
    // 32 columns: Name (14), Qty (4), Price (14)
    builder.line("Item           Qty   Price (INR)");
  }
  builder.divider(paperWidth, "-");

  order.items.forEach((item: any) => {
    const totalItemPrice = (item.unitPrice + (item.selectedModifiers || []).reduce((acc: number, mod: any) => acc + (mod.priceAdjustment || 0), 0)) * item.quantity;
    const nameStr = item.name.substring(0, paperWidth === "80mm" ? 22 : 12);
    const qtyStr = item.quantity.toString();
    const priceStr = `INR ${totalItemPrice.toFixed(2)}`;
    
    // Pad columns
    if (paperWidth === "80mm") {
      const namePad = nameStr.padEnd(24, " ");
      const qtyPad = qtyStr.padEnd(6, " ");
      const pricePad = priceStr.padStart(18, " ");
      builder.line(namePad + qtyPad + pricePad);
    } else {
      const namePad = nameStr.padEnd(14, " ");
      const qtyPad = qtyStr.padEnd(4, " ");
      const pricePad = priceStr.padStart(14, " ");
      builder.line(namePad + qtyPad + pricePad);
    }

    // Print modifiers
    if (item.selectedModifiers && item.selectedModifiers.length > 0) {
      item.selectedModifiers.forEach((mod: any) => {
        const modName = ` + ${mod.name} ${mod.priceAdjustment > 0 ? `(+INR ${mod.priceAdjustment})` : ""}`;
        builder.line("  " + modName.substring(0, paperWidth === "80mm" ? 44 : 28));
      });
    }

    if (item.notes) {
      builder.line(`  * Note: ${item.notes.substring(0, paperWidth === "80mm" ? 40 : 25)}`);
    }
  });

  builder.divider(paperWidth, "-");

  // Totals
  builder.twoColumn("Subtotal", `INR ${order.subtotal.toFixed(2)}`, paperWidth);
  if (order.discounts > 0) {
    builder.twoColumn("Discounts", `-INR ${order.discounts.toFixed(2)}`, paperWidth);
  }
  builder.twoColumn("CGST / SGST (5%)", `INR ${order.tax.toFixed(2)}`, paperWidth);
  
  builder.divider(paperWidth, "=");
  builder.bold(true).fontSize(1, 2).twoColumn("GRAND TOTAL", `INR ${order.total.toFixed(2)}`, paperWidth);
  builder.fontSize(1, 1).bold(false);
  builder.divider(paperWidth, "=");

  builder.alignCenter().feed(1)
    .bold(true).line("THANK YOU FOR YOUR VISIT!")
    .bold(false).line("Powering Delicious Experiences")
    .feed(3)
    .kickDrawer()
    .cut();

  return builder.toBase64();
}

export function compileKitchenEscPos(
  order: any,
  paperWidth: "80mm" | "58mm",
  tables: any[]
): string {
  const builder = new EscPosBuilder();
  const table = tables.find((t) => t.id === order.tableId);

  const formattedDate = new Date(order.createdAt).toLocaleString("en-IN", {
    dateStyle: "short",
    timeStyle: "medium",
  });

  builder.alignCenter().bold(true).fontSize(2, 2).line("KITCHEN TICKET");
  builder.fontSize(1, 1).bold(false).divider(paperWidth, "=");

  builder.alignLeft()
    .bold(true)
    .line(`Order No: ${order.orderNumber}`);
  
  if (table) {
    builder.fontSize(2, 2).line(`Table   : ${table.tableNumber}`).fontSize(1, 1);
  } else {
    builder.fontSize(1, 1).line("Table   : Takeaway / N/A");
  }

  builder.bold(false)
    .line(`Type    : ${order.type || "DINE_IN"}`)
    .line(`Time    : ${formattedDate}`)
    .divider(paperWidth, "-");

  if (order.notes) {
    builder.bold(true).fontSize(1, 2).line(`NOTES: ${order.notes}`).fontSize(1, 1).bold(false).divider(paperWidth, "-");
  }

  order.items
    .filter((item: any) => item.status !== "CANCELLED")
    .forEach((item: any) => {
      builder.bold(true).fontSize(1, 2).line(`${item.quantity}x ${item.name}`).fontSize(1, 1).bold(false);
      
      if (item.selectedModifiers && item.selectedModifiers.length > 0) {
        item.selectedModifiers.forEach((mod: any) => {
          builder.line(`  + ${mod.groupName}: ${mod.name}`);
        });
      }
      if (item.notes) {
        builder.line(`  * Note: ${item.notes}`);
      }
      builder.feed(1);
    });

  builder.divider(paperWidth, "=");
  builder.alignCenter().line(`Sent: ${new Date().toLocaleTimeString()}`).feed(3).cut();

  return builder.toBase64();
}
