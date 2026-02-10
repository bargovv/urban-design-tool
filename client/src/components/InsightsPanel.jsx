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

export default function InsightsPanel({ siteStats, selectionStats, selectedCount, analysisTab }) {
  const setAnalysisTab = useUrbanStore((state) => state.setAnalysisTab);

  const selectedStats = selectedCount > 0 ? selectionStats : siteStats;

  const siteGfaArea = formatArea(siteStats.gfa);
  const sitePlotArea = formatArea(siteStats.plotArea);
  const siteRoadArea = formatArea(siteStats.roadArea);
  const siteCityArea = formatArea(siteStats.plotArea + siteStats.roadArea);

  const selectedGfaArea = formatArea(selectedStats.gfa);
  const selectedPlotArea = formatArea(selectedStats.plotArea);
  const selectedRoadArea = formatArea(selectedStats.roadArea);
  const selectedCityArea = formatArea(selectedStats.plotArea + selectedStats.roadArea);

  return (
    <div className="panel insights">
      <h3>
        <Map size={18} /> Insights
      </h3>
      <div className={selectedCount > 0 ? 'scope-card scope-selected' : 'scope-card scope-total'}>
        <div>SCOPE: {selectedCount > 0 ? `SELECTED (${selectedCount})` : `TOTAL CITY`}</div>
      </div>

      <div className="selection-breakdown">
        <span>Total plots: {siteStats.plotTotals?.total ?? 0}</span>
        <span>Occupied: {siteStats.plotTotals?.occupied ?? 0}</span>
        <span>Empty: {siteStats.plotTotals?.empty ?? 0}</span>
      </div>

      {selectedCount > 0 && (
        <div className="selection-breakdown">
          <span>Plots: {selectedStats.selectedBreakdown?.plots ?? 0}</span>
          <span>Roads: {selectedStats.selectedBreakdown?.roads ?? 0}</span>
          <span>Buildings: {selectedStats.selectedBreakdown?.buildings ?? 0}</span>
        </div>
      )}
      <div className="tabs">
        <TabButton active={analysisTab === 'DEMO'} onClick={() => setAnalysisTab('DEMO')} icon={<Map size={14} />} label="Demo" />
        <TabButton active={analysisTab === 'ECO'} onClick={() => setAnalysisTab('ECO')} icon={<Leaf size={14} />} label="Eco" />
        <TabButton active={analysisTab === 'INFRA'} onClick={() => setAnalysisTab('INFRA')} icon={<Car size={14} />} label="Infra" />
      </div>

      {analysisTab === 'DEMO' && (
        <>
          <div className="insights-section-title">Site level</div>
          <div className="kpi-grid">
            <KPI label="Total GFA" value={siteGfaArea.value} unit={siteGfaArea.unit} />
            <KPI label="Avg FAR" value={siteStats.far} unit="" />
            <KPI label="Residents" value={Math.round(siteStats.residents)} unit="ppl" color="#2e7d32" />
            <KPI label="Jobs" value={Math.round(siteStats.jobs)} unit="jobs" color="#1565c0" />
            <KPI label="Plot Area" value={sitePlotArea.value} unit={sitePlotArea.unit} />
            <KPI label="Road Area" value={siteRoadArea.value} unit={siteRoadArea.unit} />
            <KPI label="City Area" value={siteCityArea.value} unit={siteCityArea.unit} />
            <KPI label="Built-up Area" value={siteGfaArea.value} unit={siteGfaArea.unit} />
            <KPI
              label="Private/Public"
              value={siteStats.privatePublicRatio ? siteStats.privatePublicRatio.toFixed(2) : '—'}
              unit="ratio"
            />
          </div>

          {selectedCount > 0 && (
            <>
              <div className="insights-section-title">Selection level</div>
              <div className="kpi-grid">
                <KPI label="Total GFA" value={selectedGfaArea.value} unit={selectedGfaArea.unit} />
                <KPI label="Avg FAR" value={selectedStats.far} unit="" />
                <KPI label="Residents" value={Math.round(selectedStats.residents)} unit="ppl" color="#2e7d32" />
                <KPI label="Jobs" value={Math.round(selectedStats.jobs)} unit="jobs" color="#1565c0" />
                <KPI label="Plot Area" value={selectedPlotArea.value} unit={selectedPlotArea.unit} />
                <KPI label="Road Area" value={selectedRoadArea.value} unit={selectedRoadArea.unit} />
                <KPI label="City Area" value={selectedCityArea.value} unit={selectedCityArea.unit} />
                <KPI label="Built-up Area" value={selectedGfaArea.value} unit={selectedGfaArea.unit} />
                <KPI
                  label="Private/Public"
                  value={selectedStats.privatePublicRatio ? selectedStats.privatePublicRatio.toFixed(2) : '—'}
                  unit="ratio"
                />
              </div>
            </>
          )}
          <div className="chart-card">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={selectedStats.landUse} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2}>
                  {selectedStats.landUse.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {selectedCount > 0 && selectedStats.selectedPlotDetails?.length > 0 && (
            <div className="plot-far-list">
              <div className="insights-section-title">Selected plots: FAR details</div>
              {selectedStats.selectedPlotDetails.map((plot) => {
                const plotArea = formatArea(plot.areaSqm);
                const gfa = formatArea(plot.buildingGfa);
                return (
                  <div key={plot.id} className="plot-far-item">
                    <div className="plot-far-head">Plot {plot.id}</div>
                    <div>Area: {plotArea.value} {plotArea.unit}</div>
                    <div>Building GFA: {gfa.value} {gfa.unit}</div>
                    <div>Buildings: {plot.buildingCount} ({plot.isEmptyPlot ? 'empty' : 'occupied'})</div>
                    <div>Plot FAR: {plot.far.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {analysisTab === 'ECO' && (
        <div className="stack">
          <KPI label="Annual Energy" value={(selectedStats.energy / 1000).toFixed(1)} unit="MWh/yr" color="#F5A623" />
          <KPI label="Daily Water" value={(selectedStats.water / 1000).toFixed(1)} unit="kL/day" color="#4A90E2" />
          <KPI label="Solid Waste" value={Math.round(selectedStats.waste)} unit="kg/day" color="#8B572A" />
          <div className="assumptions">
            Assumptions: Energy (Resi 150, Com 250), Water (135L/p), Waste (0.5kg/p)
          </div>
        </div>
      )}

      {analysisTab === 'INFRA' && (
        <div className="stack">
          <KPI label="Parking Demand" value={Math.round(selectedStats.parking)} unit="spots" color="#333" />
          <div className="chart-card chart-compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'Required', val: Math.round(selectedStats.parking) }]} layout="vertical">
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
