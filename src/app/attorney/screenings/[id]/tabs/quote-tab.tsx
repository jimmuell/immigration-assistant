"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { DollarSign, Calendar, CheckCircle, Clock } from "lucide-react";
import { submitQuote } from "../actions";
import { toast } from "sonner";

interface Quote {
  id: string;
  amount: number;
  currency: string;
  description: string | null;
  notes: string | null;
  expiresAt: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface QuoteTabProps {
  screeningId: string;
  clientId: string;
  quote: Quote | null;
  status: string;
}

export function QuoteTab({ screeningId, clientId, quote, status }: QuoteTabProps) {
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitQuote({
        screeningId,
        amount: parseFloat(amount),
        description: description.trim() || null,
        notes: notes.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });

      if (result.success) {
        toast.success("Quote submitted successfully");
        setIsCreatingQuote(false);
        // Optionally refresh the page or update state
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to submit quote");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (quote) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Service Quote</h3>
        
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-3xl font-bold" suppressHydrationWarning>${quote.amount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{quote.currency}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                quote.status === 'accepted' 
                  ? 'bg-green-100 text-green-700' 
                  : quote.status === 'declined'
                  ? 'bg-red-100 text-red-700'
                  : quote.status === 'expired'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {quote.status === 'accepted' && <CheckCircle className="h-4 w-4 inline mr-1" />}
                {quote.status === 'pending' && <Clock className="h-4 w-4 inline mr-1" />}
                {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
              </div>
            </div>

            {quote.description && (
              <div>
                <Label className="text-sm font-semibold">Services Included:</Label>
                <p className="text-sm text-gray-700 mt-1">{quote.description}</p>
              </div>
            )}

            {quote.notes && (
              <div>
                <Label className="text-sm font-semibold">Internal Notes:</Label>
                <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-3 rounded">{quote.notes}</p>
              </div>
            )}

            {quote.expiresAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span suppressHydrationWarning>
                  Expires on {new Date(quote.expiresAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            )}

            <div className="text-xs text-muted-foreground pt-2 border-t" suppressHydrationWarning>
              Created on {new Date(quote.createdAt).toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (isCreatingQuote) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Create Service Quote</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Quote Amount (USD) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Services Included</Label>
            <Textarea
              id="description"
              placeholder="Describe the services included in this quote..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="notes">Internal Notes (Not visible to client)</Label>
            <Textarea
              id="notes"
              placeholder="Add any internal notes about this quote..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSubmitQuote} 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Quote"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsCreatingQuote(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Service Quote</h3>
      
      <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
        <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="mb-4">No quote has been created yet</p>
        <Button onClick={() => setIsCreatingQuote(true)}>
          Create Quote
        </Button>
      </div>
    </div>
  );
}
