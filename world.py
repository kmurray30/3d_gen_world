"""
World state management for the 3D text walking simulator.
Handles object registry, state serialization, and world queries.
"""

import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict


@dataclass
class ObjectProperties:
    """Dynamic properties that can be modified by the LLM."""
    on_fire: bool = False
    floating: bool = False
    height_offset: float = 0.0
    # Additional properties can be added dynamically
    extra: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        result = {
            "on_fire": self.on_fire,
            "floating": self.floating,
            "height_offset": self.height_offset,
        }
        result.update(self.extra)
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ObjectProperties":
        known_keys = {"on_fire", "floating", "height_offset"}
        extra = {key: value for key, value in data.items() if key not in known_keys}
        return cls(
            on_fire=data.get("on_fire", False),
            floating=data.get("floating", False),
            height_offset=data.get("height_offset", 0.0),
            extra=extra
        )


@dataclass
class WorldObjectData:
    """Data representation of a world object (separate from rendering)."""
    object_id: str
    position: List[float]  # [x, y, z] - final/current position
    rotation: List[float]  # [x, y, z] in degrees
    scale: List[float]     # [x, y, z]
    shape: str             # cube, cylinder, cone, sphere, plane
    description: str
    properties: ObjectProperties = field(default_factory=ObjectProperties)
    color: List[float] = field(default_factory=lambda: [0.5, 0.5, 0.5, 1.0])  # RGBA
    initial_position: Optional[List[float]] = None  # For multi-step animations
    movement_duration: float = 1.0  # Duration for movement animations in seconds
    
    def to_dict(self) -> Dict[str, Any]:
        result = {
            "id": self.object_id,
            "position": self.position,
            "rotation": self.rotation,
            "scale": self.scale,
            "shape": self.shape,
            "description": self.description,
            "properties": self.properties.to_dict(),
            "color": self.color
        }
        if self.initial_position is not None:
            result["initial_position"] = self.initial_position
        if self.movement_duration != 1.0:
            result["movement_duration"] = self.movement_duration
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "WorldObjectData":
        properties_data = data.get("properties", {})
        return cls(
            object_id=data["id"],
            position=data.get("position", [0, 0, 0]),
            rotation=data.get("rotation", [0, 0, 0]),
            scale=data.get("scale", [1, 1, 1]),
            shape=data.get("shape", "cube"),
            description=data.get("description", "An object"),
            properties=ObjectProperties.from_dict(properties_data),
            color=data.get("color", [0.5, 0.5, 0.5, 1.0]),
            initial_position=data.get("initial_position"),
            movement_duration=data.get("movement_duration", 1.0)
        )


class WorldState:
    """
    Manages the complete state of the game world.
    Acts as the single source of truth for all object data.
    """
    
    def __init__(self):
        self._objects: Dict[str, WorldObjectData] = {}
        self._render_callbacks: List[callable] = []
    
    def add_object(self, object_data: WorldObjectData) -> None:
        """Add a new object to the world."""
        self._objects[object_data.object_id] = object_data
    
    def get_object(self, object_id: str) -> Optional[WorldObjectData]:
        """Get an object by its ID."""
        return self._objects.get(object_id)
    
    def get_all_objects(self) -> List[WorldObjectData]:
        """Get all objects in the world."""
        return list(self._objects.values())
    
    def remove_object(self, object_id: str) -> bool:
        """Remove an object from the world. Returns True if object existed."""
        if object_id in self._objects:
            del self._objects[object_id]
            return True
        return False
    
    def update_object(self, object_id: str, changes: Dict[str, Any]) -> bool:
        """
        Update an object's properties based on a changes dictionary.
        Returns True if the object was found and updated.
        """
        obj = self._objects.get(object_id)
        if obj is None:
            return False
        
        # Update simple fields
        if "position" in changes:
            obj.position = changes["position"]
        if "rotation" in changes:
            obj.rotation = changes["rotation"]
        if "scale" in changes:
            obj.scale = changes["scale"]
        if "description" in changes:
            obj.description = changes["description"]
        if "color" in changes:
            obj.color = changes["color"]
        if "shape" in changes:
            obj.shape = changes["shape"]
        
        # Update nested properties
        if "properties" in changes:
            props = changes["properties"]
            if "on_fire" in props:
                obj.properties.on_fire = props["on_fire"]
            if "floating" in props:
                obj.properties.floating = props["floating"]
            if "height_offset" in props:
                obj.properties.height_offset = props["height_offset"]
            # Handle any extra properties
            for key, value in props.items():
                if key not in ("on_fire", "floating", "height_offset"):
                    obj.properties.extra[key] = value
        
        return True
    
    def to_json(self) -> str:
        """Serialize the entire world state to JSON for LLM consumption."""
        world_data = {
            "objects": [obj.to_dict() for obj in self._objects.values()]
        }
        return json.dumps(world_data, indent=2)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert world state to dictionary."""
        return {
            "objects": [obj.to_dict() for obj in self._objects.values()]
        }
    
    @classmethod
    def from_json(cls, json_string: str) -> "WorldState":
        """Create a WorldState from a JSON string."""
        data = json.loads(json_string)
        world = cls()
        for obj_data in data.get("objects", []):
            world.add_object(WorldObjectData.from_dict(obj_data))
        return world
    
    def apply_modifications(self, modifications: List[Dict[str, Any]]) -> List[str]:
        """
        Apply a list of modifications from the LLM response.
        Returns list of object IDs that were successfully modified.
        """
        modified_ids = []
        for mod in modifications:
            object_id = mod.get("id")
            changes = mod.get("changes", {})
            if object_id and self.update_object(object_id, changes):
                modified_ids.append(object_id)
        return modified_ids
    
    def apply_creations(self, creations: List[Dict[str, Any]]) -> List[str]:
        """
        Create new objects from LLM response.
        Returns list of object IDs that were successfully created.
        """
        created_ids = []
        for creation in creations:
            object_id = creation.get("id")
            object_data = creation.get("object", {})
            
            if not object_id or object_id in self._objects:
                continue  # Skip if no ID or ID already exists
            
            try:
                # Extract initial_position and movement_duration if present
                initial_pos = object_data.get("initial_position")
                movement_duration = object_data.get("movement_duration", 1.0)
                
                new_obj = WorldObjectData.from_dict({
                    "id": object_id,
                    **object_data
                })
                
                # Store initial position and duration for animation
                if initial_pos:
                    new_obj.initial_position = initial_pos
                    new_obj.movement_duration = movement_duration
                
                self.add_object(new_obj)
                created_ids.append(object_id)
            except Exception:
                continue
        
        return created_ids
