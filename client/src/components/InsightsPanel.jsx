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

const DemoHierarchyGrid = ({ stats, cityArea, plotArea, roadArea, gfaArea }) => (
  <div className="kpi-grid kpi-grid-compact">
    <KPI label="City Area" value={cityArea.value} unit={cityArea.unit} />
    <KPI label="Total Plots" value={stats.selectedBreakdown?.plots ?? 0} unit="count" />
    <KPI label="Plot Area" value={plotArea.value} unit={plotArea.unit} />
    <KPI label="Total Buildings" value={stats.selectedBreakdown?.buildings ?? 0} unit="count" />
    <KPI label="Road Area" value={roadArea.value} unit={roadArea.unit} />
    <KPI label="Total GFA" value={gfaArea.value} unit={gfaArea.unit} />
    <KPI label="Avg FAR" value={stats.far} unit="" />
    <KPI label="Private/Public" value={stats.privatePublicRatio ? stats.privatePublicRatio.toFixed(2) : '—'} unit="ratio" />
    <KPI label="Residents" value={Math.round(stats.residents)} unit="ppl" color="#2e7d32" />
    <KPI label="Jobs" value={Math.round(stats.jobs)} unit="jobs" color="#1565c0" />
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
          <DemoHierarchyGrid stats={siteStats} cityArea={siteCityArea} plotArea={sitePlotArea} roadArea={siteRoadArea} gfaArea={siteGfaArea} />

          <div className="insights-section-title">Selection level</div>
          <DemoHierarchyGrid
            stats={selectedStats}
            cityArea={selectedCityArea}
            plotArea={selectedPlotArea}
            roadArea={selectedRoadArea}
            gfaArea={selectedGfaArea}
          />
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
