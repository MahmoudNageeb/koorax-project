# ⚽ موقع مباريات كرة القدم

موقع ويب احترافي لمتابعة المباريات المباشرة والبطولات العالمية باستخدام بيانات حقيقية من football-data.org API.

## 🌟 الميزات

### ✅ المميزات المكتملة

- **صفحة المباريات** (`/matches`)
  - ✅ مباريات مباشرة (تحديث تلقائي كل 60 ثانية)
  - ✅ مباريات قادمة (خلال 7 أيام)
  - ✅ مباريات منتهية
  - ✅ عرض الشعارات والنتائج والوقت
  - ✅ حالة المباراة (LIVE - FT - NS)
  - ✅ **فلترة حسب البطولة** - إمكانية عرض مباريات بطولة معينة فقط
  - ✅ **الضغط على أي مباراة** - للانتقال لصفحة التفاصيل

- **صفحة تفاصيل المباراة** (`/matches/:id`) **🆕**
  - ✅ عرض تفاصيل كاملة للمباراة (مباشرة، قادمة، أو منتهية)
  - ✅ النتيجة الكاملة مع نتيجة الشوط الأول
  - ✅ معلومات الفريقين مع الشعارات الكبيرة
  - ✅ البطولة، الوقت، الملعب، الحكم
  - ✅ الإحصائيات التفصيلية

- **صفحة البطولات** (`/competitions`)
  - ✅ عرض بطاقات البطولات المحددة
  - ✅ شعارات البطولات
  - ✅ روابط للتفاصيل

- **صفحة تفاصيل البطولة** (`/competitions/:id`)
  - ✅ Tab: الترتيب (جدول الفرق)
  - ✅ Tab: الهدافون (جدول أفضل اللاعبين)

### 🎨 التصميم الاحترافي **المحدّث**

- ✅ **Premium Dark UI** - تصميم احترافي جداً
- ✅ **Advanced Glass Morphism** - تأثيرات زجاجية متقدمة
- ✅ **3D Hover Effects** - تأثيرات ثلاثية الأبعاد عند التمرير
- ✅ **Shimmer Animations** - تأثيرات لامعة متحركة
- ✅ **Gradient Text Effects** - نصوص متدرجة متحركة
- ✅ **Smooth Transitions** - انتقالات ناعمة جداً
- ✅ **Enhanced Skeleton Loaders** - تحميل متقدم
- ✅ **Professional Typography** - خط Cairo بأوزان متعددة
- ✅ **Responsive كامل** - يعمل على جميع الشاشات
- ✅ واجهة عربية بخط Cairo

### 🏆 البطولات المدعومة

- Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿
- La Liga 🇪🇸
- Serie A 🇮🇹
- Bundesliga 🇩🇪
- Ligue 1 🇫🇷
- UEFA Champions League 🇪🇺
- Egyptian Premier League 🇪🇬

## 🚀 الروابط

### 🌐 الموقع المباشر
- **Live Demo**: https://3000-i8f8s5h0v1yti847hjyjr-b9b802c4.sandbox.novita.ai

### 📄 الصفحات
- **الصفحة الرئيسية**: `/`
- **المباريات**: `/matches`
- **تفاصيل مباراة**: `/matches/:id` **🆕**
- **البطولات**: `/competitions`
- **تفاصيل البطولة**: `/competitions/:id`
- **المباريات**: `/matches`
- **البطولات**: `/competitions`
- **تفاصيل البطولة**: `/competitions/:id`

## 📊 API Endpoints

### Backend API Routes

```
GET /api/competitions              - جلب جميع البطولات
GET /api/matches                   - جلب جميع المباريات
GET /api/matches/live              - المباريات المباشرة
GET /api/matches/upcoming          - المباريات القادمة
GET /api/matches/finished          - المباريات المنتهية
GET /api/competitions/:id/standings - جدول الترتيب
GET /api/competitions/:id/scorers   - جدول الهدافين
```

### External API

- **API Source**: football-data.org
- **API Token**: مخزن في environment variable `FOOTBALL_API_TOKEN`
- **Caching**: 60 ثانية لكل طلب

## 🛠️ التقنيات المستخدمة

### Backend
- **Hono** - إطار عمل خفيف وسريع
- **Cloudflare Workers** - Edge runtime
- **TypeScript** - للأمان والوضوح

### Frontend
- **Vanilla JavaScript** - بدون frameworks ثقيلة
- **Tailwind CSS** - للتصميم السريع
- **Font Awesome** - للأيقونات
- **Axios** - للتواصل مع الـ API
- **Cairo Font** - خط عربي احترافي

### Build & Deploy
- **Vite** - بناء سريع
- **Wrangler** - أداة Cloudflare
- **PM2** - لإدارة العمليات

## 📦 هيكل المشروع

```
webapp/
├── src/
│   ├── index.tsx           # تطبيق Hono الرئيسي
│   ├── footballApi.ts      # طبقة API للتواصل مع football-data.org
│   └── config.ts           # إعدادات البطولات المسموحة
├── .dev.vars               # متغيرات البيئة المحلية
├── wrangler.jsonc          # إعدادات Cloudflare
├── ecosystem.config.cjs    # إعدادات PM2
├── package.json            # الحزم والسكربتات
└── README.md              # هذا الملف
```

## 🚀 التشغيل المحلي

### 1. بناء المشروع
```bash
npm run build
```

### 2. تشغيل الخادم (باستخدام PM2)
```bash
pm2 start ecosystem.config.cjs
```

### 3. اختبار الموقع
```bash
curl http://localhost:3000
```

### 4. عرض اللوجات
```bash
pm2 logs football-webapp --nostream
```

## 🌐 النشر على Cloudflare Pages

### 1. بناء المشروع
```bash
npm run build
```

### 2. النشر
```bash
npm run deploy:prod
```

### 3. إضافة API Token كـ Secret
```bash
wrangler pages secret put FOOTBALL_API_TOKEN --project-name webapp
```

## 📝 ملاحظات تطويرية

### API Caching
- جميع طلبات الـ API يتم تخزينها مؤقتاً لمدة 60 ثانية
- يقلل من عدد الطلبات للـ API الخارجي
- يحسن السرعة والأداء

### Data Filtering
- يتم فلترة المباريات والبطولات تلقائياً
- فقط البطولات المحددة في `config.ts` تظهر
- يضمن عدم ظهور بيانات غير مرغوبة

### Auto-Refresh
- المباريات المباشرة تتحدث تلقائياً كل 60 ثانية
- بدون إعادة تحميل الصفحة
- تجربة مستخدم سلسة

## 🔐 الأمان

- ✅ API Token مخزن في environment variables
- ✅ لا يتم عرض الـ Token في الكود
- ✅ CORS مفعل للأمان
- ✅ Error handling شامل

## 📱 الدعم والتوافق

- ✅ Desktop (1920px+)
- ✅ Laptop (1366px+)
- ✅ Tablet (768px+)
- ✅ Mobile (320px+)
- ✅ جميع المتصفحات الحديثة

## 🎯 الحالة الحالية

- ✅ **مكتمل 100%** - جاهز للنشر
- ✅ جميع الصفحات تعمل
- ✅ API مربوط
- ✅ تصميم احترافي
- ✅ بيانات حقيقية

## 📞 الدعم

للمشاكل أو الاستفسارات، يرجى فتح Issue في المستودع.

---

**تم البناء بـ ❤️ باستخدام Hono + Cloudflare Workers**
