# ⚽ Koorax - موقع مباريات كرة القدم مع نظام الفوازير

## 📋 نظرة عامة

**Koorax** هو موقع شامل لمتابعة مباريات كرة القدم مع نظام فوازير يومية تفاعلي ولوحة تحكم Admin كاملة.

---

## 🚀 الميزات الرئيسية

### ⚽ قسم المباريات
- عرض المباريات الحية والمنتهية والقادمة
- تفاصيل المباريات الكاملة
- البطولات والفرق
- نظام فلترة متقدم
- تحديث تلقائي للنتائج

### 🧩 نظام الفوازير اليومية
- **سؤال واحد كل يوم**
- **4 خيارات** (A, B, C, D)
- **+10 نقاط** للإجابة الصحيحة
- **لوحة المتصدرين** مع ميداليات (🥇🥈🥉)
- **حماية**: إجابة واحدة فقط لكل سؤال
- **رسائل تفاعلية** للنجاح/الفشل

### 👑 لوحة تحكم Admin
**حسابات Admin:**
1. **TN@gmail.com** / K00R@X
2. **mahmoudtrek170@gmail.com** / mti1642009

**الصلاحيات:**
- 📊 عرض الإحصائيات (عدد المستخدمين، الأسئلة، الإجابات)
- 👥 إدارة المستخدمين (عرض، حذف)
- ❓ إضافة أسئلة جديدة
- 📈 مراقبة النشاط

### 🔐 نظام المصادقة
- **تسجيل جديد**: اسم + بريد + كلمة سر (6 أحرف+)
- **تحقق من الإيميل**: رمز 6 أرقام (يظهر في console للتجربة)
- **تسجيل دخول**: بريد + كلمة سر
- **تشفير SHA-256** لكلمات المرور
- **Token مخصص** (صالح 24 ساعة)
- **حماية الصفحات**: /quiz يتطلب تسجيل دخول

---

## 💰 إعلانات Google AdSense

### إعداد الإعلانات

1. **احصل على رقم الناشر**:
   - سجل في Google AdSense
   - احصل على `ca-pub-XXXXXXXXXXXXXXXX`

2. **ضع رقمك في الملف**:
   ```bash
   # افتح /public/static/adsense.js
   # استبدل 'ca-pub-XXXXXXXXXXXXXXXX' برقمك
   ```

3. **أنشئ وحدات إعلانية**:
   - Header Ad (إعلان الرأس)
   - Content Ad (إعلان المحتوى)
   - Sidebar Ad (إعلان الشريط الجانبي)
   - Footer Ad (إعلان التذييل)

4. **ضع Slot IDs في الملف**:
   ```javascript
   slots: {
     headerAd: 'YOUR_HEADER_SLOT_ID',
     contentAd: 'YOUR_CONTENT_SLOT_ID',
     sidebarAd: 'YOUR_SIDEBAR_SLOT_ID',
     footerAd: 'YOUR_FOOTER_SLOT_ID'
   }
   ```

### أماكن الإعلانات

- **أعلى الصفحة**: بعد الهيدر مباشرة
- **بين المحتوى**: في منتصف صفحة الفوازير
- **الشريط الجانبي**: على يمين/يسار المحتوى
- **أسفل الصفحة**: في الفوتر

---

## 🗄️ قاعدة البيانات (D1)

### الجداول

#### users
```sql
- id (INTEGER PRIMARY KEY)
- name (TEXT NOT NULL)
- email (TEXT UNIQUE NOT NULL)
- password_hash (TEXT NOT NULL)  -- SHA-256
- email_verified (INTEGER DEFAULT 0)
- verification_token (TEXT)
- is_admin (INTEGER DEFAULT 0)
- points (INTEGER DEFAULT 0)
- created_at (INTEGER)
```

#### quiz_questions
```sql
- id (INTEGER PRIMARY KEY)
- question_text (TEXT NOT NULL)
- options (TEXT NOT NULL)  -- JSON: {"a":"...", "b":"...", "c":"...", "d":"..."}
- correct_answer (TEXT NOT NULL)  -- 'a', 'b', 'c', or 'd'
- created_at (INTEGER)
```

#### user_answers
```sql
- id (INTEGER PRIMARY KEY)
- user_id (INTEGER NOT NULL)
- question_id (INTEGER NOT NULL)
- answer (TEXT NOT NULL)
- is_correct (INTEGER DEFAULT 0)
- points_earned (INTEGER DEFAULT 0)
- answered_at (INTEGER)
- UNIQUE(user_id, question_id)  -- إجابة واحدة فقط
```

---

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register
  Body: { name, email, password }
  Response: { success, message, verificationCode }

GET /api/auth/verify-email?email=...&code=...
  Response: { success, message }

POST /api/auth/login
  Body: { email, password }
  Response: { success, token, user }

GET /api/auth/me
  Headers: Authorization: Bearer {token}
  Response: { user }
```

### Quiz
```
GET /api/quiz/today
  Headers: Authorization: Bearer {token}
  Response: { question, alreadyAnswered }

