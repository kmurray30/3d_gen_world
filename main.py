"""
3D Text-Based Walking Simulator
A minimalist 3D world where objects are rendered as basic shapes with text descriptions.
Use WASD to move, mouse to look, and type commands to modify the world via Grok 4.1.

Built with pygame + PyOpenGL for reliable cross-platform OpenGL support.
"""

import pygame
from pygame.locals import *
from OpenGL.GL import *
from OpenGL.GLU import *
import math
import json
from dotenv import load_dotenv
load_dotenv()

from world import WorldState, WorldObjectData, ObjectProperties
from llm_controller import LLMController, LLMResponse
from animation_system import AnimationManager

# Window setup
WINDOW_WIDTH = 1280
WINDOW_HEIGHT = 720

# Player state
player_pos = [0.0, 1.7, 0.0]
player_yaw = 0.0
player_pitch = 0.0

# Movement
move_speed = 5.0
mouse_sensitivity = 0.15

# Game state
world_state = None
llm_controller = None
animation_manager = None
text_input_active = False
text_input_buffer = ""
status_message = ""
status_is_error = False
clock = None


def create_initial_scene() -> WorldState:
    """Create the initial outdoor scene with basic objects."""
    state = WorldState()
    
    # House
    state.add_object(WorldObjectData(
        object_id="house",
        position=[8, 2, 10],
        rotation=[0, 15, 0],
        scale=[4, 4, 5],
        shape="cube",
        description="A small wooden house",
        color=[0.55, 0.47, 0.4, 1.0]
    ))
    
    # Table
    state.add_object(WorldObjectData(
        object_id="table",
        position=[0, 0.5, 5],
        rotation=[0, 0, 0],
        scale=[2, 0.2, 1],
        shape="cube",
        description="A wooden table",
        color=[0.47, 0.35, 0.24, 1.0]
    ))
    
    # Rock
    state.add_object(WorldObjectData(
        object_id="rock",
        position=[3, 0.4, 2],
        rotation=[0, 30, 0],
        scale=[0.8, 0.6, 0.9],
        shape="cube",
        description="A large rock",
        color=[0.4, 0.4, 0.43, 1.0]
    ))
    
    # Tree
    state.add_object(WorldObjectData(
        object_id="tree",
        position=[-5, 2, 8],
        rotation=[0, 0, 0],
        scale=[1, 4, 1],
        shape="cube",
        description="A tall tree",
        color=[0.3, 0.5, 0.3, 1.0]
    ))
    
    # Fence
    state.add_object(WorldObjectData(
        object_id="fence",
        position=[-8, 0.5, 4],
        rotation=[0, 0, 0],
        scale=[0.2, 1, 4],
        shape="cube",
        description="A wooden fence",
        color=[0.5, 0.4, 0.3, 1.0]
    ))
    
    return state


