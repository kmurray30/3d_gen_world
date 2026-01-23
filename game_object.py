"""
Game object rendering for the 3D text walking simulator.
Handles Ursina entity creation, billboarded text labels, and visual updates.
"""

from ursina import (
    Entity, Text, camera, color, Vec3, 
    destroy, Mesh, held_keys
)
from ursina.shaders import lit_with_shadows_shader
from world import WorldObjectData, ObjectProperties
from typing import Optional, Dict, Any, List
import math


def create_cylinder_mesh(segments: int = 16) -> Mesh:
    """Create a simple cylinder mesh procedurally."""
    vertices = []
    triangles = []
    
    # Generate vertices for top and bottom circles
    for i in range(segments):
        angle = (i / segments) * math.pi * 2
        x_coord = math.cos(angle) * 0.5
        z_coord = math.sin(angle) * 0.5
        
        # Bottom vertex
        vertices.append((x_coord, -0.5, z_coord))
        # Top vertex
        vertices.append((x_coord, 0.5, z_coord))
    
    # Center vertices for caps
    bottom_center_idx = len(vertices)
    vertices.append((0, -0.5, 0))
    top_center_idx = len(vertices)
    vertices.append((0, 0.5, 0))
    
    # Side triangles
    for i in range(segments):
        bottom_current = i * 2
        top_current = i * 2 + 1
        bottom_next = ((i + 1) % segments) * 2
        top_next = ((i + 1) % segments) * 2 + 1
        
        triangles.append((bottom_current, top_current, top_next))
        triangles.append((bottom_current, top_next, bottom_next))
    
    # Bottom cap
    for i in range(segments):
        current_vertex = i * 2
        next_vertex = ((i + 1) % segments) * 2
        triangles.append((bottom_center_idx, next_vertex, current_vertex))
    
    # Top cap
    for i in range(segments):
        current_vertex = i * 2 + 1
        next_vertex = ((i + 1) % segments) * 2 + 1
        triangles.append((top_center_idx, current_vertex, next_vertex))
    
    return Mesh(vertices=vertices, triangles=triangles)


def create_cone_mesh(segments: int = 16) -> Mesh:
    """Create a simple cone mesh procedurally."""
    vertices = []
    triangles = []
    
    # Apex at top
    apex_idx = 0
    vertices.append((0, 0.5, 0))
    
    # Base circle
    for i in range(segments):
        angle = (i / segments) * math.pi * 2
        x_coord = math.cos(angle) * 0.5
        z_coord = math.sin(angle) * 0.5
        vertices.append((x_coord, -0.5, z_coord))
    
    # Base center
    base_center_idx = len(vertices)
    vertices.append((0, -0.5, 0))
    
    # Side triangles (apex to base)
    for i in range(segments):
        current_base = i + 1
        next_base = (i % segments) + 2
        if next_base > segments:
            next_base = 1
        triangles.append((apex_idx, current_base, next_base))
    
    # Base cap triangles
    for i in range(segments):
        current_base = i + 1
        next_base = (i % segments) + 2
        if next_base > segments:
            next_base = 1
        triangles.append((base_center_idx, next_base, current_base))
    
    return Mesh(vertices=vertices, triangles=triangles)


# Cache procedural meshes so we don't recreate them every time
_cylinder_mesh = None
_cone_mesh = None


def get_model_for_shape(shape_name: str):
    """Get the appropriate model for a shape name."""
    global _cylinder_mesh, _cone_mesh
    
    if shape_name == "cylinder":
        if _cylinder_mesh is None:
            _cylinder_mesh = create_cylinder_mesh()
        return _cylinder_mesh
    elif shape_name == "cone":
        if _cone_mesh is None:
            _cone_mesh = create_cone_mesh()
        return _cone_mesh
    else:
        # Built-in models
        return shape_name if shape_name in ("cube", "sphere", "plane", "quad") else "cube"

# Muted color palette for the minimalist aesthetic
PALETTE = {
    "ground": color.rgb(80, 90, 80),
    "house": color.rgb(139, 119, 101),
    "tree_trunk": color.rgb(101, 67, 33),
    "tree_leaves": color.rgb(60, 100, 60),
    "fence": color.rgb(160, 140, 120),
    "table": color.rgb(120, 90, 60),
    "rock": color.rgb(100, 100, 110),
    "default": color.rgb(128, 128, 128),
}


