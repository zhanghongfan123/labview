import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));

// Log static file path
console.log('Serving static files from:', path.join(__dirname, 'dist'));

// Serve static files from the React app
app.use('/labview', express.static(path.join(__dirname, 'dist')));

// Redirect root to /labview
app.get('/', (req, res) => {
  res.redirect('/labview');
});

const CACHE_DIR = path.join(__dirname, 'cache');

// Ensure cache directory exists
try {
  await fs.access(CACHE_DIR);
} catch {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

// Get history for an agent
app.get('/api/history/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const filePath = path.join(CACHE_DIR, `${agentId}.json`);
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      res.json(JSON.parse(data));
    } catch (error) {
      // If file doesn't exist, return empty array
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading history:', error);
    res.status(500).json({ error: 'Failed to read history' });
  }
});

// Save history for an agent
app.post('/api/history/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const messages = req.body;
    const filePath = path.join(CACHE_DIR, `${agentId}.json`);
    
    await fs.writeFile(filePath, JSON.stringify(messages, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving history:', error);
    res.status(500).json({ error: 'Failed to save history' });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.use('/labview', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`History server running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please free the port and restart.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
