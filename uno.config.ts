import {
    defineConfig,
    presetAttributify,
    presetIcons,
    presetUno,
    transformerDirectives,
    transformerVariantGroup,
} from 'unocss'

export default defineConfig({
    // 1. القواعد الجاهزة
    presets: [
        presetUno(), // يفهم لغة Tailwind (مثل text-red-500)
        presetAttributify(), // يسمح لك بالكتابة هكذا: <div text="white" bg="blue">
        presetIcons({
            scale: 1.2, // حجم الأيقونات الافتراضي
            cdn: 'https://esm.sh/' // لجلب الأيقونات بسرعة
        }),
    ],
    // 2. اختصارات خاصة لمشروعك (Glassmorphism)
    shortcuts: {
        'glass-card': 'bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl',
        'btn-primary': 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all',
        'flex-center': 'flex items-center justify-center',
    },
    // 3. تقنيات إضافية
    transformers: [
        transformerDirectives(), // يسمح لك باستخدام @apply في ملفات الـ CSS
        transformerVariantGroup(), // يسمح لك بتجميع الكلاسات: hover:(bg-gray-100 text-black)
    ],
})