class WorldObject:
    """
    Visual representation of a world object.
    Combines a 3D shape entity with a billboarded text label.
    """
    
    def __init__(self, object_data: WorldObjectData, parent: Optional[Entity] = None):
        self.object_id = object_data.object_id
        self.data = object_data
        
        # Create the main shape entity using procedural mesh or built-in model
        model_for_shape = get_model_for_shape(object_data.shape)
        
        # Determine color from data or use default
        entity_color = self._get_color(object_data)
        
        # Determine collider type based on shape
        collider_type = 'box'  # Works well for most shapes
        if object_data.shape == 'sphere':
            collider_type = 'sphere'
        
        self.entity = Entity(
            model=model_for_shape,
            position=Vec3(*object_data.position),
            rotation=Vec3(*object_data.rotation),
            scale=Vec3(*object_data.scale),
            color=entity_color,
            parent=parent,
            collider=collider_type,  # Enable collision for FirstPersonController ground detection
        )
        
        # Add wireframe overlay for the outline look (only for built-in string models)
        self.wireframe = None
        if isinstance(model_for_shape, str):
            self.wireframe = Entity(
                model=model_for_shape,
                position=Vec3(0, 0, 0),
                scale=Vec3(1.01, 1.01, 1.01),  # Slightly larger to show edges
                color=color.rgba(30, 30, 30, 200),
                parent=self.entity,
                unlit=True,
            )
        
        # Create billboarded text label above the object
        self.label = Text(
            text=object_data.description,
            scale=1.5,
            origin=(0, 0),
            background=True,
            background_color=color.rgba(0, 0, 0, 180),
        )
        self.label.world_parent = self.entity
        self.label.position = Vec3(0, object_data.scale[1] + 0.8, 0)
        
        # Fire effect entity (hidden by default)
        self.fire_effect: Optional[Entity] = None
        if object_data.properties.on_fire:
            self._create_fire_effect()
        
        # Animation state
        self.animation_active = False
        self.animation_start_pos: Optional[Vec3] = None
        self.animation_target_pos: Optional[Vec3] = None
        self.animation_start_rot: Optional[Vec3] = None
        self.animation_target_rot: Optional[Vec3] = None
        self.animation_start_scale: Optional[Vec3] = None
        self.animation_target_scale: Optional[Vec3] = None
        self.animation_progress = 0.0
        self.animation_duration = 1.0
    
    def _get_color(self, object_data: WorldObjectData) -> color:
        """Get color from object data or palette based on object type."""
        if object_data.color and len(object_data.color) >= 3:
            rgba = object_data.color
            # Colors are already 0-1 floats, convert to 0-255 for Ursina
            if len(rgba) == 3:
                return color.rgb(rgba[0] * 255, rgba[1] * 255, rgba[2] * 255)
            else:
                return color.rgba(rgba[0] * 255, rgba[1] * 255, rgba[2] * 255, rgba[3] * 255)
        
        # Try to match by ID prefix for default colors
        for palette_key in PALETTE:
            if palette_key in object_data.object_id.lower():
                return PALETTE[palette_key]
        
        return PALETTE["default"]
    
    def _create_fire_effect(self):
        """Create a visual fire effect (simple orange glow entity)."""
        if self.fire_effect:
            return
        
        self.fire_effect = Entity(
            model="sphere",
            scale=Vec3(1.3, 1.5, 1.3),
            color=color.rgba(255, 100, 0, 100),
            parent=self.entity,
            position=Vec3(0, 0.3, 0),
            unlit=True,
        )
        
        # Add "on fire" to description if not already there
        if "fire" not in self.data.description.lower():
            self.data.description = self.data.description + " (on fire!)"
            self.label.text = self.data.description
    
    def _remove_fire_effect(self):
        """Remove the fire effect."""
        if self.fire_effect:
            destroy(self.fire_effect)
            self.fire_effect = None
    
    def update_from_data(self, new_data: WorldObjectData, animate: bool = True):
        """
        Update the visual representation from new data.
        If animate is True, smoothly transition to new values.
        """
        self.data = new_data
        
        target_pos = Vec3(*new_data.position)
        target_rot = Vec3(*new_data.rotation)
        target_scale = Vec3(*new_data.scale)
        
        # Apply height offset from properties
        target_pos.y += new_data.properties.height_offset
        
        if animate:
            # Set up animation
            self.animation_start_pos = Vec3(self.entity.position)
            self.animation_target_pos = target_pos
            self.animation_start_rot = Vec3(self.entity.rotation)
            self.animation_target_rot = target_rot
            self.animation_start_scale = Vec3(self.entity.scale)
            self.animation_target_scale = target_scale
            self.animation_progress = 0.0
            self.animation_active = True
        else:
            # Instant update
            self.entity.position = target_pos
            self.entity.rotation = target_rot
            self.entity.scale = target_scale
        
        # Update label text
        self.label.text = new_data.description
        
        # Handle fire effect
        if new_data.properties.on_fire:
            self._create_fire_effect()
        else:
            self._remove_fire_effect()
        
        # Update color if changed
        new_color = self._get_color(new_data)
        self.entity.color = new_color
    
    def update(self, delta_time: float):
        """
        Called every frame. Handles animations and billboarding.
        """
        # Billboard the label to face camera
        if camera and self.label:
            # Calculate direction to camera
            direction_to_camera = camera.world_position - self.entity.world_position
            if direction_to_camera.length() > 0.001:
                # Make label face camera (only y-axis rotation for readability)
                angle = math.atan2(direction_to_camera.x, direction_to_camera.z)
                self.label.rotation_y = math.degrees(angle)
        
        # Handle position/rotation/scale animation
        if self.animation_active:
            self.animation_progress += delta_time / self.animation_duration
            
            if self.animation_progress >= 1.0:
                # Animation complete
                self.animation_progress = 1.0
                self.animation_active = False
            
            # Smooth easing function (ease in-out)
            eased_progress = self._ease_in_out(self.animation_progress)
            
            # Lerp position
            if self.animation_start_pos and self.animation_target_pos:
                self.entity.position = self._lerp_vec3(
                    self.animation_start_pos,
                    self.animation_target_pos,
                    eased_progress
                )
            
            # Lerp rotation
            if self.animation_start_rot and self.animation_target_rot:
                self.entity.rotation = self._lerp_vec3(
                    self.animation_start_rot,
                    self.animation_target_rot,
                    eased_progress
                )
            
            # Lerp scale
            if self.animation_start_scale and self.animation_target_scale:
                self.entity.scale = self._lerp_vec3(
                    self.animation_start_scale,
                    self.animation_target_scale,
                    eased_progress
                )
        
        # Animate fire effect if present (simple pulsing)
        if self.fire_effect:
            pulse = 1.0 + 0.1 * math.sin(self.animation_progress * 10 + self.entity.world_position.x)
            self.fire_effect.scale = Vec3(1.3 * pulse, 1.5 * pulse, 1.3 * pulse)
    
    def _ease_in_out(self, t: float) -> float:
        """Smooth ease in-out function."""
        if t < 0.5:
            return 2 * t * t
        else:
            return 1 - pow(-2 * t + 2, 2) / 2
    
    def _lerp_vec3(self, start: Vec3, end: Vec3, t: float) -> Vec3:
        """Linear interpolation between two Vec3s."""
        return Vec3(
            start.x + (end.x - start.x) * t,
            start.y + (end.y - start.y) * t,
            start.z + (end.z - start.z) * t,
        )
    
    def destroy(self):
        """Clean up all entities."""
        if self.fire_effect:
            destroy(self.fire_effect)
        if self.wireframe:
            destroy(self.wireframe)
        if self.label:
            destroy(self.label)
        if self.entity:
            destroy(self.entity)


