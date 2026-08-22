import React, { useState } from 'react';
import { AlertCircle, ChevronRight, ShieldAlert } from 'lucide-react';
import { formatBDT } from '../utils/formatters';

export function TopOverdueClients({ records, onSelectClient }) {
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Aggregate by client
  const clientMap = {};
  records.forEach((r) => {
    if (!clientMap[r.clientName]) {
      clientMap[r.clientName] = {
        name: r.clientName,
        totalBilling: 0,
        totalCollection: 0,
        outstanding: 0,
        maxDaysOverdue: 0,
        overdue30Count: 0,
        overdue60Count: 0,
        overdue90Count: 0,
        invoices: []
      };
    }
    const c = clientMap[r.clientName];
    c.totalBilling += r.invoiceAmount;
    c.totalCollection += r.paymentAmount;
    c.outstanding += r.outstandingAmount;
    c.invoices.push(r);

    if (r.daysOverdue > c.maxDaysOverdue) {
      c.maxDaysOverdue = r.daysOverdue;
    }
    if (r.daysOverdue >= 30) c.overdue30Count++;
    if (r.daysOverdue >= 60) c.overdue60Count++;
    if (r.daysOverdue >= 90) c.overdue90Count++;
  });

  let clientList = Object.values(clientMap).filter(c => c.outstanding > 0);

  // Filter by risk tier
  if (riskFilter === '30+') {
    clientList = clientList.filter(c => c.maxDaysOverdue >= 30);
  } else if (riskFilter === '60+') {
    clientList = clientList.filter(c => c.maxDaysOverdue >= 60);
  } else if (riskFilter === '90+') {
    clientList = clientList.filter(c => c.maxDaysOverdue >= 90);
  }

  // Sort descending by outstanding amount and take top 10
  clientList.sort((a, b) => b.outstanding - a.outstanding);
  const top10 = clientList.slice(0, 10);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Top 10 Outstanding Clients</h3>
          <p className="card-subtitle">Highest Exposure & Overdue Risk Ranking</p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['ALL', '30+', '60+', '90+'].map((tier) => (
            <button
              key={tier}
              className={`btn ${riskFilter === tier ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem' }}
              onClick={() => setRiskFilter(tier)}
            >
              {tier === 'ALL' ? 'All Top' : `${tier} Days`}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Client Name</th>
              <th>Total Billing</th>
              <th>Outstanding</th>
              <th>Max Overdue</th>
              <th>Risk Level</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {top10.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No overdue client accounts matching selected risk threshold.
                </td>
              </tr>
            ) : (
              top10.map((client, index) => {
                let badgeClass = "badge-gray";
                let riskLabel = "Low Risk";
                if (client.maxDaysOverdue >= 90) {
                  badgeClass = "badge-overdue";
                  riskLabel = "Critical (90+)";
                } else if (client.maxDaysOverdue >= 60) {
                  badgeClass = "badge-pending";
                  riskLabel = "High (60+)";
                } else if (client.maxDaysOverdue >= 30) {
                  badgeClass = "badge-partial";
                  riskLabel = "Moderate (30+)";
                }

                return (
                  <tr
                    key={client.name}
                    className="clickable-row"
                    onClick={() => onSelectClient(client.name)}
                  >
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                      #{index + 1}
                    </td>
                    <td style={{ fontWeight: 600 }}>{client.name}</td>
                    <td className="currency-text">{formatBDT(client.totalBilling)}</td>
                    <td className="currency-text" style={{ fontWeight: 700, color: 'var(--color-danger)' }}>
                      {formatBDT(client.outstanding)}
                    </td>
                    <td>
                      {client.maxDaysOverdue > 0 ? (
                        <span style={{ color: client.maxDaysOverdue >= 90 ? 'var(--color-danger)' : 'var(--text-main)', fontWeight: 600 }}>
                          {client.maxDaysOverdue} days
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-success)' }}>On Time</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {riskLabel}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClient(client.name);
                        }}
                      >
                        <span>Details</span>
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
