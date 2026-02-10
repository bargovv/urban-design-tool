import { calculatePlanarArea } from './area.js';

export const getSetbackCoverage = (setback) => {
  if (setback === 'Minimum') return 0.95;
  if (setback === 'Medium') return 0.85;
  if (setback === 'Large') return 0.75;
  return 1.0;
};

export const calculateBuildingGfa = (building) => {
  const area = building.areaSqm ?? calculatePlanarArea(building.shape);
  const coverage = getSetbackCoverage(building.setback);
  const floors = Number(building.floors) || 0;
  return area * coverage * floors;
};

export const buildFarMaps = (entities) => {
  const plotAreaById = {};
  const buildingGfaByPlotId = {};
  const plotFarById = {};
  const buildingFarById = {};

  const plots = entities.filter((entity) => entity.type === 'Plot');
  const buildings = entities.filter((entity) => entity.type === 'Building');

  plots.forEach((plot) => {
    plotAreaById[plot.id] = plot.areaSqm ?? calculatePlanarArea(plot.shape);
  });

  buildings.forEach((building) => {
    const gfa = calculateBuildingGfa(building);
    const plotId = building.plotId;

    if (!plotId || !plotAreaById[plotId]) {
      buildingFarById[building.id] = null;
      return;
    }

    buildingGfaByPlotId[plotId] = (buildingGfaByPlotId[plotId] || 0) + gfa;
    buildingFarById[building.id] = gfa / plotAreaById[plotId];
  });

  Object.entries(plotAreaById).forEach(([plotId, area]) => {
    const plotGfa = buildingGfaByPlotId[plotId] || 0;
    plotFarById[plotId] = area > 0 ? plotGfa / area : 0;
  });

  return {
    plotAreaById,
    buildingGfaByPlotId,
    plotFarById,
    buildingFarById
  };
};
