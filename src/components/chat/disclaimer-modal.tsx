"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenDisclaimer = localStorage.getItem("hasSeenDisclaimer");
    if (!hasSeenDisclaimer) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("hasSeenDisclaimer", "true");
      setIsOpen(false);
    } catch (error) {
      // If localStorage fails, just close the modal
      console.error("Failed to save disclaimer preference:", error);
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        // Close if clicking the backdrop
        if (e.target === e.currentTarget) {
          handleAccept();
        }
      }}
    >
      <Card className="mx-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={handleAccept}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors touch-manipulation"
          type="button"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
        <CardHeader className="pr-12">
          <CardTitle className="text-2xl font-bold text-blue-900">
            Important Legal Notice
          </CardTitle>
          <CardDescription className="text-base">
            Please read carefully before continuing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm text-gray-700">
            <p className="font-semibold text-base">
              This AI assistant provides educational information only and is NOT legal advice.
            </p>
            
            <div className="space-y-2">
              <p className="font-medium">Important Disclaimers:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  This service does not create an attorney-client relationship
                </li>
                <li>
                  Immigration law is complex and changes frequently. Information provided may not reflect the most current laws or policies
                </li>
                <li>
                  Every immigration case is unique. The general information provided here may not apply to your specific situation
                </li>
                <li>
                  This assistant cannot file applications, represent you before immigration authorities, or provide legal representation
                </li>
                <li>
                  For legal advice specific to your situation, please consult with a qualified immigration attorney
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="font-medium text-amber-900">Privacy Notice:</p>
              <p className="text-amber-800 text-xs mt-1">
                Do not share highly sensitive personal information such as your A-number, 
                passport details, or full home address. Share only what you're comfortable 
                discussing in general terms.
              </p>
            </div>

            <p className="text-xs text-gray-600 italic">
              By continuing, you acknowledge that you understand this is for informational 
              purposes only and that you should seek professional legal counsel for your 
              specific immigration needs.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button 
            onClick={handleAccept}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleAccept();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold touch-manipulation"
            type="button"
          >
            I Understand - Continue
          </Button>
          <button
            onClick={handleAccept}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
            type="button"
          >
            Close
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
