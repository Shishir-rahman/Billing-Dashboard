// API Service Wrapper

export async function getReceivablesData(forceRefresh = false) {
  const response = await fetch(`/api/receivables${forceRefresh ? '?refresh=true' : ''}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return await response.json();
}

export async function getSubscriptionBillingData(selectedMonth = null) {
  const query = selectedMonth ? `?month=${encodeURIComponent(selectedMonth)}` : '';
  const response = await fetch(`/api/subscription-billing${query}`);
  if (!response.ok) {
    throw new Error(`Subscription billing API error: ${response.statusText}`);
  }
  return await response.json();
}

export async function getMonthlyCollectionData(selectedMonth = null) {
  const query = selectedMonth ? `?month=${encodeURIComponent(selectedMonth)}` : '';
  const response = await fetch(`/api/monthly-collection${query}`);
  if (!response.ok) {
    throw new Error(`Monthly collection API error: ${response.statusText}`);
  }
  return await response.json();
}

export async function triggerDataRefresh() {
  const response = await fetch('/api/refresh', { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Refresh error: ${response.statusText}`);
  }
  return await response.json();
}

export async function getAppConfig() {
  const response = await fetch('/api/config');
  if (!response.ok) {
    throw new Error(`Config fetch error: ${response.statusText}`);
  }
  return await response.json();
}

export async function updateAppConfig(configPayload) {
  const response = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(configPayload)
  });
  if (!response.ok) {
    throw new Error(`Config save error: ${response.statusText}`);
  }
  return await response.json();
}
