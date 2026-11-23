/* Taxi Dari 78 — mesure des conversions Google Ads + consentement aux cookies
   - Aucun cookie et aucune requête vers Google tant que le visiteur n'a pas cliqué sur « Accepter ».
   - « Refuser » ou aucun choix = aucun suivi.
   - Choix mémorisé 6 mois (localStorage), modifiable via « Gérer les cookies ». */
(function () {
  'use strict';

  var AW = 'AW-18107549581';
  var CONV = {
    resa: AW + '/p-RsCO6fjb4dEI2PrbpD', // Réservation envoyée
    tel:  AW + '/2FbcCPGfjb4dEI2PrbpD', // Clic téléphone
    wa:   AW + '/SMZtCPSfjb4dEI2PrbpD'  // Clic WhatsApp
  };
  var KEY = 'td78_consent';
  var DUREE_MS = 180 * 24 * 3600 * 1000; // 6 mois
  var chargé = false;
  var resaEnvoyee = false;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  // Par défaut : tout refusé
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  });

  /* ---------- Mémorisation du choix ---------- */
  function lire() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && (v.choix === 'granted' || v.choix === 'denied') && Date.now() - v.t < DUREE_MS) return v.choix;
    } catch (e) {}
    return null;
  }
  function ecrire(choix) {
    try { localStorage.setItem(KEY, JSON.stringify({ choix: choix, t: Date.now() })); } catch (e) {}
  }

  /* ---------- Chargement de la balise Google (uniquement après accord) ---------- */
  function chargerGoogle() {
    if (chargé) return;
    chargé = true;
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + AW;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', AW);
  }

  function supprimerCookiesGoogle() {
    var hotes = [location.hostname, '.' + location.hostname.replace(/^www\./, '')];
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (/^(_gcl_|_gac_|_ga)/.test(n)) {
        hotes.forEach(function (h) {
          document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + h;
        });
        document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      }
    });
  }

  /* ---------- Conversions ---------- */
  function conversion(cle) {
    if (!chargé) return; // pas de consentement : rien n'est envoyé
    gtag('event', 'conversion', {
      send_to: CONV[cle],
      value: 1.0,
      currency: 'EUR',
      transport_type: 'beacon'
    });
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var h = (a.getAttribute('href') || '').toLowerCase();
    if (h.indexOf('tel:') === 0) conversion('tel');
    else if (h.indexOf('wa.me') !== -1 || h.indexOf('api.whatsapp.com') !== -1) conversion('wa');
  }, true);

  // Réservation envoyée : l'écran de confirmation du formulaire s'affiche (formulaire validé)
  function surveillerFormulaire() {
    var ok = document.getElementById('formSuccess');
    if (!ok || !window.MutationObserver) return;
    new MutationObserver(function () {
      if (!resaEnvoyee && ok.classList.contains('visible')) {
        resaEnvoyee = true;
        conversion('resa');
      }
    }).observe(ok, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------- Bandeau ---------- */
  function styles() {
    if (document.getElementById('td78-cookie-css')) return;
    var st = document.createElement('style');
    st.id = 'td78-cookie-css';
    st.textContent =
      '#td78-cookies{position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;max-width:760px;margin:0 auto;' +
      'background:#0b0b0b;color:#e8e2d4;border:1px solid #c9a45a;border-radius:10px;padding:16px 18px;' +
      'box-shadow:0 10px 40px rgba(0,0,0,.6);font:14px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif}' +
      '#td78-cookies p{margin:0 0 12px}' +
      '#td78-cookies a{color:#c9a45a;text-decoration:underline}' +
      '#td78-cookies .td78-btns{display:flex;gap:10px;flex-wrap:wrap}' +
      '#td78-cookies button{flex:1 1 140px;padding:11px 16px;border-radius:6px;border:1px solid #c9a45a;' +
      'font:600 13px/1 -apple-system,Segoe UI,Roboto,Arial,sans-serif;letter-spacing:.06em;cursor:pointer;min-height:44px}' +
      '#td78-cookies .td78-non{background:transparent;color:#c9a45a}' +
      '#td78-cookies .td78-oui{background:#c9a45a;color:#050505}';
    document.head.appendChild(st);
  }

  function fermer() {
    var b = document.getElementById('td78-cookies');
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  function afficher() {
    if (document.getElementById('td78-cookies')) return;
    styles();
    var d = document.createElement('div');
    d.id = 'td78-cookies';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', 'Choix des cookies');
    d.innerHTML =
      '<p>Nous utilisons des cookies Google Ads, uniquement avec votre accord, pour mesurer l\'efficacité de nos annonces. ' +
      'Aucun cookie n\'est déposé avant votre choix. ' +
      '<a href="/?confidentialite=1">En savoir plus</a></p>' +
      '<div class="td78-btns">' +
      '<button type="button" class="td78-non">Refuser</button>' +
      '<button type="button" class="td78-oui">Accepter</button>' +
      '</div>';
    document.body.appendChild(d);
    d.querySelector('.td78-oui').addEventListener('click', function () {
      ecrire('granted'); chargerGoogle(); fermer();
    });
    d.querySelector('.td78-non').addEventListener('click', function () {
      ecrire('denied'); supprimerCookiesGoogle(); fermer();
    });
  }

  window.td78Cookies = { reopen: afficher };

  function init() {
    surveillerFormulaire();
    var choix = lire();
    if (choix === 'granted') chargerGoogle();
    else if (choix === null) afficher();
    // Lien « En savoir plus » depuis une page commune : ouvre la politique de confidentialité de l'accueil
    if (/[?&]confidentialite=1/.test(location.search) && typeof window.openPrivacy === 'function') {
      window.openPrivacy();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
