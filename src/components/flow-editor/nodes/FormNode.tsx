'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';
import type { FormNodeData } from '@/types';

export default memo(function FormNode({ data }: NodeProps) {
  const nodeData = data as FormNodeData;
  const fieldCount = nodeData.formFields?.length || 0;
  
  return (
    <div className="px-4 py-3 rounded-lg border-2 bg-card min-w-[200px] shadow-sm border-orange-500">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-orange-500 !border-2 !border-white"
      />
      
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
          <FileText className="h-3 w-3 text-white" />
        </div>
        <div className="font-medium text-sm">Form</div>
      </div>
      
      {nodeData.label && (
        <div className="text-xs mb-1 font-medium text-foreground">{nodeData.label}</div>
      )}
      
      {nodeData.description && (
        <div className="text-xs text-muted-foreground mb-2">{nodeData.description}</div>
      )}
      
      <div className="text-xs text-muted-foreground">
        {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-orange-500 !border-2 !border-white"
      />
    </div>
  );
});
