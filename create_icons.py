from PIL import Image, ImageDraw
import os

# Create assets directory if it doesn't exist
os.makedirs('extension/assets', exist_ok=True)

# Icon sizes needed
sizes = [16, 48, 128]

for size in sizes:
    # Create a new image with a gradient blue background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))  # Transparent background
    draw = ImageDraw.Draw(img)
    
    # Draw a blue circle with gradient effect
    draw.ellipse([0, 0, size-1, size-1], fill=(59, 130, 246, 255))
    
    # Draw a smaller white circle in the center (microphone icon style)
    center_size = size // 3
    center_pos = (size - center_size) // 2
    draw.ellipse([center_pos, center_pos, center_pos + center_size, center_pos + center_size], 
                 fill=(255, 255, 255, 255))
    
    # Draw a tiny blue circle in the center
    dot_size = size // 8
    dot_pos = (size - dot_size) // 2
    draw.ellipse([dot_pos, dot_pos, dot_pos + dot_size, dot_pos + dot_size], 
                 fill=(59, 130, 246, 255))
    
    # Save the icon
    img.save(f'extension/assets/icon-{size}.png')
    print(f'Created icon-{size}.png')

print('All icons created successfully!')