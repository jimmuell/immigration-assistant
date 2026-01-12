"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  AlertTriangle,
  MessageCircleQuestion,
  MessageCircle,
  Info,
  Lock,
  RefreshCw,
} from "lucide-react";
import {
  sendQuoteThreadMessage,
  markQuoteThreadMessagesAsRead,
  advanceToNextRound,
  getThreadForQuote,
} from "../quote-thread-actions";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

type MessageType =
  | "clarification_question"
  | "clarification_response"
  | "general"
  | "system_notification";

type SenderRole = "client" | "attorney" | "staff" | "system";

interface ThreadMessage {
  id: string;
  content: string;
  senderId: string;
  senderRole: string;
  messageType: string;
  piiScrubbed: boolean;
  isRead: boolean;
  clarificationRound: number;
  createdAt: Date;
}

interface ThreadInfo {
  id: string;
  state: string;
  clarificationRound: number;
  attorneyQuestionsCount: number;
  clientQuestionsCount: number;
  maxQuestionsPerRound: number;
}

interface QuoteThreadTabProps {
  screeningId: string;
  quoteRequestId: string;
  currentUserId: string;
  currentUserRole: SenderRole;
  clientName: string;
  isContactUnlocked: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteThreadTab({
  screeningId,
  quoteRequestId,
  currentUserId,
  currentUserRole,
  clientName,
  isContactUnlocked,
}: QuoteThreadTabProps) {
  const [thread, setThread] = useState<ThreadInfo | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("general");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load thread data
  useEffect(() => {
    async function loadThread() {
      setIsLoading(true);
      const result = await getThreadForQuote(quoteRequestId);
      if (result.success && result.thread && result.messages) {
        setThread(result.thread);
        setMessages(result.messages);
      }
      setIsLoading(false);
    }
    loadThread();
  }, [quoteRequestId]);

  // Mark messages as read and scroll to bottom
  useEffect(() => {
    if (!thread || messages.length === 0) return;

    // Mark unread messages as read
    const hasUnread = messages.some(
      (msg) => !msg.isRead && msg.senderId !== currentUserId
    );
    if (hasUnread) {
      markQuoteThreadMessagesAsRead(thread.id, currentUserId);
    }

    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thread, currentUserId]);

  // Calculate rate limit info
  const questionsRemaining =
    currentUserRole === "attorney"
      ? (thread?.maxQuestionsPerRound || 3) -
        (thread?.attorneyQuestionsCount || 0)
      : (thread?.maxQuestionsPerRound || 3) -
        (thread?.clientQuestionsCount || 0);

  const isRateLimited =
    messageType === "clarification_question" && questionsRemaining <= 0;

  // Send message handler
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !thread) return;
    if (thread.state !== "open") {
      toast.error("This thread is closed");
      return;
    }

    setIsSending(true);
    try {
      const result = await sendQuoteThreadMessage({
        threadId: thread.id,
        senderId: currentUserId,
        senderRole: currentUserRole,
        content: newMessage.trim(),
        messageType,
        screeningId,
      });

      if (result.success && result.message) {
        // Add new message to list
        const newMsg: ThreadMessage = {
          id: result.message.id,
          content: result.message.content,
          senderId: result.message.senderId,
          senderRole: result.message.senderRole,
          messageType: result.message.messageType,
          piiScrubbed: result.message.piiScrubbed,
          isRead: false,
          clarificationRound: result.message.clarificationRound,
          createdAt: result.message.createdAt,
        };
        setMessages((prev) => [...prev, newMsg]);
        setNewMessage("");

        // Show PII warning if content was scrubbed
        if (result.piiWarning) {
          toast.warning(result.piiWarning, { duration: 5000 });
        } else {
          toast.success("Message sent");
        }

        // Update thread counts if it was a clarification question
        if (messageType === "clarification_question" && thread) {
          setThread((prev) =>
            prev
              ? {
                  ...prev,
                  attorneyQuestionsCount:
                    currentUserRole === "attorney"
                      ? prev.attorneyQuestionsCount + 1
                      : prev.attorneyQuestionsCount,
                  clientQuestionsCount:
                    currentUserRole === "client"
                      ? prev.clientQuestionsCount + 1
                      : prev.clientQuestionsCount,
                }
              : prev
          );
        }
      } else if (result.rateLimitExceeded) {
        toast.error(result.error);
      } else {
        toast.error(result.error || "Failed to send message");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSending(false);
    }
  };

