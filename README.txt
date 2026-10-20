Çekirdek Atlası — statik site

Yapı:
  index.html              → ana sayfa (71 modüllük katalog)
  assets/site.css         → ortak tasarım sistemi
  assets/engine.js        → modül motoru (her modül bunu kullanır)
  modules/*.html          → modül sayfaları (fork, UAF, Zygote, Mach portları)

Çalıştırma:
  Tamamen statik. Herhangi bir statik sunucuda host edilir
  (GitHub Pages, Netlify, Nginx, Caddy, vb.). Build adımı yok.

  Yerelde denemek için klasörün içinde:
    python3 -m http.server 8000
  sonra tarayıcıda http://localhost:8000

  Not: Yollar görecelidir, bir alt klasörde de (ör. /atlas/) sorunsuz çalışır.

Yeni modül eklemek:
  modules/ içine yeni bir .html kopyala, içindeki MODULE verisini doldur,
  index.html'deki MODULES listesine ilgili satıra dosya yolunu ekle.
