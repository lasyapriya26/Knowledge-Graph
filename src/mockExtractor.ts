import { EntityType, GraphData, GraphEdge, GraphNode, RelationType } from './types';

const KNOWN_TECH: Array<{ name: string; type: EntityType }> = [
  { name: 'Python', type: 'ProgrammingLanguage' },
  { name: 'JavaScript', type: 'ProgrammingLanguage' },
  { name: 'TypeScript', type: 'ProgrammingLanguage' },
  { name: 'Java', type: 'ProgrammingLanguage' },
  { name: 'C++', type: 'ProgrammingLanguage' },
  { name: 'Rust', type: 'ProgrammingLanguage' },
  { name: 'React', type: 'Technology' },
  { name: 'Node.js', type: 'Technology' },
  { name: 'SQL', type: 'Technology' },
  { name: 'HTML', type: 'Technology' },
  { name: 'CSS', type: 'Technology' },
  { name: 'D3', type: 'Technology' },
];

const STOP_NAMES = new Set([
  'A',
  'An',
  'And',
  'At',
  'By',
  'Computer Science',
  'He',
  'Her',
  'His',
  'In',
  'It',
  'On',
  'She',
  'The',
  'Their',
  'They',
  'Under',
  'With',
]);

function toId(label: string): string {
  return label
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function titleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function detectSubject(sentence: string, previousSubject: string): string {
  const directSubject = sentence.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:\s+is|\s+works|\s+studies|\s+knows|\s+leads|\s+created|\s+uses|\s+belongs|\s+owns|\s+founded|\s+manages|\s+heads)/);
  if (directSubject && !STOP_NAMES.has(directSubject[1])) {
    return directSubject[1];
  }

  if (/^(he|she|his|her|they|their)\b/i.test(sentence)) {
    return previousSubject;
  }

  const firstName = sentence.match(/\b([A-Z][a-z]+)\b/);
  return firstName && !STOP_NAMES.has(firstName[1]) ? firstName[1] : previousSubject;
}

function splitNames(value: string): string[] {
  return value
    .split(/\s*(?:,| and | & )\s*/i)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => name.replace(/^(with|under|by)\s+/i, '').trim())
    .filter((name) => /^[A-Z]/.test(name) && !STOP_NAMES.has(name));
}

export function extractKnowledgeGraphMock(text: string): GraphData {
  const nodesMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const seenEdges = new Set<string>();

  const addNode = (label: string, type: EntityType): string => {
    const cleanLabel = label.trim().replace(/\s+/g, ' ');
    const id = toId(cleanLabel);
    if (!id) return '';
    if (!nodesMap.has(id)) {
      nodesMap.set(id, { id, label: cleanLabel, type });
    }
    return id;
  };

  const addEdge = (source: string, target: string, relation: RelationType) => {
    if (!source || !target || source === target) return;
    const key = `${source}|${relation}|${target}`;
    if (seenEdges.has(key)) return;
    seenEdges.add(key);
    edges.push({ source, target, relation });
  };

  const sentences = text
    .trim()
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  let currentSubject = 'Person';

  for (const sentence of sentences) {
    currentSubject = detectSubject(sentence, currentSubject);
    const subjectId = addNode(currentSubject, 'Person');

    const studyMatch = sentence.match(/(?:studies\s+at|student\s+at|is\s+at)\s+([A-Z][A-Za-z0-9&.\s-]+?(?:University|College|School|Institute))/i);
    if (studyMatch) {
      addEdge(subjectId, addNode(studyMatch[1], 'Institution'), 'STUDIES_AT');
    }

    const workMatch = sentence.match(/works\s+(?:at|for)\s+([A-Z][A-Za-z0-9&.\s-]+)|employee\s+of\s+([A-Z][A-Za-z0-9&.\s-]+)/i);
    if (workMatch) {
      addEdge(subjectId, addNode((workMatch[1] || workMatch[2]).trim(), 'Company'), 'WORKS_AT');
    }

    const roleMatch = sentence.match(/(?:CEO|CTO|CFO|manager|engineer|developer|employee|founder)\s+of\s+([A-Z][A-Za-z0-9&.\s-]+)/i);
    if (roleMatch) {
      addEdge(subjectId, addNode(roleMatch[1].trim(), 'Company'), 'WORKS_AT');
    }

    const leadMatch = sentence.match(/(?:leads|heads|manages)\s+(?:the\s+)?([A-Z][A-Za-z0-9&.\s-]+?(?:Department|Team|Organization|Company|Project))/i);
    if (leadMatch) {
      const label = leadMatch[1].trim();
      const type: EntityType = /department/i.test(label) ? 'Department' : /team/i.test(label) ? 'Team' : 'Organization';
      addEdge(subjectId, addNode(label, type), 'LEADS');
    }

    const locatedMatch = sentence.match(/([A-Z][A-Za-z0-9&.\s-]+?)\s+is\s+located\s+in\s+([A-Z][A-Za-z\s]+)$/i);
    if (locatedMatch) {
      addEdge(addNode(locatedMatch[1].trim(), 'Company'), addNode(locatedMatch[2].trim(), 'City'), 'LOCATED_IN');
    }

    for (const relation of ['father', 'mother', 'brother', 'sister'] as const) {
      const possessive = sentence.match(new RegExp(`(?:his|her|${currentSubject}'s)\\s+${relation}\\s+is\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)`, 'i'));
      const reverse = sentence.match(new RegExp(`([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\s+is\\s+(?:his|her|${currentSubject}'s)\\s+${relation}`, 'i'));
      const name = possessive?.[1] || reverse?.[1];
      if (name) {
        addEdge(addNode(name, 'Person'), subjectId, relation.toUpperCase() as RelationType);
      }
    }

    const friendMatch = sentence.match(/friends?\s+with\s+(.+)|friend\s+of\s+(.+)/i);
    if (friendMatch) {
      for (const friend of splitNames(friendMatch[1] || friendMatch[2])) {
        addEdge(subjectId, addNode(friend, 'Person'), 'FRIEND');
      }
    }

    const knowsMatch = sentence.match(/(?:knows|skilled\s+in|uses)\s+(.+)/i);
    if (knowsMatch) {
      const lowerSentence = knowsMatch[1].toLowerCase();
      for (const tech of KNOWN_TECH) {
        if (lowerSentence.includes(tech.name.toLowerCase())) {
          const relation: RelationType = /uses/i.test(sentence) ? 'USES' : 'KNOWS';
          addEdge(subjectId, addNode(tech.name, tech.type), relation);
        }
      }
    }

    const projectMatch = sentence.match(/(?:working\s+on|building|developing|created)\s+(?:a|an|the)?\s*([A-Z][A-Za-z0-9\s-]+?(?:Project|System|App|Engine|Graph|Platform))/i);
    if (projectMatch) {
      const relation: RelationType = /created/i.test(sentence) ? 'CREATED' : 'WORKING_ON';
      addEdge(subjectId, addNode(titleCase(projectMatch[1]), 'Project'), relation);
    }

    const guideMatch = sentence.match(/(?:under|guided\s+by|supervised\s+by)\s+((?:Professor|Dr\.?)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (guideMatch) {
      addEdge(subjectId, addNode(guideMatch[1], 'Person'), 'GUIDED_BY');
    }
  }

  if (nodesMap.size === 0 || edges.length === 0) {
    const fallbackPersonId = addNode('Main Entity', 'Unknown');
    const fallbackSkillId = addNode('Knowledge Graphing', 'Skill');
    addEdge(fallbackPersonId, fallbackSkillId, 'KNOWS');
  }

  return {
    nodes: Array.from(nodesMap.values()),
    edges,
  };
}
