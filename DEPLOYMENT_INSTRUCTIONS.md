# 🚀 تعليمات نشر Koorax على Cloudflare Pages

## ⚠️ ملاحظة مهمة
بسبب القيود الجغرافية على API Token، يجب نشر التطبيق يدوياً عبر Cloudflare Dashboard.

---

## 📋 خطوات النشر اليدوي

### 1️⃣ رفع الكود إلى GitHub
```bash
cd /home/user/webapp
git add -A
git commit -m "Ready for Cloudflare deployment"
git push origin main
```

### 2️⃣ إنشاء مشروع Cloudflare Pages جديد
1. افتح [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. اذهب إلى **Pages** من القائمة الجانبية
3. اضغط على **Create a project**
4. اختر **Connect to Git**

### 3️⃣ ربط المستودع
1. اختر GitHub
2. صرح لـ Cloudflare بالوصول إلى المستودع
3. اختر `koorax-project` من القائمة

### 4️⃣ إعدادات البناء
أدخل الإعدادات التالية:

- **Project name**: `koorax` (أو أي اسم متاح)
- **Production branch**: `main`
- **Framework preset**: None
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`

### 5️⃣ متغيرات البيئة (Environment Variables)
أضف المتغيرات التالية في قسم **Environment Variables**:

| Variable Name | Value |
|--------------|-------|
| `FOOTBALL_API_TOKEN` | `79312930c9804b81a10b12dcf14da7fb` |
| `NODE_VERSION` | `18` |

### 6️⃣ إطلاق النشر
1. اضغط على **Save and Deploy**
2. انتظر حتى ينتهي البناء (2-3 دقائق)
3. ستحصل على رابط مثل: `https://koorax.pages.dev`

---

## 🎯 البيانات المتاحة والقيود

### ✅ البيانات المتوفرة
- النتيجة النهائية
- نتيجة الشوط الأول
- معلومات الفريقين والشعارات
- معلومات البطولة
- اسم الحكم وجنسيته
- توقيت المباراة
- حالة المباراة (مباشر/منتهية/لم تبدأ)
- 15+ بطولة (أوروبية + عربية)
- جداول الترتيب
- جدول الهدافين
- مباريات الجولة الحالية
- معلومات الفرق
- معلومات اللاعبين

### ❌ البيانات غير المتوفرة (تحتاج Premium API)
- التشكيلة (تشكيل الفريق)
- أهداف بالدقائق مع اسم الهداف
- بطاقات بالدقائق مع اسم اللاعب
- تبديلات بالدقائق
- الدقيقة الحالية للمباريات المباشرة
- إحصائيات تفصيلية (تسديدات، ركنيات، إلخ)

**السبب**: Football-Data.org API المجاني يعطي فقط البيانات الأساسية. البيانات المتقدمة تتطلب اشتراك **Tier Plan (Premium)**.

---

## 🔄 التحديثات المستقبلية

بعد النشر الأول، أي تحديثات على `main` branch ستنشر تلقائياً:

1. اعمل التغييرات المطلوبة
2. اعمل commit:
```bash
git add -A
git commit -m "وصف التحديث"
git push origin main
```
3. Cloudflare Pages سيبني ويطلق التحديث تلقائياً

---

## 🎉 مزايا التطبيق الحالية

### ✨ الصفحات
1. **الصفحة الرئيسية** (`/`) - مباريات مباشرة وأهم المباريات
2. **صفحة المباريات** (`/matches`) - جميع المباريات
3. **صفحة البطولات** (`/competitions`) - قائمة البطولات
4. **صفحة تفاصيل البطولة** (`/competitions/:id`) - ترتيب + هدافين + مباريات الجولة
5. **صفحة تفاصيل المباراة** (`/matches/:id`) - معلومات كاملة
6. **صفحة الفريق** (`/teams/:id`) - معلومات وآخر 10 مباريات
7. **صفحة اللاعب** (`/players/:id`) - معلومات اللاعب
8. **صفحة الاختبار** (`/quiz`) - اختبار كرة القدم
9. **صفحة الملف الشخصي** (`/profile`) - ملف المستخدم (محمية)
10. **لوحة التحكم** (`/admin`) - إدارة (محمية)

### 🌍 الدوريات المدعومة (15+)
- 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League
- 🇪🇸 La Liga
- 🇮🇹 Serie A
- 🇩🇪 Bundesliga
- 🇫🇷 Ligue 1
- 🇧🇷 Brasileirão
- 🇦🇷 Liga Profesional
- 🇵🇹 Primeira Liga
- 🇳🇱 Eredivisie
- 🇪🇬 Egyptian Premier League
- 🇸🇦 Saudi Pro League
- 🇦🇪 UAE Gulf League
- 🏆 Champions League
- 🏆 Copa Libertadores
- 🏆 Copa do Brasil

### 🎨 المزايا التقنية
- تصميم متجاوب (Responsive)
- وضع داكن (Dark Mode)
- دعم العربية والإنجليزية
- تحديث تلقائي كل دقيقة
- حفظ بيانات D1 Database
- مصادقة JWT
- لوحة تحكم للمشرفين

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من logs البناء في Cloudflare Dashboard
2. تأكد من إضافة `FOOTBALL_API_TOKEN` في Environment Variables
3. تحقق من أن `main` branch محدث

---

## 🔗 روابط مهمة
- **GitHub**: https://github.com/MahmoudNageeb/koorax-project
- **Sandbox Demo**: https://3000-i8f8s5h0v1yti847hjyjr-b9b802c4.sandbox.novita.ai
- **Cloudflare Dashboard**: https://dash.cloudflare.com/

---

**إصدار**: V35  
**تاريخ التحديث**: 2026-03-03  
**حالة المشروع**: ✅ جاهز للنشر 100%
