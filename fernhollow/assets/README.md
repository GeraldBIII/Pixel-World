# Custom sprites

Replace any of the game's built-in art with your own PNG files. No coding needed.

## How to add a sprite

1. Find the sprite you want to replace in `templates/` (or in the tables below). Each template is the current art at its exact size.
2. Copy it into this folder (`fernhollow/assets/`), give it any name, and paint over it in your pixel editor (Aseprite, LibreSprite, Piskel...). Keep the same size, and keep the background transparent.
3. Open `sprites.js` in this folder and add a line with the sprite's name and your file:

   ```js
   const SPRITE_FILES = {
     'item.hoe': 'my-hoe.png',
     'tree.oak': 'big-oak.png',
   };
   ```

4. Reload the game. Anything you don't list keeps its built-in look. If a file can't be found, the game tells you which one.

## Tips

- Draw at 1 pixel per pixel. The game scales everything up itself, so never draw big and shrink it.
- Sheets (strips of frames) go left to right. Character sheets have one row per direction: down, up, left, right.
- Trees, tall objects and buildings can be bigger than the template. They're anchored at the bottom, so extra height grows upward.
- Characters must stay 16×28 per frame.
- A custom `char.player` sheet replaces the armored hero, so equipped gear will no longer show on your character.
- Opening the game straight from a file works. If an image looks fine but menu icons are blank, run a small local server instead: `python3 -m http.server` in the `fernhollow` folder, then open http://localhost:8000.

## Every sprite you can replace


### Items (hotbar and inventory icons)

| Sprite name | Size (px) | Notes |
| --- | --- | --- |
| `item.hoe` | 16×16 | Hoe |
| `item.can` | 16×16 | Watering Can |
| `item.axe` | 16×16 | Axe |
| `item.pick` | 16×16 | Pickaxe |
| `item.wood` | 16×16 | Wood |
| `item.stone` | 16×16 | Stone |
| `item.fiber` | 16×16 | Fiber |
| `item.shard` | 16×16 | Aether Shard |
| `item.ore` | 16×16 | Star-Iron Ore |
| `item.gel` | 16×16 | Moss Gel |
| `item.pelt` | 16×16 | Wolf Pelt |
| `item.gloom` | 16×16 | Gloom Essence |
| `item.cap` | 16×16 | Fairy Cap |
| `item.dew` | 16×16 | Dewblossom |
| `item.glowcap` | 16×16 | Glowcap |
| `item.fence` | 16×16 | Fence |
| `item.sprinkler` | 16×16 | Rune Sprinkler |
| `item.lantern` | 16×16 | Fae Lantern |
| `item.stew` | 16×16 | Forest Stew |
| `item.tonic` | 16×16 | Vigor Tonic |
| `item.dust` | 16×16 | Growth Dust |
| `item.rope` | 16×16 | Escape Rope |
| `item.salve` | 16×16 | Slime Salve |
| `item.bone` | 16×16 | Bone |
| `item.batwing` | 16×16 | Bat Wing |
| `item.gobtooth` | 16×16 | Goblin Tooth |
| `item.darkiron` | 16×16 | Darksteel Ore |
| `item.ruby` | 16×16 | Ember Ruby |
| `item.sapphire` | 16×16 | Tide Sapphire |
| `item.relic` | 16×16 | Ancient Relic |
| `item.carrot` | 16×16 | Glimmer Carrot |
| `item.seed_carrot` | 16×16 | Glimmer Carrot Seeds |
| `item.bloom` | 16×16 | Moonbloom |
| `item.seed_bloom` | 16×16 | Moonbloom Seeds |
| `item.ember` | 16×16 | Emberroot |
| `item.seed_ember` | 16×16 | Emberroot Seeds |
| `item.berry` | 16×16 | Dawnberry |
| `item.seed_berry` | 16×16 | Dawnberry Seeds |
| `item.pumpkin` | 16×16 | Wisp Pumpkin |
| `item.seed_pumpkin` | 16×16 | Wisp Pumpkin Seeds |
| `item.melon` | 16×16 | Frostmelon |
| `item.seed_melon` | 16×16 | Frostmelon Seeds |
| `item.sword` | 16×16 | Thornblade |
| `item.dagger` | 16×16 | Wolfbite Dagger |
| `item.ironsword` | 16×16 | Star-Iron Sword |
| `item.hammer` | 16×16 | Stoneheart Hammer |
| `item.moonblade` | 16×16 | Moonsteel Blade |
| `item.buckler` | 16×16 | Wooden Buckler |
| `item.kite` | 16×16 | Iron Kite Shield |
| `item.aegis` | 16×16 | Moon Aegis |
| `item.leathercap` | 16×16 | Leather Cap |
| `item.wolfhood` | 16×16 | Wolf Hood |
| `item.ironhelm` | 16×16 | Iron Helm |
| `item.tunic` | 16×16 | Padded Tunic |
| `item.wolfcoat` | 16×16 | Wolfhide Coat |
| `item.mail` | 16×16 | Star-Iron Mail |
| `item.boots` | 16×16 | Leather Boots |
| `item.swiftboots` | 16×16 | Swiftstep Boots |
| `item.greaves` | 16×16 | Iron Greaves |
| `item.charm` | 16×16 | Clover Charm |
| `item.amulet` | 16×16 | Vigor Amulet |
| `item.pendant` | 16×16 | Heart Pendant |
| `item.gobshiv` | 16×16 | Goblin Shiv |
| `item.dgreatsword` | 16×16 | Darksteel Greatsword |
| `item.bonehelm` | 16×16 | Bone Helm |
| `item.batcloak` | 16×16 | Batwing Cloak |
| `item.dplate` | 16×16 | Darksteel Plate |
| `item.sward` | 16×16 | Sapphire Ward |
| `item.rubyring` | 16×16 | Ruby Ring |