def draw_cube(position, scale, color):
    """Draw a simple cube."""
    x, y, z = position
    sx, sy, sz = [s/2 for s in scale]
    r, g, b, a = color
    
    glColor4f(r, g, b, a)
    
    glBegin(GL_QUADS)
    # Front
    glVertex3f(x-sx, y-sy, z+sz); glVertex3f(x+sx, y-sy, z+sz)
    glVertex3f(x+sx, y+sy, z+sz); glVertex3f(x-sx, y+sy, z+sz)
    # Back
    glVertex3f(x-sx, y-sy, z-sz); glVertex3f(x-sx, y+sy, z-sz)
    glVertex3f(x+sx, y+sy, z-sz); glVertex3f(x+sx, y-sy, z-sz)
    # Top
    glVertex3f(x-sx, y+sy, z-sz); glVertex3f(x-sx, y+sy, z+sz)
    glVertex3f(x+sx, y+sy, z+sz); glVertex3f(x+sx, y+sy, z-sz)
    # Bottom
    glVertex3f(x-sx, y-sy, z-sz); glVertex3f(x+sx, y-sy, z-sz)
    glVertex3f(x+sx, y-sy, z+sz); glVertex3f(x-sx, y-sy, z+sz)
    # Right
    glVertex3f(x+sx, y-sy, z-sz); glVertex3f(x+sx, y+sy, z-sz)
    glVertex3f(x+sx, y+sy, z+sz); glVertex3f(x+sx, y-sy, z+sz)
    # Left
    glVertex3f(x-sx, y-sy, z-sz); glVertex3f(x-sx, y-sy, z+sz)
    glVertex3f(x-sx, y+sy, z+sz); glVertex3f(x-sx, y+sy, z-sz)
    glEnd()
    
    # Draw edges
    glColor4f(0.1, 0.1, 0.1, 1.0)
    glLineWidth(2.0)
    glBegin(GL_LINES)
    # Bottom edges
    glVertex3f(x-sx, y-sy, z-sz); glVertex3f(x+sx, y-sy, z-sz)
    glVertex3f(x+sx, y-sy, z-sz); glVertex3f(x+sx, y-sy, z+sz)
    glVertex3f(x+sx, y-sy, z+sz); glVertex3f(x-sx, y-sy, z+sz)
    glVertex3f(x-sx, y-sy, z+sz); glVertex3f(x-sx, y-sy, z-sz)
    # Top edges
    glVertex3f(x-sx, y+sy, z-sz); glVertex3f(x+sx, y+sy, z-sz)
    glVertex3f(x+sx, y+sy, z-sz); glVertex3f(x+sx, y+sy, z+sz)
    glVertex3f(x+sx, y+sy, z+sz); glVertex3f(x-sx, y+sy, z+sz)
    glVertex3f(x-sx, y+sy, z+sz); glVertex3f(x-sx, y+sy, z-sz)
    # Vertical edges
    glVertex3f(x-sx, y-sy, z-sz); glVertex3f(x-sx, y+sy, z-sz)
    glVertex3f(x+sx, y-sy, z-sz); glVertex3f(x+sx, y+sy, z-sz)
    glVertex3f(x+sx, y-sy, z+sz); glVertex3f(x+sx, y+sy, z+sz)
    glVertex3f(x-sx, y-sy, z+sz); glVertex3f(x-sx, y+sy, z+sz)
    glEnd()


def draw_ground():
    """Draw ground plane with grid."""
    glColor4f(0.3, 0.35, 0.3, 1.0)
    glBegin(GL_QUADS)
    size = 50
    glVertex3f(-size, 0, -size)
    glVertex3f(-size, 0, size)
    glVertex3f(size, 0, size)
    glVertex3f(size, 0, -size)
    glEnd()
    
    # Grid
    glColor4f(0.25, 0.3, 0.25, 1.0)
    glLineWidth(1.0)
    glBegin(GL_LINES)
    for i in range(-size, size + 1, 5):
        glVertex3f(i, 0.01, -size)
        glVertex3f(i, 0.01, size)
        glVertex3f(-size, 0.01, i)
        glVertex3f(size, 0.01, i)
    glEnd()


