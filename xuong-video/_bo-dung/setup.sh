#!/bin/bash
# Dựng môi trường làm video trên máy chủ đám mây – 1 lệnh.
# Dùng: bash setup.sh v09 "DÒNG 1 TIÊU ĐỀ|DÒNG 2"   (chạy trong thư mục đã giải nén bo-dung)
# Kết quả: /home/claude/w/<mã>/ có rec/ (mã quay mẫu), dung/ (mã dựng mẫu + hf/assets đủ phông, gsap, Đốm, sfx), md/ (mở đầu + kết đã render), thumb/
set -e
V=${1:?Thiếu mã video, vd v09}; TTL=${2:-"TIÊU ĐỀ|VIDEO"}
S=$(cd "$(dirname "$0")" && pwd); W=/home/claude/w; mkdir -p $W/brand $W/$V/{rec/site,gia,giong,thumb,md/assets/{img,fonts},dung/{hf/assets/{img,a,v,fonts},sfx}}
cp -r --update=none $S/assets/brand/* $W/brand/
# npm (hyperframes, gsap, phông)
if [ ! -d $W/npm/node_modules/hyperframes ]; then mkdir -p $W/npm && cd $W/npm && npm init -y >/dev/null && npm i -s hyperframes@0.8.147 gsap@3 @fontsource/lexend @fontsource/patrick-hand @fontsource/be-vietnam-pro @fontsource/ibm-plex-mono @fontsource/lora >/dev/null 2>&1; fi
python3 -c "import soundfile" 2>/dev/null || pip install --break-system-packages -q soundfile
N=$W/npm/node_modules; FB=$N/@fontsource/be-vietnam-pro/files; FL=$N/@fontsource/lora/files
# mã mẫu (đổi đường dẫn v08 -> mã mới)
for f in rec_lib.py chrome.py rec_v08.py; do sed "s#/w/v08/#/w/$V/#g" $S/mau/$f > $W/$V/rec/${f/v08/$V}; done
for f in build_v08.py mix_v08.py template.html; do sed "s#/w/v08/#/w/$V/#g" $S/mau/$f > $W/$V/dung/${f/v08/$V}; done
sed "s#/w/v08/#/w/$V/#g" $S/mau/thumb_mk.py > $W/$V/thumb/mk.py; sed "s#/w/v08/#/w/$V/#g" $S/mau/thumb_shot.py > $W/$V/thumb/shot.py
cp $N/@fontsource/lexend/files/lexend-{vietnamese,latin}-700-normal.woff2 $W/$V/thumb/
# hf assets
H=$W/$V/dung/hf/assets; cp $N/gsap/dist/gsap.min.js $H/; cp $FB/be-vietnam-pro-{vietnamese,latin}-{400,700,800}-normal.woff2 $FL/lora-{vietnamese,latin}-500-italic.woff2 $H/fonts/
cp $S/assets/brand/dom/*-toi.png $H/img/; python3 $S/scripts/tao_sfx.py $W/$V/dung/sfx 5 >/dev/null
# mở đầu + kết
M=$W/$V/md; cp $S/mo-dau/mo-dau.css $N/gsap/dist/gsap.min.js $M/assets/; cp $H/fonts/* $M/assets/fonts/
cp $S/assets/site/public/assets/desk-off.jpg $S/assets/site/public/assets/desk-on.jpg $S/assets/site/public/assets/screen/bo-cong-cu.jpg $S/assets/brand/logo-dom/*.png $M/assets/img/
for d in dom-01-chao-sang dom-10-vui-sang dom-12-ngu-toi dom-21-cam-on-sang dom-23-tam-biet-sang; do cp $S/assets/brand/dom/$d.png $M/assets/img/; done
python3 $S/mo-dau/dung_mo_dau.py "$TTL" $M >/dev/null   # tạo ket.html (index.html của script còn chữ quantritute.com -> thay bằng mẫu)
python3 - "$S/mo-dau/md-mau.html" "$M/index.html" "$TTL" <<'PY'
import sys; s=open(sys.argv[1],encoding='utf-8').read(); t=sys.argv[3].replace('|','<br>')
s=s.replace('TẠO TỜ KHAI 01/GTGT<br>TỰ ĐỘNG',t); open(sys.argv[2],'w',encoding='utf-8').write(s)
PY
export HYPERFRAMES_BROWSER_PATH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
cd $M && $N/.bin/hyperframes render -q high -w 2 -o mo-dau.mp4 >r1.log 2>&1
mkdir -p k && cp -r assets k/ && cp ket.html k/index.html && cd k && $N/.bin/hyperframes render -q high -w 2 -o ../ket.mp4 >../r2.log 2>&1
cp $M/mo-dau.mp4 $M/ket.mp4 $W/$V/dung/hf/assets/v/
echo "XONG: /home/claude/w/$V  (cỡ chữ tiêu đề: sửa style=\"font-size:72px\" trong md/index.html rồi render lại nếu tràn)"
