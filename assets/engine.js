/* çekirdek/atlas modül motoru.
   Bir modül = window.MODULE verisi + isteğe bağlı lab.render(step, stateEl) geri çağrısı.
   Motor tüm ortak yapıyı (üst bar, hero, bölümler, lab stepper, boru hattı, quiz, kopyalama) kurar.
   Böylece her modül sayfası ~400 satırlık tekrar yerine sadece kendi verisini taşır. */
(function () {
  "use strict";
  var E = {};
  function h(html) { return html == null ? "" : String(html); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /* ---- ortak boru hattı (ofansif modüller) ---- */
  E.exploitPipeline = function () {
    return '<div class="pipe"><div class="pipe-row">' +
      '<div class="stage bug"><div class="sn">01</div><b>Bug</b><p>Bellek bozulması: UAF, taşma, OOB.</p></div>' +
      '<div class="stage"><div class="sn">02</div><b>Bilgi sızıntısı</b><p>Bir adres sızar; bellek düzeni öğrenilir.</p></div>' +
      '<div class="stage"><div class="sn">03</div><b>Keyfi okuma/yazma</b><p>İstenen adrese okuma/yazma yeteneği.</p></div>' +
      '<div class="stage"><div class="sn">04</div><b>Kontrol akışı</b><p>Dönüş adresi / işaretçi ele geçirilir.</p></div>' +
      '<div class="stage pay"><div class="sn">05</div><b>Yük</b><p>Kod çalışır veya yetki yükselir.</p></div>' +
      '</div><div class="pipe-guards">' +
      '<div class="guard"><div class="gn">MTE · ASan</div><div class="gt">Belleği etiketler, bug\'ı anında yakalar.</div></div>' +
      '<div class="guard"><div class="gn">ASLR / KASLR</div><div class="gt">Adresleri rastgeleleştirir, sızıntıyı zorunlu kılar.</div></div>' +
      '<div class="guard"><div class="gn">PAN · SMAP</div><div class="gt">Çekirdeğin kullanıcı belleğine erişimini sınırlar.</div></div>' +
      '<div class="guard"><div class="gn">CFI · PAC</div><div class="gt">İşaretçi bütünlüğünü doğrular, akış kaçırmayı kırar.</div></div>' +
      '<div class="guard"><div class="gn">DEP/NX · W^X</div><div class="gt">Veriyi çalıştırmayı engeller, yükü ROP\'a zorlar.</div></div>' +
      '</div></div>' +
      '<p class="pipe-note">Her koruma zinciri bir aşamada keser ama hiçbiri tek başına mutlak değil: bir sızıntı ASLR\'yi, ROP ise DEP\'i aşar. Bu yüzden korumalar katmanlı kullanılır ve asıl çözüm bug\'ı baştan engellemektir.</p>';
  };

  function section(inner) { var s = el("section"); var w = el("div", "wrap"); w.innerHTML = inner; s.appendChild(w); return s; }
  function prose(inner) { var s = el("section"); var w = el("div", "wrap prose"); w.innerHTML = inner; s.appendChild(w); return s; }

  E.build = function (M) {
    document.body.setAttribute("data-track", M.track);
    if (M.pageTitle) document.title = M.pageTitle;
    var root = el("div");

    /* üst bar */
    var wrap = el("div", "wrap");
    wrap.innerHTML =
      '<div class="topbar"><a class="brand" href="../index.html">çekirdek<span>/</span>atlas</a>' +
      '<div class="crumbs">' + h(M.crumbs) + '</div></div>' +
      '<header class="hero"><div class="eyebrow">' + h(M.eyebrow) + '</div>' +
      '<h1>' + h(M.titleHTML) + '</h1>' +
      '<p class="lede">' + h(M.lede) + '</p>' +
      (M.meta ? '<div class="meta">' + M.meta.map(function (m) { return "<span>" + esc(m) + "</span>"; }).join("") + "</div>" : "") +
      (M.ethic ? '<div class="ethic"><span>⚠</span><div>' + M.ethic + "</div></div>" : "") +
      "</header>";
    root.appendChild(wrap);

    /* sezgi */
    if (M.intuition) {
      var it = M.intuition;
      root.appendChild(prose(
        "<h2>" + h(it.heading || "Önce sezgi") + "</h2>" +
        (it.paras || []).map(function (p) { return "<p>" + p + "</p>"; }).join("") +
        (it.ideas ? '<ul class="ideas">' + it.ideas.map(function (x) { return "<li><b>" + esc(x.b) + "</b><span>" + h(x.span) + "</span></li>"; }).join("") + "</ul>" : "")
      ));
    }

    /* lab */
    if (M.lab) root.appendChild(buildLab(M.lab));

    /* derinlemesine (zengin Türkçe anlatım + manpage alıntıları) */
    if (M.deepDive) {
      root.appendChild(section('<h2>' + h(M.deepDive.heading || "Derinlemesine") + '</h2><div class="dd prose">' + M.deepDive.html + '</div>'));
    }

    /* kaputun altında (serbest html) */
    if (M.underHood) {
      root.appendChild(section("<h2>" + h(M.underHood.heading || "Kaputun altında") + "</h2>" + M.underHood.html));
    }

    /* sömürü boru hattı */
    if (M.pipeline) {
      root.appendChild(section("<h2>" + h(M.pipeline.heading || "Bir bug nasıl tam ele geçirmeye dönüşür?") + "</h2>" +
        (M.pipeline.intro ? '<p class="prose">' + M.pipeline.intro + "</p>" : "") + E.exploitPipeline()));
    }

    /* kendin dene */
    if (M.tryIt) {
      var items = (M.tryIt.items || []).map(function (t) {
        var shells = (t.shells || []).map(function (sh) {
          return '<div class="shell"><div class="shell-h"><span>' + esc(sh.label || "terminal") + "</span>" +
            (sh.copy ? '<button class="copy" type="button" data-copy="' + escAttr(sh.copy) + '">kopyala</button>' : "") +
            "</div><pre>" + sh.pre + "</pre></div>";
        }).join("");
        return '<div class="try"><h3>' + esc(t.h3) + "</h3><p>" + h(t.p) + "</p>" + shells + "</div>";
      }).join("");
      root.appendChild(section("<h2>" + h(M.tryIt.heading || "Kendin dene") + '</h2><div class="tries">' + items + "</div>"));
    }

    /* quiz */
    if (M.quiz) {
      var qs = (M.quiz.questions || []).map(function (q, i) {
        return '<div class="q" data-answer="' + escAttr(q.answer) + '"><div class="qn">Soru ' + (i + 1) + "</div>" +
          "<p>" + q.q + "</p>" + (q.pre ? "<pre>" + q.pre + "</pre>" : "") +
          '<div class="opts">' + q.opts.map(function (o) { return '<button class="opt" type="button">' + esc(o) + "</button>"; }).join("") + "</div>" +
          '<p class="fb" data-ok="' + escAttr(q.ok) + '" data-no="' + escAttr(q.no) + '"></p></div>';
      }).join("");
      root.appendChild(section("<h2>" + h(M.quiz.heading || "Kendini sına") + '</h2><div class="quiz">' + qs + "</div>"));
    }

    /* next + kaynaklar */
    var nextHTML = "";
    if (M.next) {
      nextHTML += (M.next.href ? '<a class="next-card" href="' + escAttr(M.next.href) + '">' : '<div class="next-card">') +
        '<div class="eyebrow" style="color:var(--muted)">' + h(M.next.eyebrow || "Sıradaki") + "</div>" +
        "<b>" + esc(M.next.title) + "</b><span>" + h(M.next.desc) + "</span>" + (M.next.href ? "</a>" : "</div>");
    }
    if (M.sources) {
      nextHTML += "<div><h3>Kaynaklar</h3><ul class=\"src\">" + M.sources.map(function (s) {
        return '<li><a href="' + escAttr(s.href) + '" target="_blank" rel="noopener">' + esc(s.text) + "</a>" + (s.note ? " <small>· " + esc(s.note) + "</small>" : "") + "</li>";
      }).join("") + "</ul></div>";
    }
    if (nextHTML) root.appendChild(section('<div class="next">' + nextHTML + "</div>"));

    document.body.appendChild(root);
    wireQuiz(root);
    wireCopy(root);
  };

  function escAttr(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }

  /* ---- LAB ---- */
  function buildLab(L) {
    var sec = el("section"); sec.id = "lab";
    var w = el("div", "wrap");
    w.innerHTML =
      "<h2>" + h(L.heading || "Adım adım izle") + "</h2>" +
      (L.intro ? '<p class="prose">' + L.intro + "</p>" : "") +
      '<div class="lab"><div class="lab-head"><div class="step-no" id="stepNo"></div>' +
      '<h3 class="step-title" id="stepTitle"></h3><p class="step-text" id="stepText"></p></div>' +
      '<div class="lab-body"><div class="lab-code"><p class="lab-label">' + esc(L.codeLabel || "kod") + "</p>" +
      '<div class="code"><ol id="codeList"></ol></div>' +
      '<div class="term" aria-live="polite"><div class="line"><span class="prompt">$ </span>' + esc(L.cmd || "./a.out") + '</div><div id="termOut"></div></div></div>' +
      '<div class="lab-state" id="labState"></div></div>' +
      '<div class="controls"><button class="btn" type="button" id="prev">← Geri</button>' +
      '<button class="btn primary" type="button" id="next">İleri →</button>' +
      '<div class="dots" id="dots" role="tablist" aria-label="Adımlar"></div></div></div>' +
      (L.foot ? '<p class="note" style="margin-top:10px">' + L.foot + "</p>" : "");
    sec.appendChild(w);

    // kod satırları
    var listHost = w.querySelector("#codeList");
    (L.code || []).forEach(function (c, i) {
      var li = el("li", c.danger ? "danger" : "");
      li.innerHTML = '<span class="ln">' + (i + 1) + '</span><span class="mk"></span><span class="src">' + (c.t || " ") + "</span>";
      listHost.appendChild(li);
    });
    var lines = listHost.children;

    var dotsHost = w.querySelector("#dots");
    var steps = L.steps || [];
    steps.forEach(function (s, i) {
      var b = el("button", "dot-b", String(i + 1)); b.type = "button";
      b.setAttribute("aria-label", "Adım " + (i + 1) + ": " + (s.title || ""));
      b.addEventListener("click", function () { go(i); });
      dotsHost.appendChild(b);
    });

    var cur = 0, lastOut = 0;
    var refs = { state: w.querySelector("#labState"), term: w.querySelector("#termOut") };

    function go(i) {
      if (i < 0 || i >= steps.length) return;
      var s = steps[i]; cur = i;
      w.querySelector("#stepNo").textContent = "ADIM " + (i + 1) + " / " + steps.length;
      w.querySelector("#stepTitle").textContent = s.title || "";
      w.querySelector("#stepText").innerHTML = s.text || "";
      for (var n = 0; n < lines.length; n++) {
        var ln = n + 1;
        var on = Array.isArray(s.pc) ? s.pc.indexOf(ln) >= 0 : ln === s.pc;
        lines[n].classList.toggle("on", !!on);
        lines[n].querySelector(".mk").textContent = on ? "▸" : "";
      }
      if (typeof L.render === "function") L.render(s, refs.state, { esc: esc, escAttr: escAttr });
      var out = s.term || [];
      refs.term.innerHTML = out.map(function (t, k) {
        var cls = "line" + (s.termBad && s.termBad(t, k) ? " bad" : "") + (k >= lastOut ? " new" : "");
        return '<div class="' + cls + '">' + esc(t) + "</div>";
      }).join("");
      lastOut = out.length;
      Array.prototype.forEach.call(dotsHost.children, function (d, k) {
        d.classList.toggle("on", k === i); d.setAttribute("aria-current", k === i ? "step" : "false");
      });
      w.querySelector("#prev").disabled = i === 0;
      w.querySelector("#next").textContent = i === steps.length - 1 ? "Baştan ↺" : "İleri →";
    }
    w.querySelector("#prev").addEventListener("click", function () { go(cur - 1); });
    w.querySelector("#next").addEventListener("click", function () { go(cur === steps.length - 1 ? 0 : cur + 1); });
    document.addEventListener("keydown", function (e) {
      var t = e.target && e.target.tagName; if (t === "INPUT" || t === "TEXTAREA") return;
      if (e.key === "ArrowRight") go(Math.min(cur + 1, steps.length - 1));
      if (e.key === "ArrowLeft") go(cur - 1);
    });
    setTimeout(function () { go(0); }, 0);
    return sec;
  }

  /* flash yardımcıları (modül render'ları çağırır) */
  E.flash = function (node, bad) {
    if (!node) return; var c = bad ? "flash-bad" : "flash";
    node.classList.remove(c); void node.offsetWidth; node.classList.add(c);
  };

  function wireQuiz(root) {
    root.querySelectorAll(".q").forEach(function (q) {
      var ans = q.getAttribute("data-answer"), fb = q.querySelector(".fb");
      q.querySelectorAll(".opt").forEach(function (b) {
        b.addEventListener("click", function () {
          if (b.textContent.trim() === ans) {
            b.classList.add("right");
            q.querySelectorAll(".opt").forEach(function (o) { o.disabled = true; });
            fb.textContent = fb.getAttribute("data-ok");
          } else { b.classList.add("wrong"); b.disabled = true; fb.textContent = fb.getAttribute("data-no"); }
        });
      });
    });
  }

  function wireCopy(root) {
    function copyText(text, btn) {
      var done = function () { var o = btn.textContent; btn.textContent = "kopyalandı"; setTimeout(function () { btn.textContent = o; }, 1400); };
      var fallback = function () {
        var ta = el("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) { btn.textContent = "seçip kopyala"; }
        document.body.removeChild(ta);
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
        else fallback();
      } catch (e) { fallback(); }
    }
    root.querySelectorAll("[data-copy]").forEach(function (b) {
      b.addEventListener("click", function () { copyText(b.getAttribute("data-copy"), b); });
    });
  }

  window.ATLAS = E;
})();
