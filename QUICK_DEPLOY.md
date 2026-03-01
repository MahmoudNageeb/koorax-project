# 🚀 طرق النشر على Cloudflare Pages

## ⚡ اختر الطريقة المناسبة لك

---

## 📱 الطريقة 1: من لوحة تحكم Cloudflare (الأسهل والأسرع)

### الخطوات:

1. اذهب إلى: **https://dash.cloudflare.com**
2. سجل دخول أو أنشئ حساب مجاني
3. اختر **"Workers & Pages"** من القائمة الجانبية
4. اضغط **"Create application"**
5. اختر **"Pages"** → **"Connect to Git"**
6. اربط حساب GitHub الخاص بك
7. اختر repository: **`koorax-project`**
8. اختر branch: **`main`**
9. في إعدادات Build:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
10. اضغط **"Save and Deploy"**

⏱️ **المدة**: 2-3 دقائق فقط!
🎯 **النتيجة**: سيعطيك رابط مثل `https://koorax.pages.dev`

### مميزات هذه الطريقة:
- ✅ سهلة جداً - لا تحتاج terminal
- ✅ نشر تلقائي عند كل push على GitHub
- ✅ مناسبة للمبتدئين

---

## 💻 الطريقة 2: من Terminal (للمطورين)

### المتطلبات:
- Node.js 18 أو أحدث
- Git

### الخطوات:

```bash
# 1. نسخ المشروع
git clone https://github.com/MahmoudNageeb/koorax-project.git
cd koorax-project

# 2. تثبيت المكتبات
npm install

# 3. بناء المشروع
npm run build

# 4. تسجيل الدخول لـ Cloudflare
npx wrangler login
# سيفتح متصفح للتوثيق

# 5. نشر المشروع
npx wrangler pages deploy dist --project-name koorax
```

---

## 🗄️ إعداد قاعدة البيانات D1 (مطلوب)

بعد نشر الموقع، يجب إعداد قاعدة البيانات:

### من لوحة التحكم:

1. اذهب إلى صفحة مشروعك في Cloudflare Pages
2. اختر **"Settings"** → **"Functions"** → **"D1 database bindings"**
3. اضغط **"Add binding"**
4. **Variable name**: `DB`
5. **D1 database**: اختر **"Create a new database"**
6. **Database name**: `koorax-db`
7. اضغط **"Save"**

### تطبيق Migrations:

```bash
# من جهازك المحلي
git clone https://github.com/MahmoudNageeb/koorax-project.git
cd koorax-project
npm install

# تسجيل الدخول
npx wrangler login

# تطبيق migrations
npx wrangler d1 migrations apply koorax-db --remote
```

---

## 🔑 إعداد Football API Token (مطلوب)

المباريات لن تعمل بدون هذا الـ Token:

1. في صفحة مشروعك → **"Settings"** → **"Environment variables"**
2. اضغط **"Add variable"**
3. **Variable name**: `FOOTBALL_API_TOKEN`
4. **Value**: `79312930c9804b81a10b12dcf14da7fb`
5. اضغط **"Save"**
6. اضغط **"Redeploy"** لتطبيق التغييرات

---

## 🎯 التحقق من النشر الناجح

بعد النشر، تأكد من:

- ✅ الصفحة الرئيسية تفتح
- ✅ صفحة المباريات تعرض 87 مباراة
- ✅ صفحة الفزورة تعمل
- ✅ يمكن تسجيل الدخول

### حساب الأدمن للاختبار:
```
📧 Email: TN@gmail.com
🔑 Password: K00R@X
```

---

## 🆘 حل المشاكل الشائعة

### المشكلة: "Database not found"
**السبب**: قاعدة البيانات غير مربوطة أو migrations لم تُطبق
**الحل**:
1. تأكد من إضافة D1 binding في Settings
2. طبّق migrations: `npx wrangler d1 migrations apply koorax-db --remote`

### المشكلة: "No matches found"
**السبب**: Football API Token غير موجود
**الحل**: أضف `FOOTBALL_API_TOKEN` في Environment variables

### المشكلة: "Build failed"
**السبب**: إعدادات Build خاطئة
**الحل**: تأكد من:
- Build command: `npm run build`
- Build output directory: `dist`

---

## 📚 روابط مفيدة

- 🔗 **GitHub Repository**: https://github.com/MahmoudNageeb/koorax-project
- 🔗 **Cloudflare Dashboard**: https://dash.cloudflare.com
- 🔗 **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages
- 🔗 **D1 Database Docs**: https://developers.cloudflare.com/d1

---

## 📞 الدعم

إذا واجهت أي مشكلة:
1. راجع ملف `DEPLOYMENT.md` للتفاصيل الكاملة
2. تحقق من Cloudflare Pages logs
3. افتح issue في GitHub Repository

---

**آخر تحديث**: 1 مارس 2026
**الإصدار**: V33
