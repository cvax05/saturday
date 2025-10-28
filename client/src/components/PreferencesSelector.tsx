import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { useState } from "react";
import type { UserPreferences } from "@shared/schema";

interface PreferencesSelectorProps {
  value: UserPreferences;
  onChange: (preferences: UserPreferences) => void;
  className?: string;
}

const PREFERENCE_OPTIONS = {
  music: ["Pop", "Rap", "EDM", "House", "Rock", "Country"],
  vibe: ["Chill", "Blackout", "Dance", "Kickback", "Themed"],
};

const CATEGORY_LABELS = {
  music: "Music",
  vibe: "Vibe",
};

export default function PreferencesSelector({ value, onChange, className }: PreferencesSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({
    music: "",
    vibe: "",
  });

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCheckboxChange = (category: keyof typeof PREFERENCE_OPTIONS, option: string, checked: boolean) => {
    const currentValues = value[category] || [];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, option];
    } else {
      newValues = currentValues.filter(v => v !== option);
    }
    
    onChange({
      ...value,
      [category]: newValues.length > 0 ? newValues : undefined,
    });
  };

  const handleAddCustom = (category: keyof typeof PREFERENCE_OPTIONS) => {
    const customValue = customInputs[category].trim();
    if (!customValue) return;

    const currentValues = value[category] || [];
    
    // Don't add duplicates
    if (currentValues.includes(customValue)) {
      setCustomInputs({ ...customInputs, [category]: "" });
      return;
    }

    onChange({
      ...value,
      [category]: [...currentValues, customValue],
    });

    // Clear the input
    setCustomInputs({ ...customInputs, [category]: "" });
  };

  const handleRemoveCustom = (category: keyof typeof PREFERENCE_OPTIONS, option: string) => {
    const currentValues = value[category] || [];
    const newValues = currentValues.filter(v => v !== option);
    
    onChange({
      ...value,
      [category]: newValues.length > 0 ? newValues : undefined,
    });
  };

  const handleOtherChange = (text: string) => {
    onChange({
      ...value,
      other: text || undefined,
    });
  };

  // Get custom values (non-predefined) for a category
  const getCustomValues = (category: keyof typeof PREFERENCE_OPTIONS): string[] => {
    const currentValues = value[category] || [];
    const predefinedOptions = PREFERENCE_OPTIONS[category];
    return currentValues.filter(v => !predefinedOptions.includes(v));
  };

  return (
    <div className={className}>
      <Label className="text-sm sm:text-base mb-3 block">Preferences</Label>
      <p className="text-xs sm:text-sm text-muted-foreground mb-4">
        Select your preferences to help others find the perfect pregame match
      </p>
      
      <div className="space-y-3">
        {(Object.keys(PREFERENCE_OPTIONS) as Array<keyof typeof PREFERENCE_OPTIONS>).map((category) => {
          const isExpanded = expandedCategories.has(category);
          const selectedCount = (value[category] || []).length;
          const customValues = getCustomValues(category);
          
          return (
            <Card key={category} className="overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between hover-elevate active-elevate-2"
                data-testid={`button-category-${category}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm sm:text-base">
                    {CATEGORY_LABELS[category]}
                  </span>
                  {selectedCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({selectedCount} selected)
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t">
                  {/* Predefined options */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {PREFERENCE_OPTIONS[category].map((option) => {
                      const isChecked = (value[category] || []).includes(option);
                      
                      return (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${category}-${option}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(category, option, checked as boolean)
                            }
                            data-testid={`checkbox-${category}-${option.toLowerCase().replace(/\s+/g, '-')}`}
                          />
                          <Label
                            htmlFor={`${category}-${option}`}
                            className="text-sm cursor-pointer"
                          >
                            {option}
                          </Label>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom values display */}
                  {customValues.length > 0 && (
                    <div className="mb-3 pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Custom:</p>
                      <div className="flex flex-wrap gap-2">
                        {customValues.map((customValue) => (
                          <div
                            key={customValue}
                            className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                            data-testid={`custom-value-${category}-${customValue.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <span>{customValue}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustom(category, customValue)}
                              className="hover:text-destructive"
                              data-testid={`button-remove-${category}-${customValue.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Add custom input */}
                  <div className="pt-2 border-t">
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Add custom {category}:
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder={`e.g., ${category === 'music' ? 'Jazz' : 'Game Night'}`}
                        value={customInputs[category]}
                        onChange={(e) => setCustomInputs({ ...customInputs, [category]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustom(category);
                          }
                        }}
                        maxLength={30}
                        data-testid={`input-custom-${category}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        onClick={() => handleAddCustom(category)}
                        disabled={!customInputs[category].trim()}
                        data-testid={`button-add-custom-${category}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        
        {/* Other preferences input */}
        <div>
          <Label htmlFor="other-preferences" className="text-sm sm:text-base mb-2 block">
            Other Preferences (Optional)
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            For preferences that don't fit the categories above
          </p>
          <Input
            id="other-preferences"
            type="text"
            placeholder="Add any other preferences..."
            value={value.other || ""}
            onChange={(e) => handleOtherChange(e.target.value)}
            maxLength={100}
            data-testid="input-other-preferences"
            className="w-full"
          />
          {value.other && (
            <p className="text-xs text-muted-foreground mt-1">
              {value.other.length}/100 characters
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
