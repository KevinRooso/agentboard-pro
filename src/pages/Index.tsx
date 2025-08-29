import React, { useState } from 'react';
import { KanbanBoard, type Role, type Ticket } from '@/components/KanbanBoard';
import { AgentChat } from '@/components/AgentChat';
import { TicketModal } from '@/components/TicketModal';
import { DocumentationModal } from '@/components/DocumentationModal';

const Index = () => {
  const [currentRole, setCurrentRole] = useState<Role>('analyst');
  const [isChatOpen, setChatOpen] = useState(false);
  const [chatRole, setChatRole] = useState<Role>('analyst');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setTicketModalOpen] = useState(false);
  const [isDocumentationOpen, setDocumentationOpen] = useState(false);

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

  return (
    <>
      <KanbanBoard 
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onTicketClick={handleTicketClick}
        onChatOpen={handleChatOpen}
        onDocumentationOpen={() => setDocumentationOpen(true)}
      />
      
      <AgentChat 
        role={chatRole}
        isOpen={isChatOpen}
        onClose={() => setChatOpen(false)}
      />
      
      <TicketModal 
        ticket={selectedTicket}
        isOpen={isTicketModalOpen}
        onClose={handleTicketModalClose}
        currentRole={currentRole}
      />
      
      <DocumentationModal 
        isOpen={isDocumentationOpen}
        onClose={() => setDocumentationOpen(false)}
      />
    </>
  );
};

export default Index;