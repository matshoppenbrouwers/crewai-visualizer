import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown } from 'lucide-react'

interface PopUpProps {
  messages: { stage: string; message: string }[]
}

export function PopUp({ messages }: PopUpProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex flex-col items-center">
      <Button
        variant="outline"
        size="sm"
        className="mb-2 bg-background"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </Button>
      {isOpen && (
        <Card className="w-[300px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardContent className="p-3 max-h-[200px] overflow-y-auto">
            <ul className="space-y-2">
              {messages.map((msg, index) => (
                <li key={index} className="text-sm">
                  <div className="font-semibold">{msg.stage}</div>
                  <div className="text-muted-foreground">{msg.message}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 