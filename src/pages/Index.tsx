import React, { useState } from 'react';
import { KanbanBoard, type Role, type Ticket, type Epic } from '@/components/KanbanBoard';
import { AgentChat } from '@/components/AgentChat';
import { TicketModal } from '@/components/TicketModal';
import { DocumentationModal } from '@/components/DocumentationModal';
import { TicketCreationModal } from '@/components/TicketCreationModal';

const Index = () => {
  const [currentRole, setCurrentRole] = useState<Role>('analyst');
  const [isChatOpen, setChatOpen] = useState(false);
  const [chatRole, setChatRole] = useState<Role>('analyst');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setTicketModalOpen] = useState(false);
  const [isDocumentationOpen, setDocumentationOpen] = useState(false);
  const [isTicketCreationOpen, setTicketCreationOpen] = useState(false);

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
  };

  const handleChatOpen = (role: Role) => {
    setChatRole(role);
    setChatOpen(true);
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setTicketModalOpen(true);
  };

  const handleTicketModalClose = () => {
    setTicketModalOpen(false);
    setSelectedTicket(null);
  };

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);

  const handleTicketsCreated = (newTickets: Ticket[], epic: Epic) => {
    setTickets(prev => [...prev, ...newTickets]);
    setEpics(prev => [...prev, epic]);
  };

  return (
    <>
      <KanbanBoard
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onTicketClick={handleTicketClick}
        onChatOpen={handleChatOpen}
        onDocumentationOpen={() => setDocumentationOpen(true)}
        onTicketCreate={() => setTicketCreationOpen(true)}
        tickets={tickets}
        epics={epics}
        onTicketsChange={setTickets}
        onEpicsChange={setEpics}
      />

      <AgentChat
        role={chatRole}
        isOpen={isChatOpen}
        onClose={() => setChatOpen(false)}
      />

      <TicketModal
        ticket={selectedTicket}
        epics={epics}
        isOpen={isTicketModalOpen}
        onClose={handleTicketModalClose}
        currentRole={currentRole}
        onChatOpen={handleChatOpen}
      />

      <DocumentationModal
        isOpen={isDocumentationOpen}
        onClose={() => setDocumentationOpen(false)}
      />

      <TicketCreationModal
        isOpen={isTicketCreationOpen}
        onClose={() => setTicketCreationOpen(false)}
        onTicketsCreated={handleTicketsCreated}
      />
    </>
  );
};

export default Index;