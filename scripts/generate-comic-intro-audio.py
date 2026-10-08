"""Original 138 BPM score, sound design and approved voice for the 90s comic intro.
Requires numpy, edge-tts==7.2.8 and ffmpeg. No licensed music samples are used.
Cached synthesis lives in .local/comic-intro; changing a line invalidates its take.
"""
import asyncio, hashlib, json, math, pathlib, subprocess, wave, unicodedata
import numpy as np
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parents[1]
WORK = ROOT / '.local/comic-intro'
PUBLIC = ROOT / 'apps/web/public/intro/comic'
CONFIG = json.loads((ROOT / 'scripts/comic-intro-script.json').read_text(encoding='utf-8'))
SR = 44100
LENGTH = 90 * SR
rng = np.random.default_rng(2026)

def command(*args):
    r = subprocess.run(args, capture_output=True)
    if r.returncode: raise RuntimeError(r.stderr.decode(errors='replace')[-2500:])
    return r.stdout

def read_audio(path):
    return np.frombuffer(command('ffmpeg','-v','error','-i',str(path),'-f','f32le','-ac','1','-ar',str(SR),'pipe:1'),dtype='<f4').copy()

def write_audio(path, samples):
    with wave.open(str(path),'wb') as w:
        w.setnchannels(2 if samples.ndim==2 else 1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(samples,-1,1)*32767).astype('<i2').tobytes())

def add(track, sample, start, gain=1):
    i=round(start*SR); n=min(len(sample),len(track)-i)
    if n>0 and i>=0: track[i:i+n]+=sample[:n]*gain

def tone(freq, duration, decay=5):
    t=np.arange(round(duration*SR))/SR
    return np.sin(2*np.pi*freq*t)*np.exp(-decay*t)*np.minimum(1,t/0.004)

def kick():
    t=np.arange(round(.38*SR))/SR
    phase=2*np.pi*(44*t+90*.025*(1-np.exp(-t/.025)))
    return np.sin(phase)*np.exp(-t*12)

def noise(duration, decay=20):
    t=np.arange(round(duration*SR))/SR
    n=rng.normal(0,1,len(t)); n=np.concatenate(([0],np.diff(n)))
    return n*np.exp(-decay*t)*np.minimum(1,t/.002)*.2

async def narration():
    track=np.zeros(LENGTH,dtype=np.float32); cues=[]; words=[]
    text=' '.join(s['text'] for s in CONFIG['scenes'])
    path=WORK/'continuous.mp3'; meta=WORK/'continuous.json'
    key=hashlib.sha256((text+CONFIG['voice']+CONFIG['rate']+CONFIG['pitch']).encode()).hexdigest()
    if not path.exists() or not meta.exists() or json.loads(meta.read_text(encoding='utf-8'))['key']!=key:
        events=[]
        speech=edge_tts.Communicate(text,voice=CONFIG['voice'],rate=CONFIG['rate'],pitch=CONFIG['pitch'],boundary='WordBoundary')
        with path.open('wb') as file:
            async for chunk in speech.stream():
                if chunk['type']=='audio': file.write(chunk['data'])
                elif chunk['type']=='WordBoundary': events.append({k:chunk[k] for k in ('text','offset','duration')})
        meta.write_text(json.dumps(dict(key=key,words=events),ensure_ascii=False),encoding='utf-8')
    events=json.loads(meta.read_text(encoding='utf-8'))['words']
    samples=read_audio(path)
    end=(events[-1]['offset']+events[-1]['duration'])/1e7
    print(f'Continuous voice ends at {end:.3f}s',flush=True)
    if end>89.65 or end<86: raise ValueError('Adjust the script to finish naturally between 86 and 89.65 seconds; never stretch the voice.')
    add(track,samples[:round((end+.15)*SR)],0)
    def norm(t):return ''.join(c for c in unicodedata.normalize('NFKC',t).casefold() if c.isalnum())
    cursor=0
    for i,s in enumerate(CONFIG['scenes']):
        first=cursor; spoken=''; expected=norm(s['text'])
        while cursor<len(events) and len(spoken)<len(expected):spoken+=norm(events[cursor]['text']);cursor+=1
        if spoken!=expected:raise ValueError(f'Unexpected word boundary in {s["id"]}')
        start=events[first]['offset']/1e7;end=(events[cursor-1]['offset']+events[cursor-1]['duration'])/1e7
        previous=(events[first-1]['offset']+events[first-1]['duration'])/1e7 if first else 0
        frame=round((previous+start)/2*24) if first else 0
        s['start']=frame/24
        cues.append(dict(fromFrame=frame,scene=i,text=s['text'],voiceStartFrame=round(start*24),voiceDuration=round(end-start,5)))
        print(f'{s["id"]}: {start:.2f}-{end:.2f}',flush=True)
    for e in events:
        words.append(dict(text=e['text'],startMs=round(e['offset']/1e4),endMs=round((e['offset']+e['duration'])/1e4),timestampMs=round(e['offset']/1e4),confidence=None))
    return track,cues,words

