module.exports = {
  apps: [
    {
      name: "lexin-app",
      script: "npm",
      args: "run dev",
      watch: false,               // معطل للحفاظ على هدوء المراوح وتقليل استهلاك المعالج
      max_memory_restart: "400M",  // يعيد التشغيل تلقائياً إذا تجاوز الرام 400 ميجا لحماية السيرفر
      env: {
        NODE_ENV: "development",
      },
      instances: 1,               // نسخة واحدة لتقليل الحمل على WindowServer
      exec_mode: "fork",          // النمط الأخف والأسرع في بيئة التطوير
      error_file: "logs/err.log", // سجل الأخطاء لفحصه لاحقاً
      out_file: "logs/out.log"    // سجل العمليات
    }
  ]
}
