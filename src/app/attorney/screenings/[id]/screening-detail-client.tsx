"use client";

/**
 * Attorney Screening Detail Client Component
 * Provides tabbed interface for viewing screening responses, messaging, documents, and quotes
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, FileText, DollarSign, ClipboardList } from "lucide-react";
import { MessagesTab } from "./tabs/messages-tab";
import { DocumentsTab } from "./tabs/documents-tab";
import { QuoteTab } from "./tabs/quote-tab";
import { ResponsesTab } from "./tabs/responses-tab";

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

interface ScreeningDetailClientProps {
  screeningId: string;
  clientId: string;
  attorneyId: string;
  responses: Response[];
  messages: Message[];
  documents: Document[];
  quote: Quote | null;
  status: string;
}

export default function ScreeningDetailClient({
  screeningId,
  clientId,
  attorneyId,
  responses,
  messages,
  documents,
  quote,
  status,
}: ScreeningDetailClientProps) {
  const [activeTab, setActiveTab] = useState("responses");

  const unreadMessages = messages.filter(
    (msg) => !msg.isRead && msg.receiverId === attorneyId
  ).length;

  return (
    <Card className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="responses" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Responses</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Messages</span>
            {unreadMessages > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadMessages}
              </span>
            )}
          </TabsTrigger>
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
        </TabsList>

        <TabsContent value="responses">
          <ResponsesTab responses={responses} />
        </TabsContent>

        <TabsContent value="messages">
          <MessagesTab
            screeningId={screeningId}
            clientId={clientId}
            attorneyId={attorneyId}
            messages={messages}
          />
        </TabsContent>

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
      </Tabs>
    </Card>
  );
}
