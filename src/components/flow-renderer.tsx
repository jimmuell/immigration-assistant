"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { parseFlowMarkdown, validateFlow, type ParsedFlow, type FlowStep } from "@/lib/flow-parser";
import { AlertCircle, CheckCircle2, RotateCcw, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import type { Screening } from "@/lib/db/schema";

export interface FlowRendererProps {
  markdown: string;
  flowId?: string;
  flowName?: string;
  savedScreening?: Screening | null;
  userRole?: string;
}

export function FlowRenderer({ markdown, flowId, flowName, savedScreening, userRole = 'client' }: FlowRendererProps) {
  const [flow, setFlow] = useState<ParsedFlow | null>(null);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [textInput, setTextInput] = useState('');
  const [textError, setTextError] = useState('');
  const [responses, setResponses] = useState<Array<{ question: string; answer: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stepAnswers, setStepAnswers] = useState<Record<string, any>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [screeningId, setScreeningId] = useState<string | null>(savedScreening?.id || null);
  const [isTestMode, setIsTestMode] = useState(false);
  const router = useRouter();
  
  // Check if user is admin or staff
  const canUseTestMode = userRole === 'org_admin' || userRole === 'staff' || userRole === 'super_admin';
  
  useEffect(() => {
    try {
      const parsed = parseFlowMarkdown(markdown);
      const validation = validateFlow(parsed);
      
      if (validation.valid) {
        setFlow(parsed);
        
        // If we have saved screening data, restore from it
        if (savedScreening) {
          const savedResponses = JSON.parse(savedScreening.responses);
          setResponses(savedResponses);
          
          // Restore current step or default to start
          setCurrentStepId(savedScreening.currentStepId || parsed.startStepId);
          
          // Mark as started if we have responses
          setHasStarted(savedResponses.length > 0);
          
          // Reconstruct step answers from responses for state persistence
          // This is a best-effort reconstruction
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const reconstructedAnswers: Record<string, any> = {};
          savedResponses.forEach((response: { question: string; answer: string }) => {
            // Find the step that matches this question
            const matchingStep = parsed.steps.find(s => s.question === response.question);
            if (matchingStep) {
              reconstructedAnswers[matchingStep.id] = response.answer;
            }
          });
          setStepAnswers(reconstructedAnswers);
        } else {
          // New flow - start from beginning
          setCurrentStepId(parsed.startStepId);
          setHistory([]);
          setResponses([]);
          setHasStarted(false);
          setStepAnswers({});
        }
        
        setErrors([]);
        setFormData({});
      } else {
        setFlow(null);
        setErrors(validation.errors);
      }
    } catch {
      setFlow(null);
      setErrors(['Failed to parse flow markdown']);
    }
  }, [markdown, savedScreening]);

  // Initialize selectedOption when navigating to a step with a stored answer
  useEffect(() => {
    if (currentStepId) {
      const storedAnswer = stepAnswers[currentStepId];
      // Only update if the selected option doesn't match stored answer
      setSelectedOption(storedAnswer || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepId]); // Only depend on currentStepId to avoid race conditions

  const recordResponse = (question: string, answer: string) => {
    setResponses(prev => [...prev, { question, answer }]);
  };

  const handleOptionClick = (nextStepId: string, question?: string, answer?: string) => {
    if (question && answer) {
      recordResponse(question, answer);
      // Store answer by current step ID for state persistence
      if (currentStepId) {
        setStepAnswers(prev => ({ ...prev, [currentStepId]: answer }));
      }
    }
    if (currentStepId) {
      setHistory([...history, currentStepId]);
    }
    setCurrentStepId(nextStepId);
    setSelectedOption(null);
  };

  const handleBack = () => {
    if (history.length > 0) {
      const newHistory = [...history];
      const previousStep = newHistory.pop();
      setHistory(newHistory);
      setCurrentStepId(previousStep || flow?.startStepId || null);
      // Restore the previous selection for this step
      if (previousStep) {
        setSelectedOption(stepAnswers[previousStep] || null);
      }
      // Don't remove responses - keep them for state restoration
    }
  };

  const handleRestart = () => {
    setCurrentStepId(flow?.startStepId || null);
    setHistory([]);
    setFormData({});
    setResponses([]);
    setHasStarted(false);
    setStepAnswers({});
    setSelectedOption(null);
  };

  const handleExit = () => {
    console.log('handleExit called');
    
    // If admin is previewing without test mode, exit directly without saving
    const isAdminPreview = canUseTestMode && !isTestMode;
    if (isAdminPreview) {
      router.push('/admin/flows');
      return;
    }
    
    // For clients and test mode, show save modal
    setShowExitModal(true);
  };

  const handleResume = () => {
    console.log('handleResume called, setting showExitModal to false');
    setShowExitModal(false);
  };

  const handleSave = async () => {
    if (!flow) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/screenings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flowId,
          flowName: flowName || flow.title || 'Untitled Flow',
          responses,
          currentStepId,
          status: 'draft',
          screeningId, // Include screeningId to update existing draft
          isTestMode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save screening');
      }

      const data = await response.json();
      // Update screeningId if this was a new draft
      if (!screeningId && data.id) {
        setScreeningId(data.id);
      }

      toast.success('Progress saved!', {
        description: 'You can resume this screening from your saved screenings.',
      });
      
      router.push('/saved');
    } catch (error) {
      console.error('Error saving screening:', error);
      toast.error('Failed to save progress', {
        description: 'Please try again.',
      });
    } finally {
      setIsSaving(false);
      setShowExitModal(false);
    }
  };

  const handleBeginScreening = () => {
    setHasStarted(true);
    // Move from start node to first question
    const currentStep = flow?.steps.find(s => s.id === currentStepId);
    if (currentStepId && currentStep?.type === 'start' && currentStep.options.length > 0) {
      handleOptionClick(currentStep.options[0].nextStepId);
    }
  };

  const calculateProgress = () => {
    if (!flow) return 0;
    // Count total non-start, non-end steps
    const totalSteps = flow.steps.filter(s => s.type !== 'start' && s.type !== 'end').length;
    if (totalSteps === 0) return 0;
    // Progress is based on how many steps we've been through (history length)
    const completedSteps = history.length;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  const estimateDuration = () => {
    if (!flow) return '~5 minutes';
    // Estimate 30 seconds per question
    const totalQuestions = flow.steps.filter(s => s.type !== 'start' && s.type !== 'end').length;
    const minutes = Math.ceil((totalQuestions * 30) / 60);
    return `~${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const handleSaveScreening = async () => {
    if (!flow) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/screenings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flowId,
          flowName: flowName || flow.title || 'Untitled Flow',
          responses,
          status: 'submitted',
          deleteDraft: true, // Flag to delete any existing draft for this flow
          isTestMode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save screening');
      }

      const data = await response.json();
      toast.success('Screening completed!', {
        description: `Submission ID: ${data.submissionId}`,
      });
      
      // Navigate to completed page after a brief delay
      setTimeout(() => {
        router.push('/completed');
      }, 1500);
    } catch (error) {
      console.error('Error saving screening:', error);
      toast.error('Failed to save screening', {
        description: 'Please try again later.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormChange = (fieldId: string, value: string) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  const handleFormSubmit = (nextStepId: string, currentStep: FlowStep) => {
    if (currentStep?.formFields) {
      // Validate required fields
      const missing = currentStep.formFields
        .filter(f => f.required && !formData[f.id])
        .map(f => f.label);
      
      if (missing.length > 0) {
        alert(`Please fill in required fields: ${missing.join(', ')}`);
        return;
      }

      // Record form responses
      const formAnswer = currentStep.formFields
        .map(f => `${f.label}: ${formData[f.id] || 'N/A'}`)
        .join(', ');
      recordResponse(currentStep.question, formAnswer);
      
      // Store form data by step ID
      if (currentStepId) {
        setStepAnswers(prev => ({ ...prev, [currentStepId]: formData }));
      }
    }
    
    handleOptionClick(nextStepId);
  };

  if (errors.length > 0) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-destructive">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold">Flow Validation Errors</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-4 text-sm text-muted-foreground">
            <p className="mb-2">The flow parser expects one of these formats:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>JSON format in a <code className="bg-muted px-1">```json</code> code block</li>
              <li>Legacy markdown with <code className="bg-muted px-1">## Q1: Question?</code> format</li>
            </ol>
          </div>
        </div>
      </Card>
    );
  }

  if (!flow || !currentStepId) {
    return (
      <Card className="p-6">
        <div className="text-muted-foreground py-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-yellow-600" />
            <div>
              <p className="font-semibold text-foreground mb-2">No valid flow to preview</p>
              <p className="text-sm mb-3">The preview requires a flow definition in JSON format. Add a JSON code block with the following structure:</p>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`\`\`\`json
{
  "name": "Flow Name",
  "nodes": [
    {
      "id": "start-1",
      "type": "start",
      "question": "Start"
    },
    {
      "id": "q1",
      "type": "yes-no",
      "question": "Your question here?",
      "yesLabel": "Yes",
      "noLabel": "No"
    }
  ],
  "connections": [
    {
      "id": "c1",
      "sourceNodeId": "start-1",
      "targetNodeId": "q1",
      "condition": "any"
    }
  ]
}
\`\`\`
`}</pre>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Find current step
  const currentStep = flow.steps.find(s => s.id === currentStepId);
  
  // Debug logging
  if (currentStep) {
    console.log('Current Step:', {
      id: currentStep.id,
      type: currentStep.type,
      hasFormFields: !!currentStep.formFields,
      formFieldsCount: currentStep.formFields?.length,
      formFields: currentStep.formFields
    });
  }

  if (!currentStep) {
    return (
      <Card className="p-6">
        <div className="text-center text-destructive">
          <AlertCircle className="h-6 w-6 mx-auto mb-2" />
          <p>Step not found: {currentStepId}</p>
          <Button onClick={handleRestart} className="mt-4">
            Start Over
          </Button>
        </div>
      </Card>
    );
  }

  // Show start screen if we haven't started yet and we're on a start node
  if (!hasStarted && currentStep.type === 'start') {
    return (
      <Card className="overflow-hidden border-0 shadow-lg">
        {/* Header with blue background */}
        <div className="bg-[#0D7DB9] text-white p-8">
          <h1 className="text-3xl font-bold mb-2">
            {flow.title || flowName || 'Screening'}
          </h1>
          <p className="text-lg text-blue-100">
            {estimateDuration()}
          </p>
        </div>
        
        {/* Body with description and button */}
        <div className="p-8 bg-white">
          <p className="text-gray-600 text-lg mb-8">
            This guided screening will help us understand your situation and connect you with the right resources.
          </p>
          
          {canUseTestMode && (
            <div className="mb-6 p-4 border border-amber-300 bg-amber-50 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTestMode}
                  onChange={(e) => setIsTestMode(e.target.checked)}
                  className="w-5 h-5 text-[#0D7DB9] rounded border-gray-300 focus:ring-2 focus:ring-[#0D7DB9]"
                />
                <div>
                  <span className="font-semibold text-amber-900">Test Mode</span>
                  <p className="text-sm text-amber-800">
                    Mark this as a test screening (will be kept separate from client submissions)
                  </p>
                </div>
              </label>
            </div>
          )}
          
          <Button 
            onClick={handleBeginScreening}
            className="w-full bg-[#0D7DB9] hover:bg-[#0B6A9F] text-white text-lg py-6 rounded-lg font-semibold"
            size="lg"
          >
            Begin Screening
          </Button>
        </div>
      </Card>
    );
  }

  // Render text input node (for free-form text responses)
  if (currentStep.type === 'text' && currentStep.options.length > 0) {
    // Restore previous answer if navigating back, or initialize with default value
    const storedAnswer = stepAnswers[currentStepId];
    if (storedAnswer && !textInput) {
      setTextInput(storedAnswer);
    } else if (!storedAnswer && !textInput && currentStep.defaultValue) {
      setTextInput(currentStep.defaultValue);
    }

    const handleTextSubmit = () => {
      const trimmed = textInput.trim();
      
      // Basic validation
      if (!trimmed) {
        setTextError('This field is required');
        return;
      }
      
      if (trimmed.length < 2) {
        setTextError('Please enter at least 2 characters');
        return;
      }
      
      if (trimmed.length > 500) {
        setTextError('Please enter no more than 500 characters');
        return;
      }

      // Store response and navigate
      recordResponse(currentStep.question, trimmed);
      if (currentStepId) {
        setStepAnswers(prev => ({ ...prev, [currentStepId]: trimmed }));
      }
      handleOptionClick(currentStep.options[0].nextStepId);
      setTextInput('');
      setTextError('');
    };

    const progress = calculateProgress();
    const isAdminPreview = canUseTestMode && !isTestMode;

    return (
      <>
      <Card className="p-6">
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Progress</span>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{progress}%</span>
                <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleExit();
                }}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ✕ {isAdminPreview ? 'Exit Preview' : 'Exit'}
              </button>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#0D7DB9] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{currentStep.question}</h3>
            
            <div className="space-y-2">
              <textarea
                className="w-full min-h-[100px] p-3 border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={currentStep.placeholder || "Type your answer..."}
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value);
                  setTextError('');
                }}
                maxLength={500}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{textError && <span className="text-destructive">{textError}</span>}</span>
                <span>{textInput.length}/500</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4 pt-4">
            {history.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="border-[#0D7DB9] text-[#0D7DB9] hover:bg-gray-50 px-12 py-5 text-base"
              >
                Back
              </Button>
            )}
            <Button 
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
              className="bg-[#0D7DB9] text-white hover:bg-[#0B6A9F] px-12 py-5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
          </div>
        </div>
      </Card>

      {/* Exit Confirmation Dialog */}
      <AlertDialog 
        open={showExitModal} 
        onOpenChange={(open) => {
          console.log('AlertDialog onOpenChange called with:', open, 'isSaving:', isSaving);
          if (!isSaving) {
            setShowExitModal(open);
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Save Your Progress?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ve answered {responses.length} {responses.length === 1 ? 'question' : 'questions'}. Would you like to save your progress to continue later?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                console.log('Resume button clicked');
                handleResume();
              }}
              disabled={isSaving}
              className="border-[#0D7DB9] text-[#0D7DB9] hover:bg-gray-50"
            >
              Resume
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#0D7DB9] hover:bg-[#0B6A9F] text-white"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
    );
  }

  // Render end node or text node without options (terminal informational screen)
  if (currentStep.type === 'end' || (currentStep.type === 'text' && currentStep.options.length === 0)) {
    const isEndNode = currentStep.type === 'end';
    
    // Check if admin/staff is previewing without test mode
    const isAdminPreview = canUseTestMode && !isTestMode;
    const canComplete = !isAdminPreview;
    
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className={`flex items-center gap-2 ${isEndNode ? 'text-green-600' : 'text-blue-600'}`}>
            <CheckCircle2 className="h-6 w-6" />
            <h3 className="text-xl font-bold">{currentStep.question}</h3>
          </div>

          {isAdminPreview && responses.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 mb-1">Preview Mode</p>
                  <p className="text-sm text-amber-800">
                    You&apos;re previewing this flow as an admin. To test the complete submission process, 
                    please restart and enable <strong>Test Mode</strong> at the beginning.
                  </p>
                </div>
              </div>
            </div>
          )}

          {canComplete && responses.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-green-800">
                ✓ This screening has been completed. Click &quot;Complete Screening&quot; below to submit your responses.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4 flex-wrap">
            {history.length > 0 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            {canComplete && responses.length > 0 && (
              <Button 
                onClick={handleSaveScreening} 
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Complete Screening'}
              </Button>
            )}
            <Button onClick={handleRestart} variant="ghost">
              <RotateCcw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
            {isAdminPreview && (
              <Button 
                onClick={() => router.push('/admin/flows')} 
                variant="outline"
                className="ml-auto"
              >
                Exit Preview
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Render form node
  if (currentStep.type === 'form' && currentStep.formFields) {
    // Restore previous form data if navigating back
    const storedFormData = stepAnswers[currentStepId];
    if (storedFormData && Object.keys(formData).length === 0) {
      setFormData(storedFormData);
    } else if (Object.keys(formData).length === 0) {
      // Initialize with default values if no stored data
      const defaultFormData: Record<string, string> = {};
      currentStep.formFields.forEach(field => {
        if (field.defaultValue) {
          defaultFormData[field.id] = field.defaultValue;
        }
      });
      if (Object.keys(defaultFormData).length > 0) {
        setFormData(defaultFormData);
      }
    }

    const progress = calculateProgress();
    const isAdminPreview = canUseTestMode && !isTestMode;

    return (
      <>
      <Card className="p-6">
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Progress</span>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{progress}%</span>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleExit();
                  }}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  ✕ {isAdminPreview ? 'Exit Preview' : 'Exit'}
                </button>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#0D7DB9] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question/Form Title */}
          <div>
            <h3 className="text-xl font-semibold mb-4">{currentStep.question}</h3>
            
            {/* Form Fields */}
            <div className="space-y-4">
              {currentStep.formFields.map(field => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Input
                    id={field.id}
                    type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    placeholder={field.placeholder}
                    value={formData[field.id] || field.defaultValue || ''}
                    onChange={(e) => handleFormChange(field.id, e.target.value)}
                    required={field.required}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4 pt-4">
            {history.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="border-[#0D7DB9] text-[#0D7DB9] hover:bg-gray-50 px-12 py-5 text-base"
              >
                Back
              </Button>
            )}
            {currentStep.options.map((option, idx) => (
              <Button
                key={idx}
                onClick={() => handleFormSubmit(option.nextStepId, currentStep)}
                className="bg-[#0D7DB9] text-white hover:bg-[#0B6A9F] px-12 py-5 text-base"
              >
                Continue
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Exit Confirmation Dialog */}
      <AlertDialog 
        open={showExitModal} 
        onOpenChange={(open) => {
          console.log('AlertDialog onOpenChange called with:', open, 'isSaving:', isSaving);
          if (!isSaving) {
            setShowExitModal(open);
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Save Your Progress?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ve answered {responses.length} {responses.length === 1 ? 'question' : 'questions'}. Would you like to save your progress to continue later?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                console.log('Resume button clicked');
                handleResume();
              }}
              disabled={isSaving}
              className="border-[#0D7DB9] text-[#0D7DB9] hover:bg-gray-50"
            >
              Resume
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#0D7DB9] hover:bg-[#0B6A9F] text-white"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
    );
  }

  // Render regular question node (yes-no, text, multiple-choice, start)
  const progress = calculateProgress();
  const isAdminPreview = canUseTestMode && !isTestMode;

  return (
    <>
      <Card className="p-6">
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Progress</span>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{progress}%</span>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleExit();
                  }}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  ✕ {isAdminPreview ? 'Exit Preview' : 'Exit'}
                </button>
              </div>
            </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#0D7DB9] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="pt-4">
          <h3 className="text-xl font-normal mb-6 text-gray-800 leading-relaxed">{currentStep.question}</h3>
          
          {/* Options */}
          <div className="space-y-3">
            {currentStep.options.map((option, index) => {
              const isSelected = selectedOption === option.text || (!selectedOption && stepAnswers[currentStepId] === option.text);
              return (
                <Button
                  key={index}
                  variant={isSelected ? "default" : "outline"}
                  className={`w-full justify-center text-center h-auto py-4 px-6 text-base transition-colors rounded-lg font-medium ${
                    isSelected 
                      ? 'bg-[#0D7DB9] text-white border-[#0D7DB9]' 
                      : 'border-[#0D7DB9] text-[#0D7DB9] hover:bg-[#0D7DB9] hover:text-white'
                  }`}
                  onClick={() => {
                    // Just select the option, don't navigate yet
                    setSelectedOption(option.text);
                  }}
                >
                  {option.text}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4 pt-6">
          {history.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="border-[#0D7DB9] text-[#0D7DB9] hover:bg-gray-50 px-12 py-5 text-base"
            >
              Back
            </Button>
          )}
          <Button 
            onClick={() => {
              if (selectedOption) {
                // Find the option that was selected
                const option = currentStep.options.find(opt => opt.text === selectedOption);
                if (option) {
                  // Record the response before navigating
                  if (currentStep.type !== 'start') {
                    recordResponse(currentStep.question, selectedOption);
                    if (currentStepId) {
                      setStepAnswers(prev => ({ ...prev, [currentStepId]: selectedOption }));
                    }
                  }
                  handleOptionClick(option.nextStepId);
                }
              }
            }}
            disabled={!selectedOption}
            className="bg-[#0D7DB9] text-white hover:bg-[#0B6A9F] px-12 py-5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </Button>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog 
        open={showExitModal} 
        onOpenChange={(open) => {
          console.log('AlertDialog onOpenChange called with:', open, 'isSaving:', isSaving);
          // Allow opening and closing, but prevent closing during save
          if (!isSaving) {
            setShowExitModal(open);
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Save Your Progress?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ve answered {responses.length} {responses.length === 1 ? 'question' : 'questions'}. Would you like to save your progress to continue later?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                console.log('Resume button clicked');
                handleResume();
              }}
              disabled={isSaving}
              className="border-[#0D7DB9] text-[#0D7DB9] hover:bg-gray-50"
            >
              Resume
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#0D7DB9] hover:bg-[#0B6A9F] text-white"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
    </>
  );
}
