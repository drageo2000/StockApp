import React, { useMemo } from 'react';
import './StockCard.css';

const Sparkline = ({ history, isPositive, width = 160, height = 100 }) => {
    if (!history || history.length < 2) return null;

    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1; // Avoid divide by zero

    // Normalize points to fit svg box
    const points = history.map((price, index) => {
        const x = (index / (history.length - 1)) * width;
        // Invert Y because SVG 0 is top
        const y = height - ((price - min) / range) * (height - 20) - 10; // 10px padding
        return `${x},${y}`;
    }).join(' ');

    // Create smooth curve (catmull-rom or simple polyline for now)
    // For simplicity and speed, a polyline is fine, or we can use a simple smoothing function
    // Let's use a simple polyline for accuracy
    const linePath = `M ${points}`;

    // Create area fill path
    const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

    const color = isPositive ? 'url(#gradPositive)' : 'url(#gradNegative)';
    const strokeColor = isPositive ? '#10b981' : '#ef4444';

    return (
        <div className="chart-container">
            <svg viewBox={`0 0 ${width} ${height}`} className="stock-chart" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="gradPositive" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gradNegative" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={areaPath} fill={color} />
                <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLineJoin="round" />
            </svg>
            <div className="chart-overlay">
                <span className="chart-cue max">${max.toFixed(0)}</span>
                <span className="chart-cue min">${min.toFixed(0)}</span>
            </div>
        </div>
    );
};

const StockCard = ({ stock }) => {
    const isPositive = stock.change >= 0;
    // Use actual history if available, otherwise just current price as fallback (will show empty chart)
    const history = stock.history || [];
    const rangeLabel = stock.range ? stock.range.toUpperCase() : '1D';

    return (
        <div className="stock-card">
            <div className="stock-card-header">
                <div className="stock-info-left">
                    <h3>{stock.id}</h3>
                    <span className="stock-name">{stock.name}</span>
                </div>
                <div className="stock-info-right">
                    <h2>${stock.price.toFixed(2)}</h2>
                    <div className={`stock-change ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? '▲' : '▼'} {Math.abs(stock.change).toFixed(2)} ({Math.abs(stock.changePercent).toFixed(2)}%) <span className="period-label">{rangeLabel}</span>
                    </div>
                </div>
            </div>

            <div className="stock-card-chart">
                <Sparkline history={history} isPositive={isPositive} />
                <span className="chart-period">{rangeLabel}</span>
                {stock.potential && (
                    <div className="stock-potential-tag">
                        {stock.potential} Growth
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockCard;
