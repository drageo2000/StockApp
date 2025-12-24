const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { getPortfolio, addStock, removeStock } = require('./database');

const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

const YAHOO_API_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

const GROWTH_TICKERS = [
    { id: 'NVDA', name: 'NVIDIA Corp.', potential: 'High' },
    { id: 'AMD', name: 'Adv. Micro Devices', potential: 'High' },
    { id: 'PLTR', name: 'Palantir Tech', potential: 'Medium' },
    { id: 'U', name: 'Unity Software', potential: 'High' }
];

// Helper to determine Yahoo interval parameter
const getInterval = (range) => {
    switch (range) {
        case '1d': return '5m'; // 5 minute intervals for 1 day
        case '5d': return '15m'; // 15 minute intervals for 5 days
        case '1mo': return '1d'; // Daily intervals for 1 month
        case '3mo': return '1d';
        case '1y': return '1wk'; // Weekly intervals for 1 year
        default: return '1d'; // Fallback
    }
};

const getRangeParam = (range) => {
    // yahoo api uses '1d', '5d', '1mo', '3mo', '6mo', '1y', 'ytd', 'max'
    // Map our app's "1w" to Yahoo's "5d" for simplicity or close match
    if (range === '1w') return '5d';
    return range;
}

// Helper to fetch data from Yahoo
// Note: We don't need the cors proxy here because we are on the server!
async function fetchStockData(ticker, range = '1d') {
    try {
        const yahooRange = getRangeParam(range);
        const interval = getInterval(yahooRange);

        const url = `${YAHOO_API_BASE}/${ticker}?range=${yahooRange}&interval=${interval}`;

        // Yahoo may block requests without a user-agent
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const result = response.data.chart.result[0];
        const meta = result.meta;
        const quotes = result.indicators.quote[0];

        // Filter out nulls from closed market periods
        const prices = result.timestamp.map((t, i) => ({
            time: t,
            close: quotes.close[i]
        })).filter(p => p.close !== null).map(p => p.close);

        const currentPrice = meta.regularMarketPrice;
        // For range change, we compare current price vs first price in the fetched series
        const startPrice = prices.length > 0 ? prices[0] : currentPrice;
        const change = currentPrice - startPrice;
        const changePercent = (change / startPrice) * 100;

        return {
            id: ticker,
            name: meta.shortName || ticker,
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            history: prices, // Array of prices for the chart
            range: range
        };
    } catch (error) {
        console.error(`Failed to fetch ${ticker}:`, error.message);
        return null;
    }
}

// Routes

// Get Portfolio
app.get('/api/portfolio', async (req, res) => {
    const range = req.query.range || '1d';
    console.log(`Fetching portfolio for range: ${range}`);
    try {
        const symbols = await getPortfolio();
        const promises = symbols.map(s => fetchStockData(s, range));
        const results = await Promise.all(promises);
        res.json(results.filter(r => r !== null));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Stock
app.post('/api/portfolio', async (req, res) => {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

    try {
        // Validate if symbol exists by trying to fetch it
        const data = await fetchStockData(symbol);
        if (!data) return res.status(404).json({ error: 'Invalid stock symbol' });

        await addStock(symbol.toUpperCase());
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove Stock
app.delete('/api/portfolio/:symbol', async (req, res) => {
    try {
        await removeStock(req.params.symbol.toUpperCase());
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Growth Stocks
app.get('/api/growth', async (req, res) => {
    try {
        const promises = GROWTH_TICKERS.map(async (item) => {
            const data = await fetchStockData(item.id);
            if (!data) return null;
            return { ...data, ...item };
        });
        const results = await Promise.all(promises);
        res.json(results.filter(r => r !== null));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Search Stocks
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query required' });

    try {
        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const quotes = response.data.quotes || [];
        // Filter for specific types if needed, or just take the first relevant one
        // Usually the first result is the best match
        const bestMatch = quotes.find(q =>
            (q.quoteType === 'EQUITY' || q.quoteType === 'ETF') && q.isYahooFinance
        );

        if (bestMatch) {
            res.json({ symbol: bestMatch.symbol, name: bestMatch.shortname || bestMatch.longname });
        } else if (quotes.length > 0) {
            // Fallback to first result if no EQUITY/ETF found
            res.json({ symbol: quotes[0].symbol, name: quotes[0].shortname });
        } else {
            res.status(404).json({ error: 'No results found' });
        }
    } catch (err) {
        console.error('Search error:', err.message);
        res.status(500).json({ error: 'Search failed' });
    }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