### World objects

| Sprite name | Size (px) | Notes |
| --- | --- | --- |
| `obj.rock` | 16×16 |  |
| `obj.boulder` | 16×16 |  |
| `obj.crystal` | 16×16 |  |
| `obj.ore` | 16×16 |  |
| `obj.stump` | 16×16 |  |
| `obj.twig` | 16×16 |  |
| `obj.cap` | 16×16 |  |
| `obj.dew` | 16×16 |  |
| `obj.glow` | 16×16 |  |
| `obj.sprinkler` | 16×16 |  |
| `obj.lantern` | 16×24 |  |
| `obj.lamp` | 16×32 |  |
| `obj.crate` | 16×16 |  |
| `obj.sign` | 16×16 |  |
| `obj.lovesign` | 16×20 |  |
| `obj.testchest` | 16×16 |  |
| `obj.torch` | 16×24 |  |
| `obj.stairs` | 16×16 |  |
| `obj.ladder` | 16×32 |  |
| `obj.loot` | 16×16 |  |
| `obj.lootOpen` | 16×16 |  |
| `obj.gemrock` | 16×16 |  |
| `obj.darkore` | 16×16 |  |
| `obj.fence` | 16×20 | one image used for every fence piece |
| `obj.bush` | 16×16 | all seasons |
| `obj.weed` | 16×16 | grass tuft, all seasons |

### Ground tiles

| Sprite name | Size (px) | Notes |
| --- | --- | --- |
| `tile.grass` | 64×16 | up to 4 variants side by side; all seasons |
| `tile.forest` | 48×16 | forest floor, up to 3 variants |
| `tile.path` | 48×16 | up to 3 variants |
| `tile.sand` | 32×16 | up to 2 variants |
| `tile.water` | 48×16 | 3 animation frames |
| `tile.waterDeep` | 48×16 | 3 animation frames |
| `tile.falls` | 48×16 | 3 animation frames |
| `tile.plaza` | 16×16 |  |
| `tile.tilled` | 16×16 |  |
| `tile.tilledWet` | 16×16 |  |
| `tile.bridge` | 16×16 |  |
| `tile.plateau` | 32×16 | top of the cliffs, up to 2 variants |
| `tile.cliffTop` | 16×16 |  |
| `tile.cliffBottom` | 16×16 |  |
| `tile.cliffSide` | 16×16 | east-facing cliff wall |

### Trees

| Sprite name | Size (px) | Notes |
| --- | --- | --- |
| `tree.oak` | 48×56 | any size; bottom-middle sits on the tile |
| `tree.pine` | 40×60 | any size; bottom-middle sits on the tile |

### Buildings

| Sprite name | Size (px) | Notes |
| --- | --- | --- |
| `building.farmhouse` | 96×84 | bottom-left sits on the building's bottom-left tile |
| `building.seedshop` | 80×84 | bottom-left sits on the building's bottom-left tile |
| `building.apothecary` | 80×84 | bottom-left sits on the building's bottom-left tile |
| `building.forge` | 80×84 | bottom-left sits on the building's bottom-left tile |
| `building.elderhouse` | 80×84 | bottom-left sits on the building's bottom-left tile |
| `building.cottage` | 64×68 | bottom-left sits on the building's bottom-left tile |
| `building.mushhouse` | 64×84 | bottom-left sits on the building's bottom-left tile |
| `building.moonwell` | 48×48 | bottom-left sits on the building's bottom-left tile |
| `building.fountain` | 48×48 | bottom-left sits on the building's bottom-left tile |
| `building.cave` | 48×40 | bottom-left sits on the building's bottom-left tile |
| `building.dstall` | 48×52 | bottom-left sits on the building's bottom-left tile |

### Characters

| Sprite name | Size (px) | Notes |
| --- | --- | --- |
| `char.player` | 64×112 | rows: down, up, left, right; 4 walk frames each |
| `char.thistle` | 64×112 | rows: down, up, left, right; 4 walk frames each |
| `char.mirabel` | 64×112 | rows: down, up, left, right; 4 walk frames each |
| `char.bram` | 64×112 | rows: down, up, left, right; 4 walk frames each |
| `char.lumi` | 64×112 | rows: down, up, left, right; 4 walk frames each |
| `char.oswin` | 64×112 | rows: down, up, left, right; 4 walk frames each |
| `char.grimble` | 64×112 | rows: down, up, left, right; 4 walk frames each |

### Crops in the field

| Sprite name | Size (px) | Notes |
| --- | --- | --- |
| `crop.carrot` | 80×20 | stages: seed, sprout, growing, mature, ready |
| `crop.bloom` | 80×20 | stages: seed, sprout, growing, mature, ready |
| `crop.ember` | 80×20 | stages: seed, sprout, growing, mature, ready |
| `crop.berry` | 80×20 | stages: seed, sprout, growing, mature, ready |
| `crop.pumpkin` | 80×20 | stages: seed, sprout, growing, mature, ready |
| `crop.melon` | 80×20 | stages: seed, sprout, growing, mature, ready |

### Monsters

| Sprite name | Size (px) | Notes |
| --- | --- | --- |
| `enemy.slime` | 32×16 | 2 animation frames |
| `enemy.rockslime` | 32×16 | 2 animation frames |
| `enemy.wisp` | 32×16 | 2 animation frames |
| `enemy.wolf` | 48×16 | 2 animation frames, facing left |
| `enemy.dslime` | 32×16 | 2 frames; replaces every depth tier |
| `enemy.bat` | 32×12 | 2 frames; replaces every depth tier |
| `enemy.skeleton` | 32×24 | 2 frames; replaces every depth tier |
| `enemy.goblin` | 32×20 | 2 frames; replaces every depth tier |
