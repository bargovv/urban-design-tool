export const calculatePlanarArea = (points) => {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const j = (i + 1) % points.length;
    area += points[i][0] * points[j][1];
    area -= points[j][0] * points[i][1];
  }
  return Math.abs(area / 2);
};

const areaFromPolygonCoords = (coords) => {
  if (!Array.isArray(coords) || coords.length === 0) return 0;
  return calculatePlanarArea(coords[0]);
};

export const calculateFeaturePlanarArea = (feature) => {
  const geometry = feature?.geometry;
  if (!geometry) return 0;
  if (geometry.type === 'Polygon') return areaFromPolygonCoords(geometry.coordinates);
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.reduce((sum, polygonCoords) => sum + areaFromPolygonCoords(polygonCoords), 0);
  }
  return 0;
};

export const formatArea = (areaSqm) => {
  if (!Number.isFinite(areaSqm)) return { value: '0.00', unit: 'm²' };
  if (areaSqm >= 1_000_000) {
    return { value: (areaSqm / 1_000_000).toFixed(3), unit: 'km²' };
  }
  return { value: areaSqm.toFixed(2), unit: 'm²' };
};
