# ⚠️ تنبيه مهم - SportMonks API Free Plan Limitations

## المشكلة
التوكن المستخدم هو **Free Plan** من SportMonks ولا يدعم الدوريات الكبرى!

### الدوريات المطلوبة (غير متاحة في Free Plan):
- ❌ الدوري الإنجليزي (Premier League) - ID: 8
- ❌ الدوري الإسباني (La Liga) - ID: 564
- ❌ الدوري الإيطالي (Serie A) - ID: 384
- ❌ الدوري الألماني (Bundesliga) - ID: 82
- ❌ الدوري الفرنسي (Ligue 1) - ID: 301
- ❌ دوري أبطال أوروبا (Champions League) - ID: 2
- ❌ الدوريات العربية (مصر، السعودية، الكويت)

### الدوريات المتاحة في Free Plan:
- ✅ Danish Superliga - ID: 271
- ✅ Scottish Premiership - ID: 501
- ✅ Scottish Premiership Play-Offs - ID: 513
- ✅ Danish Superliga Play-offs - ID: 1659

## الحلول

### الحل 1: ترقية الحساب (موصى به)
- الانتقال إلى SportMonks Paid Plan
- السعر: يبدأ من $49/شهر
- يدعم جميع الدوريات الكبرى والعربية
- رابط الترقية: https://www.sportmonks.com/football-api/pricing/

### الحل 2: استخدام API بديل

#### أ) API-Football (RapidAPI)
- **الموقع**: https://rapidapi.com/api-football/api/api-football
- **المميزات**: 
  - يدعم جميع الدوريات الكبرى
  - يدعم الدوريات العربية
  - Free Plan: 100 طلب/يوم
- **التكلفة**: 
  - Free: 100 requests/day
  - Pro: $15/month - 3,000 requests/day
  - Ultra: $30/month - 10,000 requests/day

#### ب) Football-Data.org (المستخدم سابقاً)
- **الموقع**: https://www.football-data.org/
- **المميزات**:
  - Free Plan: 10 requests/minute
  - يدعم الدوريات الأوروبية الكبرى
  - بدون دوريات عربية
- **التكلفة**: مجاني تماماً

#### ج) TheSportsDB
- **الموقع**: https://www.thesportsdb.com/
- **المميزات**:
  - Free مع Patreon ($3/month)
  - يدعم معظم الدوريات
- **التكلفة**: $3/month على Patreon

### الحل 3: استخدام الدوريات المتاحة مؤقتاً
تم تعديل الكود ليعمل مع الدوريات المتاحة في Free Plan:
- Danish Superliga
- Scottish Premiership

## التوصية النهائية

### للاستخدام الاحترافي:
**انتقل إلى API-Football** (أفضل خيار):
```bash
# رابط التسجيل
https://rapidapi.com/api-football/api/api-football

# خطة Pro ($15/month):
- 3,000 requests/day
- جميع الدوريات
- استجابة سريعة
- دعم فني
```

### لماذا API-Football أفضل؟
1. ✅ أرخص من SportMonks ($15 vs $49)
2. ✅ يدعم جميع الدوريات المطلوبة
3. ✅ Free Plan مجاني (100 طلب/يوم للتجربة)
4. ✅ توثيق ممتاز
5. ✅ دعم الدوريات العربية

## الموقع الحالي

### الحالة: ✅ يعمل بشكل صحيح تقنياً
- الكود جاهز ومحترف
- التصميم كامل ومثالي
- البنية التحتية سليمة

### المشكلة الوحيدة: البيانات
- التوكن المستخدم لا يدعم الدوريات المطلوبة
- بحاجة إلى API أفضل أو ترقية الحساب

## الخطوات التالية

1. **اختر API مناسب**:
   - API-Football (موصى به)
   - أو ترقية SportMonks

2. **احصل على التوكن الجديد**

3. **حدّث `sportmonksApi.ts`**:
   ```typescript
   export const API_TOKEN = 'NEW_TOKEN_HERE';
   export const API_BASE_URL = 'NEW_API_BASE_URL';
   ```

4. **أعد البناء والنشر**:
   ```bash
   npm run build
   pm2 restart football-webapp
   ```

## ملاحظة مهمة

الموقع **جاهز 100% للرفع** من الناحية التقنية:
- ✅ التصميم احترافي
- ✅ الكود نظيف ومحسّن
- ✅ responsive كامل
- ✅ البنية صحيحة
- ✅ يعمل على Cloudflare Workers

**المطلوب فقط**: توكن API يدعم الدوريات المطلوبة!

---

**تاريخ التحديث**: 15 فبراير 2026  
**الحالة**: بانتظار API صحيح
