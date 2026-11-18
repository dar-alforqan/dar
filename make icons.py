# يولّد أيقونات الـ PWA من icon.png
# الاستخدام: ضع icon.png بجانب هذا الملف ثم شغّل: python make_icons.py
# المتطلبات: pip install pillow
import os
import sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "icon.png")
BG = (58, 24, 30, 255)   # لون الدار #3A181E

if not os.path.exists(SRC):
    sys.exit("لم أجد icon.png بجانب السكربت. ضعه في نفس المجلد ثم أعد التشغيل.")

def out(name):
    return os.path.join(HERE, name)

img = Image.open(SRC).convert("RGBA")
size = max(img.size)
sq = Image.new("RGBA", (size, size), (0, 0, 0, 0))
sq.paste(img, ((size - img.width) // 2, (size - img.height) // 2))

# أيقونات عادية
for s in (192, 512):
    sq.resize((s, s), Image.LANCZOS).save(out(f"icon-{s}.png"))

# أيقونة maskable: الشعار داخل المنطقة الآمنة (70%) فوق خلفية بلون الدار
m = Image.new("RGBA", (512, 512), BG)
inner = sq.resize((358, 358), Image.LANCZOS)
m.paste(inner, ((512 - 358) // 2, (512 - 358) // 2), inner)
m.save(out("icon-maskable-512.png"))

# أيقونة آيفون (مربعة بدون شفافية)
a = Image.new("RGBA", (180, 180), BG)
inner = sq.resize((150, 150), Image.LANCZOS)
a.paste(inner, (15, 15), inner)
a.convert("RGB").save(out("icon-180.png"))
print("تم إنشاء: icon-192.png, icon-512.png, icon-maskable-512.png, icon-180.png")
