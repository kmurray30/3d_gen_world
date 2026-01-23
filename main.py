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


def draw_3d_text(text, position, text_scale=2.0):
    """
    Draw billboarded text in 3D space that always faces the camera.
    The text appears as a floating label at the given 3D position.
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
    
    # Calculate quad size based on text dimensions and scale
    aspect_ratio = text_width / text_height
    quad_height = text_scale * 0.1  # Base size in world units
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
    
    # Draw world objects as floating 3D text
    if world_state:
        for obj in world_state.get_all_objects():
            pos = list(obj.position)
            pos[1] += obj.properties.height_offset
            # Replace cube rendering with 3D text
            draw_3d_text(obj.description, pos, text_scale=2.0)
    
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
    global status_message, status_is_error
    
    if not response.success:
        status_message = response.error_message or "Unknown error"
        status_is_error = True
        return
    
    if not response.modifications:
        status_message = "No changes made"
        status_is_error = False
        return
    
    modified_ids = world_state.apply_modifications(response.modifications)
    
    if modified_ids:
        status_message = f"Modified: {', '.join(modified_ids)}"
        status_is_error = False
    else:
        status_message = "No valid objects modified"
        status_is_error = False


def main():
    global world_state, llm_controller, text_input_active, text_input_buffer
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
                
                elif event.key == K_RETURN and text_input_active:
                    if text_input_buffer.strip():
                        submit_command(text_input_buffer.strip())
                    text_input_active = False
                    text_input_buffer = ""
                    pygame.event.set_grab(True)
                    pygame.mouse.set_visible(False)
                
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
