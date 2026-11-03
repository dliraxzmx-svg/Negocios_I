/* =====================================================
   VANTA · Bloque 3 — Estrategias (todo simulado, sin backend)
   Depende de js/app.js (esc, money, getProducts, getC2C, carrito, alertas)
   ===================================================== */

const MODULOS = ['promos', 'escaparate', 'comunidad', 'publicar', 'mis-publicaciones', 'subasta'];

/* ---------- Utilidades ---------- */
function toast(id, msg, error = false, ms = 3500) {
  const t = document.getElementById(id); if (!t) return;
  t.textContent = msg; t.className = 'toast-v' + (error ? ' error' : ''); t.style.display = 'block';
  clearTimeout(t._h); t._h = setTimeout(() => { t.style.display = 'none'; }, ms);
}
function estrellas(n) { n = Math.max(0, Math.min(5, Number(n) || 0)); return '★'.repeat(n) + '☆'.repeat(5 - n); }
function fechaCorta(iso) { const d = new Date(iso + 'T00:00:00'); return isNaN(d) ? '' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); }
function hoyISO() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

function confirmarAccion(titulo, mensaje, onOk, textoOk = 'Eliminar') {
  window._okFn = onOk; window.accionPostAlerta = null;
  document.getElementById('alertTitulo').textContent = titulo;
  document.getElementById('alertMensaje').textContent = mensaje;
  document.getElementById('alertBotones').innerHTML = `<div style="display:flex;gap:10px"><button class="btn btn-secundario" onclick="cerrarAlerta()">Cancelar</button><button class="btn" onclick="ejecutarConfirmacion()">${esc(textoOk)}</button></div>`;
  document.getElementById('customAlert').style.display = 'flex';
}
function ejecutarConfirmacion() { const f = window._okFn; window._okFn = null; cerrarAlerta(); if (f) f(); }

