import { useMemo, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { formatArea } from '../utils/area.js';
import { parseFloorSelectionId, useUrbanStore } from '../store/useUrbanStore';

const Field = ({ label, children }) => (
  <div className="field">
    <label>{label}</label>
    {children}
  </div>
);

const Section = ({ title, children }) => (
  <div className="section">
    <div className="section-title">{title}</div>
    {children}
  </div>
);

const coverageFromSetback = (setback) => {
  if (setback === 'Minimum') return 0.95;
  if (setback === 'Medium') return 0.85;
  if (setback === 'Large') return 0.75;
  return 1;
};

export default function PropertiesPanel() {
  const selectedIds = useUrbanStore((state) => state.selectedIds);
  const buildings = useUrbanStore((state) => state.buildings);
  const updateSelection = useUrbanStore((state) => state.updateSelection);
  const generateBuildingsForSelectedPlots = useUrbanStore((state) => state.generateBuildingsForSelectedPlots);
  const selectedFloorIds = useUrbanStore((state) => state.selectedFloorIds);

  const [newBuildingFloors, setNewBuildingFloors] = useState(2);
  const [newBuildingSetback, setNewBuildingSetback] = useState('Nil');

  const selectedBuildingIdsFromFloors = new Set(
    selectedFloorIds
      .map((id) => parseFloorSelectionId(id)?.buildingId)
      .filter(Boolean)
  );

  const selectedBuildings = buildings.filter(
    (building) =>
      building.type === 'Building' && (selectedIds.includes(building.id) || selectedBuildingIdsFromFloors.has(building.id))
  );
  const selectedPlots = buildings.filter((building) => building.type === 'Plot' && selectedIds.includes(building.id));

  const plotAreas = selectedPlots.map((plot) => plot.areaSqm ?? 0);
  const totalPlotArea = plotAreas.reduce((sum, value) => sum + value, 0);
  const totalPlotAreaFormatted = formatArea(totalPlotArea);
  const emptyPlotsCount = selectedPlots.filter((plot) => plot.isEmptyPlot).length;
  const plotSummaryLabel =
    selectedPlots.length === 1
      ? selectedPlots[0].isEmptyPlot
        ? 'Empty plot'
        : 'Occupied plot'
      : `${emptyPlotsCount} empty`;

  const getSharedValue = (key) => {
    if (selectedBuildings.length === 0) return '';
    const [first, ...rest] = selectedBuildings;
    const shared = rest.every((building) => building[key] === first[key]);
    return shared ? (first[key] ?? '') : '';
  };

  const sharedFloors = getSharedValue('floors');
  const sharedMacroLandUse = getSharedValue('macroLandUse');
  const sharedSetback = getSharedValue('setback');
  const sharedFloorWiseLandUse = getSharedValue('floorWiseLandUse');
  const sharedBuildingAge = getSharedValue('buildingAge');

  const emptySelectedPlots = useMemo(() => selectedPlots.filter((plot) => plot.isEmptyPlot), [selectedPlots]);

  const buildingFarDetails = useMemo(() => {
    const plotsById = new Map(buildings.filter((item) => item.type === 'Plot').map((plot) => [plot.id, plot]));
    return selectedBuildings.map((building) => {
      const plot = plotsById.get(building.plotId);
      const footprint = (building.areaSqm ?? 0) * coverageFromSetback(building.setback);
      const gfa = footprint * (building.floors ?? 0);
      const plotArea = plot?.areaSqm ?? 0;
      const far = plotArea > 0 ? gfa / plotArea : null;
      return {
        id: building.id,
        gfa,
        plotArea,
        far
      };
    });
  }, [buildings, selectedBuildings]);

  const allSelectedFromDxfBuildings =
    selectedBuildings.length > 0 && selectedBuildings.every((building) => building.layer === 'BUILDINGS');

  return (
    <div className="panel properties">
      <h3>
        <Settings2 size={18} /> Properties
      </h3>
      {selectedIds.length === 0 && selectedFloorIds.length === 0 ? (
        <div className="panel-empty">Select plots, roads, or buildings to edit</div>
      ) : (
        <div className="panel-content">
          {selectedPlots.length > 0 && (
            <Section title="Plot Summary">
              <Field label="Plots selected">
                <div className="input input-static">
                  {selectedPlots.length} plot(s) · {plotSummaryLabel}
                </div>
              </Field>
              <Field label="Total plot area">
                <div className="input input-static">
                  {totalPlotAreaFormatted.value} {totalPlotAreaFormatted.unit}
                </div>
              </Field>

              {emptySelectedPlots.length > 0 && (
                <>
                  <Field label="Generate building: Floors">
                    <input
                      type="number"
                      className="input"
                      min="1"
                      value={newBuildingFloors}
                      onChange={(event) => setNewBuildingFloors(Math.max(1, Number(event.target.value || 1)))}
                    />
                  </Field>
                  <Field label="Generate building: Setback">
                    <select className="input" value={newBuildingSetback} onChange={(event) => setNewBuildingSetback(event.target.value)}>
                      <option value="Nil">Nil</option>
                      <option value="Minimum">Minimum</option>
                      <option value="Medium">Medium</option>
                      <option value="Large">Large</option>
                    </select>
                  </Field>
                  <button
                    type="button"
                    className="input action-button"
                    onClick={() =>
                      generateBuildingsForSelectedPlots({
                        floors: Number(newBuildingFloors) || 1,
                        setback: newBuildingSetback
                      })
                    }
                  >
                    Generate building for {emptySelectedPlots.length} empty plot(s)
                  </button>
                </>
              )}
            </Section>
          )}
          {selectedBuildings.length === 0 ? (
            <div className="panel-empty">Plots or roads selected. Select buildings to edit building properties.</div>
          ) : (
            <>
              <div className="panel-highlight">{selectedBuildings.length} Building(s) Selected</div>
              <Section title="1. Macro Data">
                <Field label="Building Height (Floors)">
                  <input
                    type="number"
                    className="input"
                    placeholder="2"
                    value={sharedFloors}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      updateSelection('floors', nextValue === '' ? 0 : Number(nextValue));
                    }}
                  />
                </Field>
                <Field label="Land Use">
                  <select
                    className="input"
                    value={sharedMacroLandUse}
                    onChange={(event) => updateSelection('macroLandUse', event.target.value)}
                  >
                    <option value="" disabled>
                      Mixed selection
                    </option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Public">Public</option>
                  </select>
                </Field>
                <Field label="Setback">
                  <select
                    className="input"
                    value={sharedSetback}
                    disabled={allSelectedFromDxfBuildings}
                    onChange={(event) => updateSelection('setback', event.target.value)}
                  >
                    <option value="" disabled>
                      Mixed selection
                    </option>
                    <option value="Nil">Nil</option>
                    <option value="Minimum">Minimum</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                  </select>
                </Field>
                {allSelectedFromDxfBuildings && (
                  <div className="field-help">Setback is locked for imported BUILDINGS footprints.</div>
                )}
              </Section>

              <Section title="2. Micro Data">
                <Field label="Floor-wise Land Use">
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Example: G+1 Retail, 2-4 Residential"
                    value={sharedFloorWiseLandUse}
                    onChange={(event) => updateSelection('floorWiseLandUse', event.target.value)}
                  />
                </Field>
                <Field label="Age of Building (years)">
                  <input
                    type="number"
                    className="input"
                    min="0"
                    placeholder="15"
                    value={sharedBuildingAge}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      updateSelection('buildingAge', nextValue === '' ? '' : Number(nextValue));
                    }}
                  />
                </Field>
                <div className="field-help">Micro data fields are UI-only for now; analytics logic will be added later.</div>
              </Section>

              <Section title="3. FAR (Selected Buildings)">
                <div className="plot-far-list compact-list">
                  {buildingFarDetails.map((item) => {
                    const gfa = formatArea(item.gfa);
                    const plotArea = formatArea(item.plotArea);
                    return (
                      <div key={item.id} className="plot-far-item">
                        <div className="plot-far-head">Building {item.id}</div>
                        <div>GFA: {gfa.value} {gfa.unit}</div>
                        <div>Plot area: {plotArea.value} {plotArea.unit}</div>
                        <div>FAR: {item.far == null ? '—' : item.far.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
