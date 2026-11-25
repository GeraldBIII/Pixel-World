# Emberwild

A fantasy open-world pixel-art RPG in true 3D that runs in the browser. One `index.html`, no build step; it loads [three.js](https://threejs.org) from a CDN.

## Play

Open `index.html` in a browser, or turn on GitHub Pages (Settings → Pages → deploy from the `main` branch, root folder) to play it at `https://geraldbiii.github.io/Pixel-World/`.

## Controls

| Action | Keys |
| --- | --- |
| Walk forward / back | W S / ↑ ↓ |
| Turn | A D / ← → |
| Sprint (uses stamina) | Shift |
| Attack | Left click |
| Talk, trade, enter buildings, search, open chests | E / Enter |
| Drink potion | Q |
| Bag (inventory) | I |
| Character sheet | C |
| World map | M |
| Close a menu | Esc |
| Toggle sound | N |
| Orbit and tilt camera | Right-drag |
| Zoom | Scroll wheel |
| Reset camera | R |

On touch screens, on-screen buttons appear automatically (Run toggles sprinting). The Camera panel under the game sets tilt, orbit, zoom, whether the camera turns with the hero, and the view distance. View distance is Auto by default: it grows as far as your device can draw while holding a smooth frame rate.

## Features

- **A big island with real elevation**: 1024 × 1024 tiles of rolling hills, mountain ranges with snow-capped peaks and cliffs, rivers that wind down to the sea, lakes, forests and beaches
- **Auto view distance**: terrain streams in around you with levels of detail, and the draw distance grows (up to 512 tiles) as long as the frame rate holds
- **Emberhold**, a walled town laid out to suit the land around it: an irregular stone wall with towers and four gatehouses, curving streets and lanes, a market square with a fountain and stalls, about 75 buildings facing their streets, and farms and farmsteads outside the walls. Roads lead out of each gate to the three shrines
- **Every building can be entered**: homes, the Gilded Ember inn, the temple, the guardhouse and five shops are furnished inside, with beds, tables, fireplaces, counters, anvils, armor stands and more
- **Stealing**: cupboards, chests, barrels, strongboxes, footlockers and items left on tables can be searched. Taking from them is theft, and anyone awake in the room will raise the alarm. At night the residents sleep in their beds. Shops lock their doors at night, and you can try to pick the locks
- **A living town**: about 50 named townsfolk keep daily routines (farmers, shopkeepers, a baker, a bard, children and more) and sleep at home at night
- **Guards in two shifts**: one guard at every gate, two walking the top of the walls, one walking the streets, and their relief resting in the guardhouse. They keep monsters out of town (the guards on the walls throw spears)
- **Crime and bounties**: you can attack townsfolk, but guards will defend them and fight back. Children always run faster than you can chase them. Pay your bounty to any guard, or lie low until the guards stop looking
- **Sprinting and stamina**: sprinting and swinging use stamina, which comes back when you ease off
- **Attributes**: Strength, Dexterity, Constitution, Wisdom and Charisma. You get 3 points to spend each level, and each one changes damage, swing speed, critical hits, sprint speed, lock-picking, health, stamina, XP gain, healing, shop prices or bounties
- A 30-slot bag (more with Strength), 8 equipment slots and over 50 items, with Worn, Standard, Fine, Masterwork and Legendary qualities
- A character sheet with attributes and equipment, and records: monsters slain by type, miles walked and sprinted, map explored, gold earned and spent, items stolen, bounties paid and more
- Day/night cycle with lamplight, lit windows and torch-carrying guards after dark
- Enemies: slimes, ember slimes, skeletons, night-only ghosts, wolf packs and goblins
- Quest line from Elder Maren, plus a skeleton bounty
