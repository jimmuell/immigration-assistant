'use client';

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { FormNodeData } from '@/types';

export default memo(function YesNoNode({ data }: NodeProps) {
  const nodeData = data as FormNodeData;
  const [isCollapsed, setIsCollapsed] = useState(nodeData.collapsed ?? true);
  const isHighlighted = nodeData.highlighted;
  
  return (
    <div className={`w-[250px] px-4 py-3 rounded-lg border-2 bg-card shadow-sm border-blue-500 transition-all ${
      isHighlighted ? 'ring-4 ring-blue-400 ring-opacity-75 animate-pulse' : ''
    }`}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      
      {/* Header - Always Visible */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <HelpCircle className="h-3 w-3 text-white" />
        </div>
        <div className="font-medium text-sm flex-1">Yes/No Question</div>
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
      
      {/* Collapsible Content */}
      {!isCollapsed && (
        <>
          {nodeData.question && (
            <div className="text-xs mb-2 text-foreground break-words whitespace-normal">
              {nodeData.question}
            </div>
          )}
          
          <div className="flex gap-2 mt-3">
            <div className="flex-1 text-center">
              <div className="text-xs font-medium text-green-600">Yes</div>
              <Handle 
                type="source" 
                position={Position.Bottom} 
                id="yes"
                className="!w-3 !h-3 !bg-green-500 !border-2 !border-white !relative !transform-none !left-1/2 !-translate-x-1/2 !top-2"
              />
            </div>
            <div className="flex-1 text-center">
              <div className="text-xs font-medium text-red-600">No</div>
              <Handle 
                type="source" 
                position={Position.Bottom} 
                id="no"
                className="!w-3 !h-3 !bg-red-500 !border-2 !border-white !relative !transform-none !left-1/2 !-translate-x-1/2 !top-2"
              />
            </div>
          </div>
        </>
      )}
      
      {/* When collapsed, show handles at bottom */}
      {isCollapsed && (
        <>
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="yes"
            className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
            style={{ left: '33%' }}
          />
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="no"
            className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
            style={{ left: '66%' }}
          />
        </>
      )}
    </div>
  );
});
