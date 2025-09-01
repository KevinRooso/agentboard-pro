import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowRight, FileText, Bot, User, CheckCircle } from 'lucide-react';
import { apiService } from '@/lib/api';
import { FormattedMessage } from '@/components/FormattedMessage';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  type?: 'welcome' | 'documentation' | 'complete';
}

interface BoardData {
  id: string;
  name: string;
  description: string;
  documentation?: string;
  status: 'setup' | 'ready';
}

export default function BoardSetup() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<BoardData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);
  const [currentStep, setCurrentStep] = useState<'chat' | 'generate' | 'complete'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isGeneratingDocs]);

  useEffect(() => {
    // Load board data (in a real app, this would come from an API)
    const mockBoard: BoardData = {
      id: boardId || '1',
      name: 'New Development Board',
      description: 'AI-powered development workflow',
      status: 'setup'
    };
    setBoard(mockBoard);

    // Initialize with welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Hello! I'm your Business Analyst AI. I'll help you create comprehensive documentation for your new board "${mockBoard.name}". 

Please tell me about your project - what kind of application are you building? What are the main features and requirements?`,
      sender: 'agent',
      timestamp: new Date(),
      type: 'welcome'
    };
    setMessages([welcomeMessage]);
  }, [boardId]);

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
      const response = await apiService.chatWithRole('analyst', {
        message: inputMessage.trim(),
        context: {
          board_name: board?.name,
          board_description: board?.description,
          conversation_history: messages.slice(-8).map(m => ({
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
        timestamp: new Date(),
        type: 'documentation'
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

  const generateDocumentation = async () => {
    setIsGeneratingDocs(true);
    setCurrentStep('generate');

    try {
      const conversationSummary = messages
        .filter(m => m.sender === 'user')
        .map(m => m.content)
        .join('\n\n');

      const response = await apiService.chatWithRole('analyst', {
        message: `Based on our conversation, please generate comprehensive project documentation including:
        1. Project overview and objectives
        2. Key features and requirements
        3. User stories and acceptance criteria
        4. Technical considerations
        5. Success metrics

        Conversation summary: ${conversationSummary}`,
        context: {
          board_name: board?.name,
          purpose: 'documentation_generation'
        }
      });

      // Update board with generated documentation
      setBoard(prev => prev ? {
        ...prev,
        documentation: response.response,
        status: 'ready'
      } : null);

      setCurrentStep('complete');

      // Add completion message
      const completionMessage: Message = {
        id: Date.now().toString(),
        content: `Perfect! I've generated comprehensive documentation for your board. You can now proceed to create user stories and manage your development workflow.`,
        sender: 'agent',
        timestamp: new Date(),
        type: 'complete'
      };

      setMessages(prev => [...prev, completionMessage]);
    } catch (error) {
      console.error('Documentation generation failed:', error);
      setCurrentStep('chat');
    } finally {
      setIsGeneratingDocs(false);
    }
  };

  const proceedToBoard = () => {
    navigate(`/board/${boardId}`);
  };

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Board Setup: {board.name}</h1>
            <p className="text-muted-foreground">{board.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={currentStep === 'complete' ? 'default' : 'secondary'}>
              {currentStep === 'chat' && 'Step 1: Requirements Gathering'}
              {currentStep === 'generate' && 'Step 2: Documentation Generation'}
              {currentStep === 'complete' && 'Complete'}
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4 mb-6">
          <div className={cn(
            "flex items-center gap-2",
            currentStep === 'chat' || currentStep === 'generate' || currentStep === 'complete'
              ? "text-green-600" : "text-muted-foreground"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              currentStep === 'chat' || currentStep === 'generate' || currentStep === 'complete'
                ? "bg-green-100 text-green-800" : "bg-muted"
            )}>
              1
            </div>
            <span className="text-sm">Gather Requirements</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className={cn(
            "flex items-center gap-2",
            currentStep === 'generate' || currentStep === 'complete'
              ? "text-green-600" : "text-muted-foreground"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              currentStep === 'generate' || currentStep === 'complete'
                ? "bg-green-100 text-green-800" : "bg-muted"
            )}>
              2
            </div>
            <span className="text-sm">Generate Docs</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className={cn(
            "flex items-center gap-2",
            currentStep === 'complete' ? "text-green-600" : "text-muted-foreground"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              currentStep === 'complete' ? "bg-green-100 text-green-800" : "bg-muted"
            )}>
              3
            </div>
            <span className="text-sm">Ready to Work</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Business Analyst AI
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 p-4 max-h-96 overflow-y-auto min-h-0">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={cn(
                        "flex items-start space-x-2",
                        message.sender === 'user' ? "justify-end" : "justify-start"
                      )}>
                        {message.sender === 'agent' && (
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className="bg-blue-100">
                              <Bot className="w-4 h-4 text-blue-600" />
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
                    {(isLoading || isGeneratingDocs) && (
                      <div className="flex items-start space-x-2">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-blue-100">
                            <Bot className="w-4 h-4 text-blue-600" />
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
                              {isGeneratingDocs ? 'Generating comprehensive documentation...' : 'Business Analyst AI is thinking...'}
                            </span>
                          </div>
                          {isGeneratingDocs && (
                            <p className="text-xs text-muted-foreground">
                              This may take a few moments as I analyze your requirements and create detailed documentation.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input */}
                {currentStep !== 'complete' && (
                  <div className="border-t p-3 flex-shrink-0">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Describe your project requirements..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                        className="flex-1"
                        disabled={isLoading || isGeneratingDocs}
                      />
                      <Button
                        onClick={sendMessage}
                        size="sm"
                        disabled={isLoading || isGeneratingDocs || !inputMessage.trim()}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Send'
                        )}
                      </Button>
                    </div>

                    {messages.length > 2 && currentStep === 'chat' && (
                      <div className="flex justify-center mt-3">
                        <Button
                          onClick={generateDocumentation}
                          disabled={isGeneratingDocs}
                          className="gap-2"
                        >
                          {isGeneratingDocs ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <FileText className="w-4 h-4" />
                              Generate Documentation
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 'complete' && (
                  <div className="border-t p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Documentation Complete!</span>
                    </div>
                    <Button onClick={proceedToBoard} className="w-full gap-2">
                      <ArrowRight className="w-4 h-4" />
                      Proceed to Board
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Documentation Preview */}
          <div className="lg:col-span-1">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentation Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {board.documentation ? (
                  <ScrollArea className="h-[500px]">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-lg">
                        {board.documentation}
                      </pre>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[500px] flex items-center justify-center text-center">
                    <div className="text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">Documentation will appear here after generation</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
