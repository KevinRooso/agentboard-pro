import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Bot, User, Plus, Lightbulb } from 'lucide-react';
import { apiService } from '@/lib/api';
import { FormattedMessage } from './FormattedMessage';
import { cn } from '@/lib/utils';

interface TicketCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketsCreated: (tickets: any[], epic: any) => void;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

export function TicketCreationModal({ isOpen, onClose, onTicketsCreated }: TicketCreationModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: `Hello! I'm your Product Manager AI. I'll help you create detailed user stories and tickets based on the project requirements. 

Please describe what feature or functionality you'd like to implement, and I'll help you create a proper user story with acceptance criteria.`,
      sender: 'agent',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isCreatingTicket]);

  // Ticket form state
  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    storyPoints: 5,
    assignee: 'dev'
  });
  const [showForm, setShowForm] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await apiService.chatWithRole('pm', {
        message: inputMessage.trim(),
        context: {
          purpose: 'ticket_creation',
          previous_messages: messages.slice(-8).map(m => ({
            sender: m.sender,
            content: m.content,
            timestamp: m.timestamp.toISOString()
          }))
        }
      });

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        sender: 'agent',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error. Please try again.`,
        sender: 'agent',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateEpicFromConversation = async () => {
    setIsCreatingTicket(true);

    try {
      const conversationSummary = messages
        .filter(m => m.sender === 'user')
        .map(m => m.content)
        .join('\n\n');

      // Step 1: Generate epic title and description
      const epicResponse = await apiService.chatWithRole('pm', {
        message: `Based on our conversation, create a concise epic title (max 10 words) and a brief description (2-3 sentences) that captures the overall feature or capability being requested.

        Format your response as:
        Title: [Epic Title]
        Description: [Epic Description]

        Conversation: ${conversationSummary}`,
        context: {
          purpose: 'epic_generation'
        }
      });

      // Parse epic title and description
      const epicTitleMatch = epicResponse.response.match(/Title:\s*(.+?)(?:\n|$)/);
      const epicDescMatch = epicResponse.response.match(/Description:\s*(.+?)(?:\n\n|$)/s);

      const epicTitle = epicTitleMatch ? epicTitleMatch[1].trim() : (ticketForm.title || 'Generated Epic');
      const epicDescription = epicDescMatch ? epicDescMatch[1].trim() : 'Epic generated from conversation';

      // Create epic
      const epicId = `EPIC-${Date.now()}`;
      const epic = {
        id: epicId,
        title: epicTitle,
        description: epicDescription,
        createdAt: new Date()
      };

      // Step 2: Generate individual user stories for this epic
      const storiesResponse = await apiService.chatWithRole('pm', {
        message: `Based on our conversation, break down this epic into 2-5 individual user stories. Each user story should be a complete, independent piece of functionality.

        For each user story, provide:
        - A clear, concise title (max 15 words)
        - A brief description (2-3 sentences)
        - Suggested story points (1, 2, 3, 5, 8, or 13)

        Format each user story as:
        Story [number]:
        Title: [Story Title]
        Description: [Story Description]
        Story Points: [points]

        Conversation: ${conversationSummary}`,
        context: {
          purpose: 'user_story_breakdown'
        }
      });

      // Parse user stories from response
      const storyPattern = /Story \d+:\s*Title:\s*(.+?)\s*Description:\s*(.+?)\s*Story Points:\s*(\d+)/gs;
      const stories = [];
      let match;

      while ((match = storyPattern.exec(storiesResponse.response)) !== null) {
        const [, title, description, storyPoints] = match;
        stories.push({
          title: title.trim(),
          description: description.trim(),
          storyPoints: parseInt(storyPoints.trim())
        });
      }

      // If no stories were parsed, create at least one
      if (stories.length === 0) {
        stories.push({
          title: epicTitle,
          description: epicDescription,
          storyPoints: ticketForm.storyPoints || 5
        });
      }

      // Create tickets for each user story
      const tickets = stories.map((story, index) => ({
        id: `TICKET-${Date.now()}-${index}`,
        title: story.title,
        description: story.description,
        status: 'backlog' as const,
        assignee: ticketForm.assignee,
        priority: ticketForm.priority,
        storyPoints: story.storyPoints,
        epicId: epicId
      }));

      onTicketsCreated(tickets, epic);
      onClose();
      resetModal();
    } catch (error) {
      console.error('Epic generation failed:', error);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const createEpicManually = () => {
    if (!ticketForm.title.trim()) return;

    // Create epic
    const epicId = `EPIC-${Date.now()}`;
    const epic = {
      id: epicId,
      title: ticketForm.title,
      description: ticketForm.title,
      createdAt: new Date()
    };

    // Create single ticket for this epic
    const newTicket = {
      id: `TICKET-${Date.now()}-0`,
      title: ticketForm.title,
      description: ticketForm.title,
      status: 'backlog',
      assignee: ticketForm.assignee,
      priority: ticketForm.priority,
      storyPoints: ticketForm.storyPoints,
      epicId: epicId
    };

    onTicketsCreated([newTicket], epic);
    onClose();
    resetModal();
  };

  const resetModal = () => {
    setMessages([{
      id: 'welcome',
      content: `Hello! I'm your Product Manager AI. I'll help you create detailed user stories and tickets based on the project requirements. 

