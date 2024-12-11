import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { WebSocketProvider } from '@/contexts/WebSocketContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CrewAI Flow Visualizer',
  description: 'Interactive visualization of CrewAI educational content generation flow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WebSocketProvider>{children}</WebSocketProvider>
      </body>
    </html>
  )
}