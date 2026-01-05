'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { List } from 'lucide-react';
import type { FormNodeData } from '@/types';

export default memo(function MultipleChoiceNode({ data }: NodeProps) {
  const nodeData = data as FormNodeData;
  const options = nodeData?.options || ['Option 1', 'Option 2'];
  
  return (
    <div className="px-4 py-3 rounded-lg border-2 bg-card min-w-[220px] shadow-sm border-purple-500">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
      />
      
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
          <List className="h-3 w-3 text-white" />
        </div>
        <div className="font-medium text-sm">Multiple Choice</div>
      </div>
      
      {nodeData.question && (
        <div className="text-xs mb-2 text-foreground">{nodeData.question}</div>
      )}
      
      <div className="space-y-1 mt-3">
        {options.map((option: string, index: number) => (
          <div key={index} className="relative">
            <div className="text-xs py-1 px-2 bg-muted rounded text-center">
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
    </div>
  );
});
