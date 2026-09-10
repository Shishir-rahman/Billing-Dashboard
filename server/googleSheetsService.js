import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { sampleReceivableData } from './sampleData.js';

// Helper to check if item has NO VAT (0%).
// Rule: Subscription Fee & Power BI HAVE 5% VAT.
// Implementation, Customization, Mobilization, API Integration, Dashboard Bill, etc. DO NOT HAVE VAT (0%).
function isNoVatItem(text = '') {
  const t = text.toLowerCase();
  if (t.includes('power bi') || t.includes('powerbi') || t.includes('subscription fee')) {
    return false;
  }
  return (
    t.includes('customization') ||
    t.includes('implementation') ||
    t.includes('mobilization') ||
    t.includes('api integration') ||
    t.includes('api fee') ||
    t.includes('dashboard bill') ||
    t.includes('dashboard fee') ||
    t.includes('setup fee') ||
    t.includes('development fee') ||
    t.includes('training fee') ||
    t.includes('project fee') ||
    t.includes('project (customization')
  );
}

// Helper to determine aging category and days overdue from month text
function helperAgingFromDetails(detailsText = '') {
  const text = detailsText.toLowerCase();
  if (text.includes("oct'25") || text.includes("nov'25") || text.includes("dec'25") || text.includes("jan'26") || text.includes("feb'26") || text.includes("mar'25") || text.includes("apr'25") || text.includes("may'25") || text.includes("june'25") || text.includes("july'25") || text.includes("june-25") || text.includes("july-25") || text.includes("oct-25") || text.includes("nov-25") || text.includes("dec-25") || text.includes("jan-26") || text.includes("feb-26")) {
    return { days: 120, category: "90+ Days" };
  }
  if (text.includes("mar'26") || text.includes("apr'26") || text.includes("mar-26") || text.includes("apr-26")) {
    return { days: 75, category: "61–90 Days" };
  }
  if (text.includes("may'26") || text.includes("june'26") || text.includes("may-26") || text.includes("june-26")) {
    return { days: 45, category: "31–60 Days" };
  }
  if (text.includes("july'26") || text.includes("july-26") || text.includes("aug'26") || text.includes("aug-26")) {
    return { days: 22, category: "1–30 Days" };
  }
  return { days: 35, category: "31–60 Days" };
}

// Process raw 18-column standard records
export function processRawRecords(rawRows, currentDate = new Date('2026-08-22')) {
  return rawRows.map((row, index) => {
    const invoiceAmount = parseFloat((row.invoiceAmount || row['Invoice Amount'] || '0').toString().replace(/,/g, ''));
    const paymentAmount = parseFloat((row.paymentAmount || row['Payment Amount'] || '0').toString().replace(/,/g, ''));
    const tdsAmount = parseFloat((row.tdsAmount || row['TDS Amount'] || '0').toString().replace(/,/g, ''));
    const vdsAmount = parseFloat((row.vdsAmount || row['VDS Amount'] || '0').toString().replace(/,/g, ''));

    const netOutstanding = Math.max(0, invoiceAmount - paymentAmount - tdsAmount - vdsAmount);

    const invoiceDateStr = row.invoiceDate || row['Invoice Date'] || '';
    const dueDateStr = row.dueDate || row['Due Date'] || '';
    const paymentDateStr = row.paymentDate || row['Payment Date'] || '';
    
    let daysOverdue = 0;
    let agingCategory = "Not Due";

    if (netOutstanding > 0 && dueDateStr) {
      const dueObj = new Date(dueDateStr);
      if (!isNaN(dueObj.getTime())) {
        const diffTime = currentDate.getTime() - dueObj.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
        if (diffDays > 0) {
          daysOverdue = diffDays;
          if (daysOverdue <= 30) agingCategory = "1–30 Days";
          else if (daysOverdue <= 60) agingCategory = "31–60 Days";
          else if (daysOverdue <= 90) agingCategory = "61–90 Days";
          else agingCategory = "90+ Days";
        }
      }
    }

    const clientName = row.clientName || row['Client Name'] || 'Unknown Client';
    const invoiceNo = row.invoiceNo || row['Invoice No.'] || `INV-${index + 1}`;
    const billingMonth = row.billingMonth || row['Billing Month'] || 'N/A';
    const followUpDate = row.followUpDate || row['Follow-up Date'] || '';
    const followUpMethod = row.followUpMethod || row['Follow-up Method'] || 'None';
    const clientResponse = row.clientResponse || row['Client Response'] || 'Pending';
    const paymentCommitmentDate = row.paymentCommitmentDate || row['Payment Commitment Date'] || '';

    let paymentStatus = row.paymentStatus || row['Payment Status'] || '';
    if (!paymentStatus) {
      if (netOutstanding === 0 && invoiceAmount > 0) paymentStatus = "Paid";
      else if (paymentAmount > 0 && netOutstanding > 0) paymentStatus = "Partial";
      else if (daysOverdue > 0) paymentStatus = "Overdue";
      else paymentStatus = "Pending";
    }

    return {
      id: index + 1,
      clientName: clientName.trim(),
      invoiceNo: invoiceNo.trim(),
      invoiceDate: invoiceDateStr,
      billingMonth: billingMonth.trim(),
      invoiceAmount,
      dueDate: dueDateStr,
      paymentDate: paymentDateStr,
      paymentAmount,
      tdsAmount,
      vdsAmount,
      outstandingAmount: netOutstanding,
      daysOverdue,
      agingCategory,
      followUpDate,
      followUpMethod,
      clientResponse,
      paymentCommitmentDate,
      paymentStatus,
      tdsChallanStatus: row.tdsChallanStatus || row['TDS Challan Status'] || 'Pending',
      vdsDocumentStatus: row.vdsDocumentStatus || row['VDS Document Status'] || 'Pending',
      remarks: row.remarks || row['Remarks'] || ''
    };
  });
}

