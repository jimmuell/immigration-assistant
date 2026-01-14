/**
 * Flow Parser - Converts flow document to interactive flow structure
 * 
 * Supports two formats:
 * 1. JSON format (from document footer)
 * 2. Markdown format (legacy)
 */

// JSON Format Interfaces
export interface FlowNode {
  id: string;
  type: 'start' | 'yes-no' | 'text' | 'form' | 'end' | 'success' | 'multiple-choice' | 'date' | 'info' | 'subflow';
  question: string;
  options?: Array<{
    id: string | number;
    label: string;
  }>;
  yesLabel?: string | null;
  noLabel?: string | null;
  // For text and date input nodes
  placeholder?: string;
  defaultValue?: string;
  fieldName?: string;
  required?: boolean;
  // For form nodes
  formTitle?: string | null;
  formDescription?: string | null;
  formFields?: Array<{
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    defaultValue?: string;
    options?: string[];
  }>;
  // For end/success nodes
  thankYouTitle?: string | null;
  thankYouMessage?: string | null;
  // For info nodes
  infoMessage?: string | null;
  // For subflow nodes
  subflowId?: string | null;
}

export interface FlowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition: string; // 'yes', 'no', 'any', or option label
  label?: string;
}

export interface FlowJSON {
  name: string;
  description?: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
}

// Parsed Format Interfaces
export interface FlowOption {
  text: string;
  nextStepId: string;
  condition: string;
}

export interface FlowStep {
  id: string;
  type: 'start' | 'yes-no' | 'text' | 'form' | 'end' | 'multiple-choice' | 'date' | 'info' | 'success' | 'subflow';
  question: string;
  options: FlowOption[];
  // For text and date input nodes
  placeholder?: string;
  defaultValue?: string;
  fieldName?: string;
  required?: boolean;
  // For form nodes
  formFields?: Array<{
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    defaultValue?: string;
    options?: string[];
  }>;
  // For end/success nodes
  thankYouTitle?: string | null;
  thankYouMessage?: string | null;
  // For info nodes
  infoMessage?: string | null;
  // For subflow nodes
  subflowId?: string | null;
}

export interface ParsedFlow {
  title: string;
  steps: FlowStep[];
  startStepId: string | null;
}

/**
 * Extract JSON from markdown document
 */
function extractFlowJSON(content: string): FlowJSON | null {
  try {
    // Try multiple strategies to find JSON
    
    // Strategy 1: Find ```json blocks (greedy match for large JSON)
    const jsonBlockRegex = /```json\s*\n([\s\S]+)\n```/gi;
    const jsonMatches = Array.from(content.matchAll(jsonBlockRegex));
    
    for (const match of jsonMatches) {
      try {
        const jsonStr = match[1].trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.nodes && parsed.connections && Array.isArray(parsed.nodes)) {
          console.log('✅ Found valid flow JSON in code block');
          return parsed as FlowJSON;
        }
      } catch (e) {
        console.log('⚠️ Found JSON block but failed to parse:', e);
        continue;
      }
    }
    
    // Strategy 2: Look for "Full JSON Export" section specifically
    const exportMatch = content.match(/##\s*📦\s*Full JSON Export[\s\S]*?```json\s*\n([\s\S]+)\n```/i);
    if (exportMatch) {
      try {
        const jsonStr = exportMatch[1].trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.nodes && parsed.connections && Array.isArray(parsed.nodes)) {
          console.log('✅ Found valid flow JSON in Full JSON Export section');
          return parsed as FlowJSON;
        }
      } catch (e) {
        console.log('⚠️ Found Full JSON Export but failed to parse:', e);
      }
    }
    
    // Strategy 3: Try parsing entire content as JSON
    try {
      const parsed = JSON.parse(content);
      if (parsed.nodes && parsed.connections && Array.isArray(parsed.nodes)) {
        console.log('✅ Entire content is valid flow JSON');
        return parsed as FlowJSON;
      }
    } catch (e) {
      // Not pure JSON, that's fine
    }
    
    console.log('❌ No valid flow JSON found in content');
    return null;
  } catch (error) {
    console.error('❌ Failed to extract flow JSON:', error);
    return null;
  }
}

/**
 * Parse flow from JSON structure
 */
