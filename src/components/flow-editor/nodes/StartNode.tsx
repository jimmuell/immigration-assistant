'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';
import type { FormNodeData } from '@/types';

export default memo(function StartNode({ data }: NodeProps) {
  const nodeData = data as FormNodeData;
  const isHighlighted = nodeData.highlighted;
  
  return (
    <div className={`w-[250px] px-4 py-3 rounded-lg border-2 bg-card shadow-sm border-green-500 transition-all ${
      isHighlighted ? 'ring-4 ring-blue-400 ring-opacity-75 animate-pulse' : ''
    }`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <Play className="h-3 w-3 text-white fill-white" />
        </div>
        <div className="font-medium text-sm">Start</div>
      </div>
      {nodeData.label && (
        <div className="text-xs text-muted-foreground mt-1 break-words whitespace-normal">{nodeData.label}</div>
      )}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
      />
    </div>
  );
});
