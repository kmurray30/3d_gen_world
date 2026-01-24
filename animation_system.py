"""
Animation system for smooth interpolation of object properties.
Handles transitions when the LLM modifies world state.
"""


class ObjectAnimation:
    """Tracks a single object's animation state."""
    
    def __init__(self, start_pos, end_pos, start_rot=None, end_rot=None, 
                 start_scale=None, end_scale=None, duration=1.0):
        self.start_pos = start_pos
        self.end_pos = end_pos
        self.start_rot = start_rot or [0, 0, 0]
        self.end_rot = end_rot or [0, 0, 0]
        self.start_scale = start_scale or [1, 1, 1]
        self.end_scale = end_scale or [1, 1, 1]
        self.duration = duration
        self.elapsed = 0.0
    
    def update(self, dt):
        """Update animation progress and return current interpolated value."""
        self.elapsed += dt
    
    def is_complete(self):
        """Check if animation has finished."""
        return self.elapsed >= self.duration
    
    def interpolate(self, t):
        """Linear interpolation between start and end positions."""
        return [
            self.start_pos[0] + (self.end_pos[0] - self.start_pos[0]) * t,
            self.start_pos[1] + (self.end_pos[1] - self.start_pos[1]) * t,
            self.start_pos[2] + (self.end_pos[2] - self.start_pos[2]) * t,
        ]
    
    def interpolate_rotation(self, t):
        """Linear interpolation between start and end rotation."""
        return [
            self.start_rot[0] + (self.end_rot[0] - self.start_rot[0]) * t,
            self.start_rot[1] + (self.end_rot[1] - self.start_rot[1]) * t,
            self.start_rot[2] + (self.end_rot[2] - self.start_rot[2]) * t,
        ]
    
    def interpolate_scale(self, t):
        """Linear interpolation between start and end scale."""
        return [
            self.start_scale[0] + (self.end_scale[0] - self.start_scale[0]) * t,
            self.start_scale[1] + (self.end_scale[1] - self.start_scale[1]) * t,
            self.start_scale[2] + (self.end_scale[2] - self.start_scale[2]) * t,
        ]


class AnimationManager:
    """Manages all active animations for world objects."""
    
    def __init__(self):
        self.animations = {}  # object_id -> ObjectAnimation
    
    def start_animation(self, object_id, start_pos, end_pos, start_rot=None, end_rot=None,
                       start_scale=None, end_scale=None, duration=1.0):
        """Start a new animation for an object's position, rotation, and scale."""
        self.animations[object_id] = ObjectAnimation(
            start_pos, end_pos, start_rot, end_rot, start_scale, end_scale, duration
        )
    
    def update(self, dt):
        """Update all active animations and remove completed ones."""
        to_remove = []
        
        for obj_id, anim in self.animations.items():
            anim.update(dt)
            if anim.is_complete():
                to_remove.append(obj_id)
        
        for obj_id in to_remove:
            del self.animations[obj_id]
    
    def get_render_position(self, object_id, base_position):
        """Get interpolated position if animating, else base position."""
        if object_id in self.animations:
            anim = self.animations[object_id]
            progress = min(anim.elapsed / anim.duration, 1.0)
            t = progress * progress * (3.0 - 2.0 * progress)  # Ease-in-out
            return anim.interpolate(t)
        return base_position
    
    def get_render_rotation(self, object_id, base_rotation):
        """Get interpolated rotation if animating, else base rotation."""
        if object_id in self.animations:
            anim = self.animations[object_id]
            progress = min(anim.elapsed / anim.duration, 1.0)
            t = progress * progress * (3.0 - 2.0 * progress)  # Ease-in-out
            return anim.interpolate_rotation(t)
        return base_rotation
    
    def get_render_scale(self, object_id, base_scale):
        """Get interpolated scale if animating, else base scale."""
        if object_id in self.animations:
            anim = self.animations[object_id]
            progress = min(anim.elapsed / anim.duration, 1.0)
            t = progress * progress * (3.0 - 2.0 * progress)  # Ease-in-out
            return anim.interpolate_scale(t)
        return base_scale
    
    def is_animating(self, object_id):
        """Check if an object is currently animating."""
        return object_id in self.animations
    
    def clear(self):
        """Clear all active animations."""
        self.animations.clear()
