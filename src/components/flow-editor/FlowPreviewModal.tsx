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
  userRole?: string;
}

export function FlowPreviewModal({
  open,
  onOpenChange,
  flowMarkdown,
  flowId,
  flowName,
  userRole,
}: FlowPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Interactive Flow Preview</DialogTitle>
          <DialogDescription>
            Test your flow as users will experience it. Screenings from draft or inactive flows are automatically marked as test mode.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <FlowRenderer 
            markdown={flowMarkdown}
            flowId={flowId}
            flowName={flowName}
            userRole={userRole}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