  // Advance to next round handler
  const handleAdvanceRound = async () => {
    if (!thread) return;

    setIsAdvancing(true);
    try {
      const result = await advanceToNextRound(thread.id, screeningId);
      if (result.success && result.newRound) {
        setThread((prev) =>
          prev
            ? {
                ...prev,
                clarificationRound: result.newRound!,
                attorneyQuestionsCount: 0,
                clientQuestionsCount: 0,
              }
            : prev
        );
        toast.success(`Advanced to Round ${result.newRound}`);
      } else {
        toast.error(result.error || "Failed to advance round");
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  // Keyboard handler
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get message type icon
  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case "clarification_question":
        return <MessageCircleQuestion className="h-3 w-3" />;
      case "clarification_response":
        return <MessageCircle className="h-3 w-3" />;
      case "system_notification":
        return <Info className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Get message type label
  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case "clarification_question":
        return "Question";
      case "clarification_response":
        return "Response";
      case "system_notification":
        return "System";
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Unable to load thread</p>
      </div>
    );
  }

  const isThreadClosed = thread.state !== "open";

  return (
    <div className="space-y-4">
      {/* Header with client name and contact status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Discussion with {clientName}</h3>
          {!isContactUnlocked && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              Contact Hidden
            </Badge>
          )}
        </div>
        {currentUserRole !== "client" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdvanceRound}
            disabled={isAdvancing || isThreadClosed}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isAdvancing ? "animate-spin" : ""}`}
            />
            New Round
          </Button>
        )}
      </div>

      {/* Rate limit and round info */}
      <div className="flex items-center gap-4 text-sm">
        <Badge variant="outline">Round {thread.clarificationRound}</Badge>
        {messageType === "clarification_question" && (
          <span
            className={`${
              questionsRemaining <= 1 ? "text-amber-600" : "text-muted-foreground"
            }`}
          >
            {questionsRemaining} clarification question
            {questionsRemaining !== 1 ? "s" : ""} remaining
          </span>
        )}
      </div>

      {/* Thread closed warning */}
      {isThreadClosed && (
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            This thread is closed. No new messages can be sent.
          </span>
        </div>
      )}

      {/* Messages List */}
      <div className="h-[400px] overflow-y-auto border rounded-lg p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm mt-1">
              Start the discussion about this quote
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.senderId === currentUserId;
            const isSystem = message.senderRole === "system";

            // System messages
            if (isSystem) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {message.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isCurrentUser
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  {/* Message type badge */}
                  {message.messageType !== "general" && (
                    <div className="flex items-center gap-1 mb-1">
                      <Badge
                        variant={isCurrentUser ? "secondary" : "outline"}
                        className={`text-xs gap-1 ${
                          isCurrentUser ? "bg-blue-500 text-white" : ""
                        }`}
                      >
                        {getMessageTypeIcon(message.messageType)}
                        {getMessageTypeLabel(message.messageType)}
                      </Badge>
                    </div>
                  )}

                  {/* Message content */}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {/* PII scrubbed indicator */}
                  {message.piiScrubbed && (
                    <div
                      className={`flex items-center gap-1 mt-1 text-xs ${
                        isCurrentUser ? "text-blue-200" : "text-amber-600"
                      }`}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Contact info removed
                    </div>
                  )}

                  {/* Timestamp */}
                  <p
                    className={`text-xs mt-1 ${
                      isCurrentUser ? "text-blue-100" : "text-gray-500"
                    }`}
                    suppressHydrationWarning
                  >
                    {new Date(message.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {!isThreadClosed && (
        <div className="space-y-2">
          {/* Message type selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Message type:</span>
            <Select
              value={messageType}
              onValueChange={(value) => setMessageType(value as MessageType)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Message</SelectItem>
                <SelectItem value="clarification_question">
                  Clarification Question
                </SelectItem>
                <SelectItem value="clarification_response">
                  Clarification Response
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rate limit warning */}
          {isRateLimited && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700">
                You&apos;ve reached the limit for clarification questions this
                round. Send a general message or wait for the next round.
              </span>
            </div>
          )}

          {/* Input and send button */}
          <div className="flex gap-2">
            <Textarea
              placeholder={
                isRateLimited
                  ? "Change message type to send..."
                  : `Type your message to ${clientName}...`
              }
              value={newMessage}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNewMessage(e.target.value)
              }
              onKeyDown={handleKeyPress}
              className="flex-1 min-h-[80px]"
              disabled={isSending || isRateLimited}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !newMessage.trim() || isRateLimited}
              className="h-auto"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* PII warning notice */}
          <p className="text-xs text-muted-foreground">
            Contact information (phone, email, URLs) will be automatically
            removed from messages until a quote is accepted.
          </p>

          {/* Powered by Claude branding */}
          <div className="flex items-center justify-center gap-1.5 pt-2 text-xs text-muted-foreground/70">
            <span>PII protection powered by</span>
            <span className="font-medium text-muted-foreground">Claude</span>
          </div>
        </div>
      )}

      {/* Powered by Claude branding for closed threads */}
      {isThreadClosed && (
        <div className="flex items-center justify-center gap-1.5 pt-4 text-xs text-muted-foreground/70">
          <span>PII protection powered by</span>
          <span className="font-medium text-muted-foreground">Claude</span>
        </div>
      )}
    </div>
  );
}
