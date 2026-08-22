import React, { useState } from 'react';
import { PhoneCall, Calendar, CheckCircle2, Clock, AlertTriangle, UserCheck, Send } from 'lucide-react';
import { formatBDT, formatDate } from '../utils/formatters';

export function FollowUpSection({ records, onSelectClient }) {
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Derive follow-up categories per record
  const categories = {
    "Payment Committed": { count: 0, amount: 0, clients: new Set(), color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
    "Follow-up Required": { count: 0, amount: 0, clients: new Set(), color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
    "Follow-up Pending": { count: 0, amount: 0, clients: new Set(), color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
    "Payment Received": { count: 0, amount: 0, clients: new Set(), color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
    "No Response": { count: 0, amount: 0, clients: new Set(), color: 'var(--color-purple)', bg: 'var(--color-purple-bg)' }
  };

  records.forEach((r) => {
    let catKey = "Follow-up Pending";

    if (r.paymentStatus === 'Paid') {
      catKey = "Payment Received";
    } else if (r.paymentCommitmentDate && new Date(r.paymentCommitmentDate) >= new Date('2026-08-20')) {
      catKey = "Payment Committed";
    } else if (r.daysOverdue >= 30 || r.clientResponse?.toLowerCase().includes('dispute')) {
      catKey = "Follow-up Required";
    } else if (r.clientResponse?.toLowerCase().includes('review') || !r.clientResponse || r.clientResponse === 'Pending') {
      catKey = "No Response";
    }

    if (categories[catKey]) {
      categories[catKey].count += 1;
      categories[catKey].amount += r.outstandingAmount;
      categories[catKey].clients.add(r.clientName);
    }
  });

  let displayRecords = records.filter(r => r.outstandingAmount > 0 || r.followUpDate);

  if (statusFilter !== 'ALL') {
    displayRecords = displayRecords.filter(r => {
      let catKey = "Follow-up Pending";
      if (r.paymentStatus === 'Paid') catKey = "Payment Received";
      else if (r.paymentCommitmentDate && new Date(r.paymentCommitmentDate) >= new Date('2026-08-20')) catKey = "Payment Committed";
      else if (r.daysOverdue >= 30 || r.clientResponse?.toLowerCase().includes('dispute')) catKey = "Follow-up Required";
      else if (r.clientResponse?.toLowerCase().includes('review') || !r.clientResponse || r.clientResponse === 'Pending') catKey = "No Response";
      return catKey === statusFilter;
    });
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Collection Follow-up Dashboard</h3>
          <p className="card-subtitle">Payment Recovery Pipeline & Communication Logs</p>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        {Object.entries(categories).map(([catName, data]) => {
          const isSelected = statusFilter === catName;
          return (
            <div
              key={catName}
              onClick={() => setStatusFilter(prev => prev === catName ? 'ALL' : catName)}
              style={{
                background: isSelected ? data.bg : 'var(--bg-card)',
                border: `1px solid ${isSelected ? data.color : 'var(--border-color)'}`,
                borderTop: `3px solid ${data.color}`,
                borderRadius: 'var(--radius-md)',
                padding: '0.9rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {catName}
              </div>
              <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1.3rem', fontWeight: 700, margin: '0.2rem 0' }}>
                {formatBDT(data.amount, true)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{data.count} Invoices</span>
                <span style={{ fontWeight: 600, color: data.color }}>{data.clients.size} Clients</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Follow-up Communication Action Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Invoice No</th>
              <th>Outstanding</th>
              <th>Follow-up Date</th>
              <th>Method</th>
              <th>Client Response / Status</th>
              <th>Committed Payment Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayRecords.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No follow-up records found matching filter.
                </td>
              </tr>
            ) : (
              displayRecords.map((r) => (
                <tr key={r.invoiceNo}>
                  <td style={{ fontWeight: 600 }}>{r.clientName}</td>
                  <td>{r.invoiceNo}</td>
                  <td className="currency-text" style={{ fontWeight: 700, color: 'var(--color-danger)' }}>
                    {formatBDT(r.outstandingAmount)}
                  </td>
                  <td>{formatDate(r.followUpDate)}</td>
                  <td>
                    <span className="badge badge-gray">{r.followUpMethod}</span>
                  </td>
                  <td style={{ maxWidth: '280px' }}>
                    <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-main)' }}>
                      "{r.clientResponse || 'No logs'}"
                    </div>
                  </td>
                  <td>
                    {r.paymentCommitmentDate ? (
                      <span style={{ color: 'var(--color-info)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {formatDate(r.paymentCommitmentDate)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Not Committed</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                      onClick={() => onSelectClient(r.clientName)}
                    >
                      <span>Follow Up</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
