import { Settings2 } from 'lucide-react';
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

  const getSharedValue = (key) => {
    if (selectedBuildings.length === 0) return '';
    const [first, ...rest] = selectedBuildings;
    const shared = rest.every((building) => building[key] === first[key]);
    return shared ? first[key] : '';
  };

  const sharedFloors = getSharedValue('floors');
  const sharedLandUse = getSharedValue('landUseExisting');
  const sharedSetback = getSharedValue('setback');

  return (
    <div className="panel properties">
      <h3>
        <Settings2 size={18} /> Properties
      </h3>
      {selectedIds.length === 0 ? (
        <div className="panel-empty">Select plots or buildings to edit</div>
      ) : selectedBuildings.length === 0 ? (
        <div className="panel-empty">Plots selected. Select buildings to edit building properties.</div>
      ) : (
        <div className="panel-content">
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
          </Section>
        </div>
      )}
    </div>
  );
}
