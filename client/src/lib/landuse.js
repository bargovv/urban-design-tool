export const LANDUSE_COLORS = {
  residential: '#66aaff',
  commercial: '#ff9933',
  mixed: '#aa66dd',
  institutional: '#66dd99',
  empty: '#cccccc'
};

export const getLanduseColor = (landuse) => LANDUSE_COLORS[landuse] ?? LANDUSE_COLORS.residential;