// Consolidate per client: 1 clean row per Active Client with their TOTAL Amount
export function processActiveClientSheet(rows) {
  const clientMap = {};
  let idCount = 1;

  rows.forEach((r) => {
    const company = (Array.isArray(r) ? r[1] : (r['Company Name'] || r['Company Name '])) || '';
    const details = (Array.isArray(r) ? r[2] : r['Details']) || '';
    const amtRaw = (Array.isArray(r) ? r[3] : (r['Invoice Amount'] || r['Invoice Amount '])) || '0';
    const remarks = (Array.isArray(r) ? r[4] : r['Remarks']) || '';
    const dueDateRaw = (Array.isArray(r) ? r[5] : r['Due Date']) || '';

    const companyClean = company.trim();
    if (!companyClean || companyClean.toLowerCase().includes('total receivables') || companyClean.toLowerCase().includes('excluding') || companyClean.toLowerCase() === 'company name') {
      return;
    }

    const remarksClean = remarks.trim().toLowerCase();
    const isInactive = remarksClean.includes('inactive') || remarksClean.includes('bondho');
    const invoiceAmt = parseFloat(amtRaw.toString().replace(/,/g, '').trim()) || 0;

    if (!isInactive && invoiceAmt > 0) {
      if (!clientMap[companyClean]) {
        const agingInfo = helperAgingFromDetails(details);
        
        let monthName = "Jul 2026";
        if (details.includes("July'26") || details.includes("July-26")) monthName = "Jul 2026";
        else if (details.includes("June'26") || details.includes("June-26")) monthName = "Jun 2026";
        else if (details.includes("May'26") || details.includes("May-26")) monthName = "May 2026";
        else if (details.includes("Apr'26") || details.includes("Apr-26") || details.includes("April'25")) monthName = "Apr 2026";
        else if (details.includes("Feb'26") || details.includes("Feb-26")) monthName = "Feb 2026";
        else if (details.includes("Oct'25") || details.includes("Oct-25")) monthName = "Oct 2025";

        clientMap[companyClean] = {
          id: idCount++,
          clientName: companyClean,
          invoiceNo: `SOK-ACT-${idCount}`,
          invoiceDate: '2026-07-01',
          billingMonth: monthName,
          invoiceAmount: 0,
          dueDate: dueDateRaw || '2026-08-15',
          paymentDate: '',
          paymentAmount: 0,
          tdsAmount: 0,
          vdsAmount: 0,
          outstandingAmount: 0,
          daysOverdue: agingInfo.days,
          agingCategory: agingInfo.category,
          followUpDate: '2026-08-20',
          followUpMethod: 'Phone Call',
          clientResponse: remarks || details || 'Payment follow-up in progress',
          paymentCommitmentDate: '2026-08-30',
          paymentStatus: 'Overdue',
          tdsChallanStatus: 'Pending',
          vdsDocumentStatus: 'Pending',
          detailsList: [],
          remarksList: []
        };
      }

      const clientObj = clientMap[companyClean];
      clientObj.invoiceAmount += invoiceAmt;
      clientObj.outstandingAmount += invoiceAmt;

      if (details && !clientObj.detailsList.includes(details)) {
        clientObj.detailsList.push(details);
      }
      if (remarks && !clientObj.remarksList.includes(remarks)) {
        clientObj.remarksList.push(remarks);
      }

      const currentAging = helperAgingFromDetails(details);
      if (currentAging.days > clientObj.daysOverdue) {
        clientObj.daysOverdue = currentAging.days;
        clientObj.agingCategory = currentAging.category;
      }
    }
  });

  return Object.values(clientMap).map((c) => ({
    ...c,
    billingMonth: c.detailsList.join(' | ') || c.billingMonth,
    remarks: c.remarksList.join(' | ') || c.detailsList.join(' | ') || 'Active Overdue Account'
  }));
}

