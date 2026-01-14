"use client";

/**
 * Attorney Screening Detail Client Component
 * Provides tabbed interface for viewing screening responses, messaging, documents, and quotes
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, FileText, DollarSign, ClipboardList, Edit3 } from "lucide-react";
import { DocumentsTab } from "./tabs/documents-tab";
import { QuoteTab } from "./tabs/quote-tab";
import { ResponsesTab } from "./tabs/responses-tab";
import { QuoteThreadTab } from "./tabs/quote-thread-tab";
import { ReviseQuoteTab } from "./tabs/revise-quote-tab";

interface Response {
  question: string;
  answer: string;
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
  isContactUnlocked?: boolean;
  originalAmount?: number | null;
}

interface ScreeningDetailClientProps {
  screeningId: string;
  clientId: string;
  clientName: string;
  attorneyId: string;
  responses: Response[];
  documents: Document[];
  quote: Quote | null;
  status: string;
}

export default function ScreeningDetailClient({
  screeningId,
  clientId,
  clientName,
  attorneyId,
  responses,
  documents,
  quote,
  status,
}: ScreeningDetailClientProps) {
  const [activeTab, setActiveTab] = useState("responses");

  // Show messages tab only when a quote exists (PII-protected messaging)
  const showMessagesTab = !!quote;
  // Show revise quote tab when quote exists and is pending (attorney-only)
  const showReviseTab = !!quote && quote.status === 'pending';

  // Calculate grid columns based on visible tabs
  // Use explicit class names so Tailwind can detect them at build time
  const getGridCols = () => {
    const cols = 3 + (showMessagesTab ? 1 : 0) + (showReviseTab ? 1 : 0);
    // Map to explicit Tailwind classes
    const colsMap: Record<number, string> = {
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
    };
    return colsMap[cols] || 'grid-cols-3';
  };

  return (
    <Card className="p-6">
      <Tabs id={`attorney-screening-tabs-${screeningId}`} value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full mb-6 ${getGridCols()}`}>
          <TabsTrigger value="responses" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Responses</span>
          </TabsTrigger>
          {showMessagesTab && (
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
            {documents.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">({documents.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="quote" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Quote</span>
            {quote && (
              <span className="ml-1 text-xs text-green-600">✓</span>
            )}
          </TabsTrigger>
          {showReviseTab && (
            <TabsTrigger value="revise" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              <span className="hidden sm:inline">Revise Quote</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="responses">
          <ResponsesTab responses={responses} />
        </TabsContent>

        {showMessagesTab && quote && (
          <TabsContent value="messages">
            <QuoteThreadTab
              screeningId={screeningId}
              quoteRequestId={quote.id}
              currentUserId={attorneyId}
              currentUserRole="attorney"
              clientName={clientName}
              isContactUnlocked={quote.isContactUnlocked || false}
            />
          </TabsContent>
        )}

        <TabsContent value="documents">
          <DocumentsTab
            screeningId={screeningId}
            documents={documents}
            userRole="attorney"
          />
        </TabsContent>

        <TabsContent value="quote">
          <QuoteTab
            screeningId={screeningId}
            clientId={clientId}
            quote={quote}
            status={status}
          />
        </TabsContent>

        {showReviseTab && quote && (
          <TabsContent value="revise">
            <ReviseQuoteTab
              screeningId={screeningId}
              quoteRequestId={quote.id}
              quote={{
                id: quote.id,
                amount: quote.amount,
                status: quote.status,
                description: quote.description,
                currency: quote.currency,
                originalAmount: quote.originalAmount,
              }}
              attorneyId={attorneyId}
            />
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
}
