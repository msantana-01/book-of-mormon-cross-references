import subprocess
import os
import time

chrome_exe = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
os.makedirs('docs/screenshots', exist_ok=True)

targets = [
    ('docs/screenshots/dual-view.png', 'http://localhost:5173/'),
    ('docs/screenshots/radial-view.png', 'http://localhost:5173/?view=radial'),
    ('docs/screenshots/zoomed-book.png', 'http://localhost:5173/?book=2')
]

for out_file, url in targets:
    abs_out = os.path.abspath(out_file)
    cmd = [
        chrome_exe,
        '--headless=new',
        '--disable-gpu',
        '--window-size=1360,950',
        '--virtual-time-budget=2000',
        f'--screenshot={abs_out}',
        url
    ]
    print(f"Capturing {out_file} from {url}...")
    subprocess.run(cmd, capture_output=True, timeout=15)
    if os.path.exists(abs_out):
        print(f"  Saved: {abs_out} ({os.path.getsize(abs_out)} bytes)")
    else:
        print(f"  Failed to save: {abs_out}")

print("Screenshot capture complete!")
