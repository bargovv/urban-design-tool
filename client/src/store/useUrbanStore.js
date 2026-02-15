import { create } from 'zustand';

const normalizeBuildingEntity = (entity) => {
  if (!entity || entity.type !== 'Building') return entity;

  const macroLandUse = entity.macroLandUse ?? entity.landUseExisting ?? 'Residential';
  const microUses = Array.isArray(entity.microUses) ? entity.microUses : [];
  const floorWiseLandUse = entity.floorWiseLandUse ?? '';
  const buildingAge = entity.buildingAge ?? '';

  return {
    ...entity,
    macroLandUse,
    microUses,
    floorWiseLandUse,
    buildingAge,
    landUseExisting: entity.landUseExisting ?? macroLandUse
  };
};

const normalizeBuildings = (buildings) => (Array.isArray(buildings) ? buildings.map(normalizeBuildingEntity) : []);

export const useUrbanStore = create((set) => ({
  buildings: [],
  selectedIds: [],
  selectionMode: 'SINGLE',
  selectionFilter: 'AUTO',
  viewMode: 'ISO',
  analysisTab: 'DEMO',
  colorMode: 'USE',
  setBuildings: (buildings) => set({ buildings: normalizeBuildings(buildings) }),
  setSelectionMode: (selectionMode) => set({ selectionMode }),
  setSelectionFilter: (selectionFilter) => set({ selectionFilter }),
  setViewMode: (viewMode) => set({ viewMode }),
  setAnalysisTab: (analysisTab) => set({ analysisTab }),
  setColorMode: (colorMode) => set({ colorMode }),
  clearSelection: () => set({ selectedIds: [] }),
  blockSelect: (ids) => set({ selectedIds: ids }),
  toggleSelection: (id, isMulti) =>
    set((state) => {
      if (!id) return { selectedIds: [] };
      if (isMulti) {
        return {
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((item) => item !== id)
            : [...state.selectedIds, id]
        };
      }
      return { selectedIds: [id] };
    }),
  updateSelection: (key, value) =>
    set((state) => ({
      buildings: state.buildings.map((building) => {
        if (!state.selectedIds.includes(building.id)) return building;
        if (building.type !== 'Building') return { ...building, [key]: value };

        if (key === 'landUseExisting') {
          return {
            ...building,
            landUseExisting: value,
            macroLandUse: value
          };
        }

        if (key === 'macroLandUse') {
          return {
            ...building,
            macroLandUse: value,
            landUseExisting: value
          };
        }

        return { ...building, [key]: value };
      })
    }))
}));
