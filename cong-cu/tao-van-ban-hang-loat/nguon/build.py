import base64, re, os, json
B = os.path.dirname(os.path.abspath(__file__))
NM = os.path.join(B, 'node_modules')
rd = lambda p: open(p, encoding='utf-8').read()

def ui_fonts():
    out = []
    for pkg, weights in [('lexend', ['400', '500', '600']), ('ibm-plex-mono', ['400', '500'])]:
        for w in weights:
            css = rd(f'{NM}/@fontsource/{pkg}/{w}.css')
            for block in re.findall(r'@font-face\s*\{[^}]*\}', css):
                m = re.search(r'url\(\./files/([^)]+?-(latin|vietnamese)-\d+-normal\.woff2)\)', block)
                if not m or 'latin-ext' in block: continue
                if re.search(r'-latin-ext-', block): continue
                data = base64.b64encode(open(f'{NM}/@fontsource/{pkg}/files/{m.group(1)}', 'rb').read()).decode()
                fam = 'Lexend' if pkg == 'lexend' else 'IBM Plex Mono'
                ur = re.search(r'unicode-range:\s*([^;]+);', block).group(1)
                out.append(f"@font-face{{font-family:'{fam}';font-style:normal;font-display:swap;font-weight:{w};src:url(data:font/woff2;base64,{data}) format('woff2');unicode-range:{ur};}}")
    return '\n'.join(out)

LIBS = ['xlsx/dist/xlsx.core.min.js', 'jszip/dist/jszip.min.js', 'pdfjs-dist/build/pdf.worker.min.js', 'pdfjs-dist/build/pdf.min.js',
        'pdf-lib/dist/pdf-lib.min.js', '@pdf-lib/fontkit/dist/fontkit.umd.min.js', 'docx-preview/dist/docx-preview.min.js', 'html2canvas/dist/html2canvas.min.js']
def libs():
    parts = []
    for l in LIBS:
        s = rd(f'{NM}/{l}').replace('</script', '<\\/script').replace('<!--', '<\\!--')
        parts.append(f'/* {l} */\n' + s + '\n;')
    return '\n'.join(parts)

def fontdata():
    m = {}
    for k, f in [('serifr', 'LiberationSerif-Regular'), ('serifb', 'LiberationSerif-Bold'), ('serifi', 'LiberationSerif-Italic'),
                 ('sansr', 'LiberationSans-Regular'), ('sansb', 'LiberationSans-Bold'), ('sansi', 'LiberationSans-Italic'), ('serifbi', 'LiberationSerif-BoldItalic'), ('sansbi', 'LiberationSans-BoldItalic')]:
        m[k] = base64.b64encode(open(f'{B}/fonts/{f}.ttf', 'rb').read()).decode()
    smp = {k: base64.b64encode(open(f'{B}/samples/{f}', 'rb').read()).decode() for k, f in [('docx', 'mau-phieu-luong.docx'), ('xlsx', 'mau-phieu-luong.xlsx'), ('list', 'danh-sach-luong-mau.xlsx')]}
    return 'const FONTDATA=' + json.dumps(m) + ';\nconst SAMPLES=' + json.dumps(smp) + ';'

js = '\n'.join(rd(f'{B}/src/{f}') for f in ['core.js', 'ui.js', 'ui2.js'])
html = rd(f'{B}/src/app.html')
for key, val in [('/*UIFONTS*/', ui_fonts()), ('/*CSS*/', rd(f'{B}/src/app.css')), ('/*LIBS*/', libs()), ('/*FONTDATA*/', fontdata()), ('/*JS*/', js)]:
    assert html.count(key) == 1, key
    html = html.replace(key, lambda m=None, v=val: v) if False else html.replace(key, val.replace('\\', '\\\\') if False else val)
os.makedirs(f'{B}/dist', exist_ok=True)
open(f'{B}/dist/index.html', 'w', encoding='utf-8').write(html)
print('size', round(len(html.encode()) / 1048576, 2), 'MB')
