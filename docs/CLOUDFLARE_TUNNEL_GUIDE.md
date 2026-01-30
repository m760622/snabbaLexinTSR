# دليل Cloudflare Tunnel - الوصول العالمي للتطبيق المحلي

> **الهدف:** جعل التطبيق المحلي (localhost) متاحاً على الإنترنت بدون Port Forwarding أو IP عام

---

## 📋 جدول المحتويات

1. [ما هو Cloudflare Tunnel؟](#ما-هو-cloudflare-tunnel)
2. [كيف يعمل؟](#كيف-يعمل)
3. [التثبيت والإعداد](#التثبيت-والإعداد)
4. [الاستخدام اليومي](#الاستخدام-اليومي)
5. [المميزات والعيوب](#المميزات-والعيوب)
6. [استكشاف الأخطاء](#استكشاف-الأخطاء)
7. [للإنتاج الدائم](#للإنتاج-الدائم)

---

## ما هو Cloudflare Tunnel؟

**ببساطة:** أداة مجانية من Cloudflare تجعل جهازك المحلي متاحاً على الإنترنت عبر نفق مشفر.

### لا تحتاج إلى

- ❌ فتح منافذ في الراوتر (Port Forwarding)
- ❌ IP عام ثابت
- ❌ إعدادات DNS معقدة
- ❌ شهادة SSL (تأتي تلقائياً)

### تحصل على

- ✅ رابط HTTPS عام مجاني
- ✅ نفق مشفر آمن
- ✅ إعداد في دقائق

---

## كيف يعمل؟

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│   جهازك (Mac)   │         │  Cloudflare  │         │   العالم    │
│                 │         │              │         │             │
│  Vite :8080     │         │              │         │             │
│  Nginx :80      │         │              │         │             │
│                 │         │              │         │             │
│  cloudflared    │────────►│   Tunnel     │────────►│  المستخدم   │
│                 │  نفق    │              │  HTTPS  │             │
│                 │  مشفر   │              │         │             │
└─────────────────┘         └──────────────┘         └─────────────┘
```

### تدفق البيانات

1. **المستخدم** يفتح: `https://heritage-expertise-these-rep.trycloudflare.com`
2. **Cloudflare** تستقبل الطلب وترسله عبر النفق المشفر
3. **cloudflared** على جهازك يستقبل الطلب ويرسله لـ `localhost:80`
4. **Nginx** يوجه الطلب لـ `localhost:8080`
5. **Vite** يرد بالصفحة
6. **cloudflared** يرسل الرد لـ Cloudflare
7. **Cloudflare** ترسل الرد للمستخدم

---

## التثبيت والإعداد

### 1. تثبيت cloudflared

```bash
# على macOS
brew install cloudflare/cloudflare/cloudflared

# التحقق من التثبيت
cloudflared --version
```

### 2. إعداد Vite للسماح بالنطاقات الخارجية

**ملف:** `vite.config.ts`

```typescript
export default defineConfig({
  // ... إعدادات أخرى
  server: {
    port: 8080,
    host: true,
    allowedHosts: [
      '.trycloudflare.com',  // ✅ السماح لكل نطاقات Cloudflare
      'localhost',
      '192.168.1.139'        // IP المحلي (اختياري)
    ]
  }
});
```

> **ملاحظة:** بدون `allowedHosts`، Vite سيرفض الطلبات من النطاق الخارجي برسالة "Host not allowed"

### 3. إعداد Nginx (اختياري)

إذا كنت تستخدم Nginx كـ Reverse Proxy:

**ملف:** `nginx-local.conf`

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## الاستخدام اليومي

### الطريقة السريعة (كل شيء معاً)

```bash
npm run شغلل
```

هذا الأمر يشغل:

1. ✅ Nginx على المنفذ 80
2. ✅ Vite على المنفذ 8080
3. ✅ Cloudflare Tunnel

**الملف:** `scripts/start-all.sh`

```bash
#!/bin/bash

echo "🚀 Starting SnabbaLexin with Global Access..."

# Start Nginx
echo "📡 Setting up Nginx on Port 80..."
./scripts/setup-nginx.sh

# Start Vite in background
echo "⚡ Starting Vite dev server..."
vite --port 8080 --host &
VITE_PID=$!

# Wait for Vite to start
sleep 3

# Start Cloudflare Tunnel
echo "🌍 Creating global tunnel..."
cloudflared tunnel --url http://localhost:80 &
TUNNEL_PID=$!

echo ""
echo "✅ All services started!"
echo "📍 Local: http://localhost"
echo "🌍 Global: Check terminal output above for Cloudflare URL"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap Ctrl+C to cleanup
trap "echo '🛑 Stopping services...'; kill $VITE_PID $TUNNEL_PID 2>/dev/null; sudo nginx -s stop 2>/dev/null; exit" INT

# Wait for processes
wait
```

### الطريقة اليدوية (خطوة بخطوة)

#### 1. شغل Vite

```bash
npm run dev
# أو
vite --port 8080 --host
```

#### 2. شغل Nginx (اختياري)

```bash
./scripts/setup-nginx.sh
```

#### 3. شغل Cloudflare Tunnel

```bash
cloudflared tunnel --url http://localhost:80
```

**ستحصل على رابط مثل:**

```
https://heritage-expertise-these-rep.trycloudflare.com
```

### إيقاف الخدمات

```bash
# إيقاف Cloudflare Tunnel
Ctrl+C في التيرمينال

# إيقاف Nginx
sudo nginx -s stop

# إيقاف Vite
Ctrl+C في التيرمينال
```

---

## المميزات والعيوب

### المميزات ✅

| ميزة | شرح |
|------|-----|
| **مجاني تماماً** | بدون تكلفة، بدون حدود للاستخدام |
| **HTTPS تلقائي** | شهادة SSL مجانية من Cloudflare |
| **سريع** | شبكة Cloudflare العالمية (CDN) |
| **آمن** | نفق مشفر بالكامل |
| **بدون إعدادات شبكة** | لا يحتاج Port Forwarding أو Firewall |
| **سهل الاستخدام** | أمر واحد فقط |

### العيوب ⚠️

| عيب | شرح | الحل |
|-----|-----|------|
| **رابط مؤقت** | يتغير عند إعادة التشغيل | استخدم Named Tunnel للرابط الثابت |
| **يحتاج جهازك يعمل** | إذا أغلقت الجهاز، الرابط لن يعمل | للإنتاج، استخدم Netlify |
| **للتطوير فقط** | غير موصى به للإنتاج | Cloudflare Tunnel الدائم أو Netlify |
| **عشوائي** | اسم النطاق عشوائي | Named Tunnel للتحكم بالاسم |

---

## استكشاف الأخطاء

### المشكلة: "Host not allowed"

**الخطأ:**

```
Invalid Host header
```

**الحل:**
أضف `.trycloudflare.com` إلى `allowedHosts` في `vite.config.ts`:

```typescript
server: {
  allowedHosts: ['.trycloudflare.com', 'localhost']
}
```

---

### المشكلة: الرابط لا يعمل

**الأسباب المحتملة:**

1. **Vite لا يعمل:**

   ```bash
   # تحقق من أن Vite يعمل على 8080
   curl http://localhost:8080
   ```

2. **Nginx لا يعمل:**

   ```bash
   # تحقق من حالة Nginx
   sudo nginx -t
   ps aux | grep nginx
   ```

3. **cloudflared لا يعمل:**

   ```bash
   # تحقق من العملية
   ps aux | grep cloudflared
   ```

---

### المشكلة: المنفذ 80 مشغول

**الخطأ:**

```
nginx: [emerg] bind() to 0.0.0.0:80 failed (48: Address already in use)
```

**الحل:**

```bash
# أوقف العملية التي تستخدم المنفذ 80
sudo lsof -t -i:80 | xargs sudo kill -9

# أعد تشغيل Nginx
./scripts/setup-nginx.sh
```

---

### المشكلة: الرابط بطيء

**السبب:** قد يكون الاتصال بطيئاً بسبب:

- سرعة الإنترنت المحلية
- بعد خوادم Cloudflare

**الحل:**

- للاختبار المحلي، استخدم `http://localhost`
- للإنتاج، استخدم Netlify (أسرع)

---

## للإنتاج الدائم

### الخيار 1: Cloudflare Tunnel الدائم (Named Tunnel)

#### 1. تسجيل الدخول

```bash
cloudflared tunnel login
```

سيفتح المتصفح لتسجيل الدخول بحساب Cloudflare

#### 2. إنشاء نفق دائم

```bash
cloudflared tunnel create snabbalexin
```

سيعطيك UUID للنفق

#### 3. إنشاء ملف الإعدادات

**ملف:** `~/.cloudflared/config.yml`

```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /Users/yourusername/.cloudflared/<TUNNEL_UUID>.json

ingress:
  - hostname: app.yourdomain.com
    service: http://localhost:80
  - service: http_status:404
```

#### 4. ربط النفق بنطاق

```bash
cloudflared tunnel route dns snabbalexin app.yourdomain.com
```

#### 5. تشغيل النفق الدائم

```bash
cloudflared tunnel run snabbalexin
```

#### 6. تشغيل تلقائي عند بدء النظام (macOS)

```bash
# تثبيت كخدمة
sudo cloudflared service install
sudo launchctl start com.cloudflare.cloudflared
```

---

### الخيار 2: Netlify (موصى به للإنتاج)

**المميزات:**

- ✅ يعمل 24/7 بدون جهازك
- ✅ CDN عالمي
- ✅ نطاق مخصص مجاني
- ✅ SSL تلقائي
- ✅ CI/CD تلقائي من GitHub

**التطبيق الحالي:**

```
https://snabbalexin.netlify.app
```

---

## الأوامر المفيدة

### تشغيل

```bash
# كل شيء معاً
npm run شغلل

# Vite فقط
npm run dev

# Nginx فقط
./scripts/setup-nginx.sh

# Cloudflare Tunnel فقط
cloudflared tunnel --url http://localhost:80
```

### إيقاف

```bash
# إيقاف Nginx
sudo nginx -s stop

# إيقاف كل العمليات على المنفذ 80
sudo lsof -t -i:80 | xargs sudo kill -9

# إيقاف Cloudflare Tunnel
pkill cloudflared
```

### تشخيص

```bash
# التحقق من المنافذ المفتوحة
lsof -i :80
lsof -i :8080

# التحقق من حالة Nginx
sudo nginx -t
ps aux | grep nginx

# التحقق من Vite
curl http://localhost:8080

# التحقق من Cloudflare Tunnel
ps aux | grep cloudflared
```

---

## الملفات المهمة

| ملف | وصف |
|-----|------|
| `vite.config.ts` | إعدادات Vite (allowedHosts) |
| `nginx-local.conf` | إعدادات Nginx |
| `scripts/setup-nginx.sh` | سكريبت تشغيل Nginx |
| `scripts/start-all.sh` | سكريبت تشغيل كل الخدمات |
| `package.json` | الأوامر (شغلل، شغل، dev) |

---

## الخلاصة

**للتطوير المحلي:**

```bash
npm run شغلل
```

**للمشاركة السريعة:**

```bash
cloudflared tunnel --url http://localhost:80
```

**للإنتاج:**

- استخدم Netlify (الحالي)
- أو Cloudflare Tunnel الدائم

---

## المراجع

- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [Nginx Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

---

**آخر تحديث:** 2026-01-30  
**الإصدار:** 3.2.4
