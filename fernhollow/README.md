# Fernhollow

A fantasy farming game in 2D top-down pixel art. You inherit your grandmother's overgrown farm in a fae-touched hollow. Clear the land, grow magical crops, befriend the villagers, and explore the woods and hills around you.

Plain HTML, CSS and JavaScript. No build step and no downloads. All art and sound are generated in code.

## Play

- **On your computer:** open `fernhollow/index.html` in a browser. It works straight from the file.
- **On the web:** turn on GitHub Pages for this repo and go to `https://<user>.github.io/Pixel-World/fernhollow/`.

Progress saves in the browser automatically each night when you sleep, and whenever you pick **Save Game** in the pause menu.

## Controls

| Action | Keyboard & mouse | Xbox controller | Touch |
| --- | --- | --- | --- |
| Move | WASD / arrows | Left stick / D-pad | Drag on the left side |
| Sprint | Hold Shift | Click left stick (toggle) | Push the stick to the edge |
| Attack (hold to repeat) | F | RT | **Attack** |
| Block (needs a shield) | Hold Q | Hold LT | Hold **Block** |
| Dive roll | R | B | **Roll** |
| Use tool or item (hold to repeat) | Space, J, left-click | X | **Use** |
| Talk, harvest, open, ship | E, Enter, right-click | A | **Act** |
| Change item | 1–9, 0, −, =, wheel, [ ] | LB / RB | Tap a hotbar slot |
| Inventory / Hero sheet | I or Tab / C | Y | **Bag** |
| Map | M | View | **Map** |
| Pause | Esc or P | Menu | ❚❚ |
| Menus | Arrows, Enter, Esc | D-pad, A, B, LB/RB for tabs | Tap |

Touch controls appear automatically on phones and hide when a controller or keyboard is used. You can force them on or off in Settings. Landscape is best, but portrait works too.

## The pause menu

Resume, Inventory, Map, Save Game, Settings (music and sound volume, camera zoom, touch controls, vibration, clock format, target highlight, fullscreen), Controls, **Unstuck** (move to the nearest open spot or back to your farmhouse), Quit to Title, and **Exit Game**.

Browsers only let a page close its own tab in some cases. When they don't, Exit Game saves and shows a "you can close this tab" screen.

## What's in it

- A 320×312-tile world built from a hand-drawn map (`MAP_REF` in `js/world.js`; `PXS` sets the scale):
  - **North:** sheer cliffs, with Moonfall, the waterfall where the river begins.
  - **West:** more cliffs. **East:** a dense, impassable forest. **South:** the sea.
  - **Your farm:** sits between the river's two arms, with a bridge on each side.
  - **Fernhollow:** the town, on the west coast, with the Whispering Woods and the Moonwell to its north.
  - **Sunny Meadow:** a peninsula south of town, joined to Fairy Isle by a bridge.
  - **The Wolfwood:** a forest east of your farm, where wolves hunt and ore and crystal rocks are most common.
- Farming: till, plant, water, harvest. Six fantasy crops, each with its own seasons (one regrows)
- Four 14-day seasons with their own colours, rain and snow, and a day/night cycle with lanterns and glowing crops
- Tools: hoe, watering can, axe, pickaxe and sword. Energy and health
- The Market Crate sells goods overnight. Three shops, plus upgrades (bigger backpack, copper watering can)
- Crafting: fences, lanterns, sprinklers, stew and tonics
- Five villagers with daily dialogue, gifts and friendship hearts
- A chain of tasks from Elder Oswin with rewards
- RPG systems:
  - **Stamina:** a bar for sprinting, attacking, blocking and dive rolls. Roads, paths and bridges make you 25% faster.
  - **Levels:** you earn XP from fighting, farming, chopping, mining, foraging, crafting and tasks. Each level gives 3 points for Strength, Vitality, Agility or Endurance.
  - **Hero sheet:** shows your level, attributes and stats, plus six equipment slots (Weapon, Shield, Head, Body, Feet, Trinket).
  - **Gear:** 5 weapons, 3 shields, 9 armor pieces and 3 trinkets, bought from Bram and Mirabel or crafted. Equipped armor, helmets, boots and shields show on your hero.
  - **Blocking:** a raised shield stops most of a hit, but costs stamina. The dive roll makes you briefly untouchable.
- **Moonfall Depths:** a tiered dungeon. The entrance is a cave in the cliff beside the waterfall.
  - Every visit generates fresh floors with rooms, rocks, gem and darksteel ores, treasure chests and stairs down.
  - Floor 1 and every 5th floor have an escape ladder, and every 5th floor also has Grimble's shop. Reaching a 5th floor unlocks it as a starting point.
  - Slimes, bats, bone-throwing skeletons and goblins change color and gear every 5 floors and get stronger as you go down.
  - Monster loot (bones, bat wings, goblin teeth, gems, darksteel and relics) feeds new crafting recipes. Each shopkeeper buys what fits their trade.
- **Hidden power level (1–100):** `powerLevel()` in `js/dungeon.js` rates the hero's damage and toughness. Floors use the same scale for their monsters (`floorPower`). It's only shown with a playtesting option on.
- **Playtesting:** Settings → Playtesting has God mode (no damage; energy, stamina and water never run out) and one-hit kills. The **Playtest Chest** beside the farmhouse hands out every item in the game. It reads the item list directly, so new items appear automatically. It also has +gold, +level, heal and skip-to-night buttons.
- Slimes in the Whispering Woods, wolves in the Wolfwood, and wisps at night (the farm and village are safe)
- Grass tufts and small sticks can be walked over, and still cut or chopped for fiber and wood

## Custom sprites

Replace any built-in art with your own PNGs. You don't need to write code:

1. Copy a template from `assets/templates/`.
2. Edit it in your pixel editor.
3. Save it into `assets/`.
4. Add one line to `assets/sprites.js`.

`assets/README.md` lists every sprite name and size.

## Code layout

| File | What it does |
| --- | --- |
| `js/data.js` | Crops, items, recipes, villagers, shops, tasks and settings. Start here to tweak the game |
| `js/sprites.js` | All built-in pixel art, drawn in code |
| `js/assets.js` + `assets/sprites.js` | Loads your custom PNGs over the built-in art |
| `js/world.js` | Map generation, regions, buildings and daily respawns |
| `js/game.js` | Player, tools, farming, NPCs, enemies, the day cycle, saving and rendering |
| `js/ui.js` | Menus, HUD, inventory, shops and dialogue, with controller/keyboard navigation |
| `js/input.js` | Keyboard, mouse, touch and gamepad input |
| `js/audio.js` | Synthesized sound effects and music |
| `js/main.js` | Startup, screen scaling and the main loop |
