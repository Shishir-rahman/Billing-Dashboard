import React from 'react';
import { X, Building2, Calendar, FileText, PhoneCall, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatBDT, formatDate, formatPercent } from '../utils/formatters';

export function ClientDetailModal({ clientName, records, onClose }) {
  if (!clientName) return null;

  const clientInvoices = records.filter(r => r.clientName.toLowerCase() === clientName.toLowerCase());

  const totalBilling = clientInvoices.reduce((sum, r) => sum + r.invoiceAmount, 0);
  const totalCollection = clientInvoices.reduce((sum, r) => sum + r.paymentAmount, 0);
  const totalTds = clientInvoices.reduce((sum, r) => sum + r.tdsAmount, 0);
  const totalVds = clientInvoices.reduce((sum, r) => sum + r.vdsAmount, 0);
  const totalOutstanding = clientInvoices.reduce((sum, r) => sum + r.outstandingAmount, 0);
  const collectionRate = totalBilling > 0 ? (totalCollection / totalBilling) * 100 : 0;

  const latestFollowUp = clientInvoices.find(r => r.followUpDate) || clientInvoices[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="kpi-icon-box" style={{ width: '40px', height: '40px' }}>
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="card-title" style={{ fontSize: '1.2rem' }}>{clientName}</h2>
              <p className="card-subtitle">Detailed Account Statement & Invoice Ledger ({clientInvoices.length} Invoices)</p>
            </div>
          </div>

          <button className="btn btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Summary Metric Strip */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <div className="kpi-card" style={{ padding: '0.8rem 1rem' }}>
              <span className="kpi-title" style={{ fontSize: '0.7rem' }}>Total Billing</span>
              <div className="kpi-value" style={{ fontSize: '1.2rem' }}>{formatBDT(totalBilling)}</div>
            </div>
            <div className="kpi-card" style={{ padding: '0.8rem 1rem', '--kpi-accent': 'var(--color-success)' }}>
              <span className="kpi-title" style={{ fontSize: '0.7rem' }}>Total Collected</span>
              <div className="kpi-value" style={{ fontSize: '1.2rem', color: 'var(--color-success)' }}>{formatBDT(totalCollection)}</div>
            </div>
            <div className="kpi-card" style={{ padding: '0.8rem 1rem', '--kpi-accent': 'var(--color-info)' }}>
              <span className="kpi-title" style={{ fontSize: '0.7rem' }}>TDS / VDS</span>
              <div className="kpi-value" style={{ fontSize: '1.2rem' }}>{formatBDT(totalTds + totalVds)}</div>
            </div>
            <div className="kpi-card" style={{ padding: '0.8rem 1rem', '--kpi-accent': 'var(--color-danger)' }}>
              <span className="kpi-title" style={{ fontSize: '0.7rem' }}>Net Outstanding</span>
              <div className="kpi-value" style={{ fontSize: '1.2rem', color: 'var(--color-danger)' }}>{formatBDT(totalOutstanding)}</div>
            </div>
            <div className="kpi-card" style={{ padding: '0.8rem 1rem', '--kpi-accent': 'var(--brand-primary)' }}>
              <span className="kpi-title" style={{ fontSize: '0.7rem' }}>Collection %</span>
              <div className="kpi-value" style={{ fontSize: '1.2rem' }}>{formatPercent(collectionRate)}</div>
            </div>
          </div>

          {/* Follow-up Note Box */}
          {latestFollowUp && (
            <div className="management-summary-card" style={{ padding: '0.9rem 1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <PhoneCall size={16} style={{ color: 'var(--brand-primary)' }} />
                <span>Latest Follow-up & Commitment Status</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem', fontSize: '0.8rem' }}>
                <div><strong>Follow-up Date:</strong> {formatDate(latestFollowUp.followUpDate)} ({latestFollowUp.followUpMethod})</div>
                <div><strong>Committed Date:</strong> {formatDate(latestFollowUp.paymentCommitmentDate)}</div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Client Response:</strong> <em>"{latestFollowUp.clientResponse || 'No response recorded'}"</em>
                </div>
              </div>
            </div>
          )}

          {/* Invoices Breakdown Table */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={16} style={{ color: 'var(--brand-primary)' }} />
              Invoice Itemization & Tax Compliance
            </h4>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Inv Date</th>
                    <th>Due Date</th>
                    <th>Inv Amount</th>
                    <th>Paid</th>
                    <th>TDS</th>
                    <th>VDS</th>
                    <th>Outstanding</th>
                    <th>Status</th>
                    <th>TDS Challan</th>
                    <th>VDS Doc</th>
                  </tr>
                </thead>
                <tbody>
                  {clientInvoices.map((inv) => {
                    let badgeClass = "badge-paid";
                    if (inv.paymentStatus === 'Overdue') badgeClass = "badge-overdue";
                    else if (inv.paymentStatus === 'Partial') badgeClass = "badge-partial";
                    else if (inv.paymentStatus === 'Pending') badgeClass = "badge-pending";

                    return (
                      <tr key={inv.invoiceNo}>
                        <td style={{ fontWeight: 600 }}>{inv.invoiceNo}</td>
                        <td>{formatDate(inv.invoiceDate)}</td>
                        <td>{formatDate(inv.dueDate)}</td>
                        <td className="currency-text">{formatBDT(inv.invoiceAmount)}</td>
                        <td className="currency-text" style={{ color: 'var(--color-success)' }}>{formatBDT(inv.paymentAmount)}</td>
                        <td className="currency-text">{formatBDT(inv.tdsAmount)}</td>
                        <td className="currency-text">{formatBDT(inv.vdsAmount)}</td>
                        <td className="currency-text" style={{ fontWeight: 700, color: inv.outstandingAmount > 0 ? 'var(--color-danger)' : 'var(--text-main)' }}>
                          {formatBDT(inv.outstandingAmount)}
                        </td>
                        <td>
                          <span className={`badge ${badgeClass}`}>{inv.paymentStatus}</span>
                        </td>
                        <td>
                          <span className={`badge ${inv.tdsChallanStatus === 'Received' ? 'badge-paid' : 'badge-overdue'}`}>
                            {inv.tdsChallanStatus}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${inv.vdsDocumentStatus === 'Received' ? 'badge-paid' : 'badge-overdue'}`}>
                            {inv.vdsDocumentStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close Statement
          </button>
        </div>
      </div>
    </div>
  );
}
