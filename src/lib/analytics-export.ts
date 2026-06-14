import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

export interface ExportData {
  period: string;
  startDate?: string;
  endDate?: string;
  cashierName: string;
  sessionName: string;
  productName: string;
  totals: {
    orders: number;
    revenue: number;
    avgOrderValue: number;
    avgTableTime: number;
  };
  revenueTrend: Array<{ date: string; Sales: number; Orders: number }>;
  topProducts: Array<{ name: string; qty: number; rev: number }>;
  topCategories: Array<{ name: string; value: number }>;
  tableTurnover: Array<{ tableNumber: string; turnovers: number; avgOccupancyMins: number }>;
  combos: Array<{ nameA: string; nameB: string; confidence: number; count: number }>;
  detailedOrders: Array<{
    orderNumber: string;
    createdAt: string;
    cashierName: string;
    tableNumber: string;
    subtotal: number;
    tax: number;
    discounts: number;
    total: number;
    status: string;
    paymentMethod: string;
    items: string;
  }>;
}

/**
 * Helper to draw paginated tables on jsPDF.
 * Automatically handles page breaks and re-draws headers on overflow.
 */
function drawTable(
  doc: jsPDF,
  startY: number,
  headers: string[],
  rows: any[][],
  colWidths: number[],
  alignments: Array<"left" | "center" | "right">,
  pageBottomMargin: number = 25,
  pageTopMargin: number = 25
): number {
  let y = startY;
  const rowHeight = 8;
  const headerHeight = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);
  const startX = (pageWidth - tableWidth) / 2;

  // 1. Draw Table Headers
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setFillColor(41, 37, 36); // stone-800 background
  doc.setTextColor(255, 255, 255);
  doc.rect(startX, y, tableWidth, headerHeight, "F");

  let x = startX;
  headers.forEach((h, i) => {
    let textX = x + 3;
    if (alignments[i] === "right") {
      textX = x + colWidths[i] - 3;
    } else if (alignments[i] === "center") {
      textX = x + colWidths[i] / 2;
    }
    doc.text(h, textX, y + headerHeight / 2 + 3, { align: alignments[i] });
    x += colWidths[i];
  });

  y += headerHeight;

  // 2. Draw Data Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  rows.forEach((row, rowIdx) => {
    // If table cell exceeds page height, add a page and re-draw headers
    if (y + rowHeight > doc.internal.pageSize.getHeight() - pageBottomMargin) {
      doc.addPage();
      y = pageTopMargin;

      // Draw Headers on new page
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setFillColor(41, 37, 36);
      doc.setTextColor(255, 255, 255);
      doc.rect(startX, y, tableWidth, headerHeight, "F");

      let xNew = startX;
      headers.forEach((h, i) => {
        let textX = xNew + 3;
        if (alignments[i] === "right") {
          textX = xNew + colWidths[i] - 3;
        } else if (alignments[i] === "center") {
          textX = xNew + colWidths[i] / 2;
        }
        doc.text(h, textX, y + headerHeight / 2 + 3, { align: alignments[i] });
        xNew += colWidths[i];
      });

      y += headerHeight;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
    }

    // Zebra stripes
    if (rowIdx % 2 === 0) {
      doc.setFillColor(245, 245, 244); // stone-100
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(startX, y, tableWidth, rowHeight, "F");

    // Grid border lines
    doc.setDrawColor(231, 229, 228); // stone-200
    doc.setLineWidth(0.2);
    doc.rect(startX, y, tableWidth, rowHeight, "S");

    doc.setTextColor(68, 64, 60); // stone-700
    let cellX = startX;
    row.forEach((val, i) => {
      let textX = cellX + 3;
      if (alignments[i] === "right") {
        textX = cellX + colWidths[i] - 3;
      } else if (alignments[i] === "center") {
        textX = cellX + colWidths[i] / 2;
      }

      const strVal = val === null || val === undefined ? "" : String(val);
      // Truncate logic to prevent cell text overflow
      const maxCharLen = Math.floor(colWidths[i] / 2.0);
      const textToDraw = strVal.length > maxCharLen ? strVal.slice(0, Math.max(0, maxCharLen - 3)) + "..." : strVal;

      doc.text(textToDraw, textX, y + rowHeight / 2 + 2.5, { align: alignments[i] });
      cellX += colWidths[i];
    });

    y += rowHeight;
  });

  return y;
}

