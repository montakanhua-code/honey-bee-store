const state = { products: [], cart: {} };
const money = (value) => new Intl.NumberFormat("th-TH", {
  style: "currency", currency: "THB", maximumFractionDigits: 0
}).format(value);

async function loadProducts() {
  const response = await fetch("products.json");
  if (!response.ok) throw new Error("โหลดข้อมูลสินค้าไม่สำเร็จ");
  state.products = await response.json();
  renderProducts();
  renderCart();
}

function renderProducts() {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = state.products.map(product => `
    <article class="product-card">
      <div class="product-image">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
      </div>
      <div class="product-info">
        <span class="product-tag">HONEY BEE · ${escapeHtml(product.size)}</span>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description)}</p>
        <div class="product-bottom">
          <div class="product-price">${money(Number(product.price))} <small>/ ขวด</small></div>
          <button class="add-button" type="button" data-add="${Number(product.id)}">เพิ่มลงตะกร้า +</button>
        </div>
      </div>
    </article>
  `).join("");
  grid.querySelectorAll("[data-add]").forEach(button => {
    button.addEventListener("click", () => addToCart(Number(button.dataset.add)));
  });
}

function addToCart(id) {
  state.cart[id] = (state.cart[id] || 0) + 1;
  renderCart();
  document.getElementById("order").scrollIntoView({ behavior: "smooth", block: "start" });
}

function changeQty(id, delta) {
  const next = (state.cart[id] || 0) + delta;
  if (next <= 0) delete state.cart[id];
  else state.cart[id] = next;
  renderCart();
}

function renderCart() {
  const container = document.getElementById("cart-items");
  const entries = state.products.filter(product => state.cart[product.id]);
  const count = Object.values(state.cart).reduce((sum, qty) => sum + qty, 0);
  const total = entries.reduce((sum, product) => sum + Number(product.price) * state.cart[product.id], 0);
  document.getElementById("cart-count").textContent = count;
  document.getElementById("cart-total").textContent = money(total);

  if (!entries.length) {
    container.innerHTML = '<p class="empty-cart">ยังไม่มีสินค้าในตะกร้า</p>';
    return;
  }
  container.innerHTML = entries.map(product => `
    <div class="cart-row">
      <div>
        <div>${escapeHtml(product.name)} <span style="color:#958b79">(${escapeHtml(product.size)})</span></div>
        <div class="cart-controls">
          <button class="qty-btn" type="button" data-minus="${product.id}" aria-label="ลดจำนวน">−</button>
          <span>${state.cart[product.id]} ชิ้น</span>
          <button class="qty-btn" type="button" data-plus="${product.id}" aria-label="เพิ่มจำนวน">+</button>
          <button class="remove-btn" type="button" data-remove="${product.id}">นำออก</button>
        </div>
      </div>
      <strong>${money(Number(product.price) * state.cart[product.id])}</strong>
    </div>
  `).join("");
  container.querySelectorAll("[data-minus]").forEach(b => b.addEventListener("click", () => changeQty(Number(b.dataset.minus), -1)));
  container.querySelectorAll("[data-plus]").forEach(b => b.addEventListener("click", () => changeQty(Number(b.dataset.plus), 1)));
  container.querySelectorAll("[data-remove]").forEach(b => b.addEventListener("click", () => { delete state.cart[Number(b.dataset.remove)]; renderCart(); }));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

async function submitOrder(event) {
  event.preventDefault();
  const status = document.getElementById("form-status");
  const button = document.getElementById("submit-order");
  const entries = state.products.filter(product => state.cart[product.id]);
  if (!entries.length) {
    status.textContent = "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ";
    status.className = "form-status error";
    return;
  }

  const scriptUrl = window.HONEY_BEE_CONFIG?.GOOGLE_SCRIPT_URL || "";
  if (!scriptUrl.startsWith("https://script.google.com/macros/s/") || !scriptUrl.endsWith("/exec")) {
    status.textContent = "ยังไม่ได้ตั้งค่า Google Apps Script URL กรุณาตรวจสอบไฟล์ config.js";
    status.className = "form-status error";
    return;
  }

  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const total = entries.reduce((sum, product) => sum + Number(product.price) * state.cart[product.id], 0);
  const items = entries.map(product =>
    `${product.name} (${product.size}) x ${state.cart[product.id]} = ${money(Number(product.price) * state.cart[product.id])}`
  ).join(" | ");

  const data = {
    customerName: form.customerName.value.trim(),
    contact: form.contact.value.trim(),
    items,
    total,
    note: form.note.value.trim()
  };

  button.disabled = true;
  button.textContent = "กำลังส่งคำสั่งซื้อ...";
  status.textContent = "กำลังส่งข้อมูล กรุณารอสักครู่";
  status.className = "form-status";

  try {
    // text/plain avoids a CORS preflight; Apps Script reads e.postData.contents as JSON.
    // no-cors makes the response opaque, so the browser cannot confirm the Sheet write.
    await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    });
    status.textContent = "ส่งคำขอแล้ว หากต้องการยืนยันการบันทึก กรุณาตรวจสอบรายการใน Google Sheets";
    status.className = "form-status success";
    state.cart = {};
    form.reset();
    renderCart();
  } catch (error) {
    status.textContent = "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือติดต่อร้านค้า";
    status.className = "form-status error";
  } finally {
    button.disabled = false;
    button.innerHTML = 'ยืนยันคำสั่งซื้อ <span>→</span>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();
  document.getElementById("order-form").addEventListener("submit", submitOrder);
  loadProducts().catch(error => {
    document.getElementById("product-grid").innerHTML = `<p class="loading">${escapeHtml(error.message)}</p>`;
  });
});
