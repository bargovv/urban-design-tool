import { create } from 'zustand';

export const useUrbanStore = create((set) => ({
  buildings: [],
  selectedIds: [],
  selectionMode: 'SINGLE',
  viewMode: 'ISO',
  analysisTab: 'DEMO',
  colorMode: 'USE',
  setBuildings: (buildings) => set({ buildings }),
  setSelectionMode: (selectionMode) => set({ selectionMode }),
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
      buildings: state.buildings.map((building) =>
        state.selectedIds.includes(building.id) ? { ...building, [key]: value } : building
      )
    }))
}));
