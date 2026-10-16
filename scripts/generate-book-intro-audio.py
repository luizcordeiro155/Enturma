"""90s original phonk-inspired score and synchronized Foley under the approved continuous voice.

Uses the existing approved recording; never calls a voice service. Requires numpy and ffmpeg.
All instruments/effects are synthesized here, without samples or licensed music.
"""
import json, math, pathlib, subprocess, wave
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]
WORK = ROOT / '.local/comic-intro'
STORY = ROOT / 'apps/web/src/components/intro/intro-storyboard.json'
PUBLIC = ROOT / 'apps/web/public/intro/comic'
SR = 44100
LENGTH = 90 * SR
BEAT = 60 / 138
rng = np.random.default_rng(4126)

def command(*args):
    result = subprocess.run(args, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.decode(errors='replace')[-2000:])
    return result.stdout

def add(track, sample, at, gain=1):
    start = round(at * SR)
    if start < 0: sample, start = sample[-start:], 0
    size = min(len(sample), len(track) - start)
    if size > 0: track[start:start+size] += sample[:size] * gain

def envelope(t, decay=6):
    return np.minimum(1, t/.004) * np.exp(-t*decay)

def sine(frequency, length=.3, decay=12):
    t = np.arange(round(SR*length))/SR
    return np.sin(2*np.pi*frequency*t)*envelope(t,decay)

def kick():
    t = np.arange(round(SR*.42))/SR
    return np.tanh(np.sin(2*np.pi*(47*t+102*.022*(1-np.exp(-t/.022))))*1.6)*envelope(t,11)

def bass(frequency, length=.6):
    t = np.arange(round(SR*length))/SR
    phase = 2*np.pi*(frequency*t+frequency*.035*(1-np.exp(-t/.035)))
    return np.tanh((np.sin(phase)+.16*np.sin(phase*2))*1.7)*envelope(t,5)

def noise(length=.1, decay=25):
    t = np.arange(round(SR*length))/SR
    raw = rng.normal(0,.3,len(t))
    return np.concatenate(([0],np.diff(raw)))*envelope(t,decay)

def bell(frequency, length=.27):
    t = np.arange(round(SR*length))/SR
    # Short FM cowbell: pitched and softened to leave space for speech.
    return np.sin(2*np.pi*frequency*t+1.1*np.sin(2*np.pi*frequency*1.48*t)*np.exp(-t*22))*envelope(t,17)

def whoosh(length=.32):
    t = np.arange(round(SR*length))/SR
    return noise(length,0)*np.sin(np.pi*t/length)**2

