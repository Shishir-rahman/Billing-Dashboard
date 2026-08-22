import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Percent,
  Sparkles,
  Search,
  ArrowUpDown,
  Download,
  Building2,
  FileCheck,
  CreditCard,
  AlertCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { formatBDT } from '../utils/formatters';
import { getMonthlyCollectionData } from '../utils/api';

export function MonthlyCollectionView({ onSelectClient }) {
  const [selectedMonth, setSelectedMonth] = useState("August'26");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('grossPaymentAmount');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    loadCollectionData(selectedMonth);
  }, [selectedMonth]);

  const loadCollectionData = async (month) => {
    try {
      setLoading(true);
      const res = await getMonthlyCollectionData(month);
      setData(res);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load monthly collection data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Loading {selectedMonth} Monthly Collection Ledger...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>
        <p>Error: {error || 'Failed to load collection data'}</p>
        <button className="btn btn-secondary" onClick={() => loadCollectionData(selectedMonth)} style={{ marginTop: '1rem' }}>
          Retry Loading
        </button>
      </div>
    );
  }

  const { summary, collections, availableMonths } = data;

  // Search & Filter
  let filteredList = collections.filter(c => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.clientName.toLowerCase().includes(q) ||
        (c.invoiceNo || '').toLowerCase().includes(q) ||
        (c.paymentMedia || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sorting
  filteredList.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportCSV = () => {
    const headers = [
      '#',
      'Payment Date',
      'Client Name',
      'Details / Invoice No',
      'Billing Month',
      'Collection Amount (BDT)',
      'TDS Amount',
      'VDS Amount',
      'Payment Media / Bank',
      'Remarks'
    ];
    const rows = filteredList.map((c, idx) => [
      idx + 1,
      `"${c.paymentDate}"`,
      `"${c.clientName}"`,
      `"${c.invoiceNo}"`,
      `"${c.billingMonth}"`,
      c.grossPaymentAmount,
      c.tdsAmount,
      c.vdsAmount,
      `"${c.paymentMedia}"`,
      `"${c.remarks || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sokrio_${selectedMonth}_Monthly_Collection_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Month Selector Bar & Header */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-success-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-success)'
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-family-heading)' }}>
                {selectedMonth} Monthly Collection Ledger
              </h2>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Showing total collection & bank deposit amount from Google Sheet (Default: Last Month {selectedMonth})
              </p>
            </div>
          </div>

          {/* Month Selector Dropdown / Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Select Month:</span>
            <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.2)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              {availableMonths.map((m) => (
                <button
                  key={m}
                  className={`btn ${selectedMonth === m ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                  onClick={() => setSelectedMonth(m)}
                >
                  {m} {m === "August'26" ? '(Last Month)' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Collection KPI Cards Strip */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        {/* Card 1: Total Gross Collection */}
        <div
          className="kpi-card"
          style={{ '--kpi-accent': 'var(--color-success)', '--kpi-bg': 'var(--color-success-bg)' }}
        >
          <div className="kpi-header">
            <span className="kpi-title">{selectedMonth} TOTAL COLLECTION</span>
            <div className="kpi-icon-box">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--color-success)' }}>
            {formatBDT(summary.totalGrossCollected)}
          </div>
          <div className="kpi-footer">
            <span>Total Collected & Deposited in Bank</span>
          </div>
        </div>

        {/* Card 2: Total Transactions Count */}
        <div
          className="kpi-card"
          style={{ '--kpi-accent': 'var(--brand-primary)', '--kpi-bg': 'rgba(14, 165, 233, 0.12)' }}
        >
          <div className="kpi-header">
            <span className="kpi-title">TOTAL TRANSACTIONS</span>
            <div className="kpi-icon-box">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--brand-primary)' }}>
            {summary.totalTransactionsCount} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Received</span>
          </div>
          <div className="kpi-footer">
            <span>Itemized Payment Entries</span>
          </div>
        </div>

        {/* Card 3: Total TDS Deducted */}
        <div
          className="kpi-card"
          style={{ '--kpi-accent': 'var(--color-warning)', '--kpi-bg': 'var(--color-warning-bg)' }}
        >
          <div className="kpi-header">
            <span className="kpi-title">TOTAL TDS DEDUCTED</span>
            <div className="kpi-icon-box">
              <Percent size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--color-warning)' }}>
            {formatBDT(summary.totalTdsDeducted)}
          </div>
          <div className="kpi-footer">
            <span>Tax Deducted at Source</span>
          </div>
        </div>

        {/* Card 4: Total VDS Deducted */}
        <div
          className="kpi-card"
          style={{ '--kpi-accent': 'var(--color-purple)', '--kpi-bg': 'var(--color-purple-bg)' }}
        >
          <div className="kpi-header">
            <span className="kpi-title">TOTAL VDS DEDUCTED</span>
            <div className="kpi-icon-box">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--color-purple)' }}>
            {formatBDT(summary.totalVdsDeducted)}
          </div>
          <div className="kpi-footer">
            <span>VAT Deducted at Source</span>
          </div>
        </div>
      </div>

      {/* Main Breakdown Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">{selectedMonth} Itemized Collection Transactions</h3>
            <p className="card-subtitle">
              Detailed Breakdown showing Payment Date, Client Name, Details, Collection Amount, TDS, VDS & Payment Media
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="filter-input"
                style={{ paddingLeft: '30px', width: '220px' }}
                placeholder="Search Client or Invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button className="btn btn-primary" onClick={exportCSV}>
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th className="sortable" onClick={() => handleSort('paymentDate')}>
                  Payment Date <ArrowUpDown size={12} />
                </th>
                <th className="sortable" onClick={() => handleSort('clientName')}>
                  Client / Company Name <ArrowUpDown size={12} />
                </th>
                <th>Details / Invoice No</th>
                <th className="sortable" onClick={() => handleSort('grossPaymentAmount')}>
                  Collection Amount (BDT) <ArrowUpDown size={12} />
                </th>
                <th className="sortable" onClick={() => handleSort('tdsAmount')}>
                  TDS <ArrowUpDown size={12} />
                </th>
                <th className="sortable" onClick={() => handleSort('vdsAmount')}>
                  VDS <ArrowUpDown size={12} />
                </th>
                <th>Payment Media / Bank</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No collection records found for {selectedMonth}.
                  </td>
                </tr>
              ) : (
                filteredList.map((c, index) => (
                  <tr
                    key={c.id || index}
                    className="clickable-row"
                    onClick={() => onSelectClient && onSelectClient(c.clientName)}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {c.paymentDate}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={14} style={{ color: 'var(--color-success)' }} />
                        <span>{c.clientName}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.invoiceNo}</span>
                    </td>
                    <td className="currency-text" style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-success)' }}>
                      {formatBDT(c.grossPaymentAmount)}
                    </td>
                    <td className="currency-text" style={{ color: 'var(--color-warning)' }}>
                      {c.tdsAmount > 0 ? formatBDT(c.tdsAmount) : '—'}
                    </td>
                    <td className="currency-text" style={{ color: 'var(--color-purple)' }}>
                      {c.vdsAmount > 0 ? formatBDT(c.vdsAmount) : '—'}
                    </td>
                    <td>
                      <span className="badge badge-paid" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--color-success)' }}>
                        {c.paymentMedia}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
