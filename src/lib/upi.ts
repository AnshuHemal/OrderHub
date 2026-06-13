/**
 * UPI Deep Link URI builder.
 * Spec: https://www.npci.org.in/PDF/npci/upi/circular-and-guidelines/Circular_BHIM_UPI_Deep_Link.pdf
 *
 * Format: upi://pay?pa=<upiId>&pn=<name>&am=<amount>&cu=INR&tn=<note>
 */

export interface UpiUriOptions {
  /** Merchant UPI ID — e.g. "cafe@ybl" */
  upiId: string;
  /** Merchant / payee name shown in the customer's UPI app */
  merchantName: string;
  /** Order total in INR. Pass 0 or undefined to let customer enter manually. */
  amount?: number;
  /** Short transaction note — e.g. "Order #TBL-04" */
  note?: string;
}

/**
 * Builds a UPI payment deep-link URI.
 * Returns null if `upiId` is empty/invalid.
 */
export function buildUpiUri({
  upiId,
  merchantName,
  amount,
  note,
}: UpiUriOptions): string | null {
  const id = upiId?.trim();
  if (!id || !id.includes("@")) return null;

  const params = new URLSearchParams();
  params.set("pa", id);
  params.set("pn", merchantName.trim() || "Merchant");
  params.set("cu", "INR");

  // Only include amount if positive — omitting lets the customer type it themselves
  if (amount && amount > 0) {
    params.set("am", amount.toFixed(2));
  }

  if (note?.trim()) {
    // Max 50 chars per NPCI spec
    params.set("tn", note.trim().slice(0, 50));
  }

  return `upi://pay?${params.toString()}`;
}

/**
 * Validates that a string looks like a valid UPI ID.
 * Format: localpart@provider  (e.g. user@ybl, 9999999999@paytm)
 */
export function isValidUpiId(id: string): boolean {
  return /^[\w.\-]+@[\w]+$/.test(id.trim());
}
