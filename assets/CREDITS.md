# Art credits

The sprites, item icons and ground tiles in this folder are built from the **Dungeon Crawl Stone Soup 32×32 tiles**, which their artists released under **CC0** (public domain): <https://github.com/crawl/tiles> (also on OpenGameArt as "Dungeon Crawl 32x32 tiles"). Tiles with unclear licensing are excluded from that release.

`build_pack.py` rebuilds this folder from a checkout of that repository:

    git clone --depth 1 https://github.com/crawl/tiles crawl-tiles
    python3 assets/build_pack.py crawl-tiles/releases/Nov-2015 assets

It layers townsfolk, guards, shopkeepers, traders, settlers and elves from the tiles' paper-doll body parts, recolors the jelly into a green slime, adds a second walking frame to every character, picks item icons for Emberwild's gear, and brightens the grass and dirt floors for an outdoor world.

Credit isn't required under CC0, but thanks go to the Dungeon Crawl Stone Soup artists.
