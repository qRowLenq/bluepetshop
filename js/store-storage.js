/* Keep the store's own browser records authoritative across releases. */
function loadBluepetshopStore() {
  function read(key, fallback) {
    const raw = localStorage.getItem('ps_' + key);
    if (raw === null) return fallback;
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) throw Error('Geçersiz mağaza kaydı: ' + key);
    return value;
  }

  const stored = localStorage.getItem('ps_products');
  const removed = new Set(read('deleted_product_ids', []).map(String));
  const seed = stored === null ? (window.catalogProducts || []).filter(p => p?.id && !removed.has(String(p.id))) : [];
  const cards = read('products', seed).map(p => ({
    ...p, barcode: String(p.barcode ?? '').trim(), stock: Number(p.stock) || 0,
    cost: Number(p.cost) || 0, price: Number(p.price) || 0, vatRate: p.vatRate == null ? 20 : Number(p.vatRate),
    batches: Array.isArray(p.batches) ? p.batches : []
  }));
  const loaded = {
    products: cards,
    categories: read('categories', [...defaultCategories]),
    suppliers: read('suppliers', []), customers: read('customers', []),
    bundles: read('bundles', []), wasteRecords: read('waste_records', []),
    orders: read('orders', []), platformPendingOrders: read('platform_pending', []),
    deliveredOrders: read('delivered_orders', []), salesHistory: read('sales_history', []),
    expenses: read('expenses', []), manualDeficits: read('deficits', []),
    heldCarts: read('held_carts', []), dailyCloseRecords: read('daily_closes', []),
    cart: [], selectedCategory: 'TÜMÜ', activeCollectCustId: null,
    activeHistorySupplierId: null, currentInvoiceBase64: null, tempBundleItems: []
  };
  Object.assign(window, loaded);
  window.blueProductStorageBaseline = stored;
}

window.loadState = loadBluepetshopStore;
const saveBluepetshopStore = window.saveData;
window.saveData = function (...args) {
  const result = saveBluepetshopStore.apply(this, args);
  window.blueProductStorageBaseline = localStorage.getItem('ps_products');
  return result;
};
