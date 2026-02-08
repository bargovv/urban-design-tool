const modeLabel = (colorMode) => {
  if (colorMode === 'HEIGHT') return 'Height';
  if (colorMode === 'FAR') return 'Density';
  if (colorMode === 'ENERGY') return 'Energy';
  return 'Land Use';
};

export default function Legend({ colorMode }) {
  return (
    <div className="legend">
      <strong>Legend: {modeLabel(colorMode)}</strong>
      <div className="legend-items">
        {colorMode === 'USE' && (
          <>
            <div className="legend-row">
              <span className="legend-swatch swatch-resi" /> Resi
            </div>
            <div className="legend-row">
              <span className="legend-swatch swatch-com" /> Com
            </div>
          </>
        )}
        {colorMode === 'HEIGHT' && <div className="legend-gradient legend-gradient-height" />}
        {colorMode === 'FAR' && <div className="legend-gradient legend-gradient-far" />}
        {colorMode === 'ENERGY' && <div className="legend-gradient legend-gradient-energy" />}
      </div>
    </div>
  );
}
