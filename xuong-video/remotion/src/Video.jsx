import React from "react";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource/be-vietnam-pro/800.css";
import "@fontsource/lora/500-italic.css";
import {
  AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring, Easing,
} from "remotion";
import data from "./data.json";

const C = {
  bg: "#120d09", amber: "#f2b866", amberDeep: "#d9923c", cream: "#fbeedb", text: "#f7efe3", muted: "#c9b79f",
};
const FONT = "'Be Vietnam Pro', sans-serif";
const SERIF = "'Lora', serif";

// Cấu hình demo: toạ độ tính theo pixel ảnh chụp (rộng 1080)
const DEMO = {
  "tra-cuu": { img: "demo/tra-cuu.png", from: 180, to: 1350, hl: { x: 270, y: 1408, w: 225, h: 70, at: 0.12, until: 0.75 } },
  "dong-thoi-gian": { img: "demo/dong-thoi-gian.png", from: 1050, to: 2150 },
  "doi-chieu": { img: "demo/doi-chieu.png", from: 1100, to: 2050 },
  "tu-van-ban": { img: "demo/tu-van-ban.png", img2: "demo/tu-van-ban-tim.png", swap: 0.4, from: 300, to: 1300 },
  "xem-goc": { img: "demo/tra-cuu.png", from: 820, to: 870, hl: { x: 820, y: 1232, w: 195, h: 72, at: 0.15, until: 1 } },
};

const CARD = { x: 140, y: 390, w: 800, h: 990, r: 46 };

