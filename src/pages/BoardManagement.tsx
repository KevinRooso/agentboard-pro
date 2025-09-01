import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FolderOpen, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Board {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  status: 'draft' | 'active' | 'completed';
  memberCount: number;
}

const mockBoards: Board[] = [
  {
    id: '1',
    name: 'E-commerce Platform',
    description: 'Complete e-commerce solution with payment integration',
    createdAt: new Date('2024-01-15'),
    status: 'active',
    memberCount: 4
  },
  {
    id: '2',
    name: 'Mobile App Redesign',
    description: 'UI/UX redesign for our mobile application',
    createdAt: new Date('2024-01-10'),
    status: 'draft',
    memberCount: 3
  }
];

export default function BoardManagement() {
  const [boards, setBoards] = useState<Board[]>(mockBoards);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const navigate = useNavigate();

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) return;

    const newBoard: Board = {
      id: Date.now().toString(),
      name: newBoardName,
      description: newBoardDescription,
      createdAt: new Date(),
      status: 'draft',
      memberCount: 4
    };

    setBoards(prev => [newBoard, ...prev]);
    setNewBoardName('');
    setNewBoardDescription('');
    setIsCreateDialogOpen(false);

    // Navigate to board creation flow
    navigate(`/board/${newBoard.id}/setup`);
  };

  const getStatusColor = (status: Board['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBoardClick = (board: Board) => {
    if (board.status === 'draft') {
      navigate(`/board/${board.id}/setup`);
    } else {
      navigate(`/board/${board.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Board Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage your development boards with AI-powered workflows
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create New Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Board</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Board Name</label>
                  <Input
                    placeholder="Enter board name..."
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Input
                    placeholder="Brief description of the project..."
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBoard} disabled={!newBoardName.trim()}>
                    Create Board
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Boards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <Card
              key={board.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleBoardClick(board)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{board.name}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {board.description}
                    </p>
                  </div>
                  <Badge className={getStatusColor(board.status)}>
                    {board.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {board.createdAt.toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {board.memberCount} members
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {board.status === 'draft' ? 'Setup required' : 'Ready to work'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {boards.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No boards yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first board to get started with AI-powered development workflows
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Board
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

