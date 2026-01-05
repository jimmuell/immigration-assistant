'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Info } from 'lucide-react';
import type { FormNodeData } from '@/types';

export default memo(function InfoNode({ data }: NodeProps) {
  const nodeData = data as FormNodeData;
  return (
    <div className="px-4 py-3 rounded-lg border-2 bg-card min-w-[200px] shadow-sm border-yellow-500">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-yellow-500 !border-2 !border-white"
      />
      
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
          <Info className="h-3 w-3 text-white" />
        </div>
        <div className="font-medium text-sm">Info Message</div>
      </div>
      
      {nodeData.label && (
        <div className="text-xs mb-1 font-medium text-foreground">{nodeData.label}</div>
      )}
      
      {nodeData.description && (
        <div className="text-xs text-muted-foreground">{nodeData.description}</div>
      )}
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-yellow-500 !border-2 !border-white"
      />
    </div>
  );
});
