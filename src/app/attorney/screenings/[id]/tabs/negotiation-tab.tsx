"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Scale, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { CounterOfferCard } from "@/components/counteroffer/counter-offer-card";
import { CounterOfferForm } from "@/components/counteroffer/counter-offer-form";
import { CounterOfferHistory } from "@/components/counteroffer/counter-offer-history";
import {
  submitCounterOfferAction,
  respondToCounterOfferAction,
  withdrawCounterOfferAction,
  getActiveCounterOfferAction,
  getCounterOfferHistoryAction,
} from "../counteroffer-actions";
import { type QuoteCounterOffer } from "@/lib/db/schema";
import { type CounterOfferWithDetails } from "@/lib/counteroffer-service";

interface Quote {
  id: string;
  amount: number;
  status: string;
  description?: string | null;
}

interface NegotiationTabProps {
  screeningId: string;
  quoteRequestId: string;
  quote: Quote;
  currentUserId: string;
  currentUserRole: "client" | "attorney";
}

export function NegotiationTab({
  screeningId,
  quoteRequestId,
  quote,
  currentUserId,
  currentUserRole,
}: NegotiationTabProps) {
  const [activeCounterOffer, setActiveCounterOffer] = useState<QuoteCounterOffer | null>(null);
  const [counterOfferHistory, setCounterOfferHistory] = useState<CounterOfferWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load counteroffer data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [activeResult, historyResult] = await Promise.all([
        getActiveCounterOfferAction(quoteRequestId),
        getCounterOfferHistoryAction(quoteRequestId),
      ]);

      if (activeResult.success) {
        setActiveCounterOffer(activeResult.counterOffer || null);
      }
      if (historyResult.success) {
        setCounterOfferHistory(historyResult.history || []);
      }
    } catch (error) {
      console.error("Error loading counteroffer data:", error);
      toast.error("Failed to load negotiation data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [quoteRequestId]);

  // Handle creating a counteroffer
  const handleSubmitCounterOffer = async (data: {
    proposedAmount?: number;
    scopeChanges?: string;
    scopeAdditions?: string[];
    scopeRemovals?: string[];
    reason: string;
    expiresAt?: Date;
  }) => {
    setIsProcessing(true);
    try {
      const result = await submitCounterOfferAction({
        quoteRequestId,
        screeningId,
        ...data,
      });

      if (result.success) {
        toast.success("Counteroffer submitted successfully");
        setIsFormOpen(false);
        await loadData();
      } else {
        toast.error(result.error || "Failed to submit counteroffer");
      }
    } catch (error) {
      console.error("Error submitting counteroffer:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle responding to a counteroffer
  const handleRespond = async (action: "accept" | "reject", note?: string) => {
    if (!activeCounterOffer) return;

    setIsProcessing(true);
    try {
      const result = await respondToCounterOfferAction(
        activeCounterOffer.id,
        action,
        note,
        screeningId
      );

      if (result.success) {
        toast.success(
          action === "accept"
            ? "Counteroffer accepted! Quote amount has been updated."
            : "Counteroffer rejected."
        );
        await loadData();
      } else {
        toast.error(result.error || `Failed to ${action} counteroffer`);
      }
    } catch (error) {
      console.error("Error responding to counteroffer:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle withdrawing a counteroffer
  const handleWithdraw = async () => {
    if (!activeCounterOffer) return;

    setIsProcessing(true);
    try {
      const result = await withdrawCounterOfferAction(activeCounterOffer.id, screeningId);

      if (result.success) {
        toast.success("Counteroffer withdrawn");
        await loadData();
      } else {
        toast.error(result.error || "Failed to withdraw counteroffer");
      }
    } catch (error) {
      console.error("Error withdrawing counteroffer:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle responding from history
  const handleHistoryRespond = async (
    id: string,
    action: "accept" | "reject",
    note?: string
  ) => {
    setIsProcessing(true);
    try {
      const result = await respondToCounterOfferAction(id, action, note, screeningId);

      if (result.success) {
        toast.success(action === "accept" ? "Counteroffer accepted!" : "Counteroffer rejected.");
        await loadData();
      } else {
        toast.error(result.error || `Failed to ${action} counteroffer`);
      }
    } catch (error) {
      console.error("Error responding to counteroffer:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle withdrawing from history
  const handleHistoryWithdraw = async (id: string) => {
    setIsProcessing(true);
    try {
      const result = await withdrawCounterOfferAction(id, screeningId);

      if (result.success) {
        toast.success("Counteroffer withdrawn");
        await loadData();
      } else {
        toast.error(result.error || "Failed to withdraw counteroffer");
      }
    } catch (error) {
      console.error("Error withdrawing counteroffer:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  // Can make counteroffer check
  const canMakeCounterOffer =
    quote.status === "pending" && !activeCounterOffer && !isFormOpen;

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
          <Scale className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Quote Negotiation</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadData}
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

      {/* Make Counteroffer Button */}
      {canMakeCounterOffer && (
        <Button
          onClick={() => setIsFormOpen(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Make a Counteroffer
        </Button>
      )}

      {/* Counteroffer Form */}
      {isFormOpen && (
        <CounterOfferForm
          originalAmount={quote.amount}
          currentUserRole={currentUserRole}
          onSubmit={handleSubmitCounterOffer}
          onCancel={() => setIsFormOpen(false)}
          isSubmitting={isProcessing}
        />
      )}

      {/* Active Counteroffer */}
      {activeCounterOffer && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Active Counteroffer
          </h4>
          <CounterOfferCard
            counterOffer={activeCounterOffer as CounterOfferWithDetails}
            originalAmount={quote.amount}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            onRespond={handleRespond}
            onWithdraw={handleWithdraw}
            isProcessing={isProcessing}
            isActive={true}
          />
        </div>
      )}

      {/* Negotiation History */}
      {counterOfferHistory.length > 0 && (
        <CounterOfferHistory
          counterOffers={counterOfferHistory}
          originalAmount={quote.amount}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
          onRespond={handleHistoryRespond}
          onWithdraw={handleHistoryWithdraw}
          isProcessing={isProcessing}
        />
      )}

      {/* Empty State */}
      {!activeCounterOffer && counterOfferHistory.length === 0 && !isFormOpen && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Scale className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="mb-2">No counteroffers yet</p>
          <p className="text-sm">
            {currentUserRole === "client"
              ? "If you'd like to propose different terms, click the button above to make a counteroffer."
              : "The client can make a counteroffer if they'd like to negotiate the quote."}
          </p>
        </div>
      )}
    </div>
  );
}
