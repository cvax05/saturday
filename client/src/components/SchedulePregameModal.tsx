import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function SchedulePregameModal({
  isOpen,
  onClose,
  participantName,
  participantImage,
  onSchedule,
  initialValues
}: SchedulePregameModalProps) {
  const [date, setDate] = useState(initialValues?.date || "");
  const [time, setTime] = useState(initialValues?.time || "");
  const [location, setLocation] = useState(initialValues?.location || "");
  const [notes, setNotes] = useState(initialValues?.notes || "");

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = () => {
    if (!date || !time) {
      alert("Please select both date and time");
      return;
    }

    onSchedule({
      date,
      time,
      location,
      notes
    });

    // Reset form
    setDate("");
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
              You can change the date and time anytime before the event
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10"
                  required
                  data-testid="input-date"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
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