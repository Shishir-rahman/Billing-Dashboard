import React, { useState } from 'react';
import { FileSpreadsheet, Search, ArrowUpDown, Download, ExternalLink, ChevronRight, Building2 } from 'lucide-react';
import { formatBDT, formatDate } from '../utils/formatters';

export function ReceivablesBreakdown({ records, onSelectClient, onBackToOverview }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [agingFilter, setAgingFilter] = useState('ALL');
  const [sortField, setSortField] = useState('invoiceAmount');
  const [sortDirection, setSortDirection] = useState('desc');

  // Filter pipeline
  let filteredList = records.filter(r => {
    if (agingFilter !== 'ALL' && r.agingCategory !== agingFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchClient = r.clientName.toLowerCase().includes(q);
      const matchDetails = (r.remarks || r.billingMonth || '').toLowerCase().includes(q);
      if (!matchClient && !matchDetails) return false;
    }
    return true;
  });

  // Sort pipeline
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

  const totalAmount = filteredList.reduce((sum, r) => sum + r.invoiceAmount, 0);

  const exportCSV = () => {
    const headers = ['ID', 'Client Name', 'Details / Month', 'Invoice Amount (BDT)', 'Due Date', 'Days Overdue', 'Aging Category', 'Status', 'Remarks'];
    const rows = filteredList.map((r, i) => [
      i + 1,
      `"${r.clientName}"`,
      `"${r.billingMonth || r.remarks || ''}"`,
      r.invoiceAmount,
      r.dueDate || '',
      r.daysOverdue,
      `"${r.agingCategory}"`,
      `"${r.paymentStatus}"`,
      `"${r.remarks || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sokrio_Total_Receivable_Breakdown_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileSpreadsheet size={22} style={{ color: 'var(--brand-primary)' }} />
            <h3 className="card-title" style={{ fontSize: '1.25rem' }}>Total Receivable Itemized Breakdown</h3>
          </div>
          <p className="card-subtitle" style={{ marginTop: '0.2rem' }}>
            Detailed breakdown of all active receivable items ({filteredList.length} Items | Total: <strong style={{ color: 'var(--brand-primary)' }}>{formatBDT(totalAmount)}</strong>)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="btn btn-secondary" onClick={onBackToOverview}>
            ← Back to Overview
          </button>
          <button className="btn btn-primary" onClick={exportCSV}>
            <Download size={14} />
            <span>Export Breakdown CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="filter-bar" style={{ marginBottom: '1.25rem' }}>
        <div className="filter-group" style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="filter-input"
              style={{ paddingLeft: '30px', width: '100%' }}
              placeholder="Search Client Name or Invoice Details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Aging Category:</span>
          <select
            className="filter-select"
            value={agingFilter}
            onChange={(e) => setAgingFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="1–30 Days">1–30 Days</option>
            <option value="31–60 Days">31–60 Days</option>
            <option value="61–90 Days">61–90 Days</option>
            <option value="90+ Days">90+ Days</option>
          </select>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th className="sortable" onClick={() => handleSort('clientName')}>
                Client / Company Name <ArrowUpDown size={12} />
              </th>
              <th className="sortable" onClick={() => handleSort('billingMonth')}>
                Invoice Particulars / Month <ArrowUpDown size={12} />
              </th>
              <th className="sortable" onClick={() => handleSort('invoiceAmount')}>
                Receivable Amount (BDT) <ArrowUpDown size={12} />
              </th>
              <th className="sortable" onClick={() => handleSort('daysOverdue')}>
                Days Overdue <ArrowUpDown size={12} />
              </th>
              <th>Aging Risk</th>
              <th>Status</th>
              <th>Remarks / Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No receivable items matching the search query.
                </td>
              </tr>
            ) : (
              filteredList.map((r, index) => {
                let badgeClass = "badge-overdue";
                if (r.agingCategory === '1–30 Days') badgeClass = "badge-partial";
                else if (r.agingCategory === '31–60 Days') badgeClass = "badge-pending";

                return (
                  <tr
                    key={r.id || index}
                    className="clickable-row"
                    onClick={() => onSelectClient(r.clientName)}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={14} style={{ color: 'var(--brand-primary)' }} />
                        <span>{r.clientName}</span>
                      </div>
                    </td>
                    <td>{r.billingMonth || r.remarks || 'Subscription Fee'}</td>
                    <td className="currency-text" style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--brand-primary)' }}>
                      {formatBDT(r.invoiceAmount)}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: r.daysOverdue >= 60 ? 'var(--color-danger)' : 'var(--text-main)' }}>
                        {r.daysOverdue} days
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{r.agingCategory}</span>
                    </td>
                    <td>
                      <span className="badge badge-overdue">{r.paymentStatus || 'Overdue'}</span>
                    </td>
                    <td style={{ maxWidth: '240px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {r.remarks || 'Overdue receivable account'}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.22rem 0.55rem', fontSize: '0.72rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClient(r.clientName);
                        }}
                      >
                        <span>Client Statement</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
