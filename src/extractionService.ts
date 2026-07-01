import { extractKnowledgeGraphMock } from './mockExtractor';
import { sanitizeGraph } from './graphSanitizer';
import { GraphData } from './types';

export type ExtractionMode = 'gemini' | 'mock';

export interface ExtractionResponse {
  result: GraphData;
  source: 'gemini' | 'mock' | 'mock_fallback';
  warning?: string;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const systemInstruction = `You are a Senior NLP Engineer and Information Extraction specialist.
Your task is to analyze the paragraph, identify all unique entities and relationships between them, and convert them into a strict Knowledge Graph structure with nodes and edges.

CRITICAL CONSTRAINTS:
1. Resolve pronouns to the actual entity. Never create nodes named He, She, His, Her, They, Them, Him, It, or Their.
2. Create each real-world entity only once.
3. Node type must be exactly one of:
   Person, Institution, Company, Organization, Project, Skill, ProgrammingLanguage, Course, Department, Technology, City, State, Country, Team, Unknown.
4. Edge relation must be exactly one of:
   FATHER, MOTHER, BROTHER, SISTER, FRIEND, STUDIES_AT, WORKS_AT, WORKING_ON, GUIDED_BY, KNOWS, MEMBER_OF, BELONGS_TO, USES, CREATED, OWNS, LOCATED_IN, PART_OF, LEADS.
   Do not write natural-language relation labels like "works for", "studies at", "friend of", or "located in".
5. Node IDs must contain no spaces.
6. Create only facts clearly supported by the paragraph.`;

export async function extractKnowledgeGraph(paragraph: string, mode: ExtractionMode = 'gemini'): Promise<ExtractionResponse> {
  const cleanedParagraph = paragraph.trim();
  if (!cleanedParagraph) {
    throw new Error('Paragraph is required');
  }

  if (mode === 'mock') {
    return {
      result: sanitizeGraph(extractKnowledgeGraphMock(cleanedParagraph)),
      source: 'mock',
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      result: sanitizeGraph(extractKnowledgeGraphMock(cleanedParagraph)),
      source: 'mock_fallback',
      warning: 'GEMINI_API_KEY is not configured, so the rule-based extractor was used.',
    };
  }

  try {
    const { GoogleGenAI, Type } = await import('@google/genai');
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        nodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              label: { type: Type.STRING },
              type: {
                type: Type.STRING,
                enum: [
                  'Person',
                  'Institution',
                  'Company',
                  'Organization',
                  'Project',
                  'Skill',
                  'ProgrammingLanguage',
                  'Course',
                  'Department',
                  'Technology',
                  'City',
                  'State',
                  'Country',
                  'Team',
                  'Unknown',
                ],
              },
            },
            required: ['id', 'label', 'type'],
          },
        },
        edges: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              source: { type: Type.STRING },
              target: { type: Type.STRING },
              relation: {
                type: Type.STRING,
                enum: [
                  'FATHER',
                  'MOTHER',
                  'BROTHER',
                  'SISTER',
                  'FRIEND',
                  'STUDIES_AT',
                  'WORKS_AT',
                  'WORKING_ON',
                  'GUIDED_BY',
                  'KNOWS',
                  'MEMBER_OF',
                  'BELONGS_TO',
                  'USES',
                  'CREATED',
                  'OWNS',
                  'LOCATED_IN',
                  'PART_OF',
                  'LEADS',
                ],
              },
            },
            required: ['source', 'target', 'relation'],
          },
        },
      },
      required: ['nodes', 'edges'],
    };

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Extract nodes and edges from this text:\n${cleanedParagraph}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Gemini returned an empty response');
    }

    return {
      result: sanitizeGraph(JSON.parse(textOutput.trim())),
      source: 'gemini',
    };
  } catch (error: any) {
    return {
      result: sanitizeGraph(extractKnowledgeGraphMock(cleanedParagraph)),
      source: 'mock_fallback',
      warning: `Gemini extraction failed (${error?.message || error}). The rule-based extractor was used instead.`,
    };
  }
}
