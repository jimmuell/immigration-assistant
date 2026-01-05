export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

// Visual Flow Editor Types
export type NodeType = 
  | 'start'
  | 'end'
  | 'yes-no'
  | 'multiple-choice'
  | 'text'
  | 'date'
  | 'form'
  | 'info'
  | 'completion'
  | 'success'
  | 'subflow';

export interface ConditionalLogic {
  condition: string;
  nextNodeId: string;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'min' | 'max' | 'pattern';
  value?: string | number;
  message?: string;
}

export type FormFieldType = 'text' | 'email' | 'phone' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select, radio, checkbox
  validations?: ValidationRule[];
  defaultValue?: string;
}

export interface FormNodeData extends Record<string, unknown> {
  label?: string;
  question?: string;
  description?: string;
  options?: string[];
  placeholder?: string;
  validations?: ValidationRule[];
  conditionalLogic?: ConditionalLogic[];
  defaultValue?: string;
  subflowId?: string;
  fieldName?: string;
  required?: boolean;
  formFields?: FormField[];
}

export interface FormNode {
  id: string;
  type: NodeType;
  data: FormNodeData;
  position: { x: number; y: number };
}

export interface FormEdgeData {
  label?: string;
  condition?: string;
}

export interface FormEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  data?: FormEdgeData;
}

export interface FlowData {
  nodes: FormNode[];
  edges: FormEdge[];
}

