import { create } from 'zustand';

const FLOOR_SELECTION_PREFIX = 'floor::';

export const makeFloorSelectionId = (buildingId, floorIndex) =>
  `${FLOOR_SELECTION_PREFIX}${buildingId}::${floorIndex}`;

export const parseFloorSelectionId = (id) => {
  if (typeof id !== 'string' || !id.startsWith(FLOOR_SELECTION_PREFIX)) return null;
  const [, buildingId, floorIndexRaw] = id.split('::');
  const floorIndex = Number(floorIndexRaw);
  if (!buildingId || Number.isNaN(floorIndex)) return null;
  return { buildingId, floorIndex };
};

const PARKS_LAND_USE = 'Parks and Open Spaces';

const resolveMacroLandUse = (microUses, fallbackUse = 'Residential') => {
  const uniqueUses = Array.from(new Set((microUses || []).map((item) => item?.landUse).filter(Boolean)));
  if (uniqueUses.length > 1) return 'Mixed Use';
  if (uniqueUses.length === 1) return uniqueUses[0];
  return fallbackUse;
};

const normalizeBuildingEntity = (entity) => {
  if (!entity || entity.type !== 'Building') return entity;

  const microUses = Array.isArray(entity.microUses)
    ? entity.microUses
        .map((item) => ({ floor: Number(item?.floor), landUse: item?.landUse }))
        .filter((item) => Number.isFinite(item.floor) && item.floor > 0 && item.landUse)
    : [];

  const fallbackUse = entity.macroLandUse ?? entity.landUseExisting ?? 'Residential';
  const macroLandUse = resolveMacroLandUse(microUses, fallbackUse);
  const floorWiseLandUse = entity.floorWiseLandUse ?? '';
  const buildingAge = entity.buildingAge ?? '';

  if (macroLandUse === PARKS_LAND_USE) {
    return {
      ...entity,
      macroLandUse,
      microUses: [],
      floorWiseLandUse,
      buildingAge,
      floors: 0,
      height: 0,
      landUseExisting: macroLandUse
    };
  }

  return {
    ...entity,
    macroLandUse,
    microUses,
    floorWiseLandUse,
    buildingAge,
    landUseExisting: macroLandUse
  };
};

const normalizeBuildings = (buildings) => (Array.isArray(buildings) ? buildings.map(normalizeBuildingEntity) : []);

const getSetbackFactor = (setback) => {
  if (setback === 'Minimum') return 0.95;
  if (setback === 'Medium') return 0.85;
  if (setback === 'Large') return 0.75;
  return 1;
};

