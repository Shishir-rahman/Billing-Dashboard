import React, { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { formatBDT } from '../utils/formatters';

export function TdsVdsCompliance({ records, onSelectClient }) {
  const [docFilter, setDocFilter] = useState('ALL');

  let totalTds = 0;
  let tdsReceivedCount = 0;
  let tdsPendingCount = 0;
  let totalVds = 0;
  let vdsReceivedCount = 0;
  let vdsPendingCount = 0;

  records.forEach((r) => {
    totalTds += r.tdsAmount;
    if (r.tdsAmount > 0) {
      if (r.tdsChallanStatus === 'Received') tdsReceivedCount++;
      else tdsPendingCount++;
    }

    totalVds += r.vdsAmount;
    if (r.vdsAmount > 0) {
      if (r.vdsDocumentStatus === 'Received') vdsReceivedCount++;
      else vdsPendingCount++;
    }
  });

  let displayRecords = records.filter(r => r.tdsAmount > 0 || r.vdsAmount > 0);

  if (docFilter === 'PENDING') {
    displayRecords = displayRecords.filter(r => r.tdsChallanStatus === 'Pending' || r.vdsDocumentStatus === 'Pending');
  } else if (docFilter === 'RECEIVED') {
    displayRecords = displayRecords.filter(r => r.tdsChallanStatus === 'Received' && r.vdsDocumentStatus === 'Received');
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">TDS & VDS Compliance Tracking</h3>
          <p className="card-subtitle">Tax Deducted at Source (TDS) & VAT Deducted at Source (VDS Mushak 6.3) Monitoring</p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className={`btn ${docFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.74rem' }}
            onClick={() => setDocFilter('ALL')}
          >
            All Tax Records
          </button>
          <button
            className={`btn ${docFilter === 'PENDING' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.74rem', background: docFilter === 'PENDING' ? 'var(--color-danger)' : undefined }}
            onClick={() => setDocFilter('PENDING')}
          >
            Pending Docs ({tdsPendingCount + vdsPendingCount})
          </button>
        </div>
      </div>

      {/* Metric Summary Strip */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', marginBottom: '1.25rem' }}>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--brand-primary)' }}>
          <span className="kpi-title">Total TDS Deducted</span>
          <div className="kpi-value">{formatBDT(totalTds)}</div>
          <div className="kpi-footer" style={{ justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-success)' }}>Received: {tdsReceivedCount}</span>
            <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Pending: {tdsPendingCount}</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'var(--color-purple)' }}>
          <span className="kpi-title">Total VDS Deducted</span>
          <div className="kpi-value">{formatBDT(totalVds)}</div>
          <div className="kpi-footer" style={{ justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-success)' }}>Received: {vdsReceivedCount}</span>
            <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Pending: {vdsPendingCount}</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'var(--color-warning)' }}>
          <span className="kpi-title">Pending Tax Documents</span>
          <div className="kpi-value" style={{ color: 'var(--color-warning)' }}>
            {tdsPendingCount + vdsPendingCount} Certificates
          </div>
          <div className="kpi-footer">
            <span>Requires Follow-up with Client Audit</span>
          </div>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Invoice No</th>
              <th>TDS Amount</th>
              <th>Challan Status</th>
              <th>VDS Amount</th>
              <th>VDS Document Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayRecords.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No tax compliance records found.
                </td>
              </tr>
            ) : (
              displayRecords.map((r) => {
                const isTdsPending = r.tdsChallanStatus === 'Pending';
                const isVdsPending = r.vdsDocumentStatus === 'Pending';
                const isAnyPending = isTdsPending || isVdsPending;

                return (
                  <tr
                    key={r.invoiceNo}
                    style={{ background: isAnyPending ? 'rgba(239, 68, 68, 0.03)' : undefined }}
                  >
                    <td style={{ fontWeight: 600 }}>{r.clientName}</td>
                    <td>{r.invoiceNo}</td>
                    <td className="currency-text">{formatBDT(r.tdsAmount)}</td>
                    <td>
                      <span className={`badge ${isTdsPending ? 'badge-overdue' : 'badge-paid'}`}>
                        {r.tdsChallanStatus}
                      </span>
                    </td>
                    <td className="currency-text">{formatBDT(r.vdsAmount)}</td>
                    <td>
                      <span className={`badge ${isVdsPending ? 'badge-overdue' : 'badge-paid'}`}>
                        {r.vdsDocumentStatus}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                        onClick={() => onSelectClient(r.clientName)}
                      >
                        Client Ledger
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