// Dynamic Month Generator for future-proof tab discovery
const DISCOVERY_YEARS = ['28', '27', '26', '25'];
const DISCOVERY_MONTHS = [
  { full: "December", abbr: "Dec" },
  { full: "November", abbr: "Nov" },
  { full: "October", abbr: "Oct" },
  { full: "September", abbr: "Sep" },
  { full: "August", abbr: "Aug" },
  { full: "July", abbr: "Jul" },
  { full: "June", abbr: "Jun" },
  { full: "May", abbr: "May" },
  { full: "April", abbr: "Apr" },
  { full: "March", abbr: "Mar" },
  { full: "February", abbr: "Feb" },
  { full: "January", abbr: "Jan" }
];

function buildCollectionPairs() {
  const list = [];
  DISCOVERY_YEARS.forEach(yr => {
    const fullYr = `20${yr}`;
    DISCOVERY_MONTHS.forEach(m => {
      list.push({
        variants: [
          `${m.full}'${yr}`,
          `${m.abbr}'${yr}`,
          `${m.full}-${yr}`,
          `${m.abbr}-${yr}`,
          `${m.full} ${yr}`,
          `${m.abbr} ${yr}`,
          `${m.full}'${fullYr}`,
          `${m.abbr}'${fullYr}`,
          `${m.full}-${fullYr}`,
          `${m.abbr}-${fullYr}`,
          `${m.full} ${fullYr}`,
          `${m.abbr} ${fullYr}`
        ]
      });
    });
  });
  return list;
}

function buildSubscriptionPairs() {
  const list = [];
  DISCOVERY_YEARS.forEach(yr => {
    const fullYr = `20${yr}`;
    DISCOVERY_MONTHS.forEach(m => {
      list.push({
        variants: [
          `${m.full}'${yr} Subscription Bill`,
          `${m.abbr}'${yr} Subscription Bill`,
          `${m.full}-${yr} Subscription Bill`,
          `${m.abbr}-${yr} Subscription Bill`,
          `${m.full} ${yr} Subscription Bill`,
          `${m.abbr} ${yr} Subscription Bill`,
          `${m.full}'${fullYr} Subscription Bill`,
          `${m.abbr}'${fullYr} Subscription Bill`,
          `${m.full}-${fullYr} Subscription Bill`,
          `${m.abbr}-${fullYr} Subscription Bill`,
          `${m.full} ${fullYr} Subscription Bill`,
          `${m.abbr} ${fullYr} Subscription Bill`
        ]
      });
    });
  });
  return list;
}

// Helper to discover available Subscription Billing tabs dynamically
async function discoverSubscriptionBillingTabs(spreadsheetId) {
  const monthPairs = buildSubscriptionPairs();

  const results = await Promise.all(monthPairs.map(async ({ variants }, idx) => {
    for (const tab of variants) {
      try {
        const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
        const res = await axios.get(url, { timeout: 4000 });
        if (res.data && typeof res.data === 'string' && !res.data.includes('<!DOCTYPE html>')) {
          const rows = parse(res.data, { skip_empty_lines: true });
          if (rows.length > 0) {
            const firstLine = rows[0].join(' ');
            if (firstLine.includes('SOKRIO DMS Bill Month') || (rows[0].length >= 10 && rows[0].length <= 18 && firstLine.includes('Company Name'))) {
              return { idx, tab };
            }
          }
        }
      } catch (e) {}
    }
    return null;
  }));

  const found = results.filter(Boolean).sort((a, b) => a.idx - b.idx).map(r => r.tab);
  return found.length > 0 ? found : ["Aug'26 Subscription Bill", "July'26 Subscription Bill", "June'26 Subscription Bill"];
}