const scalePolygonFromCenter = (shape, factor) => {
  if (!Array.isArray(shape) || shape.length === 0) return [];
  const center = shape.reduce(
    (acc, point) => ({ x: acc.x + point[0], y: acc.y + point[1] }),
    { x: 0, y: 0 }
  );
  const cx = center.x / shape.length;
  const cy = center.y / shape.length;
  return shape.map(([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor]);
};

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

export const useUrbanStore = create((set) => ({
  buildings: [],
  selectedIds: [],
  selectedFloorIds: [],
  selectionMode: 'SINGLE',
  selectionFilter: 'AUTO',
  viewMode: 'ISO',
  analysisTab: 'DEMO',
  colorMode: 'BUILDING_USE',
  setBuildings: (buildings) => set({ buildings: normalizeBuildings(buildings) }),
  setSelectionMode: (selectionMode) => set({ selectionMode }),
  setSelectionFilter: (selectionFilter) => set({ selectionFilter }),
  setViewMode: (viewMode) => set({ viewMode }),
  setAnalysisTab: (analysisTab) => set({ analysisTab }),
  setColorMode: (colorMode) => set({ colorMode }),
  clearSelection: () => set({ selectedIds: [], selectedFloorIds: [] }),
  blockSelect: (ids) => set({ selectedIds: ids, selectedFloorIds: [] }),
  toggleSelection: (id, isMulti) =>
    set((state) => {
      if (!id) return { selectedIds: [], selectedFloorIds: [] };
      if (isMulti) {
        return {
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((item) => item !== id)
            : [...state.selectedIds, id],
          selectedFloorIds: []
        };
      }
      return { selectedIds: [id], selectedFloorIds: [] };
    }),
  toggleFloorSelection: (floorId, isMulti) =>
    set((state) => {
      if (!floorId) return { selectedFloorIds: [] };
      if (isMulti) {
        return {
          selectedFloorIds: state.selectedFloorIds.includes(floorId)
            ? state.selectedFloorIds.filter((item) => item !== floorId)
            : [...state.selectedFloorIds, floorId],
          selectedIds: []
        };
      }
      return { selectedFloorIds: [floorId], selectedIds: [] };
    }),
  updateSelectedFloorsLandUse: (landUse) =>
    set((state) => {
      if (!landUse) return state;

      const selectedFloorTargets = state.selectedFloorIds
        .map((id) => parseFloorSelectionId(id))
        .filter(Boolean)
        .reduce((acc, entry) => {
          if (!acc[entry.buildingId]) acc[entry.buildingId] = new Set();
          acc[entry.buildingId].add(entry.floorIndex);
          return acc;
        }, {});

      if (Object.keys(selectedFloorTargets).length === 0) return state;

      return {
        buildings: state.buildings.map((building) => {
          if (building.type !== 'Building') return building;
          const floorsSet = selectedFloorTargets[building.id];
          if (!floorsSet) return building;

          const nextMicroUses = Array.isArray(building.microUses) ? [...building.microUses] : [];

          floorsSet.forEach((floorIndex) => {
            const existingIndex = nextMicroUses.findIndex((item) => Number(item?.floor) === floorIndex);
            if (existingIndex >= 0) {
              nextMicroUses[existingIndex] = { ...nextMicroUses[existingIndex], floor: floorIndex, landUse };
            } else {
              nextMicroUses.push({ floor: floorIndex, landUse });
            }
          });

          const macroLandUse = resolveMacroLandUse(nextMicroUses, building.macroLandUse || building.landUseExisting || 'Residential');

          return {
            ...building,
            microUses: nextMicroUses,
            macroLandUse,
            landUseExisting: macroLandUse
          };
        })
      };
    }),
  updateSelectedPlotsLandUse: (landUse) =>
    set((state) => {
      if (!landUse) return state;
      const selectedPlotIds = new Set(
        state.buildings
          .filter((item) => item.type === 'Plot' && state.selectedIds.includes(item.id))
          .map((plot) => plot.id)
      );
      if (selectedPlotIds.size === 0) return state;

      return {
        buildings: state.buildings.map((item) => {
          if (item.type === 'Plot' && selectedPlotIds.has(item.id)) {
            return {
              ...item,
              landUseExisting: landUse
            };
          }

          if (item.type === 'Building' && selectedPlotIds.has(item.plotId)) {
            if (landUse === PARKS_LAND_USE) {
              return {
                ...item,
                macroLandUse: PARKS_LAND_USE,
                landUseExisting: PARKS_LAND_USE,
                floors: 0,
                height: 0,
                microUses: []
              };
            }
            return {
              ...item,
              macroLandUse: landUse,
              landUseExisting: landUse
            };
          }

          return item;
        })
      };
    }),
  updateSelection: (key, value) =>
    set((state) => {
      const selectedBuildingIdsFromFloors = new Set(
        state.selectedFloorIds
          .map((id) => parseFloorSelectionId(id)?.buildingId)
          .filter(Boolean)
      );

      return {
        buildings: state.buildings.map((building) => {
          const isSelectedEntity = state.selectedIds.includes(building.id) || selectedBuildingIdsFromFloors.has(building.id);
          if (!isSelectedEntity) return building;
          if (building.type !== 'Building') return { ...building, [key]: value };

          if (key === 'landUseExisting') {
            if (value === PARKS_LAND_USE) {
              return {
                ...building,
                landUseExisting: value,
                macroLandUse: value,
                floors: 0,
                height: 0,
                microUses: []
              };
            }
            return {
              ...building,
              landUseExisting: value,
              macroLandUse: value
            };
          }

          if (key === 'macroLandUse') {
            if (value === PARKS_LAND_USE) {
              return {
                ...building,
                macroLandUse: value,
                landUseExisting: value,
                floors: 0,
                height: 0,
                microUses: []
              };
            }
            return {
              ...building,
              macroLandUse: value,
              landUseExisting: value
            };
          }

          if (key === 'floors') {
            const nextFloors = Number(value) || 0;
            const floorHeight = Number(building.floorHeight) > 0 ? Number(building.floorHeight) : 3;
            return {
              ...building,
              floors: nextFloors,
              height: nextFloors * floorHeight
            };
          }

          if (key === 'height') {
            const nextHeight = Number(value) || 0;
            const floorHeight = Number(building.floorHeight) > 0 ? Number(building.floorHeight) : 3;
            return {
              ...building,
              height: nextHeight,
              floors: Math.max(0, Math.round(nextHeight / floorHeight))
            };
          }

          return { ...building, [key]: value };
        })
      };
    }),
  generateBuildingsForSelectedPlots: ({ floors = 2, setback = 'Nil' } = {}) =>
    set((state) => {
      const plots = state.buildings.filter((item) => item.type === 'Plot');
      const buildingsOnly = state.buildings.filter((item) => item.type === 'Building');
      const selectedEmptyPlots = plots.filter(
        (plot) => state.selectedIds.includes(plot.id) && (plot.isEmptyPlot || plot.buildingCount === 0)
      );
      if (selectedEmptyPlots.length === 0) return state;

      const newBuildings = selectedEmptyPlots.map((plot) => {
        const factor = getSetbackFactor(setback);
        const shape = scalePolygonFromCenter(plot.shape || [], factor);

        return normalizeBuildingEntity({
          id: createId(),
          type: 'Building',
          layer: 'GENERATED',
          shape,
          areaSqm: plot.areaSqm ?? 0,
          floors,
          floorHeight: 3,
          height: floors * 3,
          setback,
          landUseExisting: 'Residential',
          macroLandUse: 'Residential',
          microUses: [],
          floorWiseLandUse: '',
          buildingAge: '',
          plotId: plot.id
        });
      });

      const plotIdsWithNewBuildings = new Set(newBuildings.map((building) => building.plotId));
      const nextBuildings = state.buildings.map((item) => {
        if (item.type !== 'Plot' || !plotIdsWithNewBuildings.has(item.id)) return item;
        const existingCount = item.buildingCount ?? buildingsOnly.filter((building) => building.plotId === item.id).length;
        return {
          ...item,
          buildingCount: existingCount + 1,
          isEmptyPlot: false
        };
      });

      return {
        buildings: [...nextBuildings, ...newBuildings],
        selectedIds: Array.from(new Set([...state.selectedIds, ...newBuildings.map((item) => item.id)])),
        selectedFloorIds: []
      };
    })
}));
