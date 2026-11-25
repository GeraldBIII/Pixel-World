# Builds Emberwild's art pack from the CC0 Dungeon Crawl Stone Soup 32x32 tiles
import os,json,colorsys,sys
from PIL import Image,ImageEnhance
SRC=sys.argv[1];OUT=sys.argv[2]
P=lambda *a:os.path.join(SRC,*a)
def load(p):return Image.open(P(p)).convert('RGBA')
def save(im,rel):
    path=os.path.join(OUT,rel);os.makedirs(os.path.dirname(path),exist_ok=True);im.save(path,optimize=True);return rel
def hue(im,shift,sat=1.0,val=1.0):
    px=im.load();out=im.copy();po=out.load()
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=px[x,y]
            if a==0:continue
            h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255);h=(h+shift)%1;s=min(1,s*sat);v=min(1,v*val)
            rr,gg,bb=colorsys.hsv_to_rgb(h,s,v);po[x,y]=(int(rr*255),int(gg*255),int(bb*255),a)
    return out
def shadowless(im):
    # Crawl sprites sit on a soft drop-shadow; drop the semi-transparent black pixels so they stand cleanly in the world
    px=im.load();out=im.copy();po=out.load()
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=px[x,y]
            if a<255 and r<40 and g<40 and b<40:po[x,y]=(0,0,0,0)
    return out
def strip(frames):
    w=sum(f.width for f in frames);h=max(f.height for f in frames);s=Image.new('RGBA',(w,h));x=0
    for f in frames:s.alpha_composite(f,(x,0));x+=f.width
    return s
def bob(im,dy=1):
    f=Image.new('RGBA',im.size);f.alpha_composite(im.crop((0,dy,im.width,im.height)),(0,0));return f
def squash(im):
    f=Image.new('RGBA',im.size);s=im.resize((im.width,im.height-2),Image.NEAREST);f.alpha_composite(s,(0,2));return f
def walk(im,kind='bob'):return strip([im,bob(im) if kind=='bob' else squash(im)])
def doll(*layers):
    im=Image.new('RGBA',(32,32))
    for l in layers:
        if l:im.alpha_composite(load('player/'+l))
    return im
man={'density':2,'monsters':{},'animals':{},'npcs':{},'items':{},'tiles':{},
     'credits':'Art: Dungeon Crawl Stone Soup 32x32 tiles, released under CC0 by their artists (github.com/crawl/tiles).'}
# ---------- monsters: 2-frame strips; wolves, bears and scorpions face left like the built-in sprites ----------
M={'slime':(hue(load('mon/amorphous/azure_jelly.png'),-.28,1.0,1.05),'squash'),'redslime':(load('mon/amorphous/jelly.png'),'squash'),
   'skeleton':(load('mon/undead/skeletons/skeleton_humanoid_large.png'),'bob'),'ghost':(load('mon/undead/ghost.png'),'bob'),
   'wolf':(load('mon/animals/wolf.png').transpose(Image.FLIP_LEFT_RIGHT),'bob'),'goblin':(load('mon/goblin.png'),'bob'),
   'spider':(load('mon/animals/spider.png'),'bob'),'bear':(load('mon/animals/black_bear.png'),'bob'),
   'troll':(load('mon/iron_troll.png'),'bob'),'scorpion':(load('mon/animals/scorpion.png'),'bob'),
   'bandit':(doll('base/human_m.png','legs/pants_black.png','boots/middle_brown.png','body/leather_stud.png','head/hood_black2.png','hand1/dagger.png'),'bob'),
   'draugr':(load('mon/undead/wight.png'),'bob')}
