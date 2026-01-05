'use client';

import { useState } from 'react';
import { Play, Square, HelpCircle, List, Type, Calendar, FileText, Info, CheckCircle, GitBranch, ChevronDown, ChevronUp } from 'lucide-react';
import type { NodeType } from '@/types';

interface ComponentSidebarProps {
  onAddNode: (type: NodeType) => void;
}

interface NodeDefinition {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const nodeDefinitions: Record<string, NodeDefinition[]> = {
  input: [
    {
      type: 'form',
      label: 'Form Builder',
      description: 'Build multi-field forms',
      icon: <FileText className="h-4 w-4" />,
      color: 'orange',
    },
    {
      type: 'text',
      label: 'Text Input',
      description: 'Single line text field',
      icon: <Type className="h-4 w-4" />,
      color: 'indigo',
    },
    {
      type: 'date',
      label: 'Date Picker',
      description: 'Date selection',
      icon: <Calendar className="h-4 w-4" />,
      color: 'cyan',
    },
  ],
  question: [
    {
      type: 'yes-no',
      label: 'Yes/No',
      description: 'Binary choice',
      icon: <HelpCircle className="h-4 w-4" />,
      color: 'blue',
    },
    {
      type: 'multiple-choice',
      label: 'Multiple Choice',
      description: 'Select from options',
      icon: <List className="h-4 w-4" />,
      color: 'purple',
    },
  ],
  logic: [
    {
      type: 'subflow',
      label: 'Subflow',
      description: 'Navigate to another flow',
      icon: <GitBranch className="h-4 w-4" />,
      color: 'pink',
    },
  ],
  action: [
    {
      type: 'start',
      label: 'Start',
      description: 'Flow start point',
      icon: <Play className="h-4 w-4" />,
      color: 'green',
    },
    {
      type: 'success',
      label: 'Success',
      description: 'Success completion',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'emerald',
    },
    {
      type: 'info',
      label: 'Info',
      description: 'Display information',
      icon: <Info className="h-4 w-4" />,
      color: 'yellow',
    },
    {
      type: 'end',
      label: 'End',
      description: 'End flow',
      icon: <Square className="h-4 w-4" />,
      color: 'red',
    },
  ],
};

const sectionIcons: Record<string, string> = {
  input: '📝',
  question: '❓',
  logic: '🔀',
  action: '⚡',
};

const sectionTitles: Record<string, string> = {
  input: 'INPUT',
  question: 'QUESTION',
  logic: 'LOGIC',
  action: 'ACTION',
};

export default function ComponentSidebar({ onAddNode }: ComponentSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    input: true,
    question: true,
    logic: true,
    action: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-card border-r flex flex-col shrink-0">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm">Components</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Drag to canvas or click to add
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(nodeDefinitions).map(([sectionKey, nodes]) => (
          <div key={sectionKey} className="mb-2">
            <button
              onClick={() => toggleSection(sectionKey as keyof typeof expandedSections)}
              className="w-full flex items-center justify-between p-2 hover:bg-accent rounded-md text-sm font-medium"
            >
              <span>
                {sectionIcons[sectionKey]} {sectionTitles[sectionKey]}
              </span>
              {expandedSections[sectionKey as keyof typeof expandedSections] ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {expandedSections[sectionKey as keyof typeof expandedSections] && (
              <div className="mt-1 space-y-1 ml-2">
                {nodes.map((node) => (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, node.type)}
                    onClick={() => onAddNode(node.type)}
                    className="p-2 hover:bg-accent rounded cursor-pointer text-sm flex items-start gap-2 group"
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-${node.color}-500 flex items-center justify-center mt-0.5`}>
                      <div className="text-white">
                        {node.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{node.label}</div>
                      <div className="text-xs text-muted-foreground">{node.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
