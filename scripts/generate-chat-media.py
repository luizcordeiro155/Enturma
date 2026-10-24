"""Original Enturma reaction GIFs. Procedural artwork, no third-party image assets."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

OUT = Path(__file__).resolve().parents[1] / 'apps/web/public/chat-media'
OUT.mkdir(parents=True, exist_ok=True)
FONT = next((p for p in [Path('C:/Windows/Fonts/arialbd.ttf'), Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')] if p.exists()), None)
font = ImageFont.truetype(str(FONT), 18) if FONT else ImageFont.load_default()

def star(cx, cy, radius, angle=0):
    return [(cx + (radius if i % 2 == 0 else radius*.45)*math.cos(angle+i*math.pi/5-math.pi/2),
             cy + (radius if i % 2 == 0 else radius*.45)*math.sin(angle+i*math.pi/5-math.pi/2)) for i in range(10)]

for variant, (slug, title) in enumerate([
    ('vamos-estudar','VAMOS ESTUDAR'), ('consegui','CONSEGUI!'), ('boa-ideia','BOA IDEIA'),
    ('pausa','PAUSA MERECIDA'), ('obrigado','VALEU, TURMA'), ('foco','MODO FOCO')]):
    frames=[]
    for frame in range(32):
        phase=frame/32*math.tau
        image=Image.new('RGB',(240,180),'#102b25'); draw=ImageDraw.Draw(image)
        draw.rounded_rectangle((4,4,236,176),radius=24,fill='#173e34',outline='#346756',width=2)
        for i in range(5):
            a=phase+i*math.tau/5; x=120+82*math.cos(a); y=77+49*math.sin(a)
            draw.ellipse((x-2,y-2,x+2,y+2),fill='#7da568')
        dy=math.sin(phase)*4
        if variant in (0,5):
            draw.ellipse((74,113,166,124),fill='#102b25')
            draw.rounded_rectangle((65,38+dy,175,112+dy),radius=8,fill='#daf079')
            draw.polygon([(73,45+dy),(118,50+dy),(118,105+dy),(73,100+dy)],fill='#f4f8d9')
            draw.polygon([(122,50+dy),(167,45+dy),(167,100+dy),(122,105+dy)],fill='#e7edc5')
            for line in range(4):
                y=61+line*10+dy
                draw.line((80,y,109,y+2),fill='#b7cda2',width=2)
                draw.line((130,y+2,160,y),fill='#b7cda2',width=2)
            if variant==0:
                x=120+40*math.sin(phase)
                draw.polygon([(120,48+dy),(x,43+dy),(x,100+dy),(120,106+dy)],fill='#e0eaa7')
            else:
                for i in range(4):
                    a=i*math.pi/2
                    x=120+67*math.cos(a);y=76+49*math.sin(a)
                    draw.ellipse((x-3,y-3,x+3,y+3),fill='#daf079')
        elif variant==1:
            draw.polygon(star(120,77+dy,42,math.sin(phase)*.08),fill='#f4cc58',outline='#ffeaa8',width=3)
            draw.line((102,78+dy,115,91+dy,139,64+dy),fill='#173e34',width=6)
        elif variant==2:
            radius=28+2*math.sin(phase)
            draw.ellipse((120-radius,69-radius+dy,120+radius,69+radius+dy),fill='#daf079')
            draw.rounded_rectangle((107,94+dy,133,112+dy),radius=4,fill='#82c495')
            for i in range(7):
                a=i*math.tau/7+phase*.1
                draw.line((120+36*math.cos(a),69+dy+36*math.sin(a),120+43*math.cos(a),69+dy+43*math.sin(a)),fill='#daf079',width=3)
        elif variant==3:
            draw.ellipse((82,38+dy,158,114+dy),fill='#edf2cf',outline='#82c495',width=4)
            draw.line((120,76+dy,120,51+dy),fill='#173e34',width=4)
            draw.line((120,76+dy,120+23*math.cos(phase),76+dy+23*math.sin(phase)),fill='#346756',width=3)
        else:
            scale=1+.06*math.sin(phase)
            points=[]
            for i in range(101):
                a=i/100*math.tau
                points.append((120+2.3*scale*16*math.sin(a)**3,75+dy-2.3*scale*(13*math.cos(a)-5*math.cos(2*a)-2*math.cos(3*a)-math.cos(4*a))))
            draw.polygon(points,fill='#daf079')
        bounds=draw.textbbox((0,0),title,font=font)
        draw.text(((240-(bounds[2]-bounds[0]))/2,140),title,font=font,fill='#f5f8e7')
        frames.append(image)
    frames[0].save(OUT/f'{slug}.gif',save_all=True,append_images=frames[1:],duration=80,loop=0,optimize=True)
print('Generated six original Enturma reaction GIFs.')
