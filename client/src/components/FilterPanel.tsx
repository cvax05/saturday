import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Music, Sparkles, Users, X } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface FilterState {
  saturday?: string;
  music?: string;
  vibe?: string;
  groupSizeMin?: string;
  groupSizeMax?: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

// Generate next 8 Saturdays
function getUpcomingSaturdays(): { label: string; value: string }[] {
  const saturdays: { label: string; value: string }[] = [];
  const today = new Date();
  
  // Find next Saturday
  let currentDate = new Date(today);
  currentDate.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
  
  for (let i = 0; i < 8; i++) {
    const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    const month = currentDate.toLocaleDateString('en-US', { month: 'short' });
    const day = currentDate.getDate();
    
    let label = `${month} ${day}`;
    if (i === 0) label = `This Saturday (${month} ${day})`;
    if (i === 1) label = `Next Saturday (${month} ${day})`;
    
    saturdays.push({ label, value: dateStr });
    
    // Move to next Saturday
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return saturdays;
}

const MUSIC_OPTIONS = ["Pop", "Rap", "EDM", "House", "Rock", "Country"];
const VIBE_OPTIONS = ["Chill", "Blackout", "Dance", "Kickback", "Themed"];

export default function FilterPanel({ filters, onFilterChange, onClearFilters }: FilterPanelProps) {
  const saturdays = getUpcomingSaturdays();
  
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');
  
  const updateFilter = (key: keyof FilterState, value: string | undefined) => {
    onFilterChange({ ...filters, [key]: value });
  };
  
  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Filter Groups</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            data-testid="button-clear-filters"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Saturday Availability */}
        <div>
          <Label className="text-sm mb-2 flex items-center gap-2 min-h-[20px]">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Saturday Availability</span>
          </Label>
          <Select
            value={filters.saturday || "all"}
            onValueChange={(value) => updateFilter("saturday", value === "all" ? undefined : value)}
          >
            <SelectTrigger data-testid="select-saturday">
              <SelectValue placeholder="Any Saturday" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Saturday</SelectItem>
              {saturdays.map((sat) => (
                <SelectItem key={sat.value} value={sat.value}>
                  {sat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Music Preference */}
        <div>
          <Label className="text-sm mb-2 flex items-center gap-2 min-h-[20px]">
            <Music className="h-4 w-4 flex-shrink-0" />
            Music
          </Label>
          <Select
            value={filters.music || "all"}
            onValueChange={(value) => updateFilter("music", value === "all" ? undefined : value)}
          >
            <SelectTrigger data-testid="select-music">
              <SelectValue placeholder="Any Music" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Music</SelectItem>
              {MUSIC_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Vibe Preference */}
        <div>
          <Label className="text-sm mb-2 flex items-center gap-2 min-h-[20px]">
            <Sparkles className="h-4 w-4 flex-shrink-0" />
            Vibe
          </Label>
          <Select
            value={filters.vibe || "all"}
            onValueChange={(value) => updateFilter("vibe", value === "all" ? undefined : value)}
          >
            <SelectTrigger data-testid="select-vibe">
              <SelectValue placeholder="Any Vibe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Vibe</SelectItem>
              {VIBE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Group Size Min */}
        <div>
          <Label className="text-sm mb-2 flex items-center gap-2 min-h-[20px]">
            <Users className="h-4 w-4 flex-shrink-0" />
            Min People
          </Label>
          <Input
            type="number"
            min="2"
            placeholder="Min"
            value={filters.groupSizeMin || ""}
            onChange={(e) => updateFilter("groupSizeMin", e.target.value)}
            data-testid="input-filter-group-min"
          />
        </div>
        
        {/* Group Size Max */}
        <div>
          <Label className="text-sm mb-2 flex items-center gap-2 min-h-[20px]">
            <Users className="h-4 w-4 flex-shrink-0" />
            Max People
          </Label>
          <Input
            type="number"
            min="2"
            placeholder="Max"
            value={filters.groupSizeMax || ""}
            onChange={(e) => updateFilter("groupSizeMax", e.target.value)}
            data-testid="input-filter-group-max"
          />
        </div>
      </div>
    </Card>
  );
}
