import React from 'react';
import { Sparkles, AlertCircle, TrendingUp, UserX, FileText, CheckCircle } from 'lucide-react';
import { formatBDT, formatPercent } from '../utils/formatters';

export function ManagementSummary({ metrics, records }) {
  if (!records || records.length === 0) return null;

  // Calculate highest outstanding client
  const clientOutstandingMap = {};
  const clientOverdueMap = {};
  let urgentFollowUpCount = 0;
  let pendingTdsVdsCount = 0;

  records.forEach((r) => {
    if (r.outstandingAmount > 0) {
      clientOutstandingMap[r.clientName] = (clientOutstandingMap[r.clientName] || 0) + r.outstandingAmount;
    }
    if (r.daysOverdue > 0) {
      clientOverdueMap[r.clientName] = (clientOverdueMap[r.clientName] || 0) + r.outstandingAmount;
    }
    if (r.daysOverdue >= 30 || r.clientResponse?.toLowerCase().includes('dispute')) {
      urgentFollowUpCount++;
    }
    if (r.tdsChallanStatus === 'Pending' || r.vdsDocumentStatus === 'Pending') {
      pendingTdsVdsCount++;
    }
  });

  let topOutstandingClient = { name: 'None', amount: 0 };
  Object.entries(clientOutstandingMap).forEach(([name, amount]) => {
    if (amount > topOutstandingClient.amount) {
      topOutstandingClient = { name, amount };
    }
  });

  let topOverdueClient = { name: 'None', amount: 0 };
  Object.entries(clientOverdueMap).forEach(([name, amount]) => {
    if (amount > topOverdueClient.amount) {
      topOverdueClient = { name, amount };
    }
  });

  return (
    <div className="management-summary-card">
      <div className="card-header" style={{ marginBottom: '0.6rem' }}>
        <div className="card-title" style={{ color: 'var(--brand-primary)' }}>
          <Sparkles size={18} />
          Executive Management Briefing
        </div>
        <span className="badge badge-paid" style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--brand-primary)' }}>
          Auto-Generated Insights
        </span>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        Current portfolio total receivables stand at <strong style={{ color: 'var(--text-main)' }}>{formatBDT(metrics.totalReceivable)}</strong> with an overall collection efficiency rate of <strong style={{ color: 'var(--color-success)' }}>{formatPercent(metrics.collectionRate)}</strong>.
      </p>

      <div className="summary-bullets">
        <div className="summary-bullet-item">
          <TrendingUp size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--text-main)' }}>Total Outstanding:</strong> {formatBDT(metrics.totalOutstanding)} across {metrics.totalInvoices} active invoices.
          </div>
        </div>

        <div className="summary-bullet-item">
          <UserX size={16} style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--text-main)' }}>Highest Outstanding Client:</strong> {topOutstandingClient.name} ({formatBDT(topOutstandingClient.amount)}).
          </div>
        </div>

        <div className="summary-bullet-item">
          <AlertCircle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--text-main)' }}>Top Overdue Risk:</strong> {topOverdueClient.name} ({formatBDT(topOverdueClient.amount)} overdue).
          </div>
        </div>

        <div className="summary-bullet-item">
          <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--text-main)' }}>90+ Days Critical Outstanding:</strong> {formatBDT(metrics.overdue90PlusAmount)} requiring immediate escalation.
          </div>
        </div>

        <div className="summary-bullet-item">
          <CheckCircle size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--text-main)' }}>Urgent Follow-ups Required:</strong> {urgentFollowUpCount} accounts pending immediate payment response.
          </div>
        </div>

        <div className="summary-bullet-item">
          <FileText size={16} style={{ color: 'var(--color-purple)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--text-main)' }}>Tax Documentation Pending:</strong> {pendingTdsVdsCount} invoices awaiting TDS Challan / VDS Mushak certificate.
          </div>
        </div>
      </div>
    </div>
  );
}
