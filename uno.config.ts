import {
    defineConfig,
    presetAttributify,
    presetIcons,
    presetUno,
    presetWebFonts,
    transformerDirectives,
    transformerVariantGroup,
} from 'unocss'

export default defineConfig({
    // 1. القواعد واللغات التي سيفهمها المحرك
    presets: [
        presetUno(), // لدعم كلاسات Tailwind (مثل bg-slate-900)
        presetAttributify(), // للكتابة بنمط السمات (مثل <div border="~ white/10">)
        presetIcons({ // لدعم الأيقونات الفورية في الألعاب والدروس
            scale: 1.2,
            cdn: 'https://esm.sh/',
            extraProperties: {
                'display': 'inline-block',
                'vertical-align': 'middle',
            },
        }),
        presetWebFonts({ // لضمان خطوط متناسقة في كل الصفحات
            fonts: {
                sans: 'Inter',
                mono: 'Fira Code',
                arabic: 'Noto Sans Arabic',
            },
        }),
    ],

    // 2. اختصارات التصميم (Shortcuts) لتوحيد شكل الألعاب والدروس
    shortcuts: {
        // نمط الزجاج الموحد (للبطاقات والقوائم)
        'glass': 'backdrop-blur-md bg-white/5 border border-white/10 shadow-xl',
        'glass-darker': 'backdrop-blur-lg bg-black/20 border border-white/5 shadow-2xl',

        // تصميم أزرار الألعاب
        'game-btn': 'px-6 py-3 rounded-2xl transition-all active:scale-95 flex-center gap-2 font-bold',
        'btn-glass': 'glass hover:bg-white/10 text-white',

        // تصميم حاويات الصفحات (MPA Layouts)
        'page-container': 'max-w-4xl mx-auto px-4 py-8 min-h-screen',
        'flex-center': 'flex items-center justify-center',

        // نص الترجمة العربية الموحد
        'ar-text': 'font-arabic leading-relaxed text-right dir-rtl',
    },

    // 3. التنسيقات المخصصة (Theme) لتدعم النمط الداكن
    theme: {
        colors: {
            brand: {
                primary: '#3b82f6', // أزرق تعليمي
                secondary: '#10b981', // أخضر للنجاح في الألعاب
                accent: '#f59e0b', // برتقالي للتنبيه
            }
        }
    },

    // 4. المحولات (Transformers) للسماح باستخدام @apply في CSS القديم
    transformers: [
        transformerDirectives(),
        transformerVariantGroup(),
    ],
})