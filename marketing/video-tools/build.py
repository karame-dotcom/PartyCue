import json, subprocess, sys
R, E = sys.argv[1], sys.argv[2]
sc = json.load(open(f'{E}/scenes.json'))
parts = []
for s in sc:
    out = f"{E}/{s['id']}.mp4"; d = s['dur']
    if s['src'] == 'cta':
        vf = f"[0:v]scale=1080:1920,zoompan=z='1+0.0008*on':d={int(d*30)}:s=1080x1920:fps=30,format=yuv420p[v]"
        cmd = ['ffmpeg','-y','-loglevel','error','-loop','1','-t',str(d),'-i',f"{E}/{s['id']}.png",'-filter_complex',vf]
    else:
        src = f"{R}/{'tvf' if s['src']=='tv' else 'phf'}.mp4"
        if s['src']=='tv': sz, x, y = '1020:574', 30, 900
        else: sz, x, y = '586:1268', 247, 560
        vf = (f"[1:v]trim=start={s['in']}:duration={d},setpts=PTS-STARTPTS,fps=30,scale={sz}:flags=lanczos[c];"
              f"[0:v][c]overlay={x}:{y}:shortest=1,format=yuv420p[v]")
        cmd = ['ffmpeg','-y','-loglevel','error','-loop','1','-framerate','30','-t',str(d),'-i',f"{E}/{s['id']}.png",'-i',src,'-filter_complex',vf]
    cmd += ['-map','[v]','-t',str(d),'-r','30','-c:v','libx264','-preset','medium','-crf','18','-an',out]
    subprocess.run(cmd, check=True); parts.append(out)
open(f'{E}/list.txt','w').write(''.join(f"file '{p}'\n" for p in parts))
subprocess.run(['ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',f'{E}/list.txt','-c:v','copy',f'{E}/video_only.mp4'], check=True)
for wav, out in [('audio_full.wav','partycue_demo_9x16.mp4'), ('audio_sfx.wav','partycue_demo_9x16_sfx_only.mp4')]:
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f'{E}/video_only.mp4','-i',f'{E}/{wav}','-map','0:v','-map','1:a',
      '-c:v','copy','-af','loudnorm=I=-14:TP=-1.5:LRA=11','-ar','44100','-c:a','aac','-b:a','192k','-ac','2','-shortest','-movflags','+faststart',f'{E}/{out}'], check=True)