/* Redimensiona la foto para no llenar el almacenamiento local */
function leerImagen(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (!file.type.startsWith('image/')) return reject(new Error('El archivo debe ser una imagen.'));
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => reject(new Error('La imagen no es válida.'));
      im.onload = () => {
        const r = Math.min(1, 600 / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
function previsualizarFoto(input, imgId) {
  const img = document.getElementById(imgId); if (!img) return;
  const f = input.files && input.files[0];
  if (!f) { img.style.display = 'none'; return; }
  leerImagen(f).then(src => { img.src = src; img.style.display = 'block'; }).catch(e => { input.value = ''; img.style.display = 'none'; mostrarAlerta(e.message, 'Imagen no válida'); });
}

/* ---------- Navegación entre módulos ---------- */
function verModulo(id) {
  if (!MODULOS.includes(id)) id = 'promos';
  document.querySelectorAll('.modulo').forEach(m => m.classList.toggle('activo', m.id === 'mod-' + id));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('activo', b.dataset.mod === id));
  if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  if (id === 'promos') renderPromos();
  if (id === 'escaparate') renderEscaparate();
  if (id === 'comunidad') renderComentarios();
  if (id === 'mis-publicaciones') renderMisPublicaciones();
  if (id === 'subasta') renderSubasta();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =====================================================
   1. PROMOCIONES
   ===================================================== */
let simCupon = null; // cupón validado en el simulador

function renderPromos() {
  const activos = getCoupons().filter(c => c.activo);
  const principal = activos.find(c => c.codigo === 'VANTA10') || activos[0];
  document.getElementById('hero-promo-codigo').textContent = principal ? principal.codigo : 'SIN PROMO';
  document.getElementById('hero-promo-titulo').textContent = principal ? `¡${principal.pct}% de descuento!` : 'Sin promociones activas';
  document.getElementById('hero-promo-texto').textContent = principal ? (principal.desc || 'Usa el código en tu carrito.') : 'Vuelve pronto, estamos preparando nuevas promos.';

  const cards = activos.map(c => `<div class="promo-card"><div class="pct">${esc(c.pct)}% OFF</div><p>${esc(c.desc || 'Descuento especial')}</p><span class="code-badge">${esc(c.codigo)}</span>${Number(c.min) ? `<p style="margin:10px 0 0"><small>Compra mínima ${money(c.min)}</small></p>` : ''}</div>`);
  cards.push(`<div class="promo-card demo"><div class="pct">2x1</div><p>En gorras y accesorios seleccionados los fines de semana.</p><small>Promoción demostrativa · próximamente</small></div>`);
  document.getElementById('promos-grid').innerHTML = cards.join('');

  const sel = document.getElementById('sim-producto'), prev = sel.value;
  sel.innerHTML = getProducts().map(p => `<option value="${esc(p.id)}">${esc(p.nombre)} — ${money(p.precio)}</option>`).join('');
  if (prev) sel.value = prev;
  actualizarSimulador();
}

function simulacion() {
  const p = getProducts().find(x => x.id === document.getElementById('sim-producto').value);
  const cant = Math.max(1, Math.min(20, parseInt(document.getElementById('sim-cantidad').value) || 1));
  return { p, cant, subtotal: p ? p.precio * cant : 0 };
}
function actualizarSimulador() {
  const { p, cant, subtotal } = simulacion();
  const box = document.getElementById('sim-total');
  if (!p) { box.textContent = 'No hay productos disponibles.'; return; }
  if (simCupon) {
    const v = validarCupon(simCupon, subtotal);
    if (v.ok) { box.innerHTML = `Total: <s>${money(subtotal)}</s><strong>${money(subtotal - v.descuento)}</strong> <small>(${esc(v.cupon.codigo)} −${v.cupon.pct}%)</small>`; return; }
    simCupon = null; toast('toast-cupon', v.msg, true);
  }
  box.innerHTML = `Total: <strong>${money(subtotal)}</strong> <small>(${cant} × ${esc(p.nombre)})</small>`;
}
function aplicarCuponSimulador() {
  const { subtotal } = simulacion();
  const v = validarCupon(document.getElementById('sim-cupon').value, subtotal);
  if (!v.ok) { simCupon = null; toast('toast-cupon', v.msg, true); }
  else { simCupon = v.cupon.codigo; toast('toast-cupon', `Descuento aplicado (simulado): ${v.cupon.codigo} −${v.cupon.pct}%`); }
  actualizarSimulador();
}
function llevarSimulacionAlCarrito() {
  const { p, cant } = simulacion(); if (!p) return;
  agregarProductoDirecto(p.id, cant);
  if (simCupon) setCuponAplicado(simCupon);
  abrirCarrito();
}
function copiarCodigo() {
  const code = document.getElementById('hero-promo-codigo').textContent;
  const ok = () => mostrarAlerta(`Código ${code} copiado. Pégalo en tu carrito.`, 'Copiado');
  if (navigator.clipboard) navigator.clipboard.writeText(code).then(ok, () => mostrarAlerta(`Tu código es ${code}.`, 'Código'));
  else mostrarAlerta(`Tu código es ${code}.`, 'Código');
}

/* =====================================================
   2. ESCAPARATE
   ===================================================== */
const TESTIMONIOS = [
  { n: 'Mariana R.', r: 5, t: 'La tela es increíble y el corte oversize queda perfecto. Ya quiero otra.' },
  { n: 'Carlos G.', r: 5, t: 'Llegó rápido y el empaque está muy cuidado. 100% recomendado.' },
  { n: 'Ximena T.', r: 4, t: 'Me encanta el estilo, los colores combinan con todo mi clóset.' }
];
function productoDestacado() { const ps = getProducts(); return ps.find(p => p.id === 'V004') || ps[0]; }
function renderEscaparate() {
  const p = productoDestacado(); if (!p) return;
  document.getElementById('esc-nombre').textContent = p.nombre;
  document.getElementById('esc-desc').textContent = p.desc;
  document.getElementById('esc-precio').innerHTML = `<s>${money(Math.round(p.precio * 1.25))}</s>${money(p.precio)}`;
  const v = document.getElementById('esc-visual'); v.innerHTML = visualInner(p); v.className = 'producto-visual oscuro';
  document.getElementById('testimonios').innerHTML = TESTIMONIOS.map(t => `<div class="comentario"><div class="meta"><strong>${esc(t.n)}</strong><span class="stars">${estrellas(t.r)}</span></div><p>“${esc(t.t)}”</p></div>`).join('');
}
function comprarDestacado() { const p = productoDestacado(); if (p) { agregarProductoDirecto(p.id, 1); abrirCarrito(); } }

/* =====================================================
   3. COMUNIDAD / COMENTARIOS
   ===================================================== */
const COMENTARIOS_BASE = [
  { id: 1, nombre: 'Andrea P.', rating: 5, texto: '¡Me encanta la Essential Oversize Tee! Súper cómoda para todos los días.', fecha: '2026-10-18' },
  { id: 2, nombre: 'Luis M.', rating: 4, texto: 'Buena calidad en las sudaderas, ojalá agreguen más colores.', fecha: '2026-10-22' },
  { id: 3, nombre: 'Daniela V.', rating: 5, texto: 'La subasta estuvo muy divertida, ¡quiero más drops así!', fecha: '2026-10-27' }
];
function getComentarios() { try { const c = JSON.parse(localStorage.getItem('vantaComments')); return Array.isArray(c) ? c : COMENTARIOS_BASE; } catch (e) { return COMENTARIOS_BASE; } }
function renderComentarios() {
  const cs = getComentarios();
  document.getElementById('lista-comentarios').innerHTML = cs.length ? cs.map(c => `<div class="comentario"><div class="meta"><strong>${esc(c.nombre)}</strong><span class="stars">${estrellas(c.rating)}</span></div><p>${esc(c.texto)}</p><div class="meta" style="margin-top:8px"><span>${esc(fechaCorta(c.fecha))}</span></div></div>`).join('') : '<p class="vacio">Aún no hay comentarios. ¡Sé el primero!</p>';
  const prom = cs.length ? cs.reduce((n, c) => n + Number(c.rating || 0), 0) / cs.length : 0;
  document.getElementById('rating-prom').textContent = prom.toFixed(1);
  document.getElementById('rating-estrellas').textContent = estrellas(Math.round(prom));
  document.getElementById('rating-total').textContent = `${cs.length} comentario${cs.length === 1 ? '' : 's'}`;
  const n = document.getElementById('com-nombre'); if (n && !n.value) n.value = nombreUsuario();
}
function agregarComentario(e) {
  e.preventDefault();
  const nombre = document.getElementById('com-nombre').value.trim() || nombreUsuario() || 'Anónimo',
    texto = document.getElementById('com-texto').value.trim() || 'Me gusta la propuesta de VANTA.',
    rating = Number(document.getElementById('com-rating').value) || 5;
  const cs = getComentarios(); cs.unshift({ id: Date.now(), nombre, rating, texto, fecha: hoyISO() });
  try { localStorage.setItem('vantaComments', JSON.stringify(cs)); } catch (err) { toast('toast-com', 'No se pudo guardar el comentario.', true); return; }
  document.getElementById('com-texto').value = ''; document.getElementById('com-contador').textContent = '0/280';
  renderComentarios(); toast('toast-com', 'Comentario publicado (simulado). ¡Gracias por opinar!');
}

/* =====================================================
   4. C2C — PUBLICAR PRODUCTO
   ===================================================== */
async function publicarC2C(e) {
  e.preventDefault();
  const nombre = document.getElementById('c2c-titulo').value.trim() || 'Producto VANTA',
    precioIn = Number(document.getElementById('c2c-precio').value), precio = precioIn > 0 ? precioIn : 199,
    categoria = document.getElementById('c2c-categoria').value,
    desc = document.getElementById('c2c-desc').value.trim() || 'Sin descripción.',
    file = document.getElementById('c2c-foto').files[0];
  let img = '';
  try { img = await leerImagen(file); } catch (err) { toast('toast-c2c', err.message, true); return; }
  const lista = getC2C();
  lista.unshift({ id: 'C2C-' + Date.now(), nombre, categoria, precio, desc, visual: '✦', clase: 'claro', img, vendedor: nombreUsuario() || 'Tú', fecha: hoyISO() });
  if (!saveC2C(lista)) { toast('toast-c2c', 'No se pudo guardar (almacenamiento lleno). Prueba con una foto más ligera.', true); return; }
  document.getElementById('form-c2c').reset(); document.getElementById('c2c-preview').style.display = 'none';
  mostrarAlerta('Publicado (simulado). Tu producto ya aparece en “Mis publicaciones” y en el catálogo.', '¡Producto publicado!', () => verModulo('mis-publicaciones'));
}

/* =====================================================
   5. MIS PUBLICACIONES
   ===================================================== */
function renderMisPublicaciones() {
  const cont = document.getElementById('grid-mis-publicaciones'), lista = getC2C();
  if (!lista.length) { cont.innerHTML = '<p class="vacio" style="grid-column:1/-1">Aún no tienes publicaciones. ¡Publica tu primer producto!</p>'; return; }
  cont.innerHTML = lista.map(p => `<div class="item-c2c"><div class="producto-visual ${esc(p.clase || '')}">${visualInner(p)}</div><strong>${esc(p.nombre)}</strong><div class="precio">${money(p.precio)}</div><small>${esc(p.categoria)} · ${esc(fechaCorta(p.fecha))}</small><small>${esc(p.desc)}</small><div class="acciones"><button class="btn btn-secundario" onclick="abrirEditarC2C('${esc(p.id)}')">✏️ Editar</button><button class="btn" onclick="confirmarEliminarC2C('${esc(p.id)}')">🗑️ Eliminar</button></div></div>`).join('');
}
let editC2CId = null;
function abrirEditarC2C(id) {
  const p = getC2C().find(x => x.id === id); if (!p) return; editC2CId = id;
  document.getElementById('e-titulo').value = p.nombre; document.getElementById('e-precio').value = p.precio;
  document.getElementById('e-categoria').value = p.categoria; document.getElementById('e-desc').value = p.desc;
  document.getElementById('e-foto').value = ''; document.getElementById('modalEditarC2C').style.display = 'flex';
}
function cerrarEditarC2C() { document.getElementById('modalEditarC2C').style.display = 'none'; editC2CId = null; }
async function guardarEdicionC2C(e) {
  e.preventDefault();
  const lista = getC2C(), i = lista.findIndex(x => x.id === editC2CId); if (i < 0) return;
  const nombre = document.getElementById('e-titulo').value.trim() || lista[i].nombre,
    precioIn = Number(document.getElementById('e-precio').value), precio = precioIn > 0 ? precioIn : lista[i].precio,
    desc = document.getElementById('e-desc').value.trim() || lista[i].desc;
  let img = lista[i].img;
  try { const nueva = await leerImagen(document.getElementById('e-foto').files[0]); if (nueva) img = nueva; } catch (err) { mostrarAlerta(err.message, 'Imagen no válida'); return; }
  lista[i] = { ...lista[i], nombre, precio, desc, categoria: document.getElementById('e-categoria').value, img };
  if (!saveC2C(lista)) { mostrarAlerta('No se pudo guardar (almacenamiento lleno).', 'Error'); return; }
  cerrarEditarC2C(); renderMisPublicaciones(); mostrarAlerta('Tu publicación fue actualizada (simulado).', '¡Guardado!');
}
function confirmarEliminarC2C(id) {
  const p = getC2C().find(x => x.id === id); if (!p) return;
  confirmarAccion('Eliminar publicación', `¿Seguro que deseas eliminar "${p.nombre}"? También se quitará del catálogo.`, () => {
    saveC2C(getC2C().filter(x => x.id !== id)); renderMisPublicaciones();
  });
}

/* =====================================================
   6. SUBASTA SIMULADA
   ===================================================== */
const SUB_DURACION_MS = 5 * 60 * 1000, SUB_INCREMENTO = 10, RIVALES = ['Juan M.', 'Elena R.', 'Diego S.', 'Paola C.'];
function nuevaSubasta() {
  const ahora = Date.now();
  return { fin: ahora + SUB_DURACION_MS, actual: 800, lider: 'Juan M.', cerrada: false, ofertas: [{ quien: 'Juan M.', monto: 800 }, { quien: 'Elena R.', monto: 780 }, { quien: 'Diego S.', monto: 750 }] };
}
function getSubasta() { try { const s = JSON.parse(localStorage.getItem('vantaSubasta')); if (s && s.fin && Array.isArray(s.ofertas)) return s; } catch (e) { } const s = nuevaSubasta(); saveSubasta(s); return s; }
function saveSubasta(s) { try { localStorage.setItem('vantaSubasta', JSON.stringify(s)); } catch (e) { } }

function renderSubasta() {
  if (!document.getElementById('sub-timer')) return;
  const s = getSubasta(), resta = Math.max(0, Math.ceil((s.fin - Date.now()) / 1000));
  if (resta === 0 && !s.cerrada) { s.cerrada = true; saveSubasta(s); }
  const t = document.getElementById('sub-timer');
  t.textContent = String(Math.floor(resta / 60)).padStart(2, '0') + ':' + String(resta % 60).padStart(2, '0');
  t.className = 'timer' + (!s.cerrada && resta <= 60 ? ' urgente' : '');
  document.getElementById('sub-monto').textContent = money(s.actual);
  document.getElementById('sub-lider').textContent = s.lider ? (s.lider === 'Tú' ? 'Vas ganando 🎉' : 'Va ganando ' + s.lider) : '';
  document.getElementById('sub-minimo').textContent = s.cerrada ? '' : 'Oferta mínima: ' + money(s.actual + SUB_INCREMENTO);
  const est = document.getElementById('sub-estado'); est.textContent = s.cerrada ? 'SUBASTA FINALIZADA' : 'SUBASTA EN VIVO'; est.className = 'estado' + (s.cerrada ? ' fin' : '');
  document.getElementById('sub-form-zona').style.display = s.cerrada ? 'none' : 'block';
  const res = document.getElementById('sub-resultado');
  if (s.cerrada) {
    res.innerHTML = s.lider === 'Tú'
      ? `<div class="ganaste"><strong>¡Ganaste la subasta!</strong><p style="margin:6px 0 10px;color:#ddd">Tu oferta final: ${money(s.actual)}</p><button class="btn" onclick="llevarSubastaAlCarrito()">Llevar a mi carrito</button></div>`
      : `<p style="margin-top:15px"><strong>Subasta cerrada.</strong> Ganó ${esc(s.lider)} con ${money(s.actual)}.</p>`;
  } else res.innerHTML = '';
  document.getElementById('lista-ofertas').innerHTML = s.ofertas.slice(0, 10).map(o => `<li>${o.quien === 'Tú' ? '<strong>Tú</strong>' : esc(o.quien)} ofertó ${money(o.monto)}</li>`).join('');
}
function sugerirOferta(extra) { const s = getSubasta(); document.getElementById('sub-oferta').value = s.actual + extra; document.getElementById('sub-oferta').focus(); }
function hacerOferta() {
  const s = getSubasta(); if (s.cerrada || s.fin <= Date.now()) { renderSubasta(); toast('toast-subasta', 'La subasta ya terminó.', true); return; }
  const input = document.getElementById('sub-oferta'), minimo = s.actual + SUB_INCREMENTO, monto = Math.round((parseFloat(input.value) || minimo) * 100) / 100;
  if (monto < minimo) { toast('toast-subasta', `Tu oferta debe ser de al menos ${money(minimo)}.`, true); return; }
  s.actual = monto; s.lider = 'Tú'; s.ofertas.unshift({ quien: 'Tú', monto }); saveSubasta(s);
  input.value = ''; renderSubasta(); toast('toast-subasta', 'Oferta registrada (simulado). ¡Vas ganando!');
}
function reiniciarSubasta() { saveSubasta(nuevaSubasta()); renderSubasta(); toast('toast-subasta', 'Subasta reiniciada para la demostración.'); }
function llevarSubastaAlCarrito() {
  const s = getSubasta(); if (!(s.cerrada && s.lider === 'Tú')) return;
  const c = getCart().filter(x => x.id !== 'SUB-DROP01');
  c.push({ id: 'SUB-DROP01', nombre: 'VANTA Drop 01 Hoodie (Subasta)', precio: s.actual, cantidad: 1 });
  saveCart(c); abrirCarrito();
}
/* Ofertas de rivales simuladas para que la subasta se sienta en vivo */
let _tickRival = 0;
function rivalPuja() {
  const s = getSubasta(); if (s.cerrada || s.fin <= Date.now()) return;
  if (Math.random() > 0.45) return;
  const candidatos = RIVALES.filter(r => r !== s.lider);
  const quien = candidatos[Math.floor(Math.random() * candidatos.length)];
  const monto = s.actual + SUB_INCREMENTO * (1 + Math.floor(Math.random() * 3));
  const teSuperaron = s.lider === 'Tú';
  s.actual = monto; s.lider = quien; s.ofertas.unshift({ quien, monto }); saveSubasta(s); renderSubasta();
  if (teSuperaron) toast('toast-subasta', `${quien} superó tu oferta con ${money(monto)}.`, true);
}
setInterval(() => {
  if (!document.getElementById('mod-subasta').classList.contains('activo')) return;
  renderSubasta();
  if (++_tickRival % 20 === 0) rivalPuja();
}, 1000);

/* ---------- Arranque ---------- */
document.addEventListener('DOMContentLoaded', () => {
  verModulo((location.hash || '#promos').replace('#', ''));
  window.scrollTo(0, 0);
});
window.addEventListener('hashchange', () => verModulo(location.hash.replace('#', '')));
