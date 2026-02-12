import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { area as turfArea } from '@turf/turf';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/plots', async (_req, res, next) => {
  try {
    const raw = await readFile(path.join(rootDir, 'plots.geojson'), 'utf8');
    const geojson = JSON.parse(raw);

    const features = geojson.features.map((feature) => {
      if (feature.properties.type !== 'plot' && feature.properties.type !== 'road') return feature;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          area: turfArea(feature)
        }
      };
    });

    res.json({
      ...geojson,
      features
    });
  } catch (error) {
    next(error);
  }
});

const clientDistPath = path.join(rootDir, 'client/dist');
app.use(express.static(clientDistPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Unexpected server error.' });
});

app.listen(PORT, () => {
  console.log(`Urban Design API listening on http://localhost:${PORT}`);
});
