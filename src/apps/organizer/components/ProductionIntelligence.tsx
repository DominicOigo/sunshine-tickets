import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Compass, RefreshCw, Info } from 'lucide-react';
import './ProductionIntelligence.css';

// Build a smooth cubic-bezier SVG path from an array of [x, y] points
const smoothPath = (pts: [number, number][]): string => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
};

export const ProductionIntelligence: React.FC<{ event?: import('../../../context/EventContext').Event | null }> = () => {
  const [isLive, setIsLive] = useState(true);
  const [heatmap, setHeatmap] = useState<number[]>([]);
  const [chartData, setChartData] = useState({
    attendance: [10, 25, 20, 35, 45, 30, 48, 55, 40, 52, 60, 68],
    revenue:    [5,  12, 18, 15, 28, 22, 35, 42, 30, 45, 50, 58],
  });

  useEffect(() => {
    setHeatmap(Array.from({ length: 144 }, () => Math.floor(Math.random() * 3)));
  }, []);

  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => {
      setHeatmap(prev =>
        prev.map(v => Math.max(0, Math.min(4, v + Math.floor(Math.random() * 3) - 1)))
      );
      setChartData(prev => {
        const pushNext = (arr: number[], range: number) => {
          const next = [...arr.slice(1)];
          next.push(Math.max(5, Math.min(100, arr[arr.length - 1] + Math.floor(Math.random() * range * 2 + 1) - range)));
          return next;
        };
        return { attendance: pushNext(prev.attendance, 8), revenue: pushNext(prev.revenue, 6) };
      });
    }, 3000);
    return () => clearInterval(id);
  }, [isLive]);

  const cellStyle = (v: number): React.CSSProperties => {
    const map: Record<number, React.CSSProperties> = {
      4: { backgroundColor: '#FF7020', boxShadow: '0 0 8px rgba(255,112,32,0.55)' },
      3: { backgroundColor: '#FF9500', boxShadow: '0 0 6px rgba(255,149,0,0.45)' },
      2: { backgroundColor: '#00F2FE', boxShadow: '0 0 6px rgba(0,242,254,0.45)' },
      1: { backgroundColor: 'rgba(0,242,254,0.3)' },
      0: { backgroundColor: 'rgba(255,255,255,0.03)' },
    };
    return map[v] ?? map[0];
  };

  // SVG chart config
  const W = 550, H = 200, PX = 40, PY = 20;

  const toPoints = (data: number[]): [number, number][] =>
    data.map((v, i) => [
      PX + (i * (W - PX * 2)) / (data.length - 1),
      H - PY - (v * (H - PY * 2)) / 100,
    ]);

  const attPts = toPoints(chartData.attendance);
  const revPts = toPoints(chartData.revenue);

  const areaPath = (pts: [number, number][]) =>
    `${smoothPath(pts)} L ${pts[pts.length - 1][0]} ${H - PY} L ${pts[0][0]} ${H - PY} Z`;

  return (
    <div className="intelligence-panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Production Intelligence</h2>
          <p className="panel-subtitle">Real-time check-in flow analytics and occupancy mapping</p>
        </div>
        <button
          className={`live-indicator-btn ${isLive ? 'active' : ''}`}
          onClick={() => setIsLive(v => !v)}
        >
          <span className="live-dot" />
          <span>{isLive ? 'LIVE TELEMETRY ON' : 'PAUSED'}</span>
          <RefreshCw size={14} className={isLive ? 'spin-icon' : ''} />
        </button>
      </div>

      <div className="intelligence-grid">

        {/* ── Heatmap ── */}
        <div className="glass-panel heatmap-panel">
          <div className="panel-section-header">
            <div className="header-left">
              <Compass size={20} className="cyan-neon" />
              <h3>Live Occupancy Heatmap</h3>
            </div>
            <span className="live-update-badge">● LIVE UPDATE</span>
          </div>
          <p className="section-description">Visitor density across venue sectors — updates every 3s.</p>

          <div className="heatmap-container-outer">
            <div className="heatmap-y-labels">
              {['A','B','C','D','E','F','G','H','I','J','K','L'].map(z => <span key={z}>{z}</span>)}
            </div>
            <div className="heatmap-inner-wrapper">
              <div className="heatmap-x-labels-top">
                {Array.from({ length: 12 }, (_, i) => <span key={i}>{i + 1}</span>)}
              </div>
              <div className="heatmap-grid-12x12">
                {heatmap.map((v, i) => (
                  <div key={i} className="heatmap-cell" style={cellStyle(v)} title={`Density: ${v}/4`} />
                ))}
              </div>
            </div>
          </div>

          <div className="heatmap-legend">
            {[
              { label: 'Empty',    s: { backgroundColor: 'rgba(255,255,255,0.03)' } },
              { label: 'Low',      s: { backgroundColor: 'rgba(0,242,254,0.3)' } },
              { label: 'Moderate', s: { backgroundColor: '#00F2FE' } },
              { label: 'Warning',  s: { backgroundColor: '#FF9500' } },
              { label: 'Critical', s: { backgroundColor: '#FF7020' } },
            ].map(({ label, s }) => (
              <div key={label} className="legend-item">
                <span className="legend-box" style={s} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chart ── */}
        <div className="glass-panel telemetry-panel">
          <div className="panel-section-header">
            <div className="header-left">
              <Activity size={20} className="orange-neon" />
              <h3>Telemetry & Metrics Chart</h3>
            </div>
            <span className="time-stamp-badge">{new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <p className="section-description">Attendance density mapped against revenue inflows — smooth live curves.</p>

          <div className="chart-legend-row">
            <div className="chart-legend-item"><span className="legend-line line-gold" /><span>Event Attendance</span></div>
            <div className="chart-legend-item"><span className="legend-line line-orange" /><span>Revenue Trend</span></div>
          </div>

          <div className="svg-container-large">
            <svg viewBox={`0 0 ${W} ${H}`} className="telemetry-chart-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF9500" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#FF9500" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF7020" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#FF7020" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(lvl => {
                const y = H - PY - (lvl * (H - PY * 2)) / 100;
                return (
                  <g key={lvl}>
                    <line x1={PX} y1={y} x2={W - PX} y2={y} stroke="rgba(255,255,255,0.04)" />
                    <text x={PX - 6} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">{lvl}%</text>
                  </g>
                );
              })}

              {/* X labels */}
              {['00h','02h','04h','06h','08h','10h','12h','14h','16h','18h','20h','22h'].map((t, i) => (
                <text key={i} x={PX + (i * (W - PX * 2)) / 11} y={H - 4} fill="var(--text-muted)" fontSize="9" textAnchor="middle">{t}</text>
              ))}

              {/* Area fills */}
              <motion.path d={areaPath(attPts)} fill="url(#goldGrad)" animate={{ d: areaPath(attPts) }} transition={{ duration: 0.8 }} />
              <motion.path d={areaPath(revPts)} fill="url(#orangeGrad)" animate={{ d: areaPath(revPts) }} transition={{ duration: 0.8 }} />

              {/* Smooth bezier lines */}
              <motion.path
                d={smoothPath(attPts)}
                fill="none" stroke="#FF9500" strokeWidth="2.5" strokeLinecap="round"
                animate={{ d: smoothPath(attPts) }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              <motion.path
                d={smoothPath(revPts)}
                fill="none" stroke="#FF7020" strokeWidth="2.5" strokeLinecap="round"
                animate={{ d: smoothPath(revPts) }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
              />

              {/* Live dot on latest point */}
              <motion.circle
                cx={attPts[attPts.length - 1][0]}
                cy={attPts[attPts.length - 1][1]}
                r="4" fill="#FF9500"
                animate={{ cy: attPts[attPts.length - 1][1], cx: attPts[attPts.length - 1][0] }}
                transition={{ duration: 0.8 }}
              />
              <motion.circle
                cx={revPts[revPts.length - 1][0]}
                cy={revPts[revPts.length - 1][1]}
                r="4" fill="#FF7020"
                animate={{ cy: revPts[revPts.length - 1][1], cx: revPts[revPts.length - 1][0] }}
                transition={{ duration: 0.8 }}
              />
            </svg>
          </div>

          <div className="telemetry-info-box">
            <Info size={15} className="cyan-neon" />
            <span>Auto-reconciliation updates every 3 seconds. Curves use cubic-bezier interpolation.</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductionIntelligence;
