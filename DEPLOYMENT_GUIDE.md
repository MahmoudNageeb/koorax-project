# 🚀 دليل النشر على Cloudflare Pages

## ✅ الخطوات المطلوبة للنشر

### 1. إعداد Cloudflare API Token
```bash
# في السيناريو الحقيقي، استخدم:
wrangler pages secret put FOOTBALL_API_TOKEN --project-name webapp

# أدخل القيمة: 79312930c9804b81a10b12dcf14da7fb
```

### 2. النشر على Cloudflare Pages
```bash
# بناء المشروع
npm run build

# النشر
npm run deploy:prod
```

### 3. الوصول للموقع
بعد النشر، سيتم إعطاؤك رابط مثل:
```
https://webapp.pages.dev
```

## 🔐 متغيرات البيئة المطلوبة

| المتغير | القيمة | الوصف |
|---------|--------|-------|
| `FOOTBALL_API_TOKEN` | `79312930c9804b81a10b12dcf14da7fb` | مفتاح API لـ football-data.org |

## 📝 ملاحظات هامة

1. **لا تنشر الـ `.dev.vars`** - هذا الملف للتطوير المحلي فقط
2. **استخدم Secrets في Production** - دائماً استخدم `wrangler pages secret put`
3. **تحديث الكود** - بعد أي تعديلات، قم بعمل:
   ```bash
   npm run build
   npm run deploy:prod
   ```

## 🧪 الاختبار المحلي

```bash
# بناء المشروع
npm run build

# تشغيل باستخدام PM2
pm2 start ecosystem.config.cjs

# اختبار
curl http://localhost:3000
```

## 🌐 الروابط المهمة

- **Dashboard Cloudflare**: https://dash.cloudflare.com/
- **Football Data API**: https://www.football-data.org/
- **Hono Documentation**: https://hono.dev/