class WorldRenderer:
    """
    Manages all visual world objects.
    Acts as a bridge between WorldState and Ursina rendering.
    """
    
    def __init__(self):
        self._rendered_objects: Dict[str, WorldObject] = {}
        self._time_accumulator = 0.0
    
    def create_object(self, object_data: WorldObjectData) -> WorldObject:
        """Create a new rendered object from data."""
        world_obj = WorldObject(object_data)
        self._rendered_objects[object_data.object_id] = world_obj
        return world_obj
    
    def get_object(self, object_id: str) -> Optional[WorldObject]:
        """Get a rendered object by ID."""
        return self._rendered_objects.get(object_id)
    
    def update_object(self, object_id: str, new_data: WorldObjectData, animate: bool = True):
        """Update an existing object's visuals."""
        world_obj = self._rendered_objects.get(object_id)
        if world_obj:
            world_obj.update_from_data(new_data, animate)
    
    def remove_object(self, object_id: str):
        """Remove and destroy a rendered object."""
        world_obj = self._rendered_objects.pop(object_id, None)
        if world_obj:
            world_obj.destroy()
    
    def update(self, delta_time: float):
        """Update all rendered objects (call every frame)."""
        self._time_accumulator += delta_time
        for world_obj in self._rendered_objects.values():
            world_obj.update(delta_time)
    
    def sync_with_world_state(self, world_state: "WorldState", animate: bool = True):
        """
        Sync renderer with world state.
        Creates new objects, updates existing ones, removes deleted ones.
        """
        from world import WorldState  # Avoid circular import
        
        current_ids = set(self._rendered_objects.keys())
        state_ids = set(obj.object_id for obj in world_state.get_all_objects())
        
        # Remove objects no longer in state
        for object_id in current_ids - state_ids:
            self.remove_object(object_id)
        
        # Add new objects or update existing ones
        for object_data in world_state.get_all_objects():
            if object_data.object_id in self._rendered_objects:
                self.update_object(object_data.object_id, object_data, animate)
            else:
                self.create_object(object_data)
    
    def destroy_all(self):
        """Destroy all rendered objects."""
        for world_obj in list(self._rendered_objects.values()):
            world_obj.destroy()
        self._rendered_objects.clear()
