"""
UI components for the 3D text walking simulator.
Handles text input field and status messages.
"""

from ursina import (
    Entity, Text, Button, InputField, color, 
    camera, window, mouse, held_keys, application
)
from typing import Callable, Optional


class CommandInput:
    """
    Text input field at the bottom of the screen for entering commands.
    When focused, disables mouse look. Press Enter to submit, Escape to unfocus.
    """
    
    def __init__(
        self,
        on_submit: Callable[[str], None],
        placeholder: str = "Type a command... (e.g., 'the table floats up')"
    ):
        self.on_submit = on_submit
        self.is_focused = False
        self._was_mouse_locked = False
        
        # Background panel for the input area
        self.background = Entity(
            parent=camera.ui,
            model="quad",
            color=color.rgba(20, 20, 20, 220),
            scale=(2, 0.08),
            position=(0, -0.46),
            z=-1
        )
        
        # Text input field - note: text_color must be set after creation
        self.input_field = InputField(
            default_value="",
            character_limit=200,
            scale=(1.6, 0.05),
            position=(-0.72, -0.46),
            color=color.rgba(40, 40, 40, 255),
        )
        # Set text color after initialization (can't pass to constructor)
        if hasattr(self.input_field, 'text_field') and self.input_field.text_field:
            self.input_field.text_field.color = color.white
        
        # Placeholder text (shown when input is empty)
        self.placeholder_text = Text(
            text=placeholder,
            scale=0.8,
            position=(-0.70, -0.455),
            color=color.rgba(150, 150, 150, 200),
            parent=camera.ui,
            z=-2
        )
        
        # Submit button
        self.submit_button = Button(
            text="Go",
            scale=(0.1, 0.05),
            position=(0.75, -0.46),
            color=color.rgba(60, 120, 60, 255),
            highlight_color=color.rgba(80, 160, 80, 255),
            pressed_color=color.rgba(40, 100, 40, 255),
            on_click=self._on_submit_clicked
        )
        
        # Status text (for showing loading/errors)
        self.status_text = Text(
            text="",
            scale=0.7,
            position=(0, -0.40),
            origin=(0, 0),
            color=color.rgba(200, 200, 200, 200),
            parent=camera.ui,
        )
        
        # Instruction hint
        self.hint_text = Text(
            text="Press / to type a command | WASD to move | Mouse to look",
            scale=0.6,
            position=(0, -0.50),
            origin=(0, 0),
            color=color.rgba(100, 100, 100, 180),
            parent=camera.ui,
        )
        
        # Track input field state
        self._last_text = ""
    
    def update(self):
        """Called every frame to handle input field state."""
        current_text = self.input_field.text_field.text if self.input_field.text_field else ""
        
        # Show/hide placeholder based on content
        if current_text:
            self.placeholder_text.visible = False
        else:
            self.placeholder_text.visible = True
        
        # Check if input field is active/focused
        is_now_focused = self.input_field.active
        
        if is_now_focused != self.is_focused:
            if is_now_focused:
                self._on_focus()
            else:
                self._on_unfocus()
            self.is_focused = is_now_focused
        
        self._last_text = current_text
    
    def _on_focus(self):
        """Called when input field gains focus."""
        self._was_mouse_locked = mouse.locked
        mouse.locked = False
        mouse.visible = True
        self.background.color = color.rgba(30, 30, 30, 240)
    
    def _on_unfocus(self):
        """Called when input field loses focus."""
        mouse.locked = self._was_mouse_locked
        mouse.visible = not self._was_mouse_locked
        self.background.color = color.rgba(20, 20, 20, 220)
    
    def _on_submit_clicked(self):
        """Called when submit button is clicked."""
        self._submit_current_text()
    
    def handle_input(self, key: str) -> bool:
        """
        Handle keyboard input. Returns True if input was consumed.
        Call this from main game input handler.
        """
        # Slash key focuses the input
        if key == "/" and not self.is_focused:
            self.input_field.active = True
            return True
        
        # Enter submits when focused
        if key == "enter" and self.is_focused:
            self._submit_current_text()
            return True
        
        # Escape unfocuses
        if key == "escape" and self.is_focused:
            self.input_field.active = False
            self.input_field.text_field.text = ""
            return True
        
        return False
    
    def _submit_current_text(self):
        """Submit the current text in the input field."""
        text = self.input_field.text_field.text.strip() if self.input_field.text_field else ""
        
        if text:
            self.on_submit(text)
            self.input_field.text_field.text = ""
            self.input_field.active = False
    
    def set_status(self, message: str, is_error: bool = False):
        """Set the status message shown above the input field."""
        self.status_text.text = message
        if is_error:
            self.status_text.color = color.rgba(255, 100, 100, 220)
        else:
            self.status_text.color = color.rgba(200, 200, 200, 200)
    
    def clear_status(self):
        """Clear the status message."""
        self.status_text.text = ""
    
    def set_loading(self, is_loading: bool):
        """Show/hide loading state."""
        if is_loading:
            self.set_status("Processing...")
            self.submit_button.color = color.rgba(80, 80, 80, 255)
            self.submit_button.text = "..."
        else:
            self.clear_status()
            self.submit_button.color = color.rgba(60, 120, 60, 255)
            self.submit_button.text = "Go"
    
    @property
    def is_input_active(self) -> bool:
        """Check if the input field is currently active/focused."""
        return self.is_focused


class DebugOverlay:
    """
    Optional debug overlay showing world state info.
    Toggle with F3 key.
    """
    
    def __init__(self):
        self.visible = False
        
        self.background = Entity(
            parent=camera.ui,
            model="quad",
            color=color.rgba(0, 0, 0, 180),
            scale=(0.4, 0.3),
            position=(-0.7, 0.35),
            z=-1,
            enabled=False
        )
        
        self.text = Text(
            text="Debug Info",
            scale=0.6,
            position=(-0.88, 0.48),
            color=color.white,
            parent=camera.ui,
            enabled=False
        )
    
    def toggle(self):
        """Toggle visibility of debug overlay."""
        self.visible = not self.visible
        self.background.enabled = self.visible
        self.text.enabled = self.visible
    
    def update_info(self, info_dict: dict):
        """Update the debug info text."""
        if not self.visible:
            return
        
        lines = ["Debug Info:", ""]
        for key, value in info_dict.items():
            lines.append(f"{key}: {value}")
        
        self.text.text = "\n".join(lines)
