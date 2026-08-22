import React from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { formatBDT } from '../utils/formatters';

ChartJS.register(...registerables);

export function AgingAnalysis({ records, onSelectAgingFilter }) {
  const agingCategories = ["Not Due", "1–30 Days", "31–60 Days", "61–90 Days", "90+ Days"];
  
  const agingStats = {
    "Not Due": { amount: 0, count: 0, color: '#10b981' },
    "1–30 Days": { amount: 0, count: 0, color: '#3b82f6' },
    "31–60 Days": { amount: 0, count: 0, color: '#f59e0b' },
    "61–90 Days": { amount: 0, count: 0, color: '#8b5cf6' },
    "90+ Days": { amount: 0, count: 0, color: '#ef4444' }
  };

  records.forEach((r) => {
    if (r.outstandingAmount > 0) {
      const cat = r.agingCategory || "Not Due";
      if (agingStats[cat]) {
        agingStats[cat].amount += r.outstandingAmount;
        agingStats[cat].count += 1;
      }
    }
  });

  const totalOutstanding = Object.values(agingStats).reduce((sum, item) => sum + item.amount, 0);

  const doughnutData = {
    labels: agingCategories,
    datasets: [
      {
        data: agingCategories.map(cat => agingStats[cat].amount),
        backgroundColor: agingCategories.map(cat => agingStats[cat].color),
        borderWidth: 2,
        borderColor: '#0f172a'
      }
    ]
  };

  const barData = {
    labels: agingCategories,
    datasets: [
      {
        label: 'Outstanding Amount (BDT)',
        data: agingCategories.map(cat => agingStats[cat].amount),
        backgroundColor: agingCategories.map(cat => agingStats[cat].color),
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Receivable Aging Analysis</h3>
          <p className="card-subtitle">Risk Breakdown by Overdue Duration</p>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '0.85rem',
          marginBottom: '1.25rem'
        }}
      >
        {agingCategories.map((cat) => {
          const stat = agingStats[cat];
          const pct = totalOutstanding > 0 ? (stat.amount / totalOutstanding) * 100 : 0;
          return (
            <div
              key={cat}
              onClick={() => onSelectAgingFilter && onSelectAgingFilter(cat)}
              style={{
                background: 'rgba(0, 0, 0, 0.2)',
                border: `1px solid ${stat.color}40`,
                borderLeft: `4px solid ${stat.color}`,
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 0.9rem',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
              className="clickable-card"
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {cat}
              </div>
              <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>
                {formatBDT(stat.amount, true)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                <span>{stat.count} Invoices</span>
                <span style={{ color: stat.color, fontWeight: 600 }}>{pct.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Chart Split */}
      <div className="grid-equal-2col">
        <div style={{ height: '240px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Doughnut
            data={doughnutData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'right', labels: { color: '#9ca3af', font: { family: 'Inter', size: 11 } } },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.label}: ${formatBDT(ctx.raw)}`
                  }
                }
              }
            }}
          />
        </div>

        <div style={{ height: '240px', position: 'relative' }}>
          <Bar
            data={barData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `Outstanding: ${formatBDT(ctx.raw)}`
                  }
                }
              },
              scales: {
                x: { ticks: { color: '#9ca3af', font: { size: 10 } } },
                y: {
                  ticks: {
                    color: '#9ca3af',
                    font: { family: 'JetBrains Mono', size: 10 },
                    callback: (val) => formatBDT(val, true)
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
