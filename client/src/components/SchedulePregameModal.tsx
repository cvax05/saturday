import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin } from "lucide-react";

interface SchedulePregameModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantName: string;
  participantImage?: string;
  onSchedule: (scheduleData: {
    date: string;
    time: string;
    location?: string;
    notes?: string;
  }) => void;
  initialValues?: {
    date?: string;
    time?: string;
    location?: string;
    notes?: string;
  };
}

// Helper function to convert Date to local YYYY-MM-DD string (timezone-safe)
const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to generate next N Saturdays
const getNextSaturdays = (count: number = 10): { date: Date; isoString: string; displayText: string }[] => {
  const saturdays: { date: Date; isoString: string; displayText: string }[] = [];
  const today = new Date();
  let current = new Date(today);
  
  // Find the next Saturday
  const daysUntilSaturday = (6 - current.getDay() + 7) % 7;
  if (daysUntilSaturday === 0 && current.getHours() >= 12) {
    // If it's Saturday afternoon, start from next Saturday
    current.setDate(current.getDate() + 7);
  } else {
    current.setDate(current.getDate() + daysUntilSaturday);
  }
  
  // Generate the next saturdays
  for (let i = 0; i < count; i++) {
    const saturdayDate = new Date(current);
    // Use timezone-safe local date formatting instead of toISOString()
    const isoString = formatDateToLocal(saturdayDate);
    
    // Verify this is actually a Saturday (day 6)
    if (saturdayDate.getDay() !== 6) {
      console.error(`Generated non-Saturday date: ${isoString}, day: ${saturdayDate.getDay()}`);
    }
    
    // Format display text (e.g., "Sat, Nov 2" or "This Saturday" for the first one)
    const displayText = saturdayDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    
    saturdays.push({
      date: saturdayDate,
      isoString,
      displayText: i === 0 ? `This Saturday (${displayText})` : displayText
    });
    
    current.setDate(current.getDate() + 7);
  }
  
  return saturdays;
};

export default function SchedulePregameModal({
  isOpen,
  onClose,
  participantName,
  participantImage,
  onSchedule,
  initialValues
}: SchedulePregameModalProps) {
  const upcomingSaturdays = getNextSaturdays(10);
  
  // Default to next Saturday if no initial value
  const defaultDate = initialValues?.date || upcomingSaturdays[0]?.isoString || "";
  
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(initialValues?.time || "");
  const [location, setLocation] = useState(initialValues?.location || "");
  const [notes, setNotes] = useState(initialValues?.notes || "");

  // Update date when modal opens if no date is set
  useEffect(() => {
    if (isOpen && !date) {
      setDate(upcomingSaturdays[0]?.isoString || "");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!date || !time) {
      alert("Please select both a Saturday and time");
      return;
    }

    onSchedule({
      date,
      time,
      location,
      notes
    });

    // Reset form
    setDate(upcomingSaturdays[0]?.isoString || "");
    setTime("");
    setLocation("");
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-schedule-pregame">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Pregame
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-md p-3">
            <p className="text-sm font-medium">Pregame with {participantName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Pick a Saturday, time, and location
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="saturday">Saturday *</Label>
              <Select 
                value={date} 
                onValueChange={setDate}
              >
                <SelectTrigger 
                  id="saturday" 
                  className="w-full" 
                  data-testid="select-saturday"
                >
                  <SelectValue placeholder="Select a Saturday" />
                </SelectTrigger>
                <SelectContent>
                  {upcomingSaturdays.map((saturday) => (
                    <SelectItem 
                      key={saturday.isoString} 
                      value={saturday.isoString}
                      data-testid={`option-saturday-${saturday.isoString}`}
                    >
                      {saturday.displayText}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="time">Time *</Label>
              <div className="relative">
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-10"
                  required
                  data-testid="input-time"
                />
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location (optional)</Label>
            <div className="relative">
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where should we meet?"
                className="pl-10"
                data-testid="input-location"
              />
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details or plans..."
              className="min-h-[80px]"
              data-testid="textarea-notes"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              data-testid="button-schedule"
              disabled={!date || !time}
            >
              Schedule Pregame
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
