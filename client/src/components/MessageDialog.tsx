import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Send } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MessageDialogProps {
  recipientName: string;
  recipientEmail: string;
  children?: React.ReactNode;
}

export default function MessageDialog({ recipientName, recipientEmail, children }: MessageDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { recipientEmail: string; content: string }) => {
      // Get current user email from localStorage
      const currentUserData = localStorage.getItem('currentUser');
      if (!currentUserData) {
        throw new Error('No user logged in');
      }
      
      const currentUser = JSON.parse(currentUserData);
      const messageData = {
        ...data,
        senderEmail: currentUser.email
      };
      
      return await apiRequest('POST', '/api/messages/send', messageData);
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: `Your message has been sent to ${recipientName}`,
      });
      setMessage("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    
    sendMessageMutation.mutate({
      recipientEmail,
      content: message.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" data-testid="button-message">
            <MessageCircle className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Message to {recipientName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
              data-testid="textarea-message"
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/500 characters
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            data-testid="button-send-message"
          >
            {sendMessageMutation.isPending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}