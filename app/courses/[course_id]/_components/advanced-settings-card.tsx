'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Settings,
  HelpCircle,
  Save,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetCoursesAdvancedSettingsQuery,
  useUpdateCoursesAdvancedSettingsMutation,
} from '@/services/studio';

interface AdvancedSetting {
  value: any;
  display_name: string;
  help: string;
  deprecated: boolean;
  hide_on_enabled_publisher: boolean;
}

interface AdvancedSettingsCardProps {
  courseId: string;
  expandedSections: Record<string, boolean>;
  toggleSection: (index: number | string) => void;
}

// Helper function to determine the field type based on the setting
function getFieldType(
  _key: string,
  setting: AdvancedSetting,
): 'boolean' | 'date' | 'select' | 'number' | 'array' | 'object' | 'text' {
  const { value, display_name, help } = setting;

  // Check for boolean type
  if (typeof value === 'boolean' || value === 'true' || value === 'false') {
    return 'boolean';
  }

  // Check for date type based on display_name or help containing date-related keywords
  const dateKeywords = ['date', 'Date'];
  const displayNameLower = display_name.toLowerCase();
  const helpLower = help.toLowerCase();
  if (
    dateKeywords.some(
      (keyword) =>
        displayNameLower.includes(keyword.toLowerCase()) ||
        helpLower.includes(keyword.toLowerCase()),
    )
  ) {
    // Exclude fields that mention "date format" as they're not date inputs
    if (!helpLower.includes('format for') && !helpLower.includes('date display format')) {
      return 'date';
    }
  }

  // Check for select type based on "Valid values are" in help text
  if (help.includes('Valid values are') || help.includes('valid values are')) {
    return 'select';
  }

  // Check for select type based on "can be set to one of" pattern
  if (help.includes('can be set to one of')) {
    return 'select';
  }

  // Check for number type
  if (typeof value === 'number' && value !== null) {
    return 'number';
  }

  // Check for array type
  if (Array.isArray(value)) {
    return 'array';
  }

  // Check for object type
  if (typeof value === 'object' && value !== null) {
    return 'object';
  }

  return 'text';
}

