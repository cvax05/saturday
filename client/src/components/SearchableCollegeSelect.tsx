import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface School {
  id: string;
  slug: string;
  name: string;
}

interface SearchableCollegeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  label: string;
  testId?: string;
}

export default function SearchableCollegeSelect({
  value,
  onValueChange,
  required = false,
  placeholder = "Search for your school...",
  label,
  testId = "select-school"
}: SearchableCollegeSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch schools from API
  const { data: schoolsData, isLoading } = useQuery<{ schools: School[] }>({
    queryKey: ['/api/schools'],
  });

  const schools = schoolsData?.schools || [];

  const filteredSchools = useMemo(() => {
    if (!searchTerm) return schools;
    return schools.filter(school =>
      school.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [schools, searchTerm]);

  const selectedSchoolName = schools.find(school => school.slug === value)?.name || value;

  const handleSelect = (selectedSchool: School) => {
    onValueChange(selectedSchool.slug);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <div>
      <Label htmlFor="school">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            data-testid={testId}
            disabled={isLoading}
          >
            {isLoading ? "Loading schools..." : selectedSchoolName || placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-3 border-b">
            <Input
              placeholder="Search schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              data-testid="input-college-search"
            />
          </div>
          <ScrollArea className="h-60">
            <div className="p-1">
              {isLoading ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  Loading schools...
                </div>
              ) : filteredSchools.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No schools found
                </div>
              ) : (
                filteredSchools.map((school) => (
                  <button
                    key={school.id}
                    onClick={() => handleSelect(school)}
                    className="w-full flex items-center justify-between p-2 text-sm hover:bg-accent rounded-sm text-left"
                    data-testid={`option-${school.slug}`}
                  >
                    <span>{school.name}</span>
                    {value === school.slug && <Check className="h-4 w-4" />}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}