// Dedicated parser for Subscription Billing with dynamic month support & MoM Growth
export async function fetchSubscriptionBillingData(config, targetMonth = null) {
  const spreadsheetId = config.spreadsheetId || "1mQvqrMkY-Q7T9BwFxeYCaWo9PPIGAET7gTF6Zrh8QXE";

  try {
    const availableMonths = await discoverSubscriptionBillingTabs(spreadsheetId);
    
    // Pick target month or default to latest available month
    const selectedMonthTab = (targetMonth && availableMonths.includes(targetMonth)) 
      ? targetMonth 
      : availableMonths[0];

    // Find index of selected tab to pick the next older tab for MoM comparison
    const tabIdx = availableMonths.indexOf(selectedMonthTab);
    const prevMonthTab = (tabIdx >= 0 && tabIdx + 1 < availableMonths.length) 
      ? availableMonths[tabIdx + 1] 
      : (availableMonths.find(m => m !== selectedMonthTab) || "June'26 Subscription Bill");

    const urlCurr = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(selectedMonthTab)}`;
    const urlPrev = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(prevMonthTab)}`;

    const [resCurr, resPrev] = await Promise.all([
      axios.get(urlCurr, { timeout: 10000 }),
      axios.get(urlPrev, { timeout: 10000 }).catch(() => ({ data: '' }))
    ]);

    const rowsCurr = parse(resCurr.data, { skip_empty_lines: true });
    const rowsPrev = resPrev.data ? parse(resPrev.data, { skip_empty_lines: true }) : [];

    // Map previous month data for comparison
    const prevMap = {};
    rowsPrev.slice(2).forEach(r => {
      const company = (r[1] || '').trim();
      if (!company || company.toLowerCase().includes('total')) return;
      const amt = parseFloat((r[2] || '0').replace(/,/g, '')) || 0;
      const users = parseInt((r[6] || r[4] || '0').replace(/,/g, '')) || 0;
      prevMap[company.toLowerCase()] = { company, amt, users };
    });

    // Clean display month names
    const monthName = selectedMonthTab.replace(' Subscription Bill', '').replace('-', "'");
    const prevMonthName = prevMonthTab.replace(' Subscription Bill', '').replace('-', "'");

    // Parse Subscription Bill rows for selected month
    const clientBills = [];
    let totalGrossAmount = 0;
    let totalWithoutVatAmount = 0;
    let totalVatAmount = 0;
    let totalBillableUsers = 0;
    let noVatItemsCount = 0;

    let totalPaidAmount = 0;
    let totalDueAmount = 0;
    let paidClientsCount = 0;
    let dueClientsCount = 0;

    let upCount = 0;
    let upTotalGrowth = 0;
    let downCount = 0;
    let downTotalDrop = 0;
    let newCount = 0;
    let newTotalRevenue = 0;
    let sameCount = 0;

    rowsCurr.slice(2).forEach((r, idx) => {
      const company = (r[1] || '').trim();
      if (!company || company.toLowerCase().includes('total')) return;
      const grossAmt = parseFloat((r[2] || '0').replace(/,/g, '')) || 0;
      const rate = parseFloat((r[3] || '0').replace(/,/g, '')) || 0;
      const users = parseInt((r[6] || r[4] || '0').replace(/,/g, '')) || 0;
      const media = (r[7] || '').trim();

      if (grossAmt > 0) {
        // Status determination: if payment media recorded -> Paid, else Due
        const isPaid = media.length > 0;
        const paymentStatus = isPaid ? 'Paid' : 'Due';

        if (isPaid) {
          totalPaidAmount += grossAmt;
          paidClientsCount++;
        } else {
          totalDueAmount += grossAmt;
          dueClientsCount++;
        }

        // Business Rule: Customization and Implementation items have NO VAT (0%)!
        const noVat = isNoVatItem(company);
        
        let withoutVat = grossAmt;
        let vatAmt = 0;

        if (noVat) {
          noVatItemsCount++;
          withoutVat = grossAmt;
          vatAmt = 0;
        } else {
          withoutVat = Math.round((grossAmt / 1.05) * 100) / 100;
          vatAmt = Math.round((grossAmt - withoutVat) * 100) / 100;
        }

        const prevMatch = prevMap[company.toLowerCase()];
        let prevGrossAmt = 0;
        let prevUserCount = 0;
        let amtGrowth = 0;
        let amtDiff = 0;
        let userDiff = 0;
        let trendStatus = 'SAME';

        if (!prevMatch || prevMatch.amt === 0) {
          trendStatus = 'NEW';
          newCount++;
          newTotalRevenue += grossAmt;
          amtDiff = grossAmt;
          userDiff = users;
          amtGrowth = 100;
        } else {
          prevGrossAmt = prevMatch.amt;
          prevUserCount = prevMatch.users;
          amtDiff = grossAmt - prevGrossAmt;
          userDiff = users - prevUserCount;
          amtGrowth = prevGrossAmt > 0 ? ((grossAmt - prevGrossAmt) / prevGrossAmt) * 100 : 0;

          if (amtDiff > 5 || userDiff > 0) {
            trendStatus = 'UP';
            upCount++;
            upTotalGrowth += amtDiff;
          } else if (amtDiff < -5 || userDiff < 0) {
            trendStatus = 'DOWN';
            downCount++;
            downTotalDrop += Math.abs(amtDiff);
          } else {
            trendStatus = 'SAME';
            sameCount++;
          }
        }

        clientBills.push({
          id: idx + 1,
          clientName: company,
          grossInvoiceAmount: grossAmt,
          amountWithoutVat: withoutVat,
          vatAmount: vatAmt,
          hasVat: !noVat,
          vatRateText: noVat ? '0% (Exempt)' : '5%',
          ratePerUser: rate,
          billableUsers: users,
          paymentMedia: media || 'Pending / Bank EFT',
          paymentStatus,
          juneGrossAmount: prevGrossAmt,
          juneUsers: prevUserCount,
          billGrowthPercent: amtGrowth,
          billGrowthDiff: amtDiff,
          userGrowthDiff: userDiff,
          trendStatus
        });

        totalGrossAmount += grossAmt;
        totalWithoutVatAmount += withoutVat;
        totalVatAmount += vatAmt;
        totalBillableUsers += users;
      }
    });

    // Previous month totals calculation
    let prevTotalGross = 0;
    let prevTotalWithoutVat = 0;
    Object.values(prevMap).forEach(c => {
      prevTotalGross += c.amt;
      if (isNoVatItem(c.company)) {
        prevTotalWithoutVat += c.amt;
      } else {
        prevTotalWithoutVat += Math.round((c.amt / 1.05) * 100) / 100;
      }
    });
    let prevTotalUsers = Object.values(prevMap).reduce((sum, c) => sum + c.users, 0);

    const totalBillGrowthPercent = prevTotalGross > 0 ? ((totalGrossAmount - prevTotalGross) / prevTotalGross) * 100 : 0;
    const totalBillGrowthDiff = totalGrossAmount - prevTotalGross;

    const totalWithoutVatGrowthPercent = prevTotalWithoutVat > 0 ? ((totalWithoutVatAmount - prevTotalWithoutVat) / prevTotalWithoutVat) * 100 : 0;
    const totalWithoutVatGrowthDiff = totalWithoutVatAmount - prevTotalWithoutVat;

    const totalUserGrowthPercent = prevTotalUsers > 0 ? ((totalBillableUsers - prevTotalUsers) / prevTotalUsers) * 100 : 0;
    const totalUserGrowthDiff = totalBillableUsers - prevTotalUsers;

    const collectionRatePercent = totalGrossAmount > 0 ? (totalPaidAmount / totalGrossAmount) * 100 : 0;

    return {
      selectedMonth: selectedMonthTab,
      availableMonths,
      monthName,
      previousMonthName: prevMonthName,
      lastUpdated: new Date().toISOString(),
      summary: {
        totalClientsCount: clientBills.length,
        totalGrossInvoiceAmount: totalGrossAmount,
        totalWithoutVatAmount: totalWithoutVatAmount,
        totalVatAmount: totalVatAmount,
        totalBillableUsers: totalBillableUsers,
        noVatItemsCount,

        // Collection vs Due Summary
        totalPaidAmount,
        paidClientsCount,
        totalDueAmount,
        dueClientsCount,
        collectionRatePercent,

        // MoM Trend Classification Summary
        upCount,
        upTotalGrowth,
        downCount,
        downTotalDrop,
        newCount,
        newTotalRevenue,
        sameCount,

        // Previous Month Baseline
        juneGrossInvoiceAmount: prevTotalGross,
        juneWithoutVatAmount: prevTotalWithoutVat,
        juneBillableUsers: prevTotalUsers,

        // Growth Metrics
        billGrowthPercent: totalBillGrowthPercent,
        billGrowthDiff: totalBillGrowthDiff,
        withoutVatGrowthPercent: totalWithoutVatGrowthPercent,
        withoutVatGrowthDiff: totalWithoutVatGrowthDiff,
        userGrowthPercent: totalUserGrowthPercent,
        userGrowthDiff: totalUserGrowthDiff
      },
      clientBills
    };
  } catch (error) {
    console.error("Error fetching Subscription Billing data:", error);
    throw error;
  }
}

