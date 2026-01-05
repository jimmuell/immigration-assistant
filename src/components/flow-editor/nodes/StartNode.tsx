'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';
import type { FormNodeData } from '@/types';

export default memo(function StartNode({ data }: NodeProps) {
  const nodeData = data as FormNodeData;
  return (
    <div className="px-4 py-3 rounded-lg border-2 bg-card min-w-[180px] shadow-sm border-green-500">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <Play className="h-3 w-3 text-white fill-white" />
        </div>
        <div className="font-medium text-sm">Start</div>
      </div>
      {nodeData.label && (
        <div className="text-xs text-muted-foreground mt-1">{nodeData.label}</div>
      )}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
      />
    </div>
  );
});
