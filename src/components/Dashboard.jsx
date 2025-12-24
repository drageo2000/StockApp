import React, { useEffect, useState } from 'react';
import StockCard from './StockCard';
import { getPortfolioStocks, addStockToPortfolio, removeStockFromPortfolio, searchStock } from '../services/stockService';
import './Dashboard.css';

const Dashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTicker, setNewTicker] = useState('');
  const [error, setError] = useState(null);
  const [range, setRange] = useState('1d'); // Default range

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const data = await getPortfolioStocks(range);
      setStocks(data);
    } catch (err) {
      setError('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, [range]); // Refetch when range changes

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!newTicker.trim()) return;
    setError(null);
    const query = newTicker.trim();

    try {
      // First, try to search for the symbol/company
      const searchResult = await searchStock(query);

      let symbolToAdd = query;
      if (searchResult && searchResult.symbol) {
        symbolToAdd = searchResult.symbol;
      } else {
        // If search returns nothing but it looks like a ticker (short, no spaces), try it directly
        // otherwise, warn user
        if (query.includes(' ') || query.length > 5) {
          throw new Error(`Could not find stock for "${query}"`);
        }
      }

      await addStockToPortfolio(symbolToAdd);
      setNewTicker('');
      await fetchStocks(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveStock = async (symbol) => {
    // if (!window.confirm(`Remove ${symbol} from portfolio?`)) return;
    try {
      await removeStockFromPortfolio(symbol);
      await fetchStocks(); // Refresh
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading Portfolio...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="section-title">Portfolio</h1>
        <div className="range-selector">
          {['1d', '1w', '1mo', '1y'].map(r => (
            <button
              key={r}
              className={`range-btn ${range === r ? 'active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <form className="add-stock-form" onSubmit={handleAddStock}>
        <input
          type="text"
          placeholder="Enter company or symbol (e.g. Apple)"
          value={newTicker}
          onChange={(e) => setNewTicker(e.target.value)}
          className="stock-input"
        />
        <button type="submit" className="add-btn">Add Stock</button>
      </form>
      {error && <div className="error-message">{error}</div>}

      <div className="stock-grid">
        {stocks.map(stock => (
          <div key={stock.id} className="stock-wrapper">
            <StockCard stock={stock} />
            <button
              className="remove-btn"
              onClick={() => handleRemoveStock(stock.id)}
              title="Remove stock"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
