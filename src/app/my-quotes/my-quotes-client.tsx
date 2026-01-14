"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClientMobileNav } from "@/components/client-mobile-nav";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

interface Quote {
  id: string;
  screeningId: string;
  amount: number;
  currency: string;
  description: string | null;
  expiresAt: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  acceptedAt: string | null;
  declinedAt: string | null;
  rejectionRequestReason: string | null;
  rejectionRequestedAt: string | null;
  createdAt: string;
  updatedAt: string;
  attorneyName: string | null;
  attorneyEmail: string;
  flowName: string;
  submissionId: string;
}

export default function MyQuotesClient() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Accept confirmation dialog
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [quoteToAccept, setQuoteToAccept] = useState<Quote | null>(null);
  
  // Decline confirmation dialog
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [quoteToDecline, setQuoteToDecline] = useState<Quote | null>(null);
  
  // Rejection request dialog
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [quoteToReject, setQuoteToReject] = useState<Quote | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/client/quotes');
      
      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }
      
      const data = await response.json();
      setQuotes(data.quotes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleAcceptClick = (quote: Quote) => {
    setQuoteToAccept(quote);
    setAcceptDialogOpen(true);
  };

  const handleAcceptConfirm = async () => {
    if (!quoteToAccept) return;
    
    try {
      setActionLoading(quoteToAccept.id);
      const response = await fetch(`/api/client/quotes/${quoteToAccept.id}/accept`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept quote');
      }
      
      // Refresh quotes
      await fetchQuotes();
      setAcceptDialogOpen(false);
      setQuoteToAccept(null);
      
      // Show success message or redirect
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to accept quote');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineClick = (quote: Quote) => {
    setQuoteToDecline(quote);
    setDeclineDialogOpen(true);
  };

  const handleDeclineConfirm = async () => {
    if (!quoteToDecline) return;
    
    try {
      setActionLoading(quoteToDecline.id);
      const response = await fetch(`/api/client/quotes/${quoteToDecline.id}/decline`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to decline quote');
      }
      
      // Refresh quotes
      await fetchQuotes();
      setDeclineDialogOpen(false);
      setQuoteToDecline(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to decline quote');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestRejectionClick = (quote: Quote) => {
    setQuoteToReject(quote);
    setRejectionReason("");
    setRejectionDialogOpen(true);
  };

  const handleRequestRejectionConfirm = async () => {
    if (!quoteToReject) return;
    
    if (rejectionReason.trim().length < 10) {
      alert('Please provide a detailed reason (at least 10 characters)');
      return;
    }
    
    try {
      setActionLoading(quoteToReject.id);
      const response = await fetch(`/api/client/quotes/${quoteToReject.id}/request-rejection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rejection request');
      }
      
      // Refresh quotes
      await fetchQuotes();
      setRejectionDialogOpen(false);
      setQuoteToReject(null);
      setRejectionReason("");
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit rejection request');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (quote: Quote) => {
    switch (quote.status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case 'declined':
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <XCircle className="h-3 w-3 mr-1" />
            Declined
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
    }
  };

  const isExpired = (quote: Quote) => {
    if (!quote.expiresAt) return false;
    return new Date(quote.expiresAt) < new Date();
  };

  const pendingQuotes = quotes.filter(q => q.status === 'pending' && !isExpired(q));
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted');
  const declinedQuotes = quotes.filter(q => q.status === 'declined' || isExpired(q));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 md:pb-6">
        <ClientMobileNav />
        <div className="container mx-auto p-6 md:pt-8 space-y-6">
          <DashboardHeader title="Quotes Received" />
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
              <p className="text-muted-foreground">Loading your quotes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 md:pb-6">
        <ClientMobileNav />
        <div className="container mx-auto p-6 md:pt-8 space-y-6">
          <DashboardHeader title="Quotes Received" />
          <Card className="p-6 bg-white">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <p className="text-lg font-medium text-red-600 mb-2">Error loading quotes</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchQuotes}>Retry</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Helper function to render quote card
  const renderQuoteCard = (quote: Quote, status: 'pending' | 'accepted' | 'declined') => {
    const borderColor = status === 'pending' ? 'border-l-yellow-400' : status === 'accepted' ? 'border-l-green-500' : 'border-l-gray-300';
    const bgColor = status === 'declined' ? 'bg-gray-50 opacity-75' : 'bg-white';
    
    return (
      <Card key={quote.id} className={`p-6 ${bgColor} border-l-4 ${borderColor}`}>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className={`font-semibold text-base sm:text-lg ${status === 'declined' ? 'text-gray-700' : ''}`}>{quote.flowName}</h3>
                {getStatusBadge(quote)}
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Flat Fee</Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <User className="h-4 w-4" />
                <span className="font-medium">{quote.attorneyName || quote.attorneyEmail}</span>
              </div>
              <div className="text-3xl font-bold mb-3">
                <DollarSign className="h-8 w-8 inline text-current" />
                {quote.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span suppressHydrationWarning>
                    {status === 'pending' ? 'Received' : status === 'accepted' ? 'Accepted' : 'Declined'}{' '}
                    {new Date(status === 'accepted' ? quote.acceptedAt! : status === 'declined' ? quote.declinedAt! : quote.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                {quote.expiresAt && status === 'pending' && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Timeline: 1-2 weeks</span>
                  </div>
                )}
              </div>
            </div>
            <div className="sm:shrink-0">
              <Link href={`/screenings/${quote.screeningId}?from=quotes`}>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  View Screening
                </Button>
              </Link>
            </div>
          </div>

          {quote.description && status !== 'declined' && (
            <div className="text-sm text-muted-foreground">
              {quote.description}
            </div>
          )}
          
          {status === 'pending' && (
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={() => handleAcceptClick(quote)}
                disabled={actionLoading === quote.id}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Quote
              </Button>
              <Button 
                onClick={() => handleDeclineClick(quote)}
                disabled={actionLoading === quote.id}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>
          )}
          
          {status === 'accepted' && (
            quote.rejectionRequestedAt ? (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-amber-900 mb-1">Rejection Request Submitted</h4>
                    <p className="text-sm text-amber-700 mb-2">
                      You submitted a request to undo this acceptance on{' '}
                      <span suppressHydrationWarning>
                        {new Date(quote.rejectionRequestedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </p>
                    {quote.rejectionRequestReason && (
                      <div className="bg-white p-3 rounded border border-amber-200">
                        <p className="text-sm font-medium text-gray-700 mb-1">Your reason:</p>
                        <p className="text-sm text-gray-600">{quote.rejectionRequestReason}</p>
                      </div>
                    )}
                    <p className="text-sm text-amber-700 mt-2">
                      The attorney will review your request and contact you. For urgent matters, please reach out directly.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-1">Quote Accepted</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      You&apos;ve committed to working with this attorney. If you made a mistake or need to cancel, 
                      you can request to undo this acceptance, but it will require attorney approval.
                    </p>
                    <Button
                      onClick={() => handleRequestRejectionClick(quote)}
                      disabled={actionLoading === quote.id}
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Request to Undo Acceptance
                    </Button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 md:pb-6">
      <ClientMobileNav />
      <div className="container mx-auto p-6 md:pt-8 space-y-6">
        <DashboardHeader
          title="Quotes Received"
          subtitle="Review and respond to quotes from attorneys"
        />

        {/* No Quotes State */}
        {quotes.length === 0 ? (
          <Card className="p-6 bg-white">
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">No quotes yet</p>
              <p className="text-sm">When attorneys send you quotes, they will appear here</p>
            </div>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">
                All ({quotes.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingQuotes.length})
              </TabsTrigger>
              <TabsTrigger value="accepted">
                Accepted ({acceptedQuotes.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({declinedQuotes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {quotes.map((quote) => {
                const status = quote.status === 'pending' && !isExpired(quote) ? 'pending' : 
                              quote.status === 'accepted' ? 'accepted' : 'declined';
                return renderQuoteCard(quote, status);
              })}
            </TabsContent>

            <TabsContent value="pending" className="space-y-3">
              {pendingQuotes.length === 0 ? (
                <Card className="p-6 bg-white">
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg mb-2">No pending quotes</p>
                    <p className="text-sm">Pending quotes will appear here</p>
                  </div>
                </Card>
              ) : (
                pendingQuotes.map((quote) => renderQuoteCard(quote, 'pending'))
              )}
            </TabsContent>

            <TabsContent value="accepted" className="space-y-3">
              {acceptedQuotes.length === 0 ? (
                <Card className="p-6 bg-white">
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg mb-2">No accepted quotes</p>
                    <p className="text-sm">Quotes you accept will appear here</p>
                  </div>
                </Card>
              ) : (
                acceptedQuotes.map((quote) => renderQuoteCard(quote, 'accepted'))
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-3">
              {declinedQuotes.length === 0 ? (
                <Card className="p-6 bg-white">
                  <div className="text-center py-12 text-muted-foreground">
                    <XCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg mb-2">No rejected quotes</p>
                    <p className="text-sm">Quotes you decline will appear here</p>
                  </div>
                </Card>
              ) : (
                declinedQuotes.map((quote) => renderQuoteCard(quote, 'declined'))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Accept Confirmation Dialog */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Confirm Quote Acceptance
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2" asChild>
              <div>
                <span className="block">
                  You are about to accept this quote for{' '}
                  <strong className="text-blue-600">
                    {quoteToAccept?.currency} {quoteToAccept?.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </span>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  <span className="text-sm font-medium text-amber-900 mb-1 block">Important:</span>
                  <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                    <li>By accepting, you commit to working with this attorney</li>
                    <li>All other pending quotes will be automatically declined</li>
                    <li>Once accepted, you cannot freely cancel without attorney approval</li>
                    <li>You can request to undo this, but it requires attorney review</li>
                  </ul>
                </div>
                <span className="text-sm block">
                  Are you sure you want to proceed?
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAcceptDialogOpen(false)}
              disabled={actionLoading === quoteToAccept?.id}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAcceptConfirm}
              disabled={actionLoading === quoteToAccept?.id}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading === quoteToAccept?.id ? 'Processing...' : 'Yes, Accept Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Confirmation Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Quote</DialogTitle>
            <DialogDescription className="space-y-2 pt-2" asChild>
              <div>
                <span className="block">
                  Are you sure you want to decline this quote from{' '}
                  <strong>{quoteToDecline?.attorneyName || quoteToDecline?.attorneyEmail}</strong>?
                </span>
                <span className="text-sm text-muted-foreground block">
                  This action will notify the attorney that you&apos;ve declined their quote.
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeclineDialogOpen(false)}
              disabled={actionLoading === quoteToDecline?.id}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeclineConfirm}
              disabled={actionLoading === quoteToDecline?.id}
              variant="destructive"
            >
              {actionLoading === quoteToDecline?.id ? 'Processing...' : 'Yes, Decline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Request to Undo Acceptance
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2" asChild>
              <div>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  <span className="text-sm font-medium text-amber-900 mb-1 block">Please Note:</span>
                  <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                    <li>This request will be sent to the attorney for review</li>
                    <li>The attorney may have already started work on your case</li>
                    <li>You may be responsible for any work already completed</li>
                    <li>The attorney will contact you to discuss your request</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Please explain why you need to undo this acceptance (minimum 10 characters):
                  </label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="E.g., I made a mistake and meant to accept a different quote, or my circumstances have changed..."
                    rows={4}
                    className="w-full"
                  />
                  <span className="text-xs text-muted-foreground block">
                    {rejectionReason.length} / 10 characters minimum
                  </span>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRejectionDialogOpen(false);
                setRejectionReason("");
              }}
              disabled={actionLoading === quoteToReject?.id}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRequestRejectionConfirm}
              disabled={actionLoading === quoteToReject?.id || rejectionReason.trim().length < 10}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {actionLoading === quoteToReject?.id ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
