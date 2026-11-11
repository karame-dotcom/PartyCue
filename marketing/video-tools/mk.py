import json, subprocess, sys
name = sys.argv[1]
fr = json.load(open(f'{name}.json'))
lines = ['ffconcat version 1.0']
prev_t = 0.0
for i, f in enumerate(fr):
    nxt = fr[i+1]['t'] if i+1 < len(fr) else f['t'] + 0.5
    start = 0.0 if i == 0 else f['t']
    lines.append(f"file '{f['file']}'"); lines.append(f"duration {max(nxt-start,0.001):.4f}")
lines.append(f"file '{fr[-1]['file']}'")
open(f'{name}.txt','w').write('\n'.join(lines)+'\n')
subprocess.run(['ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',f'{name}.txt','-vf','fps=30,format=yuv420p',
  '-c:v','libx264','-crf','14','-preset','medium',f'{name}.mp4'],check=True)
