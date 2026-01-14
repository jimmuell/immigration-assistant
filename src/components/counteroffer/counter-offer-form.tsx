"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { DollarSign, ArrowUp, ArrowDown, X } from "lucide-react";

interface CounterOfferFormData {
  proposedAmount?: number;
  scopeChanges?: string;
  scopeAdditions?: string[];
  scopeRemovals?: string[];
  reason: string;
  expiresAt?: Date;
}

interface CounterOfferFormProps {
  originalAmount: number;
  currentUserRole: "client" | "attorney";
  onSubmit: (data: CounterOfferFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CounterOfferForm({
  originalAmount,
  currentUserRole,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CounterOfferFormProps) {
  const [proposedAmount, setProposedAmount] = useState(originalAmount.toString());
  const [scopeChanges, setScopeChanges] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [scopeAddition, setScopeAddition] = useState("");
  const [scopeAdditions, setScopeAdditions] = useState<string[]>([]);
  const [scopeRemoval, setScopeRemoval] = useState("");
  const [scopeRemovals, setScopeRemovals] = useState<string[]>([]);

  const parsedAmount = parseFloat(proposedAmount) || 0;
  const amountDiff = parsedAmount - originalAmount;
  const percentChange = originalAmount > 0 ? (amountDiff / originalAmount) * 100 : 0;

  const handleAddScopeAddition = () => {
    if (scopeAddition.trim()) {
      setScopeAdditions([...scopeAdditions, scopeAddition.trim()]);
      setScopeAddition("");
    }
  };

  const handleRemoveScopeAddition = (index: number) => {
    setScopeAdditions(scopeAdditions.filter((_, i) => i !== index));
  };

  const handleAddScopeRemoval = () => {
    if (scopeRemoval.trim()) {
      setScopeRemovals([...scopeRemovals, scopeRemoval.trim()]);
      setScopeRemoval("");
    }
  };

  const handleRemoveScopeRemoval = (index: number) => {
    setScopeRemovals(scopeRemovals.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      return;
    }

    onSubmit({
      proposedAmount: parsedAmount !== originalAmount ? parsedAmount : undefined,
      scopeChanges: scopeChanges.trim() || undefined,
      scopeAdditions: scopeAdditions.length > 0 ? scopeAdditions : undefined,
      scopeRemovals: scopeRemovals.length > 0 ? scopeRemovals : undefined,
      reason: reason.trim(),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Make a Counteroffer</h3>
        <p className="text-sm text-muted-foreground">
          {currentUserRole === "client"
            ? "Propose a different amount or request scope changes to the attorney's quote."
            : "Counter the client's proposal with your terms."}
        </p>

        {/* Proposed Amount */}
        <div>
          <Label htmlFor="proposedAmount">Proposed Amount (USD)</Label>
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
              <span className="text-muted-foreground">from original ${originalAmount.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Reason (Required) */}
        <div>
          <Label htmlFor="reason">Reason for Counteroffer *</Label>
          <Textarea
            id="reason"
            placeholder="Explain why you're proposing these changes..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">Required field</p>
        </div>

        {/* Scope Changes */}
        <div>
          <Label htmlFor="scopeChanges">Scope Changes (Optional)</Label>
          <Textarea
            id="scopeChanges"
            placeholder="Describe any changes to the scope of work..."
            value={scopeChanges}
            onChange={(e) => setScopeChanges(e.target.value)}
            rows={2}
          />
        </div>

        {/* Scope Additions */}
        <div>
          <Label>Services to Add (Optional)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a service..."
              value={scopeAddition}
              onChange={(e) => setScopeAddition(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddScopeAddition();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleAddScopeAddition}>
              Add
            </Button>
          </div>
          {scopeAdditions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {scopeAdditions.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-sm"
                >
                  + {item}
                  <button
                    type="button"
                    onClick={() => handleRemoveScopeAddition(i)}
                    className="hover:text-green-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scope Removals */}
        <div>
          <Label>Services to Remove (Optional)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Remove a service..."
              value={scopeRemoval}
              onChange={(e) => setScopeRemoval(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddScopeRemoval();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleAddScopeRemoval}>
              Add
            </Button>
          </div>
          {scopeRemovals.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {scopeRemovals.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md text-sm"
                >
                  - {item}
                  <button
                    type="button"
                    onClick={() => handleRemoveScopeRemoval(i)}
                    className="hover:text-red-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiration Date */}
        <div>
          <Label htmlFor="expiresAt">Counteroffer Expiration (Optional)</Label>
          <Input
            id="expiresAt"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? "Submitting..." : "Submit Counteroffer"}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}
