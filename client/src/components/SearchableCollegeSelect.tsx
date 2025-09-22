import { useState, useMemo } from "react";
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

// Comprehensive list of US colleges and universities
const colleges = [
  "Harvard University",
  "Stanford University", 
  "Massachusetts Institute of Technology",
  "Yale University",
  "Princeton University",
  "Columbia University",
  "University of Pennsylvania",
  "Dartmouth College",
  "Brown University",
  "Cornell University",
  "University of Chicago",
  "Northwestern University",
  "Duke University",
  "Vanderbilt University",
  "Rice University",
  "Washington University in St. Louis",
  "Emory University",
  "Georgetown University",
  "Carnegie Mellon University",
  "University of California, Los Angeles",
  "University of California, Berkeley",
  "University of California, San Diego",
  "University of California, Santa Barbara",
  "University of California, Irvine",
  "University of California, Davis",
  "University of California, Santa Cruz",
  "University of California, Riverside",
  "University of California, Merced",
  "University of Southern California",
  "California Institute of Technology",
  "University of Michigan",
  "University of Virginia",
  "University of North Carolina at Chapel Hill",
  "Georgia Institute of Technology",
  "University of Florida",
  "University of Texas at Austin",
  "Texas A&M University",
  "University of Wisconsin-Madison",
  "University of Illinois at Urbana-Champaign",
  "Ohio State University",
  "Pennsylvania State University",
  "University of Washington",
  "University of Maryland",
  "Purdue University",
  "Indiana University",
  "University of Minnesota",
  "University of Iowa",
  "University of Missouri",
  "University of Kansas",
  "University of Nebraska",
  "University of Colorado Boulder",
  "University of Utah",
  "Arizona State University",
  "University of Arizona",
  "University of Nevada, Las Vegas",
  "University of New Mexico",
  "University of Oregon",
  "Oregon State University",
  "University of Idaho",
  "University of Montana",
  "University of Wyoming",
  "University of North Dakota",
  "University of South Dakota",
  "Iowa State University",
  "Kansas State University",
  "Oklahoma State University",
  "University of Oklahoma",
  "Texas Tech University",
  "University of Houston",
  "Southern Methodist University",
  "Texas Christian University",
  "Baylor University",
  "University of Arkansas",
  "Louisiana State University",
  "University of Alabama",
  "Auburn University",
  "University of Georgia",
  "Florida State University",
  "University of Miami",
  "University of Central Florida",
  "Florida International University",
  "University of South Florida",
  "Florida Institute of Technology",
  "University of Tennessee",
  "University of Kentucky",
  "University of Louisville",
  "University of South Carolina",
  "Clemson University",
  "North Carolina State University",
  "Wake Forest University",
  "University of Virginia",
  "Virginia Tech",
  "George Mason University",
  "Virginia Commonwealth University",
  "West Virginia University",
  "University of Delaware",
  "Rutgers University",
  "New Jersey Institute of Technology",
  "Stevens Institute of Technology",
  "New York University",
  "Fordham University",
  "Syracuse University",
  "University of Rochester",
  "Rensselaer Polytechnic Institute",
  "Stony Brook University",
  "University at Buffalo",
  "University at Albany",
  "Binghamton University",
  "Rochester Institute of Technology",
  "Ithaca College",
  "Skidmore College",
  "Vassar College",
  "Barnard College",
  "Colgate University",
  "Hamilton College",
  "Hobart and William Smith Colleges",
  "Union College",
  "University of Vermont",
  "University of New Hampshire",
  "University of Maine",
  "University of Rhode Island",
  "University of Connecticut",
  "Wesleyan University",
  "Trinity College",
  "Quinnipiac University",
  "Fairfield University",
  "Sacred Heart University",
  "University of Massachusetts Amherst",
  "Boston University",
  "Boston College",
  "Northeastern University",
  "Tufts University",
  "Brandeis University",
  "Wellesley College",
  "Williams College",
  "Amherst College",
  "Smith College",
  "Mount Holyoke College",
  "Hampshire College",
  "Clark University",
  "Worcester Polytechnic Institute",
  "Bentley University",
  "Babson College",
  "Emerson College",
  "Suffolk University",
  "Simmons University",
  "Lesley University",
  "Berklee College of Music",
  "University of Alabama at Birmingham",
  "University of Alabama in Huntsville",
  "Troy University",
  "Jacksonville State University",
  "University of South Alabama",
  "Alabama A&M University",
  "Tuskegee University",
  "Samford University",
  "Birmingham-Southern College",
  "Huntingdon College",
  "University of Alaska Anchorage",
  "University of Alaska Fairbanks",
  "Alaska Pacific University",
  "Northern Arizona University",
  "Arizona State University",
  "University of Arizona",
  "Grand Canyon University",
  "Arizona Christian University",
  "Embry-Riddle Aeronautical University",
  "University of Arkansas at Little Rock",
  "Arkansas State University",
  "Arkansas Tech University",
  "Henderson State University",
  "Hendrix College",
  "Lyon College",
  "Ouachita Baptist University",
  "University of Central Arkansas",
  "California State University, Los Angeles",
  "California State University, Long Beach",
  "California State University, Fullerton",
  "California State University, Northridge",
  "California State University, Sacramento",
  "California State University, San Bernardino",
  "California State University, Fresno",
  "California State University, San Jose",
  "San Diego State University",
  "San Francisco State University",
  "California Polytechnic State University, San Luis Obispo",
  "California Polytechnic State University, Pomona",
  "Humboldt State University",
  "Sonoma State University",
  "Chico State University",
  "CSU Channel Islands",
  "CSU Dominguez Hills",
  "CSU East Bay",
  "CSU Monterey Bay",
  "CSU San Marcos",
  "CSU Stanislaus",
  "University of the Pacific",
  "Loyola Marymount University",
  "Pepperdine University",
  "Chapman University",
  "Claremont McKenna College",
  "Pomona College",
  "Harvey Mudd College",
  "Scripps College",
  "Pitzer College",
  "Occidental College",
  "University of San Francisco",
  "Santa Clara University",
  "Saint Mary's College of California",
  "Mills College",
  "Dominican University of California",
  "California Lutheran University",
  "Azusa Pacific University",
  "Biola University",
  "California Baptist University",
  "California Institute of the Arts",
  "Art Center College of Design",
  "Otis College of Art and Design",
  "Colorado State University",
  "University of Colorado Denver",
  "University of Colorado Colorado Springs",
  "University of Northern Colorado",
  "Colorado School of Mines",
  "Colorado College",
  "Denver University",
  "Regis University",
  "Metropolitan State University of Denver",
  "Adams State University",
  "Colorado Mesa University",
  "Fort Lewis College",
  "Western Colorado University"
].sort();

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

  const filteredColleges = useMemo(() => {
    if (!searchTerm) return colleges;
    return colleges.filter(college =>
      college.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleSelect = (selectedCollege: string) => {
    onValueChange(selectedCollege);
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
          >
            {value || placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-3 border-b">
            <Input
              placeholder="Search colleges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              data-testid="input-college-search"
            />
          </div>
          <ScrollArea className="h-60">
            <div className="p-1">
              {filteredColleges.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No colleges found
                </div>
              ) : (
                filteredColleges.map((college) => (
                  <button
                    key={college}
                    onClick={() => handleSelect(college)}
                    className="w-full flex items-center justify-between p-2 text-sm hover:bg-accent rounded-sm text-left"
                    data-testid={`option-${college.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  >
                    <span>{college}</span>
                    {value === college && <Check className="h-4 w-4" />}
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