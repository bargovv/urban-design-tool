import { SlidersHorizontal } from 'lucide-react';
import { useMemo } from 'react';
import { useUrbanStore } from '../store/useUrbanStore';

const LAND_USE_OPTIONS = [
  'ALL',
  'Residential',
  'Commercial',
  'Industrial',
  'Public',
  'Mixed Use',
  'Parks and Open Spaces'
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const RangeControl = ({ label, metricKey, bounds, value, onChange }) => {
  const [selectedMin, selectedMax] = value;
  const minValue = clamp(selectedMin ?? bounds.min, bounds.min, bounds.max);
  const maxValue = clamp(selectedMax ?? bounds.max, minValue, bounds.max);

  return (
    <div className="filter-range-card">
      <div className="filter-range-header">
        <span>{label}</span>
        <span>
          {minValue.toFixed(1)} - {maxValue.toFixed(1)}
        </span>
      </div>
      <div className="filter-range-track">
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={bounds.step}
          value={minValue}
          onChange={(event) => {
            const nextMin = clamp(Number(event.target.value), bounds.min, maxValue);
            onChange(metricKey, [nextMin, maxValue]);
          }}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={bounds.step}
          value={maxValue}
          onChange={(event) => {
            const nextMax = clamp(Number(event.target.value), minValue, bounds.max);
            onChange(metricKey, [minValue, nextMax]);
          }}
        />
      </div>
    </div>
  );
};

export default function FiltersSidebar() {
  const buildings = useUrbanStore((state) => state.buildings);
  const filterBuildingLandUse = useUrbanStore((state) => state.filterBuildingLandUse);
  const filterFloorLandUse = useUrbanStore((state) => state.filterFloorLandUse);
  const numericFilters = useUrbanStore((state) => state.numericFilters);
  const setFilterBuildingLandUse = useUrbanStore((state) => state.setFilterBuildingLandUse);
  const setFilterFloorLandUse = useUrbanStore((state) => state.setFilterFloorLandUse);
  const setNumericFilterRange = useUrbanStore((state) => state.setNumericFilterRange);
  const resetFilters = useUrbanStore((state) => state.resetFilters);

  const metricBounds = useMemo(() => {
    const onlyBuildings = buildings.filter((item) => item.type === 'Building');

    const heights = onlyBuildings.map((building) => Number(building.height) || 0);
    const ages = onlyBuildings.map((building) => Number(building.buildingAge) || 0);
    const density = onlyBuildings.map((building) => {
      let coverage = 1;
      if (building.setback === 'Minimum') coverage = 0.95;
      else if (building.setback === 'Medium') coverage = 0.85;
      else if (building.setback === 'Large') coverage = 0.75;
      return (Number(building.floors) || 0) * coverage;
    });
    const energy = onlyBuildings.map((building) => {
      if (building.landUseExisting === 'Commercial') return 250;
      if (building.landUseExisting === 'Industrial') return 350;
      if (building.landUseExisting === 'Public') return 200;
      if (building.landUseExisting === 'Parks and Open Spaces') return 20;
      return 150;
    });

    const getBounds = (arr, fallbackMax = 10) => {
      if (!arr.length) return { min: 0, max: fallbackMax };
      return {
        min: Math.min(...arr),
        max: Math.max(...arr)
      };
    };

    return {
      height: { ...getBounds(heights, 30), step: 0.5 },
      density: { ...getBounds(density, 4), step: 0.1 },
      energy: { ...getBounds(energy, 400), step: 1 },
      age: { ...getBounds(ages, 80), step: 1 }
    };
  }, [buildings]);

  return (
    <aside className="filters-sidebar">
      <h3>
        <SlidersHorizontal size={18} /> Filters
      </h3>

      <div className="field">
        <label>Land Use (Building wise)</label>
        <select className="input" value={filterBuildingLandUse} onChange={(event) => setFilterBuildingLandUse(event.target.value)}>
          {LAND_USE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All' : option}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Land Use (Floor wise)</label>
        <select className="input" value={filterFloorLandUse} onChange={(event) => setFilterFloorLandUse(event.target.value)}>
          {LAND_USE_OPTIONS.filter((option) => option !== 'Mixed Use').map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All' : option}
            </option>
          ))}
        </select>
      </div>

      <RangeControl
        label="Building Height"
        metricKey="height"
        bounds={metricBounds.height}
        value={numericFilters.height}
        onChange={setNumericFilterRange}
      />
      <RangeControl
        label="Density (FAR proxy)"
        metricKey="density"
        bounds={metricBounds.density}
        value={numericFilters.density}
        onChange={setNumericFilterRange}
      />
      <RangeControl
        label="Energy"
        metricKey="energy"
        bounds={metricBounds.energy}
        value={numericFilters.energy}
        onChange={setNumericFilterRange}
      />
      <RangeControl
        label="Building Age"
        metricKey="age"
        bounds={metricBounds.age}
        value={numericFilters.age}
        onChange={setNumericFilterRange}
      />

      <button type="button" className="topbar-button" onClick={resetFilters}>
        Reset Filters
      </button>
    </aside>
  );
}
