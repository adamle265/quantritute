import json,subprocess,os
H=os.path.expanduser("~")
m=json.load(open(H+"/work/b4/mix.json")); T=m["total"]; S5=m["S5"]; D0=m["D0"]
def P(p):
    if p.startswith("sfx/"): return H+"/work/b4/"+p
    return p
inputs=["-i",H+"/work/b4/music.wav"]; f=[]
vol=(f"if(lt(t,4.4),0.6,if(lt(t,5.3),0.6-(t-4.4)/0.9*0.48,if(lt(t,{D0-0.4}),0.12,if(lt(t,{D0+0.2}),0.12+(t-{D0-0.4})/0.6*0.16,if(lt(t,{S5}),0.28,if(lt(t,{S5+0.8}),0.28+(t-{S5})/0.8*0.22,0.5))))))")
f.append(f"[0:a]atrim=0:{T},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,volume='{vol}':eval=frame,afade=t=out:st={S5+4.9}:d={T-S5-4.9}[m]")
labs=["[m]"]
for i,(src,st,v) in enumerate(m["mix"],1):
    inputs+=["-i",P(src)]; d=int(st*1000)
    f.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={v},adelay={d}|{d}[a{i}]"); labs.append(f"[a{i}]")
f.append("".join(labs)+f"amix=inputs={len(labs)}:normalize=0:duration=first,atrim=0:{T},loudnorm=I=-14:TP=-1.5:LRA=11[mx]")
subprocess.run(["ffmpeg","-v","error","-y",*inputs,"-filter_complex",";".join(f),"-map","[mx]","-ar","48000","-c:a","pcm_s16le",H+"/work/b4/mix.wav"],check=True)
print("mix ok",len(m["mix"]))
