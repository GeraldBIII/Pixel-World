# Emberwild

A fantasy open-world pixel-art RPG with a top-down, Octopath-style diorama view (2D pixel characters in a 3D world) that runs in the browser, solo or two-player split screen. One `index.html`, no build step; it loads [three.js](https://threejs.org) from a CDN.

## Play

Open `index.html` in a browser, or turn on GitHub Pages (Settings → Pages → deploy from the `main` branch, root folder) to play it at `https://geraldbiii.github.io/Pixel-World/`.

## Controls

| Action | Keys |
| --- | --- |
| Walk (up, down, left, right and diagonals, relative to the screen) | W A S D / arrow keys |
| Sprint (uses stamina) | Shift |
| Dodge roll: forward, back (hold back), or sideways (hold only a turn key); you can't be hit mid-roll | Space |
| Attack (swings toward the mouse cursor) | Left click |
| Talk, trade, enter buildings, search, open chests | E / Enter |
| Drink potion | Q |
| Bag (inventory): point at an item for its stats, click gear to equip it, right-click for more options | I |
| Character sheet | C |
| World map | M |
| Pause menu: resume, Unstuck me, camera, sound, god mode, fullscreen, player 2, save, Save & exit (closes a menu if one is open) | Esc |
| Toggle sound | N |
| Tilt the camera (it always faces north) | Right-drag up or down |
| Zoom | Scroll wheel |
| Reset camera | R |
| Fullscreen | F |
| God mode (for testing) | G |
| Fly (god mode only): Space climbs, X descends, V again to land | V |

On touch screens a joystick and buttons appear automatically (Run toggles sprinting, Roll dodges); drag the screen up or down to tilt the camera, and pinch to zoom. The ⛶ button goes fullscreen. The view is a fixed diorama in the style of Octopath Traveler: the camera hangs high to the south and always faces north (indoors it looks into the room from the doorway), with tilt-shift blur at the top and bottom of the screen, a soft vignette and warm light. Turn off the blur and vignette with **Diorama effects** in the pause menu. Whenever a wall, roof or tree comes between the camera and your hero, a large see-through circle (about three quarters of the screen's height) opens around the hero so you can always see yourself. People and animals never fade out. If your hero ever gets stuck, open the pause menu (Esc, the Menu button, or Menu on a controller) and choose **Unstuck me**. The Camera panel under the game sets tilt, zoom and view distance. View distance is Auto by default: it grows as far as your device can draw while holding a smooth frame rate.

## Xbox controller and split screen

Any standard controller (Xbox, or others the browser maps the same way) works:

| Action | Button |
| --- | --- |
| Walk | Left stick or D-pad (while flying in god mode, D-pad up/down climbs and descends) |
| Tilt the camera | Right stick (up/down) |
| Attack | X or RT |
| Dodge roll | B |
| Talk, trade, open, search | A |
| Potion | Y |
| Sprint | LT, LB or click the left stick |
| Pause menu (with Bag, Hero, Records and Map tabs; LB/RB switch tabs) / map / character sheet | Menu / View / RB |
| Menus | D-pad to move, A to choose (A on gear equips it), X for item options, B to back out, LB/RB for tabs |

Press **Menu** on a second controller (or use **Add player 2** under the game) to start two-player split screen. The screen splits side by side on wide screens and top/bottom on tall ones. Split screen always fills the whole screen, including in fullscreen. Each player has their own hero, bag, gold, bounty, camera and menus: a menu opens over that player's half of the screen and only pauses that player, while the other keeps playing. The world, quests and time of day are shared.

## Your own art

The game ships with a CC0 art pack built from the Dungeon Crawl Stone Soup 32×32 tiles (monsters, townsfolk, item icons, grass and dirt; see `assets/CREDITS.md`). It loads when the game is served from a web address such as GitHub Pages; opened straight from disk, the game uses its built-in art. You can swap in sprites and ground tiles from any other art pack, including 32×32 art, which shows at the same size in the world with twice the detail. Put the images in `assets/` and list them in `assets/art.json`; see [ART.md](ART.md) for the format. The **Graphics** option in the pause menu (Auto, Classic, Sharp, Ultra) sets how sharply the 3D view is drawn; Auto switches to Ultra when detailed art is loaded.

## Features

- **A Skyrim-sized island**: 4096 × 4096 tiles with real elevation, a mountain spine with snowy peaks and cliffs, river networks and lakes
- **Natural biomes** set by climate: tundra and snow forests in the cold north, pine forests, woodland, plains, marshes, southern deserts, volcanic ashlands, highlands and mountains, each with its own ground, plants and monsters
- **Six walled towns** (Emberhold, the capital, plus five more named for their climate), each laid out to suit the land, linked by roads that wind around hills and rivers. Roads also lead to the three shrines
- **Over a hundred dungeons**: caves in the hills and barrows on the plains, with rooms, corridors, torches, monsters, treasure chests and a guardian with a hoard. Cleared dungeons stay cleared for three days
- **A hidden power level (PL) from 1 to 100** behind every fight: the land gets more dangerous the farther you travel from Emberhold and the harsher the biome. Monster health, damage, XP and the quality of loot all follow PL. Guards are PL 75. Your own PL comes from your gear, level and attributes. God mode shows the numbers
- **Monsters in their own biomes**: slimes, ember slimes, skeletons, ghosts, wolf packs, goblins, giant spiders, bears, trolls, scorpions, bandits on the roads and draugr in the barrows
- **God mode** for playtesting: invincible, fast (very fast when sprinting), walks through anything outdoors, one-hit kills, infinite stamina, shows power levels, teleports by clicking the world map, and can fly (V, or Fly in the pause menu)
- **Two-player split screen** with Xbox controller support, and controller navigation for every menu
- **Realistic proportions**: houses stand about four to five times your height under steep roofs, trees are 8–10 m tall, lampposts about twice your height, and barrels and crates waist high
- **A solid 3D pixel world**: trees, rocks, hedges, fences, wells, stalls, carts, barrels and crates are built from pixel-textured blocks fixed in the world, so they no longer turn to face the camera. Every tree is its own size, some woods turn autumn-orange, and meadows drift between lush green, golden and russet patches carpeted with grass tufts and wildflowers. Far away, objects switch to lighter sprites to keep the frame rate up
- **Houses with character**: fewer, more varied town houses, from one-room cottages and narrow three-storey townhouses to long halls and large family homes, with jettied upper floors, timber framing, shutters, porches, dormers, and gabled, cross-gabled or hipped roofs
- **Rooms inside**: bigger buildings are divided into rooms joined by doorways: halls, kitchens with hearths, bedrooms, dining rooms, studies, storerooms behind the shops, guest rooms at the inn and an armory in the guardhouse
- **Manors with their own grounds**: every town has a manor (the capital has two) outside its walls, with a hedged garden, lamplit drive, columned porch and corner towers. The lord or lady and their steward live there. Manor chests and strongboxes hold richer loot, and the doors are locked at night
- **Farmsteads**: fenced farms around each town, each with a farmhouse, a big red barn you can enter, crop fields, hay and chickens, and a farming family working the land
- **Highways between the towns**: cobbled roads lined with lampposts on alternating sides, crossing rivers on arched stone bridges with parapets and lamps at each end
- **Road wardens and trader caravans**: pairs of wardens patrol every highway from town to town. Four traders drive covered wagons between the towns with two guards each; a caravan camps outside a town's gates for part of a day selling a fresh stock of gear, potions and gems, then sets off for the next town. Wardens and caravan guards (PL 75) fight off monsters, and go after anyone with a bounty
- **Swimming**: wade or swim into any river, lake or the sea (slowly, and you can't sprint, roll or fight while swimming). Swim too far from the island and the water turns black: turn back quickly, or a leviathan rises from the deep and drags you under
- **Terraced uplands and cliffs**: hills and highlands step up in grassy plateaus walled by layered stone cliffs, with winding dirt trails that climb through them, so there is always a way up
- **Places worth finding** between the towns, each marked on your map once discovered (and greyed out once cleared):
  - **Goblin camps** behind sharpened palisades, with hide tents, a campfire, totems and a treasure chest, guarded by a pack of goblins
  - **Goblin warrens**: big fortified villages with huts and a goblin chief, and two chests
  - **Graveyards** with tombstones behind a wooden fence, haunted by skeletons, and by ghosts after dark
  - **Ruins** of old stone halls with broken walls and pillars, held by skeletons, bandits, spiders or scorpions depending on the land
  - **Bandit hideouts** with tents and stolen supplies
  - **Standing stones**: rune-carved circles around an altar. Touch it for three minutes of extra strength and warding (once a day per circle)
  - **Wayshrines** beside the highways: pray to heal fully and save your game
  - Clear a camp, warren, graveyard, ruin or hideout to earn bonus experience; its monsters return after three days
- **The Elderwoods**: two vast forests of giant trees (the Elderwood and Silverleaf Grove), some with treehouses in their branches, glowing blue mushrooms and fairies. Greet a fairy for a blessing that heals you (once a day each). At the heart of each wood is an elven village with elves to talk to and an elven merchant selling potions, charms and gems
- **Homesteads in the wilds**: log cabins scattered across the island far from any town, each with a garden, a woodpile and one or two settlers who tend their clearing by day and bar the door at night
- **Mobile friendly**: virtual joystick, touch camera and pinch zoom, and a fullscreen mode
- **Lively towns**: crates, barrels, hay bales, carts, benches, woodpiles, flower pots and wells, plus cats, dogs and chickens (you can pet them)
- Every building can be entered, furnished, and searched; taking things is theft if anyone sees you
- A pause menu with game options, an Unstuck button and Save & exit to the title screen
- Townsfolk with daily routines, guards on day and night shifts at the gates, on the walls and in the streets
- Attack townsfolk and the guards fight back; children always outrun you; pay bounties to any guard
- Sprinting and a dodge roll you can't be hit during, both using stamina; Strength, Dexterity, Constitution, Wisdom and Charisma with 3 points to spend each level
- A 30-slot bag (more with Strength), 8 equipment slots and over 50 items with Worn to Legendary qualities
- A character sheet and records: monsters slain by type, miles walked, dungeons entered, items stolen and more
- A north-up minimap and a fog-of-war world map with towns, dungeons and shrines
- Day/night cycle with short nights (about a fifth of each day), lamplight, lit windows and torch-carrying guards. Fewer monsters roam by day; more come out at night
- Quest line from Elder Maren, plus a skeleton and draugr bounty
