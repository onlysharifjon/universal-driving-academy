"""Create the static, spherical Earth fallback from the NASA map.

This is an asset renderer, not a browser screenshot. Its projection and lighting
mirror the WebGL shader so non-WebGL visitors still see a real spherical Earth.
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'dist' / 'assets'
texture = np.asarray(Image.open(ASSETS / 'earth-blue-marble.jpg').convert('RGB'), dtype=np.float32) / 255
size = 720
y, x = np.mgrid[0:size, 0:size].astype(np.float32)
px = ((x + .5) / size * 2 - 1) * 1.22
py = (1 - (y + .5) / size * 2) * 1.22
radius = np.sqrt(px * px + py * py)
z = np.sqrt(np.maximum(0, 1 - radius * radius))
n = np.stack([px, py, z], axis=-1)
mx = .93358 * px - .35837 * py
my = .35837 * px + .93358 * py
mz = z
my, mz = .98723 * my + .15932 * mz, -.15932 * my + .98723 * mz
angle = .62
mx, mz = np.cos(angle) * mx + np.sin(angle) * mz, -np.sin(angle) * mx + np.cos(angle) * mz
u = (.5 + np.arctan2(mx, mz) / (2 * np.pi)) % 1
v = .5 - np.arcsin(np.clip(my, -1, 1)) / np.pi
th, tw = texture.shape[:2]
tx, ty = u * (tw - 1), np.clip(v, 0, 1) * (th - 1)
x0, y0 = tx.astype(int), ty.astype(int)
x1, y1 = (x0 + 1) % tw, np.minimum(y0 + 1, th - 1)
fx, fy = (tx-x0)[...,None], (ty-y0)[...,None]
surface = (texture[y0,x0] * (1-fx) + texture[y0,x1] * fx) * (1-fy) + (texture[y1,x0] * (1-fx) + texture[y1,x1] * fx) * fy
light = np.array([-.65,.5,.95]); light /= np.linalg.norm(light)
daylight = np.maximum(0, n @ light)
color = surface ** 2.2 * (.11 + 1.04 * daylight[...,None])
def smoothstep(a,b,t):
    t = np.clip((t-a)/(b-a),0,1)
    return t*t*(3-2*t)
ocean = smoothstep(.025,.18,surface[...,2]-np.maximum(surface[...,0],surface[...,1]))
halfway = light + [0,0,1]; halfway /= np.linalg.norm(halfway)
spec = np.maximum(n @ halfway, 0)**42 * ocean * .2
color += spec[...,None] * [.42,.66,1.0]
rim = (1-z)**3.5 * (.24 + .45*daylight)
color += rim[...,None] * [.035,.16,.38]
color = np.maximum(color,0)**(1/2.2)
edge = 1-smoothstep(1-3.66/size,1,radius)
atmosphere = np.array([.22,.57,.96])
color = atmosphere * (1-edge[...,None]) + color * edge[...,None]
alpha = np.where(radius <= 1, np.maximum(edge,.26), .26*np.exp(-(radius-1)*28))
rgba = np.dstack([np.clip(color,0,1),np.clip(alpha,0,1)])
Image.fromarray((rgba*255).astype(np.uint8)).save(ASSETS/'earth-fallback.webp',quality=91)
print('Generated earth-fallback.webp: 720 x 720, transparent spherical rendering.')
