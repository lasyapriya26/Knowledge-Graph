export type EntityType =
  | 'Person'
  | 'Institution'
  | 'Company'
  | 'Organization'
  | 'Project'
  | 'Skill'
  | 'ProgrammingLanguage'
  | 'Course'
  | 'Department'
  | 'Technology'
  | 'City'
  | 'State'
  | 'Country'
  | 'Team'
  | 'Unknown';

export type RelationType =
  | 'FATHER'
  | 'MOTHER'
  | 'BROTHER'
  | 'SISTER'
  | 'FRIEND'
  | 'STUDIES_AT'
  | 'WORKS_AT'
  | 'WORKING_ON'
  | 'GUIDED_BY'
  | 'KNOWS'
  | 'MEMBER_OF'
  | 'BELONGS_TO'
  | 'USES'
  | 'CREATED'
  | 'OWNS'
  | 'LOCATED_IN'
  | 'PART_OF'
  | 'LEADS';

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: RelationType;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const ALLOWED_ENTITY_TYPES: EntityType[] = [
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
];

export const ALLOWED_RELATIONS: RelationType[] = [
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
];

export const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  Person: { bg: 'bg-emerald-950/20', text: 'text-emerald-400', border: 'border-emerald-500/30', accent: '#10b981' },
  Institution: { bg: 'bg-indigo-950/20', text: 'text-indigo-400', border: 'border-indigo-500/30', accent: '#6366f1' },
  Company: { bg: 'bg-cyan-950/20', text: 'text-cyan-400', border: 'border-cyan-500/30', accent: '#06b6d4' },
  Organization: { bg: 'bg-blue-950/20', text: 'text-blue-400', border: 'border-blue-500/30', accent: '#3b82f6' },
  Project: { bg: 'bg-amber-950/20', text: 'text-amber-400', border: 'border-amber-500/30', accent: '#f59e0b' },
  Skill: { bg: 'bg-violet-950/20', text: 'text-violet-400', border: 'border-violet-500/30', accent: '#8b5cf6' },
  ProgrammingLanguage: { bg: 'bg-rose-950/20', text: 'text-rose-400', border: 'border-rose-500/30', accent: '#f43f5e' },
  Course: { bg: 'bg-orange-950/20', text: 'text-orange-400', border: 'border-orange-500/30', accent: '#f97316' },
  Department: { bg: 'bg-pink-950/20', text: 'text-pink-400', border: 'border-pink-500/30', accent: '#ec4899' },
  Technology: { bg: 'bg-fuchsia-950/20', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30', accent: '#d946ef' },
  City: { bg: 'bg-teal-950/20', text: 'text-teal-400', border: 'border-teal-500/30', accent: '#14b8a6' },
  State: { bg: 'bg-sky-950/20', text: 'text-sky-400', border: 'border-sky-500/30', accent: '#0ea5e9' },
  Country: { bg: 'bg-green-950/20', text: 'text-green-400', border: 'border-green-500/30', accent: '#22c55e' },
  Team: { bg: 'bg-lime-950/20', text: 'text-lime-400', border: 'border-lime-500/30', accent: '#84cc16' },
  Unknown: { bg: 'bg-slate-900/40', text: 'text-slate-400', border: 'border-slate-800', accent: '#64748b' },
};