def main():
    recording = WORK/'continuous.mp3'
    if not recording.exists():
        raise FileNotFoundError('Restore the approved continuous.mp3; do not regenerate the voice.')
    story = json.loads(STORY.read_text(encoding='utf-8'))
    starts = np.array(story['sceneFrames'][:-1])/24
    voice = np.zeros(LENGTH,dtype=np.float32)
    decoded = np.frombuffer(command('ffmpeg','-v','error','-i',str(recording),'-f','f32le','-ac','1','-ar',str(SR),'pipe:1'),dtype='<f4')
    add(voice,decoded,0)
    music = np.zeros_like(voice); fx = np.zeros_like(voice)
    # Continuous pulse, no long silent build-up. Energy follows the actual spoken chapters.
    for step in range(math.ceil(90/BEAT)):
        at = step*BEAT
        chapter = int(np.searchsorted(starts,at,side='right')-1)
        energy = .28 if chapter in (1,2) else .42 if chapter in (13,14) else .7
        if chapter==15: energy=.85
        if step%4 in (0,2) or step%8==7: add(music,kick(),at,.42*energy)
        if step%2==0: add(music,bass([46.249,55,41.203,49][step//8%4]),at+.012,.28*energy)
        if step%2:
            add(music,noise(.17,30)+sine(190,.17,28)*.2,at,.30*energy)
            add(music,noise(.055,42),at+.018,.12*energy)
        for subdivision in (0,.5,.75):
            add(music,noise(.045,95),at+subdivision*BEAT,.18*energy)
        if step%4 in (0,1,3):
            note=[740,622.25,554.37,466.16,554.37,622.25,740,932.33][step%8]
            add(music,bell(note),at+BEAT*.25,.12*energy)
            add(music,bell(note),at+BEAT*.75,.035*energy)
    for index,at in enumerate(starts):
        add(fx,whoosh(),at-.13,.22)
        add(fx,sine(95,.25,16),at+.05,.12)
        if index in (0,3,10,15):
            add(music,kick(),at+.05,.32)
            add(fx,noise(.4,12),at+.04,.24)
    # Frame-accurate accents match the dedicated scene actions.
    for frame in (24,74):
        for note,freq in enumerate((523.25,659.25,783.99,1046.5)):
            add(fx,sine(freq,.25,13),starts[4]+frame/24+note*.055,.075)
    for i in range(6): add(fx,bell(880*2**(i/12)),starts[5]+(65+i*4)/24,.075)
    for frame in (14,42,70): add(fx,sine(680,.09,32)+sine(940,.09,38)*.4,starts[7]+frame/24,.09)
    # Engine follows the car's 20..98 frame route. Soft tire noise, no loud rev.
    t=np.arange(round(SR*78/24))/SR
    window=np.sin(np.pi*t/(78/24))**2
    engine=(np.sin(2*np.pi*(52*t+8*t*t))+.24*np.sin(2*np.pi*104*t))*window
    add(fx,engine,starts[8]+20/24,.065)
    add(fx,sine(660,.1,20)+sine(990,.1,24)*.5,starts[8]+96/24,.12)
    for frame in (0,6,12,18): add(fx,sine(520,.075,24),starts[9]+frame/24,.06)
    add(fx,whoosh(.2),starts[9]+54/24,.12)
    for index,frame in ((10,48),(11,71),(12,55),(13,36)):
        add(fx,sine(660,.2,12)+sine(880,.2,15)*.45,starts[index]+frame/24,.13)
    for j in range(7): add(fx,sine(185,1.6,3)+sine(277,1.6,3)*.5,starts[15]+.1+j*.17,.065*.67**j)
    # Pause only the percussion for a single beat; narration stays continuous.
    a=round(starts[14]*SR); b=a+round(BEAT*SR)
    music[a:b]*=.1
    duck=np.ones(LENGTH,dtype=np.float32)
    for cue in story['cues']:
        a=round(cue['voiceStartFrame']/24*SR); b=min(LENGTH,a+round(cue['voiceDuration']*SR))
        duck[a:b]=.36
    size=round(.08*SR); padded=np.pad(duck,(size//2,size-size//2),'edge'); total=np.cumsum(padded,dtype=np.float64)
    duck=((total[size:]-total[:-size])/size).astype(np.float32)
    bed=music*duck+fx*.55
    bed[-SR:]*=np.linspace(1,.08,SR)
    stereo=np.column_stack((voice*1.3+bed,voice*1.3+bed*.96+np.roll(bed,529)*.04))
    stereo/=max(1,float(np.max(np.abs(stereo)))/.92)
    work=WORK/'book-cinema-mix.wav'
    with wave.open(str(work),'wb') as output:
        output.setnchannels(2); output.setsampwidth(2); output.setframerate(SR)
        output.writeframes((np.clip(stereo,-1,1)*32767).astype('<i2').tobytes())
    name='enturma-book-cinema-90-v1.mp3'
    command('ffmpeg','-v','error','-y','-i',str(work),'-af','loudnorm=I=-16:TP=-1.5:LRA=8,aresample=44100,apad','-t','90','-c:a','libmp3lame','-b:a','192k',str(PUBLIC/name))
    story['audioFile']='intro/comic/'+name
    STORY.write_text(json.dumps(story,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    voice_power=float(np.mean(voice**2)); bed_power=float(np.mean(bed**2))
    print(json.dumps({'seconds':90,'fps':24,'bpm':138,'voiceUnchanged':True,'musicAndEffectsBelowVoiceDb':round(10*math.log10(voice_power/bed_power),1),'output':name}))

if __name__=='__main__': main()
