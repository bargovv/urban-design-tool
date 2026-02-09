import DxfParser from 'dxf-parser';
import { area, intersect, polygon } from '@turf/turf';
import { v4 as uuidv4 } from 'uuid';

const parser = new DxfParser();
const SCALE_FACTOR = 0.001;

export const parseDxfData = (dxfString) => {
  try {
    const dxf = parser.parseSync(dxfString);
    const entities = [];
    let allPoints = [];

    dxf.entities.forEach((entity) => {
      if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
        const layerName = (entity.layer || 'Unknown').toUpperCase().trim();
        const supportedLayers = new Set(['ROAD', 'PLOTS', 'BUILDINGS', 'VEGETATION']);
        if (!supportedLayers.has(layerName)) return;

        const shapePoints = entity.vertices.map((vertex) => ({
          x: vertex.x * SCALE_FACTOR,
          y: vertex.y * SCALE_FACTOR
        }));
        allPoints = allPoints.concat(shapePoints);
        const isRoad = layerName === 'ROAD';
        const isPlot = layerName === 'PLOTS';
        const isBuilding = layerName === 'BUILDINGS';
        const isVegetation = layerName === 'VEGETATION';
        const type = isRoad ? 'Road' : isPlot ? 'Plot' : isBuilding ? 'Building' : 'Vegetation';
        const defaultLandUse = isRoad ? 'Road' : isVegetation ? 'Vegetation' : 'Residential';

        entities.push({
          id: uuidv4(),
          originalShape: shapePoints,
          layer: layerName,
          type,
          floors: isRoad || isPlot || isVegetation ? 0 : 2,
          floorHeight: 3.0,
          height: isRoad ? 0.1 : isVegetation ? 0.2 : 6,
          setback: 'Nil',
          landUseCDP: defaultLandUse,
          subLandUseCDP: '',
          landUseExisting: defaultLandUse,
          subLandUseExisting: '',
          subTypology1: '',
          subTypology2: '',
          groundFloorUse: 'Parking',
          hasBasement: 'No',
          basementType: '',
          occupancy: 'Own Residence'
        });
      }
    });

    if (entities.length === 0) return [];

    const minX = Math.min(...allPoints.map((point) => point.x));
    const maxX = Math.max(...allPoints.map((point) => point.x));
    const minY = Math.min(...allPoints.map((point) => point.y));
    const maxY = Math.max(...allPoints.map((point) => point.y));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const centeredEntities = entities.map((building) => ({
      ...building,
      shape: building.originalShape.map((point) => [point.x - centerX, point.y - centerY])
    }));

    const plots = centeredEntities.filter((entity) => entity.type === 'Plot');
    if (plots.length === 0) {
      return centeredEntities;
    }
    const plotPolygons = plots.map((plot) => {
      const ring = plot.shape.length ? [...plot.shape, plot.shape[0]] : [];
      if (ring.length < 4) return { plot, polygon: null };
      return { plot, polygon: polygon([ring]) };
    });

    const withPlotAssignments = centeredEntities.map((entity) => {
      if (entity.type !== 'Building') return entity;
      const buildingRing = entity.shape.length ? [...entity.shape, entity.shape[0]] : [];
      if (buildingRing.length < 4) return { ...entity, plotId: null };
      let buildingPolygon;
      try {
        buildingPolygon = polygon([buildingRing]);
      } catch (error) {
        return { ...entity, plotId: null };
      }
      let bestPlotId = null;
      let bestArea = 0;
      plotPolygons.forEach(({ plot, polygon: plotPolygon }) => {
        if (!plotPolygon) return;
        let overlap = null;
        try {
          overlap = intersect(plotPolygon, buildingPolygon);
        } catch (error) {
          overlap = null;
        }
        if (!overlap) return;
        const overlapArea = area(overlap);
        if (overlapArea > bestArea) {
          bestArea = overlapArea;
          bestPlotId = plot.id;
        }
      });
      return { ...entity, plotId: bestPlotId };
    });

    const plotBuildingCounts = withPlotAssignments.reduce((acc, entity) => {
      if (entity.type !== 'Building' || !entity.plotId) return acc;
      acc[entity.plotId] = (acc[entity.plotId] || 0) + 1;
      return acc;
    }, {});

    return withPlotAssignments.map((entity) => {
      if (entity.type !== 'Plot') return entity;
      const buildingCount = plotBuildingCounts[entity.id] || 0;
      return {
        ...entity,
        buildingCount,
        isEmptyPlot: buildingCount === 0
      };
    });
  } catch (error) {
    console.error('DXF Parsing Error:', error);
    return [];
  }
};
