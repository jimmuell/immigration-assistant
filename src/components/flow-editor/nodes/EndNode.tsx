'use client';

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Square, ChevronDown, ChevronUp } from 'lucide-react';
import type { FormNodeData } from '@/types';

export default memo(function EndNode({ data }: NodeProps) {
  const nodeData = data as FormNodeData;
  const [isCollapsed, setIsCollapsed] = useState(nodeData.collapsed ?? true);
  const isHighlighted = nodeData.highlighted;
  
  return (
    <div className={`w-[250px] px-4 py-3 rounded-lg border-2 bg-card shadow-sm border-red-500 transition-all ${
      isHighlighted ? 'ring-4 ring-blue-400 ring-opacity-75 animate-pulse' : ''
    }`}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
      />
      
      {/* Header - Always Visible */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
          <Square className="h-3 w-3 text-white fill-white" />
        </div>
        <div className="font-medium text-sm flex-1">End</div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex-shrink-0 p-0.5 hover:bg-muted rounded transition-colors"
          aria-label={isCollapsed ? "Expand node" : "Collapse node"}
        >
          {isCollapsed ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      </div>
      
      {/* Expanded Content */}
      {!isCollapsed && nodeData.label && (
        <div className="text-xs text-muted-foreground mt-1 break-words whitespace-normal">{nodeData.label}</div>
      )}
    </div>
  );
});
