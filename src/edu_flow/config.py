import os

LLM_CONFIGS = {
    "openai": {
        "model": "gpt-3.5-turbo",
        #"model": "gpt-4o-mini",
        "api_key": os.getenv('OPENAI_API_KEY')
    },
    "groq": {
        "model": "mixtral-8x7b-32768",
        "api_key": os.getenv('GROQ_API_KEY')
    },
    "anthropic": {
        "model": "anthropic/claude-3-5-sonnet-20240620",
        "api_key": os.getenv('ANTHROPIC_API_KEY')
    }
}

LLM_CONFIG = LLM_CONFIGS["openai"]

EDU_FLOW_INPUT_VARIABLES = {
    "audience_level": "advanced",
    "topic": "Multi-agent systems"
} 