const LampBg = ({ intro }) => {
  const f = useCurrentFrame();
  // bật đèn ở đầu video: chập chờn rồi sáng hẳn
  let on = 1;
  if (intro) {
    const flick = [0, 0, 0.6, 0.1, 0.9, 0.3, 1];
    const i = Math.min(flick.length - 1, Math.floor(f / 3));
    on = f < 21 ? flick[i] : 1;
  }
  const breathe = 0.92 + 0.08 * Math.sin(f / 40);
  const a = on * breathe;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse 70% 45% at 50% -4%, rgba(255,198,120,${0.55 * a}) 0%, rgba(240,160,80,${0.18 * a}) 45%, rgba(0,0,0,0) 75%)`,
      }} />
      <AbsoluteFill style={{
        background: "radial-gradient(ellipse 120% 80% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
      }} />
      {/* đèn */}
      <div style={{ position: "absolute", left: 540 - 2, top: 0, width: 4, height: 34, background: "#3a2c1e" }} />
      <div style={{
        position: "absolute", left: 540 - 70, top: 30, width: 140, height: 46, borderRadius: "70px 70px 10px 10px",
        background: "linear-gradient(#4a3826,#2a1f15)", boxShadow: `0 18px 60px rgba(255,190,110,${0.7 * a})`,
      }} />
      <div style={{
        position: "absolute", left: 540 - 50, top: 70, width: 100, height: 14, borderRadius: 10,
        background: `rgba(255,224,170,${0.95 * a})`, filter: "blur(2px)",
      }} />
      {/* bụi sáng */}
      {[...Array(14)].map((_, i) => {
        const x = (i * 137) % 1080, y0 = (i * 263) % 1920;
        const y = (y0 - f * (0.4 + (i % 3) * 0.2)) % 1920;
        return <div key={i} style={{
          position: "absolute", left: x, top: y < 0 ? y + 1920 : y, width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2,
          borderRadius: 10, background: "rgba(255,210,150,0.35)", filter: "blur(1px)", opacity: a * (0.4 + 0.6 * Math.abs(Math.sin(f / 30 + i))),
        }} />;
      })}
    </AbsoluteFill>
  );
};

const Header = () => (
  <div style={{ position: "absolute", top: 120, left: 70, right: 70, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <Img src={staticFile("brand/logo-ngang-nen-toi-2000.png")} style={{ width: 330 }} />
    <div style={{
      fontFamily: FONT, fontWeight: 700, fontSize: 30, color: "#2a1d10", background: C.amber,
      padding: "10px 24px", borderRadius: 40, boxShadow: "0 6px 24px rgba(242,184,102,0.35)",
    }}>{data.nhan_tren_hinh}</div>
  </div>
);

const useEnter = (delay = 0) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping: 18, stiffness: 120 } });
};

const Dom = ({ pose, x, y, size, delay = 4 }) => {
  const f = useCurrentFrame();
  const e = useEnter(delay);
  const fl = Math.sin(f / 14) * 12;
  const rot = Math.sin(f / 22) * 3;
  return (
    <div style={{ position: "absolute", left: x, top: y + fl + (1 - e) * 60, width: size, height: size, opacity: e, transform: `scale(${0.7 + 0.3 * e}) rotate(${rot}deg)` }}>
      <div style={{ position: "absolute", inset: "18%", borderRadius: "50%", background: "rgba(255,190,110,0.45)", filter: "blur(40px)", opacity: 0.8 + 0.2 * Math.sin(f / 10) }} />
      <Img src={staticFile(`dom/${pose}-toi.png`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    </div>
  );
};

const TitleChip = ({ text, top = 260 }) => {
  const e = useEnter(2);
  return (
    <div style={{
      position: "absolute", top, left: 0, right: 0, textAlign: "center", opacity: e, transform: `translateY(${(1 - e) * 20}px)`,
      fontFamily: FONT, fontWeight: 800, fontSize: 50, color: C.cream, letterSpacing: -0.5, textShadow: "0 4px 30px rgba(0,0,0,0.6)",
      whiteSpace: "pre-line", lineHeight: 1.2, padding: "0 60px",
    }}>{text}</div>
  );
};

const PhoneCard = ({ cfg, dur }) => {
  const f = useCurrentFrame();
  const e = useEnter(0);
  const p = interpolate(f, [8, dur - 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const scale = CARD.w / 1080;
  const y = cfg.from + (cfg.to - cfg.from) * p;
  const swap = cfg.img2 ? interpolate(p, [cfg.swap - 0.05, cfg.swap + 0.05], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const hl = cfg.hl;
  const hlOn = hl ? interpolate(p, [hl.at, hl.at + 0.06, hl.until - 0.05, hl.until], [0, 1, 1, hl.until >= 1 ? 1 : 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  return (
    <div style={{
      position: "absolute", left: CARD.x, top: CARD.y + (1 - e) * 80, width: CARD.w, height: CARD.h, borderRadius: CARD.r,
      overflow: "hidden", opacity: e, background: "#fff",
      boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 10px rgba(255,214,160,0.12), 0 0 80px rgba(255,190,110,0.18)",
    }}>
      <div style={{ position: "absolute", left: 0, top: -y * scale, width: CARD.w }}>
        <Img src={staticFile(cfg.img)} style={{ width: CARD.w, display: "block" }} />
        {cfg.img2 && <Img src={staticFile(cfg.img2)} style={{ position: "absolute", left: 0, top: 0, width: CARD.w, opacity: swap }} />}
        {hl && <div style={{
          position: "absolute", left: hl.x * scale - 8, top: hl.y * scale - 8, width: hl.w * scale + 16, height: hl.h * scale + 16,
          border: `5px solid ${C.amberDeep}`, borderRadius: 18, opacity: hlOn,
          boxShadow: `0 0 0 ${6 + 4 * Math.sin(f / 5)}px rgba(242,184,102,0.35)`,
        }} />}
      </div>
    </div>
  );
};

const chunks = (text) => {
  const parts = text.match(/[^,.?!:]+[,.?!:]?/g).map((s) => s.trim()).filter(Boolean);
  const out = [];
  for (const p of parts) {
    const w = p.split(" ");
    if (w.length > 9) { const m = Math.ceil(w.length / 2); out.push(w.slice(0, m).join(" "), w.slice(m).join(" ")); }
    else out.push(p);
  }
  return out;
};

const Subtitle = ({ c }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps - c.lead;
  const cs = chunks(c.loi);
  const total = cs.reduce((s, x) => s + x.length, 0);
  let acc = 0, cur = cs[cs.length - 1];
  for (const x of cs) { const end = (acc + x.length) / total * c.audioSec; if (t < end) { cur = x; break; } acc += x.length; }
  if (t < 0) cur = cs[0];
  return (
    <div style={{ position: "absolute", left: c.loai === "mo" || c.loai === "ket" ? 70 : 290, right: 130, top: c.loai === "mo" || c.loai === "ket" ? 1520 : 1450, display: "flex", justifyContent: "center" }}>
      <div style={{
        fontFamily: FONT, fontWeight: 700, fontSize: 48, lineHeight: 1.3, color: "#fff", textAlign: "center",
        background: "rgba(18,13,9,0.72)", padding: "16px 30px", borderRadius: 24, border: "1px solid rgba(242,184,102,0.25)",
      }}>{cur}</div>
    </div>
  );
};

const Scene = ({ c }) => {
  const f = useCurrentFrame();
  const e = useEnter(4);
  const fadeIn = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(f, [c.frames - 6, c.frames], [1, 0], { extrapolateLeft: "clamp" });
  const op = c.loai === "ket" ? fadeIn : fadeIn * fadeOut;
  let body = null;
  if (c.loai === "mo") {
    body = <>
      <div style={{
        position: "absolute", top: 520, left: 60, right: 60, textAlign: "center", fontFamily: FONT, fontWeight: 800,
        fontSize: 92, lineHeight: 1.12, color: C.cream, letterSpacing: -1.5, textShadow: "0 6px 40px rgba(0,0,0,0.6)",
      }}>Văn bản thuế<br /><span style={{ color: C.amber }}>sửa liên tục…</span></div>
      <div style={{ position: "absolute", top: 790, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 46, color: C.muted }}>
        Quy định anh/chị đang dùng<br />còn hiệu lực không?
      </div>
      <Dom pose={c.dom} x={290} y={960} size={500} delay={10} />
    </>;
  } else if (c.loai === "gioi-thieu") {
    body = <>
      <TitleChip text={c.chu} top={235} />
      <PhoneCard cfg={{ img: "demo/home.png", from: 0, to: 330 }} dur={c.frames} />
      <Dom pose={c.dom} x={0} y={1250} size={300} delay={12} />
    </>;
  } else if (c.loai === "demo" || c.loai === "luu-y") {
    const cfg = DEMO[c.loai === "luu-y" ? "xem-goc" : c.demo];
    body = <>
      <TitleChip text={c.loai === "luu-y" ? "⚠ " + c.chu : c.chu} top={c.loai === "luu-y" ? 235 : 290} />
      <PhoneCard cfg={cfg} dur={c.frames} />
      <Dom pose={c.dom} x={0} y={1250} size={300} delay={8} />
    </>;
  } else if (c.loai === "ket") {
    body = <>
      <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: e }}>
        <Img src={staticFile("brand/logo-mark-nen-toi-1024.png")} style={{ width: 300, borderRadius: 40, filter: "drop-shadow(0 0 60px rgba(255,190,110,0.5))" }} />
      </div>
      <div style={{ position: "absolute", top: 740, left: 60, right: 60, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 64, color: C.cream, opacity: e }}>
        Link công cụ ở hồ sơ kênh
      </div>
      <div style={{ position: "absolute", top: 850, left: 60, right: 60, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 44, color: C.amber, opacity: e }}>
        Quản trị lấy Con người làm gốc
      </div>
      <Dom pose={c.dom} x={330} y={1000} size={420} delay={10} />
    </>;
  }
  return (
    <AbsoluteFill style={{ opacity: op }}>
      {body}
      <Subtitle c={c} />
      {c.audio && <Sequence from={Math.round(c.lead * 30)}><Audio src={staticFile(c.audio)} /></Sequence>}
    </AbsoluteFill>
  );
};

export const Video = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <LampBg intro />
      <Header />
      {data.canh.map((c) => (
        <Sequence key={c.id} from={c.from} durationInFrames={c.frames}>
          <Scene c={c} />
        </Sequence>
      ))}
      <Audio src={staticFile("nhac.wav")} volume={(fr) => interpolate(fr, [0, 30, data.total - 45, data.total], [0, 0.12, 0.12, 0], { extrapolateRight: "clamp" })} />
    </AbsoluteFill>
  );
};
