'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import ReactFlow, { 
  Background, 
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Search, PenTool, Save, User, Edit, CheckSquare } from 'lucide-react'
import { FlowMessages } from '@/components/FlowMessages'
import { useWebSocket } from '@/contexts/WebSocketContext'
import { CustomEdge } from '@/components/CustomEdge'

const initialNodes: Node[] = [
  // Crews
  {
    id: '1',
    type: 'input',
    position: { x: 250, y: 0 },
    data: { 
      label: (
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          <div>
            <div>EduResearchCrew</div>
            <div className="text-xs text-muted-foreground">Research Phase</div>
          </div>
        </div>
      )
    },
    className: 'bg-background border-2 border-blue-200 rounded-lg p-2 shadow-lg'
  },
  {
    id: '2',
    position: { x: 250, y: 300 },
    data: { 
      label: (
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4" />
          <div>
            <div>EduContentWriterCrew</div>
            <div className="text-xs text-muted-foreground">Content Generation</div>
          </div>
        </div>
      )
    },
    className: 'bg-background border-2 border-green-200 rounded-lg p-2 shadow-lg'
  },
  {
    id: '3',
    type: 'output',
    position: { x: 250, y: 600 },
    data: { 
      label: (
        <div className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          <div>
            <div>Save to Markdown</div>
            <div className="text-xs text-muted-foreground">Output Phase</div>
          </div>
        </div>
      )
    },
    className: 'bg-background border-2 border-purple-200 rounded-lg p-2 shadow-lg'
  },
  // EduResearchCrew Agents
  {
    id: '4',
    position: { x: 50, y: 100 },
    data: { 
      label: (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <div>Researcher</div>
        </div>
      )
    },
    className: 'bg-background border-2 border-blue-100 rounded-lg p-2 shadow-md'
  },
  {
    id: '5',
    position: { x: 450, y: 100 },
    data: { 
      label: (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <div>Planner</div>
        </div>
      )
    },
    className: 'bg-background border-2 border-blue-100 rounded-lg p-2 shadow-md'
  },
  // EduContentWriterCrew agents
  {
    id: '6',
    position: { x: 50, y: 400 },
    data: { 
      label: (
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4" />
          <div>Content Writer</div>
        </div>
      )
    },
    className: 'bg-background border-2 border-green-100 rounded-lg p-2 shadow-md'
  },
  {
    id: '7',
    position: { x: 250, y: 400 },
    data: { 
      label: (
        <div className="flex items-center gap-2">
          <Edit className="w-4 h-4" />
          <div>Editor</div>
        </div>
      )
    },
    className: 'bg-background border-2 border-green-100 rounded-lg p-2 shadow-md'
  },
  {
    id: '8',
    position: { x: 450, y: 400 },
    data: { 
      label: (
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4" />
          <div>Quality Reviewer</div>
        </div>
      )
    },
    className: 'bg-background border-2 border-green-100 rounded-lg p-2 shadow-md'
  },
]

const initialEdges: Edge[] = [
  // Main flow
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2', 
    type: 'custom',
    animated: true,
    label: 'Research Plan',
    data: { messages: [] },
    style: { stroke: '#10b981' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#10b981',
    },
  },
  { 
    id: 'e2-3', 
    source: '2', 
    target: '3', 
    type: 'custom',
    animated: true,
    label: 'Generated Content',
    data: { messages: [] },
    style: { stroke: '#8b5cf6' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#8b5cf6',
    },
  },
  // EduResearchCrew connections
  { id: 'e1-4', source: '1', target: '4', type: 'straight' },
  { id: 'e1-5', source: '1', target: '5', type: 'straight' },
  // EduContentWriterCrew connections
  { id: 'e2-6', source: '2', target: '6', type: 'straight' },
  { id: 'e2-7', source: '2', target: '7', type: 'straight' },
  { id: 'e2-8', source: '2', target: '8', type: 'straight' },
]

// Update the types outside the component
type NodeLabel = {
  props: {
    children: [JSX.Element, { props: { children: React.ReactNode[] } }]
  }
}

// Constants remain the same
const STAGE_TO_NODE_MAP: Record<string, string> = {
  research: '1',
  content: '2',
  save: '3'
} as const

const AGENT_TO_NODE_MAP: Record<string, string> = {
  'Researcher': '4',
  'Planner': '5',
  'Content Writer': '6',
  'Editor': '7',
  'Quality Reviewer': '8'
} as const

