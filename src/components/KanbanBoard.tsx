import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2 } from 'lucide-react';
import {
  MessageCircle,
  FileText,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Settings,
  Plus,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export type Role = 'analyst' | 'pm' | 'dev' | 'qa';
export type TicketStatus = 'backlog' | 'in-progress' | 'ready-for-testing' | 'done';

export interface Epic {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
}

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
  onTicketCreate: () => void;
  tickets: Ticket[];
  epics: Epic[];
  onTicketsChange: (tickets: Ticket[]) => void;
  onEpicsChange: (epics: Epic[]) => void;
}

// Start with empty tickets - PM will create them
const initialTickets: Ticket[] = [];

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

// Droppable Column Component
interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

function DroppableColumn({ id, children, className }: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        isOver && "bg-muted/50 ring-2 ring-primary/20"
      )}
    >
      {children}
    </div>
  );
}

// Draggable Ticket Component
interface DraggableTicketProps {
  ticket: Ticket;
  onTicketClick: (ticket: Ticket) => void;
  getActionButton: (ticket: Ticket) => React.ReactNode;
}

function DraggableTicket({ ticket, onTicketClick, getActionButton }: DraggableTicketProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "kanban-card cursor-grab active:cursor-grabbing",
        isDragging && "shadow-lg scale-105"
      )}
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
  );
}

