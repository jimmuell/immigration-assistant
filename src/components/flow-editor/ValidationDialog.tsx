'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle, Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  nodeId?: string;
  nodeLabel?: string;
}

interface ValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: ValidationError[];
  onConfirmSave?: () => void;
  onConfirmPreview?: () => void;
  onNodeClick?: (nodeId: string) => void;
  isSaving?: boolean;
  mode?: 'save' | 'preview';
}

export function ValidationDialog({
  open,
  onOpenChange,
  errors,
  onConfirmSave,
  onConfirmPreview,
  onNodeClick,
  isSaving = false,
  mode = 'save',
}: ValidationDialogProps) {
  const errorCount = errors.filter(e => e.type === 'error').length;
  const warningCount = errors.filter(e => e.type === 'warning').length;
  const hasErrors = errorCount > 0;
  const isPreviewMode = mode === 'preview';

  const handleNodeClick = (nodeId: string) => {
    if (onNodeClick) {
      onNodeClick(nodeId);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasErrors ? (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                {isPreviewMode ? 'Cannot Preview Flow' : 'Cannot Save Flow'}
              </>
            ) : errors.length > 0 ? (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Flow Has Warnings
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Flow is Valid
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {hasErrors ? (
              <>
                {isPreviewMode 
                  ? 'Please fix the following errors before previewing your flow.' 
                  : 'Please fix the following errors before saving your flow.'}
              </>
            ) : errors.length > 0 ? (
              <>
                {isPreviewMode 
                  ? 'The flow has warnings. You can preview it, but it may not work properly for users until these issues are fixed.' 
                  : 'The flow has warnings but can still be saved.'}
              </>
            ) : (
              <>
                {isPreviewMode 
                  ? 'Your flow is valid and ready to be previewed.' 
                  : 'Your flow is valid and ready to be saved.'}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {errors.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {errorCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  <AlertTriangle className="h-3 w-3" />
                  {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
                </Badge>
              )}
            </div>

            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-2">
                {errors.map((error, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 p-3 rounded-lg border ${
                      error.type === 'error'
                        ? 'bg-destructive/5 border-destructive/20'
                        : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-900/30'
                    } ${
                      error.nodeId ? 'cursor-pointer hover:bg-opacity-80 transition-colors' : ''
                    }`}
                    onClick={() => error.nodeId && handleNodeClick(error.nodeId)}
                  >
                    {error.type === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{error.message}</p>
                      {error.nodeLabel && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span>Node: {error.nodeLabel}</span>
                          {error.nodeId && (
                            <>
                              <span className="text-muted-foreground/50">•</span>
                              <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                {error.nodeId}
                              </code>
                              <span className="text-muted-foreground/50">•</span>
                              <span className="text-blue-600 dark:text-blue-400 text-[10px] font-medium">
                                Click to navigate
                              </span>
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {hasErrors ? 'Fix Errors' : 'Cancel'}
          </Button>
          {!hasErrors && isPreviewMode && onConfirmPreview && (
            <Button
              onClick={onConfirmPreview}
              disabled={isSaving}
            >
              Preview Anyway
            </Button>
          )}
          {!hasErrors && !isPreviewMode && onConfirmSave && (
            <Button
              onClick={onConfirmSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Flow'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Unsaved Changes
          </DialogTitle>
          <DialogDescription>
            You have unsaved changes. Are you sure you want to leave? All unsaved changes will be lost.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
          >
            Leave Without Saving
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
