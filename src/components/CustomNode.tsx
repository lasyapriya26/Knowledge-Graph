import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { TYPE_COLORS } from '../types';

export type CustomNodeData = Node<{
  label: string;
  type: string;
  isSelected?: boolean;
}, 'customNode'>;

export const CustomNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  const colors = TYPE_COLORS[data.type] || TYPE_COLORS.Unknown;
  
  return (
    <div
      id={`node-${data.label}`}
      className={`px-4 py-2.5 rounded-lg border-2 shadow-sm transition-all duration-200 cursor-pointer text-center min-w-[120px] max-w-[200px] ${colors.bg} ${colors.border} ${
        selected ? 'ring-2 ring-indigo-500 ring-offset-1 scale-105 shadow-md border-indigo-500' : 'hover:scale-102 hover:shadow-md'
      }`}
    >
      {/* Target Handle (Input from Top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-slate-400 !border-white"
        id="target-top"
      />
      
      {/* Node Type Pill */}
      <span className={`text-[9px] font-semibold uppercase tracking-wider block mb-0.5 ${colors.text}`}>
        {data.type}
      </span>
      
      {/* Node Label */}
      <div className="text-xs font-bold text-slate-800 break-words leading-tight">
        {data.label}
      </div>

      {/* Source Handle (Output from Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-slate-400 !border-white"
        id="source-bottom"
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
