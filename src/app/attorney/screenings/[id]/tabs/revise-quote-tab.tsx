"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Edit3, RefreshCw, ArrowUp, ArrowDown, History, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  reviseQuoteAction,
  getCounterOfferHistoryAction,
} from "../counteroffer-actions";
import { type CounterOfferWithDetails } from "@/lib/counteroffer-service";

interface Quote {
  id: string;
  amount: number;
  status: string;
  description?: string | null;
  currency?: string;
  originalAmount?: number | null;
}

interface ReviseQuoteTabProps {
  screeningId: string;
  quoteRequestId: string;
  quote: Quote;
  attorneyId: string;
}

export function ReviseQuoteTab({
  screeningId,
  quoteRequestId,
  quote,
  attorneyId,
}: ReviseQuoteTabProps) {
  const [revisionHistory, setRevisionHistory] = useState<CounterOfferWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state - pre-filled with current quote values
  const [proposedAmount, setProposedAmount] = useState(quote.amount.toString());
  const [description, setDescription] = useState(quote.description || "");
  const [reason, setReason] = useState("");

  const parsedAmount = parseFloat(proposedAmount) || 0;
  const amountDiff = parsedAmount - quote.amount;
  const percentChange = quote.amount > 0 ? (amountDiff / quote.amount) * 100 : 0;

  // Load revision history
  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const result = await getCounterOfferHistoryAction(quoteRequestId);
      if (result.success) {
        setRevisionHistory(result.history || []);
      }
    } catch (error) {
      console.error("Error loading revision history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [quoteRequestId]);

  // Reset form to current quote values
  const resetForm = () => {
    setProposedAmount(quote.amount.toString());
    setDescription(quote.description || "");
    setReason("");
  };

  // Handle opening the form
  const handleOpenForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // Handle submitting the revision
  const handleSubmitRevision = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the revision");
      return;
    }

    // Check if anything actually changed
    const amountChanged = parsedAmount !== quote.amount;
    const descriptionChanged = description.trim() !== (quote.description || "");

    if (!amountChanged && !descriptionChanged) {
      toast.error("No changes detected. Please modify the amount or description.");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await reviseQuoteAction({
        quoteRequestId,
        screeningId,
        newAmount: amountChanged ? parsedAmount : undefined,
        newDescription: descriptionChanged ? description.trim() : undefined,
        reason: reason.trim(),
      });

      if (result.success) {
        toast.success("Quote updated. Client has been notified.");
        setIsFormOpen(false);
        await loadHistory();
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to update quote");
      }
    } catch (error) {
      console.error("Error updating quote:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Edit3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Revise Quote</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadHistory}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Current Quote Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Current Quote</p>
              <p className="text-2xl font-bold" suppressHydrationWarning>
                ${quote.amount.toLocaleString()}
              </p>
              {/* Revision indicator */}
              {quote.originalAmount && quote.originalAmount !== quote.amount && (
                <p className="text-sm text-blue-600 flex items-center gap-1" suppressHydrationWarning>
                  <Edit3 className="h-3 w-3" />
                  Revised from ${quote.originalAmount.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <Badge
            className={`${
              quote.status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : quote.status === "accepted"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
          </Badge>
        </div>
        {quote.description && (
          <p className="text-sm text-muted-foreground mt-2">{quote.description}</p>
        )}
      </Card>

      {/* Make Quote Changes Button */}
      {quote.status === "pending" && !isFormOpen && (
        <Button
          onClick={handleOpenForm}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Make Quote Changes
        </Button>
      )}

      {/* Revision Form */}
      {isFormOpen && (
        <Card className="p-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Make Quote Changes</h4>
            <p className="text-sm text-muted-foreground">
              Make changes to your quote. The client will be notified of the update.
            </p>

            {/* Amount */}
            <div>
              <Label htmlFor="proposedAmount">Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="proposedAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={proposedAmount}
                  onChange={(e) => setProposedAmount(e.target.value)}
                  className="pl-10"
                />
              </div>
              {amountDiff !== 0 && (
                <div className="flex items-center gap-1 mt-1 text-sm">
                  {amountDiff > 0 ? (
                    <ArrowUp className="h-3 w-3 text-red-500" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-green-500" />
                  )}
                  <span className={amountDiff > 0 ? "text-red-600" : "text-green-600"}>
                    ${Math.abs(amountDiff).toLocaleString()} ({percentChange > 0 ? "+" : ""}
                    {percentChange.toFixed(1)}%)
                  </span>
                  <span className="text-muted-foreground">
                    from current ${quote.amount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description / Scope of Work</Label>
              <Textarea
                id="description"
                placeholder="Describe what's included in this quote..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Reason for change (Required) */}
            <div>
              <Label htmlFor="reason">Reason for Update *</Label>
              <Textarea
                id="reason"
                placeholder="Explain why you're updating this quote (e.g., 'Per our discussion, reducing fee by $100')..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required - This will be visible to the client
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleSubmitRevision}
                disabled={isProcessing || !reason.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isProcessing ? "Updating..." : "Make Quote Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Revision History */}
      {revisionHistory.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-muted-foreground">
              Revision History
            </h4>
          </div>
          <div className="space-y-2">
            {revisionHistory.map((revision) => (
              <Card key={revision.id} className="p-3 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    {revision.proposedAmount && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">
                          ${revision.proposedAmount.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          (was ${quote.amount.toLocaleString()})
                        </span>
                      </div>
                    )}
                    {revision.reason && (
                      <p className="text-sm text-gray-700">{revision.reason}</p>
                    )}
                    {revision.scopeChanges && (
                      <p className="text-sm text-gray-600 italic">
                        Scope: {revision.scopeChanges}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span suppressHydrationWarning>
                      {new Date(revision.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isFormOpen && revisionHistory.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Edit3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="mb-2">No revisions yet</p>
          <p className="text-sm">
            If the client requests changes via messages, you can update your quote here.
          </p>
        </div>
      )}

    </div>
  );
}
