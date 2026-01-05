"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, FileText, MessageCircle, HelpCircle } from "lucide-react";
import type { Flow } from "@/lib/db/schema";

interface WelcomeScreenProps {
  onStartChat: (initialMessage?: string) => void;
  activeFlows: Flow[];
}

export function WelcomeScreen({ onStartChat, activeFlows }: WelcomeScreenProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Map of icons for flow cards - you can customize this based on flow names
  const getIconForFlow = (flowName: string) => {
    const lowerName = flowName.toLowerCase();
    if (lowerName.includes("asylum") || lowerName.includes("protection")) {
      return Shield;
    }
    if (lowerName.includes("citizen") || lowerName.includes("naturalization")) {
      return FileText;
    }
    return HelpCircle;
  };

  // Convert active flows to options format
  const flowOptions = activeFlows.map((flow) => ({
    id: flow.id,
    title: flow.name,
    description: flow.description || "Get information about this immigration option.",
    icon: getIconForFlow(flow.name),
    duration: "",
    initialMessage: `I want to learn about ${flow.name.toLowerCase()}.`,
    flowId: flow.id,
  }));

  // Add the "I'm not sure" option at the end
  const unsureOption = {
    id: "unsure",
    title: "I'm not sure",
    description: "Not sure which option fits your situation? Chat with our AI assistant to explore your options and get personalized guidance.",
    icon: MessageCircle,
    duration: "",
    initialMessage: "I'm not sure which immigration option is right for me. Can you help?",
  };

  const allOptions = [...flowOptions, unsureOption];

  const handleSelect = () => {
    if (!selectedOption) return;

    // If "I'm not sure" is selected, start the chat
    if (selectedOption === "unsure") {
      const option = allOptions.find((opt) => opt.id === selectedOption);
      onStartChat(option?.initialMessage);
    } else {
      // Navigate to the flow page
      router.push(`/flow/${selectedOption}`);
    }
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-3xl font-bold text-blue-900">
              How would you like to get started?
            </h1>
            <p className="text-gray-600">
              Select an option below to begin your immigration journey.
            </p>
          </div>

          <div className="space-y-4">
            {allOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedOption === option.id
                      ? "border-2 border-blue-600 bg-blue-50"
                      : "border border-gray-200 bg-white"
                  }`}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <div className="flex items-start gap-4 p-4">
                    <div
                      className={`mt-1 rounded-lg p-2 ${
                        selectedOption === option.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900">
                          {option.title}
                        </h3>
                        {option.duration && (
                          <span className="ml-2 text-sm text-gray-500">
                            ⏱ {option.duration}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Button
              onClick={handleSelect}
              disabled={!selectedOption}
              className="w-full max-w-md bg-blue-500 px-8 py-6 text-lg font-semibold text-white hover:bg-blue-600 disabled:bg-gray-300"
              size="lg"
            >
              Get Started
            </Button>
            <p className="mt-3 text-sm text-gray-500">
              Please select one of the options above to continue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
