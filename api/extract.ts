import { extractKnowledgeGraph, ExtractionMode } from '../src/extractionService';
import { extractKnowledgeGraphMock } from '../src/mockExtractor';
import { sanitizeGraph } from '../src/graphSanitizer';

async function readBody(req: any) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let paragraph = '';

  try {
    const body = await readBody(req);
    const mode = body?.mode;
    paragraph = typeof body?.paragraph === 'string' ? body.paragraph : '';

    if (!paragraph || typeof paragraph !== 'string') {
      return res.status(400).json({ error: 'Paragraph is required' });
    }

    const result = await extractKnowledgeGraph(
      paragraph,
      mode === 'mock' ? 'mock' : ('gemini' as ExtractionMode),
    );

    return res.status(200).json(result);
  } catch (error: any) {
    if (!paragraph.trim()) {
      return res.status(400).json({ error: 'Paragraph is required' });
    }

    return res.status(200).json({
      result: sanitizeGraph(extractKnowledgeGraphMock(paragraph)),
      source: 'mock_fallback',
      warning: `The serverless LLM route failed (${error?.message || error}). The rule-based extractor was used instead.`,
    });
  }
}
