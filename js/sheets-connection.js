/* The spreadsheet destination is stored on this browser, never in the public repository. */
(function () {
  'use strict';
  const key = 'ps_sheets_endpoint';
  const previousSend = window.sendToGoogleSheets;
  const get = id => document.getElementById(id);

  function validateEndpoint(raw) {
    const url = new URL(String(raw).trim());
    if (url.origin !== 'https://script.google.com' || url.username || url.password ||
        url.search || url.hash || !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname)) {
      throw Error('Google Apps Script dağıtımının /exec ile biten adresini girin.');
    }
    return url.href;
  }

  window.openBlueSheetsSettings = function () {
    get('blueSheetsEndpoint').value = localStorage.getItem(key) || '';
    get('blueSheetsMessage').textContent = get('blueSheetsEndpoint').value
      ? 'Bu tarayıcı özel bağlantıyı kullanıyor.'
      : 'Bu tarayıcı varsayılan bağlantıyı kullanıyor. Yeni /exec adresini buraya kaydedebilirsin.';
    get('blueSheetsDialog').showModal();
  };

  window.saveBlueSheetsSettings = function (event) {
    event.preventDefault();
    const status = get('blueSheetsMessage');
    try {
      const url = validateEndpoint(get('blueSheetsEndpoint').value);
      localStorage.setItem(key, url);
      status.textContent = 'Bağlantı kaydedildi. Sonraki kasa işlemleri bu adrese gönderilecek.';
    } catch (error) {
      status.textContent = 'Geçerli bir Google Apps Script /exec adresi girin.';
    }
  };

  window.sendToGoogleSheets = function (payload) {
    const selected = localStorage.getItem(key);
    if (!selected) return previousSend.call(this, payload);
    let endpoint;
    try { endpoint = validateEndpoint(selected); }
    catch (_) {
      window.toast('E-Tablo adresi geçersiz. E-Tablo Bağlantısı ekranından adresi düzeltin.', 'warning');
      return;
    }
    const data = {...payload};
    if (!data.supplierDebts && Array.isArray(window.suppliers)) {
      data.supplierDebts = window.suppliers
        .filter(s => Number(s.balance) > 0)
        .map(s => ({name:s.name,balance:Number(s.balance)}));
    }
    // Apps Script reads this as JSON from postData.contents. A text/plain POST avoids CORS preflight.
    return fetch(endpoint, {
      method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=UTF-8'},
      body:JSON.stringify(data)
    }).catch(() => {
      window.toast('E-Tablo’ya ulaşılamadı. İşlem kasada kayıtlı kaldı; yeniden satış girmeyin.', 'warning');
    });
  };
  document.addEventListener('DOMContentLoaded', () => {
    const target = new URLSearchParams(location.hash.slice(1)).get('sheets-setup');
    if (!target) return;
    // Remove setup data from the address bar; it is never saved without confirmation.
    history.replaceState(history.state, '', location.pathname + location.search);
    try {
      const endpoint = validateEndpoint(target);
      window.openBlueSheetsSettings();
      get('blueSheetsEndpoint').value = endpoint;
      get('blueSheetsMessage').textContent = 'Mağaza bağlantısı hazır. Etkinleştirmek için Bağlantıyı kaydet düğmesine bas.';
    } catch (_) {
      window.toast('Kurulum bağlantısındaki E-Tablo adresi geçersiz.', 'warning');
    }
  });
})();