def draw_3d_text(text, position, text_scale=2.0, rotation=(0, 0, 0), scale_multiplier=1.0):
    """
    Draw billboarded text in 3D space that always faces the camera.
    The text appears as a floating label at the given 3D position.
    
    Args:
        text: The text to display
        position: (x, y, z) position in 3D space
        text_scale: Base scale for text size
        rotation: (x, y, z) rotation in degrees (z-rotation applied to billboard)
        scale_multiplier: Additional scale factor from object's scale
    """
    x, y, z = position
    
    # Create text surface with pygame
    font_size = 32
    font = pygame.font.SysFont('Arial', font_size, bold=True)
    
    # Render text with white color and transparent background
    text_surface = font.render(text, True, (255, 255, 255))
    text_width = text_surface.get_width()
    text_height = text_surface.get_height()
    
    # Convert pygame surface to OpenGL texture
    text_data = pygame.image.tostring(text_surface, "RGBA", True)
    
    # Generate texture
    texture_id = glGenTextures(1)
    glBindTexture(GL_TEXTURE_2D, texture_id)
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR)
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR)
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, text_width, text_height, 
                 0, GL_RGBA, GL_UNSIGNED_BYTE, text_data)
    
    # Enable texturing and blending for transparent background
    glEnable(GL_TEXTURE_2D)
    glEnable(GL_BLEND)
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA)
    
    # Get the current modelview matrix to extract camera orientation
    modelview_matrix = glGetFloatv(GL_MODELVIEW_MATRIX)
    
    # Extract right and up vectors from the modelview matrix (for billboarding)
    # These are the camera's local X and Y axes in world space
    right_x = modelview_matrix[0][0]
    right_y = modelview_matrix[1][0]
    right_z = modelview_matrix[2][0]
    
    up_x = modelview_matrix[0][1]
    up_y = modelview_matrix[1][1]
    up_z = modelview_matrix[2][1]
    
    # Apply Z-rotation to the billboard (rotate around the forward axis)
    z_rot_rad = math.radians(rotation[2])
    cos_rot = math.cos(z_rot_rad)
    sin_rot = math.sin(z_rot_rad)
    
    # Rotate the right and up vectors
    new_right_x = right_x * cos_rot - up_x * sin_rot
    new_right_y = right_y * cos_rot - up_y * sin_rot
    new_right_z = right_z * cos_rot - up_z * sin_rot
    
    new_up_x = right_x * sin_rot + up_x * cos_rot
    new_up_y = right_y * sin_rot + up_y * cos_rot
    new_up_z = right_z * sin_rot + up_z * cos_rot
    
    right_x, right_y, right_z = new_right_x, new_right_y, new_right_z
    up_x, up_y, up_z = new_up_x, new_up_y, new_up_z
    
    # Calculate quad size based on text dimensions, scale, and scale multiplier
    aspect_ratio = text_width / text_height
    quad_height = text_scale * 0.1 * scale_multiplier  # Apply scale multiplier
    quad_width = quad_height * aspect_ratio
    
    # Calculate the four corners of the billboard quad
    # Center the quad at the position
    half_width = quad_width / 2
    half_height = quad_height / 2
    
    # Bottom-left corner
    bl_x = x - (right_x * half_width) - (up_x * half_height)
    bl_y = y - (right_y * half_width) - (up_y * half_height)
    bl_z = z - (right_z * half_width) - (up_z * half_height)
    
    # Bottom-right corner
    br_x = x + (right_x * half_width) - (up_x * half_height)
    br_y = y + (right_y * half_width) - (up_y * half_height)
    br_z = z + (right_z * half_width) - (up_z * half_height)
    
    # Top-right corner
    tr_x = x + (right_x * half_width) + (up_x * half_height)
    tr_y = y + (right_y * half_width) + (up_y * half_height)
    tr_z = z + (right_z * half_width) + (up_z * half_height)
    
    # Top-left corner
    tl_x = x - (right_x * half_width) + (up_x * half_height)
    tl_y = y - (right_y * half_width) + (up_y * half_height)
    tl_z = z - (right_z * half_width) + (up_z * half_height)
    
    # Draw textured quad
    glColor4f(1.0, 1.0, 1.0, 1.0)  # White color, full alpha
    glBegin(GL_QUADS)
    glTexCoord2f(0, 0); glVertex3f(bl_x, bl_y, bl_z)  # Bottom-left
    glTexCoord2f(1, 0); glVertex3f(br_x, br_y, br_z)  # Bottom-right
    glTexCoord2f(1, 1); glVertex3f(tr_x, tr_y, tr_z)  # Top-right
    glTexCoord2f(0, 1); glVertex3f(tl_x, tl_y, tl_z)  # Top-left
    glEnd()
    
    # Clean up
    glDisable(GL_TEXTURE_2D)
    glDeleteTextures([texture_id])


def setup_3d():
    """Set up 3D projection and camera."""
    glMatrixMode(GL_PROJECTION)
    glLoadIdentity()
    gluPerspective(70, WINDOW_WIDTH/WINDOW_HEIGHT, 0.1, 1000.0)
    
    glMatrixMode(GL_MODELVIEW)
    glLoadIdentity()
    glRotatef(-player_pitch, 1, 0, 0)
    glRotatef(-player_yaw, 0, 1, 0)
    glTranslatef(-player_pos[0], -player_pos[1], -player_pos[2])