// Helper function to extract valid values from help text
function extractValidValues(help: string): string[] {
  // Pattern: Valid values are "a", "b", "c", and "d".
  const validValuesMatch = help.match(/[Vv]alid values are\s+(.+?)(?:\.|$)/i);

  if (validValuesMatch) {
    const valuesString = validValuesMatch[1];
    // Extract all quoted values
    const quotedValues = valuesString.match(/"([^"]+)"/g);
    if (quotedValues) {
      return quotedValues.map((v) => v.replace(/"/g, ''));
    }
  }

  // Pattern: can be set to one of three values: 'a', 'b' and 'c'
  const oneOfMatch = help.match(/can be set to one of[^:]*:\s*(.+?)(?:\.|$)/i);
  if (oneOfMatch) {
    const valuesString = oneOfMatch[1];
    const quotedValues = valuesString.match(/'([^']+)'/g);
    if (quotedValues) {
      return quotedValues.map((v) => v.replace(/'/g, ''));
    }
  }

  return [];
}

// Format value for display
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

// Setting Field Component
function SettingField({
  settingKey,
  setting,
  value,
  onChange,
}: {
  settingKey: string;
  setting: AdvancedSetting;
  value: any;
  onChange: (key: string, value: any) => void;
}) {
  const fieldType = getFieldType(settingKey, setting);
  const validValues = fieldType === 'select' ? extractValidValues(setting.help) : [];

  const baseInputClasses =
    'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent';

  switch (fieldType) {
    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={value === true || value === 'true'}
            onCheckedChange={(checked) => onChange(settingKey, checked)}
            className="data-[state=checked]:bg-amber-500"
          />
          <span className="text-sm text-gray-600">
            {value === true || value === 'true' ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      );

    case 'date':
      return (
        <input
          type="date"
          value={value ? String(value).split('T')[0] : ''}
          onChange={(e) => onChange(settingKey, e.target.value || null)}
          className={baseInputClasses}
        />
      );

    case 'select':
      return (
        <Select
          value={value !== null ? String(value) : ''}
          onValueChange={(newValue) => onChange(settingKey, newValue)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {validValues.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'number':
      return (
        <input
          type="number"
          value={value !== null ? String(value) : ''}
          onChange={(e) =>
            onChange(settingKey, e.target.value === '' ? null : Number(e.target.value))
          }
          className={baseInputClasses}
        />
      );

    case 'array':
    case 'object':
      return (
        <textarea
          value={formatValue(value)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onChange(settingKey, parsed);
            } catch {
              // Keep as string while typing
            }
          }}
          onBlur={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onChange(settingKey, parsed);
            } catch {
              // Revert to original if invalid JSON
            }
          }}
          className={`${baseInputClasses} min-h-[80px] font-mono text-xs`}
          placeholder={fieldType === 'array' ? '[]' : '{}'}
        />
      );

    default:
      return (
        <input
          type="text"
          value={value !== null && value !== undefined ? String(value) : ''}
          onChange={(e) => onChange(settingKey, e.target.value || null)}
          className={baseInputClasses}
          placeholder="Enter value"
        />
      );
  }
}

export function AdvancedSettingsCard({
  courseId,
  expandedSections,
  toggleSection,
}: AdvancedSettingsCardProps) {
  // Fetch advanced settings
  const {
    data: advancedSettings,
    isLoading: isLoadingAdvancedSettings,
    refetch: refetchAdvancedSettings,
  } = useGetCoursesAdvancedSettingsQuery(
    { course_id: courseId },
    { skip: !courseId || !expandedSections['advancedSettings'] },
  );

  const [updateAdvancedSettings, { isLoading: isSavingAdvancedSettings }] =
    useUpdateCoursesAdvancedSettingsMutation();

  // Local state for edited settings
  const [editedSettings, setEditedSettings] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out deprecated settings and sort alphabetically
  const filteredSettings = useMemo(() => {
    if (!advancedSettings) return [];
    const searchLower = searchQuery.toLowerCase().trim();
    return Object.entries(advancedSettings as Record<string, AdvancedSetting>)
      .filter(([key, setting]) => {
        if (setting.deprecated) return false;
        if (!searchLower) return true;
        // Search in key, display_name, and help text
        return (
          key.toLowerCase().includes(searchLower) ||
          setting.display_name.toLowerCase().includes(searchLower) ||
          setting.help.toLowerCase().includes(searchLower)
        );
      })
      .sort(([, a], [, b]) => a.display_name.localeCompare(b.display_name));
  }, [advancedSettings, searchQuery]);

  // Initialize edited settings when advanced settings load
  useEffect(() => {
    if (advancedSettings) {
      const initialValues: Record<string, any> = {};
      Object.entries(advancedSettings as Record<string, AdvancedSetting>).forEach(
        ([key, setting]) => {
          if (!setting.deprecated) {
            initialValues[key] = setting.value;
          }
        },
      );
      setEditedSettings(initialValues);
      setHasChanges(false);
    }
  }, [advancedSettings]);

  const handleSettingChange = (key: string, value: any) => {
    setEditedSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Build the update payload with only changed values
    const changedSettings: Record<string, any> = {};
    Object.entries(editedSettings).forEach(([key, value]) => {
      const originalValue = (advancedSettings as Record<string, AdvancedSetting>)?.[key]?.value;
      if (JSON.stringify(value) !== JSON.stringify(originalValue)) {
        changedSettings[key] = { value };
      }
    });

    if (Object.keys(changedSettings).length > 0) {
      try {
        await updateAdvancedSettings({
          course_id: courseId,
          advanced_settings: changedSettings,
        }).unwrap();
        // Refetch to get the updated values
        refetchAdvancedSettings();
        setHasChanges(false);
      } catch (error) {
        console.error('Error saving advanced settings:', error);
      }
    }
  };

  return (
    <TooltipProvider>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-800">Advanced Settings</h2>
          {hasChanges && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSavingAdvancedSettings}
              className="flex items-center gap-2 rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-4 py-2 text-sm font-medium text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)] disabled:opacity-50"
              data-testid="save-advanced-settings-button"
              aria-label={
                isSavingAdvancedSettings ? 'Saving advanced settings' : 'Save advanced settings'
              }
              aria-busy={isSavingAdvancedSettings}
            >
              {isSavingAdvancedSettings ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              Save Changes
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-md border border-gray-200">
          <div
            className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
            onClick={() => toggleSection('advancedSettings')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSection('advancedSettings');
              }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={expandedSections['advancedSettings']}
            aria-controls="advanced-settings-content"
            aria-label="Toggle advanced settings"
            data-testid="advanced-settings-toggle"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-amber-500" aria-hidden="true" />
              <h3 className="font-medium text-gray-800">Course Configuration</h3>
            </div>
            <div aria-hidden="true">
              {expandedSections['advancedSettings'] ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>

          {expandedSections['advancedSettings'] && (
            <div
              id="advanced-settings-content"
              className="border-t border-gray-200"
              aria-busy={isLoadingAdvancedSettings}
              data-testid="advanced-settings-content"
            >
              {isLoadingAdvancedSettings ? (
                <div
                  className="flex justify-center p-8"
                  role="status"
                  aria-label="Loading advanced settings"
                  data-testid="advanced-settings-loading"
                >
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                </div>
              ) : !advancedSettings ? (
                <div className="p-8">
                  <DefaultEmptyBox message="No advanced settings available." />
                </div>
              ) : (
                <>
                  {/* Search Bar */}
                  <div className="border-b border-gray-200 p-4" role="search">
                    <div className="relative">
                      <Search
                        className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
                        aria-hidden="true"
                      />
                      <input
                        type="search"
                        id="advanced-settings-search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search settings..."
                        aria-label="Search advanced settings"
                        className="w-full rounded-md border border-gray-300 py-2 pr-10 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        data-testid="advanced-settings-search"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          aria-label="Clear search"
                          data-testid="advanced-settings-search-clear"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredSettings.length === 0 ? (
                    <div className="p-8" data-testid="advanced-settings-empty">
                      <DefaultEmptyBox message={`No settings found matching "${searchQuery}"`} />
                    </div>
                  ) : (
                    <div
                      className="max-h-[600px] space-y-4 overflow-y-auto p-4"
                      role="list"
                      aria-label="Advanced settings list"
                      data-testid="advanced-settings-list"
                    >
                      {filteredSettings.map(([key, setting]) => (
                        <div
                          key={key}
                          role="listitem"
                          className="rounded-lg border border-gray-100 p-4 transition-colors hover:border-gray-200"
                          data-testid={`setting-${key}`}
                        >
                          <div className="mb-2 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <label
                                htmlFor={`setting-${key}`}
                                className="text-sm font-medium text-gray-700"
                              >
                                {setting.display_name}
                              </label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="text-gray-400 hover:text-gray-600"
                                    aria-label={`Help for ${setting.display_name}`}
                                    data-testid={`setting-help-${key}`}
                                  >
                                    <HelpCircle className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs text-xs">
                                  <p>{setting.help}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                          <SettingField
                            settingKey={key}
                            setting={setting}
                            value={editedSettings[key]}
                            onChange={handleSettingChange}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
