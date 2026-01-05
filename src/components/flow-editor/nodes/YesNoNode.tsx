'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HelpCircle } from 'lucide-react';
import type { FormNodeData } from '@/types';

export default memo(function YesNoNode({ data }: NodeProps) {
  const nodeData = data as FormNodeData;
  return (
    <div className="px-4 py-3 rounded-lg border-2 bg-card min-w-[200px] shadow-sm border-blue-500">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <HelpCircle className="h-3 w-3 text-white" />
        </div>
        <div className="font-medium text-sm">Yes/No Question</div>
      </div>
      
      {nodeData.question && (
        <div className="text-xs mb-2 text-foreground">{nodeData.question}</div>
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
    </div>
  );
});
