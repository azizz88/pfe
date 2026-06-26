import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Wedge, FancyBboxPatch, Polygon
import numpy as np

fig, ax = plt.subplots(figsize=(16, 6.5))
ax.set_xlim(0, 16)
ax.set_ylim(-0.8, 7)
ax.axis('off')
fig.patch.set_facecolor('white')
ax.set_facecolor('white')

# Professional blue palette
DARK_NAVY  = '#0D1B5E'
DARK_BLUE  = '#1565C0'
MED_BLUE   = '#1E88E5'
LIGHT_MED  = '#5C9CE6'
LIGHT_BLUE = '#90CAF9'
VERY_LIGHT = '#C8DEFA'

# 6 wedge segments (theta1, theta2 CCW from east, matplotlib convention)
SEGS = [
    ('Build',  60, 120, DARK_NAVY),   # top         — darkest
    ('Test',  120, 180, DARK_BLUE),   # upper-left
    ('Review',180, 240, LIGHT_BLUE),  # left
    (None,    240, 300, VERY_LIGHT),  # bottom       — Launch (no donut label)
    ('Plan',  300, 360, LIGHT_MED),   # lower-right
    ('Design',  0,  60, MED_BLUE),    # upper-right
]

SPRINTS = [
    {
        'name': 'Sprint 1',
        'cx': 2.8, 'cy': 4.8,
        'subtitle': 'Authentification &\nGestion des Employés\n& Compétences',
    },
    {
        'name': 'Sprint 2',
        'cx': 8.0, 'cy': 4.8,
        'subtitle': 'Offres Internes,\nCandidatures &\nMatching IA',
    },
    {
        'name': 'Sprint 3',
        'cx': 13.2, 'cy': 4.8,
        'subtitle': 'Entretiens, Formations\n& Recommandations IA',
    },
]

R_OUT = 1.65
R_IN  = 1.02


def draw_donut(ax, cx, cy, name):
    for label, t1, t2, color in SEGS:
        w = Wedge(
            (cx, cy), R_OUT, t1, t2,
            width=R_OUT - R_IN,
            facecolor=color, edgecolor='white', linewidth=2.5, zorder=2,
        )
        ax.add_patch(w)

        if label:
            mid_deg = (t1 + t2) / 2
            mid_rad = np.radians(mid_deg)
            lr = (R_OUT + R_IN) / 2 + 0.04
            lx = cx + lr * np.cos(mid_rad)
            ly = cy + lr * np.sin(mid_rad)
            # Rotate text tangent to arc — always readable
            rot = mid_deg - 90 if (mid_deg % 360) <= 180 else mid_deg + 90
            ax.text(
                lx, ly, label,
                ha='center', va='center',
                fontsize=7.5, color='white', fontweight='bold',
                rotation=rot, zorder=3,
            )

    # White inner disc
    inner = plt.Circle((cx, cy), R_IN - 0.07, facecolor='white', edgecolor='none', zorder=4)
    ax.add_patch(inner)

    # Sprint name centred
    ax.text(
        cx, cy, name,
        ha='center', va='center',
        fontsize=11, fontweight='bold', color=DARK_NAVY, zorder=5,
    )


for s in SPRINTS:
    draw_donut(ax, s['cx'], s['cy'], s['name'])

# ── Connecting bar ─────────────────────────────────────────────────────────
BAR_Y, BAR_H = 2.2, 0.50
X1, X2 = 0.5, 15.0

ax.add_patch(FancyBboxPatch(
    (X1, BAR_Y - BAR_H / 2), X2 - X1, BAR_H,
    boxstyle='round,pad=0.07',
    facecolor=DARK_BLUE, edgecolor='none', zorder=1,
))

# Arrow head
ax.add_patch(Polygon(
    [
        [X2,        BAR_Y + BAR_H / 2 + 0.16],
        [X2 + 0.72, BAR_Y],
        [X2,        BAR_Y - BAR_H / 2 - 0.16],
    ],
    closed=True, facecolor=DARK_BLUE, edgecolor='none', zorder=1,
))

# "Launch" label at each sprint position on the bar
for s in SPRINTS:
    ax.text(
        s['cx'], BAR_Y, 'Launch',
        ha='center', va='center',
        fontsize=8.5, color='white', fontweight='bold', zorder=2,
    )

# ── Sprint subtitles below bar ─────────────────────────────────────────────
for s in SPRINTS:
    ax.text(
        s['cx'], 1.62, s['subtitle'],
        ha='center', va='top',
        fontsize=9.5, color=DARK_NAVY, fontweight='bold',
        multialignment='center', linespacing=1.55,
    )

out = r'C:\Users\MSI\Desktop\keycloak\docs\sprint_diagram.png'
fig.savefig(out, dpi=200, bbox_inches='tight', facecolor='white', edgecolor='none')
print(f'Saved → {out}')
