import { usePlanningStore } from '../store/usePlanningStore';

export default function Toolbar() {
  const geojson = usePlanningStore((state) => state.geojson);
  const landuseView = usePlanningStore((state) => state.landuseView);
  const toggleLanduseView = usePlanningStore((state) => state.toggleLanduseView);

  const exportData = (type) => {
    if (!geojson) return;

    const payload =
      type === 'json'
        ? JSON.stringify(geojson, null, 2)
        : [
            ['PlotID', 'LandUse', 'Floors', 'Height', 'Area', 'Notes'],
            ...geojson.features
              .filter((feature) => feature.properties.type === 'plot')
              .map((feature) => {
                const attrs = feature.properties.attrs ?? {};
                return [
                  feature.properties.id,
                  attrs.landuse ?? '',
                  attrs.floors ?? 0,
                  attrs.height ?? 0,
                  feature.properties.area.toFixed(2),
                  attrs.notes ?? ''
                ];
              })
          ]
            .map((row) => row.join(','))
            .join('\n');

    const blob = new Blob([payload], { type: type === 'json' ? 'application/json' : 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `urban-design.${type}`;
    a.click();
  };

  return (
    <header className="toolbar card">
      <h1>Urban Design Tool</h1>
      <div className="toolbar-actions">
        <button onClick={toggleLanduseView}>{landuseView ? 'Flat colors' : 'Land-use colors'}</button>
        <button onClick={() => exportData('json')}>Export JSON</button>
        <button onClick={() => exportData('csv')}>Export CSV</button>
      </div>
    </header>
  );
}
