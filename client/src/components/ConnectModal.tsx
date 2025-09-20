import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Users } from "lucide-react";

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  userImage?: string;
  userAge: number;
  groupSize: string;
  preferredAlcohol: string;
}

export default function ConnectModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  userImage,
  userAge,
  groupSize,
  preferredAlcohol
}: ConnectModalProps) {
  
  const handleConfirm = () => {
    console.log(`Confirmed pregame with ${userName}`);
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-connect">
        <DialogHeader>
          <DialogTitle>Connect and Pregame</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userImage} alt={userName} />
              <AvatarFallback className="text-lg">
                {userName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{userName}, {userAge}</p>
              <p className="text-sm text-muted-foreground">Ready to pregame together?</p>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">Group Size:</span>
              <span>{groupSize} people</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">Prefers:</span>
              <span>{preferredAlcohol}</span>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-md p-3">
            <p className="text-sm font-medium mb-1">📝 Reminder</p>
            <p className="text-sm">
              After your pregame, you'll have <strong>48 hours</strong> to rate your experience. 
              This keeps our community safe and accountable!
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              data-testid="button-cancel-connect"
            >
              Not Now
            </Button>
            <Button 
              onClick={handleConfirm} 
              className="flex-1"
              data-testid="button-confirm-connect"
            >
              <Clock className="h-4 w-4 mr-2" />
              Connect & Pregame
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}