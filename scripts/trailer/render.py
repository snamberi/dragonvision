"""Edits captured footage + music into the trailer. Usage: python3 render.py <workdir> wide|tall"""
import json, subprocess, sys, os
W = sys.argv[1]; MODE = sys.argv[2]
BRAND = '/home/user/dragonvision/public/brand'
PX = f'{W}/PressStart2P.ttf'; VT = f'{W}/VT323.ttf'
wide = MODE == 'wide'
SW, SH = (1920, 1080) if wide else (1080, 1920)
FPS = 30
raw = f'{W}/raw-{MODE}'
marks = json.load(open(f'{raw}/marks.json'))
BEAT = 60 / 136; BAR = BEAT * 4
# name, offset after action start, source seconds, slot bars, caption
SHOTS = [
    ('home', 0.0, 4.0, 2, 'Your journey starts at home'),
    ('cityday', 0.5, 5.5, 2, 'Explore Vision City'),
    ('citynight', 0.3, 2.2, 1, 'By day and by night'),
    ('summon', 1.0, 5.8, 3, 'Summon legendary fighters'),
    ('battle', 1.5, 9.5, 3, 'Fight 5v5 battles'),
    ('stages', 2.6, 2.8, 1, '380 stages to conquer'),
    ('wall', 1.0, 2.4, 1, 'Break the walls'),
    ('fighters', 0.3, 4.2, 2, 'Build your team of five'),
    ('detail', 0.3, 3.2, 1, 'Hunt boss gear sets'),
    ('event', 1.0, 3.0, 2, 'A new event every week'),
    ('tower', 0.3, 2.3, 1, 'Climb the Rival Tower'),
    ('dungeon', 0.2, 1.4, 0.5, 'Dungeons and raids'),
    ('raid', 0.2, 1.4, 0.5, 'Dungeons and raids'),
]
os.makedirs(f'{W}/seg-{MODE}', exist_ok=True)
def run(args): subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)
def esc(s): return s.replace(':', '\\:').replace("'", "’")
ENC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', str(FPS)]
fs = 44 if wide else 40
def caption(text, dur):
    y = 'h-210' if wide else 'h-470'
    x = f"80-60*max(0\\,1-(t-0.12)/0.25)" if wide else "(w-text_w)/2"
    a = f"if(lt(t\\,0.12)\\,0\\,min(1\\,(t-0.12)/0.2))*if(gt(t\\,{dur-0.15:.2f})\\,max(0\\,({dur:.2f}-t)/0.15)\\,1)"
    return (f"drawtext=fontfile={PX}:text='{esc(text)}':fontsize={fs}:fontcolor=0xFFD166:alpha='{a}'"
            f":box=1:boxcolor=0x140f28@0.88:boxborderw=26:x={x}:y={y}")
segs = []
t = 0.0
def frames(a, b): return round(b * FPS) - round(a * FPS)
# intro: 4 bars
intro_len = 4 * BAR
logo_w = 760 if wide else 820
run(['-f', 'lavfi', '-i', f'color=c=0x120d24:s={SW}x{SH}:r={FPS}', '-loop', '1', '-i', f'{BRAND}/logo-light-transparent.png',
     '-filter_complex',
     f"[1]scale={logo_w}:-1:flags=neighbor,format=rgba,fade=in:st=0.6:d=0.8:alpha=1[l];"
     f"[0]vignette=PI/4[b];[b][l]overlay=(W-w)/2:(H-h)/2-{80 if wide else 140}[v];"
     f"[v]drawtext=fontfile={VT}:text='A NinefoldVision™ game':fontsize={64 if wide else 70}:fontcolor=0xF4ECD8:x=(w-text_w)/2:y=h/2+{170 if wide else 140}:alpha='min(1\\,max(0\\,(t-2.2)/0.6))',"
     f"drawtext=fontfile={PX}:text='OUT NOW':fontsize={34 if wide else 40}:fontcolor=0xFFD166:x=(w-text_w)/2:y=h/2+{270 if wide else 260}:alpha='min(1\\,max(0\\,(t-3.6)/0.4))',"
     f"fade=out:st={intro_len-0.25:.2f}:d=0.25",
     '-frames:v', str(frames(0, intro_len)), *ENC, f'{W}/seg-{MODE}/00-intro.mp4'])
segs.append('00-intro.mp4'); t = intro_len
for i, (name, off, src, bars, cap) in enumerate(SHOTS):
    slot_end = t + bars * BAR
    n = frames(t, slot_end); dur = n / FPS
    start = marks[name] + off
    scale = f"scale={SW}:{SH}:flags=neighbor" if not wide else f"scale={SW}:{SH}"
    run(['-ss', f'{start:.3f}', '-t', f'{src:.3f}', '-i', f'{raw}/{name}.webm', '-vf',
         f"setpts=(PTS-STARTPTS)*{dur/src:.5f},fps={FPS},tpad=stop_mode=clone:stop_duration=3,{scale},eq=saturation=1.08:contrast=1.03,{caption(cap, dur)}",
         '-frames:v', str(n), *ENC, f'{W}/seg-{MODE}/{i+1:02d}-{name}.mp4'])
    segs.append(f'{i+1:02d}-{name}.mp4'); t = slot_end
# end card: remaining bars to 30
end_len = 30 * BAR - t; n = frames(t, 30 * BAR)
run(['-f', 'lavfi', '-i', f'color=c=0x120d24:s={SW}x{SH}:r={FPS}', '-loop', '1', '-i', f'{BRAND}/logo-light-transparent.png',
     '-filter_complex',
     f"[1]scale={logo_w}:-1:flags=neighbor,format=rgba,fade=in:st=0.2:d=0.5:alpha=1[l];"
     f"[0]vignette=PI/4[b];[b][l]overlay=(W-w)/2:(H-h)/2-{150 if wide else 220}[v];"
     f"[v]drawtext=fontfile={PX}:text='Play free at':fontsize={36 if wide else 40}:fontcolor=0xF4ECD8:x=(w-text_w)/2:y=h/2+{130 if wide else 80}:alpha='min(1\\,max(0\\,(t-1.0)/0.4))',"
     f"drawtext=fontfile={PX}:text='dragonvision.online':fontsize={60 if wide else 50}:fontcolor=0xFFD166:x=(w-text_w)/2:y=h/2+{200 if wide else 160}:alpha='min(1\\,max(0\\,(t-1.5)/0.4))',"
     f"drawtext=fontfile={VT}:text='A NinefoldVision™ game':fontsize={56 if wide else 62}:fontcolor=0xB9B0D6:x=(w-text_w)/2:y=h/2+{320 if wide else 290}:alpha='min(1\\,max(0\\,(t-2.4)/0.5))',"
     f"fade=in:st=0:d=0.2,fade=out:st={end_len-2.2:.2f}:d=2.2",
     '-frames:v', str(n), *ENC, f'{W}/seg-{MODE}/99-end.mp4'])
segs.append('99-end.mp4')
with open(f'{W}/seg-{MODE}/list.txt', 'w') as f:
    f.writelines(f"file '{s}'\n" for s in segs)
out = f'{W}/dragonvision-trailer{"" if wide else "-vertical"}.mp4'
run(['-f', 'concat', '-safe', '0', '-i', f'{W}/seg-{MODE}/list.txt', '-i', f'{W}/music.wav',
     '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out])
print(out)
