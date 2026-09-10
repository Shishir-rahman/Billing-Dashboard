import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  PhoneCall,
  FileCheck,
  FileSpreadsheet,
  Building2,
  RefreshCw,
  Sparkles,
  CreditCard,
  CalendarCheck
} from 'lucide-react';
import './styles/main.css';

import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { KPICards } from './components/KPICards';
import { ManagementSummary } from './components/ManagementSummary';
import { MonthlyCollectionChart } from './components/MonthlyCollectionChart';
import { AgingAnalysis } from './components/AgingAnalysis';
import { TopOverdueClients } from './components/TopOverdueClients';
import { ClientTable } from './components/ClientTable';
import { ClientDetailModal } from './components/ClientDetailModal';
import { FollowUpSection } from './components/FollowUpSection';
import { TdsVdsCompliance } from './components/TdsVdsCompliance';
import { SettingsModal } from './components/SettingsModal';
import { ReceivablesBreakdown } from './components/ReceivablesBreakdown';
import { SubscriptionBillingView } from './components/SubscriptionBillingView';
import { MonthlyCollectionView } from './components/MonthlyCollectionView';

import { getReceivablesData, getMonthlyCollectionData, getSubscriptionBillingData, triggerDataRefresh, getAppConfig } from './utils/api';

export default function App() {
  const [records, setRecords] = useState([]);
  const [monthlyCollectionInfo, setMonthlyCollectionInfo] = useState(null);
  const [subscriptionBillingInfo, setSubscriptionBillingInfo] = useState(null);
  const [dataSourceInfo, setDataSourceInfo] = useState('Initializing...');
  const [lastUpdated, setLastUpdated] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('collection'); // Default to Monthly Collection tab
  const [theme, setTheme] = useState('dark');
  const [selectedClientModal, setSelectedClientModal] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    month: 'ALL',
    year: 'ALL',
    client: 'ALL',
    paymentStatus: 'ALL',
    agingCategory: 'ALL',
    search: ''
  });

  // Apply theme attribute to root HTML
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initial Fetch
  useEffect(() => {
    loadData();
  }, []);

  // Auto Refresh Interval Setup
  useEffect(() => {
    let timer;
    getAppConfig().then(cfg => {
      if (cfg.autoRefreshIntervalMinutes && cfg.autoRefreshIntervalMinutes > 0) {
        const intervalMs = cfg.autoRefreshIntervalMinutes * 60 * 1000;
        timer = setInterval(() => {
          loadData(true);
        }, intervalMs);
      }
    }).catch(console.error);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  const loadData = async (forceRefresh = false) => {
    try {
      setIsRefreshing(true);
      const [res, collectionRes, subBillingRes] = await Promise.all([
        forceRefresh ? triggerDataRefresh() : getReceivablesData(),
        getMonthlyCollectionData().catch(() => null),
        getSubscriptionBillingData().catch(() => null)
      ]);
      setRecords(res.data || []);
      if (collectionRes) setMonthlyCollectionInfo(collectionRes);
      if (subBillingRes) setSubscriptionBillingInfo(subBillingRes);
      setDataSourceInfo(res.source || 'Google Sheets');
      setLastUpdated(res.lastUpdated || new Date().toISOString());
      setIsRefreshing(false);
    } catch (err) {
      console.error("Failed to load receivables data:", err);
      setDataSourceInfo('Offline / Error');
      setIsRefreshing(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      month: 'ALL',
      year: 'ALL',
      client: 'ALL',
      paymentStatus: 'ALL',
      agingCategory: 'ALL',
      search: ''
    });
  };

  // Derive unique options for filter dropdowns
  const { monthOptions, yearOptions, clientOptions } = useMemo(() => {
    const months = new Set();
    const years = new Set();
    const clients = new Set();

    records.forEach(r => {
      if (r.billingMonth) months.add(r.billingMonth);
      if (r.invoiceDate) {
        const yr = r.invoiceDate.split('-')[0];
        if (yr) years.add(yr);
      }
      if (r.clientName) clients.add(r.clientName);
    });

    return {
      monthOptions: Array.from(months),
      yearOptions: Array.from(years).sort().reverse(),
      clientOptions: Array.from(clients).sort()
    };
  }, [records]);

  // Filtered records pipeline
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (filters.month !== 'ALL' && r.billingMonth !== filters.month) return false;
      if (filters.year !== 'ALL' && (!r.invoiceDate || !r.invoiceDate.startsWith(filters.year))) return false;
      if (filters.client !== 'ALL' && r.clientName !== filters.client) return false;
      if (filters.paymentStatus !== 'ALL' && r.paymentStatus !== filters.paymentStatus) return false;
      if (filters.agingCategory !== 'ALL' && r.agingCategory !== filters.agingCategory) return false;

      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesClient = r.clientName.toLowerCase().includes(query);
        const matchesInvoice = r.invoiceNo.toLowerCase().includes(query);
        const matchesDetails = (r.remarks || r.billingMonth || '').toLowerCase().includes(query);
        if (!matchesClient && !matchesInvoice && !matchesDetails) return false;
      }

      return true;
    });
  }, [records, filters]);

  // Dynamic Portfolio Metrics Calculation
  const metrics = useMemo(() => {
    let totalReceivable = 0;
    let totalCollected = 0;
    let totalTds = 0;
    let totalVds = 0;
    let totalOutstanding = 0;
    let currentDue = subscriptionBillingInfo?.summary?.totalDueAmount || 1324357.83;
    let totalOverdue = 0;
    let overdueCount = 0;
    let overdue90PlusAmount = 0;
    let overdue90PlusCount = 0;

    filteredRecords.forEach(r => {
      totalReceivable += r.invoiceAmount;
      totalCollected += r.paymentAmount;
      totalTds += r.tdsAmount;
      totalVds += r.vdsAmount;
      totalOutstanding += r.outstandingAmount;

      if (r.outstandingAmount > 0) {
        if (r.daysOverdue > 0) {
          totalOverdue += r.outstandingAmount;
          overdueCount++;
        }

        if (r.agingCategory === '90+ Days') {
          overdue90PlusAmount += r.outstandingAmount;
          overdue90PlusCount++;
        }
      }
    });

    const collectionRate = totalReceivable > 0 ? (totalCollected / totalReceivable) * 100 : 0;

    return {
      totalInvoices: filteredRecords.length,
      totalReceivable,
      totalCollected,
      totalTds,
      totalVds,
      totalOutstanding,
      currentDue,
      totalOverdue,
      overdueCount,
      collectionRate,
      overdue90PlusAmount,
      overdue90PlusCount
    };
  }, [filteredRecords, subscriptionBillingInfo]);

  // KPI card click handler
  const handleKPICardClick = (cardId) => {
    if (cardId === 'total-receivable') {
      setActiveTab('breakdown');
    } else if (cardId === 'total-collected') {
      setActiveTab('collection');
    } else if (cardId === 'current-due') {
      setActiveTab('subscription');
    } else if (cardId === 'total-overdue') {
      setActiveTab('aging');
    } else if (cardId === '90-plus-outstanding') {
      handleFilterChange('agingCategory', '90+ Days');
      setActiveTab('aging');
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        dataSourceInfo={dataSourceInfo}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={() => loadData(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
      />

      {/* Navigation Tab Bar */}
      <nav className="nav-tab-bar">
        <button
          className={`tab-btn ${activeTab === 'collection' ? 'active' : ''}`}
          onClick={() => setActiveTab('collection')}
        >
          <CalendarCheck size={16} />
          Monthly Collection
        </button>
        <button
          className={`tab-btn ${activeTab === 'subscription' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          <CreditCard size={16} />
          {subscriptionBillingInfo?.monthName ? `${subscriptionBillingInfo.monthName} Subscription Bill` : "Subscription Bill"}
        </button>
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={16} />
          Executive Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'breakdown' ? 'active' : ''}`}
          onClick={() => setActiveTab('breakdown')}
        >
          <FileSpreadsheet size={16} />
          Receivables Breakdown
        </button>
        <button
          className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          <Users size={16} />
          Client Receivables
        </button>
        <button
          className={`tab-btn ${activeTab === 'aging' ? 'active' : ''}`}
          onClick={() => setActiveTab('aging')}
        >
          <Clock size={16} />
          Receivable Aging
        </button>
        <button
          className={`tab-btn ${activeTab === 'followup' ? 'active' : ''}`}
          onClick={() => setActiveTab('followup')}
        >
          <PhoneCall size={16} />
          Collection Follow-ups
        </button>
        <button
          className={`tab-btn ${activeTab === 'compliance' ? 'active' : ''}`}
          onClick={() => setActiveTab('compliance')}
        >
          <FileCheck size={16} />
          TDS & VDS Compliance
        </button>
      </nav>

      {/* Main Dashboard Workspace */}
      <main className="main-content">
        {/* Tab 1: Monthly Collection View */}
        {activeTab === 'collection' && (
          <MonthlyCollectionView
            onSelectClient={(cName) => setSelectedClientModal(cName)}
          />
        )}

        {/* Tab 2: July'26 Subscription Bill View */}
        {activeTab === 'subscription' && (
          <SubscriptionBillingView
            onSelectClient={(cName) => setSelectedClientModal(cName)}
          />
        )}

        {/* Tab 3: Executive Overview */}
        {activeTab === 'overview' && (
          <>
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              clientOptions={clientOptions}
              monthOptions={monthOptions}
              yearOptions={yearOptions}
            />

            <KPICards
              metrics={metrics}
              monthlyCollectionInfo={monthlyCollectionInfo}
              subscriptionBillingInfo={subscriptionBillingInfo}
              onCardClick={handleKPICardClick}
            />

            <ManagementSummary metrics={metrics} records={filteredRecords} />

            <div className="grid-2col">
              <MonthlyCollectionChart records={filteredRecords} />
              <TopOverdueClients
                records={filteredRecords}
                onSelectClient={(cName) => setSelectedClientModal(cName)}
              />
            </div>

            <AgingAnalysis
              records={filteredRecords}
              onSelectAgingFilter={(cat) => {
                handleFilterChange('agingCategory', cat);
                setActiveTab('aging');
              }}
            />

            <ClientTable
              records={filteredRecords}
              onSelectClient={(cName) => setSelectedClientModal(cName)}
            />
          </>
        )}

        {/* Tab 4: Total Receivable Itemized Breakdown Page */}
        {activeTab === 'breakdown' && (
          <ReceivablesBreakdown
            records={filteredRecords}
            onSelectClient={(cName) => setSelectedClientModal(cName)}
            onBackToOverview={() => setActiveTab('overview')}
          />
        )}

        {/* Tab 5: Client Receivables */}
        {activeTab === 'clients' && (
          <>
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              clientOptions={clientOptions}
              monthOptions={monthOptions}
              yearOptions={yearOptions}
            />
            <ClientTable
              records={filteredRecords}
              onSelectClient={(cName) => setSelectedClientModal(cName)}
            />
          </>
        )}

        {/* Tab 6: Aging Analysis */}
        {activeTab === 'aging' && (
          <>
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              clientOptions={clientOptions}
              monthOptions={monthOptions}
              yearOptions={yearOptions}
            />
            <AgingAnalysis
              records={filteredRecords}
              onSelectAgingFilter={(cat) => handleFilterChange('agingCategory', cat)}
            />
            <TopOverdueClients
              records={filteredRecords}
              onSelectClient={(cName) => setSelectedClientModal(cName)}
            />
          </>
        )}

        {/* Tab 7: Collection Follow-ups */}
        {activeTab === 'followup' && (
          <FollowUpSection
            records={filteredRecords}
            onSelectClient={(cName) => setSelectedClientModal(cName)}
          />
        )}

        {/* Tab 8: TDS & VDS Compliance */}
        {activeTab === 'compliance' && (
          <TdsVdsCompliance
            records={filteredRecords}
            onSelectClient={(cName) => setSelectedClientModal(cName)}
          />
        )}
      </main>

      {/* Client Detail View Modal */}
      {selectedClientModal && (
        <ClientDetailModal
          clientName={selectedClientModal}
          records={records}
          onClose={() => setSelectedClientModal(null)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSaved={() => loadData(true)}
      />
    </div>
  );
}
