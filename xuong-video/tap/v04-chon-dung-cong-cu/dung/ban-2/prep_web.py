import json, subprocess, os
H = os.path.expanduser("~"); RD = f"{H}/work/b4/rec"; AV = f"{H}/work/hf-body/assets/v"
M = json.load(open(f"{RD}/marks.json"))
def pieces(src, cs, vs):
    out = []
    for i in range(len(cs) - 1):
        c0, c1, v0, v1 = cs[i], cs[i+1], vs[i], vs[i+1]
        out.append((src, c0, c1, (v1 - v0) / (c1 - c0)))
        print(f"  {os.path.basename(src)} {c0}-{c1} -> {v0}-{v1}  tua x{(c1-c0)/(v1-v0):.2f}")
    return out
def render(name, plist, pad, xf=None):
    ins = []; fl = []; idx = {}
    for s, *_ in plist:
        if s not in idx: idx[s] = len(ins) // 2; ins += ["-i", f"{RD}/{s}"]
    labs = []
    for k, (s, c0, c1, r) in enumerate(plist):
        fl.append(f"[{idx[s]}:v]trim={c0}:{c1},setpts=(PTS-STARTPTS)*{r:.5f},scale=1000:1134,fps=30,format=yuv420p[p{k}]"); labs.append(f"[p{k}]")
    if xf is None:
        fl.append("".join(labs) + f"concat=n={len(labs)}:v=1:a=0,tpad=start_mode=clone:start_duration=0.6:stop_mode=clone:stop_duration={pad}[o]")
    else:
        n1, off = xf
        fl.append("".join(labs[:n1]) + f"concat=n={n1}:v=1:a=0,settb=1/30[a]")
        fl.append("".join(labs[n1:]) + f"concat=n={len(labs)-n1}:v=1:a=0,settb=1/30[b]")
        fl.append(f"[a][b]xfade=transition=fade:duration=0.3:offset={off},tpad=start_mode=clone:start_duration=0.6:stop_mode=clone:stop_duration={pad}[o]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", ";".join(fl), "-map", "[o]", "-an", "-c:v", "libx264", "-crf", "17", "-preset", "veryfast", "-g", "30", "-keyint_min", "30", "-movflags", "+faststart", f"{AV}/{name}"], check=True)
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"{AV}/{name}"]))
    print(name, round(d, 2))
b = M["b"]; c = M["c"]; d = M["d"]
P1 = pieces("q2-a-tabs.mp4", [0.9, 15.4], [65.5, 77.6]) + pieces("q2-b-noibat.mp4", [1.2, b["cn_mo"], b["vb_mo"], b["free"], 19.0], [77.6, 85.0, 88.3, 91.3, 94.4])
render("web1.mp4", P1, 1.8)
P2 = pieces("q2-c-bangghim.mp4", [0.8, c["vote"], c["dx_mo"], c["dx_ok"], 11.0], [96.5, 97.9, 100.4, 103.4, 104.15]) + pieces("q2-d-gopy.mp4", [0.7, d["gy_mo"], d["gy_ok"], 7.8], [103.85, 105.0, 107.4, 108.7])
render("web2.mp4", P2, 0.8, xf=(4, round(104.15 - 96.5 - 0.3, 3)))
