import React, { useState } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { formatBDT } from '../utils/formatters';

ChartJS.register(...registerables);

export function MonthlyCollectionChart({ records }) {
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  // Group by month
  const monthMap = {};
  records.forEach((r) => {
    const monthKey = r.billingMonth || 'Unknown';
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { billing: 0, collection: 0, invoiceCount: 0 };
    }
    monthMap[monthKey].billing += r.invoiceAmount;
    monthMap[monthKey].collection += r.paymentAmount;
    monthMap[monthKey].invoiceCount += 1;
  });

  let months = Object.keys(monthMap);
  if (selectedMonth !== 'ALL') {
    months = months.filter(m => m === selectedMonth);
  }

  const billingData = months.map(m => monthMap[m].billing);
  const collectionData = months.map(m => monthMap[m].collection);
  const rateData = months.map(m => {
    const b = monthMap[m].billing;
    const c = monthMap[m].collection;
    return b > 0 ? (c / b) * 100 : 0;
  });

  const chartData = {
    labels: months,
    datasets: [
      {
        type: 'bar',
        label: 'Total Billing (BDT)',
        data: billingData,
        backgroundColor: 'rgba(14, 165, 233, 0.75)',
        borderColor: '#0ea5e9',
        borderWidth: 1,
        borderRadius: 6,
        yAxisID: 'y'
      },
      {
        type: 'bar',
        label: 'Total Collection (BDT)',
        data: collectionData,
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 6,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Collection Rate (%)',
        data: rateData,
        borderColor: '#f59e0b',
        backgroundColor: '#f59e0b',
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.3,
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#9ca3af', font: { family: 'Inter', size: 11 } }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (context.dataset.yAxisID === 'y1') {
              return `Collection Rate: ${context.raw.toFixed(1)}%`;
            }
            return `${context.dataset.label}: ${formatBDT(context.raw)}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af', font: { family: 'Inter', size: 11 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          color: '#9ca3af',
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (value) => formatBDT(value, true)
        },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        max: 100,
        ticks: {
          color: '#f59e0b',
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (value) => `${value}%`
        },
        grid: { drawOnChartArea: false }
      }
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Monthly Collection Analysis</h3>
          <p className="card-subtitle">Month-wise Billing vs Collection Performance</p>
        </div>
        <select
          className="filter-select"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="ALL">All Months Overview</option>
          {Object.keys(monthMap).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div style={{ height: '320px', position: 'relative' }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