POST /api/quiz/answer
  Headers: Authorization: Bearer {token}
  Body: { answer }
  Response: { correct, points, correctAnswer }

GET /api/quiz/leaderboard
  Response: { leaderboard }  -- Top 5
```

### Admin (requires is_admin = 1)
```
GET /api/admin/stats
  Headers: Authorization: Bearer {token}
  Response: { totalUsers, totalQuestions, todayAnswers }

GET /api/admin/users
  Headers: Authorization: Bearer {token}
  Response: { users }

DELETE /api/admin/users/:id
  Headers: Authorization: Bearer {token}
  Response: { success }

POST /api/admin/question
  Headers: Authorization: Bearer {token}
  Body: { question_text, options: {a,b,c,d}, correct_answer }
  Response: { success, questionId }
```

---

## 🛠️ التطوير المحلي

### التثبيت
```bash
cd /home/user/webapp
npm install
```

### إعداد قاعدة البيانات
```bash
# إنشاء قاعدة بيانات D1
npx wrangler d1 create koorax-db

# تطبيق Migrations
npx wrangler d1 migrations apply koorax-db --local

# إضافة سؤال تجريبي (موجود بالفعل في migration 0003)
```

### التشغيل
```bash
# Build
npm run build

# تشغيل محلي (development)
npm run dev:sandbox
# أو
pm2 start ecosystem.config.cjs

# اختبار
curl http://localhost:3000
curl http://localhost:3000/quiz
```

### قاعدة البيانات
```bash
# تطبيق migrations
npm run db:migrate:local

# إعادة تشغيل DB من الصفر
npm run db:reset

# تنفيذ query
npx wrangler d1 execute koorax-db --local --command="SELECT * FROM users"
```

---

## 📦 النشر (Production)

### Cloudflare Pages

```bash
# 1. Build
npm run build

# 2. نشر
npm run deploy

# 3. إعداد D1 في Production
npx wrangler d1 migrations apply koorax-db --remote

# 4. إضافة المتغيرات
npx wrangler pages secret put FOOTBALL_API_TOKEN --project-name koorax
```

---

## 🎨 التصميم

- **الألوان**: أخضر `#22c55e` (primary)
- **الخط**: Cairo (عربي)
- **النمط**: Glass-morphism + Gradients
- **الوضع**: Dark Mode (افتراضي) + Light Mode
- **اللغة**: عربي (RTL) + إنجليزي
- **Responsive**: كامل (Mobile First)

---

## 📊 الإحصائيات

- **حجم الحزمة**: 152.69 KB
- **عدد الأسطر**: 3,400+
- **Dependencies**: Hono + Vite + TypeScript
- **قاعدة البيانات**: Cloudflare D1 (SQLite)
- **Auth**: Web Crypto API (SHA-256)
- **Token**: Custom (Base64)

---

## 🔒 الأمان

- ✅ **تشفير كلمات المرور**: SHA-256
- ✅ **Token Authentication**: 24h expiry
- ✅ **تحقق من الإيميل**: رمز 6 أرقام
- ✅ **حماية API**: Bearer Token
- ✅ **Admin Protection**: is_admin flag
- ✅ **SQL Injection**: Prepared Statements
- ✅ **CORS**: مفعّل

---

## 📝 ملاحظات مهمة

### للمستخدمين
- يجب تأكيد البريد قبل تسجيل الدخول
- سؤال واحد فقط كل يوم
- الإجابة الصحيحة = +10 نقاط
- لا يمكن تغيير الإجابة

### للـ Admins
- يمكن إضافة أسئلة غير محدودة
- يمكن حذف أي مستخدم
- يمكن رؤية جميع الإحصائيات

### للمطورين
- استخدم `.dev.vars` للمتغيرات المحلية
- الـ Token في الـ console فقط (للتجربة)
- في Production: أضف SendGrid للإيميلات الحقيقية

---

## 🆘 المساعدة

### مشاكل شائعة

**لا أستطيع تسجيل الدخول**:
- تأكد من تأكيد البريد (الرمز في console)
- تأكد من كلمة المرور (6 أحرف على الأقل)

**لا أرى Dashboard**:
- تأكد من أن is_admin = 1 في قاعدة البيانات
- سجل دخول بأحد الحسابات Admin

**الإعلانات لا تظهر**:
- ضع رقم الناشر في /public/static/adsense.js
- تأكد من الموافقة على حسابك في AdSense
- قد تأخذ الإعلانات 24-48 ساعة للظهور

---

## 📄 الترخيص

MIT License - استخدم كما تشاء!

---

## 👨‍💻 المطور

تم التطوير بواسطة الذكاء الاصطناعي 🤖

**Built with ❤️ using:**
- Hono Framework
- Cloudflare Workers/Pages
- TypeScript
- Tailwind CSS
- D1 Database

---

## 🔗 روابط مفيدة

- [Hono Documentation](https://hono.dev/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Google AdSense](https://www.google.com/adsense/)

---

**جاهز للربح! 💰**
