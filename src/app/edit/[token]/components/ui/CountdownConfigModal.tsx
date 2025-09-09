// components/ui/CountdownConfigModal.tsx - Countdown Timer Configuration Modal
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { Clock, Calendar, Timer, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface CountdownConfig {
  countdown_end_date?: string;
  countdown_duration_days?: string;
  countdown_duration_hours?: string;
  countdown_behavior?: 'reset' | 'stop' | 'hide';
}

interface CountdownConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
}

export function CountdownConfigModal({ isOpen, onClose, sectionId }: CountdownConfigModalProps) {
  logger.dev('🕐 CountdownConfigModal render:', () => ({ isOpen, sectionId }));
  
  const { content, updateElementContent } = useEditStore();
  const section = content[sectionId];
  
  const [config, setConfig] = useState<CountdownConfig>({
    countdown_end_date: '',
    countdown_duration_days: '3',
    countdown_duration_hours: '0',
    countdown_behavior: 'reset'
  });
  
  const [configMode, setConfigMode] = useState<'duration' | 'specific'>('duration');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load current countdown configuration
  useEffect(() => {
    if (section && section.elements) {
      const currentConfig = {
        countdown_end_date: String(section.elements.countdown_end_date?.content || ''),
        countdown_duration_days: String(section.elements.countdown_duration_days?.content || '3'),
        countdown_duration_hours: String(section.elements.countdown_duration_hours?.content || '0'),
        countdown_behavior: (String(section.elements.countdown_behavior?.content || 'reset') as 'reset' | 'stop' | 'hide')
      };
      
      setConfig(currentConfig);
      
      // Determine initial mode based on whether there's a specific end date set
      if (currentConfig.countdown_end_date && currentConfig.countdown_end_date.trim()) {
        setConfigMode('specific');
      } else {
        setConfigMode('duration');
      }
    }
  }, [section, isOpen]);

  // Calculate preview of countdown end time
  const previewEndTime = useMemo(() => {
    if (configMode === 'specific' && config.countdown_end_date) {
      const endDate = new Date(config.countdown_end_date);
      if (!isNaN(endDate.getTime())) {
        return endDate.toLocaleString();
      }
    } else if (configMode === 'duration') {
      const days = parseInt(config.countdown_duration_days || '0', 10);
      const hours = parseInt(config.countdown_duration_hours || '0', 10);
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + days);
      endTime.setHours(endTime.getHours() + hours);
      return endTime.toLocaleString();
    }
    return null;
  }, [config, configMode]);

  // Validate configuration
  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (configMode === 'specific') {
      if (!config.countdown_end_date || !config.countdown_end_date.trim()) {
        newErrors.countdown_end_date = 'End date is required';
      } else {
        const endDate = new Date(config.countdown_end_date);
        if (isNaN(endDate.getTime())) {
          newErrors.countdown_end_date = 'Invalid date format';
        } else if (endDate <= new Date()) {
          newErrors.countdown_end_date = 'End date must be in the future';
        }
      }
    } else {
      const days = parseInt(config.countdown_duration_days || '0', 10);
      const hours = parseInt(config.countdown_duration_hours || '0', 10);
      
      if (isNaN(days) || days < 0) {
        newErrors.countdown_duration_days = 'Days must be a positive number';
      }
      
      if (isNaN(hours) || hours < 0 || hours > 23) {
        newErrors.countdown_duration_hours = 'Hours must be between 0 and 23';
      }
      
      if (days === 0 && hours === 0) {
        newErrors.countdown_duration_days = 'Duration must be at least 1 hour';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSave = async () => {
    if (!validateConfig()) return;

    setIsSaving(true);
    setErrors({});

    try {
      // Prepare update data - clear the unused fields based on mode
      const updateData = {
        ...config,
        // Clear unused fields
        countdown_end_date: configMode === 'specific' ? config.countdown_end_date : '',
        countdown_duration_days: configMode === 'duration' ? config.countdown_duration_days : '3',
        countdown_duration_hours: configMode === 'duration' ? config.countdown_duration_hours : '0'
      };

      // Update section content using individual element updates
      Object.entries(updateData).forEach(([key, value]) => {
        updateElementContent(sectionId, key, value || '');
      });
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
      
      logger.info('Countdown configuration saved:', updateData);
    } catch (error) {
      logger.error('Failed to save countdown configuration:', error);
      setErrors({ general: 'Failed to save configuration. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Format datetime for input (convert to local timezone)
  const formatDateTimeForInput = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Format as YYYY-MM-DDTHH:MM for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Countdown Timer Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuration Mode Toggle */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Configuration Mode</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={configMode === 'duration' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConfigMode('duration')}
                className="flex-1"
              >
                <Timer className="w-4 h-4 mr-1" />
                Duration
              </Button>
              <Button
                type="button"
                variant={configMode === 'specific' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConfigMode('specific')}
                className="flex-1"
              >
                <Calendar className="w-4 h-4 mr-1" />
                Specific Date
              </Button>
            </div>
          </div>

          {/* Duration Mode Fields */}
          {configMode === 'duration' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="duration_days">Days From Now</Label>
                  <Input
                    id="duration_days"
                    type="number"
                    min="0"
                    max="365"
                    value={config.countdown_duration_days}
                    onChange={(e) => setConfig(prev => ({ ...prev, countdown_duration_days: e.target.value }))}
                    placeholder="3"
                  />
                  {errors.countdown_duration_days && (
                    <p className="text-sm text-red-600">{errors.countdown_duration_days}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_hours">Additional Hours</Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    min="0"
                    max="23"
                    value={config.countdown_duration_hours}
                    onChange={(e) => setConfig(prev => ({ ...prev, countdown_duration_hours: e.target.value }))}
                    placeholder="0"
                  />
                  {errors.countdown_duration_hours && (
                    <p className="text-sm text-red-600">{errors.countdown_duration_hours}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Timer will count down from the specified duration starting from when the page loads
              </p>
            </div>
          )}

          {/* Specific Date Mode Fields */}
          {configMode === 'specific' && (
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date & Time</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formatDateTimeForInput(config.countdown_end_date || '')}
                onChange={(e) => setConfig(prev => ({ ...prev, countdown_end_date: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)} // Prevent past dates
              />
              {errors.countdown_end_date && (
                <p className="text-sm text-red-600">{errors.countdown_end_date}</p>
              )}
              <p className="text-xs text-gray-500">
                Timer will count down to this exact date and time
              </p>
            </div>
          )}

          {/* Countdown Behavior */}
          <div className="space-y-2">
            <Label htmlFor="behavior">When Timer Expires</Label>
            <Select
              value={config.countdown_behavior}
              onValueChange={(value: 'reset' | 'stop' | 'hide') => 
                setConfig(prev => ({ ...prev, countdown_behavior: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reset">Reset Timer (for ongoing promotions)</SelectItem>
                <SelectItem value="stop">Stop at 00:00 & Show "Expired"</SelectItem>
                <SelectItem value="hide">Hide Timer When Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {previewEndTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Timer Preview</p>
                  <p className="text-sm text-blue-700">
                    Countdown will end: <strong>{previewEndTime}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-600">Countdown settings saved successfully!</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>,
    document.body
  );
}