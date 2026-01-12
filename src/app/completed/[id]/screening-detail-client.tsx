"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Calendar, FileText, UserCheck, MessageSquare, DollarSign, Send, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessagesTab } from "../../attorney/screenings/[id]/tabs/messages-tab";
import { DocumentsTab } from "../../attorney/screenings/[id]/tabs/documents-tab";
import { useState } from "react";
import { acceptQuote, declineQuote } from "./actions";
import { submitForReview } from "../actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Response {
  question: string;
  answer: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: Date;
  senderName: string | null;
  senderEmail: string | null;
}

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  documentType: string | null;
  description: string | null;
  createdAt: Date;
  uploadedBy: string;
  uploaderName: string | null;
  uploaderEmail: string | null;
}

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

interface Screening {
  id: string;
  flowName: string;
  submissionId: string;
  responses: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  assignedAttorneyId: string | null;
  attorneyName: string | null;
  attorneyEmail: string | null;
}

interface ScreeningDetailClientProps {
  screening: Screening;
  messages: Message[];
  documents: Document[];
  quote: Quote | null;
  clientId: string;
}

export default function ScreeningDetailClient({ 
  screening, 
  messages, 
  documents, 
  quote, 
  clientId 
}: ScreeningDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const [activeTab, setActiveTab] = useState("responses");
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  let responses: Response[] = [];
  try {
    responses = JSON.parse(screening.responses);
  } catch (error) {
    console.error('Error parsing responses:', error);
  }

  const unreadMessages = messages.filter(
    (msg) => !msg.isRead && msg.receiverId === clientId
  ).length;

  const handleAcceptQuote = async () => {
    if (!quote) return;
    
    setIsProcessing(true);
    setShowAcceptDialog(false);
    
    try {
      const result = await acceptQuote(quote.id, screening.id);
      
      if (result.success) {
        toast.success('Quote accepted successfully! You are now a client of this attorney.');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to accept quote');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineQuote = async () => {
    if (!quote) return;
    
    setIsProcessing(true);
    setShowDeclineDialog(false);
    
    try {
      const result = await declineQuote(quote.id, screening.id);
      
      if (result.success) {
        toast.success('Quote declined');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to decline quote');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReleaseToAttorneys = async () => {
    setIsProcessing(true);
    setShowReleaseDialog(false);
    
    try {
      const result = await submitForReview(screening.id);
      
      if (result.success) {
        toast.success('Screening released to attorneys for review');
        router.push('/released'); // Redirect to Released tab
      } else {
        toast.error(result.error || 'Failed to release screening');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'awaiting_client':
        return 'bg-orange-100 text-orange-700';
      case 'quoted':
        return 'bg-purple-100 text-purple-700';
      case 'quote_accepted':
        return 'bg-green-100 text-green-700';
      case 'reviewed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 pb-20 md:pb-0">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(from === 'quotes' ? '/my-quotes' : '/completed')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {from === 'quotes' ? 'Back to My Quotes' : 'Back to Completed'}
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{screening.flowName}</h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>ID: {screening.submissionId}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(screening.createdAt)}</span>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(screening.status)}`}>
                  {screening.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            {!screening.isLocked && (
              <Button
                onClick={() => setShowReleaseDialog(true)}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="mr-2 h-4 w-4" />
                Release to Attorneys
              </Button>
            )}
          </div>
        </div>

        {/* Attorney Assignment Info */}
        {screening.assignedAttorneyId && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-medium">
                {screening.attorneyName?.charAt(0) || 'A'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <p className="font-semibold text-blue-900">Assigned Attorney</p>
                </div>
                <p className="text-sm text-blue-700">
                  {screening.attorneyName || screening.attorneyEmail}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Quote Display */}
        {quote && (
          <Card className="p-6 mb-6 border-purple-200 bg-purple-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-900" suppressHydrationWarning>${quote.amount.toLocaleString()}</p>
                  <p className="text-sm text-purple-700">Service Quote</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                quote.status === 'accepted' 
                  ? 'bg-green-100 text-green-700' 
                  : quote.status === 'declined'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
              </span>
            </div>
            {quote.description && (
              <p className="text-sm text-purple-800 mb-3">{quote.description}</p>
            )}
            {quote.status === 'pending' && (
              <div className="flex gap-2 pt-3 border-t border-purple-200">
                <Button 
                  size="sm" 
                  className="flex-1 bg-green-600 hover:bg-green-700" 
                  onClick={() => setShowAcceptDialog(true)}
                  disabled={isProcessing}
                >
                  Accept Quote
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" 
                  onClick={() => setShowDeclineDialog(true)}
                  disabled={isProcessing}
                >
                  Decline
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Tabbed Content */}
        <Card className="p-6">
          {screening.assignedAttorneyId ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="responses">
                  <FileText className="h-4 w-4 mr-2" />
                  Responses
                </TabsTrigger>
                <TabsTrigger value="messages">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                  {unreadMessages > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <FileText className="h-4 w-4 mr-2" />
                  Documents
                  {documents.length > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">({documents.length})</span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="responses">
                <div className="space-y-6">
                  {responses.map((response, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="mb-2 flex items-start gap-2">
                        <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{response.question}</h3>
                          <p className="mt-2 text-gray-700">{response.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="messages">
                <MessagesTab
                  screeningId={screening.id}
                  clientId={clientId}
                  attorneyId={screening.assignedAttorneyId!}
                  messages={messages}
                />
              </TabsContent>

              <TabsContent value="documents">
                <DocumentsTab
                  screeningId={screening.id}
                  documents={documents}
                  userRole="client"
                />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3 border-b pb-4">
                <div className="rounded-full bg-green-100 p-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Screening Responses</h2>
                  <p className="text-sm text-gray-600">
                    Review your answers to the screening questions
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {responses.map((response, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="mb-2 flex items-start gap-2">
                      <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{response.question}</h3>
                        <p className="mt-2 text-gray-700">{response.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {!screening.assignedAttorneyId && (
          <Card className="mt-6 bg-blue-50 border-blue-200 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Next Steps</h3>
                <p className="mt-1 text-sm text-blue-700">
                  Your screening has been saved. Our team will review your responses and assign an attorney to assist you.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Accept Quote Dialog */}
      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Quote?</AlertDialogTitle>
            <AlertDialogDescription>
              By accepting this quote, you agree to work with this attorney and will be assigned to their organization. 
              The attorney will begin working on your case.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAcceptQuote}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Processing...' : 'Accept Quote'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline Quote Dialog */}
      <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Quote?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to decline this quote? The attorney will be notified of your decision.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeclineQuote}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'Processing...' : 'Decline Quote'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Release to Attorneys Dialog */}
      <AlertDialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release to Attorneys?</AlertDialogTitle>
            <AlertDialogDescription>
              Once released, you will not be able to edit your responses. Your screening will be locked 
              and sent to our attorneys for review. Make sure all your information is correct before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReleaseToAttorneys}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing ? 'Releasing...' : 'Release to Attorneys'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
