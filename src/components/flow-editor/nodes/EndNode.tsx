'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Square } from 'lucide-react';
import type { FormNodeData } from '@/types';

export default memo(function EndNode({ data }: NodeProps) {
  const nodeData = data as FormNodeData;
  return (
    <div className="px-4 py-3 rounded-lg border-2 bg-card min-w-[180px] shadow-sm border-red-500">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
          <Square className="h-3 w-3 text-white fill-white" />
        </div>
        <div className="font-medium text-sm">End</div>
      </div>
      {nodeData.label && (
        <div className="text-xs text-muted-foreground mt-1">{nodeData.label}</div>
      )}
    </div>
  );
});
