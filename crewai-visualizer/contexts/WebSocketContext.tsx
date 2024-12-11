'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

// Define the message type
type FlowMessage = {
  stage: string
  message: string
  timestamp?: string
}

type WebSocketContextType = {
  messages: FlowMessage[]
  isConnected: boolean
  connectionError: string | null
}

const WebSocketContext = createContext<WebSocketContextType>({
  messages: [],
  isConnected: false,
  connectionError: null
})

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<FlowMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    let reconnectAttempt = 0
    const maxReconnectAttempts = 5
    let ws: WebSocket | null = null

    const connectWebSocket = () => {
      console.log('Attempting to connect to WebSocket...')

      try {
        // First check if the WebSocket is already connected
        if (ws?.readyState === WebSocket.OPEN) {
          console.log('WebSocket is already connected')
          return ws
        }

        // Close existing connection if any
        if (ws) {
          ws.close()
        }

        ws = new WebSocket('ws://localhost:8765')
        console.log('WebSocket instance created:', ws.readyState)

        ws.addEventListener('open', () => {
          console.log('WebSocket connection opened, readyState:', ws?.readyState)
          setIsConnected(true)
          setConnectionError(null)
          reconnectAttempt = 0
        })

        ws.addEventListener('message', (event) => {
          console.log('Received message:', event.data)
          try {
            const data = JSON.parse(event.data) as FlowMessage
            setMessages((prev) => [...prev, data])
          } catch (error) {
            console.error('Error parsing message:', error)
          }
        })

        ws.addEventListener('error', () => {
          console.log('WebSocket error occurred, readyState:', ws?.readyState)
          setIsConnected(false)
          if (!isConnected) {
            setConnectionError('Cannot connect to CrewAI server - please ensure the backend is running')
          } else {
            setConnectionError('Connection error occurred')
          }
        })

        ws.addEventListener('close', (event) => {
          console.log('WebSocket closed, code:', event.code, 'reason:', event.reason, 'readyState:', ws?.readyState)
          setIsConnected(false)
          
          if (reconnectAttempt < maxReconnectAttempts) {
            reconnectAttempt++
            console.log(`Attempting to reconnect (${reconnectAttempt}/${maxReconnectAttempts})...`)
            setTimeout(connectWebSocket, 3000)
          } else {
            setConnectionError('Unable to connect after multiple attempts. Please check if the server is running.')
          }
        })

        return ws
      } catch (error) {
        console.error('Error creating WebSocket:', error)
        setConnectionError('Failed to create WebSocket connection')
        setIsConnected(false)
        return null
      }
    }

    const connection = connectWebSocket()

    return () => {
      console.log('Cleaning up WebSocket connection')
      if (connection) {
        connection.close()
      }
    }
  }, [])

  return (
    <WebSocketContext.Provider value={{ messages, isConnected, connectionError }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => useContext(WebSocketContext)