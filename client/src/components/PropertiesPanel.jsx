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
  const updateSelection = useUrbanStore((state) => state.updateSelection);

  return (
    <div className="panel properties">
      <h3>
        <Settings2 size={18} /> Properties
      </h3>
      {selectedIds.length === 0 ? (
        <div className="panel-empty">Select plots to edit</div>
      ) : (
        <div className="panel-content">
          <div className="panel-highlight">{selectedIds.length} Plot(s) Selected</div>
          <Section title="1. Physical & Use">
            <Field label="Floors">
              <input
                type="number"
                className="input"
                placeholder="2"
                onChange={(event) => updateSelection('floors', Number(event.target.value))}
              />
            </Field>
            <Field label="Land Use">
              <select className="input" onChange={(event) => updateSelection('landUseExisting', event.target.value)}>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Public">Public</option>
              </select>
            </Field>
            <Field label="Setback">
              <select className="input" onChange={(event) => updateSelection('setback', event.target.value)}>
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