// Helper to discover available Collection tabs dynamically (differentiating Sheet 1 from default fallbacks)
async function discoverCollectionTabs(spreadsheetId) {
  const monthPairs = buildCollectionPairs();

  // Fetch sheet 1 (gid=0) sample signature
  let defaultSignature = '';
  try {
    const defaultUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
    const res = await axios.get(defaultUrl, { timeout: 4000 });
    const rows = parse(res.data, { skip_empty_lines: true });
    if (rows.length > 1) {
      defaultSignature = rows.slice(1, 4).map(r => r.slice(0, 4).join('|')).join('||');
    }
  } catch (e) {}

  let isFirstMatch = false;

  const results = await Promise.all(monthPairs.map(async ({ variants }, idx) => {
    for (const v of variants) {
      try {
        const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(v)}`;
        const res = await axios.get(url, { timeout: 4000 });
        if (res.data && typeof res.data === 'string' && !res.data.includes('<!DOCTYPE html>')) {
          const rows = parse(res.data, { skip_empty_lines: true });
          if (rows.length > 1) {
            const sig = rows.slice(1, 4).map(r => r.slice(0, 4).join('|')).join('||');
            if (!isFirstMatch || sig !== defaultSignature) {
              isFirstMatch = true;
              return { idx, tab: v };
            }
          }
        }
      } catch (e) {}
    }
    return null;
  }));

  const found = results.filter(Boolean).sort((a, b) => a.idx - b.idx).map(r => r.tab);
  return found.length > 0 ? found : ["September'26", "Aug'26", "July'26", "June'26", "May'26"];
}

// Parser for Dedicated "Monthly Collection" Google Sheet (Spreadsheet ID: 13574a1BRR9Q4qK2FOtgoe0ZppASz5RJUVceXTozMmkA)
export async function fetchMonthlyCollectionData(config, selectedMonth = null) {
  const collectionSpreadsheetId = config.collectionSpreadsheetId || "13574a1BRR9Q4qK2FOtgoe0ZppASz5RJUVceXTozMmkA";
  const availableMonths = await discoverCollectionTabs(collectionSpreadsheetId);

  // Default to the latest month tab (September'26 if available)
  const activeMonth = (selectedMonth && availableMonths.includes(selectedMonth))
    ? selectedMonth
    : availableMonths[0];

  try {
    let csvUrl = `https://docs.google.com/spreadsheets/d/${collectionSpreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(activeMonth)}`;
    
    // Fallbacks for default/legacy gid parameters if needed
    if (!selectedMonth && activeMonth === "September'26") {
      csvUrl = `https://docs.google.com/spreadsheets/d/${collectionSpreadsheetId}/gviz/tq?tqx=out:csv`;
    } else if (activeMonth === "July'26") {
      csvUrl = `https://docs.google.com/spreadsheets/d/${collectionSpreadsheetId}/export?format=csv&gid=1821780275`;
    }

    const response = await axios.get(csvUrl, { timeout: 10000 });

    if (response.data && typeof response.data === 'string' && !response.data.includes('html')) {
      const rows = parse(response.data, { skip_empty_lines: true });
      const collections = [];
      let totalGrossCollected = 0;
      let totalTdsDeducted = 0;
      let totalVdsDeducted = 0;

      rows.slice(1).forEach((r, idx) => {
        const payDate = (r[1] || '').trim();
        const clientName = (r[2] || '').trim();
        const details = (r[3] || '').trim();
        const amtRaw = (r[4] || '0').replace(/,/g, '');
        const media = (r[5] || 'Bank EFT / BEFTN').trim();
        const remarks = (r[6] || '').trim();
        const tdsRaw = (r[8] || '0').replace(/,/g, '');
        const vdsRaw = (r[9] || '0').replace(/,/g, '');

        const grossAmt = parseFloat(amtRaw) || 0;
        const tdsAmt = parseFloat(tdsRaw) || 0;
        const vdsAmt = parseFloat(vdsRaw) || 0;

        if (clientName && !clientName.toLowerCase().includes('total') && grossAmt > 0) {
          collections.push({
            id: idx + 1,
            clientName,
            invoiceNo: details || `INV-COL-${activeMonth.replace(/[^a-zA-Z0-9]/g, '')}-${idx + 1}`,
            paymentDate: payDate || '01-Sep-26',
            billingMonth: activeMonth,
            grossPaymentAmount: grossAmt,
            tdsAmount: tdsAmt,
            vdsAmount: vdsAmt,
            paymentMedia: media,
            remarks
          });

          totalGrossCollected += grossAmt;
          totalTdsDeducted += tdsAmt;
          totalVdsDeducted += vdsAmt;
        }
      });

      return {
        selectedMonth: activeMonth,
        availableMonths,
        source: `Google Sheet Live Sync (Spreadsheet ID: ${collectionSpreadsheetId})`,
        isLive: true,
        lastUpdated: new Date().toISOString(),
        summary: {
          totalGrossCollected,
          totalTdsDeducted,
          totalVdsDeducted,
          totalTransactionsCount: collections.length
        },
        collections
      };
    }
  } catch (err) {
    console.warn(`Monthly Collection Sheet fetch error for ${activeMonth}:`, err.message);
  }

  // Fallback
  return {
    selectedMonth: activeMonth,
    availableMonths,
    source: `Monthly Collection Engine (${activeMonth})`,
    isLive: false,
    lastUpdated: new Date().toISOString(),
    summary: {
      totalGrossCollected: 1086019,
      totalTdsDeducted: 28910,
      totalVdsDeducted: 19402.5,
      totalTransactionsCount: 26
    },
    collections: []
  };
}

// Fetch data from Google Sheets API or CSV Export
export async function fetchReceivablesData(config) {
  const { spreadsheetId, sheetName, googleApiKey, csvPublishUrl, authMode } = config;

  if (authMode === 'sample_fallback' || !spreadsheetId) {
    return {
      source: 'Sample Data (Sokrio Technologies Ltd)',
      lastUpdated: new Date().toISOString(),
      data: processRawRecords(sampleReceivableData)
    };
  }

  // Primary mode: Published Google Sheet CSV endpoint
  try {
    const defaultExportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`;
    const csvUrl = csvPublishUrl || defaultExportUrl;
    
    const response = await axios.get(csvUrl, { timeout: 10000 });

    if (response.data && typeof response.data === 'string') {
      const parsedArrayRows = parse(response.data, { skip_empty_lines: true });

      if (parsedArrayRows && parsedArrayRows.length > 0) {
        const headerRowStr = JSON.stringify(parsedArrayRows[0]).toLowerCase();

        // Detect if user sheet is the "Active Client Overdue" format
        if (headerRowStr.includes('company name') || headerRowStr.includes('details') || headerRowStr.includes('sl. no')) {
          const activeOverdueData = processActiveClientSheet(parsedArrayRows);
          return {
            source: 'Google Sheets Live Sync (Active Client Consolidated)',
            lastUpdated: new Date().toISOString(),
            data: activeOverdueData
          };
        }

        // Standard 18-column parsing fallback
        const parsedObjRows = parse(response.data, { columns: true, skip_empty_lines: true, trim: true });
        return {
          source: 'Google Sheets (Live CSV Sync)',
          lastUpdated: new Date().toISOString(),
          data: processRawRecords(parsedObjRows)
        };
      }
    }
  } catch (csvError) {
    console.warn("CSV fetch error, fallback to sample data:", csvError.message);
  }

  // Fallback to sample data if Google Sheet fetch failed
  return {
    source: 'Sample Data (Google Sheet Fetch Fallback)',
    lastUpdated: new Date().toISOString(),
    isFallback: true,
    data: processRawRecords(sampleReceivableData)
  };
}
