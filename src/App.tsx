import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRightLeft,
  Database,
  Grid
} from 'lucide-react';
import {
  GraphNode,
  GraphEdge,
  EntityType,
  RelationType,
  ALLOWED_ENTITY_TYPES,
  ALLOWED_RELATIONS,
  TYPE_COLORS
} from './types';
import { KnowledgeGraphView } from './components/KnowledgeGraphView';
import { extractKnowledgeGraphMock } from './mockExtractor';
import { sanitizeGraph } from './graphSanitizer';

// Preset Paragraphs
const PRESETS = [
  {
    name: 'Academic Circle (Default)',
    icon: '🎓',
    text: 'Rahul is a third year Computer Science student at ABC University. His father is Ramesh. His mother is Sita. He is friends with Arjun and Sneha. Rahul knows Python and Java. He is working on a Knowledge Graph project under Professor Kumar.'
  },
  {
    name: 'Corporate Hierarchy',
    icon: '💼',
    text: 'Sarah is the CEO of ApexCorp. She leads the Engineering Department. Alex works at ApexCorp under Sarah\'s guidance. Alex knows TypeScript and React. ApexCorp is located in San Francisco.'
  },
  {
    name: 'Family & Stanford Connections',
    icon: '🏡',
    text: 'John is married to Mary. Their son is David. David is studies at Stanford University. David is friends with Emily. Emily knows Java and is working on a Robot Project under Professor Smith.'
  }
];

// Preloaded initial graph matching the academic circle
const INITIAL_NODES: GraphNode[] = [
  { id: 'Rahul', label: 'Rahul', type: 'Person' },
  { id: 'ABC_University', label: 'ABC University', type: 'Institution' },
  { id: 'Ramesh', label: 'Ramesh', type: 'Person' },
  { id: 'Sita', label: 'Sita', type: 'Person' },
  { id: 'Arjun', label: 'Arjun', type: 'Person' },
  { id: 'Sneha', label: 'Sneha', type: 'Person' },
  { id: 'Python', label: 'Python', type: 'ProgrammingLanguage' },
  { id: 'Java', label: 'Java', type: 'ProgrammingLanguage' },
  { id: 'Knowledge_Graph_Project', label: 'Knowledge Graph Project', type: 'Project' },
  { id: 'Professor_Kumar', label: 'Professor Kumar', type: 'Person' },
];

const INITIAL_EDGES: GraphEdge[] = [
  { source: 'Rahul', target: 'ABC_University', relation: 'STUDIES_AT' },
  { source: 'Ramesh', target: 'Rahul', relation: 'FATHER' },
  { source: 'Sita', target: 'Rahul', relation: 'MOTHER' },
  { source: 'Rahul', target: 'Arjun', relation: 'FRIEND' },
  { source: 'Rahul', target: 'Sneha', relation: 'FRIEND' },
  { source: 'Rahul', target: 'Python', relation: 'KNOWS' },
  { source: 'Rahul', target: 'Java', relation: 'KNOWS' },
  { source: 'Rahul', target: 'Knowledge_Graph_Project', relation: 'WORKING_ON' },
  { source: 'Rahul', target: 'Professor_Kumar', relation: 'GUIDED_BY' },
];

