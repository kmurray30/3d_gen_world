"""
LLM controller for processing natural language commands.
Uses Grok 4.1 via XAI API (OpenAI-compatible) to interpret user input
and generate world modifications.
"""

import os
import json
import threading
from typing import Any, Callable, Dict, List, Optional
from dataclasses import dataclass
from openai import OpenAI


@dataclass
class LLMResponse:
    """Response from the LLM containing world modifications."""
    success: bool
    modifications: List[Dict[str, Any]]
    error_message: Optional[str] = None
    raw_response: Optional[str] = None


# System prompt for world modification
SYSTEM_PROMPT = """You are a world state modifier for a minimalist 3D text-based walking simulator game. 
The world consists of simple objects (cubes, spheres, cylinders, cones) with text descriptions.

When given the current world state and a user command, you must return ONLY valid JSON describing the changes to make.

Rules:
1. Return ONLY valid JSON - no markdown, no explanation, no extra text
2. You can modify: position (x,y,z), rotation (x,y,z degrees), scale (x,y,z), description (text), properties (on_fire, floating, height_offset, etc)
3. Position Y axis is up/down. Positive Y means higher off the ground.
4. Be creative but reasonable - small changes for subtle commands, dramatic changes for dramatic commands
5. Update the description to reflect the new state of the object
6. You can add new properties to the "properties" object as needed
7. If the command doesn't make sense or can't be applied, return an empty modifications array

Response format:
{
    "modifications": [
        {
            "id": "object_id_here",
            "changes": {
                "position": [x, y, z],
                "description": "New description",
                "properties": {
                    "on_fire": true
                }
            }
        }
    ]
}

Only include fields that actually change. For example, if only the description changes, only include "description" in changes."""


class LLMController:
    """
    Handles communication with Grok 4.1 for world modification commands.
    Uses threading to avoid blocking the game loop.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("XAI_API_KEY")
        if not self.api_key:
            raise ValueError("XAI_API_KEY not found in environment variables")
        
        # XAI uses OpenAI-compatible API
        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://api.x.ai/v1"
        )
        
        self.model = "grok-4-1-fast-non-reasoning"  # Grok 4.1 fast non-reasoning
        
        # Async processing state
        self._processing = False
        self._pending_callbacks: List[Callable[[LLMResponse], None]] = []
    
    @property
    def is_processing(self) -> bool:
        """Check if currently processing a request."""
        return self._processing
    
    def process_command(
        self,
        user_command: str,
        world_state_json: str,
        callback: Callable[[LLMResponse], None]
    ) -> None:
        """
        Process a user command asynchronously.
        Callback is called with the LLMResponse when complete.
        """
        if self._processing:
            callback(LLMResponse(
                success=False,
                modifications=[],
                error_message="Already processing a command"
            ))
            return
        
        self._processing = True
        
        # Run API call in background thread
        thread = threading.Thread(
            target=self._process_command_thread,
            args=(user_command, world_state_json, callback),
            daemon=True
        )
        thread.start()
    
    def _process_command_thread(
        self,
        user_command: str,
        world_state_json: str,
        callback: Callable[[LLMResponse], None]
    ) -> None:
        """Background thread for API call."""
        try:
            response = self._call_api(user_command, world_state_json)
            callback(response)
        except Exception as exception:
            callback(LLMResponse(
                success=False,
                modifications=[],
                error_message=f"Error: {str(exception)}"
            ))
        finally:
            self._processing = False
    
    def _call_api(self, user_command: str, world_state_json: str) -> LLMResponse:
        """Make the actual API call to Grok."""
        user_message = f"""Current world state:
{world_state_json}

User command: "{user_command}"

Return the JSON modifications:"""
        
        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=1024
            )
            
            raw_response = completion.choices[0].message.content
            
            # Parse the JSON response
            parsed_response = self._parse_response(raw_response)
            return parsed_response
            
        except Exception as api_exception:
            return LLMResponse(
                success=False,
                modifications=[],
                error_message=f"API error: {str(api_exception)}"
            )
    
    def _parse_response(self, raw_response: str) -> LLMResponse:
        """Parse the LLM response and extract modifications."""
        if not raw_response:
            return LLMResponse(
                success=False,
                modifications=[],
                error_message="Empty response from LLM"
            )
        
        # Clean up response - remove markdown code blocks if present
        cleaned_response = raw_response.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]
        elif cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]
        cleaned_response = cleaned_response.strip()
        
        try:
            data = json.loads(cleaned_response)
            
            modifications = data.get("modifications", [])
            
            # Validate modifications structure
            validated_modifications = []
            for mod in modifications:
                if isinstance(mod, dict) and "id" in mod and "changes" in mod:
                    validated_modifications.append(mod)
            
            return LLMResponse(
                success=True,
                modifications=validated_modifications,
                raw_response=raw_response
            )
            
        except json.JSONDecodeError as json_error:
            return LLMResponse(
                success=False,
                modifications=[],
                error_message=f"Invalid JSON in response: {str(json_error)}",
                raw_response=raw_response
            )
    
    def process_command_sync(
        self,
        user_command: str,
        world_state_json: str
    ) -> LLMResponse:
        """
        Synchronous version of process_command.
        Blocks until response is received. Use only for testing.
        """
        return self._call_api(user_command, world_state_json)
