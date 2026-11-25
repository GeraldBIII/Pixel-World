# Using your own art in Emberwild

Emberwild draws all of its pixel art in code, but you can swap in sprites and ground tiles from an art pack (or your own drawings) without touching the game's code. Art of any size works: **32×32 art appears at the same size in the world as the built-in 16×16 art, just with twice the detail**, so you can switch styles a piece at a time.

## Quick start

1. Put your image files (PNG) in the `assets/` folder.
2. Copy `assets/art.example.json` to `assets/art.json` and edit it to point at your images.
3. Open the game from a web address: GitHub Pages, or a local server such as `npx serve` run in this folder.

> Opening `index.html` straight from your disk (a `file://` address) will not load the art: browsers block it for security. Use GitHub Pages or a local server, or embed the manifest (see the end of this guide).

When high-detail art is loaded, the **Graphics** option in the pause menu (Esc) switches from *Classic* to *Ultra* by itself (on *Auto*), so the extra detail isn't lost. You can also pick *Classic*, *Sharp* or *Ultra* yourself; higher settings look sharper but draw up to four times as many pixels.

## The manifest: `assets/art.json`

```json
{
  "density": 2,
  "hero":  { "src": "hero.png" },
  "monsters": { "goblin": { "src": "goblin.png", "frames": 2 } },
  "animals":  { "dog": "dog.png" },
  "npcs": {
    "guard":     ["guard_a.png", "guard_b.png"],
    "townsfolk": ["villager1.png", "villager2.png", "villager3.png"]
  },
  "objects": { "chest": "chest.png", "chestOpen": "chest_open.png" },
  "tiles":   { "grass": ["grass1.png", "grass2.png", "grass3.png"], "path": "dirt.png" }
}
```

Every entry can be a file name, or an object with these options:

| Option | Meaning |
| --- | --- |
| `src` | The image file, relative to `assets/` (a full URL or a `data:` URL also works) |
| `frames` | How many animation frames sit side by side in the image (default 2 for characters, 1 for objects) |
| `frameW`, `frameH` | The size of one frame in pixels, if the image has padding or extra rows |
| `density` | Pixels per game unit for this image: **1 for 16×16 art, 2 for 32×32 art**, 3 for 48×48, 4 for 64×64. Defaults to the manifest's top-level `density` (or 2) |

### Hero (`hero`, and `hero2` for player 2)

One sheet with three columns (walk frame 1, walk frame 2, standing) and these rows:

1. facing the camera (down)
2. facing away (up)
3. facing left
4. facing right (optional: if missing, the left row is mirrored)

A 32×32 hero is a 96×96 image (or 96×128 with the right-facing row). Custom hero art replaces the built-in hero, so worn armor no longer changes its look.

### Monsters (`monsters`)

`slime`, `redslime`, `skeleton`, `ghost`, `wolf`, `goblin`, `spider`, `bear`, `troll`, `scorpion`, `bandit`, `draugr`. Each is a strip of walking frames (2 by default).

### Animals (`animals`)

`cat`, `dog`, `chicken`. A strip of frames (2 by default).

### People (`npcs`)

Each key takes one image or a list of images (each a strip of 2 frames). Townsfolk pick one of the list, so give several for variety. The most specific key wins:

| Key | Who |
| --- | --- |
| `townsfolk` | Anyone without a more specific entry |
| `villager`, `kid`, `elder` | Townsfolk, children, Elder Maren |
| `guard` | Town guards (also used by road wardens and caravan guards if they have no entry) |
| `patrol`, `caravanguard` | Road wardens; caravan guards |
| `trader` | Caravan traders |
| `settler`, `elf` | Homesteaders; the elves of the Elderwood |
| `shop`, `shop.smith`, `shop.armor`, `shop.potion`, `shop.trade`, `shop.inn`, `shop.temple` | Shopkeepers, in general or by shop |

### Objects (`objects`)

Sprites still drawn as flat pictures: `chest`, `chestOpen`, `shrine`, `shrineOn`, `cave`, `barrow` (dungeon entrances), `coin`, `heart`, `pot`, `torch`, `zzz`, `spearP`, `wagon`, `horse` (2 frames), `flame` (2 frames), `levi`, `tentacle`, and indoor props `altar`, `anvil`, `books`, `candle`, `jug`, `plant`, `rack`, `sack`, `stand`.

Trees, rocks, barrels, crates, lamps and other outdoor props are solid 3D blocks up close; their sprites (`tree`, `pine`, `spine`, `birch`, `bush`, `boulder`, `cactus`, `deadtree`, …) are only used far away.

### Ground tiles (`tiles`)

`grass`, `forest`, `sand`, `hill`, `rock`, `path`, `plaza`, `street`, `farm`, `snow`, `cliff`, `tundra`, `pine`, `taiga`, `marsh`, `desert`, `ash`, `water`, `deep`, `house`, `townwall`. Give one image or a list of variants; they are drawn into 32×32 cells, so 16×16 or 32×32 tiles both work.

## Without a web server: embedding the manifest

Put the manifest in a script before the game's script in `index.html`, using `data:` URLs for the images:

```html
<script>window.EMBERWILD_ART={density:2,hero:{src:"data:image/png;base64,..."}}</script>
```

## Licenses

Check each pack's license before you publish. CC0 needs no credit; CC-BY needs credit to the artist; CC-BY-SA and GPL require sharing your changes under the same license; some free itch.io packs forbid redistributing the image files.
