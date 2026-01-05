'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FormNodeData, ValidationRule, FormField, FormFieldType } from '@/types';

interface NodeEditorPanelProps {
  selectedNode: Node | null;
  onNodeUpdate: (nodeId: string, data: FormNodeData) => void;
  onClose: () => void;
}

export default function NodeEditorPanel({ 
  selectedNode, 
  onNodeUpdate, 
  onClose 
}: NodeEditorPanelProps) {
  const [formData, setFormData] = useState<FormNodeData>({});

  useEffect(() => {
    if (selectedNode) {
      setFormData((selectedNode.data as FormNodeData) || {});
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground text-center">
          Select a node to edit its properties
        </p>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<FormNodeData>) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    onNodeUpdate(selectedNode.id, newData);
  };

  const addOption = () => {
    const options = formData.options || [];
    handleUpdate({ options: [...options, `Option ${options.length + 1}`] });
  };

  const updateOption = (index: number, value: string) => {
    const options = [...(formData.options || [])];
    options[index] = value;
    handleUpdate({ options });
  };

  const removeOption = (index: number) => {
    const options = formData.options?.filter((_, i) => i !== index) || [];
    handleUpdate({ options });
  };

  const addValidation = () => {
    const validations = formData.validations || [];
    handleUpdate({ 
      validations: [...validations, { type: 'required', message: 'This field is required' }] 
    });
  };

  const updateValidation = (index: number, rule: ValidationRule) => {
    const validations = [...(formData.validations || [])];
    validations[index] = rule;
    handleUpdate({ validations });
  };

  const removeValidation = (index: number) => {
    const validations = formData.validations?.filter((_, i) => i !== index) || [];
    handleUpdate({ validations });
  };

  // Form field management functions
  const addFormField = () => {
    const formFields = formData.formFields || [];
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
    };
    handleUpdate({ formFields: [...formFields, newField] });
  };

  const updateFormField = (index: number, updates: Partial<FormField>) => {
    const formFields = [...(formData.formFields || [])];
    formFields[index] = { ...formFields[index], ...updates };
    handleUpdate({ formFields });
  };

  const removeFormField = (index: number) => {
    const formFields = formData.formFields?.filter((_, i) => i !== index) || [];
    handleUpdate({ formFields });
  };

  const addFieldOption = (fieldIndex: number) => {
    const formFields = [...(formData.formFields || [])];
    const field = formFields[fieldIndex];
    const options = field.options || [];
    field.options = [...options, `Option ${options.length + 1}`];
    handleUpdate({ formFields });
  };

  const updateFieldOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const formFields = [...(formData.formFields || [])];
    const field = formFields[fieldIndex];
    if (field.options) {
      field.options[optionIndex] = value;
      handleUpdate({ formFields });
    }
  };

  const removeFieldOption = (fieldIndex: number, optionIndex: number) => {
    const formFields = [...(formData.formFields || [])];
    const field = formFields[fieldIndex];
    if (field.options) {
      field.options = field.options.filter((_, i) => i !== optionIndex);
      handleUpdate({ formFields });
    }
  };

  const getNodeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'start': 'Start Node',
      'end': 'End Node',
      'yes-no': 'Yes/No Question',
      'multiple-choice': 'Multiple Choice',
      'text': 'Text Input',
      'date': 'Date Picker',
      'form': 'Form Builder',
      'info': 'Info Message',
      'success': 'Success',
      'subflow': 'Subflow',
    };
    return labels[type] || type;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-semibold text-sm">Node Properties</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getNodeTypeLabel(selectedNode.type || '')}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Basic Properties */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="label" className="text-xs">Label</Label>
            <Input
              id="label"
              value={formData.label || ''}
              onChange={(e) => handleUpdate({ label: e.target.value })}
              placeholder="Node label"
              className="mt-1"
            />
          </div>

          {/* Question field for question nodes */}
          {(selectedNode.type === 'yes-no' || selectedNode.type === 'multiple-choice') && (
            <div>
              <Label htmlFor="question" className="text-xs">Question</Label>
              <Input
                id="question"
                value={formData.question || ''}
                onChange={(e) => handleUpdate({ question: e.target.value })}
                placeholder="Enter question"
                className="mt-1"
              />
            </div>
          )}

          {/* Description field */}
          {(selectedNode.type === 'info' || selectedNode.type === 'success' || selectedNode.type === 'form') && (
            <div>
              <Label htmlFor="description" className="text-xs">Description</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleUpdate({ description: e.target.value })}
                placeholder="Enter description"
                className="mt-1"
              />
            </div>
          )}

          {/* Placeholder for input nodes */}
          {selectedNode.type === 'text' && (
            <div>
              <Label htmlFor="placeholder" className="text-xs">Placeholder</Label>
              <Input
                id="placeholder"
                value={formData.placeholder || ''}
                onChange={(e) => handleUpdate({ placeholder: e.target.value })}
                placeholder="Placeholder text"
                className="mt-1"
              />
            </div>
          )}

          {/* Field name for input nodes */}
          {(selectedNode.type === 'text' || selectedNode.type === 'date') && (
            <div>
              <Label htmlFor="fieldName" className="text-xs">Field Name</Label>
              <Input
                id="fieldName"
                value={formData.fieldName || ''}
                onChange={(e) => handleUpdate({ fieldName: e.target.value })}
                placeholder="field_name"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used to store the value in the database
              </p>
            </div>
          )}

          {/* Default value for input nodes */}
          {selectedNode.type === 'text' && (
            <div>
              <Label htmlFor="defaultValue" className="text-xs">Default Value (Optional)</Label>
              <Input
                id="defaultValue"
                value={formData.defaultValue || ''}
                onChange={(e) => handleUpdate({ defaultValue: e.target.value })}
                placeholder="Enter default value"
                className="mt-1"
              />
            </div>
          )}

          {/* Default value for date */}
          {selectedNode.type === 'date' && (
            <div>
              <Label htmlFor="defaultValue" className="text-xs">Default Value (Optional)</Label>
              <Input
                id="defaultValue"
                type="date"
                value={formData.defaultValue || ''}
                onChange={(e) => handleUpdate({ defaultValue: e.target.value })}
                className="mt-1"
              />
            </div>
          )}

          {/* Default value for yes-no */}
          {selectedNode.type === 'yes-no' && (
            <div>
              <Label htmlFor="defaultValue" className="text-xs">Default Selection (Optional)</Label>
              <select
                id="defaultValue"
                value={formData.defaultValue || ''}
                onChange={(e) => handleUpdate({ defaultValue: e.target.value })}
                className="w-full text-sm border rounded px-3 py-2 mt-1"
              >
                <option value="">None</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          )}

          {/* Default value for multiple choice */}
          {selectedNode.type === 'multiple-choice' && (formData.options?.length ?? 0) > 0 && (
            <div>
              <Label htmlFor="defaultValue" className="text-xs">Default Selection (Optional)</Label>
              <select
                id="defaultValue"
                value={formData.defaultValue || ''}
                onChange={(e) => handleUpdate({ defaultValue: e.target.value })}
                className="w-full text-sm border rounded px-3 py-2 mt-1"
              >
                <option value="">None</option>
                {(formData.options || []).map((option, idx) => (
                  <option key={idx} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )}

          {/* Required checkbox */}
          {(selectedNode.type === 'text' || selectedNode.type === 'date') && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="required"
                checked={formData.required || false}
                onChange={(e) => handleUpdate({ required: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="required" className="text-xs cursor-pointer">
                Required field
              </Label>
            </div>
          )}

          {/* Subflow ID for subflow nodes */}
          {selectedNode.type === 'subflow' && (
            <div>
              <Label htmlFor="subflowId" className="text-xs">Subflow ID</Label>
              <Input
                id="subflowId"
                value={formData.subflowId || ''}
                onChange={(e) => handleUpdate({ subflowId: e.target.value })}
                placeholder="Enter flow ID"
                className="mt-1"
              />
            </div>
          )}
        </div>

        {/* Options for multiple choice */}
        {selectedNode.type === 'multiple-choice' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Options</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addOption}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {(formData.options || []).map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Fields for form builder nodes */}
        {selectedNode.type === 'form' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Form Fields</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addFormField}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add field...
              </Button>
            </div>
            <div className="space-y-3">
              {(formData.formFields || []).map((field, fieldIndex) => (
                <div key={field.id} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      {/* Field Type */}
                      <div>
                        <Label className="text-xs">Field Type</Label>
                        <select
                          value={field.type}
                          onChange={(e) => updateFormField(fieldIndex, { 
                            type: e.target.value as FormFieldType,
                            options: ['select', 'radio', 'checkbox'].includes(e.target.value) ? (field.options || ['Option 1']) : undefined
                          })}
                          className="w-full text-xs border rounded px-2 py-1.5 mt-1"
                        >
                          <option value="text">Text Input</option>
                          <option value="email">Email</option>
                          <option value="phone">Phone Number</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="textarea">Text Area</option>
                          <option value="select">Dropdown</option>
                          <option value="radio">Radio Buttons</option>
                          <option value="checkbox">Checkboxes</option>
                        </select>
                      </div>

                      {/* Field Label */}
                      <div>
                        <Label className="text-xs">Field Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateFormField(fieldIndex, { label: e.target.value })}
                          placeholder="Enter field label"
                          className="text-xs mt-1"
                        />
                      </div>

                      {/* Placeholder (for applicable field types) */}
                      {['text', 'email', 'phone', 'number', 'textarea'].includes(field.type) && (
                        <div>
                          <Label className="text-xs">Placeholder (Optional)</Label>
                          <Input
                            value={field.placeholder || ''}
                            onChange={(e) => updateFormField(fieldIndex, { placeholder: e.target.value })}
                            placeholder="Enter placeholder text"
                            className="text-xs mt-1"
                          />
                        </div>
                      )}

                      {/* Options for select, radio, checkbox */}
                      {['select', 'radio', 'checkbox'].includes(field.type) && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Options</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addFieldOption(fieldIndex)}
                              className="h-6 text-xs px-2"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                          <div className="space-y-1">
                            {(field.options || []).map((option, optionIndex) => (
                              <div key={optionIndex} className="flex gap-1">
                                <Input
                                  value={option}
                                  onChange={(e) => updateFieldOption(fieldIndex, optionIndex, e.target.value)}
                                  placeholder={`Option ${optionIndex + 1}`}
                                  className="flex-1 text-xs h-7"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFieldOption(fieldIndex, optionIndex)}
                                  className="shrink-0 h-7 w-7 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Default Value */}
                      <div>
                        <Label className="text-xs">Default Value (Optional)</Label>
                        {field.type === 'date' ? (
                          <Input
                            type="date"
                            value={field.defaultValue || ''}
                            onChange={(e) => updateFormField(fieldIndex, { defaultValue: e.target.value })}
                            className="text-xs mt-1"
                          />
                        ) : field.type === 'checkbox' ? (
                          <select
                            value={field.defaultValue || ''}
                            onChange={(e) => updateFormField(fieldIndex, { defaultValue: e.target.value })}
                            className="w-full text-xs border rounded px-2 py-1.5 mt-1"
                          >
                            <option value="">None</option>
                            {(field.options || []).map((option, idx) => (
                              <option key={idx} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : ['select', 'radio'].includes(field.type) ? (
                          <select
                            value={field.defaultValue || ''}
                            onChange={(e) => updateFormField(fieldIndex, { defaultValue: e.target.value })}
                            className="w-full text-xs border rounded px-2 py-1.5 mt-1"
                          >
                            <option value="">None</option>
                            {(field.options || []).map((option, idx) => (
                              <option key={idx} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            value={field.defaultValue || ''}
                            onChange={(e) => updateFormField(fieldIndex, { defaultValue: e.target.value })}
                            placeholder="Enter default value"
                            className="text-xs mt-1"
                          />
                        )}
                      </div>

                      {/* Required checkbox */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id={`required-${field.id}`}
                          checked={field.required || false}
                          onChange={(e) => updateFormField(fieldIndex, { required: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`required-${field.id}`} className="text-xs cursor-pointer">
                          Required field
                        </Label>
                      </div>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFormField(fieldIndex)}
                      className="shrink-0 h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {(formData.formFields || []).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No fields added yet. Click "Add field..." to start.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Validations */}
        {(selectedNode.type === 'text' || selectedNode.type === 'date') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Validation Rules</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addValidation}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {(formData.validations || []).map((validation, index) => (
                <div key={index} className="p-2 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <select
                      value={validation.type}
                      onChange={(e) => updateValidation(index, { 
                        ...validation, 
                        type: e.target.value as ValidationRule['type']
                      })}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="required">Required</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="min">Min Length</option>
                      <option value="max">Max Length</option>
                      <option value="pattern">Pattern</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeValidation(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {(validation.type === 'min' || validation.type === 'max' || validation.type === 'pattern') && (
                    <Input
                      value={validation.value?.toString() || ''}
                      onChange={(e) => updateValidation(index, { 
                        ...validation, 
                        value: validation.type === 'pattern' ? e.target.value : Number(e.target.value)
                      })}
                      placeholder={validation.type === 'pattern' ? 'Regex pattern' : 'Value'}
                      className="text-xs"
                    />
                  )}
                  <Input
                    value={validation.message || ''}
                    onChange={(e) => updateValidation(index, { 
                      ...validation, 
                      message: e.target.value 
                    })}
                    placeholder="Error message"
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Node ID (read-only) */}
        <div className="pt-4 border-t">
          <Label className="text-xs text-muted-foreground">Node ID</Label>
          <p className="text-xs font-mono mt-1">{selectedNode.id}</p>
        </div>
      </div>
    </div>
  );
}
