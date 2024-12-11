import asyncio
import websockets
import json
import logging
from typing import Optional, Dict, Any
from queue import Queue
import threading
import sys

# Set up logging with more detail
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('websocket_server')

# Global message queue for communication between CrewAI and WebSocket
message_queue: Queue = Queue()

def send_update(stage: str, message: str):
    """Helper function to send updates from CrewAI to WebSocket clients"""
    message_queue.put({
        "stage": stage,
        "message": message,
        "timestamp": None,
        "status": "active"
    })
    logger.debug(f"Added message to queue: {stage} - {message}")

async def websocket_handler(websocket, path):
    client_id = id(websocket)
    logger.info(f"New client connected from {websocket.remote_address} (ID: {client_id})")
    
    try:
        # Send initial connection message
        await websocket.send(json.dumps({
            "stage": "system",
            "message": "Connected to CrewAI WebSocket Server"
        }))
        
        # Start message processing loop
        while True:
            if not message_queue.empty():
                message = message_queue.get()
                logger.debug(f"Sending message to client {client_id}: {message}")
                await websocket.send(json.dumps(message))
            await asyncio.sleep(0.1)
            
    except websockets.exceptions.ConnectionClosed as e:
        logger.info(f"Client {client_id} disconnected: {e}")
    except Exception as e:
        logger.error(f"Error handling client {client_id}: {e}", exc_info=True)
    finally:
        logger.info(f"Client {client_id} connection closed")

async def start_server():
    try:
        logger.info("Starting WebSocket server...")
        server = await websockets.serve(
            websocket_handler,
            "localhost",
            8765,
            ping_interval=20,
            ping_timeout=20
        )
        logger.info("WebSocket server is running on ws://localhost:8765")
        await server.wait_closed()
    except Exception as e:
        logger.error(f"Failed to start WebSocket server: {e}", exc_info=True)
        sys.exit(1)

def run_websocket_server():
    """Function to run the WebSocket server in a separate thread"""
    try:
        asyncio.run(start_server())
    except Exception as e:
        logger.error(f"WebSocket server crashed: {e}", exc_info=True)
        sys.exit(1)

def initialize_websocket_server():
    """Initialize and start the WebSocket server in a background thread"""
    server_thread = threading.Thread(target=run_websocket_server, daemon=True)
    server_thread.start()
    logger.info("WebSocket server thread started")
    return server_thread 