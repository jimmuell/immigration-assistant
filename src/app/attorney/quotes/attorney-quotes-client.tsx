"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  User,
  FileText,
  AlertCircle,
  Paperclip,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AttorneyMobileNav } from "@/components/attorney-mobile-nav";

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
  rejectionApprovedBy: string | null;
  rejectionApprovedAt: string | null;
  createdAt: string;
  updatedAt: string;
  clientName: string | null;
  clientEmail: string;
  clientId: string;
  flowName: string;
  submissionId: string;
  screeningStatus: string;
}

export default function AttorneyQuotesClient() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Approval confirmation dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [quoteToApprove, setQuoteToApprove] = useState<Quote | null>(null);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attorney/quotes');
      
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

  const handleApproveClick = (quote: Quote) => {
    setQuoteToApprove(quote);
    setApproveDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!quoteToApprove) return;
    
    try {
      setActionLoading(quoteToApprove.id);
      const response = await fetch(`/api/attorney/rejection-requests/${quoteToApprove.id}/approve`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve rejection request');
      }
      
      // Refresh quotes
      await fetchQuotes();
      setApproveDialogOpen(false);
      setQuoteToApprove(null);
      
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve rejection request');
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
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <XCircle className="h-3 w-3 mr-1" />
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
  const withdrawnQuotes = quotes.filter(q => q.rejectionRequestedAt && !q.rejectionApprovedAt);

  // Helper function to render quote card
  const renderQuoteCard = (quote: Quote, status: 'pending' | 'accepted' | 'declined' | 'withdrawn') => {
    const borderColor = status === 'pending' ? 'border-l-yellow-400' : 
                       status === 'accepted' ? 'border-l-green-500' : 
                       status === 'withdrawn' ? 'border-l-amber-400' : 'border-l-gray-300';
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
                <span className="font-medium">{quote.clientName || quote.clientEmail}</span>
              </div>
              <div className="text-3xl font-bold mb-3">
                <DollarSign className="h-8 w-8 inline text-current" />
                {quote.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span suppressHydrationWarning>
                    {status === 'pending' ? 'Submitted' : status === 'accepted' ? 'Accepted' : 'Declined'}{' '}
                    {new Date(status === 'accepted' ? quote.acceptedAt! : status === 'declined' ? quote.declinedAt! : quote.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                {quote.description && status !== 'declined' && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Paperclip className="h-4 w-4" />
                    <span>1 attachment</span>
                  </div>
                )}
                {status === 'pending' && quote.expiresAt && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Timeline: 1-2 weeks</span>
                  </div>
                )}
              </div>
            </div>
            <div className="sm:shrink-0">
              <Link href={`/attorney/screenings/${quote.screeningId}?from=quotes`}>
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

          {status === 'withdrawn' && quote.rejectionRequestReason && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-amber-900 mb-1">Rejection Request</h4>
                  <p className="text-sm text-amber-700 mb-2">
                    Client requested to undo acceptance on{' '}
                    <span suppressHydrationWarning>
                      {new Date(quote.rejectionRequestedAt!).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </p>
                  <div className="bg-white p-3 rounded border border-amber-200 mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                    <p className="text-sm text-gray-600">{quote.rejectionRequestReason}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      onClick={() => handleApproveClick(quote)}
                      disabled={actionLoading === quote.id}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Rejection
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `mailto:${quote.clientEmail}`}
                    >
                      Contact Client
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pb-24 md:pb-6">
        <AttorneyMobileNav />
        <div className="container mx-auto p-6 md:pt-8">
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
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pb-24 md:pb-6">
        <AttorneyMobileNav />
        <div className="container mx-auto p-6 md:pt-8">
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

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pb-24 md:pb-6">
      <AttorneyMobileNav />
      <div className="container mx-auto p-6 md:pt-8 space-y-6">
        <DashboardHeader
          title="My Quotes"
          subtitle="Track and manage quotes you've submitted to clients"
          icon={<DollarSign className="h-8 w-8 text-blue-600" />}
        />

        {/* No Quotes State */}
        {quotes.length === 0 ? (
          <Card className="p-6 bg-white">
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">No quotes yet</p>
              <p className="text-sm">Quotes you submit to clients will appear here</p>
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
              <TabsTrigger value="withdrawn">
                Withdrawn ({withdrawnQuotes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {quotes.map((quote) => {
                const status = quote.rejectionRequestedAt && !quote.rejectionApprovedAt ? 'withdrawn' :
                              quote.status === 'pending' && !isExpired(quote) ? 'pending' : 
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
                    <p className="text-sm">Quotes awaiting client response will appear here</p>
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
                    <p className="text-sm">Quotes accepted by clients will appear here</p>
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
                    <p className="text-sm">Quotes declined by clients will appear here</p>
                  </div>
                </Card>
              ) : (
                declinedQuotes.map((quote) => renderQuoteCard(quote, 'declined'))
              )}
            </TabsContent>

            <TabsContent value="withdrawn" className="space-y-3">
              {withdrawnQuotes.length === 0 ? (
                <Card className="p-6 bg-white">
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg mb-2">No withdrawal requests</p>
                    <p className="text-sm">Clients requesting to undo acceptance will appear here</p>
                  </div>
                </Card>
              ) : (
                withdrawnQuotes.map((quote) => renderQuoteCard(quote, 'withdrawn'))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Approve Rejection Request
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                You are about to approve the client&apos;s request to undo the quote acceptance for{' '}
                <strong className="text-blue-600">
                  {quoteToApprove?.currency} {quoteToApprove?.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </p>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <p className="text-sm font-medium text-amber-900 mb-1">This will:</p>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                  <li>Change the quote status to &quot;declined&quot;</li>
                  <li>Unassign you from this screening</li>
                  <li>Disconnect the client from your organization</li>
                  <li>Allow the client to accept other quotes</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Client&apos;s reason:</p>
                <p className="text-sm text-blue-800 italic">&quot;{quoteToApprove?.rejectionRequestReason}&quot;</p>
              </div>
              <p className="text-sm">
                Are you sure you want to approve this rejection request?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setApproveDialogOpen(false)}
              disabled={actionLoading === quoteToApprove?.id}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApproveConfirm}
              disabled={actionLoading === quoteToApprove?.id}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading === quoteToApprove?.id ? 'Processing...' : 'Yes, Approve Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
