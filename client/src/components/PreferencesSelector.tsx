import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { UserPreferences } from "@shared/schema";

interface PreferencesSelectorProps {
  value: UserPreferences;
  onChange: (preferences: UserPreferences) => void;
  className?: string;
}

const PREFERENCE_OPTIONS = {
  alcohol: ["Beer", "Seltzer", "Liquor", "Wine", "Shots", "Mixed Drinks"],
  music: ["Pop", "Rap", "EDM", "House", "Rock", "Country"],
  vibe: ["Chill", "Blackout", "Dance", "Kickback", "Themed"],
};

const CATEGORY_LABELS = {
  alcohol: "Alcohol",
  music: "Music",
  vibe: "Vibe",
};

export default function PreferencesSelector({ value, onChange, className }: PreferencesSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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

  const handleOtherChange = (text: string) => {
    onChange({
      ...value,
      other: text || undefined,
    });
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
                  <div className="grid grid-cols-2 gap-3">
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
                </div>
              )}
            </Card>
          );
        })}
        
        {/* Custom preferences input */}
        <div>
          <Label htmlFor="other-preferences" className="text-sm sm:text-base mb-2 block">
            Other Preferences (Optional)
          </Label>
          <Input
            id="other-preferences"
            type="text"
            placeholder="e.g., BYOB only, no hard liquor, etc."
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