def render_text(text, x, y, color=(255, 255, 255)):
    """Render text on screen using pygame font."""
    font = pygame.font.SysFont('Arial', 14)
    text_surface = font.render(text, True, color)
    text_data = pygame.image.tostring(text_surface, "RGBA", True)
    
    glMatrixMode(GL_PROJECTION)
    glPushMatrix()
    glLoadIdentity()
    glOrtho(0, WINDOW_WIDTH, 0, WINDOW_HEIGHT, -1, 1)
    glMatrixMode(GL_MODELVIEW)
    glPushMatrix()
    glLoadIdentity()
    
    glRasterPos2f(x, WINDOW_HEIGHT - y)
    glDrawPixels(text_surface.get_width(), text_surface.get_height(),
                  GL_RGBA, GL_UNSIGNED_BYTE, text_data)
    
    glPopMatrix()
    glMatrixMode(GL_PROJECTION)
    glPopMatrix()
    glMatrixMode(GL_MODELVIEW)


def draw_frame():
    """Main rendering function."""
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
    glClearColor(0.2, 0.25, 0.3, 1.0)
    
    # 3D rendering
    setup_3d()
    draw_ground()
    
    # Draw world objects as floating 3D text with animation
    if world_state and animation_manager:
        for obj in world_state.get_all_objects():
            # Get animated position if animating, else use world state position
            base_pos = list(obj.position)
            render_pos = animation_manager.get_render_position(obj.object_id, base_pos)
            render_pos[1] += obj.properties.height_offset
            
            # Get animated rotation
            base_rot = list(obj.rotation)
            render_rot = animation_manager.get_render_rotation(obj.object_id, base_rot)
            
            # Get animated scale and use average for text size multiplier
            base_scale = list(obj.scale)
            render_scale = animation_manager.get_render_scale(obj.object_id, base_scale)
            scale_avg = sum(render_scale) / len(render_scale)  # Average of x, y, z
            
            # Draw text at interpolated position with rotation and scale
            draw_3d_text(obj.description, render_pos, text_scale=2.0, 
                        rotation=render_rot, scale_multiplier=scale_avg)
    
    # UI overlay (text)
    glDisable(GL_DEPTH_TEST)
    glMatrixMode(GL_PROJECTION)
    glLoadIdentity()
    glOrtho(0, WINDOW_WIDTH, WINDOW_HEIGHT, 0, -1, 1)
    glMatrixMode(GL_MODELVIEW)
    glLoadIdentity()
    
    # Draw UI background
    glColor4f(0.1, 0.1, 0.1, 0.9)
    glBegin(GL_QUADS)
    glVertex2f(0, WINDOW_HEIGHT - 60)
    glVertex2f(WINDOW_WIDTH, WINDOW_HEIGHT - 60)
    glVertex2f(WINDOW_WIDTH, WINDOW_HEIGHT)
    glVertex2f(0, WINDOW_HEIGHT)
    glEnd()
    
    # Render text input UI using pygame font
    if text_input_active:
        prompt_text = f"> {text_input_buffer}_"
    else:
        prompt_text = "Press / or Enter to type a command | WASD to move | Mouse to look"
    
    # Render prompt text
    font = pygame.font.SysFont('Courier', 14)
    text_surface = font.render(prompt_text, True, (200, 200, 200))
    text_data = pygame.image.tostring(text_surface, "RGBA", True)
    
    glRasterPos2f(10, WINDOW_HEIGHT - 45)
    glDrawPixels(text_surface.get_width(), text_surface.get_height(),
                 GL_RGBA, GL_UNSIGNED_BYTE, text_data)
    
    # Render status message if present
    if status_message:
        status_color = (255, 100, 100) if status_is_error else (150, 255, 150)
        status_surface = font.render(status_message, True, status_color)
        status_data = pygame.image.tostring(status_surface, "RGBA", True)
        
        glRasterPos2f(10, WINDOW_HEIGHT - 25)
        glDrawPixels(status_surface.get_width(), status_surface.get_height(),
                     GL_RGBA, GL_UNSIGNED_BYTE, status_data)
    
    # Crosshair
    cx, cy = WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2
    glColor4f(1, 1, 1, 0.5)
    glLineWidth(1.0)
    glBegin(GL_LINES)
    glVertex2f(cx - 10, cy); glVertex2f(cx + 10, cy)
    glVertex2f(cx, cy - 10); glVertex2f(cx, cy + 10)
    glEnd()
    
    glEnable(GL_DEPTH_TEST)
    
    pygame.display.flip()


