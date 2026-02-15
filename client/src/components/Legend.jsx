const modeLabel = (colorMode) => {
  if (colorMode === 'HEIGHT') return 'Height';
  if (colorMode === 'FAR') return 'Density';
  if (colorMode === 'ENERGY') return 'Energy';
  return 'Land Use';
};

const LANDUSE_META = {
  Residential: { label: 'Resi', swatchClass: 'swatch-resi' },
  Commercial: { label: 'Com', swatchClass: 'swatch-com' },
  Industrial: { label: 'Ind', swatchClass: 'swatch-ind' },
  Public: { label: 'Public', swatchClass: 'swatch-public' },
  'Mixed Use': { label: 'Mixed', swatchClass: 'swatch-mixed' }
};

export default function Legend({ colorMode, buildings }) {
  const activeLandUses = Array.from(
    new Set(
      (buildings || [])
        .filter((entity) => entity.type === 'Building')
        .map((entity) => entity.landUseExisting)
        .filter(Boolean)
    )
  );

  const landUseList = activeLandUses.length > 0 ? activeLandUses : ['Residential', 'Commercial'];

  return (
    <div className="legend">
      <strong>Legend: {modeLabel(colorMode)}</strong>
      <div className="legend-items">
        {colorMode === 'USE' && (
          <>
            {landUseList.map((landUse) => {
              const meta = LANDUSE_META[landUse] ?? { label: landUse, swatchClass: 'swatch-resi' };
              return (
                <div key={landUse} className="legend-row">
                  <span className={`legend-swatch ${meta.swatchClass}`} /> {meta.label}
                </div>
              );
            })}
          </>
        )}
        {colorMode === 'HEIGHT' && <div className="legend-gradient legend-gradient-height" />}
        {colorMode === 'FAR' && <div className="legend-gradient legend-gradient-far" />}
        {colorMode === 'ENERGY' && <div className="legend-gradient legend-gradient-energy" />}
      </div>
    </div>
  );
}
