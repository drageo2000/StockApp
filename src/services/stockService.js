const API_BASE = '/api';

export const getPortfolioStocks = async (range = '1d') => {
  const response = await fetch(`${API_BASE}/portfolio?range=${range}&_t=${Date.now()}`);
  if (!response.ok) throw new Error('Failed to fetch portfolio');
  return await response.json();
};

export const getGrowthStocks = async () => {
  const response = await fetch(`${API_BASE}/growth`);
  if (!response.ok) throw new Error('Failed to fetch growth stocks');
  return await response.json();
};

export const addStockToPortfolio = async (symbol) => {
  const response = await fetch(`${API_BASE}/portfolio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ symbol }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to add stock');
  }
  return await response.json();
};

export const removeStockFromPortfolio = async (symbol) => {
  const response = await fetch(`${API_BASE}/portfolio/${symbol}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to remove stock');
  return await response.json();
};

export const searchStock = async (query) => {
  const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Search failed');
  }
  return await response.json();
};
