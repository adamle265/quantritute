import json,subprocess
m=json.load(open("mix.json")); T=m["total"]; S1=m["SW"]; S5=m["SE"]
inputs=["-i","music.wav"]; f=[]
vol=(f"if(lt(t,4.4),0.6,if(lt(t,5.3),0.6-(t-4.4)/0.9*0.43,if(lt(t,{S5}),0.17,if(lt(t,{S5+0.8}),0.17+(t-{S5})/0.8*0.33,0.5))))")
f.append(f"[0:a]atrim=0:{T},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,volume='{vol}':eval=frame,afade=t=out:st={S5+4.9}:d={T-S5-4.9}[m]")
labs=["[m]"]
for i,(src,st,v) in enumerate(m["mix"],1):
    inputs+=["-i",src]; d=int(st*1000)
    f.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={v},adelay={d}|{d}[a{i}]"); labs.append(f"[a{i}]")
f.append("".join(labs)+f"amix=inputs={len(labs)}:normalize=0:duration=first,atrim=0:{T}[mx]")
subprocess.run(["ffmpeg","-v","error","-y",*inputs,"-filter_complex",";".join(f),"-map","[mx]","-c:a","pcm_s16le","mix_v02.wav"],check=True)
