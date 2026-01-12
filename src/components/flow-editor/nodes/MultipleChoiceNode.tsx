'use client';

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { List, ChevronDown, ChevronUp } from 'lucide-react';
import type { FormNodeData } from '@/types';

export default memo(function MultipleChoiceNode({ data }: NodeProps) {
  const nodeData = data as FormNodeData;
  const options = nodeData?.options || ['Option 1', 'Option 2'];
  const [isCollapsed, setIsCollapsed] = useState(nodeData.collapsed ?? true);
  const isHighlighted = nodeData.highlighted;
  
  return (
    <div className={`w-[250px] px-4 py-3 rounded-lg border-2 bg-card shadow-sm border-purple-500 transition-all ${
      isHighlighted ? 'ring-4 ring-blue-400 ring-opacity-75 animate-pulse' : ''
    }`}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
      />
      
      {/* Header - Always Visible */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
          <List className="h-3 w-3 text-white" />
        </div>
        <div className="font-medium text-sm flex-1">Multiple Choice</div>
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
      
      {/* Collapsed Summary */}
      {isCollapsed && (
        <div className="text-xs text-muted-foreground truncate">
          {options.length} options
        </div>
      )}
      
      {/* Expanded Content */}
      {!isCollapsed && (
        <>
          {nodeData.question && (
            <div className="text-xs mb-2 text-foreground break-words whitespace-normal">
              {nodeData.question}
            </div>
          )}
          
          <div className="space-y-1 mt-3">
            {options.map((option: string, index: number) => (
              <div key={index} className="relative">
                <div className="text-xs py-1 px-2 bg-muted rounded text-center break-words whitespace-normal">
                  {option}
                </div>
                <Handle 
                  type="source" 
                  position={Position.Right} 
                  id={`option-${index}`}
                  className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
                  style={{ top: `${(index + 1) * (100 / (options.length + 1))}%` }}
                />
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* Collapsed handles on the right */}
      {isCollapsed && options.map((_, index: number) => (
        <Handle 
          key={index}
          type="source" 
          position={Position.Right} 
          id={`option-${index}`}
          className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
          style={{ top: '50%' }}
        />
      ))}
    </div>
  );
});
