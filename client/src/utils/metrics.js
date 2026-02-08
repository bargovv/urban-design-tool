const METRICS = {
  Residential: { pop: 35, energy: 150, water: 135, waste: 0.5, parking: 80 },
  Commercial: { job: 15, energy: 250, water: 40, waste: 0.1, parking: 50 },
  Industrial: { job: 50, energy: 350, water: 60, waste: 1.2, parking: 150 },
  Public: { job: 25, energy: 200, water: 30, waste: 0.2, parking: 100 }
};

const calculateArea = (points) => {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const j = (i + 1) % points.length;
    area += points[i][0] * points[j][1];
    area -= points[j][0] * points[i][1];
  }
  return Math.abs(area / 2);
};

export const calculateStats = ({ buildings, selectedIds }) => {
  const plotAreas = buildings.filter((building) => building.type === 'Plot');
  const roadAreas = buildings.filter((building) => building.type === 'Road');
  const builtAreas = buildings.filter((building) => building.type === 'Building');
  const subset =
    selectedIds.length > 0
      ? builtAreas.filter((building) => selectedIds.includes(building.id))
      : builtAreas;
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
    privatePublicRatio: 0
  };
  const typeMap = {};
  let totalPlotArea = 0;
  let totalRoadArea = 0;

  plotAreas.forEach((plot) => {
    totalPlotArea += calculateArea(plot.shape);
  });

  roadAreas.forEach((road) => {
    totalRoadArea += calculateArea(road.shape);
  });

  subset.forEach((building) => {
    const area = calculateArea(building.shape);

    let coverage = 1.0;
    if (building.setback === 'Minimum') coverage = 0.95;
    else if (building.setback === 'Medium') coverage = 0.85;
    else if (building.setback === 'Large') coverage = 0.75;

    const footprint = area * coverage;
    const gfa = footprint * building.floors;
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

  data.far = totalPlotArea > 0 ? (data.gfa / totalPlotArea).toFixed(2) : 0;
  data.plotArea = totalPlotArea;
  data.roadArea = totalRoadArea;
  data.privatePublicRatio = totalRoadArea > 0 ? totalPlotArea / totalRoadArea : 0;
  data.landUse = Object.keys(typeMap).map((key, index) => ({
    name: key,
    value: Math.round(typeMap[key]),
    color: ['#F8E71C', '#4A90E2', '#BD10E0', '#D0021B', '#7ED321', '#333'][index] || '#999'
  }));

  return { ...data, count: subset.length, isSubset: selectedIds.length > 0 };
};
