import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { extractKnowledgeGraph } from './src/extractionService.ts';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for NLP Information Extraction
  app.post('/api/extract', async (req, res) => {
    try {
      const { paragraph, mode } = req.body;
      if (!paragraph || typeof paragraph !== 'string') {
        return res.status(400).json({ error: 'Paragraph is required' });
      }

      return res.json(await extractKnowledgeGraph(paragraph, mode === 'mock' ? 'mock' : 'gemini'));
    } catch (err: any) {
      console.error('Extraction failed:', err);
      return res.status(500).json({ error: err.message || 'Failed to extract knowledge graph' });
    }
  });

  // Serve Frontend Assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Knowledge Graph Builder Server running on port ${PORT}`);
  });
}

startServer();
