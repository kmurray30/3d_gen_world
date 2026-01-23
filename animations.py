"""
Animation and tweening system for smooth property transitions.
Used when LLM modifies world state to create smooth visual transitions.
"""

from typing import Any, Callable, Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import math


class EaseType(Enum):
    """Available easing functions for animations."""
    LINEAR = "linear"
    EASE_IN = "ease_in"
    EASE_OUT = "ease_out"
    EASE_IN_OUT = "ease_in_out"
    BOUNCE = "bounce"
    ELASTIC = "elastic"


@dataclass
class Tween:
    """
    Represents a single value being tweened over time.
    """
    object_id: str
    property_name: str
    start_value: Any
    end_value: Any
    duration: float
    elapsed: float = 0.0
    ease_type: EaseType = EaseType.EASE_IN_OUT
    on_complete: Optional[Callable] = None
    
    @property
    def progress(self) -> float:
        """Get normalized progress (0 to 1)."""
        if self.duration <= 0:
            return 1.0
        return min(self.elapsed / self.duration, 1.0)
    
    @property
    def is_complete(self) -> bool:
        """Check if tween has finished."""
        return self.elapsed >= self.duration


class AnimationManager:
    """
    Manages all active tweens/animations in the game.
    Call update() every frame with delta_time.
    """
    
    def __init__(self):
        self._active_tweens: List[Tween] = []
        self._on_value_change_callbacks: Dict[str, Callable] = {}
    
    def add_tween(
        self,
        object_id: str,
        property_name: str,
        start_value: Any,
        end_value: Any,
        duration: float = 1.0,
        ease_type: EaseType = EaseType.EASE_IN_OUT,
        on_complete: Optional[Callable] = None
    ) -> Tween:
        """
        Create and register a new tween animation.
        Cancels any existing tween for the same object/property combo.
        """
        # Cancel existing tweens for the same property
        self._active_tweens = [
            tween for tween in self._active_tweens
            if not (tween.object_id == object_id and tween.property_name == property_name)
        ]
        
        tween = Tween(
            object_id=object_id,
            property_name=property_name,
            start_value=start_value,
            end_value=end_value,
            duration=duration,
            ease_type=ease_type,
            on_complete=on_complete
        )
        
        self._active_tweens.append(tween)
        return tween
    
    def register_value_change_callback(self, object_id: str, callback: Callable):
        """
        Register a callback to be called when any property of an object changes.
        Callback signature: callback(property_name: str, new_value: Any)
        """
        self._on_value_change_callbacks[object_id] = callback
    
    def unregister_callback(self, object_id: str):
        """Remove callback for an object."""
        self._on_value_change_callbacks.pop(object_id, None)
    
    def update(self, delta_time: float) -> List[Tuple[str, str, Any]]:
        """
        Update all active tweens.
        Returns list of (object_id, property_name, current_value) for changed values.
        """
        completed_tweens: List[Tween] = []
        changed_values: List[Tuple[str, str, Any]] = []
        
        for tween in self._active_tweens:
            tween.elapsed += delta_time
            
            # Calculate eased progress
            eased_progress = self._apply_easing(tween.progress, tween.ease_type)
            
            # Interpolate value
            current_value = self._interpolate(
                tween.start_value,
                tween.end_value,
                eased_progress
            )
            
            changed_values.append((tween.object_id, tween.property_name, current_value))
            
            # Notify callback if registered
            callback = self._on_value_change_callbacks.get(tween.object_id)
            if callback:
                callback(tween.property_name, current_value)
            
            if tween.is_complete:
                completed_tweens.append(tween)
        
        # Remove completed tweens and trigger callbacks
        for tween in completed_tweens:
            self._active_tweens.remove(tween)
            if tween.on_complete:
                tween.on_complete()
        
        return changed_values
    
    def cancel_all_for_object(self, object_id: str):
        """Cancel all tweens for a specific object."""
        self._active_tweens = [
            tween for tween in self._active_tweens
            if tween.object_id != object_id
        ]
    
    def cancel_all(self):
        """Cancel all active tweens."""
        self._active_tweens.clear()
    
    def has_active_tweens(self, object_id: Optional[str] = None) -> bool:
        """Check if there are active tweens (optionally for a specific object)."""
        if object_id:
            return any(t.object_id == object_id for t in self._active_tweens)
        return len(self._active_tweens) > 0
    
    def _apply_easing(self, progress: float, ease_type: EaseType) -> float:
        """Apply easing function to progress value."""
        if ease_type == EaseType.LINEAR:
            return progress
        
        elif ease_type == EaseType.EASE_IN:
            return progress * progress
        
        elif ease_type == EaseType.EASE_OUT:
            return 1 - (1 - progress) * (1 - progress)
        
        elif ease_type == EaseType.EASE_IN_OUT:
            if progress < 0.5:
                return 2 * progress * progress
            else:
                return 1 - pow(-2 * progress + 2, 2) / 2
        
        elif ease_type == EaseType.BOUNCE:
            return self._bounce_ease_out(progress)
        
        elif ease_type == EaseType.ELASTIC:
            return self._elastic_ease_out(progress)
        
        return progress
    
    def _bounce_ease_out(self, progress: float) -> float:
        """Bounce easing function."""
        n1 = 7.5625
        d1 = 2.75
        
        if progress < 1 / d1:
            return n1 * progress * progress
        elif progress < 2 / d1:
            progress -= 1.5 / d1
            return n1 * progress * progress + 0.75
        elif progress < 2.5 / d1:
            progress -= 2.25 / d1
            return n1 * progress * progress + 0.9375
        else:
            progress -= 2.625 / d1
            return n1 * progress * progress + 0.984375
    
    def _elastic_ease_out(self, progress: float) -> float:
        """Elastic easing function."""
        if progress == 0 or progress == 1:
            return progress
        
        c4 = (2 * math.pi) / 3
        return pow(2, -10 * progress) * math.sin((progress * 10 - 0.75) * c4) + 1
    
    def _interpolate(self, start: Any, end: Any, progress: float) -> Any:
        """
        Interpolate between two values based on their type.
        Supports: numbers, lists (Vec3-like), tuples.
        """
        # Handle numeric types
        if isinstance(start, (int, float)) and isinstance(end, (int, float)):
            return start + (end - start) * progress
        
        # Handle lists (like positions [x, y, z])
        if isinstance(start, list) and isinstance(end, list):
            if len(start) != len(end):
                return end  # Can't interpolate different length lists
            return [
                self._interpolate(start_val, end_val, progress)
                for start_val, end_val in zip(start, end)
            ]
        
        # Handle tuples
        if isinstance(start, tuple) and isinstance(end, tuple):
            if len(start) != len(end):
                return end
            return tuple(
                self._interpolate(start_val, end_val, progress)
                for start_val, end_val in zip(start, end)
            )
        
        # For non-interpolatable types, snap to end value at the end
        return end if progress >= 1.0 else start


def lerp(start: float, end: float, progress: float) -> float:
    """Simple linear interpolation helper."""
    return start + (end - start) * progress


def lerp_vec3(start: List[float], end: List[float], progress: float) -> List[float]:
    """Linear interpolation for 3D vectors."""
    return [
        lerp(start[0], end[0], progress),
        lerp(start[1], end[1], progress),
        lerp(start[2], end[2], progress),
    ]
