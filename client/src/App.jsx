import { useMemo } from 'react';
import Viewer3D from './components/Viewer3D';
import Legend from './components/Legend';
import InsightsPanel from './components/InsightsPanel';
import PropertiesPanel from './components/PropertiesPanel';
import TopBar from './components/TopBar';
import { useUrbanStore } from './store/useUrbanStore';
import { calculateStats } from './utils/metrics';

export default function App() {
  const buildings = useUrbanStore((state) => state.buildings);
  const selectedIds = useUrbanStore((state) => state.selectedIds);
  const selectionMode = useUrbanStore((state) => state.selectionMode);
  const selectionFilter = useUrbanStore((state) => state.selectionFilter);
  const viewMode = useUrbanStore((state) => state.viewMode);
  const analysisTab = useUrbanStore((state) => state.analysisTab);
  const colorMode = useUrbanStore((state) => state.colorMode);
  const toggleSelection = useUrbanStore((state) => state.toggleSelection);
  const clearSelection = useUrbanStore((state) => state.clearSelection);
  const blockSelect = useUrbanStore((state) => state.blockSelect);

  const stats = useMemo(
    () =>
      calculateStats({
        buildings,
        selectedIds
      }),
    [buildings, selectedIds]
  );

  return (
    <div className="app-shell">
      <TopBar />
      <div className="app-body">
        <section className="viewer">
          <Viewer3D
            buildings={buildings}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onClearSelection={clearSelection}
            viewMode={viewMode}
            selectionMode={selectionMode}
            selectionFilter={selectionFilter}
            onBlockSelect={blockSelect}
            colorMode={colorMode}
          />
          <Legend colorMode={colorMode} />
        </section>
        <aside className="sidebar">
          <PropertiesPanel />
          <InsightsPanel stats={stats} analysisTab={analysisTab} />
        </aside>
      </div>
    </div>
  );
}
