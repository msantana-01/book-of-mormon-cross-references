import math
from PIL import Image, ImageDraw

def create_pwa_icon(size, output_path):
    img = Image.new("RGBA", (size, size), (10, 12, 16, 255))
    draw = ImageDraw.Draw(img)

    # Rounded card background
    r = int(size * 0.22)
    # Background subtle border
    draw.rounded_rectangle([2, 2, size - 3, size - 3], radius=r, fill=(15, 23, 42, 255), outline=(245, 158, 11, 100), width=max(1, int(size * 0.01)))

    scale = size / 512.0

    # Arcs
    y_base = int(340 * scale)
    # Arc 1
    bbox1 = [int(80 * scale), int(140 * scale), int(432 * scale), y_base + int(100 * scale)]
    draw.arc(bbox1, start=180, end=0, fill=(56, 189, 248, 200), width=max(2, int(4 * scale)))
    
    # Arc 2
    bbox2 = [int(120 * scale), int(180 * scale), int(392 * scale), y_base + int(80 * scale)]
    draw.arc(bbox2, start=180, end=0, fill=(245, 158, 11, 230), width=max(2, int(4 * scale)))

    # Book pages
    book_x = int(120 * scale)
    book_y = int(220 * scale)
    book_w = int(272 * scale)
    book_h = int(110 * scale)
    cx = size // 2

    # Left page (gold)
    left_poly = [
        (cx - int(4 * scale), book_y + int(10 * scale)),
        (book_x, book_y + int(20 * scale)),
        (book_x, book_y + book_h),
        (cx - int(4 * scale), book_y + book_h - int(10 * scale))
    ]
    draw.polygon(left_poly, fill=(217, 119, 6, 255), outline=(254, 240, 138, 255))

    # Right page (gold)
    right_poly = [
        (cx + int(4 * scale), book_y + int(10 * scale)),
        (book_x + book_w, book_y + int(20 * scale)),
        (book_x + book_w, book_y + book_h),
        (cx + int(4 * scale), book_y + book_h - int(10 * scale))
    ]
    draw.polygon(right_poly, fill=(245, 158, 11, 255), outline=(254, 240, 138, 255))

    # Center spine
    draw.rectangle([cx - int(3 * scale), book_y + int(10 * scale), cx + int(3 * scale), book_y + book_h - int(10 * scale)], fill=(120, 53, 15, 255))

    # Golden star/cross at top
    star_cx = cx
    star_cy = int(95 * scale)
    s_rad = int(18 * scale)
    draw.line([star_cx - s_rad, star_cy, star_cx + s_rad, star_cy], fill=(254, 240, 138, 255), width=max(1, int(3 * scale)))
    draw.line([star_cx, star_cy - s_rad, star_cx, star_cy + s_rad], fill=(254, 240, 138, 255), width=max(1, int(3 * scale)))

    img.save(output_path, "PNG")
    print(f"Generated: {output_path} ({size}x{size})")

if __name__ == "__main__":
    create_pwa_icon(192, "public/icon-192.png")
    create_pwa_icon(512, "public/icon-512.png")
