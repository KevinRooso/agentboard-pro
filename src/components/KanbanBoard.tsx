import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  FileText, 
  Play, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type Role = 'analyst' | 'pm' | 'dev' | 'qa';
export type TicketStatus = 'backlog' | 'in-progress' | 'ready-for-testing' | 'done';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  assignee: Role;
  priority: 'low' | 'medium' | 'high' | 'critical';
  storyPoints?: number;
  epicId?: string;
}

interface KanbanBoardProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  onTicketClick: (ticket: Ticket) => void;
  onChatOpen: (role: Role) => void;
  onDocumentationOpen: () => void;
}

const mockTickets: Ticket[] = [
  {
    id: 'EPIC-1.1',
    title: 'User Authentication System',
    description: 'Implement secure login and registration functionality with JWT tokens',
    status: 'backlog',
    assignee: 'dev',
    priority: 'high',
    storyPoints: 8,
    epicId: 'EPIC-1'
  },
  {
    id: 'EPIC-1.2',
    title: 'Password Recovery Flow',
    description: 'Enable users to reset their passwords via email verification',
    status: 'in-progress',
    assignee: 'dev',
    priority: 'medium',
    storyPoints: 5,
    epicId: 'EPIC-1'
  },
  {
    id: 'EPIC-2.1',
    title: 'Dashboard Analytics Widget',
    description: 'Create interactive charts showing user engagement metrics',
    status: 'ready-for-testing',
    assignee: 'qa',
    priority: 'medium',
    storyPoints: 13,
    epicId: 'EPIC-2'
  },
  {
    id: 'EPIC-1.3',
    title: 'Social Login Integration',
    description: 'Add Google and GitHub OAuth authentication options',
    status: 'done',
    assignee: 'dev',
    priority: 'low',
    storyPoints: 3,
    epicId: 'EPIC-1'
  }
];

const roleConfig = {
  analyst: { 
    label: 'Business Analyst', 
    color: 'bg-role-analyst', 
    gradient: 'bg-gradient-role-analyst',
    icon: FileText 
  },
  pm: { 
    label: 'Product Manager', 
    color: 'bg-role-pm', 
    gradient: 'bg-gradient-role-pm',
    icon: User 
  },
  dev: { 
    label: 'Developer', 
    color: 'bg-role-dev', 
    gradient: 'bg-gradient-role-dev',
    icon: Settings 
  },
  qa: { 
    label: 'QA Engineer', 
    color: 'bg-role-qa', 
    gradient: 'bg-gradient-role-qa',
    icon: CheckCircle 
  }
};

const statusConfig = {
  backlog: { label: 'Backlog', icon: Clock },
  'in-progress': { label: 'In Progress', icon: Play },
  'ready-for-testing': { label: 'Ready for Testing', icon: AlertCircle },
  done: { label: 'Done', icon: CheckCircle }
};

const priorityConfig = {
  low: { color: 'bg-muted', label: 'Low' },
  medium: { color: 'bg-warning', label: 'Medium' },
  high: { color: 'bg-destructive', label: 'High' },
  critical: { color: 'bg-destructive', label: 'Critical' }
};

export function KanbanBoard({ 
  currentRole, 
  onRoleChange, 
  onTicketClick, 
  onChatOpen,
  onDocumentationOpen 
}: KanbanBoardProps) {
  const getTicketsByStatus = (status: TicketStatus) => 
    mockTickets.filter(ticket => ticket.status === status);

  const getActionButton = (ticket: Ticket) => {
    if (currentRole === 'dev' && ticket.status === 'backlog') {
      return (
        <Button 
          size="sm" 
          variant="outline"
          className="w-full hover:bg-role-dev hover:text-white transition-all"
          onClick={(e) => {
            e.stopPropagation();
            // Handle implement story action
          }}
        >
          <Play className="w-4 h-4 mr-1" />
          Implement Story
        </Button>
      );
    }
    
    if (currentRole === 'qa' && ticket.status === 'ready-for-testing') {
      return (
        <Button 
          size="sm" 
          variant="outline"
          className="w-full hover:bg-role-qa hover:text-white transition-all"
          onClick={(e) => {
            e.stopPropagation();
            // Handle test story action
          }}
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Test Story
        </Button>
      );
    }
    
    return null;
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Development Board
            </h1>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onDocumentationOpen}
              className="hover:bg-primary hover:text-primary-foreground"
            >
              <FileText className="w-4 h-4 mr-2" />
              Documentation
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Role Switcher */}
            <div className="flex items-center space-x-2">
              {(Object.keys(roleConfig) as Role[]).map((role) => {
                const config = roleConfig[role];
                const Icon = config.icon;
                return (
                  <Button
                    key={role}
                    variant={currentRole === role ? "default" : "outline"}
                    size="sm"
                    onClick={() => onRoleChange(role)}
                    className={cn(
                      "role-badge transition-all",
                      currentRole === role && config.gradient
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => onChatOpen(currentRole)}
              className="hover:bg-primary hover:text-primary-foreground"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat with {roleConfig[currentRole].label} AI
            </Button>
          </div>
        </div>
      </header>

      {/* Kanban Columns */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-4 gap-6 p-6">
          {(Object.keys(statusConfig) as TicketStatus[]).map((status) => {
            const config = statusConfig[status];
            const tickets = getTicketsByStatus(status);
            const Icon = config.icon;
            
            return (
              <div key={status} className="kanban-column rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">{config.label}</h3>
                    <Badge variant="secondary" className="ml-2">
                      {tickets.length}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-3 h-full overflow-y-auto">
                  {tickets.map((ticket) => (
                    <Card 
                      key={ticket.id}
                      className="kanban-card cursor-pointer"
                      onClick={() => onTicketClick(ticket)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-medium leading-none">
                            {ticket.id}
                          </CardTitle>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-xs",
                              priorityConfig[ticket.priority].color
                            )}
                          >
                            {priorityConfig[ticket.priority].label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {ticket.title}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className={cn(
                                "text-xs text-white",
                                roleConfig[ticket.assignee].color
                              )}>
                                {ticket.assignee.toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            {ticket.storyPoints && (
                              <Badge variant="outline" className="text-xs">
                                {ticket.storyPoints} pts
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {getActionButton(ticket)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}