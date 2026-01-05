'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FlowRenderer } from '@/components/flow-renderer';
import { Card } from '@/components/ui/card';

interface FlowPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowMarkdown: string;
  flowId: string;
  flowName: string;
}

export function FlowPreviewModal({
  open,
  onOpenChange,
  flowMarkdown,
  flowId,
  flowName,
}: FlowPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Interactive Flow Preview</DialogTitle>
          <DialogDescription>
            Test your flow as users will experience it
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <FlowRenderer 
            markdown={flowMarkdown}
            flowId={flowId}
            flowName={flowName}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
