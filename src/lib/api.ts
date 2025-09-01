// API service layer for communicating with the BMad Method backend
const API_BASE_URL = 'http://localhost:8000';

export interface ChatRequest {
  message: string;
  context?: Record<string, any>;
  workflow_context?: string;
}

export interface ChatResponse {
  role: string;
  response: string;
  context_used: string;
  timestamp: string;
  workflow_suggestions?: string[];
}

export interface RoleInfo {
  id: string;
  name: string;
  description: string;
  commands: string[];
  capabilities: string[];
}

export interface WorkflowInfo {
  id: string;
  name: string;
  description: string;
  type: string;
  project_types: string[];
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Chat with a specific role
  async chatWithRole(roleId: string, request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>(`/chat/${roleId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Get all available roles
  async getRoles(): Promise<RoleInfo[]> {
    return this.request<RoleInfo[]>('/roles');
  }

  // Get all available workflows
  async getWorkflows(): Promise<{ workflows: WorkflowInfo[] }> {
    return this.request<{ workflows: WorkflowInfo[] }>('/workflows');
  }

  // Get role context
  async getRoleContext(roleId: string): Promise<any> {
    return this.request(`/context/${roleId}`);
  }

  // Get workflow context
  async getWorkflowContext(workflowId: string): Promise<any> {
    return this.request(`/workflow/${workflowId}`);
  }

  // Orchestrate request (auto-route to appropriate role)
  async orchestrate(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/orchestrate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request('/');
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export types
export type { ChatRequest, ChatResponse, RoleInfo, WorkflowInfo };