Please describe what feature or functionality you'd like to implement, and I'll help you create a proper user story with acceptance criteria.`,
      sender: 'agent',
      timestamp: new Date()
    }]);
    setInputMessage('');
    setTicketForm({
      title: '',
      description: '',
      priority: 'medium',
      storyPoints: 5,
      assignee: 'dev'
    });
    setShowForm(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
          {/* Chat Interface */}
          <Card className="flex flex-col h-full">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Product Manager AI
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 p-0">
              <div className="flex-1 overflow-y-auto p-4" style={{maxHeight: 'calc(70vh - 200px)'}}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={cn(
                      "flex items-start space-x-2",
                      message.sender === 'user' ? "justify-end" : "justify-start"
                    )}>
                      {message.sender === 'agent' && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-green-100">
                            <Bot className="w-4 h-4 text-green-600" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={cn(
                        "max-w-[75%] p-3 rounded-lg break-words overflow-hidden",
                        message.sender === 'user'
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted"
                      )}>
                        <div className="text-sm break-words overflow-wrap-anywhere">
                          <FormattedMessage content={message.content} />
                        </div>
                        <span className="text-xs opacity-70 mt-2 block">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>

                      {message.sender === 'user' && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback>
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {/* Loading Animation */}
                  {(isLoading || isCreatingTicket) && (
                    <div className="flex items-start space-x-2">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-green-100">
                          <Bot className="w-4 h-4 text-green-600" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted p-3 rounded-lg max-w-[75%] break-words overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          </div>
                          <span className="text-sm break-words">
                            {isCreatingTicket ? 'Generating detailed ticket...' : 'Product Manager AI is thinking...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {!showForm && (
                <div className="border-t p-3 flex-shrink-0 bg-white">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Describe the feature or user story..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                      className="flex-1"
                      disabled={isLoading || isCreatingTicket}
                    />
                    <Button
                      onClick={sendMessage}
                      size="sm"
                      disabled={isLoading || isCreatingTicket || !inputMessage.trim()}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                    </Button>
                  </div>

                  {messages.length > 2 && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={() => setShowForm(true)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Manual Epic
                      </Button>
                      <Button
                        onClick={generateEpicFromConversation}
                        disabled={isCreatingTicket}
                        size="sm"
                        className="flex-1"
                      >
                        {isCreatingTicket ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Lightbulb className="w-4 h-4 mr-2" />
                        )}
                        Generate Epic from Chat
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket Form */}
          <Card className="flex flex-col h-full">
            <CardHeader className="flex-shrink-0">
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="User story title..."
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={ticketForm.priority}
                    onValueChange={(value) => setTicketForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignee">Assignee</Label>
                  <Select
                    value={ticketForm.assignee}
                    onValueChange={(value) => setTicketForm(prev => ({ ...prev, assignee: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dev">Developer</SelectItem>
                      <SelectItem value="qa">QA Engineer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storyPoints">Story Points</Label>
                <Select
                  value={ticketForm.storyPoints.toString()}
                  onValueChange={(value) => setTicketForm(prev => ({ ...prev, storyPoints: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 point</SelectItem>
                    <SelectItem value="2">2 points</SelectItem>
                    <SelectItem value="3">3 points</SelectItem>
                    <SelectItem value="5">5 points</SelectItem>
                    <SelectItem value="8">8 points</SelectItem>
                    <SelectItem value="13">13 points</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showForm && (
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Back to Chat
                  </Button>
                  <Button
                    onClick={createEpicManually}
                    disabled={!ticketForm.title.trim()}
                    className="flex-1"
                  >
                    Create Epic
                  </Button>
                </div>
              )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
