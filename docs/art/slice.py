# 把 GPT 3x3 元件表切成單張去背 WebP（演算法同 Gemini 的洋紅去背）
# 用法：python3 docs/art/slice.py docs/art images/garden（需要 numpy、Pillow、scipy）
import sys, numpy as np
from PIL import Image
def unmagenta(a):
    a = a.astype(np.int32); r,g,b = a[...,0],a[...,1],a[...,2]; al = np.full(r.shape,255,np.int32)
    m = np.minimum(r,b)-g
    full = (m>95)&(r>140)&(b>140); al[full]=0
    part = (~full)&(m>35)&(r>120)&(b>120)
    # 只處理和外框相連的洋紅（避免把會幕的粉紅地板等內部顏色也去掉）
    from scipy import ndimage
    lab,_ = ndimage.label(full|part); keep = set(np.unique(lab[full])) - {0}   # 柔邊只在含純洋紅的區塊裡處理
    part &= np.isin(lab, list(keep)); al[:] = 255; al[full] = 0
    k = np.clip(1-(m-35)/60,0,1); al = np.where(part,(al*k).round().astype(np.int32),al)
    neu = (r+b)*0.35; cap = neu+g*0.4
    r2 = np.where(part,np.minimum(r,cap),r); b2 = np.where(part,np.minimum(b,cap),b)
    return np.dstack([r2,g,b2,al]).clip(0,255).astype(np.uint8)
def run(src, prefix, outdir, maxside):
    im = np.array(Image.open(src).convert('RGB')); H,W = im.shape[:2]; cw,ch = W//3,H//3; i=0
    for rr in range(3):
        for cc in range(3):
            i+=1; cell = unmagenta(im[rr*ch:(rr+1)*ch, cc*cw:(cc+1)*cw])
            ys,xs = np.where(cell[...,3]>18); cell = cell[ys.min():ys.max()+1, xs.min():xs.max()+1]
            img = Image.fromarray(cell,'RGBA'); s = min(1, maxside/max(img.size))
            if s<1: img = img.resize((round(img.width*s),round(img.height*s)), Image.LANCZOS)
            p = f'{outdir}/{prefix}{i:02d}.webp'; img.save(p,'WEBP',quality=88,method=6); print(p, img.size)
art = sys.argv[1]; out = sys.argv[2]
run(f'{art}/gpt-buildings-1.png','b1-',out,400); run(f'{art}/gpt-buildings-2.png','b2-',out,400); run(f'{art}/gpt-characters-1.png','c-',out,200)