export function KanbanBoard({
  currentRole,
  onRoleChange,
  onTicketClick,
  onChatOpen,
  onDocumentationOpen,
  onTicketCreate,
  tickets,
  epics,
  onTicketsChange,
  onEpicsChange
}: KanbanBoardProps) {
  const navigate = useNavigate();
  const [implementingTicketId, setImplementingTicketId] = useState<string | null>(null);
  const [testingTicketId, setTestingTicketId] = useState<string | null>(null);
  const [implementationError, setImplementationError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    })
  );

  const getTicketsByStatus = (status: TicketStatus) =>
    tickets.filter(ticket => ticket.status === status);

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active ticket
    const activeTicket = tickets.find(ticket => ticket.id === activeId);
    if (!activeTicket) return;

    // Determine the new status based on the drop target
    let newStatus: TicketStatus;
    if (overId.includes('backlog')) {
      newStatus = 'backlog';
    } else if (overId.includes('in-progress')) {
      newStatus = 'in-progress';
    } else if (overId.includes('ready-for-testing')) {
      newStatus = 'ready-for-testing';
    } else if (overId.includes('done')) {
      newStatus = 'done';
    } else {
      // If dropped on another ticket, get the status of that column
      const targetTicket = tickets.find(ticket => ticket.id === overId);
      if (targetTicket) {
        newStatus = targetTicket.status;
      } else {
        return; // Invalid drop target
      }
    }

    // Update ticket status if it changed
    if (activeTicket.status !== newStatus) {
      const updatedTickets = tickets.map(ticket =>
        ticket.id === activeId
          ? { ...ticket, status: newStatus }
          : ticket
      );
      onTicketsChange(updatedTickets);
    }
  };

  const implementStory = async (ticket: Ticket) => {
    setImplementingTicketId(ticket.id);
    setImplementationError(null);

    try {
      // Use the BMAD command format: "dev implement story X.Y"
      const storyIdentifier = ticket.id.split('.')[1] ? ticket.id : `${ticket.epicId}.${ticket.id.split('.')[0]}`;
      const command = `dev implement story ${storyIdentifier}`;

      const response = await apiService.chatWithRole('dev', {
        message: command,
        context: {
          ticket_id: ticket.id,
          ticket_title: ticket.title,
          ticket_description: ticket.description,
          current_status: ticket.status
        }
      });

      // Update ticket status to ready-for-testing after successful implementation
      onTicketsChange(tickets.map(t =>
        t.id === ticket.id
          ? { ...t, status: 'ready-for-testing' as TicketStatus }
          : t
      ));

      console.log('Story implementation completed:', response);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to implement story';
      setImplementationError(errorMessage);
      console.error('Story implementation failed:', error);
    } finally {
      setImplementingTicketId(null);
    }
  };

  const testStory = async (ticket: Ticket) => {
    setTestingTicketId(ticket.id);
    setImplementationError(null);

    try {
      const response = await apiService.chatWithRole('qa', {
        message: `Please test story ${ticket.id}: ${ticket.title}. Description: ${ticket.description}`,
        context: {
          ticket_id: ticket.id,
          ticket_title: ticket.title,
          ticket_description: ticket.description,
          current_status: ticket.status
        }
      });

      console.log('Story testing completed:', response);

      // For now, we'll assume the test passes and move to done
      // In a real implementation, this would be based on QA feedback
      onTicketsChange(tickets.map(t =>
        t.id === ticket.id
          ? { ...t, status: 'done' as TicketStatus }
          : t
      ));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to test story';
      setImplementationError(errorMessage);
      console.error('Story testing failed:', error);
    } finally {
      setTestingTicketId(null);
    }
  };



  const assignTicket = (ticketId: string, newAssignee: Role) => {
    onTicketsChange(tickets.map(ticket =>
      ticket.id === ticketId
        ? { ...ticket, assignee: newAssignee }
        : ticket
    ));
  };

  const getActionButton = (ticket: Ticket) => {
    if (currentRole === 'dev' && ticket.status === 'in-progress') {
      const isLoading = implementingTicketId === ticket.id;
      return (
        <Button
          size="sm"
          variant="outline"
          className="w-full hover:bg-role-dev hover:text-white transition-all"
          onClick={(e) => {
            e.stopPropagation();
            implementStory(ticket);
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-1" />
          )}
          {isLoading ? 'Implementing...' : 'Implement Story'}
        </Button>
      );
    }

    if (currentRole === 'qa' && ticket.status === 'ready-for-testing') {
      const isLoading = testingTicketId === ticket.id;
      return (
        <Button
          size="sm"
          variant="outline"
          className="w-full hover:bg-role-qa hover:text-white transition-all"
          onClick={(e) => {
            e.stopPropagation();
            testStory(ticket);
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-1" />
          )}
          {isLoading ? 'Testing...' : 'Test Story'}
        </Button>
      );
    }

    return null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen bg-background flex flex-col">
        {/* Error Display */}
        {implementationError && (
          <div className="border-b bg-destructive/10 px-6 py-2">
            <Alert variant="destructive" className="border-0 bg-transparent">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{implementationError}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="hover:bg-muted p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Development Board
            </h1>
            {currentRole === 'pm' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onTicketCreate}
                className="hover:bg-role-pm hover:text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Ticket
              </Button>
            )}
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
            {/* Role Switcher Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "role-badge transition-all flex items-center gap-2",
                    roleConfig[currentRole].gradient
                  )}
                >
                  {React.createElement(roleConfig[currentRole].icon, {
                    className: "w-4 h-4"
                  })}
                  {roleConfig[currentRole].label}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {(Object.keys(roleConfig) as Role[]).map((role) => {
                  const config = roleConfig[role];
                  const Icon = config.icon;
                  return (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => onRoleChange(role)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            
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
              <DroppableColumn
                key={status}
                id={`column-${status}`}
                className="kanban-column rounded-lg border bg-muted/30 p-4 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">{config.label}</h3>
                    <Badge variant="secondary" className="ml-2">
                      {tickets.length}
                    </Badge>
                  </div>
                </div>
                
                <SortableContext
                  items={tickets.map(ticket => ticket.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
                  {tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Icon className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-sm mb-2">No {config.label.toLowerCase()}</h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        {currentRole === 'analyst'
                          ? "Tickets will be created from the board documentation"
                          : currentRole === 'dev'
                          ? "Tickets will appear here when ready for development"
                          : "Tickets will appear here when ready for testing"
                        }
                      </p>
                    </div>
                  ) : (
                    tickets.map((ticket) => (
                      <DraggableTicket
                        key={ticket.id}
                        ticket={ticket}
                        onTicketClick={onTicketClick}
                        getActionButton={getActionButton}
                      />
                    ))
                  )}
                  </div>
                </SortableContext>
              </DroppableColumn>
            );
          })}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId ? (
          <div className="opacity-90">
            <DraggableTicket
              ticket={tickets.find(t => t.id === activeId)!}
              onTicketClick={() => {}}
              getActionButton={() => null}
            />
          </div>
        ) : null}
      </DragOverlay>
      </div>
    </DndContext>
  );
}