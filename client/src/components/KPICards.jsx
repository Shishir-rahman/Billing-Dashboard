import React from 'react';
import { DollarSign, CheckCircle2, AlertTriangle, Clock, Percent, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { formatBDT, formatPercent } from '../utils/formatters';

export function KPICards({ metrics, monthlyCollectionInfo, subscriptionBillingInfo, onCardClick }) {
  const collectionAmt = monthlyCollectionInfo?.summary?.totalGrossCollected || 1086019;
  const collectionMonth = monthlyCollectionInfo?.selectedMonth || "August'26";

  const lastBillingMonthName = subscriptionBillingInfo?.monthName || "July 2026";
  const lastBillingDueAmt = subscriptionBillingInfo?.summary?.totalDueAmount || 1324357.83;
  const lastBillingDueCount = subscriptionBillingInfo?.summary?.dueClientsCount || 27;

  const kpiItems = [
    {
      id: 'total-receivable',
      title: 'Total Outstanding Receivable',
      value: formatBDT(metrics.totalReceivable),
      subtext: `${metrics.totalInvoices || 0} Active Accounts (Click to View Breakdown)`,
      icon: DollarSign,
      accent: 'var(--brand-primary)',
      bg: 'rgba(14, 165, 233, 0.12)',
      clickable: true
    },
    {
      id: 'total-collected',
      title: `Total Collection (${collectionMonth})`,
      value: formatBDT(collectionAmt),
      subtext: `${collectionMonth} Monthly Collection (Click for Details)`,
      icon: CheckCircle2,
      accent: 'var(--color-success)',
      bg: 'var(--color-success-bg)',
      clickable: true
    },
    {
      id: 'current-due',
      title: `Current Due (${lastBillingMonthName.split(' ')[0]}'26)`,
      value: formatBDT(lastBillingDueAmt),
      subtext: `${lastBillingMonthName.split(' ')[0]}'26 Billing Outstanding (${lastBillingDueCount} Accounts)`,
      icon: Clock,
      accent: 'var(--color-info)',
      bg: 'var(--color-info-bg)',
      clickable: true
    },
    {
      id: 'total-overdue',
      title: 'Total Overdue',
      value: formatBDT(metrics.totalOverdue),
      subtext: `${metrics.overdueCount || 0} Overdue Accounts (Click for Aging)`,
      icon: AlertTriangle,
      accent: 'var(--color-warning)',
      bg: 'var(--color-warning-bg)',
      clickable: true
    },
    {
      id: 'collection-rate',
      title: 'Collection Rate',
      value: formatPercent(metrics.collectionRate),
      subtext: 'Portfolio Target: > 85%',
      icon: Percent,
      accent: metrics.collectionRate >= 80 ? 'var(--color-success)' : 'var(--color-warning)',
      bg: metrics.collectionRate >= 80 ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
      clickable: false
    },
    {
      id: '90-plus-outstanding',
      title: '90+ Days Outstanding',
      value: formatBDT(metrics.overdue90PlusAmount),
      subtext: `${metrics.overdue90PlusCount || 0} High-Risk Accounts`,
      icon: ShieldAlert,
      accent: 'var(--color-danger)',
      bg: 'var(--color-danger-bg)',
      clickable: true
    }
  ];

  return (
    <div className="kpi-grid">
      {kpiItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.id}
            className="kpi-card"
            style={{
              '--kpi-accent': item.accent,
              '--kpi-bg': item.bg,
              cursor: item.clickable ? 'pointer' : 'default',
              transition: 'transform 0.15s ease, border-color 0.15s ease'
            }}
            onClick={() => {
              if (item.clickable && onCardClick) {
                onCardClick(item.id);
              }
            }}
          >
            <div className="kpi-header">
              <span className="kpi-title">{item.title}</span>
              <div className="kpi-icon-box">
                <IconComponent size={18} />
              </div>
            </div>
            <div className="kpi-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{item.value}</span>
              {item.clickable && (
                <ArrowUpRight size={16} style={{ color: item.accent, opacity: 0.8 }} />
              )}
            </div>
            <div className="kpi-footer">
              <span>{item.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
