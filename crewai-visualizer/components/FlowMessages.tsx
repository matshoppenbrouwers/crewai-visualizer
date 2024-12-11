import { useWebSocket } from '@/contexts/WebSocketContext'

export function FlowMessages() {
  const { messages, isConnected, connectionError } = useWebSocket()

  return (
    <div className="h-full overflow-auto p-4">
      <div className="space-y-2">
        {!isConnected && (
          <div className="text-destructive">
            Not connected to CrewAI
            {connectionError && (
              <div className="text-sm mt-1 text-muted-foreground">
                Error: {connectionError}
              </div>
            )}
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className="rounded-lg border p-3 text-sm"
          >
            <div className="font-semibold">{msg.stage}</div>
            <div className="text-muted-foreground">{msg.message}</div>
          </div>
        ))}
      </div>
    </div>
  )
}