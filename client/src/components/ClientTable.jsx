import React, { useState } from 'react';
import { ArrowUpDown, ChevronRight, Download, Search } from 'lucide-react';
import { formatBDT, formatDate } from '../utils/formatters';

export function ClientTable({ records, onSelectClient }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('outstanding');
  const [sortDirection, setSortDirection] = useState('desc');

  // Group invoices by client
  const clientMap = {};
  records.forEach((r) => {
    if (!clientMap[r.clientName]) {
      clientMap[r.clientName] = {
        clientName: r.clientName,
        totalBilling: 0,
        totalCollection: 0,
        tds: 0,
        vds: 0,
        outstanding: 0,
        oldestDueDate: null,
        maxDaysOverdue: 0,
        statuses: new Set(),
        invoices: []
      };
    }
    const c = clientMap[r.clientName];
    c.totalBilling += r.invoiceAmount;
    c.totalCollection += r.paymentAmount;
    c.tds += r.tdsAmount;
    c.vds += r.vdsAmount;
    c.outstanding += r.outstandingAmount;
    c.statuses.add(r.paymentStatus);
    c.invoices.push(r);

    if (r.dueDate) {
      if (!c.oldestDueDate || new Date(r.dueDate) < new Date(c.oldestDueDate)) {
        c.oldestDueDate = r.dueDate;
      }
    }
    if (r.daysOverdue > c.maxDaysOverdue) {
      c.maxDaysOverdue = r.daysOverdue;
    }
  });

  let clientList = Object.values(clientMap);

  // Search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    clientList = clientList.filter(c => c.clientName.toLowerCase().includes(term));
  }

  // Sorting
  clientList.sort((a, b) => {
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
    const headers = ['Client Name', 'Total Billing', 'Total Collection', 'TDS', 'VDS', 'Outstanding', 'Oldest Due Date', 'Days Overdue'];
    const rows = clientList.map(c => [
      `"${c.clientName}"`,
      c.totalBilling,
      c.totalCollection,
      c.tds,
      c.vds,
      c.outstanding,
      c.oldestDueDate || '',
      c.maxDaysOverdue
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sokrio_Client_Receivables_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Client-wise Receivable Ledger</h3>
          <p className="card-subtitle">Comprehensive Accounts Portfolio Breakdown ({clientList.length} Clients)</p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
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

          <button className="btn btn-secondary" onClick={exportCSV}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('clientName')}>
                Client Name <ArrowUpDown size={12} />
              </th>
              <th className="sortable" onClick={() => handleSort('totalBilling')}>
                Total Billing <ArrowUpDown size={12} />
              </th>
              <th className="sortable" onClick={() => handleSort('totalCollection')}>
                Total Collection <ArrowUpDown size={12} />
              </th>
              <th className="sortable" onClick={() => handleSort('tds')}>
                TDS <ArrowUpDown size={12} />
              </th>
              <th className="sortable" onClick={() => handleSort('vds')}>
                VDS <ArrowUpDown size={12} />
              </th>
              <th className="sortable" onClick={() => handleSort('outstanding')}>
                Outstanding <ArrowUpDown size={12} />
              </th>
              <th className="sortable" onClick={() => handleSort('oldestDueDate')}>
                Oldest Due Date <ArrowUpDown size={12} />
              </th>
              <th className="sortable" onClick={() => handleSort('maxDaysOverdue')}>
                Days Overdue <ArrowUpDown size={12} />
              </th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {clientList.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No clients found matching current search/filter.
                </td>
              </tr>
            ) : (
              clientList.map((c) => {
                const statusArr = Array.from(c.statuses);
                let mainStatus = statusArr[0];
                if (statusArr.includes('Overdue')) mainStatus = 'Overdue';
                else if (statusArr.includes('Partial')) mainStatus = 'Partial';
                else if (statusArr.includes('Pending')) mainStatus = 'Pending';

                let badgeClass = "badge-paid";
                if (mainStatus === 'Overdue') badgeClass = "badge-overdue";
                else if (mainStatus === 'Partial') badgeClass = "badge-partial";
                else if (mainStatus === 'Pending') badgeClass = "badge-pending";

                return (
                  <tr
                    key={c.clientName}
                    className="clickable-row"
                    onClick={() => onSelectClient(c.clientName)}
                  >
                    <td style={{ fontWeight: 600 }}>{c.clientName}</td>
                    <td className="currency-text">{formatBDT(c.totalBilling)}</td>
                    <td className="currency-text" style={{ color: 'var(--color-success)' }}>
                      {formatBDT(c.totalCollection)}
                    </td>
                    <td className="currency-text">{formatBDT(c.tds)}</td>
                    <td className="currency-text">{formatBDT(c.vds)}</td>
                    <td className="currency-text" style={{ fontWeight: 700, color: c.outstanding > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {formatBDT(c.outstanding)}
                    </td>
                    <td>{formatDate(c.oldestDueDate)}</td>
                    <td>
                      {c.maxDaysOverdue > 0 ? (
                        <span style={{ color: c.maxDaysOverdue >= 60 ? 'var(--color-danger)' : 'var(--color-warning)', fontWeight: 600 }}>
                          {c.maxDaysOverdue} days
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-success)' }}>Current</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{mainStatus}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClient(c.clientName);
                        }}
                      >
                        <span>View</span>
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