export default function App() {
  const [inputText, setInputText] = useState(PRESETS[0].text);
  const [nodes, setNodes] = useState<GraphNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(INITIAL_EDGES);
  const [extractionMode, setExtractionMode] = useState<'gemini' | 'mock'>('gemini');
  const [isLoading, setIsLoading] = useState(false);
  const [apiSource, setApiSource] = useState<string>('preloaded');
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Node Form State
  const [newNodeId, setNewNodeId] = useState('');
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeType, setNewNodeType] = useState<EntityType>('Person');

  // New Edge Form State
  const [newEdgeSource, setNewEdgeSource] = useState('');
  const [newEdgeTarget, setNewEdgeTarget] = useState('');
  const [newEdgeRelation, setNewEdgeRelation] = useState<RelationType>('FRIEND');

  // Load a text preset
  const handleLoadPreset = (text: string) => {
    setInputText(text);
    setErrorMsg(null);
    setWarningMsg(null);
  };

  // Submit text to extraction backend
  const handleExtractGraph = async () => {
    if (!inputText.trim()) {
      setErrorMsg('Please input a paragraph before generating.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setWarningMsg(null);

    try {
      if (extractionMode === 'mock') {
        const result = sanitizeGraph(extractKnowledgeGraphMock(inputText));
        setNodes(result.nodes);
        setEdges(result.edges);
        setApiSource('mock');
        return;
      }

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paragraph: inputText,
          mode: extractionMode,
        }),
      });

      if (!response.ok) {
        throw new Error(`API route failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Update state
      if (data.result) {
        setNodes(data.result.nodes || []);
        setEdges(data.result.edges || []);
      }
      setApiSource(data.source || 'gemini');
      if (data.warning) {
        setWarningMsg(data.warning);
      }
    } catch (err: any) {
      console.error('Extraction Error:', err);
      const fallback = sanitizeGraph(extractKnowledgeGraphMock(inputText));
      setNodes(fallback.nodes);
      setEdges(fallback.edges);
      setApiSource('mock_fallback');
      setWarningMsg(`${err.message || 'The LLM API failed'}. Showing a rule-based graph instead.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Manual Node Add
  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeId.trim() || !newNodeLabel.trim()) return;

    const cleanId = newNodeId.trim().replace(/\s+/g, '_');
    
    // Check for duplicate ID
    if (nodes.some(n => n.id === cleanId)) {
      alert(`Node with ID "${cleanId}" already exists.`);
      return;
    }

    const node: GraphNode = {
      id: cleanId,
      label: newNodeLabel.trim(),
      type: newNodeType
    };

    setNodes([...nodes, node]);
    // Reset Form
    setNewNodeId('');
    setNewNodeLabel('');
    setNewNodeType('Person');
  };

  // Manual Edge Add
  const handleAddEdge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEdgeSource || !newEdgeTarget) return;

    // Check if source and target exist
    if (!nodes.some(n => n.id === newEdgeSource)) {
      alert(`Source node "${newEdgeSource}" does not exist.`);
      return;
    }
    if (!nodes.some(n => n.id === newEdgeTarget)) {
      alert(`Target node "${newEdgeTarget}" does not exist.`);
      return;
    }

    const edge: GraphEdge = {
      source: newEdgeSource,
      target: newEdgeTarget,
      relation: newEdgeRelation
    };

    setEdges([...edges, edge]);
    // Reset Form
    setNewEdgeSource('');
    setNewEdgeTarget('');
    setNewEdgeRelation('FRIEND');
  };

  // Delete Node (cascades and deletes associated edges)
  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setEdges(edges.filter(e => e.source !== nodeId && e.target !== nodeId));
  };

  // Delete Edge
  const handleDeleteEdge = (index: number) => {
    setEdges(edges.filter((_, idx) => idx !== index));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans p-6 space-y-6">
      
      {/* Header element aligned with Bento Grid aesthetic */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center">
          <div className="bg-emerald-500 h-6 w-2 mr-3 rounded-full" />
          <div>
            <h1 className="text-xl font-black tracking-wider text-white uppercase font-sans">
              KNOWLEDGE GRAPH BUILDER 
              <span className="text-slate-500 font-mono text-xs ml-2 uppercase tracking-normal">v1.0.4-alpha</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">Structured Natural Language Information Extraction Stage</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-400 font-mono tracking-wide uppercase">
            STATUS: ENGINE READY
          </div>
          <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-[10px] text-emerald-400 font-mono tracking-wide uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            MODE: EXTRACTION
          </div>
        </div>
      </header>

      {/* Main Content Bento Grid */}
      <div className="flex-1 grid grid-cols-12 gap-5">
        
        {/* Left Side: Text input and Presets (col-span-4) */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-5">
          
          {/* Section: Paragraph Input Bento Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
            {/* Ambient accent background lines */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3.5 flex items-center">
                <span className="mr-2 text-emerald-500">●</span> INPUT PARAGRAPH
              </label>

              {/* Fast Presets switcher */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleLoadPreset(preset.text)}
                      className={`text-[10px] font-mono px-2.5 py-1.5 rounded transition-all flex items-center gap-1 border ${
                        inputText === preset.text
                          ? 'bg-emerald-500/15 border-emerald-500/45 text-emerald-300 font-bold'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Rahul is a third year Computer Science student..."
                  className="w-full h-56 bg-slate-950 border border-slate-800 focus:border-emerald-600 rounded p-3 text-sm text-slate-300 resize-none focus:outline-none leading-relaxed font-serif transition"
                />
                <div className="absolute bottom-2 right-2.5 text-[9px] text-slate-500 font-mono">
                  {inputText.length} CHARS
                </div>
              </div>
            </div>

            {/* Submitter & settings */}
            <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs bg-slate-950 p-2 rounded border border-slate-850">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Model:</span>
                <div className="flex gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setExtractionMode('gemini')}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all ${
                      extractionMode === 'gemini'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    LLM
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtractionMode('mock')}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all ${
                      extractionMode === 'mock'
                        ? 'bg-slate-800 text-slate-200'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Mock
                  </button>
                </div>
              </div>

              <button
                onClick={handleExtractGraph}
                disabled={isLoading}
                className={`w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>EXTRACTING DATA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>GENERATE KNOWLEDGE GRAPH</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Engine Status & Notices Bento */}
          <AnimatePresence mode="wait">
            {(errorMsg || warningMsg || apiSource !== 'preloaded') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-2 shadow-md"
              >
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  System Telemetry
                </div>
                {errorMsg && (
                  <div className="text-xs text-rose-400 flex items-start gap-2 bg-rose-950/20 p-2 rounded border border-rose-900/30">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p>{errorMsg}</p>
                  </div>
                )}
                {warningMsg && (
                  <div className="text-xs text-amber-400 flex items-start gap-2 bg-amber-950/20 p-2 rounded border border-amber-900/30">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p>{warningMsg}</p>
                  </div>
                )}
                {apiSource !== 'preloaded' && !errorMsg && (
                  <div className="text-xs text-emerald-400 flex items-center gap-2 bg-emerald-950/20 p-2 rounded border border-emerald-900/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Extracted using: <strong className="text-white uppercase font-mono">{apiSource}</strong></span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </section>

        {/* Right Side: Graph Interactive Stage (col-span-8) */}
        <section className="col-span-12 lg:col-span-8 flex flex-col h-[520px] lg:h-auto min-h-[480px]">
          <KnowledgeGraphView nodes={nodes} edges={edges} />
        </section>

      </div>

      {/* Tables & Custom Builders Bento Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Nodes (Entities) Bento Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">Nodes Table</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono uppercase">{nodes.length} ENTITIES FOUND</span>
            </div>

            {/* Nodes Table */}
            <div className="overflow-y-auto max-h-60 border border-slate-950 rounded">
              <table className="w-full text-[11px] font-mono border-collapse">
                <thead>
                  <tr className="text-left text-slate-500 bg-slate-950/60 border-b border-slate-800">
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">Label</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300 divide-y divide-slate-800/40">
                  {nodes.map((node) => {
                    const colors = TYPE_COLORS[node.type] || TYPE_COLORS.Unknown;
                    return (
                      <tr key={node.id} className="hover:bg-slate-950/40 transition">
                        <td className="p-2.5 text-slate-400 font-bold">{node.id}</td>
                        <td className="p-2.5 text-emerald-400 font-bold">{node.label}</td>
                        <td className="p-2.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${colors.bg} ${colors.text}`}>
                            {node.type}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteNode(node.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {nodes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500 italic">No nodes found. Add nodes using the form below.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Add Node Form */}
          <form onSubmit={handleAddNode} className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
            <div className="sm:col-span-3">
              <label className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">Entity ID</label>
              <input
                type="text"
                required
                placeholder="Ramesh"
                value={newNodeId}
                onChange={(e) => setNewNodeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">Label Name</label>
              <input
                type="text"
                required
                placeholder="Ramesh Kumar"
                value={newNodeLabel}
                onChange={(e) => setNewNodeLabel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">Type</label>
              <select
                value={newNodeType}
                onChange={(e) => setNewNodeType(e.target.value as EntityType)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-600 font-mono"
              >
                {ALLOWED_ENTITY_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-slate-950">
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold py-1.5 rounded text-xs transition flex items-center justify-center gap-1 font-mono uppercase"
              >
                <Plus className="w-3 h-3 text-emerald-400" />
                <span>Add</span>
              </button>
            </div>
          </form>
        </div>

        {/* Edges (Relations) Bento Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">Edges Table</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono uppercase">{edges.length} RELATIONS ACTIVE</span>
            </div>

            {/* Edges Table */}
            <div className="overflow-y-auto max-h-60 border border-slate-950 rounded">
              <table className="w-full text-[11px] font-mono border-collapse">
                <thead>
                  <tr className="text-left text-slate-500 bg-slate-950/60 border-b border-slate-800">
                    <th className="p-2.5">Source</th>
                    <th className="p-2.5">Relation</th>
                    <th className="p-2.5">Target</th>
                    <th className="p-2.5 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300 divide-y divide-slate-800/40">
                  {edges.map((edge, index) => {
                    const srcNode = nodes.find(n => n.id === edge.source);
                    const destNode = nodes.find(n => n.id === edge.target);
                    return (
                      <tr key={index} className="hover:bg-slate-950/40 transition">
                        <td className="p-2.5 text-slate-300 font-bold">{edge.source} <span className="text-[9px] text-slate-500 block font-normal">({srcNode?.label || 'Unknown'})</span></td>
                        <td className="p-2.5 text-emerald-500 text-[10px] font-extrabold">{edge.relation}</td>
                        <td className="p-2.5 text-slate-300 font-bold">{edge.target} <span className="text-[9px] text-slate-500 block font-normal">({destNode?.label || 'Unknown'})</span></td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteEdge(index)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {edges.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500 italic">No relations mapped. Select source/target below to connect.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Add Edge Form */}
          <form onSubmit={handleAddEdge} className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
            <div className="sm:col-span-3">
              <label className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">Source ID</label>
              <select
                value={newEdgeSource}
                onChange={(e) => setNewEdgeSource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-600 font-mono"
                required
              >
                <option value="" className="bg-slate-950">-- SELECT --</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id} className="bg-slate-950">
                    {n.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-4">
              <label className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">Relation</label>
              <select
                value={newEdgeRelation}
                onChange={(e) => setNewEdgeRelation(e.target.value as RelationType)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-600 font-mono"
              >
                {ALLOWED_RELATIONS.map((r) => (
                  <option key={r} value={r} className="bg-slate-950">
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">Target ID</label>
              <select
                value={newEdgeTarget}
                onChange={(e) => setNewEdgeTarget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-600 font-mono"
                required
              >
                <option value="" className="bg-slate-950">-- SELECT --</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id} className="bg-slate-950">
                    {n.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold py-1.5 rounded text-xs transition flex items-center justify-center gap-1 font-mono uppercase"
              >
                <Plus className="w-3 h-3 text-emerald-400" />
                <span>Connect</span>
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Humble, clean outer footer */}
      <footer className="mt-8 border-t border-slate-900 bg-slate-950/40 py-6 text-center text-[11px] text-slate-600 flex flex-col gap-1 font-mono">
        <p>KNOWLEDGE GRAPH BUILDER &copy; 2026 — Senior Full-Stack NLP Engine Implementation</p>
        <p>RE-COMPILING INTERACTIVE STAGES — DIRECT GRAPH DATA STRUCTURE MAPPING</p>
      </footer>
    </div>
  );
}
