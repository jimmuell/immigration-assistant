"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

interface DocumentsTabProps {
  screeningId: string;
  documents: Document[];
  userRole: "attorney" | "client";
}

export function DocumentsTab({ screeningId, documents, userRole }: DocumentsTabProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documents</h3>
        <Button size="sm" disabled>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No documents uploaded yet</p>
          <p className="text-sm mt-1">Documents uploaded by you or the client will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{doc.fileName}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>•</span>
                    <span suppressHydrationWarning>
                      {new Date(doc.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })}
                    </span>
                    <span>•</span>
                    <span>by {doc.uploaderName || doc.uploaderEmail}</span>
                  </div>
                  {doc.description && (
                    <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" disabled>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Document upload and download functionality requires file storage configuration (e.g., Vercel Blob, AWS S3). This feature is currently in development.
        </p>
      </div>
    </div>
  );
}
