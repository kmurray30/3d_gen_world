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
    creations: List[Dict[str, Any]]
    error_message: Optional[str] = None
    raw_response: Optional[str] = None


# System prompt for world modification
SYSTEM_PROMPT = """You are a world state modifier for a minimalist 3D text-based walking simulator game. 
The world consists of simple objects (cubes, spheres, cylinders, cones) with text descriptions.

When given the current world state and a user command, you must return ONLY valid JSON describing the changes to make.

Rules:
1. Return ONLY valid JSON - no markdown, no explanation, no extra text
2. You can MODIFY existing objects OR CREATE new objects
3. For MODIFICATIONS: You can change position (x,y,z), rotation (x,y,z degrees), scale (x,y,z), description (text), properties (on_fire, floating, height_offset, etc)
4. For CREATIONS: You must specify all object fields (position, rotation, scale, shape, description, properties, color)
5. Position Y axis is up/down. Positive Y means higher off the ground. Ground is at Y=0.
6. Be creative but reasonable - small changes for subtle commands, dramatic changes for dramatic commands
7. Update descriptions to reflect the new state of objects
8. You can add new properties to the "properties" object as needed
9. When creating objects, use unique IDs like "bird_1", "campfire_1", etc.
10. Available shapes: "cube", "sphere", "cylinder", "cone", "plane"
11. If the command doesn't make sense or can't be applied, return empty arrays

DESCRIPTION RULES:
- Descriptions should describe WHAT the object IS, not what it's DOING
- Keep descriptions MINIMAL and CONCISE - 1-3 words max
- Focus on key identifiers: type, maybe one adjective
- GOOD: "clown", "sad clown", "wooden table", "red car", "old man"
- BAD: "A tall man in a grey coat", "A small brown bird with feathers", "A shiny red sports car"
- NO articles (a/an/the), NO unnecessary adjectives, NO long phrases
- The action/movement is conveyed through initial_position and position, NOT the description

SPATIAL REASONING FOR CREATIONS:
- Objects have approximate size based on scale: scale [1,1,1] occupies roughly 1 unit radius
- AVOID placing objects at the exact same coordinates as existing objects - check positions and keep reasonable distance
- For ground-level objects, Y coordinate MUST be scale_y/2 (half their vertical scale)
  * Example: object with scale [1, 2, 1] should have Y = 1.0 (not 0!)
  * This ensures the bottom edge touches ground, not the center
  * BAD: scale [1, 0.8, 1] with Y = 0 (object is half-buried!)
  * GOOD: scale [1, 0.8, 1] with Y = 0.4 (bottom edge touches ground)
- When a command implies MOVEMENT (walks, enters, approaches, flies to, drives to, etc.):
  * Use "initial_position" for where the object starts (spawn point)
  * Use "position" for where the object ends up (destination)
  * Place initial_position at least 3-5 units away from destination for visible movement
  * For "enters" verbs, final position should be NEAR but NOT INSIDE the target object
  * Set "movement_duration" (in seconds) based on distance and action type
  * Rough guide: walking = 1-2 units/second, running = 3-4 units/second, flying = 2-5 units/second
- When a command has NO movement implication (spawn, create, add), only use "position" (no initial_position)
- For TEMPORARY/EPHEMERAL objects (smoke, sparks, fire effects, magic, etc.), add "time_to_live" field
  * Measured in seconds from creation
  * Object will fade out and be automatically removed when time expires
  * Use for effects that should disappear: smoke (5-10s), sparks (2-3s), magic effects (3-8s), flames (variable)
  * Permanent objects (people, buildings, rocks) should NOT have time_to_live

Response format:
{
    "modifications": [
        {
            "id": "existing_object_id",
            "changes": {
                "position": [x, y, z],
                "description": "Updated description",
                "properties": {
                    "on_fire": true
                }
            }
        }
    ],
    "creations": [
        {
            "id": "new_unique_id",
            "object": {
                "initial_position": [x, y, z],
                "position": [x, y, z],
                "movement_duration": 3.0,
                "time_to_live": 8.0,
                "rotation": [0, 0, 0],
                "scale": [1, 1, 1],
                "shape": "cube",
                "description": "tall man",
                "properties": {},
                "color": [0.5, 0.5, 0.5, 1.0]
            }
        }
    ]
}

CRITICAL: Always include "time_to_live" field for temporary objects like smoke, sparks, flames, etc.
Omit "time_to_live" only for permanent objects like people, buildings, vehicles, furniture.

EXAMPLES:
Good: "man walks to house" where house is at [8, 2, 10]
  → id: "man_1", description: "tall man" (NOT "A tall man in a grey coat")
  → scale: [1, 1.8, 1], position Y: 0.9 (scale_y/2 = 1.8/2 = 0.9)
  → initial_position: [3, 0.9, 7], position: [7, 0.9, 11], movement_duration: 3.0
  → NO time_to_live (permanent object)

Good: "bird flies down from the sky" 
  → id: "bird_1", description: "small bird" (NOT "A small brown bird")
  → scale: [0.3, 0.3, 0.3], final Y: 0.15 (scale_y/2 = 0.3/2 = 0.15)
  → initial_position: [2, 20, 3], position: [2, 0.15, 3], movement_duration: 4.0
  → NO time_to_live (permanent object)

Good: "house catches fire" where house is at [8, 2, 10]
  → Modify house: add "on_fire": true to properties
  → Create "smoke_1": description "smoke cloud" (NOT "A dark cloud of smoke")
  → position: [8, 6, 10] (above house), time_to_live: 8.0
  → CRITICAL: Must include time_to_live for smoke!

Good: "spawn a rock"
  → id: "rock_2", description: "grey rock" (NOT "A grey rocky stone")
  → scale: [1, 0.8, 1], position: [5, 0.4, 4] (Y = 0.8/2 = 0.4)
  → NO time_to_live (permanent object)

Bad: "man enters house" where house is at [8, 2, 10]
  → position: [8, 2, 10] (NO initial_position)
  (This puts man at exact same coordinates as house - CONFLICT!)

Bad: "bird flies down"
  → description: "A bird flying down"
  (Should be "bird" or "small bird" - no action verbs, no articles!)

Bad: "spawn a rock" with scale [1, 0.8, 1]
  → position: [5, 0, 4]
  (WRONG Y! Should be 0.4, not 0 - object will be half-buried!)

Bad: "smoke appears"
  → description: "smoke", NO time_to_live field
  (MUST include time_to_live for smoke! It's temporary!)

Only include fields that actually change in modifications. For creations, include all required fields.
If only modifying, you can omit the "creations" array. If only creating, you can omit the "modifications" array.
If no movement is implied, omit "initial_position" and "movement_duration"."""


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
                creations=[],
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
                creations=[],
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
                creations=[],
                error_message=f"API error: {str(api_exception)}"
            )
    
    def _parse_response(self, raw_response: str) -> LLMResponse:
        """Parse the LLM response and extract modifications and creations."""
        if not raw_response:
            return LLMResponse(
                success=False,
                modifications=[],
                creations=[],
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
            creations = data.get("creations", [])
            
            # Validate modifications structure
            validated_modifications = []
            for mod in modifications:
                if isinstance(mod, dict) and "id" in mod and "changes" in mod:
                    validated_modifications.append(mod)
            
            # Validate creations structure
            validated_creations = []
            for creation in creations:
                if isinstance(creation, dict) and "id" in creation and "object" in creation:
                    validated_creations.append(creation)
            
            return LLMResponse(
                success=True,
                modifications=validated_modifications,
                creations=validated_creations,
                raw_response=raw_response
            )
            
        except json.JSONDecodeError as json_error:
            return LLMResponse(
                success=False,
                modifications=[],
                creations=[],
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
