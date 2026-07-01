import React, { useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import { GraphNode, GraphEdge, TYPE_COLORS } from '../types';
import { CustomNode } from './CustomNode';
import { HelpCircle, Info, Maximize } from 'lucide-react';

const nodeTypes = {
  customNode: CustomNode,
};

interface KnowledgeGraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function KnowledgeGraphView({ nodes, edges }: KnowledgeGraphViewProps) {
  // Local state for selected items to display details
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  // Layout function to distribute nodes on a circle
  const initialLayout = useMemo(() => {
    if (nodes.length === 0) return { flowNodes: [], flowEdges: [] };

    // Set layout parameters
    const centerX = 350;
    const centerY = 280;
    const radius = Math.max(180, nodes.length * 28);
    const angleStep = (2 * Math.PI) / nodes.length;

    const flowNodes = nodes.map((node, index) => {
      const angle = index * angleStep;
      // Distribute on circle
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      return {
        id: node.id,
        type: 'customNode',
        position: { x, y },
        data: { label: node.label, type: node.type },
      };
    });

    const flowEdges = edges.map((edge, index) => {
      // Find edge colors based on source or relation
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const colors = sourceNode ? TYPE_COLORS[sourceNode.type] : TYPE_COLORS.Unknown;
      
      return {
        id: `e-${edge.source}-${edge.relation}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        label: edge.relation,
        animated: true,
        style: { stroke: colors?.accent || '#64748b', strokeWidth: 2 },
        labelStyle: { fill: '#1e293b', fontWeight: 600, fontSize: 10 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.85, stroke: '#e2e8f0', strokeWidth: 1 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: colors?.accent || '#64748b',
          width: 16,
          height: 16,
        },
      };
    });

    return { flowNodes, flowEdges };
  }, [nodes, edges]);

  // React Flow internal state
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState([]);

  // Sync internal state when nodes/edges props change
  useEffect(() => {
    setFlowNodes(initialLayout.flowNodes);
    setFlowEdges(initialLayout.flowEdges);
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [initialLayout, setFlowNodes, setFlowEdges]);

  // Click Handlers
  const onNodeClick = (_event: React.MouseEvent, node: any) => {
    const originalNode = nodes.find((n) => n.id === node.id);
    if (originalNode) {
      setSelectedNode(originalNode);
      setSelectedEdge(null);
    }
  };

  const onEdgeClick = (_event: React.MouseEvent, edge: any) => {
    const parts = edge.id.split('-'); // Format: e-source-relation-target-index
    const source = edge.source;
    const target = edge.target;
    const relation = edge.label;
    setSelectedEdge({ source, target, relation });
    setSelectedNode(null);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const resetPositions = () => {
    setFlowNodes(initialLayout.flowNodes);
    setFlowEdges(initialLayout.flowEdges);
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  // Find unique entity types in current graph for a dynamic legend
  const presentTypes = useMemo(() => {
    const types = new Set(nodes.map((n) => n.type));
    return Array.from(types);
  }, [nodes]);

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
      {/* Header Controls */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2 text-slate-700">
          <Maximize className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold">Interactive Visualization Stage</span>
          <span className="text-xs text-slate-400 font-mono">({nodes.length} nodes, {edges.length} relations)</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetPositions}
            className="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition"
            title="Reset positions to circular layout"
          >
            Reset Layout
          </button>
        </div>
      </div>

      {/* Main Canvas + Overlay panels */}
      <div className="flex-1 min-h-[480px] relative">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          id="knowledge-graph-canvas"
        >
          <Controls />
          <MiniMap
            zoomable
            pannable
            nodeColor={(node: any) => {
              const colors = TYPE_COLORS[node.data.type] || TYPE_COLORS.Unknown;
              return colors.accent;
            }}
          />
          <Background color="#cbd5e1" gap={16} />
        </ReactFlow>

        {/* Dynamic Details Panel overlay */}
        {(selectedNode || selectedEdge) && (
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-xl max-w-sm z-20 transition-all duration-300">
            {selectedNode && (
              <div>
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Node Selected</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      TYPE_COLORS[selectedNode.type]?.bg
                    } ${TYPE_COLORS[selectedNode.type]?.text}`}
                  >
                    {selectedNode.type}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{selectedNode.label}</h4>
                <p className="text-xs text-slate-500 font-mono mt-1">ID: {selectedNode.id}</p>
                <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span className="font-semibold block mb-1">Incoming / Outgoing Connections:</span>
                  <div className="space-y-1">
                    {edges
                      .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                      .map((e, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 break-words">
                          <span className={e.source === selectedNode.id ? 'font-semibold text-slate-700' : 'text-slate-400'}>
                            {nodes.find((n) => n.id === e.source)?.label}
                          </span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded font-mono font-bold">
                            {e.relation}
                          </span>
                          <span className={e.target === selectedNode.id ? 'font-semibold text-slate-700' : 'text-slate-400'}>
                            {nodes.find((n) => n.id === e.target)?.label}
                          </span>
                        </div>
                      ))}
                    {edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length === 0 && (
                      <span className="text-slate-400 italic">No relations detected for this node.</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedEdge && (
              <div>
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Relationship Selected</span>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-mono">
                    {selectedEdge.relation}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Source Node</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {nodes.find((n) => n.id === selectedEdge.source)?.label || selectedEdge.source}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">→</span>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Target Node</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {nodes.find((n) => n.id === selectedEdge.target)?.label || selectedEdge.target}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed italic">
                    Supported fact: &quot;{(nodes.find((n) => n.id === selectedEdge.source)?.label)}&quot; is in a{' '}
                    <span className="font-semibold">{selectedEdge.relation}</span> relationship with &quot;
                    {(nodes.find((n) => n.id === selectedEdge.target)?.label)}&quot;.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend Panel (Floating Left) */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200 shadow-lg max-w-[200px] z-10">
          <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Legend
          </h5>
          <div className="flex flex-col gap-1.5">
            {presentTypes.map((type) => {
              const colors = TYPE_COLORS[type] || TYPE_COLORS.Unknown;
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full border border-slate-300 shadow-sm`} style={{ backgroundColor: colors.accent }} />
                  <span className="text-xs text-slate-600 font-medium">{type}</span>
                </div>
              );
            })}
            {presentTypes.length === 0 && (
              <span className="text-xs text-slate-400 italic">No nodes present.</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Instructions Hint */}
      <div className="bg-slate-100 border-t border-slate-200 px-4 py-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
        <span>You can drag nodes around, scroll to zoom, drag background to pan, and click nodes/edges for full detail sheets.</span>
      </div>
    </div>
  );
}
