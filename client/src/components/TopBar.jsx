import { useRef } from 'react';
import { FileJson, MousePointer2, Save, Upload, Wand2 } from 'lucide-react';
import { useUrbanStore } from '../store/useUrbanStore';
import { parseDxfData } from '../utils/dxfProcessor';

export default function TopBar() {
  const fileInputRef = useRef(null);
  const projectInputRef = useRef(null);
  const setBuildings = useUrbanStore((state) => state.setBuildings);
  const selectionMode = useUrbanStore((state) => state.selectionMode);
  const selectionFilter = useUrbanStore((state) => state.selectionFilter);
  const viewMode = useUrbanStore((state) => state.viewMode);
  const colorMode = useUrbanStore((state) => state.colorMode);
  const setSelectionMode = useUrbanStore((state) => state.setSelectionMode);
  const setSelectionFilter = useUrbanStore((state) => state.setSelectionFilter);
  const setViewMode = useUrbanStore((state) => state.setViewMode);
  const setColorMode = useUrbanStore((state) => state.setColorMode);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setBuildings(parseDxfData(evt.target.result));
    };
    reader.readAsText(file);
  };

  const handleSaveProject = () => {
    const buildings = useUrbanStore.getState().buildings;
    if (buildings.length === 0) {
      alert('Nothing to save!');
      return;
    }
    const dataStr = JSON.stringify(buildings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `urban_diorama_project_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  const handleLoadProject = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        setBuildings(json);
        alert('Project loaded successfully!');
      } catch (error) {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="topbar">
      <div className="topbar-title">
        Urban Diorama <span>V2.3</span>
      </div>
      <div className="topbar-actions">
        <div className="topbar-group">
          <label className="topbar-button">
            <Upload size={14} /> Import DXF
            <input ref={fileInputRef} type="file" accept=".dxf" onChange={handleFileUpload} />
          </label>
          <label className="topbar-button">
            <FileJson size={14} /> Load Project
            <input ref={projectInputRef} type="file" accept=".json" onChange={handleLoadProject} />
          </label>
          <button type="button" className="topbar-button" onClick={handleSaveProject}>
            <Save size={14} /> Save
          </button>
        </div>
        <div className="topbar-divider" />
        <select className="topbar-select" value={colorMode} onChange={(event) => setColorMode(event.target.value)}>
          <option value="USE">View: Land Use</option>
          <option value="HEIGHT">View: Height</option>
          <option value="FAR">View: Density</option>
          <option value="ENERGY">View: Energy</option>
        </select>
        <select
          className="topbar-select"
          value={selectionFilter}
          onChange={(event) => setSelectionFilter(event.target.value)}
        >
          <option value="AUTO">Select: Auto</option>
          <option value="BUILDINGS">Select: Buildings</option>
          <option value="PLOTS">Select: Plots</option>
          <option value="ROADS">Select: Roads</option>
          <option value="FLOORS">Select: Floors</option>
        </select>
        <button
          type="button"
          className={selectionMode === 'SINGLE' ? 'topbar-icon active' : 'topbar-icon'}
          onClick={() => setSelectionMode('SINGLE')}
        >
          <MousePointer2 size={14} />
        </button>
        <button
          type="button"
          className={selectionMode === 'BLOCK' ? 'topbar-icon active' : 'topbar-icon'}
          onClick={() => setSelectionMode('BLOCK')}
        >
          <Wand2 size={14} />
        </button>
        <button type="button" className="topbar-icon" onClick={() => setViewMode(viewMode === 'ISO' ? 'PLAN' : 'ISO')}>
          {viewMode}
        </button>
      </div>
    </header>
  );
}
