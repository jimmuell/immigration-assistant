"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, FileText, UserCheck, MessageSquare, DollarSign, FlaskConical, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessagesTab } from "../../attorney/screenings/[id]/tabs/messages-tab";
import { DocumentsTab } from "../../attorney/screenings/[id]/tabs/documents-tab";
import { useState } from "react";

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
  isTestMode: boolean;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  assignedAttorneyId: string | null;
  attorneyName: string | null;
  attorneyEmail: string | null;
}

interface TestScreeningDetailClientProps {
  screening: Screening;
  messages: Message[];
  documents: Document[];
  quote: Quote | null;
  userId: string;
}

export default function TestScreeningDetailClient({ 
  screening, 
  messages, 
  documents, 
  quote, 
  userId 
}: TestScreeningDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("responses");

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
    (msg) => !msg.isRead && msg.receiverId === userId
  ).length;

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
            onClick={() => router.push('/test-screenings')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Test Screenings
          </Button>

          {/* Test Mode Warning Banner */}
          <Card className="mb-4 bg-amber-50 border-2 border-amber-300 p-4">
            <div className="flex items-start gap-3">
              <FlaskConical className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Test Mode Active
                </h3>
                <p className="mt-1 text-sm text-amber-800">
                  This is a test screening and cannot be released to attorneys. It should be deleted once testing is complete.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{screening.flowName}</h1>
                <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-900 uppercase">
                  TEST
                </span>
              </div>
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
                  <p className="text-sm text-purple-700">Service Quote (Test)</p>
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
                  clientId={userId}
                  attorneyId={screening.assignedAttorneyId!}
                  messages={messages}
                />
              </TabsContent>

              <TabsContent value="documents">
                <DocumentsTab
                  screeningId={screening.id}
                  documents={documents}
                  userRole="admin"
                />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3 border-b pb-4">
                <div className="rounded-full bg-amber-100 p-2">
                  <FlaskConical className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Test Screening Responses</h2>
                  <p className="text-sm text-gray-600">
                    Review the test responses to the screening questions
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

        <Card className="mt-6 bg-blue-50 border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <FlaskConical className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Test Screening Information</h3>
              <p className="mt-1 text-sm text-blue-700">
                This is a test screening for flow validation. Remember to delete it once you're done testing 
                to keep the system clean. Test screenings cannot be released to attorneys.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
