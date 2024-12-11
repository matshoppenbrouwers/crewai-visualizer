#!/usr/bin/env python
from random import randint
import os
import asyncio
import subprocess
import signal
import sys
from langtrace_python_sdk import langtrace
from pydantic import BaseModel

from crewai.flow.flow import Flow, listen, start
from .websocket_server import initialize_websocket_server, send_update
from .crews.edu_research.edu_research_crew import EduResearchCrew
from .crews.edu_content_writer.edu_content_writer_crew import EduContentWriterCrew
from .config import EDU_FLOW_INPUT_VARIABLES

api_key = os.getenv('LANGTRACE_API_KEY')
langtrace.init(api_key=api_key)

class EduFlow(Flow):
    input_variables = EDU_FLOW_INPUT_VARIABLES

    @start()
    def generate_reseached_content(self):
        send_update("research", "Starting research phase with EduResearchCrew")
        result = EduResearchCrew().crew().kickoff(self.input_variables).pydantic
        send_update("research", "Research phase completed")
        return result

    @listen(generate_reseached_content)
    def generate_educational_content(self, plan):        
        final_content = []
        send_update("content", "Starting content generation with EduContentWriterCrew")
        
        for section in plan.sections:
            writer_inputs = self.input_variables.copy()
            writer_inputs['section'] = section.model_dump_json()
            send_update("content", f"Generating content for section: {section.title}")
            final_content.append(EduContentWriterCrew().crew().kickoff(writer_inputs).raw)
        
        send_update("content", "Content generation completed")
        return final_content

    @listen(generate_educational_content)
    def save_to_markdown(self, content):
        send_update("save", "Starting to save content to markdown")
        output_dir = "output"
        os.makedirs(output_dir, exist_ok=True)
        
        topic = self.input_variables.get("topic")
        audience_level = self.input_variables.get("audience_level")
        file_name = f"{topic}_{audience_level}.md".replace(" ", "_")
        
        output_path = os.path.join(output_dir, file_name)
        
        with open(output_path, "w", encoding='utf-8') as f:
            for section in content:
                f.write(section)
                f.write("\n\n")
        
        send_update("save", f"Content saved to {file_name}")
        return output_path

def start_frontend():
    """Start the Next.js frontend server"""
    try:
        # Navigate to the crewai-visualizer directory
        visualizer_path = os.path.join(os.path.dirname(__file__), '..', '..', 'crewai-visualizer')
        
        # Start the Next.js development server
        process = subprocess.Popen(
            'npm run dev',
            shell=True,
            cwd=visualizer_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait a moment for the server to start
        import time
        time.sleep(3)
        
        return process
    except Exception as e:
        print(f"Failed to start frontend: {e}")
        return None

def cleanup(frontend_process):
    """Cleanup function to properly shut down all processes"""
    if frontend_process:
        if sys.platform == 'win32':
            frontend_process.terminate()
        else:
            os.killpg(os.getpgid(frontend_process.pid), signal.SIGTERM)

def kickoff():
    try:
        # Start frontend
        print("Starting frontend server...")
        frontend_process = start_frontend()
        
        # Initialize WebSocket server
        print("Starting WebSocket server...")
        initialize_websocket_server()
        
        # Give the servers a moment to start
        import time
        time.sleep(1)
        
        print("Starting CrewAI flow...")
        # Start the flow
        edu_flow = EduFlow()
        edu_flow.kickoff()
        
    except KeyboardInterrupt:
        print("\nShutting down servers...")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        cleanup(frontend_process)

def plot():
    edu_flow = EduFlow()
    edu_flow.plot()

if __name__ == "__main__":
    kickoff()
