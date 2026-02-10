import { calculatePlanarArea } from './area.js';
import { calculateBuildingGfa } from './far.js';

const METRICS = {
  Residential: { pop: 35, energy: 150, water: 135, waste: 0.5, parking: 80 },
  Commercial: { job: 15, energy: 250, water: 40, waste: 0.1, parking: 50 },
  Industrial: { job: 50, energy: 350, water: 60, waste: 1.2, parking: 150 },
  Public: { job: 25, energy: 200, water: 30, waste: 0.2, parking: 100 }
};


export const calculateStats = ({ buildings, selectedIds }) => {
  const selectedSet = new Set(selectedIds);
  const selectedMode = selectedIds.length > 0;

  const plotAreas = selectedMode
    ? buildings.filter((building) => building.type === 'Plot' && selectedSet.has(building.id))
    : buildings.filter((building) => building.type === 'Plot');
  const roadAreas = selectedMode
    ? buildings.filter((building) => building.type === 'Road' && selectedSet.has(building.id))
    : buildings.filter((building) => building.type === 'Road');
  const builtAreas = selectedMode
    ? buildings.filter((building) => building.type === 'Building' && selectedSet.has(building.id))
    : buildings.filter((building) => building.type === 'Building');

  const subset = builtAreas;
  const allBuildings = buildings.filter((building) => building.type === 'Building');
  const data = {
    gfa: 0,
    far: 0,
    residents: 0,
    jobs: 0,
    landUse: [],
    energy: 0,
    water: 0,
    parking: 0,
    waste: 0,
    plotArea: 0,
    roadArea: 0,
    privatePublicRatio: 0,
    plotTotals: {
      total: 0,
      occupied: 0,
      empty: 0
    }
  };
  const typeMap = {};
  let totalPlotArea = 0;
  let totalRoadArea = 0;

  const selectedBreakdown = {
    plots: plotAreas.length,
    roads: roadAreas.length,
    buildings: builtAreas.length
  };

  plotAreas.forEach((plot) => {
    totalPlotArea += plot.areaSqm ?? calculatePlanarArea(plot.shape);
  });

  roadAreas.forEach((road) => {
    totalRoadArea += road.areaSqm ?? calculatePlanarArea(road.shape);
  });

  subset.forEach((building) => {
    const gfa = calculateBuildingGfa(building);
    data.gfa += gfa;

    const useKey = building.landUseExisting || 'Residential';
    const metrics = METRICS[useKey] || METRICS.Residential;
    typeMap[useKey] = (typeMap[useKey] || 0) + gfa;

    const residents = useKey === 'Residential' ? gfa / metrics.pop : 0;
    const jobs = useKey !== 'Residential' ? gfa / metrics.job : 0;
    data.residents += residents;
    data.jobs += jobs;
    data.energy += gfa * metrics.energy;
    data.water += residents * metrics.water + jobs * metrics.water;
    data.waste += residents * metrics.waste + jobs * metrics.waste;
    data.parking += gfa / metrics.parking;
  });

  const selectedPlotDetails = selectedMode
    ? plotAreas.map((plot) => {
        const plotArea = plot.areaSqm ?? calculatePlanarArea(plot.shape);
        const relatedBuildings = allBuildings.filter((building) => building.plotId === plot.id);
        const buildingGfa = relatedBuildings.reduce((sum, building) => sum + calculateBuildingGfa(building), 0);
        return {
          id: plot.id,
          areaSqm: plotArea,
          buildingCount: plot.buildingCount ?? relatedBuildings.length,
          buildingGfa,
          far: plotArea > 0 ? buildingGfa / plotArea : 0,
          isEmptyPlot: (plot.buildingCount ?? relatedBuildings.length) === 0
        };
      })
    : [];

  const allPlots = buildings.filter((building) => building.type === 'Plot');
  const occupiedPlots = allPlots.filter((plot) => (plot.buildingCount ?? 0) > 0);

  data.far = totalPlotArea > 0 ? (data.gfa / totalPlotArea).toFixed(2) : 0;
  data.plotArea = totalPlotArea;
  data.roadArea = totalRoadArea;
  data.privatePublicRatio = totalRoadArea > 0 ? totalPlotArea / totalRoadArea : 0;
  data.landUse = Object.keys(typeMap).map((key, index) => ({
    name: key,
    value: Math.round(typeMap[key]),
    color: ['#F8E71C', '#4A90E2', '#BD10E0', '#D0021B', '#7ED321', '#333'][index] || '#999'
  }));
  data.plotTotals = {
    total: allPlots.length,
    occupied: occupiedPlots.length,
    empty: allPlots.length - occupiedPlots.length
  };

  return {
    ...data,
    count: selectedMode ? selectedIds.length : buildings.length,
    isSubset: selectedMode,
    selectedBreakdown,
    selectedPlotDetails
  };
};
