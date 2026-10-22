import numpy as np, soundfile as sf
SR=48000; rng=np.random.default_rng(3)
def env(n,a,d): t=np.arange(n)/SR; return np.minimum(t/a,1)*np.exp(-t/d)
def save(name,x,peak=0.9): x=x/(np.max(np.abs(x))+1e-9)*peak; sf.write(f"sfx/{name}.wav",x.astype(np.float32),SR)
n=int(0.08*SR);t=np.arange(n)/SR; save("tap",(np.sin(2*np.pi*1800*t)*0.6+rng.standard_normal(n)*0.25)*env(n,0.001,0.012),0.6)
n=int(0.12*SR);t=np.arange(n)/SR; save("click",(np.sin(2*np.pi*900*t)*0.5+rng.standard_normal(n)*0.5)*env(n,0.0005,0.01),0.7)
n=int(0.6*SR);t=np.arange(n)/SR; w=rng.standard_normal(n);W=np.fft.rfft(w);f=np.fft.rfftfreq(n,1/SR)
w=np.fft.irfft(W*np.exp(-((f-2500)/1800)**2),n)*np.sin(np.pi*t/t[-1])**2; save("whoosh",w,0.35)
n=int(0.18*SR);t=np.arange(n)/SR; save("pop",np.sin(2*np.pi*(500+900*t/t[-1])*t)*env(n,0.003,0.05),0.5)
n=int(1.6*SR);t=np.arange(n)/SR
sp=sum(np.sin(2*np.pi*fq*t+ph)*a*np.exp(-t*dk) for fq,a,dk,ph in [(1568,1,2.2,0),(2093,.6,2.6,1),(2637,.4,3,2),(3136,.25,3.5,.5)])*np.minimum(t/0.01,1)
save("sparkle",sp,0.35)