/**
 * Draw background, header rules, and footer templates on a page.
 * Done in a post-process pass over all generated pages so that totalPages count is accurate.
 */
function drawHeaderAndFooter(
  doc: jsPDF,
  pageNo: number,
  totalPages: number,
  periodStr: string
) {
  // Red primary accent top border line
  doc.setFillColor(239, 68, 68); // primary red
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 4, "F");

  // Header texts
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(28, 25, 23); // stone-900
  doc.text("ORDERHUB", 15, 13);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(120, 113, 108); // stone-500
  doc.text("EXECUTIVE MANAGEMENT ANALYTICS", 195, 13, { align: "right" });

  // Thin header rule line
  doc.setDrawColor(231, 229, 228); // stone-200
  doc.setLineWidth(0.4);
  doc.line(15, 17, 195, 17);

  // Footer template
  doc.line(15, 282, 195, 282);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 113, 108);
  doc.text(`Generated on: ${new Date().toLocaleString()} | Period: ${periodStr} | Powered by OrderHub`, 15, 288);
  doc.text(`Page ${pageNo} of ${totalPages}`, 195, 288, { align: "right" });
}

export function exportToExcel(data: ExportData) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Overview
  const overviewData = [
    ["ORDERHUB ANALYTICS REPORT SUMMARY"],
    [],
    ["REPORT PARAMETERS", ""],
    ["Active Period Filter", data.period],
    ["Date Filter From", data.startDate || "N/A"],
    ["Date Filter To", data.endDate || "N/A"],
    ["Employee Filter", data.cashierName],
    ["Session Shift Filter", data.sessionName],
    ["Product Filter", data.productName],
    [],
    ["CORE PERFORMANCE INDICATORS", ""],
    ["Total Paid Orders Count", data.totals.orders],
    ["Net Total Sales Revenue (₹)", data.totals.revenue],
    ["Average Order Ticket Value (₹)", data.totals.avgOrderValue],
    ["Average Dining Table Occupancy (Minutes)", data.totals.avgTableTime],
    [],
    ["Export Date Timestamp", new Date().toLocaleString()]
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, wsOverview, "Executive Summary");

  // Sheet 2: Daily Sales Trend
  const trendHeaders = [["Date Label", "Daily Sales Amount (INR)", "Daily Order Counts"]];
  const trendRows = data.revenueTrend.map(t => [t.date, t.Sales, t.Orders]);
  const wsTrend = XLSX.utils.aoa_to_sheet([...trendHeaders, ...trendRows]);
  XLSX.utils.book_append_sheet(wb, wsTrend, "Sales Trend Analysis");

  // Sheet 3: Top Products
  const productHeaders = [["Product Name ID", "Total Units Sold Quantity", "Aggregate Sales Revenue (₹)"]];
  const productRows = data.topProducts.map(p => [p.name, p.qty, p.rev]);
  const wsProducts = XLSX.utils.aoa_to_sheet([...productHeaders, ...productRows]);
  XLSX.utils.book_append_sheet(wb, wsProducts, "Product Sales");

  // Sheet 4: Categories
  const catHeaders = [["Category Name", "Total Revenue Share (₹)"]];
  const catRows = data.topCategories.map(c => [c.name, c.value]);
  const wsCategories = XLSX.utils.aoa_to_sheet([...catHeaders, ...catRows]);
  XLSX.utils.book_append_sheet(wb, wsCategories, "Category Share");

  // Sheet 5: Table turnaround
  const tableHeaders = [["Dining Table Identifier", "Settled Ticket Count", "Average Duration Occupied (Minutes)"]];
  const tableRows = data.tableTurnover.map(t => [t.tableNumber, t.turnovers, t.avgOccupancyMins]);
  const wsTables = XLSX.utils.aoa_to_sheet([...tableHeaders, ...tableRows]);
  XLSX.utils.book_append_sheet(wb, wsTables, "Table Turnaround");

  // Sheet 6: Combos
  const comboHeaders = [["Combo Rank", "Product A (Initial)", "Product B (Co-Occurring)", "Joint Purchase Freq", "Confidence Likelihood (%)"]];
  const comboRows = data.combos.map((c, i) => [i + 1, c.nameA, c.nameB, c.count, c.confidence]);
  const wsCombos = XLSX.utils.aoa_to_sheet([...comboHeaders, ...comboRows]);
  XLSX.utils.book_append_sheet(wb, wsCombos, "Predictive Combos");

  // Sheet 7: Detailed Orders
  const orderHeaders = [[
    "Receipt Number",
    "Timestamp Created",
    "Responsible Cashier",
    "Assigned Table",
    "Subtotal Amount (₹)",
    "Tax Amount (₹)",
    "Discounts Deducted (₹)",
    "Grand Total Paid (₹)",
    "Current Status",
    "Payment Mechanism",
    "Items & Quantities Ordered"
  ]];
  const orderRows = data.detailedOrders.map(o => [
    o.orderNumber,
    o.createdAt,
    o.cashierName,
    o.tableNumber,
    o.subtotal,
    o.tax,
    o.discounts,
    o.total,
    o.status,
    o.paymentMethod,
    o.items
  ]);
  const wsOrders = XLSX.utils.aoa_to_sheet([...orderHeaders, ...orderRows]);
  XLSX.utils.book_append_sheet(wb, wsOrders, "Detailed Transaction Ledger");

  // Generate File & Trigger Browser Save
  XLSX.writeFile(wb, `OrderHub_Analytics_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportToPDF(data: ExportData) {
  // Create PDF Document (A4 portrait size in mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const periodStr = data.startDate && data.endDate 
    ? `${data.startDate} to ${data.endDate}`
    : data.period.toUpperCase();

  let y = 25; // starting vertical position below header

  // 1. Dashboard Title & Metadata
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(28, 25, 23); // stone-900
  doc.text("Management Analytics Report", 15, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(120, 113, 108); // stone-500
  doc.text(`Active Period: ${periodStr} | Cashier: ${data.cashierName} | Shift: ${data.sessionName} | Product: ${data.productName}`, 15, y);
  y += 10;

  // 2. Executive KPI Cards (4 columns)
  // Page Width = 210mm. Margins = 15mm. Total usable width = 180mm.
  // Col width = 42mm. Spacing = 4mm.
  const colWidth = 42;
  const spacing = 4;
  const cardHeight = 18;

  const kpis = [
    { label: "Net Sales Revenue", value: `INR ${data.totals.revenue.toFixed(2)}` },
    { label: "Total Paid Orders", value: `${data.totals.orders} sales` },
    { label: "Average Order Value", value: `INR ${data.totals.avgOrderValue.toFixed(2)}` },
    { label: "Avg Table Time", value: `${data.totals.avgTableTime} mins` }
  ];

  kpis.forEach((kpi, idx) => {
    const x = 15 + idx * (colWidth + spacing);
    
    // Draw card box background
    doc.setFillColor(245, 245, 244); // stone-100
    doc.rect(x, y, colWidth, cardHeight, "F");
    
    // Draw card left red border accent
    doc.setFillColor(239, 68, 68); // primary red
    doc.rect(x, y, 1.5, cardHeight, "F");

    // Draw card box border outline
    doc.setDrawColor(231, 229, 228); // stone-200
    doc.setLineWidth(0.25);
    doc.rect(x, y, colWidth, cardHeight, "S");

    // Text labels
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 113, 108); // stone-500
    doc.text(kpi.label, x + 4, y + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(28, 25, 23); // stone-900
    doc.text(kpi.value, x + 4, y + 12);
  });

  y += cardHeight + 10;

  // 3. Section: Best Selling Products
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(28, 25, 23);
  doc.text("1. Best Selling Products Ranking", 15, y);
  y += 5;

  const prodHeaders = ["Rank", "Product Name ID", "Total Quantity Sold", "Aggregate Revenue (INR)"];
  const prodRows = data.topProducts.map((p, idx) => [
    idx + 1,
    p.name,
    `${p.qty} units`,
    `INR ${p.rev.toFixed(2)}`
  ]);
  
  y = drawTable(
    doc,
    y,
    prodHeaders,
    prodRows,
    [15, 75, 40, 50],
    ["center", "left", "center", "right"]
  );

  y += 10;

  // 4. Section: Category Revenue Share
  // Check if we need a page break before starting Category Share section
  if (y + 40 > doc.internal.pageSize.getHeight() - 25) {
    doc.addPage();
    y = 25;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(28, 25, 23);
  doc.text("2. Category Revenue Contribution", 15, y);
  y += 5;

  const catHeaders = ["Category Name", "Total Revenue Volume (INR)"];
  const catRows = data.topCategories.map(c => [
    c.name,
    `INR ${c.value.toFixed(2)}`
  ]);

  y = drawTable(
    doc,
    y,
    catHeaders,
    catRows,
    [100, 80],
    ["left", "right"]
  );

  y += 10;

  // 5. Section: Daily Sales Trend Analysis
  if (y + 50 > doc.internal.pageSize.getHeight() - 25) {
    doc.addPage();
    y = 25;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(28, 25, 23);
  doc.text("3. Trailing Daily Sales & Volume Trend", 15, y);
  y += 5;

  const trendHeaders = ["Date/Time", "Completed Orders Count", "Calculated Revenue Volume (INR)"];
  const trendRows = data.revenueTrend.map(t => [
    t.date,
    `${t.Orders} orders`,
    `INR ${t.Sales.toFixed(2)}`
  ]);

  y = drawTable(
    doc,
    y,
    trendHeaders,
    trendRows,
    [60, 50, 70],
    ["left", "center", "right"]
  );

  y += 10;

  // 6. Section: Table turnaround metrics
  if (y + 50 > doc.internal.pageSize.getHeight() - 25) {
    doc.addPage();
    y = 25;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(28, 25, 23);
  doc.text("4. Table Turnaround & Turnovers Speed", 15, y);
  y += 5;

  const tblHeaders = ["Dining Table Number", "Settle Order Count", "Average Occupancy Duration"];
  const tblRows = data.tableTurnover.map(t => [
    t.tableNumber,
    `${t.turnovers} sales`,
    `${t.avgOccupancyMins} minutes`
  ]);

  y = drawTable(
    doc,
    y,
    tblHeaders,
    tblRows,
    [60, 60, 60],
    ["left", "center", "right"]
  );

  y += 10;

  // 7. Section: Combos recommendations
  if (y + 50 > doc.internal.pageSize.getHeight() - 25) {
    doc.addPage();
    y = 25;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(28, 25, 23);
  doc.text("5. Predictive Combo Co-occurrences", 15, y);
  y += 5;

  const comboHeaders = ["Rank", "Core Product A", "Attached Product B", "Joint Buy Count", "Combo Confidence Rate"];
  const comboRows = data.combos.map((c, i) => [
    i + 1,
    c.nameA,
    c.nameB,
    `${c.count} purchases`,
    `${c.confidence.toFixed(1)}%`
  ]);

  y = drawTable(
    doc,
    y,
    comboHeaders,
    comboRows,
    [15, 50, 50, 35, 30],
    ["center", "left", "left", "center", "right"]
  );

  y += 10;

  // 8. Section: Detailed Orders Log
  if (y + 50 > doc.internal.pageSize.getHeight() - 25) {
    doc.addPage();
    y = 25;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(28, 25, 23);
  doc.text("6. Detailed Transaction Ledger Log", 15, y);
  y += 5;

  const detailsHeaders = ["Receipt #", "Created Date", "Cashier", "Table", "Total Paid", "Items Ordered List"];
  const detailsRows = data.detailedOrders.map(o => [
    o.orderNumber,
    o.createdAt.slice(5, 16), // simpler date format
    o.cashierName,
    o.tableNumber,
    `INR ${o.total.toFixed(1)}`,
    o.items
  ]);

  y = drawTable(
    doc,
    y,
    detailsHeaders,
    detailsRows,
    [25, 25, 25, 20, 25, 60],
    ["left", "left", "left", "center", "right", "left"]
  );

  // 9. Post-Processing: Draw header and footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawHeaderAndFooter(doc, i, totalPages, periodStr);
  }

  // Trigger Save/Download Dialog
  doc.save(`OrderHub_Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
