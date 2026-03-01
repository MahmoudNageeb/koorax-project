# 🚀 دليل نشر Koorax على Cloudflare Pages

## 📋 خطوات النشر السريعة (5-10 دقائق)

### 1️⃣ نسخ المشروع
```bash
git clone https://github.com/MahmoudNageeb/koorax-project.git
cd koorax-project
```

### 2️⃣ تثبيت المكتبات
```bash
npm install
```

### 3️⃣ بناء المشروع
```bash
npm run build
```

### 4️⃣ تسجيل الدخول لـ Cloudflare
```bash
npx wrangler login
```
سيفتح متصفح لتسجيل الدخول بحساب Cloudflare الخاص بك.

### 5️⃣ إنشاء مشروع Pages
```bash
npx wrangler pages project create koorax --production-branch main
```

### 6️⃣ إنشاء قاعدة البيانات D1
```bash
# إنشاء قاعدة البيانات
npx wrangler d1 create koorax-db

# انسخ database_id من النتيجة وضعه في wrangler.jsonc
```

### 7️⃣ تحديث wrangler.jsonc
افتح ملف `wrangler.jsonc` وضع `database_id`:
```jsonc
{
  "name": "koorax",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "koorax-production",
      "database_id": "ضع الـ ID هنا"
    }
  ]
}
```

### 8️⃣ تطبيق Migrations
```bash
npx wrangler d1 migrations apply koorax-production
```

### 9️⃣ نشر المشروع
```bash
npx wrangler pages deploy dist --project-name koorax
```

### 🔟 إعداد Football API Token
```bash
npx wrangler pages secret put FOOTBALL_API_TOKEN --project-name koorax
```
عندما يطلب منك، أدخل: `79312930c9804b81a10b12dcf14da7fb`

---

## 🎉 تم!

بعد النشر، ستحصل على رابط مثل:
```
https://koorax.pages.dev
```

---

## ⚡ نشر سريع (من لوحة تحكم Cloudflare)

الطريقة الأسهل للنشر:

1. اذهب إلى: https://dash.cloudflare.com
2. اختر **"Workers & Pages"**
3. اضغط **"Create application"**
4. اختر **"Pages"** → **"Connect to Git"**
5. اربط حساب GitHub واختر repository: **`koorax-project`**
6. اختر branch: **`main`**
7. **Build command**: `npm run build`
8. **Build output directory**: `dist`
9. اضغط **"Save and Deploy"**

⏱️ سيستغرق النشر 2-3 دقائق

---

## 🗄️ إعداد قاعدة البيانات D1

بعد نشر الموقع من لوحة التحكم:

1. في صفحة المشروع، اذهب إلى **"Settings"** → **"Bindings"**
2. اضغط **"Add"** → **"D1 database"**
3. اختر **"Create new database"**
4. اسم قاعدة البيانات: **`koorax-db`**
5. Variable name: **`DB`**
6. اضغط **"Save"**

### تطبيق Migrations:
```bash
# من جهازك المحلي
git clone https://github.com/MahmoudNageeb/koorax-project.git
cd koorax-project
npm install
npx wrangler login
npx wrangler d1 migrations apply koorax-db --remote
```

---

## 🔑 إعداد Football API Token

1. في صفحة المشروع، اذهب إلى **"Settings"** → **"Environment variables"**
2. اضغط **"Add variable"**
3. Variable name: **`FOOTBALL_API_TOKEN`**
4. Value: **`79312930c9804b81a10b12dcf14da7fb`**
5. اضغط **"Save"**

---

## 🔧 أوامر مفيدة

### عرض قائمة المشاريع
```bash
npx wrangler pages project list
```

### عرض Deployments
```bash
npx wrangler pages deployment list --project-name koorax
```

### تحديث الكود (بعد تعديلات)
```bash
git pull origin main
npm run build
npx wrangler pages deploy dist --project-name koorax
```

---

## 👤 حساب الأدمن

```
📧 Email: TN@gmail.com
🔑 Password: K00R@X
```

---

## 🎯 النتيجة المتوقعة

بعد النشر الناجح:
- ✅ الموقع يعمل على `https://koorax.pages.dev`
- ✅ جميع الصفحات تعمل
- ✅ قاعدة البيانات متصلة
- ✅ المباريات تظهر (87 مباراة)
- ✅ الفزورة تعمل
- ✅ صفحة الملف الشخصي محمية

---

## 📚 موارد إضافية

- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler
- **D1 Database Docs**: https://developers.cloudflare.com/d1
- **GitHub Repository**: https://github.com/MahmoudNageeb/koorax-project

---

## 🆘 حل المشاكل الشائعة

### المشكلة: "Database not found"
**الحل**: تأكد من تطبيق migrations:
```bash
npx wrangler d1 migrations apply koorax-db --remote
```

### المشكلة: "No matches found"
**الحل**: تأكد من إضافة FOOTBALL_API_TOKEN في Environment variables

### المشكلة: "Build failed"
**الحل**: تأكد من:
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 18 أو أحدث

---

**آخر تحديث**: 1 مارس 2026
**الإصدار**: V33
