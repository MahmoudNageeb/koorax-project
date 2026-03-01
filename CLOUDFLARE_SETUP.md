# 🚀 دليل نشر Koorax على Cloudflare Pages

## المشكلة الحالية
لا يمكن النشر تلقائياً عبر Cloudflare API بسبب قيد جغرافي (Error Code 9109).

## ✅ الحل: النشر اليدوي (5-10 دقائق)

### الخطوة 1️⃣: إعداد Cloudflare Pages
1. افتح [لوحة تحكم Cloudflare](https://dash.cloudflare.com)
2. اذهب إلى **Workers & Pages**
3. اضغط **Create application**
4. اختر **Pages** ← **Connect to Git**

### الخطوة 2️⃣: ربط GitHub
1. سجل دخول بحساب GitHub الخاص بك
2. اختر المستودع: **MahmoudNageeb/koorax-project**
3. اختر الفرع: **main**

### الخطوة 3️⃣: إعدادات البناء
```
Build command:  npm run build
Build output:   dist
Root directory: (leave empty)
```

### الخطوة 4️⃣: متغيرات البيئة
أضف المتغير التالي:
```
FOOTBALL_API_TOKEN = 79312930c9804b81a10b12dcf14da7fb
```

### الخطوة 5️⃣: اضغط Deploy
- انتظر 2-3 دقائق
- ستحصل على رابط مثل: `https://koorax.pages.dev`

---

## 🗄️ إعداد قاعدة البيانات D1

### من لوحة التحكم:
1. اذهب إلى **Storage & Databases** ← **D1**
2. اضغط **Create database**
3. الاسم: `koorax-db`
4. ارجع إلى **Workers & Pages** ← **koorax** ← **Settings** ← **Bindings**
5. اضغط **Add binding**:
   - Variable name: `DB`
   - D1 database: `koorax-db`

### من الترمينال:
```bash
# 1. استنساخ المشروع
git clone https://github.com/MahmoudNageeb/koorax-project.git
cd koorax-project

# 2. تثبيت المكتبات
npm install

# 3. تسجيل الدخول لـ Cloudflare
npx wrangler login

# 4. إنشاء قاعدة البيانات
npx wrangler d1 create koorax-db

# 5. نسخ database_id من الناتج وأضفه في wrangler.jsonc

# 6. تطبيق المهاجرات
npx wrangler d1 migrations apply koorax-db --remote
```

---

## 🔑 بيانات تسجيل الدخول

### حساب المدير:
```
البريد الإلكتروني: TN@gmail.com
كلمة المرور:      K00R@X
الصلاحية:         Administrator
```

---

## 🔗 روابط مهمة

- **GitHub**: https://github.com/MahmoudNageeb/koorax-project
- **Sandbox التجريبي**: https://3000-i8f8s5h0v1yti847hjyjr-b9b802c4.sandbox.novita.ai
- **نسخة احتياطية V33**: https://www.genspark.ai/api/files/s/TC3izZeb

---

## ✨ الميزات الرئيسية

### 🎯 الأساسية:
- ✅ نظام تسجيل الدخول JWT آمن
- ✅ فزورة يومية بمؤقت 60 ثانية
- ✅ نظام نقاط (+10 صحة، -5 مغادرة)
- ✅ حماية صفحة الملف الشخصي (تتطلب تسجيل دخول)

### ⚽ المباريات والبطولات:
- ✅ عرض 87 مباراة (مباشرة/مجدولة/منتهية)
- ✅ تحويل تلقائي للتوقيت حسب موقع المستخدم
- ✅ تفاصيل الفرق الكاملة
- ✅ صفحة تفاصيل المباراة بالأحداث

### 👤 المستخدمين:
- ✅ صفحة ملف شخصي محمية
- ✅ إحصائيات ورسم بياني
- ✅ سجل الإجابات
- ✅ لوحة المتصدرين (Top 10)

### 🛠️ لوحة المدير:
- ✅ إدارة الأسئلة (CRUD)
- ✅ إدارة المستخدمين
- ✅ تحليلات مفصلة

### 🔍 SEO:
- ✅ Meta tags كاملة
- ✅ Open Graph + Twitter Cards
- ✅ Schema.org
- ✅ robots.txt + sitemap.xml

---

## 📊 إحصائيات المشروع

```
حجم الحزمة:     200 KB
سطور الكود:     4,850+
API endpoints:   26+
الصفحات:        6 (1 محمية)
المباريات:      87
البطولات:       12+
Commits:         66+
```

---

## ❌ لماذا لا يعمل النشر التلقائي؟

الخطأ الذي يظهر:
```
Error Code 9109: Cannot use the access token from location: 170.106.202.227
```

**السبب**: Cloudflare يمنع استخدام API Token من مواقع جغرافية معينة لأسباب أمنية.

**الحل**: النشر اليدوي عبر لوحة التحكم (كما هو موضح أعلاه).

---

## ✅ الحالة النهائية

- ✅ الكود على GitHub
- ✅ التطبيق يعمل بكامل الميزات
- ✅ جميع الاختبارات ناجحة
- ✅ صفحة الملف الشخصي محمية
- ✅ 87 مباراة تعمل
- ✅ التوقيت تلقائي
- ✅ SEO كامل

**🎉 المشروع جاهز 100% للنشر!**

---

## 📞 الدعم

في حال واجهت أي مشكلة:
1. راجع ملف [DEPLOYMENT.md](./DEPLOYMENT.md)
2. راجع ملف [README.md](./README.md)
3. تحقق من إعدادات `wrangler.jsonc`
