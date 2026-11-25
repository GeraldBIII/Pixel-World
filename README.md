# Emberwild

A fantasy open-world pixel-art RPG in true 3D that runs in the browser, solo or two-player split screen. One `index.html`, no build step; it loads [three.js](https://threejs.org) from a CDN.

## Play

Open `index.html` in a browser, or turn on GitHub Pages (Settings → Pages → deploy from the `main` branch, root folder) to play it at `https://geraldbiii.github.io/Pixel-World/`.

## Controls

| Action | Keys |
| --- | --- |
| Walk forward / back | W S / ↑ ↓ |
| Turn | A D / ← → |
| Sprint (uses stamina) | Shift |
| Dodge roll: forward, back (hold back), or sideways (hold only a turn key); you can't be hit mid-roll | Space |
| Attack | Left click |
| Talk, trade, enter buildings, search, open chests | E / Enter |
| Drink potion | Q |
| Bag (inventory): point at an item for its stats, click gear to equip it, right-click for more options | I |
| Character sheet | C |
| World map | M |
| Close a menu | Esc |
| Toggle sound | N |
| Turn (drag sideways) and look up or down; the camera stays locked behind you | Right-drag |
| Zoom | Scroll wheel |
| Reset camera | R |
| Fullscreen | F |
| God mode (for testing) | G |

On touch screens a joystick and buttons appear automatically (Run toggles sprinting, Roll dodges); drag the screen to turn and look up or down, and pinch to zoom. The ⛶ button goes fullscreen. The camera is locked behind your hero. The Camera panel under the game sets tilt, zoom and view distance. View distance is Auto by default: it grows as far as your device can draw while holding a smooth frame rate.

## Xbox controller and split screen

Any standard controller (Xbox, or others the browser maps the same way) works:

| Action | Button |
| --- | --- |
| Walk / turn | Left stick or D-pad |
| Turn (sideways) and look up or down | Right stick |
| Attack | X or RT |
| Dodge roll | B |
| Talk, trade, open, search | A |
| Potion | Y |
| Sprint | LT, LB or click the left stick |
| Bag / map / character sheet | Menu / View / RB |
| Menus | D-pad to move, A to choose (A on gear equips it), X for item options, B to back out, LB/RB for tabs |

Press **Menu** on a second controller (or use **Add player 2** under the game) to start two-player split screen. The screen splits side by side on wide screens and top/bottom on tall ones. Split screen always fills the whole screen, including in fullscreen. Each player has their own hero, bag, gold, bounty, camera and menus: a menu opens over that player's half of the screen and only pauses that player, while the other keeps playing. The world, quests and time of day are shared.

## Features

- **A Skyrim-sized island**: 4096 × 4096 tiles with real elevation, a mountain spine with snowy peaks and cliffs, river networks and lakes
- **Natural biomes** set by climate: tundra and snow forests in the cold north, pine forests, woodland, plains, marshes, southern deserts, volcanic ashlands, highlands and mountains, each with its own ground, plants and monsters
- **Six walled towns** (Emberhold, the capital, plus five more named for their climate), each laid out to suit the land, linked by roads that wind around hills and rivers. Roads also lead to the three shrines
- **Over a hundred dungeons**: caves in the hills and barrows on the plains, with rooms, corridors, torches, monsters, treasure chests and a guardian with a hoard. Cleared dungeons stay cleared for three days
- **A hidden power level (PL) from 1 to 100** behind every fight: the land gets more dangerous the farther you travel from Emberhold and the harsher the biome. Monster health, damage, XP and the quality of loot all follow PL. Guards are PL 75. Your own PL comes from your gear, level and attributes. God mode shows the numbers
- **Monsters in their own biomes**: slimes, ember slimes, skeletons, ghosts, wolf packs, goblins, giant spiders, bears, trolls, scorpions, bandits on the roads and draugr in the barrows
- **God mode** for playtesting: invincible, fast (very fast when sprinting), walks through anything outdoors, one-hit kills, infinite stamina, shows power levels, and teleports by clicking the world map
- **Two-player split screen** with Xbox controller support, and controller navigation for every menu
- **Mobile friendly**: virtual joystick, touch camera and pinch zoom, and a fullscreen mode
- **Lively towns**: crates, barrels, hay bales, carts, benches, woodpiles, flower pots and wells, plus cats, dogs and chickens (you can pet them)
- Every building can be entered, furnished, and searched; taking things is theft if anyone sees you
- Townsfolk with daily routines, guards on day and night shifts at the gates, on the walls and in the streets
- Attack townsfolk and the guards fight back; children always outrun you; pay bounties to any guard
- Sprinting with stamina; Strength, Dexterity, Constitution, Wisdom and Charisma with 3 points to spend each level
- A 30-slot bag (more with Strength), 8 equipment slots and over 50 items with Worn to Legendary qualities
- A character sheet and records: monsters slain by type, miles walked, dungeons entered, items stolen and more
- A north-up minimap and a fog-of-war world map with towns, dungeons and shrines
- Day/night cycle with short nights (about a fifth of each day), lamplight, lit windows and torch-carrying guards. Fewer monsters roam by day; more come out at night
- Quest line from Elder Maren, plus a skeleton and draugr bounty
