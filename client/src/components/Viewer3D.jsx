import { useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, ContactShadows, Environment, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { makeFloorSelectionId } from '../store/useUrbanStore';

const findIsland = (startId, allBuildings) => {
  const buildings = allBuildings.filter((building) => building.type === 'Building');
  const startNode = buildings.find((building) => building.id === startId);
  if (!startNode) return [startId];
  const island = new Set([startId]);
  const queue = [startNode];
  const isTouching = (a, b) => {
    const ax = a.originalShape[0].x;
    const ay = a.originalShape[0].y;
    const bx = b.originalShape[0].x;
    const by = b.originalShape[0].y;
    return Math.hypot(ax - bx, ay - by) < 15;
  };
  while (queue.length > 0) {
    const current = queue.pop();
    buildings.forEach((building) => {
      if (!island.has(building.id) && isTouching(current, building)) {
        island.add(building.id);
        queue.push(building);
      }
    });
  }
  return Array.from(island);
};

const getScaledShape = (points, factor) => {
  if (!points || points.length === 0) return new THREE.Shape();
  let cx = 0;
  let cy = 0;
  points.forEach((point) => {
    cx += point[0];
    cy += point[1];
  });
  cx /= points.length;
  cy /= points.length;
  const shape = new THREE.Shape();
  const start = points[0];
  shape.moveTo(cx + (start[0] - cx) * factor, cy + (start[1] - cy) * factor);
  points.slice(1).forEach((point) => shape.lineTo(cx + (point[0] - cx) * factor, cy + (point[1] - cy) * factor));
  return shape;
};

const getColorByValue = (value, min, max, startHue, endHue) => {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const hue = startHue + (endHue - startHue) * t;
  return `hsl(${hue}, 80%, 50%)`;
};

const CameraController = ({ mode }) => {
  const { camera, controls } = useThree();
  useEffect(() => {
    if (mode === 'PLAN') {
      camera.position.set(0, 1000, 0);
      camera.lookAt(0, 0, 0);
      camera.zoom = 10;
      camera.updateProjectionMatrix();
      if (controls) {
        controls.reset();
        controls.enableRotate = false;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.object.position.set(0, 1000, 0);
        controls.object.lookAt(0, 0, 0);
        controls.update();
      }
    } else if (controls) {
      controls.enableRotate = true;
    }
  }, [mode, camera, controls]);
  return null;
};

const getFloorCount = (data) => {
  const floorHeight = data.floorHeight || 3;
  const heightMeters = Number(data.height) > 0 ? Number(data.height) : (Number(data.floors) || 0) * floorHeight;
  return Math.max(1, Math.round(heightMeters / floorHeight));
};

const EntityMesh = ({
  data,
  onToggle,
  onToggleFloor,
  isSelected,
  selectedFloorIds,
  selectionMode,
  selectionFilter,
  buildings,
  onBlockSelect,
  colorMode
}) => {
  const isRoad = data.type === 'Road';
  const isPlot = data.type === 'Plot';
  const isVegetation = data.type === 'Vegetation';
  const isBuilding = data.type === 'Building';

  const baseColor = useMemo(() => {
    if (isRoad) return isSelected ? '#ff9800' : '#222';
    if (isVegetation) return '#7ED321';
    if (isPlot) return '#f5f5f5';
    if (colorMode === 'USE') {
      switch (data.landUseExisting) {
        case 'Residential':
          return '#F8E71C';
        case 'Commercial':
          return '#4A90E2';
        case 'Industrial':
          return '#BD10E0';
        case 'Public':
          return '#D0021B';
        default:
          return '#ffffff';
      }
    }
    if (colorMode === 'HEIGHT') {
      const t = Math.min(1, data.floors / 12);
      return `hsl(220, ${50 + t * 50}%, ${90 - t * 60}%)`;
    }
    if (colorMode === 'FAR') {
      let coverage = 1.0;
      if (data.setback === 'Minimum') coverage = 0.95;
      if (data.setback === 'Medium') coverage = 0.85;
      if (data.setback === 'Large') coverage = 0.75;
      const far = data.floors * coverage;
      return getColorByValue(far, 0.5, 4.0, 120, 0);
    }
    if (colorMode === 'ENERGY') {
      let intensity = 150;
      if (data.landUseExisting === 'Commercial') intensity = 250;
      if (data.landUseExisting === 'Industrial') intensity = 350;
      return getColorByValue(intensity, 100, 350, 120, 0);
    }

    return '#fff';
  }, [data.landUseExisting, data.floors, data.setback, colorMode, isRoad, isPlot, isVegetation, isSelected]);

  const currentHeight = isRoad ? 0.05 : isVegetation ? 0.2 : data.floors * data.floorHeight;

  const plotShape = useMemo(() => {
    const shape = new THREE.Shape();
    if (data.shape.length) {
      shape.moveTo(data.shape[0][0], data.shape[0][1]);
      data.shape.slice(1).forEach((point) => shape.lineTo(point[0], point[1]));
    }
    return shape;
  }, [data.shape]);

  const buildingShape = useMemo(() => {
    let factor = 1.0;
    if (!isRoad && !isPlot && !isVegetation) {
      if (data.setback === 'Minimum') factor = 0.95;
      else if (data.setback === 'Medium') factor = 0.85;
      else if (data.setback === 'Large') factor = 0.75;
    }
    return getScaledShape(data.shape, factor);
  }, [data.shape, data.setback, isRoad, isPlot, isVegetation]);

  const canSelectPlot = selectionFilter === 'AUTO' || selectionFilter === 'PLOTS';
  const canSelectBuilding = selectionFilter === 'AUTO' || selectionFilter === 'BUILDINGS';
  const canSelectRoad = selectionFilter === 'AUTO' || selectionFilter === 'ROADS';
  const canSelectFloor = selectionFilter === 'AUTO' || selectionFilter === 'FLOORS';

  const handleClick = (event) => {
    event.stopPropagation();
    if (isBuilding && !canSelectBuilding) return;
    if (isPlot && !canSelectPlot) return;
    if (isRoad && !canSelectRoad) return;

    if (isBuilding && selectionMode === 'BLOCK') {
      const islandIds = findIsland(data.id, buildings);
      onBlockSelect(islandIds);
    } else if (isBuilding || isPlot || isRoad) {
      onToggle(data.id, event.ctrlKey || event.metaKey);
    }
  };

  const floorCount = isBuilding ? getFloorCount(data) : 0;
  const floorHeight = data.floorHeight || 3;
  const floorDepth = Math.max(0.1, floorHeight * 0.92);

  return (
    <group>
      <mesh
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={isPlot ? handleClick : undefined}
        onPointerOver={() => isPlot && canSelectPlot && (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <shapeGeometry args={[plotShape]} />
        <meshBasicMaterial color={isSelected ? '#ff9800' : '#000'} transparent opacity={isSelected ? 0.2 : 0.05} />
        <Edges color={isSelected ? '#ff9800' : '#ccc'} threshold={15} />
      </mesh>

      {!isPlot && !isBuilding && (
        <mesh
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
          castShadow
          onClick={handleClick}
          onPointerOver={() => isRoad && canSelectRoad && (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
        >
          <extrudeGeometry args={[buildingShape, { depth: currentHeight, bevelEnabled: false }]} />
          <meshStandardMaterial color={baseColor} roughness={0.5} />
          <Edges color={isSelected ? '#fff' : 'rgba(0,0,0,0.3)'} threshold={15} />
        </mesh>
      )}

      {isBuilding && (
        <group>
          {Array.from({ length: floorCount }).map((_, index) => {
            const floorSelectionId = makeFloorSelectionId(data.id, index + 1);
            const isFloorSelected = selectedFloorIds.includes(floorSelectionId);

            return (
              <mesh
                key={floorSelectionId}
                position={[0, index * floorHeight, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
                castShadow
                onClick={(event) => {
                  event.stopPropagation();
                  if (selectionMode === 'BLOCK') {
                    handleClick(event);
                    return;
                  }

                  if (canSelectFloor && selectionFilter === 'FLOORS') {
                    onToggleFloor(floorSelectionId, event.ctrlKey || event.metaKey);
                    return;
                  }

                  if (canSelectBuilding) {
                    onToggle(data.id, event.ctrlKey || event.metaKey);
                  }
                }}
                onPointerOver={() =>
                  ((selectionFilter === 'FLOORS' && canSelectFloor) || canSelectBuilding) &&
                  (document.body.style.cursor = 'pointer')
                }
                onPointerOut={() => (document.body.style.cursor = 'auto')}
              >
                <extrudeGeometry args={[buildingShape, { depth: floorDepth, bevelEnabled: false }]} />
                {isFloorSelected || isSelected ? (
                  <meshPhysicalMaterial
                    color={isFloorSelected ? '#EAFF00' : '#BFD7FF'}
                    emissive={isFloorSelected ? '#EAFF00' : '#9DBFFF'}
                    emissiveIntensity={0.4}
                    transparent
                    opacity={0.72}
                  />
                ) : (
                  <meshStandardMaterial color={baseColor} roughness={0.5} />
                )}
                <Edges color={isFloorSelected || isSelected ? '#fff' : 'rgba(0,0,0,0.35)'} threshold={15} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
};

export default function Viewer3D({
  buildings,
  selectedIds,
  selectedFloorIds,
  onToggleSelection,
  onToggleFloorSelection,
  onClearSelection,
  viewMode,
  selectionMode,
  selectionFilter,
  onBlockSelect,
  colorMode
}) {
  return (
    <div className="viewer-canvas">
      <Canvas shadows dpr={[1, 2]} onPointerMissed={onClearSelection}>
        <CameraController mode={viewMode} />
        <OrthographicCamera makeDefault near={-1000} far={5000} position={[100, 100, 100]} zoom={20} />
        <OrbitControls enableRotate={viewMode === 'ISO'} enablePan />
        <ambientLight intensity={0.7} />
        <directionalLight position={[50, 80, 30]} intensity={1} castShadow shadow-mapSize={2048} />
        <Environment preset="city" />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[2000, 2000]} />
          <meshStandardMaterial color="#e0e0e0" />
        </mesh>

        {buildings.map((building) => (
          <EntityMesh
            key={building.id}
            data={building}
            isSelected={selectedIds.includes(building.id)}
            selectedFloorIds={selectedFloorIds}
            onToggle={onToggleSelection}
            onToggleFloor={onToggleFloorSelection}
            selectionMode={selectionMode}
            selectionFilter={selectionFilter}
            buildings={buildings}
            onBlockSelect={onBlockSelect}
            colorMode={colorMode}
          />
        ))}
        <ContactShadows resolution={1024} scale={500} blur={2} opacity={0.4} color="#000" />
      </Canvas>
    </div>
  );
}
