"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface Response {
  question: string;
  answer: string;
}

interface ResponsesTabProps {
  responses: Response[];
}

export function ResponsesTab({ responses }: ResponsesTabProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Screening Responses</h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              {isOpen ? (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span>Hide Responses</span>
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span>Show Responses ({responses.length})</span>
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent className="pt-4">
          <div className="space-y-4">
            {responses.map((response, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="font-medium text-gray-900">
                  Q{idx + 1}: {response.question}
                </p>
                <p className="text-gray-700 pl-4 border-l-2 border-blue-200">
                  {response.answer}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
