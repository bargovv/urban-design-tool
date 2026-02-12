import { Settings2 } from 'lucide-react';
import { formatArea } from '../utils/area.js';
import { useUrbanStore } from '../store/useUrbanStore';

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

export default function PropertiesPanel() {
  const selectedIds = useUrbanStore((state) => state.selectedIds);
  const buildings = useUrbanStore((state) => state.buildings);
  const updateSelection = useUrbanStore((state) => state.updateSelection);
  const selectedBuildings = buildings.filter(
    (building) => building.type === 'Building' && selectedIds.includes(building.id)
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
    return shared ? first[key] : '';
  };

  const sharedFloors = getSharedValue('floors');
  const sharedLandUse = getSharedValue('landUseExisting');
  const sharedSetback = getSharedValue('setback');

  const allSelectedFromDxfBuildings =
    selectedBuildings.length > 0 && selectedBuildings.every((building) => building.layer === 'BUILDINGS');

  return (
    <div className="panel properties">
      <h3>
        <Settings2 size={18} /> Properties
      </h3>
      {selectedIds.length === 0 ? (
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
                <div className="input input-static">{totalPlotAreaFormatted.value} {totalPlotAreaFormatted.unit}</div>
              </Field>
            </Section>
          )}
          {selectedBuildings.length === 0 ? (
            <div className="panel-empty">Plots or roads selected. Select buildings to edit building properties.</div>
          ) : (
            <>
              <div className="panel-highlight">{selectedBuildings.length} Building(s) Selected</div>
              <Section title="1. Physical & Use">
                <Field label="Floors">
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
                    value={sharedLandUse}
                    onChange={(event) => updateSelection('landUseExisting', event.target.value)}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
