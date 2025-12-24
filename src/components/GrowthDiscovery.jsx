import React, { useEffect, useState } from 'react';
import StockCard from './StockCard';
import { getGrowthStocks } from '../services/stockService';
import './Dashboard.css'; // Reusing dashboard styles for grid

const GrowthDiscovery = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStocks = async () => {
            const data = await getGrowthStocks();
            setStocks(data);
            setLoading(false);
        };
        fetchStocks();
    }, []);

    if (loading) return <div className="loading">Finding Opportunities...</div>;

    return (
        <div className="dashboard">
            <h1 className="section-title">Growth Opportunities</h1>
            <p className="subtitle">Stocks with high potential for next 6mo-1y</p>
            <div className="stock-grid">
                {stocks.map(stock => (
                    <StockCard key={stock.id} stock={stock} />
                ))}
            </div>
        </div>
    );
};

export default GrowthDiscovery;
