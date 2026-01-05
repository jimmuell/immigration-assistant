"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { sendMessage, markMessagesAsRead } from "../actions";
import { toast } from "sonner";

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

interface MessagesTabProps {
  screeningId: string;
  clientId: string;
  attorneyId: string;
  messages: Message[];
}

export function MessagesTab({
  screeningId,
  clientId,
  attorneyId,
  messages: initialMessages,
}: MessagesTabProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mark unread messages as read
    const unreadMessageIds = messages
      .filter((msg) => !msg.isRead && msg.receiverId === attorneyId)
      .map((msg) => msg.id);

    if (unreadMessageIds.length > 0) {
      markMessagesAsRead(unreadMessageIds);
    }

    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, attorneyId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const result = await sendMessage({
        screeningId,
        senderId: attorneyId,
        receiverId: clientId,
        content: newMessage.trim(),
      });

      if (result.success && result.message) {
        // Add the new message with sender info
        const newMsg: Message = {
          ...result.message,
          senderName: null,
          senderEmail: null,
        };
        setMessages((prev) => [...prev, newMsg]);
        setNewMessage("");
        toast.success("Message sent");
      } else {
        toast.error(result.error || "Failed to send message");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Messages with Client</h3>
      
      {/* Messages List */}
      <div className="h-[400px] overflow-y-auto border rounded-lg p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message) => {
            const isAttorney = message.senderId === attorneyId;
            return (
              <div
                key={message.id}
                className={`flex ${isAttorney ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isAttorney
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isAttorney ? 'text-blue-100' : 'text-gray-500'
                    }`}
                    suppressHydrationWarning
                  >
                    {new Date(message.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
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
      <div className="flex gap-2">
        <Textarea
          placeholder="Type your message to the client..."
          value={newMessage}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 min-h-[80px]"
          disabled={isSending}
        />
        <Button
          onClick={handleSendMessage}
          disabled={isSending || !newMessage.trim()}
          className="h-auto"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
