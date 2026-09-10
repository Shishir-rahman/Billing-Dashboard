import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchReceivablesData, fetchSubscriptionBillingData, fetchMonthlyCollectionData } from './googleSheetsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, 'config.json');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper to read config
function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading config.json:", err);
  }
  return {
    spreadsheetId: "1mQvqrMkY-Q7T9BwFxeYCaWo9PPIGAET7gTF6Zrh8QXE",
    collectionSpreadsheetId: "13574a1BRR9Q4qK2FOtgoe0ZppASz5RJUVceXTozMmkA",
    sheetName: "Receivable Data",
    authMode: "sample_fallback",
    googleApiKey: "",
    csvPublishUrl: "",
    autoRefreshIntervalMinutes: 5
  };
}

// Helper to write config
function writeConfig(newConfig) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing config.json:", err);
    return false;
  }
}

// Cache variables
let cachedData = null;
let lastFetchTime = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minute server cache

// API Routes
app.get('/api/receivables', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const now = Date.now();

    if (!forceRefresh && cachedData && lastFetchTime && (now - lastFetchTime < CACHE_TTL_MS)) {
      return res.json(cachedData);
    }

    const config = readConfig();
    const result = await fetchReceivablesData(config);
    
    cachedData = result;
    lastFetchTime = now;

    res.json(result);
  } catch (error) {
    console.error("Error fetching receivables:", error);
    res.status(500).json({ error: "Failed to fetch receivables data", details: error.message });
  }
});

// Endpoint for Subscription Billing vs MoM Growth
app.get('/api/subscription-billing', async (req, res) => {
  try {
    const config = readConfig();
    const result = await fetchSubscriptionBillingData(config, req.query.month || null);
    res.json(result);
  } catch (error) {
    console.error("Error fetching subscription billing:", error);
    res.status(500).json({ error: "Failed to fetch subscription billing data", details: error.message });
  }
});

// Endpoint for Monthly Collection (Spreadsheet ID: 13574a1BRR9Q4qK2FOtgoe0ZppASz5RJUVceXTozMmkA)
app.get('/api/monthly-collection', async (req, res) => {
  try {
    const config = readConfig();
    const month = req.query.month || null;
    const result = await fetchMonthlyCollectionData(config, month);
    res.json(result);
  } catch (error) {
    console.error("Error fetching monthly collection:", error);
    res.status(500).json({ error: "Failed to fetch monthly collection data", details: error.message });
  }
});

// Settings Config API
app.get('/api/config', (req, res) => {
  try {
    const config = readConfig();
    const safeConfig = {
      spreadsheetId: config.spreadsheetId || '',
      collectionSpreadsheetId: config.collectionSpreadsheetId || '',
      sheetName: config.sheetName || 'Receivable Data',
      authMode: config.authMode || 'sample_fallback',
      autoRefreshIntervalMinutes: config.autoRefreshIntervalMinutes || 5,
      hasApiKey: Boolean(config.googleApiKey),
      hasCsvUrl: Boolean(config.csvPublishUrl)
    };
    res.json(safeConfig);
  } catch (error) {
    res.status(500).json({ error: "Failed to read configuration", details: error.message });
  }
});

app.post('/api/config', (req, res) => {
  try {
    const { spreadsheetId, collectionSpreadsheetId, sheetName, authMode, googleApiKey, csvPublishUrl, autoRefreshIntervalMinutes } = req.body;
    const currentConfig = readConfig();

    const updatedConfig = {
      ...currentConfig,
      spreadsheetId: spreadsheetId !== undefined ? spreadsheetId : currentConfig.spreadsheetId,
      collectionSpreadsheetId: collectionSpreadsheetId !== undefined ? collectionSpreadsheetId : currentConfig.collectionSpreadsheetId,
      sheetName: sheetName !== undefined ? sheetName : currentConfig.sheetName,
      authMode: authMode !== undefined ? authMode : currentConfig.authMode,
      csvPublishUrl: csvPublishUrl !== undefined ? csvPublishUrl : currentConfig.csvPublishUrl,
      autoRefreshIntervalMinutes: autoRefreshIntervalMinutes !== undefined ? autoRefreshIntervalMinutes : currentConfig.autoRefreshIntervalMinutes
    };

    if (googleApiKey !== undefined) {
      updatedConfig.googleApiKey = googleApiKey;
    }

    const success = writeConfig(updatedConfig);
    if (!success) {
      return res.status(500).json({ error: "Failed to save configuration" });
    }

    // Invalidate cache
    cachedData = null;
    lastFetchTime = null;

    res.json({ message: "Configuration updated successfully", config: updatedConfig });
  } catch (error) {
    res.status(500).json({ error: "Config update failed", details: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: "OK", company: "Sokrio Technologies Ltd", timestamp: new Date() });
});

// Serve static frontend in production or standalone mode
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Only start standalone HTTP server if not running as Vercel serverless function
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Sokrio AR Dashboard API Server running on port ${PORT}`);
  });
}

export default app;