for k,(im,kind) in M.items():man['monsters'][k]={'src':save(walk(shadowless(im),kind),'monsters/%s.png'%k),'frames':2}
man['animals']['dog']={'src':save(walk(shadowless(load('mon/animals/jackal.png'))),'animals/dog.png'),'frames':2}
# ---------- people: layered from Crawl's paper-doll parts ----------
H,F='base/human_m.png','base/human_f.png'
N={'guard':[(H,'legs/metal_gray.png','boots/middle_gray.png','body/half_plate2.png','head/fhelm_gray3.png','hand1/spear.png','hand2/shield_knight_rw.png'),
            (F,'legs/metal_gray.png','boots/middle_gray.png','body/half_plate.png','head/helm_plume.png','hand1/spear2.png','hand2/shield_knight_gray.png')],
   'patrol':[(H,'legs/leg_armour01.png','boots/middle_gray.png','body/half_plate3.png','head/fhelm_horn2.png','hand1/spear.png','hand2/shield_kite1.png')],
   'caravanguard':[(H,'legs/pants_brown.png','boots/middle_brown.png','body/leather_stud.png','head/cap_black1.png','hand1/long_sword_slant.png','hand2/buckler_round.png')],
   'townsfolk':[(H,'legs/pants_brown.png','boots/short_brown2.png','body/jacket2.png','hair/brown1.png'),
                (F,'legs/skirt_blue.png','boots/short_brown2.png','body/dress_green.png','hair/fem_red.png'),
                (H,'legs/pants_blue.png','boots/middle_brown.png','body/leather_jacket.png','hair/brown2.png'),
                (F,'legs/skirt_white.png','boots/short_purple.png','body/dress_white.png','hair/pigtails_brown.png'),
                (H,'legs/pants_darkgreen.png','boots/middle_brown.png','body/green_susp.png','head/bandana_ybrown.png'),
                (F,'legs/skirt_red.png','boots/short_brown2.png','body/leather_red.png','hair/ponytail_yellow.png'),
                (H,'legs/pants_black.png','boots/middle_brown3.png','body/robe_brown.png','hair/brown1.png'),
                (F,'legs/pants_l_white.png','boots/short_brown2.png','body/jacket3.png','hair/fem_black.png')],
   'elder':[(F,'body/robe_purple.png','hair/fem_white.png','hand1/staff_large.png')],
   'shop.smith':[(H,'legs/pants_black.png','boots/middle_brown.png','body/leather_heavy.png','hair/brown2.png','hand1/mace.png')],
   'shop.armor':[(F,'legs/metal_gray.png','boots/middle_gray.png','body/half_plate.png','hair/fem_yellow.png')],
   'shop.potion':[(F,'body/robe_green.png','head/hood_green.png')],
   'shop.trade':[(H,'legs/pants_brown.png','boots/middle_brown.png','body/coat_red.png','head/hat_black.png')],
   'shop.inn':[(F,'legs/skirt_red.png','boots/short_brown2.png','body/dress_white.png','hair/fem_red.png')],
   'shop.temple':[(H,'body/robe_blue_white.png','head/healer.png','hand1/quarterstaff.png')],
   'trader':[(H,'legs/pants_brown.png','boots/middle_brown.png','body/coat_black.png','head/feather_red.png')],
   'settler':[(H,'legs/pants_brown.png','boots/middle_brown2.png','body/leather_jacket.png','head/bandana_ybrown.png','hand1/axe_small.png'),
              (F,'legs/skirt_green.png','boots/short_brown2.png','body/dress_green.png','hair/pigtails_yellow.png')],
   'elf':[('base/elf_f.png','body/robe_green_gold.png','hair/elf_black.png'),('base/elf_m.png','legs/pants_darkgreen.png','boots/middle_green.png','body/leather_green.png','head/hood_green2.png','hand1/bow.png'),
          ('base/elf_f.png','legs/skirt_green.png','body/dress_white.png','hair/fem_yellow.png'),('base/elf_m.png','body/robe_cyan.png','hair/fem_white.png')]}
for k,L in N.items():
    man['npcs'][k]=[]
    for i,layers in enumerate(L):
        man['npcs'][k].append({'src':save(walk(doll(*layers)),'npcs/%s_%d.png'%(k.replace('.','_'),i)),'frames':2})
# ---------- inventory icons ----------
I={'rusty':'weapon/short_sword3.png','dagger':'weapon/dagger.png','short':'weapon/short_sword1.png','haxe':'weapon/hand_axe1.png','spear':'weapon/spear1.png','mace':'weapon/mace1.png',
   'long':'weapon/long_sword1.png','saber':'weapon/scimitar1.png','rune':'weapon/greatsword1.png','ember':'weapon/falchion3.png',
   'buckler':'armour/shields/buckler1.png','kite':'armour/shields/shield1.png','tower':'armour/shields/large_shield1.png','aegis':'armour/shields/large_shield3.png',
   'cap':'armour/headgear/elven_leather_helm.png','helm':'armour/headgear/helmet1.png','ghelm':'armour/headgear/helmet3.png',
   'gamb':'armour/robe1.png','jerkin':'armour/leather_armour1.png','chain':'armour/ring_mail1.png','plate':'armour/plate1.png','dragon':'armour/mottled_dragon_armour.png',
   'gloves':'armour/glove1.png','gaunt':'armour/glove4.png','boots':'armour/boots1_brown.png','greaves':'armour/boots2_jackboots.png','swift':'armour/boots4_green.png',
   'cring':'ring/tourmaline.png','vigor':'ring/ruby.png','charm':'amulet/bone_gray.png','ward':'amulet/celtic_blue.png','light':'amulet/face1_gold.png',
   'bread':'food/bread_ration.png','potion':'potion/ruby.png','gpotion':'potion/effervescent.png','mightel':'potion/brown.png','stonel':'potion/cloudy.png',
   'locket':'amulet/cameo_blue.png','relic':'misc/misc_orb.png'}
for k,f in I.items():
    if os.path.exists(P('item',f)):man['items'][k]=save(load('item/'+f),'items/%s.png'%k)
    else:print('missing item',k,f)
# ---------- ground: Crawl's grass, dirt and sand (its other floors are dungeon-dark, so those terrains keep the built-in tiles) ----------
def tile(f,b=1.0):im=load('dngn/floor/'+f);return ImageEnhance.Brightness(im).enhance(b) if b!=1 else im
T={'grass':[('grass/grass0.png',1.32),('grass/grass1.png',1.32),('grass/grass2.png',1.32)],'forest':[('grass/grass1.png',1.12),('grass/grass2.png',1.12),('grass/grass0.png',1.12)],
   'hill':[('grass/grass0-dirt-mix1.png',1),('grass/grass0-dirt-mix2.png',1),('grass/grass0-dirt-mix3.png',1)],'path':[('dirt0.png',1),('dirt1.png',1)],
   'sand':[('sand1.png',1.05),('sand3.png',1.05)],'desert':[('sand1.png',1.15),('sand3.png',1.15)]}
for k,L in T.items():man['tiles'][k]=[save(tile(f,b),'tiles/%s_%d.png'%(k,i)) for i,(f,b) in enumerate(L)]
json.dump(man,open(os.path.join(OUT,'art.json'),'w'),indent=1)
print('monsters',len(man['monsters']),'npcs',sum(len(v) for v in man['npcs'].values()),'items',len(man['items']),'tiles',sum(len(v) for v in man['tiles'].values()))
