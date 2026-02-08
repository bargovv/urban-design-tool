# Urban Design Tool (React + Node.js)

This repository is structured as a modern full-stack app:

- **client/**: React + Vite front-end
- **server/**: Node.js + Express API
- **State management**: Zustand
- **3D visualization**: React Three Fiber + Drei
- **DXF parsing**: dxf-parser
- **Charts**: Recharts

## Run locally

```bash
npm install
npm run dev
```

- React app: http://localhost:5173
- API: http://localhost:3000

## Production build

```bash
npm run build
npm run start
```

The server exposes:

- `GET /api/health`
- `GET /api/plots`

`/api/plots` reads `plots.geojson`, recalculates polygon areas, and returns normalized GeoJSON.
