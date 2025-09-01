import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import {
  Send,
  Bot,
  User,
  X,
  FileText,
  Lightbulb,
  Code,
  TestTube,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiService, type ChatResponse } from '@/lib/api';
import { FormattedMessage } from './FormattedMessage';
import type { Role } from './KanbanBoard';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  suggestions?: string[];
  context_used?: string;
  workflow_suggestions?: string[];
}

interface AgentChatProps {
  role: Role;
  isOpen: boolean;
  onClose: () => void;
}

const roleAgentConfig = {
  analyst: {
    name: 'Analyst AI',
    description: 'Business Analysis & Documentation',
    color: 'bg-role-analyst',
    gradient: 'bg-gradient-role-analyst',
    icon: FileText,
    suggestions: [
      'Generate project documentation',
      'Create user stories from requirements',
      'Analyze business impact',
      'Define acceptance criteria'
    ]
  },
  pm: {
    name: 'PM AI',
    description: 'Product Management & Planning',
    color: 'bg-role-pm',
    gradient: 'bg-gradient-role-pm',
    icon: Lightbulb,
    suggestions: [
      'Create epics from documentation',
      'Prioritize user stories',
      'Plan sprint backlog',
      'Generate product roadmap'
    ]
  },
  dev: {
    name: 'Developer AI',
    description: 'Code Implementation & Review',
    color: 'bg-role-dev',
    gradient: 'bg-gradient-role-dev',
    icon: Code,
    suggestions: [
      'Implement story EPIC-1.1',
      'Review code changes',
      'Suggest architectural improvements',
      'Generate unit tests'
    ]
  },
  qa: {
    name: 'QA AI',
    description: 'Quality Assurance & Testing',
    color: 'bg-role-qa',
    gradient: 'bg-gradient-role-qa',
    icon: TestTube,
    suggestions: [
      'Create test cases for story',
      'Review test coverage',
      'Report bugs and issues',
      'Verify acceptance criteria'
    ]
  }
};

const mockMessages: Record<Role, Message[]> = {
  analyst: [
    {
      id: '1',
      content: 'Hello! I\'m your Business Analyst AI. I can help you generate comprehensive documentation, analyze requirements, and create detailed user stories. What would you like to work on?',
      sender: 'agent',
      timestamp: new Date(Date.now() - 10000),
      suggestions: roleAgentConfig.analyst.suggestions
    }
  ],
  pm: [
    {
      id: '1',
      content: 'Hi! I\'m your Product Manager AI. I can help you create epics, prioritize stories, and plan your product roadmap based on the project documentation. How can I assist you today?',
      sender: 'agent',
      timestamp: new Date(Date.now() - 10000),
      suggestions: roleAgentConfig.pm.suggestions
    }
  ],
  dev: [
    {
      id: '1',
      content: 'Hey there! I\'m your Developer AI assistant. I can help implement stories, review code, suggest improvements, and generate tests. Ready to start coding?',
      sender: 'agent',
      timestamp: new Date(Date.now() - 10000),
      suggestions: roleAgentConfig.dev.suggestions
    }
  ],
  qa: [
    {
      id: '1',
      content: 'Hello! I\'m your QA AI. I can help create comprehensive test cases, review testing coverage, identify potential issues, and ensure quality standards. What story should we test?',
      sender: 'agent',
      timestamp: new Date(Date.now() - 10000),
      suggestions: roleAgentConfig.qa.suggestions
    }
  ]
};

export function AgentChat({ role, isOpen, onClose }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Initialize with welcome message when component opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Hello! I'm your ${roleAgentConfig[role].name}. ${roleAgentConfig[role].description}. How can I help you today?`,
        sender: 'agent',
        timestamp: new Date(),
        suggestions: roleAgentConfig[role].suggestions
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, role, messages.length]);
  
  const agentConfig = roleAgentConfig[role];
  const Icon = agentConfig.icon;

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
    setError(null);

    try {
      const chatRequest = {
        message: inputMessage.trim(),
        context: {
          role: role,
          previous_messages: messages.slice(-10).map(m => ({
            sender: m.sender,
            content: m.content,
            timestamp: m.timestamp.toISOString()
          }))
        }
      };

      const response: ChatResponse = await apiService.chatWithRole(role, chatRequest);

      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        sender: 'agent',
        timestamp: new Date(response.timestamp),
        context_used: response.context_used,
        workflow_suggestions: response.workflow_suggestions,
        suggestions: agentConfig.suggestions
      };

      setMessages(prev => [...prev, agentResponse]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response from AI agent';
      setError(errorMessage);

      // Add error message to chat
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again or check if the backend server is running.`,
        sender: 'agent',
        timestamp: new Date(),
        suggestions: agentConfig.suggestions
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" style={{ zIndex: 9999 }}>
      <div className="absolute right-0 top-0 h-full w-96 bg-card border-l shadow-kanban-focus">
        <Card className="h-full rounded-none border-0">
          <CardHeader className={cn("pb-4", agentConfig.gradient, "text-white")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10 bg-white/20">
                  <AvatarFallback className="bg-transparent">
                    <Icon className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{agentConfig.name}</CardTitle>
                  <p className="text-sm opacity-90">{agentConfig.description}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col h-full p-0">
            {/* Messages */}
            <div className="flex-1 p-4 max-h-96 overflow-y-auto min-h-0">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="chat-message">
                    <div className={cn(
                      "flex items-start space-x-2",
                      message.sender === 'user' ? "justify-end" : "justify-start"
                    )}>
                      {message.sender === 'agent' && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className={agentConfig.color}>
                            <Bot className="w-4 h-4 text-white" />
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

                        {/* Show context and workflow info for agent messages */}
                        {message.sender === 'agent' && (
                          <div className="mt-2 space-y-1">
                            {message.context_used && (
                              <div className="text-xs opacity-60">
                                Context: {message.context_used}
                              </div>
                            )}
                            {message.workflow_suggestions && message.workflow_suggestions.length > 0 && (
                              <div className="text-xs opacity-60">
                                Suggested workflows: {message.workflow_suggestions.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {message.sender === 'user' && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback>
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    
                    {/* Suggestions */}
                    {message.sender === 'agent' && message.suggestions && (
                      <div className="mt-2 ml-10 space-y-2">
                        <p className="text-xs text-muted-foreground">Quick actions:</p>
                        <div className="grid grid-cols-1 gap-2">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-left justify-start text-xs h-8"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading Animation */}
                {isLoading && (
                  <div className="flex items-start space-x-2">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className={agentConfig.color}>
                        <Bot className="w-4 h-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted p-3 rounded-lg max-w-[75%] break-words overflow-hidden">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-sm text-muted-foreground break-words">
                          {agentConfig.name} is thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="border-t p-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t p-3 flex-shrink-0">
              <div className="flex space-x-2">
                <Input
                  placeholder={`Message ${agentConfig.name}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  size="sm"
                  disabled={isLoading || !inputMessage.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {agentConfig.suggestions.slice(0, 2).map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80 text-xs"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}