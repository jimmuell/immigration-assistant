"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  XCircle,
  Undo2,
  AlertCircle,
  History,
} from "lucide-react";
import { type CounterOfferWithDetails } from "@/lib/counteroffer-service";

interface CounterOfferHistoryProps {
  counterOffers: CounterOfferWithDetails[];
  originalAmount: number;
  currentUserRole: "client" | "attorney";
  currentUserId: string;
  onRespond?: (id: string, action: "accept" | "reject", note?: string) => void;
  onWithdraw?: (id: string) => void;
  isProcessing?: boolean;
}

export function CounterOfferHistory({
  counterOffers,
  originalAmount,
  currentUserRole,
  currentUserId,
  onRespond,
  onWithdraw,
  isProcessing = false,
}: CounterOfferHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (counterOffers.length === 0) {
    return null;
  }

  // Group by negotiation round
  const rounds = counterOffers.reduce((acc, offer) => {
    const round = offer.negotiationRound;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(offer);
    return acc;
  }, {} as Record<number, CounterOfferWithDetails[]>);

  const roundNumbers = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => b - a); // Newest first

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3 text-yellow-600" />;
      case "accepted":
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case "rejected":
        return <XCircle className="h-3 w-3 text-red-600" />;
      case "withdrawn":
        return <Undo2 className="h-3 w-3 text-gray-600" />;
      case "expired":
        return <AlertCircle className="h-3 w-3 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "accepted":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Show collapsed summary
  const CollapsedView = () => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          Negotiation History ({counterOffers.length} counteroffer
          {counterOffers.length !== 1 ? "s" : ""})
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="text-blue-600"
      >
        <ChevronDown className="h-4 w-4 mr-1" />
        Show History
      </Button>
    </div>
  );

  // Show expanded timeline
  const ExpandedView = () => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Negotiation History</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="text-blue-600"
        >
          <ChevronUp className="h-4 w-4 mr-1" />
          Collapse
        </Button>
      </div>

      <div className="space-y-4">
        {roundNumbers.map((round) => (
          <div key={round} className="relative">
            {/* Round Header */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                Round {round}
              </Badge>
            </div>

            {/* Timeline for this round */}
            <div className="space-y-2 pl-4 border-l-2 border-gray-200">
              {rounds[round].map((offer) => {
                const isInitiator = offer.initiatorId === currentUserId;
                const canRespond = !isInitiator && offer.status === "pending";
                const canWithdraw = isInitiator && offer.status === "pending";

                return (
                  <div
                    key={offer.id}
                    className="relative pl-4 pb-2"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                      {getStatusIcon(offer.status)}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {offer.initiatorRole === "attorney" ? "Attorney" : "Client"}
                          </span>
                          <Badge className={`text-xs ${getStatusColor(offer.status)}`}>
                            {offer.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {offer.proposedAmount && (
                        <div className="mt-1">
                          <span className="text-lg font-semibold" suppressHydrationWarning>
                            ${offer.proposedAmount.toLocaleString()}
                          </span>
                          {offer.proposedAmount !== originalAmount && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({offer.proposedAmount > originalAmount ? "+" : ""}
                              {(
                                ((offer.proposedAmount - originalAmount) / originalAmount) *
                                100
                              ).toFixed(1)}
                              %)
                            </span>
                          )}
                        </div>
                      )}

                      {offer.reason && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {offer.reason}
                        </p>
                      )}

                      {offer.responseNote && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          Response: {offer.responseNote}
                        </p>
                      )}

                      {/* Actions for pending offers */}
                      {(canRespond || canWithdraw) && (
                        <div className="flex gap-2 mt-2">
                          {canRespond && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                onClick={() => onRespond?.(offer.id, "accept")}
                                disabled={isProcessing}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => onRespond?.(offer.id, "reject")}
                                disabled={isProcessing}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {canWithdraw && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => onWithdraw?.(offer.id)}
                              disabled={isProcessing}
                            >
                              Withdraw
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  return isExpanded ? <ExpandedView /> : <CollapsedView />;
}
