
(function () {
  "use strict";

  var canvas     = document.getElementById("matrix");
  var loadingTxt = document.getElementById("loadingText");
  var percentEl  = document.getElementById("percent");
  var fillEl     = document.getElementById("progressFill");
  var barEl      = document.getElementById("progressBar");
  var logoEl     = document.getElementById("logo");
  var screenLoad = document.getElementById("screenLoading");
  var screenRes  = document.getElementById("screenResult");
  var replayBtn  = document.getElementById("replayBtn");

  var DURATION = 4000;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =======================================================
     1) خلفية كانفس: أحرف خضراء متساقطة (خفيف للجوال)
     ======================================================= */
  var GLYPHS = "0123456789ABCDEFアイウエオカキクケコサシスセソ$#@%&*";
  var ctx = canvas.getContext("2d");
  var cols = 0, drops = [], fontSize = 16, rafId = null, lastTime = 0;

  function sizeCanvas() {
    // دقة أقل على الجوال = أداء أفضل
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    fontSize = window.innerWidth < 480 ? 13 : 16;
    cols = Math.floor(window.innerWidth / fontSize);
    drops = new Array(cols).fill(1);
  }

  function drawRain(timestamp) {
    // حدود معدل الإطارات (~24 إطار/ثانية) لتخفيف الحمل على الهواتف
    if (timestamp - lastTime < 41) { rafId = requestAnimationFrame(drawRain); return; }
    lastTime = timestamp;

    ctx.fillStyle = "rgba(4, 17, 12, 0.12)"; // أثر تلاشٍ
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.font = fontSize + "px monospace";
    for (var i = 0; i < drops.length; i++) {
      var ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      var x = i * fontSize;
      var y = drops[i] * fontSize;

      ctx.fillStyle = "rgba(190, 255, 225, 0.6)";          // الرأس
      ctx.fillText(ch, x, y);
      ctx.fillStyle = "rgba(0, 255, 156, 0.38)";           // الذيل
      ctx.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)], x, y - fontSize);

      if (y > window.innerHeight && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 0.85;
    }
    rafId = requestAnimationFrame(drawRain);
  }

  function startRain() {
    if (reduceMotion || !ctx) return;   // تخطي عند تفضيل تقليل الحركة
    ctx.fillStyle = "#04110c";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    cancelAnimationFrame(rafId);
    lastTime = 0;
    rafId = requestAnimationFrame(drawRain);
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { sizeCanvas(); startRain(); }, 200);
  });

  sizeCanvas();
  startRain();

  // إيقاف الرسم عند إخفاء الصفحة لتوفير البطارية
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) cancelAnimationFrame(rafId);
    else startRain();
  });

  /* =======================================================
     2) بديل الشعار إن لم يوجد logo.png
     ======================================================= */
  logoEl.addEventListener("error", function () {
    logoEl.classList.add("is-missing");
    logoEl.removeAttribute("src");
  });

  /* =======================================================
     3) عدّاد التحميل الوهمي
     ======================================================= */
  var loadTimer = null;

  function showScreen(el) {
    screenLoad.classList.remove("is-active");
    screenRes.classList.remove("is-active");
    el.classList.add("is-active");
  }

  function runFakeHacking() {
    clearInterval(loadTimer);
    setPercent(0);

    if (reduceMotion) {
      // بدون حركة: يظهر كل شيء فورًا
      setPercent(100);
      setTimeout(reveal, 150);
      return;
    }

    var start = null;
    var span = DURATION;

    loadTimer = setInterval(function () {
      if (start === null) start = performance.now();
      var progress = Math.min((performance.now() - start) / span, 1);

      // تباطؤ في النهاية ليبدو واقعيًا
      var eased = 1 - Math.pow(1 - progress, 2);
      setPercent(Math.round(eased * 100));

      if (progress >= 1) {
        clearInterval(loadTimer);
        setTimeout(reveal, reduceMotion ? 0 : 450);
      }
    }, 60);
  }

  function setPercent(value) {
    percentEl.textContent = value + "%";
    fillEl.style.width = value + "%";
    barEl.setAttribute("aria-valuenow", value);
    loadingTxt.setAttribute("aria-label", "جاري اختراق جهازك... " + value + " بالمئة");
  }

  /* =======================================================
     4) لحظة "الاختراق": وميض ثم عرض الرسالة
     ======================================================= */
  function reveal() {
    if (!reduceMotion) {
      document.body.classList.add("hacked");
      setTimeout(function () { document.body.classList.remove("hacked"); }, 520);
    }
    showScreen(screenRes);

    // إعادة تشغيل حركة العناصر (مهم عند إعادة اللعب)
    restartResultAnimations();
  }

  function restartResultAnimations() {
    var animated = screenRes.querySelectorAll(".tip, .funny, .card, .btn-replay");
    animated.forEach(function (el) { void el.offsetWidth; }); // إعادة التخطيط
    if (reduceMotion) return;
    animated.forEach(function (el) {
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "";
    });
  }

  /* =======================================================
     5) إعادة التشغيل
     ======================================================= */
  replayBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    showScreen(screenLoad);
    setTimeout(runFakeHacking, 220);
  });

  // ابدأ
  runFakeHacking();
})();