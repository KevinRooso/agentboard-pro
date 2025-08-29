import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download,
  Edit,
  Users,
  Target,
  Workflow
} from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockDocumentation = {
  overview: `
# Development Team Workflow Documentation

## Project Overview
This document outlines the AI-powered development workflow for our software team, utilizing specialized AI agents for each role in the development process.

## Team Structure
- **Business Analyst**: Requirements gathering and documentation
- **Product Manager**: Epic creation and story prioritization  
- **Developer**: Implementation and code review
- **QA Engineer**: Testing and quality assurance

## Workflow Process
1. Analyst generates comprehensive project documentation
2. PM uses documentation to create epics and user stories
3. Developer implements stories with AI assistance
4. QA tests and validates implementations
5. Continuous feedback and iteration

## Key Benefits
- Streamlined communication between roles
- AI-assisted decision making at each stage
- Improved documentation and traceability
- Faster development cycles with maintained quality
`,
  
  roles: `
# Role Definitions and Responsibilities

## Business Analyst AI
**Primary Function**: Requirements analysis and documentation generation
- Gather and analyze business requirements
- Create comprehensive project documentation
- Define user personas and use cases
- Establish acceptance criteria

## Product Manager AI  
**Primary Function**: Product planning and backlog management
- Transform documentation into actionable epics
- Prioritize user stories based on business value
- Plan sprint backlogs and roadmaps
- Coordinate cross-functional requirements

## Developer AI
**Primary Function**: Code implementation and technical guidance
- Implement user stories with best practices
- Provide code review and suggestions
- Generate unit tests and documentation
- Suggest architectural improvements

## QA Engineer AI
**Primary Function**: Quality assurance and testing
- Create comprehensive test cases
- Execute testing protocols
- Report and track bugs
- Validate acceptance criteria compliance
`,

  workflow: `
# Detailed Workflow Process

## Phase 1: Analysis & Documentation
1. **Analyst Role**: Generate project documentation
   - Use "Generate project documentation" command
   - Create user stories from requirements
   - Define acceptance criteria and success metrics

## Phase 2: Planning & Prioritization  
2. **PM Role**: Create epics and stories
   - Use documentation as context
   - Generate epics from business requirements
   - Prioritize based on business value and dependencies
   - Plan sprint capacity and timeline

## Phase 3: Development & Implementation
3. **Developer Role**: Implement features
   - Review story requirements and acceptance criteria
   - Use "dev implement story X.Y" command for implementation
   - Review generated code and make adjustments
   - Update story status and move to testing

## Phase 4: Testing & Quality Assurance
4. **QA Role**: Test and validate
   - Review stories in "Ready for Testing" status
   - Create and execute test cases
   - Report bugs or approve for production
   - Ensure all acceptance criteria are met

## Continuous Iteration
- Regular feedback loops between all roles
- Documentation updates based on learnings
- Process improvements and optimization
- Knowledge sharing across the team
`
};

export function DocumentationModal({ isOpen, onClose }: DocumentationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-6 h-6" />
              <span>Project Documentation</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Comprehensive project documentation including overview, roles, and workflow
            </DialogDescription>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Roles</span>
              </TabsTrigger>
              <TabsTrigger value="workflow" className="flex items-center space-x-2">
                <Workflow className="w-4 h-4" />
                <span>Workflow</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden mt-4">
              <TabsContent value="overview" className="h-full mt-0">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Project Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="h-full overflow-hidden p-4">
                    <ScrollArea className="h-[500px] w-full">
                      <div className="prose prose-sm max-w-none pr-4">
                        <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg break-words">
                          {mockDocumentation.overview}
                        </pre>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="roles" className="h-full mt-0">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Role Definitions</CardTitle>
                  </CardHeader>
                  <CardContent className="h-full overflow-hidden p-4">
                    <ScrollArea className="h-[500px] w-full">
                      <div className="prose prose-sm max-w-none pr-4">
                        <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg break-words">
                          {mockDocumentation.roles}
                        </pre>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="workflow" className="h-full mt-0">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Workflow Process</CardTitle>
                  </CardHeader>
                  <CardContent className="h-full overflow-hidden p-4">
                    <ScrollArea className="h-[500px] w-full">
                      <div className="prose prose-sm max-w-none pr-4">
                        <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg break-words">
                          {mockDocumentation.workflow}
                        </pre>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}