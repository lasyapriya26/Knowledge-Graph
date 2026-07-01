import { ALLOWED_ENTITY_TYPES_SET, ALLOWED_RELATIONS_SET } from './graphSchema';
import type { EntityType, GraphData, GraphEdge, GraphNode, RelationType } from './types';

function cleanId(value: unknown): string {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeRelation(value: unknown): RelationType {
  const compact = String(value || 'KNOWS')
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (ALLOWED_RELATIONS_SET.has(compact as RelationType)) {
    return compact as RelationType;
  }

  const aliases: Record<string, RelationType> = {
    FATHER_OF: 'FATHER',
    IS_FATHER_OF: 'FATHER',
    DAD: 'FATHER',
    DAD_OF: 'FATHER',
    MOTHER_OF: 'MOTHER',
    IS_MOTHER_OF: 'MOTHER',
    MOM: 'MOTHER',
    MOM_OF: 'MOTHER',
    BROTHER_OF: 'BROTHER',
    IS_BROTHER_OF: 'BROTHER',
    SISTER_OF: 'SISTER',
    IS_SISTER_OF: 'SISTER',
    FRIEND_OF: 'FRIEND',
    FRIENDS_WITH: 'FRIEND',
    IS_FRIEND_OF: 'FRIEND',
    STUDIES: 'STUDIES_AT',
    STUDIES_IN: 'STUDIES_AT',
    STUDYING_AT: 'STUDIES_AT',
    STUDENT_AT: 'STUDIES_AT',
    ATTENDS: 'STUDIES_AT',
    ATTENDS_SCHOOL_AT: 'STUDIES_AT',
    WORKS: 'WORKS_AT',
    WORKS_FOR: 'WORKS_AT',
    EMPLOYED_BY: 'WORKS_AT',
    EMPLOYEE_OF: 'WORKS_AT',
    CEO_OF: 'WORKS_AT',
    WORKING_ON_PROJECT: 'WORKING_ON',
    DEVELOPS: 'WORKING_ON',
    BUILDING: 'WORKING_ON',
    BUILDS: 'WORKING_ON',
    GUIDED: 'GUIDED_BY',
    MENTORED_BY: 'GUIDED_BY',
    SUPERVISED_BY: 'GUIDED_BY',
    ADVISED_BY: 'GUIDED_BY',
    KNOWS_ABOUT: 'KNOWS',
    SKILLED_IN: 'KNOWS',
    FAMILIAR_WITH: 'KNOWS',
    MEMBER: 'MEMBER_OF',
    MEMBER_IN: 'MEMBER_OF',
    BELONGS: 'BELONGS_TO',
    BELONGS_IN: 'BELONGS_TO',
    USES_TECHNOLOGY: 'USES',
    CREATED_BY: 'CREATED',
    CREATOR_OF: 'CREATED',
    OWNER_OF: 'OWNS',
    LOCATED: 'LOCATED_IN',
    LOCATED_AT: 'LOCATED_IN',
    BASED_IN: 'LOCATED_IN',
    IN: 'LOCATED_IN',
    PART: 'PART_OF',
    CONTAINS: 'PART_OF',
    LEADER_OF: 'LEADS',
    MANAGES: 'LEADS',
    HEADS: 'LEADS',
  };

  return aliases[compact] || 'KNOWS';
}

export function sanitizeGraph(input: Partial<GraphData> | null | undefined): GraphData {
  const uniqueNodes: GraphNode[] = [];
  const seenIds = new Set<string>();

  for (const node of input?.nodes || []) {
    const id = cleanId(node.id || node.label);
    if (!id || seenIds.has(id)) continue;

    const type = ALLOWED_ENTITY_TYPES_SET.has(node.type as EntityType)
      ? (node.type as EntityType)
      : 'Unknown';

    seenIds.add(id);
    uniqueNodes.push({
      id,
      label: String(node.label || node.id || id).trim(),
      type,
    });
  }

  const validNodeIds = new Set(uniqueNodes.map((node) => node.id));
  const edges: GraphEdge[] = [];
  const seenEdges = new Set<string>();

  for (const edge of input?.edges || []) {
    const source = cleanId(edge.source);
    const target = cleanId(edge.target);
    const relation = normalizeRelation(edge.relation);

    if (!validNodeIds.has(source) || !validNodeIds.has(target) || source === target) continue;

    const key = `${source}|${relation}|${target}`;
    if (seenEdges.has(key)) continue;
    seenEdges.add(key);
    edges.push({ source, target, relation });
  }

  return { nodes: uniqueNodes, edges };
}