function parseFlowFromJSON(flowJSON: FlowJSON): ParsedFlow {
  const steps: FlowStep[] = [];
  
  // Find start node
  const startNode = flowJSON.nodes.find(n => n.type === 'start');
  
  // Convert each node to a step
  flowJSON.nodes.forEach(node => {
    const connections = flowJSON.connections.filter(c => c.sourceNodeId === node.id);
    
    const options: FlowOption[] = [];
    
    // Build options based on node type
    if (node.type === 'yes-no') {
      // For yes-no nodes, create options based on connections
      const yesConn = connections.find(c => c.condition === 'yes');
      const noConn = connections.find(c => c.condition === 'no');
      const anyConn = connections.find(c => c.condition === 'any');
      
      if (yesConn || anyConn) {
        options.push({
          text: node.yesLabel || 'Yes',
          nextStepId: (yesConn || anyConn)!.targetNodeId,
          condition: 'yes',
        });
      }
      
      if (noConn || anyConn) {
        options.push({
          text: node.noLabel || 'No',
          nextStepId: (noConn || anyConn)!.targetNodeId,
          condition: 'no',
        });
      }
    } else if (node.type === 'multiple-choice' && node.options) {
      // For multiple choice, create options from node.options
      node.options.forEach(opt => {
        const conn = connections.find(c => c.condition === opt.id.toString()) || 
                     connections.find(c => c.condition === 'any');
        if (conn) {
          options.push({
            text: opt.label,
            nextStepId: conn.targetNodeId,
            condition: opt.id.toString(),
          });
        }
      });
    } else if (node.type === 'start' || node.type === 'text' || node.type === 'form' || node.type === 'date' || node.type === 'info' || node.type === 'subflow') {
      // For start, text, form, date, info, and subflow nodes, use 'any' connection
      const anyConn = connections.find(c => c.condition === 'any');
      if (anyConn) {
        options.push({
          text: node.type === 'start' ? 'Start' : 'Continue',
          nextStepId: anyConn.targetNodeId,
          condition: 'any',
        });
      }
    }
    // End and success nodes have no options (terminal nodes)
    
    // Determine the display question based on node type
    let displayQuestion = node.question;
    if (node.type === 'form' && node.formTitle) {
      displayQuestion = node.formTitle;
    } else if ((node.type === 'end' || node.type === 'success') && node.thankYouTitle) {
      displayQuestion = node.thankYouTitle;
    } else if (node.type === 'start') {
      displayQuestion = 'Start';
    } else if (node.type === 'info' && node.infoMessage) {
      displayQuestion = node.infoMessage;
    }
    
    const step: FlowStep = {
      id: node.id,
      type: node.type,
      question: displayQuestion,
      options,
      // Text/Date input fields
      placeholder: node.placeholder,
      defaultValue: node.defaultValue,
      fieldName: node.fieldName,
      required: node.required,
      // Form fields
      formFields: node.formFields,
      // End/Success node fields
      thankYouTitle: node.thankYouTitle,
      thankYouMessage: node.thankYouMessage,
      // Info node fields
      infoMessage: node.infoMessage,
      // Subflow node fields
      subflowId: node.subflowId,
    };
    
    steps.push(step);
  });
  
  return {
    title: flowJSON.name,
    steps,
    startStepId: startNode?.id || null,
  };
}

/**
 * Main parser function - handles both JSON and markdown formats
 */
export function parseFlowMarkdown(markdown: string): ParsedFlow {
  console.log('🔍 Parsing flow markdown, content length:', markdown.length);
  
  // Try JSON format first (direct JSON or in code block)
  const flowJSON = extractFlowJSON(markdown);
  if (flowJSON) {
    console.log('✅ Successfully extracted and parsed flow JSON');
    return parseFlowFromJSON(flowJSON);
  }
  
  console.log('⚠️ No JSON found, trying legacy markdown format');
  // Fallback to markdown parsing (legacy format)
  return parseFlowMarkdownLegacy(markdown);
}

/**
 * Legacy markdown parser for simple markdown format
 */
function parseFlowMarkdownLegacy(markdown: string): ParsedFlow {
  const lines = markdown.split('\n');
  const flow: ParsedFlow = {
    title: '',
    steps: [],
    startStepId: null,
  };

  let currentStep: FlowStep | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Parse title (# Title)
    if (line.startsWith('# ') && !flow.title) {
      flow.title = line.substring(2).trim();
      continue;
    }

    // Parse question headers (## Q1: Question?)
    if (line.startsWith('## ')) {
      // Save previous step if any
      if (currentStep) {
        flow.steps.push(currentStep);
      }

      const questionText = line.substring(3).trim();
      const colonIndex = questionText.indexOf(':');
      
      if (colonIndex > -1) {
        const id = questionText.substring(0, colonIndex).trim();
        const question = questionText.substring(colonIndex + 1).trim();
        
        currentStep = {
          id,
          type: 'text',
          question,
          options: [],
        };

        // Set first step as start if not set
        if (!flow.startStepId) {
          flow.startStepId = id;
        }
      }
      continue;
    }

    // Parse options (- Option text -> Next step)
    if (line.startsWith('- ') && currentStep) {
      const optionText = line.substring(2).trim();
      const arrowIndex = optionText.indexOf('->');
      
      if (arrowIndex > -1) {
        const text = optionText.substring(0, arrowIndex).trim();
        const nextStepId = optionText.substring(arrowIndex + 2).trim();
        
        currentStep.options.push({ 
          text, 
          nextStepId,
          condition: 'any'
        });
      }
      continue;
    }
  }

  // Save last step
  if (currentStep) {
    flow.steps.push(currentStep);
  }

  return flow;
}

/**
 * Validate parsed flow structure
 */
export function validateFlow(flow: ParsedFlow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!flow.title) {
    errors.push('Flow must have a title');
  }

  if (!flow.startStepId) {
    errors.push('Flow must have a start node');
  }

  if (flow.steps.length === 0) {
    errors.push('Flow must have at least one step');
  }

  // Check for valid step references
  const stepIds = new Set(flow.steps.map(s => s.id));
  
  flow.steps.forEach(step => {
    // Check question text (except for start nodes which can be empty)
    if (!step.question && step.type !== 'start') {
      errors.push(`Step "${step.id}" is missing question text`);
    }

    // Check navigation options (terminal nodes don't need options)
    // Terminal nodes: end, success, info, text, and date can be used as final screens
    const terminalNodeTypes = ['end', 'success', 'info', 'text', 'date'];
    if (!terminalNodeTypes.includes(step.type) && step.options.length === 0) {
      errors.push(`Step "${step.id}" has no navigation options`);
    }

    // Validate option references
    step.options.forEach(option => {
      if (!stepIds.has(option.nextStepId)) {
        errors.push(`Step "${step.id}" references non-existent step "${option.nextStepId}"`);
      }
    });
    
    // Validate form fields if present
    if (step.type === 'form') {
      if (!step.formFields || step.formFields.length === 0) {
        errors.push(`Form step "${step.id}" has no form fields`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
