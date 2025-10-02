import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Send } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest, authQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AuthResponse } from "@shared/schema";

interface MessageDialogProps {
  recipientName: string;
  recipientEmail: string;
  recipientId: string;
  children?: React.ReactNode;
}

export default function MessageDialog({ recipientName, recipientEmail, recipientId, children }: MessageDialogProps) {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get current user from API
  const { data: authData } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    queryFn: authQueryFn as any,
  });

  const currentUser = authData?.user;

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { recipientId: string; content: string }) => {
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      // Step 1: Create or get conversation with recipient
      const conversationResponse = await apiRequest('POST', '/api/messages/conversations', {
        participantIds: [data.recipientId]
      });
      const conversationData = await conversationResponse.json();
      const conversationId = conversationData.conversation.id;
      
      // Step 2: Send message to the conversation
      const messageResponse = await apiRequest('POST', `/api/messages/${conversationId}`, {
        content: data.content
      });
      
      return { conversationId, messageResponse };
    },
    onSuccess: (data) => {
      toast({
        title: "Message sent!",
        description: `Your message has been sent to ${recipientName}`,
      });
      setMessage("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', data.conversationId] });
      
      // Navigate to messages page to see the conversation
      setLocation('/messages');
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
    if (!message.trim() || !currentUser) return;
    
    sendMessageMutation.mutate({
      recipientId,
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