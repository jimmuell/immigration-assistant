"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  XCircle,
  Undo2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { type CounterOfferWithDetails } from "@/lib/counteroffer-service";

interface CounterOfferCardProps {
  counterOffer: CounterOfferWithDetails;
  originalAmount: number;
  currentUserRole: "client" | "attorney";
  currentUserId: string;
  onRespond?: (action: "accept" | "reject", note?: string) => void;
  onWithdraw?: () => void;
  isProcessing?: boolean;
  isActive?: boolean;
}

export function CounterOfferCard({
  counterOffer,
  originalAmount,
  currentUserRole,
  currentUserId,
  onRespond,
  onWithdraw,
  isProcessing = false,
  isActive = false,
}: CounterOfferCardProps) {
  const [showDetails, setShowDetails] = useState(isActive);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const isInitiator = counterOffer.initiatorId === currentUserId;
  const canRespond = !isInitiator && counterOffer.status === "pending";
  const canWithdraw = isInitiator && counterOffer.status === "pending";

  const amountDiff = counterOffer.proposedAmount
    ? counterOffer.proposedAmount - originalAmount
    : 0;
  const percentChange = originalAmount > 0 ? (amountDiff / originalAmount) * 100 : 0;

  const getStatusBadge = () => {
    switch (counterOffer.status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "withdrawn":
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            <Undo2 className="h-3 w-3 mr-1" />
            Withdrawn
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            <AlertCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case "superseded":
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            Superseded
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleAccept = () => {
    onRespond?.("accept");
  };

  const handleReject = () => {
    if (showRejectDialog) {
      onRespond?.("reject", rejectNote || undefined);
      setShowRejectDialog(false);
      setRejectNote("");
    } else {
      setShowRejectDialog(true);
    }
  };

  return (
    <Card className={`p-4 ${isActive ? "border-blue-500 border-2" : ""}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {counterOffer.initiatorRole === "attorney" ? "Attorney" : "Client"} Counteroffer
            </span>
            <span className="text-xs text-muted-foreground">
              Round {counterOffer.negotiationRound}
            </span>
          </div>
          {getStatusBadge()}
        </div>

        {/* Amount */}
        {counterOffer.proposedAmount && (
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-2xl font-bold" suppressHydrationWarning>
                ${counterOffer.proposedAmount.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 text-sm">
                {amountDiff !== 0 && (
                  <>
                    {amountDiff > 0 ? (
                      <ArrowUp className="h-3 w-3 text-red-500" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-green-500" />
                    )}
                    <span
                      className={amountDiff > 0 ? "text-red-600" : "text-green-600"}
                    >
                      ${Math.abs(amountDiff).toLocaleString()} (
                      {percentChange > 0 ? "+" : ""}
                      {percentChange.toFixed(1)}%)
                    </span>
                    <span className="text-muted-foreground">from original</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reason */}
        {counterOffer.reason && (
          <div className="text-sm">
            <span className="font-medium">Reason: </span>
            <span className="text-muted-foreground">{counterOffer.reason}</span>
          </div>
        )}

        {/* Expandable Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          {showDetails ? (
            <>
              <ChevronUp className="h-4 w-4" /> Hide details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" /> Show details
            </>
          )}
        </button>

        {showDetails && (
          <div className="space-y-2 pt-2 border-t text-sm">
            {/* Scope Changes */}
            {counterOffer.scopeChanges && (
              <div>
                <span className="font-medium">Scope Changes: </span>
                <span className="text-muted-foreground">{counterOffer.scopeChanges}</span>
              </div>
            )}

            {/* Scope Additions */}
            {counterOffer.scopeAdditions && counterOffer.scopeAdditions.length > 0 && (
              <div>
                <span className="font-medium">Add: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {counterOffer.scopeAdditions.map((item, i) => (
                    <Badge key={i} variant="outline" className="bg-green-50 text-green-700">
                      + {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Scope Removals */}
            {counterOffer.scopeRemovals && counterOffer.scopeRemovals.length > 0 && (
              <div>
                <span className="font-medium">Remove: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {counterOffer.scopeRemovals.map((item, i) => (
                    <Badge key={i} variant="outline" className="bg-red-50 text-red-700">
                      - {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Response Note */}
            {counterOffer.responseNote && (
              <div>
                <span className="font-medium">Response Note: </span>
                <span className="text-muted-foreground">{counterOffer.responseNote}</span>
              </div>
            )}

            {/* Expiration */}
            {counterOffer.expiresAt && (
              <div className="text-muted-foreground" suppressHydrationWarning>
                Expires: {new Date(counterOffer.expiresAt).toLocaleDateString()}
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground pt-2" suppressHydrationWarning>
              Created: {new Date(counterOffer.createdAt).toLocaleString()}
              {counterOffer.respondedAt && (
                <> | Responded: {new Date(counterOffer.respondedAt).toLocaleString()}</>
              )}
            </div>
          </div>
        )}

        {/* Reject Note Input */}
        {showRejectDialog && (
          <div className="pt-2 border-t">
            <label className="text-sm font-medium">Reason for rejection (optional):</label>
            <textarea
              className="w-full mt-1 p-2 border rounded-md text-sm"
              rows={2}
              placeholder="Explain why you're rejecting this counteroffer..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          </div>
        )}

        {/* Actions */}
        {(canRespond || canWithdraw) && (
          <div className="flex gap-2 pt-2 border-t">
            {canRespond && (
              <>
                <Button
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  {isProcessing ? "Processing..." : "Accept"}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isProcessing}
                  variant={showRejectDialog ? "default" : "outline"}
                  className={`flex-1 ${showRejectDialog ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
                  size="sm"
                >
                  {showRejectDialog ? "Confirm Reject" : "Reject"}
                </Button>
                {showRejectDialog && (
                  <Button
                    onClick={() => {
                      setShowRejectDialog(false);
                      setRejectNote("");
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    Cancel
                  </Button>
                )}
              </>
            )}
            {canWithdraw && (
              <Button
                onClick={onWithdraw}
                disabled={isProcessing}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                {isProcessing ? "Processing..." : "Withdraw Counteroffer"}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