def score():
    music=np.zeros(LENGTH,dtype=np.float32); effects=np.zeros(LENGTH,dtype=np.float32)
    beat=60/138
    # Section-local pulse resets align the requested drops exactly to the edit.
    for begin,end,intensity in [(0,3,.9),(3,12,.24),(12,15,1),(15,39,.65),(39,51,.40),(51,70,1),(70,78,.45),(84,90,.85)]:
        for n in range(math.ceil((end-begin)/beat)):
            t=begin+n*beat
            if t>=end: break
            add(music,kick(),t,.54*intensity)
            freq=[46.249,46.249,55,41.203][(n//4)%4]
            add(music,tone(freq,.55,6)+tone(freq*2,.55,9)*.15,t+.02,.32*intensity)
            if begin!=39:
                if n%2: add(music,noise(.16,28)+tone(185,.16,30)*.3,t,.65*intensity)
                for sub in [0,.5,.75]: add(music,noise(.045,85),t+sub*beat,.45*intensity)
                if n%4 in [0,3]: add(music,tone(370 if n%4==0 else 440,.20,18),t+beat*.75,.12*intensity)
            if begin in [12,51,84] and n%8==0:
                for j in range(4): add(music,tone([370,440,554,659][j],.28,10),t+j*beat/4,.13)
    # Airy outro chords under proof; no purchased recordings or music samples.
    for t in [70,72,74,76]:
        chord=sum(tone(f,1.8,1.8) for f in [185,220,277])*.025
        add(music,chord,t)
    for t in [0.083,3,12,51,84]:
        add(effects,kick(),t,.8); add(effects,noise(.6,10),t,.7)
        add(effects,tone(46.25,1.0,5),t,.5)
    for scene in CONFIG['scenes'][4:13]:
        start=scene['start']
        for step in [0,1.5,3,4.5]:
            add(effects,noise(.08,45),start+step,.33)
        if scene['id']=='rewards':
            for j in range(5): add(effects,tone(523.25*2**(j/4),.3,10),start+3+j*.075,.15)
        elif scene['id']=='ai':
            for j in range(9): add(effects,tone(880*2**(j/12),.3,11),start+2.8+j*.065,.10)
        elif scene['id']=='rides':
            t=np.arange(SR)/SR; engine=np.sin(2*np.pi*(55*t+85*t*t))*np.sin(np.pi*t)**2
            add(effects,engine,start+1.4,.18)
        elif scene['id']=='friends':
            for j in range(4): add(effects,tone(660,.05,22),start+1+j*.35,.17)
        else:
            add(effects,tone(660,.12,22)+tone(880,.12,22)*.4,start+3,.16)
    # A full 138 BPM beat of silence at 78 s, then a restrained tension riser.
    rise_start=78+beat; t=np.arange(round((84-rise_start)*SR))/SR
    riser=np.sin(2*np.pi*(110*t+70*t*t))*np.linspace(0,.12,len(t))
    add(music,riser,rise_start)
    for t in np.arange(80,84,beat/2): add(effects,noise(.025,120),float(t),.15)
    # Stinger reflections and two-second tail.
    for j in range(1,9): add(effects,tone(185,1.8,3)+tone(277,1.8,3)*.5,84+j*.17,.12*.68**j)
    for scene in CONFIG['scenes'][1:]:
        if scene['start']==78: continue
        t=np.arange(round(.20*SR))/SR
        add(effects,noise(.20,0)*np.sin(np.pi*t/.20)**2,scene['start']-.12,.35)
    return music,effects

async def main():
    WORK.mkdir(parents=True,exist_ok=True); PUBLIC.mkdir(parents=True,exist_ok=True)
    voice,cues,words=await narration(); music,effects=score()
    # Duck the score across narrated phrases while preserving hits and the beat.
    duck=np.ones(LENGTH,dtype=np.float32)
    for c in cues:
        if c['voiceDuration']:
            a=round(c['voiceStartFrame']/24*SR); b=min(LENGTH,a+round(c['voiceDuration']*SR))
            duck[a:b]=.44
    window=np.ones(round(.10*SR))/round(.10*SR)
    # Cheap smooth envelope via cumulative sum rather than long convolution.
    size=len(window); padded=np.pad(duck,(size//2,size-size//2),'edge'); total=np.cumsum(padded,dtype=np.float64)
    duck=((total[size:]-total[:-size])/size).astype(np.float32)
    bed=music*duck*.66+effects*.42
    mono=voice*1.3+bed
    stereo=np.column_stack([mono,voice*1.3+bed*.97+np.roll(bed,round(.012*SR))*.03])
    stereo/=max(1,float(np.max(np.abs(stereo)))/.93)
    stereo[:2*SR//24]*=np.linspace(0,1,2*SR//24)[:,None]
    write_audio(WORK/'mix.wav',stereo)
    command('ffmpeg','-v','error','-y','-i',str(WORK/'mix.wav'),'-af','loudnorm=I=-16:TP=-1.5:LRA=9,aresample=44100,apad','-t','90','-c:a','libmp3lame','-b:a','160k',str(PUBLIC/'enturma-comic-90-presenter-v2.mp3'))
    (ROOT/'apps/web/src/components/intro/intro-storyboard.json').write_text(json.dumps(dict(durationInFrames=2160,fps=24,audioFile='intro/comic/enturma-comic-90-presenter-v2.mp3',sceneFrames=[round(s['start']*24) for s in CONFIG['scenes']]+[2160],cues=cues),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'apps/web/src/components/intro/comic/narration-words.json').write_text(json.dumps(words,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('90-second original score and narration ready.',flush=True)

asyncio.run(main())