def submit_command(command_text):
    """Submit command to LLM."""
    global status_message, status_is_error
    
    if llm_controller is None:
        status_message = "LLM not initialized"
        status_is_error = True
        return
    
    if llm_controller.is_processing:
        status_message = "Still processing..."
        status_is_error = True
        return
    
    status_message = "Processing..."
    status_is_error = False
    
    world_json = world_state.to_json()
    llm_controller.process_command(command_text, world_json, on_llm_response)


def on_llm_response(response):
    """Handle LLM response."""
    global status_message, status_is_error, animation_manager
    
    if not response.success:
        status_message = response.error_message or "Unknown error"
        status_is_error = True
        return
    
    # Handle creations first
    created_ids = []
    if response.creations:
        created_ids = world_state.apply_creations(response.creations)
        # Start spawn/movement animations for new objects
        if animation_manager:
            for obj_id in created_ids:
                obj = world_state.get_object(obj_id)
                if obj:
                    # Check if object has multi-step movement
                    if obj.initial_position:
                        # Animate from initial_position to position (movement animation)
                        animation_manager.start_animation(
                            obj_id,
                            start_pos=list(obj.initial_position),
                            end_pos=list(obj.position),
                            start_rot=list(obj.rotation),
                            end_rot=list(obj.rotation),
                            start_scale=list(obj.scale),
                            end_scale=list(obj.scale),
                            duration=obj.movement_duration
                        )
                    else:
                        # Simple spawn animation (scale up quickly)
                        animation_manager.start_animation(
                            obj_id,
                            start_pos=list(obj.position),
                            end_pos=list(obj.position),
                            start_rot=list(obj.rotation),
                            end_rot=list(obj.rotation),
                            start_scale=[0.01, 0.01, 0.01],
                            end_scale=list(obj.scale),
                            duration=0.5  # Quick spawn
                        )
    
    # Track old positions, rotations, and scales before applying modifications
    old_positions = {}
    old_rotations = {}
    old_scales = {}
    
    for mod in response.modifications:
        obj_id = mod.get("id")
        obj = world_state.get_object(obj_id)
        if obj:
            changes = mod.get("changes", {})
            if "position" in changes:
                old_positions[obj_id] = list(obj.position)
            if "rotation" in changes:
                old_rotations[obj_id] = list(obj.rotation)
            if "scale" in changes:
                old_scales[obj_id] = list(obj.scale)
    
    # Apply modifications to world state
    modified_ids = world_state.apply_modifications(response.modifications)
    
    # Start animations for property changes
    if animation_manager:
        for obj_id in modified_ids:
            obj = world_state.get_object(obj_id)
            if obj:
                # Check what changed and start appropriate animations
                has_pos = obj_id in old_positions
                has_rot = obj_id in old_rotations
                has_scale = obj_id in old_scales
                
                if has_pos or has_rot or has_scale:
                    animation_manager.start_animation(
                        obj_id,
                        start_pos=old_positions.get(obj_id, list(obj.position)),
                        end_pos=list(obj.position),
                        start_rot=old_rotations.get(obj_id, list(obj.rotation)),
                        end_rot=list(obj.rotation),
                        start_scale=old_scales.get(obj_id, list(obj.scale)),
                        end_scale=list(obj.scale),
                        duration=1.0
                    )
    
    # Update status message
    messages = []
    if created_ids:
        messages.append(f"Created: {', '.join(created_ids)}")
    if modified_ids:
        messages.append(f"Modified: {', '.join(modified_ids)}")
    
    if messages:
        status_message = " | ".join(messages)
        status_is_error = False
    else:
        status_message = "No changes made"
        status_is_error = False


