import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  TrendingUp,
  Users,
  Percent,
  Search,
  ArrowUpDown,
  Download,
  Building2,
  CheckCircle2,
  Calendar,
  Sparkles,
  Clock,
  ArrowUpRight,
  BadgePercent
} from 'lucide-react';
import { formatBDT, formatPercent } from '../utils/formatters';
import { getSubscriptionBillingData } from '../utils/api';

export function SubscriptionBillingView({ onSelectClient }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'Paid', 'Due'
  const [sortField, setSortField] = useState('grossInvoiceAmount');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const res = await getSubscriptionBillingData();
      setData(res);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load subscription billing data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Loading July'26 Subscription Bill and MoM Growth Analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>
        <p>Error: {error || 'Failed to load data'}</p>
        <button className="btn btn-secondary" onClick={loadSubscriptionData} style={{ marginTop: '1rem' }}>
          Retry Loading
        </button>
      </div>
    );
  }

  const { summary, clientBills } = data;

  // Search & Status Filter
  let filteredList = clientBills.filter(c => {
    if (statusFilter !== 'ALL' && c.paymentStatus !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return c.clientName.toLowerCase().includes(q) || (c.paymentMedia || '').toLowerCase().includes(q);
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
      'Client Name',
      'Status',
      'Gross Invoice Amount',
      'Without VAT Amount (Net)',
      '5% VAT Amount',
      'Rate / User',
      'Billable Users (July\'26)',
      'June\'26 Users',
      'User Change (Delta)',
      'June\'26 Gross Amount',
      'Bill Growth (%)',
      'Payment Media'
    ];
    const rows = filteredList.map((c, idx) => [
      idx + 1,
      `"${c.clientName}"`,
      `"${c.paymentStatus}"`,
      c.grossInvoiceAmount,
      c.amountWithoutVat,
      c.vatAmount,
      c.ratePerUser,
      c.billableUsers,
      c.juneUsers,
      c.juneUsers === 0 ? 'New' : c.userGrowthDiff > 0 ? `+${c.userGrowthDiff}` : c.userGrowthDiff < 0 ? `${c.userGrowthDiff}` : '0',
      c.juneGrossAmount,
      c.billGrowthPercent.toFixed(2),
      `"${c.paymentMedia || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sokrio_July26_Subscription_Bill_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPositiveGrowth = summary.billGrowthDiff >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Executive Summary Cards Strip */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        {/* Card 1: Total Gross Invoice Amount */}
        <div
          className="kpi-card"
          style={{ '--kpi-accent': 'var(--brand-primary)', '--kpi-bg': 'rgba(14, 165, 233, 0.12)', cursor: 'pointer' }}
          onClick={() => setStatusFilter('ALL')}
          title="Click to view all July'26 bills"
        >
          <div className="kpi-header">
            <span className="kpi-title">TOTAL INVOICE AMOUNT</span>
            <div className="kpi-icon-box">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{formatBDT(summary.totalGrossInvoiceAmount)}</span>
            <ArrowUpRight size={16} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div className="kpi-footer" style={{ justifyContent: 'space-between' }}>
            <span>Gross Total ({summary.totalClientsCount} Clients)</span>
            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
              +{summary.billGrowthPercent.toFixed(2)}% MoM
            </span>
          </div>
        </div>

        {/* Card 2: Total Collection (Paid Status) */}
        <div
          className="kpi-card"
          style={{ '--kpi-accent': 'var(--color-success)', '--kpi-bg': 'var(--color-success-bg)', cursor: 'pointer' }}
          onClick={() => setStatusFilter('Paid')}
          title="Click to view itemized Paid Collections"
        >
          <div className="kpi-header">
            <span className="kpi-title">TOTAL COLLECTION (PAID)</span>
            <div className="kpi-icon-box">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{formatBDT(summary.totalPaidAmount)}</span>
            <ArrowUpRight size={16} style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="kpi-footer" style={{ justifyContent: 'space-between' }}>
            <span>{summary.paidClientsCount} Paid Clients</span>
            <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>
              {formatPercent(summary.collectionRatePercent)} Achieved
            </span>
          </div>
        </div>

        {/* Card 3: Total Outstanding (Due Status) */}
        <div
          className="kpi-card"
          style={{ '--kpi-accent': 'var(--color-danger)', '--kpi-bg': 'var(--color-danger-bg)', cursor: 'pointer' }}
          onClick={() => setStatusFilter('Due')}
          title="Click to view itemized Due Bills"
        >
          <div className="kpi-header">
            <span className="kpi-title">TOTAL OUTSTANDING (DUE)</span>
            <div className="kpi-icon-box">
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{formatBDT(summary.totalDueAmount)}</span>
            <ArrowUpRight size={16} style={{ color: 'var(--color-danger)' }} />
          </div>
          <div className="kpi-footer" style={{ justifyContent: 'space-between' }}>
            <span>{summary.dueClientsCount} Unpaid/Due Clients</span>
            <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
              {formatPercent(100 - summary.collectionRatePercent)} Uncollected
            </span>
          </div>
        </div>

        {/* Card 4: Total Without VAT Amount */}
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--color-warning)', '--kpi-bg': 'var(--color-warning-bg)' }}>
          <div className="kpi-header">
            <span className="kpi-title">TOTAL WITHOUT VAT (NET)</span>
            <div className="kpi-icon-box">
              <Percent size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--color-warning)' }}>
            {formatBDT(summary.totalWithoutVatAmount)}
          </div>
          <div className="kpi-footer">
            <span>5% VAT Excluded (Net Revenue)</span>
          </div>
        </div>

        {/* Card 5: Total Subscriptions */}
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--color-purple)', '--kpi-bg': 'var(--color-purple-bg)' }}>
          <div className="kpi-header">
            <span className="kpi-title">TOTAL SUBSCRIPTIONS</span>
            <div className="kpi-icon-box">
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value">
            {summary.totalBillableUsers.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Users</span>
          </div>
          <div className="kpi-footer" style={{ justifyContent: 'space-between' }}>
            <span>Active Billed Users</span>
            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
              +{summary.userGrowthDiff} Users vs June ({summary.userGrowthPercent.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* NEW Card 6: BILL AMOUNT GROWTH (vs Previous Month June'26) */}
        <div className="kpi-card" style={{ '--kpi-accent': isPositiveGrowth ? 'var(--color-success)' : 'var(--color-danger)', '--kpi-bg': isPositiveGrowth ? 'var(--color-success-bg)' : 'var(--color-danger-bg)' }}>
          <div className="kpi-header">
            <span className="kpi-title">MOM BILL AMOUNT GROWTH</span>
            <div className="kpi-icon-box">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: isPositiveGrowth ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {isPositiveGrowth ? '+' : ''}{formatBDT(summary.billGrowthDiff)}
          </div>
          <div className="kpi-footer" style={{ justifyContent: 'space-between' }}>
            <span>vs June'26 ({formatBDT(summary.juneGrossInvoiceAmount)})</span>
            <span style={{ color: isPositiveGrowth ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700 }}>
              {isPositiveGrowth ? '+' : ''}{summary.billGrowthPercent.toFixed(2)}% Growth
            </span>
          </div>
        </div>
      </div>

      {/* Main Breakdown Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Client-Wise July'26 Subscription Bill & Collection Ledger</h3>
            <p className="card-subtitle">
              Showing {filteredList.length} Accounts ({statusFilter === 'ALL' ? 'All Paid & Due' : statusFilter} Filter Active)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.2)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <button
                className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.74rem' }}
                onClick={() => setStatusFilter('ALL')}
              >
                All ({summary.totalClientsCount})
              </button>
              <button
                className={`btn ${statusFilter === 'Paid' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.74rem', background: statusFilter === 'Paid' ? 'var(--color-success)' : undefined }}
                onClick={() => setStatusFilter('Paid')}
              >
                Paid ({summary.paidClientsCount})
              </button>
              <button
                className={`btn ${statusFilter === 'Due' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.74rem', background: statusFilter === 'Due' ? 'var(--color-danger)' : undefined }}
                onClick={() => setStatusFilter('Due')}
              >
                Due ({summary.dueClientsCount})
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="filter-input"
                style={{ paddingLeft: '30px', width: '200px' }}
                placeholder="Search Client..."
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
                <th className="sortable" onClick={() => handleSort('clientName')}>
                  Client / Company Name <ArrowUpDown size={12} />
                </th>
                <th>Status</th>
                <th className="sortable" onClick={() => handleSort('grossInvoiceAmount')}>
                  Gross Invoice Amount <ArrowUpDown size={12} />
                </th>
                <th className="sortable" onClick={() => handleSort('amountWithoutVat')}>
                  Without VAT (Net) <ArrowUpDown size={12} />
                </th>
                <th className="sortable" onClick={() => handleSort('vatAmount')}>
                  5% VAT Amount <ArrowUpDown size={12} />
                </th>
                <th className="sortable" onClick={() => handleSort('billableUsers')}>
                  Users & MoM Change <ArrowUpDown size={12} />
                </th>
                <th className="sortable" onClick={() => handleSort('juneGrossAmount')}>
                  June'26 Bill <ArrowUpDown size={12} />
                </th>
                <th className="sortable" onClick={() => handleSort('billGrowthPercent')}>
                  Bill Growth (%) <ArrowUpDown size={12} />
                </th>
                <th>Payment Media / Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No subscription billing records found for status filter: {statusFilter}.
                  </td>
                </tr>
              ) : (
                filteredList.map((c, index) => {
                  const isPaid = c.paymentStatus === 'Paid';

                  return (
                    <tr
                      key={c.id || index}
                      className="clickable-row"
                      onClick={() => onSelectClient && onSelectClient(c.clientName)}
                    >
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{index + 1}</td>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Building2 size={14} style={{ color: 'var(--brand-primary)' }} />
                          <span>{c.clientName}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isPaid ? 'badge-paid' : 'badge-overdue'}`}>
                          {isPaid ? 'Paid' : 'Due'}
                        </span>
                      </td>
                      <td className="currency-text" style={{ fontWeight: 700, fontSize: '0.92rem', color: isPaid ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {formatBDT(c.grossInvoiceAmount)}
                      </td>
                      <td className="currency-text" style={{ fontWeight: 600 }}>
                        {formatBDT(c.amountWithoutVat)}
                      </td>
                      <td className="currency-text" style={{ color: c.hasVat ? 'var(--color-warning)' : 'var(--text-muted)' }}>
                        {c.hasVat ? formatBDT(c.vatAmount) : <span className="badge badge-gray" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>0% VAT</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <strong style={{ color: 'var(--text-main)' }}>{c.billableUsers} Users</strong>
                          {c.juneUsers === 0 ? (
                            <span className="badge badge-partial" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--color-purple)', padding: '0.1rem 0.4rem', fontSize: '0.72rem' }}>
                              New
                            </span>
                          ) : c.userGrowthDiff > 0 ? (
                            <span className="badge badge-paid" style={{ padding: '0.1rem 0.4rem', fontSize: '0.72rem' }}>
                              +{c.userGrowthDiff} Users
                            </span>
                          ) : c.userGrowthDiff < 0 ? (
                            <span className="badge badge-overdue" style={{ padding: '0.1rem 0.4rem', fontSize: '0.72rem' }}>
                              {c.userGrowthDiff} Users
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              (Same)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="currency-text" style={{ color: 'var(--text-muted)' }}>
                        {c.juneGrossAmount > 0 ? formatBDT(c.juneGrossAmount) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${c.billGrowthPercent > 0 ? 'badge-paid' : c.billGrowthPercent === 0 ? 'badge-gray' : 'badge-overdue'}`}>
                          {c.billGrowthPercent > 0 ? '+' : ''}{c.billGrowthPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-gray" style={{ color: isPaid ? 'var(--color-success)' : 'var(--text-muted)' }}>
                          {c.paymentMedia}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
