import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Car, Leaf, Map } from 'lucide-react';
import { formatArea } from '../utils/area.js';
import { useUrbanStore } from '../store/useUrbanStore';

const TabButton = ({ active, onClick, icon, label }) => (
  <button type="button" className={active ? 'tab active' : 'tab'} onClick={onClick}>
    {icon} {label}
  </button>
);

const KPI = ({ label, value, unit, color = '#333' }) => (
  <div className="kpi">
    <div className="kpi-label">{label}</div>
    <div className="kpi-value" style={{ color }}>
      {value} <span>{unit}</span>
    </div>
  </div>
);

export default function InsightsPanel({ stats, analysisTab }) {
  const setAnalysisTab = useUrbanStore((state) => state.setAnalysisTab);

  const gfaArea = formatArea(stats.gfa);
  const plotArea = formatArea(stats.plotArea);
  const roadArea = formatArea(stats.roadArea);
  const cityArea = formatArea(stats.plotArea + stats.roadArea);

  return (
    <div className="panel insights">
      <h3>
        <Map size={18} /> Insights
      </h3>
      <div className={stats.isSubset ? 'scope-card scope-selected' : 'scope-card scope-total'}>
        <div>SCOPE: {stats.isSubset ? `SELECTED (${stats.count})` : `TOTAL CITY (${stats.count})`}</div>
      </div>
      <div className="tabs">
        <TabButton active={analysisTab === 'DEMO'} onClick={() => setAnalysisTab('DEMO')} icon={<Map size={14} />} label="Demo" />
        <TabButton active={analysisTab === 'ECO'} onClick={() => setAnalysisTab('ECO')} icon={<Leaf size={14} />} label="Eco" />
        <TabButton active={analysisTab === 'INFRA'} onClick={() => setAnalysisTab('INFRA')} icon={<Car size={14} />} label="Infra" />
      </div>

      {analysisTab === 'DEMO' && (
        <>
          <div className="kpi-grid">
            <KPI label="Total GFA" value={gfaArea.value} unit={gfaArea.unit} />
            <KPI label="Avg FAR" value={stats.far} unit="" />
            <KPI label="Residents" value={Math.round(stats.residents)} unit="ppl" color="#2e7d32" />
            <KPI label="Jobs" value={Math.round(stats.jobs)} unit="jobs" color="#1565c0" />
            <KPI label="Plot Area" value={plotArea.value} unit={plotArea.unit} />
            <KPI label="Road Area" value={roadArea.value} unit={roadArea.unit} />
            <KPI label="City Area" value={cityArea.value} unit={cityArea.unit} />
            <KPI label="Built-up Area" value={gfaArea.value} unit={gfaArea.unit} />
            <KPI
              label="Private/Public"
              value={stats.privatePublicRatio ? stats.privatePublicRatio.toFixed(2) : '—'}
              unit="ratio"
            />
          </div>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.landUse} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2}>
                  {stats.landUse.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {analysisTab === 'ECO' && (
        <div className="stack">
          <KPI label="Annual Energy" value={(stats.energy / 1000).toFixed(1)} unit="MWh/yr" color="#F5A623" />
          <KPI label="Daily Water" value={(stats.water / 1000).toFixed(1)} unit="kL/day" color="#4A90E2" />
          <KPI label="Solid Waste" value={Math.round(stats.waste)} unit="kg/day" color="#8B572A" />
          <div className="assumptions">
            Assumptions: Energy (Resi 150, Com 250), Water (135L/p), Waste (0.5kg/p)
          </div>
        </div>
      )}

      {analysisTab === 'INFRA' && (
        <div className="stack">
          <KPI label="Parking Demand" value={Math.round(stats.parking)} unit="spots" color="#333" />
          <div className="chart-card chart-compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'Required', val: Math.round(stats.parking) }]} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={50} />
                <Tooltip />
                <Bar dataKey="val" fill="#555" barSize={30} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
