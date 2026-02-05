import { useMemo } from 'react';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';
import { usePlanningStore } from '../store/usePlanningStore';
import { getLanduseColor } from '../lib/landuse';

const toStyle = (feature, selectedId, landuseView) => {
  if (feature.properties.type === 'road') {
    return {
      color: '#555',
      weight: 1,
      fillColor: '#bbbbbb',
      fillOpacity: 0.7
    };
  }

  const selected = feature.properties.id === selectedId;
  const landuse = feature.properties.attrs?.landuse ?? 'residential';

  return {
    color: '#222',
    weight: selected ? 4 : 1,
    fillColor: landuseView ? getLanduseColor(landuse) : '#99bbdd',
    fillOpacity: 0.75
  };
};

export default function PlanningMap() {
  const geojson = usePlanningStore((state) => state.geojson);
  const selectedPlotId = usePlanningStore((state) => state.selectedPlotId);
  const selectPlot = usePlanningStore((state) => state.selectPlot);
  const landuseView = usePlanningStore((state) => state.landuseView);

  const bounds = useMemo(() => {
    if (!geojson) return null;
    const points = geojson.features.flatMap((feature) => feature.geometry.coordinates[0]);
    const lats = points.map(([, lat]) => lat);
    const lngs = points.map(([lng]) => lng);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ];
  }, [geojson]);

  if (!geojson || !bounds) return <div className="loading">Loading map…</div>;

  return (
    <MapContainer className="map" bounds={bounds} scrollWheelZoom>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <GeoJSON
        key={`${selectedPlotId}-${landuseView}`}
        data={geojson}
        style={(feature) => toStyle(feature, selectedPlotId, landuseView)}
        onEachFeature={(feature, layer) => {
          layer.on('click', () => {
            if (feature.properties.type === 'plot') {
              selectPlot(feature.properties.id);
            }
          });
        }}
      />
    </MapContainer>
  );
}
