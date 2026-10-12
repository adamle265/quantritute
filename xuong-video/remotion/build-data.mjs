// Ghép kịch bản + thời lượng giọng → src/data.json cho Remotion.
// node build-data.mjs <thư mục tập> [tên giọng]
import fs from "node:fs";
import path from "node:path";

const tap = process.argv[2];
const kb = JSON.parse(fs.readFileSync(path.join(tap, "kich-ban.json"), "utf8"));
const giong = process.argv[3] || kb.giong_chon;
const tlFile = path.join(tap, "giong", "thoi-luong.json");
const tl = fs.existsSync(tlFile) ? JSON.parse(fs.readFileSync(tlFile, "utf8"))[giong] : null;
const pub = path.resolve("public/giong");
fs.rmSync(pub, { recursive: true, force: true });
fs.mkdirSync(pub, { recursive: true });

const FPS = 30;
const canh = kb.canh.map((c, i) => {
  let audio = null;
  let sec = c.loi.length / 15; // ước lượng khi chưa có giọng
  const src = path.join(tap, "giong", giong, `${c.id}.wav`);
  if (tl && fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(pub, `${c.id}.wav`));
    audio = `giong/${c.id}.wav`;
    sec = tl[c.id];
  }
  const lead = i === 0 ? 0.4 : 0.15;
  const tail = c.loai === "ket" ? 1.8 : 0.45;
  return { ...c, audio, audioSec: sec, lead, frames: Math.round((lead + sec + tail) * FPS) };
});
let from = 0;
for (const c of canh) { c.from = from; from += c.frames; }
fs.writeFileSync("src/data.json", JSON.stringify({ ...kb, giong, fps: FPS, total: from, canh }, null, 2));
console.log(`data.json: ${canh.length} cảnh, ${(from / FPS).toFixed(1)}s, giọng=${tl ? giong : "ƯỚC LƯỢNG"}`);