export default function CrewAIVisualizer() {
  const [edges, setEdges] = useState(initialEdges)
  const [nodes, setNodes] = useState(initialNodes)
  const { messages } = useWebSocket()

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [])

  // Update node styles based on messages
  useEffect(() => {
    if (messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    const activeNodeId = STAGE_TO_NODE_MAP[lastMessage.stage as keyof typeof STAGE_TO_NODE_MAP]
    
    // Extract agent name from message if present
    const agentMatch = lastMessage.message.match(/Agent '([^']+)'/)
    const activeAgentId = agentMatch ? AGENT_TO_NODE_MAP[agentMatch[1] as keyof typeof AGENT_TO_NODE_MAP] : null
    
    setNodes(currentNodes => 
      currentNodes.map(node => {
        // Reset all nodes to their default state first
        const updatedNode = {
          ...node,
          className: 'bg-background border-2 rounded-lg p-2 shadow-lg transition-all duration-300'
        }

        // Recreate the label with highlighting
        const labelContent = (node.data.label as NodeLabel).props.children
        const icon = labelContent[0]
        const textContainer = labelContent[1]
        
        updatedNode.data = {
          ...node.data,
          label: (
            <div className="flex items-center gap-2">
              {icon}
              <div>
                {React.Children.map(textContainer.props.children, (child, index) => {
                  if (typeof child === 'string') {
                    return (
                      <div
                        key={index}
                        className={`${
                          (node.id === activeNodeId || node.id === activeAgentId) ? 
                            lastMessage.stage === 'research' ? 'text-blue-500' :
                            lastMessage.stage === 'content' ? 'text-green-500' :
                            'text-purple-500'
                          : ''
                        }`}
                      >
                        {child}
                      </div>
                    )
                  }
                  return child
                })}
              </div>
            </div>
          )
        }

        // Add specific border colors
        if (node.id === '1') updatedNode.className += ' border-blue-200'
        else if (node.id === '2') updatedNode.className += ' border-green-200'
        else if (node.id === '3') updatedNode.className += ' border-purple-200'
        else if (['4', '5'].includes(node.id)) updatedNode.className += ' border-blue-100'
        else updatedNode.className += ' border-green-100'

        // Add highlight styling for active nodes
        if (node.id === activeNodeId || node.id === activeAgentId) {
          updatedNode.className += lastMessage.stage === 'research' ? ' bg-blue-50' :
                                 lastMessage.stage === 'content' ? ' bg-green-50' :
                                 ' bg-purple-50'
          updatedNode.className = updatedNode.className.replace(
            /border-[^-]*-[12]00/,
            lastMessage.stage === 'research' ? 'border-blue-500' :
            lastMessage.stage === 'content' ? 'border-green-500' :
            'border-purple-500'
          )
        }

        return updatedNode
      })
    )

    // Update edge animations
    setEdges(currentEdges => 
      currentEdges.map(edge => {
        // Get relevant messages for each edge
        const edgeMessages = messages.filter(msg => 
          (edge.id === 'e1-2' && msg.stage === 'research') ||
          (edge.id === 'e2-3' && msg.stage === 'content')
        )

        const isActive = 
          (lastMessage.stage === 'research' && edge.id === 'e1-2') ||
          (lastMessage.stage === 'content' && edge.id === 'e2-3')

        return {
          ...edge,
          type: 'custom',
          animated: isActive,
          data: {
            ...edge.data,
            label: edge.label,
            messages: edgeMessages
          },
          style: {
            ...edge.style,
            stroke: isActive ? '#3b82f6' : edge.style?.stroke
          }
        }
      })
    )
  }, [messages])

  const nodeTypes = useMemo(() => ({}), [])
  const edgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), [])

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-64 border-r bg-background p-4">
        <h2 className="font-semibold mb-4">CrewAI Components</h2>
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <Search className="w-4 h-4 mr-2" />
            EduResearchCrew
          </Button>
          <Button variant="ghost" className="w-full justify-start pl-8">
            <User className="w-3 h-3 mr-2" />
            Researcher
          </Button>
          <Button variant="ghost" className="w-full justify-start pl-8">
            <User className="w-3 h-3 mr-2" />
            Planner
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <PenTool className="w-4 h-4 mr-2" />
            EduContentWriterCrew
          </Button>
          <Button variant="ghost" className="w-full justify-start pl-8">
            <PenTool className="w-3 h-3 mr-2" />
            Content Writer
          </Button>
          <Button variant="ghost" className="w-full justify-start pl-8">
            <Edit className="w-3 h-3 mr-2" />
            Editor
          </Button>
          <Button variant="ghost" className="w-full justify-start pl-8">
            <CheckSquare className="w-3 h-3 mr-2" />
            Quality Reviewer
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Save className="w-4 h-4 mr-2" />
            Save to Markdown
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full">
        <div className="border-b">
          <Tabs defaultValue="flow" className="w-full">
            <TabsList>
              <TabsTrigger value="flow">Flow Visualization</TabsTrigger>
              <TabsTrigger value="code">Code View</TabsTrigger>
              <TabsTrigger value="output">Output</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>
            <TabsContent value="flow" className="h-[calc(100vh-48px)]">
              <ReactFlow 
                nodes={nodes} 
                edges={edges} 
                onConnect={onConnect} 
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                className="h-full w-full"
              >
                <Background />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </TabsContent>
            <TabsContent value="messages">
              <FlowMessages />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

