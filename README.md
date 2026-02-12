# ⚽ Koorax - موقع مباريات كرة القدم

موقع ويب احترافي لمتابعة المباريات المباشرة والبطولات العالمية باستخدام بيانات حقيقية من football-data.org API.

## 🌟 الميزات

### 🆕 أحدث المميزات (النسخة 3)

#### ✨ النظام المحسّن
- **🕌 نظام الأذكار العشوائية** - عرض ذكر ديني عند أول تحميل للصفحة
  - 10 أذكار مختلفة بالعربية والإنجليزية
  - يتم اختيار ذكر مختلف في كل مرة
  - حفظ آخر ذكر تم عرضه في `localStorage`
  - تصميم مودال زجاجي احترافي بنفس أسلوب الموقع
  - أنيميشن fade + scale (0.3s)

- **🌍 نظام اللغة الثنائي** - دعم كامل للعربية والإنجليزية
  - زر تبديل اللغة في الـ navbar
  - حفظ اللغة المختارة في `localStorage`
  - تحديث تلقائي لجميع النصوص
  - تبديل تلقائي لاتجاه الصفحة (RTL/LTR)

- **🌓 وضع الثيم** - Dark Mode و Light Mode
  - زر تبديل الثيم في الـ navbar
  - حفظ الوضع المختار في `localStorage`
  - تطبيق تلقائي للألوان والخلفيات
  - تحديث ديناميكي لجميع بطاقات الـ glass-card
  - انتقالات ناعمة بين الأوضاع

- **💾 التخزين المحلي**
  - `lastZikr` - آخر ذكر تم عرضه
  - `selectedLanguage` - اللغة المختارة (ar/en)
  - `themeMode` - وضع الثيم (dark/light)

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
- **اسم الموقع**: Koorax ⚽

### 📄 الصفحات
- **الصفحة الرئيسية**: `/`
- **المباريات**: `/matches`
- **تفاصيل مباراة**: `/matches/:id`
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
GET /api/matches/:id               - تفاصيل مباراة معينة 🆕
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
- **KooraxApp Class** - نظام إدارة الحالة والترجمة 🆕

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
│   ├── config.ts           # إعدادات البطولات المسموحة
│   ├── shared.ts           # مكونات مشتركة 🆕
│   └── utils.ts            # دوال مساعدة 🆕
├── public/
│   └── static/
│       ├── app-enhanced.js # نظام الأذكار واللغة والثيم 🆕
│       ├── zikr-system.js  # نظام الأذكار القديم
│       └── style.css       # تنسيقات CSS
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

- ✅ **النسخة 3 - مكتملة 100%**
- ✅ نظام الأذكار العشوائية
- ✅ دعم ثنائي اللغة (عربي/إنجليزي)
- ✅ وضع Dark/Light Mode
- ✅ localStorage للحفظ التلقائي
- ✅ تصميم متوافق 100% مع النمط الحالي
- ✅ بدون أي مكتبات خارجية إضافية
- ✅ Responsive كامل
- ✅ جاهز للنشر الفوري

## 📝 ملاحظات النسخة 3

### التطويرات الجديدة
1. **نظام الأذكار**
   - يعرض مرة واحدة فقط عند أول تحميل للصفحة
   - استخدام `sessionStorage` لمنع التكرار
   - حفظ آخر ذكر في `localStorage` لضمان التنوع

2. **نظام اللغة**
   - Translations object شامل لجميع النصوص
   - تبديل تلقائي لاتجاه الصفحة
   - تحديث ديناميكي للعنوان والنصوص

3. **نظام الثيم**
   - تطبيق ديناميكي للألوان
   - تحديث تلقائي لجميع عناصر الـ glass-card
   - انتقالات ناعمة مع cubic-bezier

### الكود النظيف
- Class-based architecture (KooraxApp)
- Separation of concerns
- Comprehensive comments
- Extensible structure
- No code duplication

## 📞 الدعم

للمشاكل أو الاستفسارات، يرجى فتح Issue في المستودع.

---

**تم البناء بـ ❤️ باستخدام Hono + Cloudflare Workers**  
**Koorax V3 - Enhanced with Religious Greetings, Multilingual Support & Theme Modes**
