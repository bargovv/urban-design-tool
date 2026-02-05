import { create } from 'zustand';
import { area as turfArea } from '@turf/turf';

const getDefaultAttrs = () => ({
  landuse: 'residential',
  floors: 0,
  height: 0,
  notes: ''
});

const withDerivedArea = (feature) => {
  if (feature.properties.type !== 'plot' && feature.properties.type !== 'road') return feature;

  return {
    ...feature,
    properties: {
      ...feature.properties,
      area: turfArea(feature)
    }
  };
};

const normalizeFeature = (feature) => {
  const featureWithArea = withDerivedArea(feature);

  return {
    ...featureWithArea,
    properties: {
      ...featureWithArea.properties,
      attrs: {
        ...getDefaultAttrs(),
        ...(feature.properties.attrs ?? {})
      }
    }
  };
};

export const usePlanningStore = create((set) => ({
  geojson: null,
  selectedPlotId: null,
  landuseView: true,
  async loadData() {
    const response = await fetch('/api/plots');
    const data = await response.json();
    set({
      geojson: {
        ...data,
        features: data.features.map(normalizeFeature)
      }
    });
  },
  selectPlot(id) {
    set({ selectedPlotId: id });
  },
  updateSelectedPlot(attrsPatch) {
    set((state) => {
      if (!state.geojson || !state.selectedPlotId) return state;

      return {
        geojson: {
          ...state.geojson,
          features: state.geojson.features.map((feature) => {
            if (feature.properties.id !== state.selectedPlotId) return feature;

            return {
              ...feature,
              properties: {
                ...feature.properties,
                attrs: {
                  ...getDefaultAttrs(),
                  ...feature.properties.attrs,
                  ...attrsPatch
                }
              }
            };
          })
        }
      };
    });
  },
  toggleLanduseView() {
    set((state) => ({ landuseView: !state.landuseView }));
  }
}));
