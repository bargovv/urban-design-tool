import { useMemo } from 'react';
import { usePlanningStore } from '../store/usePlanningStore';

export default function Dashboard() {
  const geojson = usePlanningStore((state) => state.geojson);

  const metrics = useMemo(() => {
    if (!geojson) return null;

    const plots = geojson.features.filter((feature) => feature.properties.type === 'plot');
    const roads = geojson.features.filter((feature) => feature.properties.type === 'road');

    const totalPlotArea = plots.reduce((sum, feature) => sum + feature.properties.area, 0);
    const totalRoadArea = roads.reduce((sum, feature) => sum + feature.properties.area, 0);
    const totalBUA = plots.reduce(
      (sum, feature) => sum + feature.properties.area * (feature.properties.attrs?.floors ?? 0),
      0
    );

    return {
      plots,
      totalPlotArea,
      totalRoadArea,
      totalBUA,
      far: totalPlotArea > 0 ? totalBUA / totalPlotArea : 0
    };
  }, [geojson]);

  if (!metrics) return null;

  return (
    <section className="dashboard card">
      <h2>Dashboard</h2>
      <p>
        Site area: <strong>{metrics.totalPlotArea.toFixed(2)} m²</strong>
      </p>
      <p>
        Road area: <strong>{metrics.totalRoadArea.toFixed(2)} m²</strong>
      </p>
      <p>
        Built-up area: <strong>{metrics.totalBUA.toFixed(2)} m²</strong>
      </p>
      <p>
        FAR: <strong>{metrics.far.toFixed(2)}</strong>
      </p>

      <h3>Plot Summary</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Use</th>
              <th>Floors</th>
              <th>Area</th>
            </tr>
          </thead>
          <tbody>
            {metrics.plots.map((plot) => (
              <tr key={plot.properties.id}>
                <td>{plot.properties.id}</td>
                <td>{plot.properties.attrs?.landuse ?? 'residential'}</td>
                <td>{plot.properties.attrs?.floors ?? 0}</td>
                <td>{plot.properties.area.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
