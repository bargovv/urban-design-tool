import { useMemo } from 'react';
import { usePlanningStore } from '../store/usePlanningStore';

const LANDUSE_OPTIONS = ['residential', 'commercial', 'mixed', 'institutional', 'empty'];

export default function Sidebar() {
  const geojson = usePlanningStore((state) => state.geojson);
  const selectedPlotId = usePlanningStore((state) => state.selectedPlotId);
  const updateSelectedPlot = usePlanningStore((state) => state.updateSelectedPlot);

  const selectedPlot = useMemo(
    () => geojson?.features.find((feature) => feature.properties.id === selectedPlotId),
    [geojson, selectedPlotId]
  );

  const attrs = selectedPlot?.properties.attrs ?? {
    landuse: 'residential',
    floors: 0,
    height: 0,
    notes: ''
  };

  return (
    <aside className="sidebar card">
      <h2>Plot Info</h2>
      {!selectedPlot ? (
        <p>Click a plot to edit its attributes.</p>
      ) : (
        <>
          <p>
            <strong>ID:</strong> {selectedPlot.properties.id}
            <br />
            <strong>Area:</strong> {selectedPlot.properties.area.toFixed(2)} m²
          </p>
          <label>
            Land use
            <select value={attrs.landuse} onChange={(event) => updateSelectedPlot({ landuse: event.target.value })}>
              {LANDUSE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Floors
            <input
              type="number"
              min="0"
              value={attrs.floors}
              onChange={(event) => updateSelectedPlot({ floors: Number(event.target.value) })}
            />
          </label>
          <label>
            Height (m)
            <input
              type="number"
              min="0"
              value={attrs.height}
              onChange={(event) => updateSelectedPlot({ height: Number(event.target.value) })}
            />
          </label>
          <label>
            Notes
            <textarea value={attrs.notes} onChange={(event) => updateSelectedPlot({ notes: event.target.value })} />
          </label>
        </>
      )}
    </aside>
  );
}
