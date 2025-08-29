import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  User, 
  Calendar,
  GitBranch,
  Play,
  CheckCircle,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Ticket, Role } from './KanbanBoard';

interface TicketModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  currentRole: Role;
  onChatOpen: (role: Role) => void;
}

const mockPRD = `
# User Authentication System - Product Requirements Document

## Overview
Implement a secure and user-friendly authentication system that allows users to register, login, and manage their accounts safely.

## Objectives
- Provide secure user registration and login functionality
- Implement JWT-based session management
- Ensure password security with proper hashing
- Support email verification for account activation

## User Stories
- As a new user, I want to create an account so that I can access the platform
- As a returning user, I want to login quickly and securely
- As a user, I want to reset my password if I forget it
- As a user, I want my data to be secure and protected

## Acceptance Criteria
### Registration
- [ ] Users can register with email and password
- [ ] Password must meet security requirements (8+ chars, special chars)
- [ ] Email verification required before account activation
- [ ] Duplicate email prevention

### Login
- [ ] Users can login with email/password
- [ ] JWT tokens issued on successful authentication
- [ ] Invalid credentials show appropriate error messages
- [ ] Account lockout after multiple failed attempts

### Security
- [ ] Passwords hashed using bcrypt
- [ ] JWT tokens have appropriate expiration
- [ ] Rate limiting on authentication endpoints
- [ ] HTTPS enforcement

## Technical Requirements
- Backend: Node.js/Express with JWT
- Database: PostgreSQL for user data
- Validation: Input validation and sanitization
- Testing: Unit and integration tests required

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Security audit completed
- [ ] Documentation updated
`;

export function TicketModal({ ticket, isOpen, onClose, currentRole, onChatOpen }: TicketModalProps) {
  if (!ticket) return null;

  const getActionButtons = () => {
    const buttons = [];
    
    if (currentRole === 'dev' && ticket.status === 'in-progress') {
      buttons.push(
        <Button key="implement" className="bg-role-dev hover:bg-role-dev/90">
          <Play className="w-4 h-4 mr-2" />
          Implement Story
        </Button>
      );
    }
    
    if (currentRole === 'qa' && ticket.status === 'ready-for-testing') {
      buttons.push(
        <Button key="test" className="bg-role-qa hover:bg-role-qa/90">
          <CheckCircle className="w-4 h-4 mr-2" />
          Start Testing
        </Button>
      );
    }
    
    buttons.push(
      <Button 
        key="chat" 
        variant="outline"
        onClick={() => onChatOpen(currentRole)}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Discuss with Agent
      </Button>
    );
    
    return buttons;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">{ticket.id}</DialogTitle>
            <DialogDescription className="sr-only">
              Ticket details and requirements for {ticket.title}
            </DialogDescription>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {ticket.storyPoints} story points
              </Badge>
              <Badge className={cn(
                ticket.priority === 'high' ? 'bg-destructive' :
                ticket.priority === 'medium' ? 'bg-warning' :
                'bg-muted'
              )}>
                {ticket.priority} priority
              </Badge>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* Left Column - Ticket Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Story Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{ticket.title}</h3>
                  <p className="text-muted-foreground">{ticket.description}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>Assignee: {ticket.assignee}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Epic: {ticket.epicId}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <GitBranch className="w-4 h-4 text-muted-foreground" />
                    <span>Status: {ticket.status}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex flex-wrap gap-2">
                  {getActionButtons()}
                </div>
              </CardContent>
            </Card>
            
            {/* Progress Tracking */}
            <Card>
              <CardHeader>
                <CardTitle>Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Analysis Complete</span>
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Development</span>
                    <div className={cn(
                      "w-4 h-4 rounded-full",
                      ticket.status === 'in-progress' || ticket.status === 'ready-for-testing' || ticket.status === 'done'
                        ? "bg-success" : "bg-muted"
                    )} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Testing</span>
                    <div className={cn(
                      "w-4 h-4 rounded-full",
                      ticket.status === 'ready-for-testing' || ticket.status === 'done'
                        ? "bg-warning" : "bg-muted"
                    )} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Done</span>
                    <div className={cn(
                      "w-4 h-4 rounded-full",
                      ticket.status === 'done' ? "bg-success" : "bg-muted"
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - PRD */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Product Requirements Document</span>
                </CardTitle>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Full PRD
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-4">
              <ScrollArea className="h-[400px] w-full">
                <div className="prose prose-sm max-w-none pr-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg break-words">
                    {mockPRD}
                  </pre>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}