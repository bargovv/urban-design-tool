import { useMemo } from 'react';
import Viewer3D from './components/Viewer3D';
import Legend from './components/Legend';
import PropertiesPanel from './components/PropertiesPanel';
import InsightsPanel from './components/InsightsPanel';
import TopBar from './components/TopBar';
import { parseFloorSelectionId, useUrbanStore } from './store/useUrbanStore';
import { calculateStats } from './utils/metrics';

export default function App() {
  const buildings = useUrbanStore((state) => state.buildings);
  const selectedIds = useUrbanStore((state) => state.selectedIds);
  const selectedFloorIds = useUrbanStore((state) => state.selectedFloorIds);
  const selectionMode = useUrbanStore((state) => state.selectionMode);
  const selectionFilter = useUrbanStore((state) => state.selectionFilter);
  const viewMode = useUrbanStore((state) => state.viewMode);
  const analysisTab = useUrbanStore((state) => state.analysisTab);
  const colorMode = useUrbanStore((state) => state.colorMode);
  const filterBuildingLandUse = useUrbanStore((state) => state.filterBuildingLandUse);
  const filterFloorLandUse = useUrbanStore((state) => state.filterFloorLandUse);
  const toggleSelection = useUrbanStore((state) => state.toggleSelection);
  const toggleFloorSelection = useUrbanStore((state) => state.toggleFloorSelection);
  const clearSelection = useUrbanStore((state) => state.clearSelection);
  const blockSelect = useUrbanStore((state) => state.blockSelect);

  const effectiveSelectedIds = useMemo(() => {
    const buildingIdsFromFloorSelections = selectedFloorIds
      .map((id) => parseFloorSelectionId(id)?.buildingId)
      .filter(Boolean);
    return Array.from(new Set([...selectedIds, ...buildingIdsFromFloorSelections]));
  }, [selectedIds, selectedFloorIds]);

  const siteStats = useMemo(
    () =>
      calculateStats({
        buildings,
        selectedIds: []
      }),
    [buildings]
  );

  const selectionStats = useMemo(
    () =>
      calculateStats({
        buildings,
        selectedIds: effectiveSelectedIds
      }),
    [buildings, effectiveSelectedIds]
  );

  return (
    <div className="app-shell">
      <TopBar />
      <div className="app-body">
        <section className="viewer">
          <Viewer3D
            buildings={buildings}
            selectedIds={selectedIds}
            selectedFloorIds={selectedFloorIds}
            onToggleSelection={toggleSelection}
            onToggleFloorSelection={toggleFloorSelection}
            onClearSelection={clearSelection}
            viewMode={viewMode}
            selectionMode={selectionMode}
            selectionFilter={selectionFilter}
            onBlockSelect={blockSelect}
            colorMode={colorMode}
            filterBuildingLandUse={filterBuildingLandUse}
            filterFloorLandUse={filterFloorLandUse}
          />
          <Legend colorMode={colorMode} buildings={buildings} />
        </section>
        <aside className="sidebar">
          <PropertiesPanel />
          <InsightsPanel
            siteStats={siteStats}
            selectionStats={selectionStats}
            selectedCount={effectiveSelectedIds.length}
            analysisTab={analysisTab}
          />
        </aside>
      </div>
    </div>
  );
}
