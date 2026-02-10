import { create } from 'zustand';
import { calculatePlanarArea } from '../utils/area.js';

export const useUrbanStore = create((set) => ({
  buildings: [],
  selectedIds: [],
  selectionMode: 'SINGLE',
  selectionFilter: 'AUTO',
  viewMode: 'ISO',
  analysisTab: 'DEMO',
  colorMode: 'USE',
  setBuildings: (buildings) => set({ buildings }),
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
      buildings: state.buildings.map((building) =>
        state.selectedIds.includes(building.id) ? { ...building, [key]: value } : building
      )
    })),
  generateBuildingsFromSelectedEmptyPlots: () =>
    set((state) => {
      const selectedPlotIds = new Set(
        state.buildings
          .filter((entity) => entity.type === 'Plot' && entity.isEmptyPlot && state.selectedIds.includes(entity.id))
          .map((plot) => plot.id)
      );

      if (selectedPlotIds.size === 0) return state;

      const generatedBuildings = state.buildings
        .filter((entity) => entity.type === 'Plot' && selectedPlotIds.has(entity.id))
        .map((plot, index) => {
          const factorMap = { Nil: 1.0, Minimum: 0.95, Medium: 0.85, Large: 0.75 };
          const factor = factorMap[plot.setback] ?? 1.0;
          const cx = plot.shape.reduce((sum, [x]) => sum + x, 0) / plot.shape.length;
          const cy = plot.shape.reduce((sum, [, y]) => sum + y, 0) / plot.shape.length;
          const shape = plot.shape.map(([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor]);
          const areaSqm = calculatePlanarArea(shape);

          return {
            id: `gen-${plot.id}-${Date.now()}-${index}`,
            originalShape: shape.map(([x, y]) => ({ x, y })),
            shape,
            layer: 'GENERATED',
            type: 'Building',
            plotId: plot.id,
            floors: 2,
            floorHeight: 3,
            height: 6,
            setback: plot.setback ?? 'Nil',
            landUseCDP: plot.landUseCDP ?? 'Residential',
            subLandUseCDP: '',
            landUseExisting: plot.landUseExisting ?? 'Residential',
            subLandUseExisting: '',
            subTypology1: '',
            subTypology2: '',
            groundFloorUse: 'Parking',
            hasBasement: 'No',
            basementType: '',
            occupancy: 'Own Residence',
            areaSqm
          };
        });

      const updatedBuildings = state.buildings.map((entity) => {
        if (entity.type !== 'Plot' || !selectedPlotIds.has(entity.id)) return entity;
        return {
          ...entity,
          buildingCount: (entity.buildingCount ?? 0) + 1,
          isEmptyPlot: false
        };
      });

      return {
        buildings: [...updatedBuildings, ...generatedBuildings]
      };
    })
}));
