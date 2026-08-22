import React from 'react';
import { Filter, RotateCcw, Search } from 'lucide-react';

export function FilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  clientOptions,
  monthOptions,
  yearOptions
}) {
  return (
    <div className="filter-bar">
      <div className="filter-group" style={{ marginRight: '0.2rem' }}>
        <Filter size={16} style={{ color: 'var(--brand-primary)' }} />
        <span className="filter-label">Filters</span>
      </div>

      <div className="filter-group" style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="filter-input"
            style={{ paddingLeft: '30px', width: '100%' }}
            placeholder="Search Client or Invoice No..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-label">Month</span>
        <select
          className="filter-select"
          value={filters.month}
          onChange={(e) => onFilterChange('month', e.target.value)}
        >
          <option value="ALL">All Months</option>
          {monthOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-label">Year</span>
        <select
          className="filter-select"
          value={filters.year}
          onChange={(e) => onFilterChange('year', e.target.value)}
        >
          <option value="ALL">All Years</option>
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-label">Client</span>
        <select
          className="filter-select"
          style={{ maxWidth: '180px' }}
          value={filters.client}
          onChange={(e) => onFilterChange('client', e.target.value)}
        >
          <option value="ALL">All Clients</option>
          {clientOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-label">Status</span>
        <select
          className="filter-select"
          value={filters.paymentStatus}
          onChange={(e) => onFilterChange('paymentStatus', e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
          <option value="Overdue">Overdue</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-label">Aging</span>
        <select
          className="filter-select"
          value={filters.agingCategory}
          onChange={(e) => onFilterChange('agingCategory', e.target.value)}
        >
          <option value="ALL">All Aging</option>
          <option value="Not Due">Not Due</option>
          <option value="1–30 Days">1–30 Days</option>
          <option value="31–60 Days">31–60 Days</option>
          <option value="61–90 Days">61–90 Days</option>
          <option value="90+ Days">90+ Days</option>
        </select>
      </div>

      <button
        className="btn btn-secondary"
        style={{ padding: '0.38rem 0.75rem', fontSize: '0.78rem' }}
        onClick={onResetFilters}
        title="Clear all active filters"
      >
        <RotateCcw size={14} />
        <span>Reset</span>
      </button>
    </div>
  );
}