def main():
    global world_state, llm_controller, animation_manager, text_input_active, text_input_buffer
    global player_pos, player_yaw, player_pitch, clock, status_message, status_is_error
    
    # Initialize pygame
    pygame.init()
    pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT), DOUBLEBUF | OPENGL)
    pygame.display.set_caption("3D Text World")
    pygame.mouse.set_visible(False)
    pygame.event.set_grab(True)
    
    clock = pygame.time.Clock()
    
    # OpenGL setup
    glEnable(GL_DEPTH_TEST)
    glEnable(GL_BLEND)
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA)
    
    # Initialize world
    world_state = create_initial_scene()
    
    # Initialize animation manager
    animation_manager = AnimationManager()
    
    # Initialize LLM
    try:
        llm_controller = LLMController()
        print("LLM controller initialized")
    except ValueError as e:
        print(f"Warning: {e}")
        print("LLM features disabled")
    
    print("Starting game...")
    print("  WASD - Move")
    print("  Mouse - Look around")
    print("  / - Open command input")
    print("  Enter - Submit command")
    print("  Escape - Quit")
    
    running = True
    keys_pressed = set()
    
    while running:
        dt = clock.tick(60) / 1000.0
        
        # Update animations
        if animation_manager:
            animation_manager.update(dt)
        
        # Event handling
        for event in pygame.event.get():
            if event.type == QUIT:
                running = False
            
            elif event.type == KEYDOWN:
                if event.key == K_ESCAPE:
                    if text_input_active:
                        text_input_active = False
                        text_input_buffer = ""
                        pygame.event.set_grab(True)
                        pygame.mouse.set_visible(False)
                    else:
                        running = False
                
                elif event.key == K_SLASH and not text_input_active:
                    text_input_active = True
                    text_input_buffer = ""
                    pygame.event.set_grab(False)
                    pygame.mouse.set_visible(True)
                
                elif event.key == K_RETURN:
                    if text_input_active:
                        # Submit command if text input is active
                        if text_input_buffer.strip():
                            submit_command(text_input_buffer.strip())
                        text_input_active = False
                        text_input_buffer = ""
                        pygame.event.set_grab(True)
                        pygame.mouse.set_visible(False)
                    else:
                        # Open text input if not active
                        text_input_active = True
                        text_input_buffer = ""
                        pygame.event.set_grab(False)
                        pygame.mouse.set_visible(True)
                
                elif event.key == K_BACKSPACE and text_input_active:
                    text_input_buffer = text_input_buffer[:-1]
                
                elif text_input_active and event.unicode and event.unicode.isprintable():
                    text_input_buffer += event.unicode
                
                else:
                    keys_pressed.add(event.key)
            
            elif event.type == KEYUP:
                keys_pressed.discard(event.key)
            
            elif event.type == MOUSEMOTION and not text_input_active:
                dx, dy = event.rel
                player_yaw -= dx * mouse_sensitivity  # Changed from += to -=
                player_pitch -= dy * mouse_sensitivity
                player_pitch = max(-89, min(89, player_pitch))
        
        # Movement
        if not text_input_active:
            forward_x = math.sin(math.radians(player_yaw))
            forward_z = math.cos(math.radians(player_yaw))
            right_x = math.cos(math.radians(player_yaw))
            right_z = -math.sin(math.radians(player_yaw))
            
            move_x, move_z = 0, 0
            
            if K_w in keys_pressed:
                move_x -= forward_x
                move_z -= forward_z
            if K_s in keys_pressed:
                move_x += forward_x
                move_z += forward_z
            if K_a in keys_pressed:
                move_x -= right_x
                move_z -= right_z
            if K_d in keys_pressed:
                move_x += right_x
                move_z += right_z
            
            length = math.sqrt(move_x**2 + move_z**2)
            if length > 0:
                move_x /= length
                move_z /= length
                player_pos[0] += move_x * move_speed * dt
                player_pos[2] += move_z * move_speed * dt
        
        # Render
        draw_frame()
    
    pygame.quit()


if __name__ == "__main__":
    main()
