const DEFAULT_PRODUCTS = [
  {id:'V001',nombre:'Essential Oversize Tee',categoria:'playeras',precio:499,desc:'Playera de corte amplio y estilo minimalista.',visual:'V',clase:'',oferta:true},
  {id:'V002',nombre:'Street Graphic Tee',categoria:'playeras',precio:549,desc:'Diseño gráfico inspirado en el arte urbano.',visual:'✦',clase:'oscuro'},
  {id:'V003',nombre:'VANTA Hoodie',categoria:'sudaderas',precio:899,desc:'Sudadera cómoda para tus días de ciudad.',visual:'◐',clase:'claro'},
  {id:'V004',nombre:'Night Hoodie',categoria:'sudaderas',precio:949,desc:'Diseño sobrio con detalles contemporáneos.',visual:'◇',clase:'oscuro',oferta:true},
  {id:'V005',nombre:'Cargo Relaxed',categoria:'pantalones',precio:799,desc:'Pantalón cargo de silueta relajada.',visual:'▱',clase:'claro'},
  {id:'V006',nombre:'Classic Wide Pants',categoria:'pantalones',precio:749,desc:'Corte amplio para combinar con todo.',visual:'△',clase:''},
  {id:'V007',nombre:'VANTA Cap',categoria:'accesorios',precio:349,desc:'Gorra clásica con identidad VANTA.',visual:'⌒',clase:'oscuro',oferta:true},
  {id:'V008',nombre:'Street Tote',categoria:'accesorios',precio:399,desc:'Bolsa práctica para llevar tu día contigo.',visual:'□',clase:'claro'}
];

function getProducts(){try{const stored=JSON.parse(localStorage.getItem('vantaProducts'));if(!Array.isArray(stored))return DEFAULT_PRODUCTS;return stored.map(p=>{const d=DEFAULT_PRODUCTS.find(x=>x.id===p.id);return d?{...d,...p,oferta:Boolean(d.oferta||p.oferta)}:p})}catch(e){return DEFAULT_PRODUCTS}}
function saveProducts(p){localStorage.setItem('vantaProducts',JSON.stringify(p))}

/* ===== BLOQUE 3: cupones, publicaciones C2C y helpers compartidos ===== */
const DEFAULT_COUPONS=[
 {codigo:'VANTA10',pct:10,min:0,activo:true,desc:'10% de descuento en toda la tienda'},
 {codigo:'STREET15',pct:15,min:1500,activo:true,desc:'15% de descuento en compras desde $1,500'}
];
const DEFAULT_C2C=[
 {id:'C2C-001',nombre:'Tote Pintado a Mano',categoria:'accesorios',precio:280,desc:'Tote de tela pintado a mano, pieza única.',visual:'▣',clase:'claro',img:'',vendedor:'Tú',fecha:'2026-10-20'}
];
function getCoupons(){try{const c=JSON.parse(localStorage.getItem('vantaCoupons'));return Array.isArray(c)?c:DEFAULT_COUPONS}catch(e){return DEFAULT_COUPONS}}
function saveCoupons(c){localStorage.setItem('vantaCoupons',JSON.stringify(c))}
function getC2C(){try{const c=JSON.parse(localStorage.getItem('vantaC2C'));return Array.isArray(c)?c:[]}catch(e){return[]}}
function saveC2C(c){try{localStorage.setItem('vantaC2C',JSON.stringify(c));return true}catch(e){return false}}
function getAllProducts(){return getProducts().concat(getC2C().map(p=>({...p,comunidad:true})))}
function visualInner(p){return p.img?`<img src="${esc(p.img)}" alt="${esc(p.nombre)}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;margin:0">`:esc(p.visual||'✦')}
function nombreUsuario(){try{const u=JSON.parse(localStorage.getItem('vantaUser')||'null');return u?.nombre||''}catch(e){return''}}
function getCuponAplicado(){return localStorage.getItem('vantaCoupon')||''}
function setCuponAplicado(c){if(c)localStorage.setItem('vantaCoupon',c);else localStorage.removeItem('vantaCoupon')}
function validarCupon(codigo,subtotal){
 const code=String(codigo||'').trim().toUpperCase();
 if(!code)return{ok:false,msg:'Escribe un código de descuento.'};
 const c=getCoupons().find(x=>String(x.codigo).toUpperCase()===code);
 if(!c)return{ok:false,msg:'Código inválido.'};
 if(!c.activo)return{ok:false,msg:'Este código ya no está activo.'};
 if(subtotal<Number(c.min||0))return{ok:false,msg:`Este código requiere una compra mínima de ${money(c.min)}.`};
 return{ok:true,cupon:c,descuento:Math.round(subtotal*Number(c.pct))/100};
}
function calcTotales(items){
 const subtotal=items.reduce((n,p)=>n+p.precio*p.cantidad,0);
 const code=getCuponAplicado();let descuento=0,cupon=null,msg='';
 if(code&&subtotal>0){const v=validarCupon(code,subtotal);if(v.ok){descuento=v.descuento;cupon=v.cupon}else msg=v.msg}
 return{subtotal,descuento,cupon,msg,total:Math.max(0,subtotal-descuento)};
}
function agregarProductoDirecto(id,cantidad=1){
 const p=getAllProducts().find(x=>x.id===id);if(!p)return false;
 const c=getCart(),e=c.find(x=>x.id===p.id);
 if(e)e.cantidad+=cantidad;else c.push({id:p.id,nombre:p.nombre,precio:p.precio,cantidad});
 saveCart(c);return true;
}
function money(n){return '$'+Number(n).toFixed(2)+' MXN'}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

function mostrarAlerta(mensaje,titulo='Aviso',accion=null){
 const t=document.getElementById('alertTitulo'),m=document.getElementById('alertMensaje'),b=document.getElementById('alertBotones');
 if(t)t.textContent=titulo;if(m)m.textContent=mensaje;
 if(b)b.innerHTML='<button class="btn" onclick="cerrarAlerta()">Aceptar</button>';
 const x=document.getElementById('customAlert');if(x)x.style.display='flex';
 window.accionPostAlerta=accion;
}
function cerrarAlerta(){const x=document.getElementById('customAlert');if(x)x.style.display='none';if(window.accionPostAlerta){const a=window.accionPostAlerta;window.accionPostAlerta=null;a()}}
function cerrarDetalle(){const x=document.getElementById('modalDetalle');if(x)x.style.display='none'}
function cerrarModalCarrito(){const x=document.getElementById('modalCarrito');if(x)x.style.display='none'}
function cerrarSesion(){['vantaUser','vantaLogged','vantaGuest','vantaCart','vantaCoupon'].forEach(k=>localStorage.removeItem(k));location.href='index.html'}
function updateAuth(){
 const link=document.getElementById('auth-link'); if(!link)return;
 if(localStorage.getItem('vantaLogged')==='true'){link.textContent='Mi perfil';link.href='perfil.html'}
 else{link.textContent='Iniciar sesión';link.href='login.html'}
 updateCartBadge();
}
function getCart(){try{return JSON.parse(localStorage.getItem('vantaCart'))||[]}catch(e){return[]}}
function saveCart(c){localStorage.setItem('vantaCart',JSON.stringify(c));updateCartBadge()}
function cartCount(){return getCart().reduce((n,p)=>n+p.cantidad,0)}
function updateCartBadge(){document.querySelectorAll('.cart-badge').forEach(x=>x.textContent=cartCount())}

let prodTemp={cantidad:1};
function abrirDetalle(id){
 const p=getAllProducts().find(x=>x.id===id);if(!p)return;
 prodTemp={...p,cantidad:1};
 document.getElementById('det-nombre').textContent=p.nombre;
 document.getElementById('det-precio').textContent=money(p.precio);
 document.getElementById('det-desc').textContent=p.desc;
 const c=document.getElementById('det-cantidad');if(c)c.textContent='1';
 const img=document.getElementById('det-visual');if(img){img.innerHTML=visualInner(p);img.className='producto-visual '+(p.clase||'');}
 const vend=document.getElementById('det-vendedor');if(vend){vend.textContent=p.comunidad?('Publicado por '+p.vendedor+' · Comunidad VANTA'):'';vend.style.display=p.comunidad?'block':'none'}
 const rel=document.getElementById('enlaces-relacionados');
 if(rel){rel.innerHTML=getAllProducts().filter(x=>x.id!==p.id&&x.categoria===p.categoria).slice(0,2).map(x=>`<a href="#" onclick="abrirDetalle('${x.id}');return false;">${esc(x.nombre)}</a>`).join(' · ')||'No hay otros productos de esta categoría.'}
 document.getElementById('modalDetalle').style.display='flex';
}
function cambiarCantidadDetalle(delta){prodTemp.cantidad=Math.max(1,prodTemp.cantidad+delta);document.getElementById('det-cantidad').textContent=prodTemp.cantidad}
function agregarAlCarrito(){
 const c=getCart(),e=c.find(x=>x.id===prodTemp.id);
 if(e)e.cantidad+=prodTemp.cantidad;else c.push({id:prodTemp.id,nombre:prodTemp.nombre,precio:prodTemp.precio,cantidad:prodTemp.cantidad});
 saveCart(c);cerrarDetalle();mostrarAlerta(`Se agregó ${prodTemp.cantidad}x "${prodTemp.nombre}" a tu carrito.`,'¡Agregado!')
}
function renderCarrito(){
 const lista=document.getElementById('lista-carrito');if(!lista)return;
 const c=getCart();
 if(!c.length){lista.innerHTML='<p style="text-align:center;color:#888;">Tu carrito está vacío.</p>'}
 else lista.innerHTML=c.map((p,i)=>`<div class="cart-item"><div class="cart-item-info"><strong>${esc(p.nombre)}</strong><br><small>${money(p.precio)} c/u</small></div><div class="cart-item-acciones"><div class="selector-cantidad" style="margin:0"><button onclick="modificarCantidad(${i},-1)">−</button><span>${p.cantidad}</span><button onclick="modificarCantidad(${i},1)">+</button></div><button class="btn-eliminar" onclick="confirmarEliminarCarrito(${i})">🗑️</button></div></div>`).join('');
 const t=calcTotales(c);
 const st=document.getElementById('subtotal-carrito');if(st)st.textContent=money(t.subtotal);
 const fila=document.getElementById('fila-descuento');
 if(fila){fila.style.display=t.cupon?'flex':'none';if(t.cupon){document.getElementById('desc-label').innerHTML=`Descuento ${esc(t.cupon.codigo)} (−${t.cupon.pct}%) <a href="#" onclick="quitarCupon();return false">quitar</a>`;document.getElementById('descuento-carrito').textContent='−'+money(t.descuento)}}
 const msg=document.getElementById('cupon-msg');if(msg&&!msg.dataset.fijo){msg.textContent=t.cupon?'':t.msg;msg.className='cupon-msg'+(t.msg?' error':'')}
 const inp=document.getElementById('cupon-input');if(inp&&t.cupon&&document.activeElement!==inp)inp.value=t.cupon.codigo;
 document.getElementById('total-carrito').textContent=money(t.total);
}
function aplicarCuponCarrito(){
 const c=getCart(),inp=document.getElementById('cupon-input'),msg=document.getElementById('cupon-msg');
 const sub=c.reduce((n,p)=>n+p.precio*p.cantidad,0);
 if(!c.length){msg.textContent='Agrega productos antes de aplicar un código.';msg.className='cupon-msg error';return}
 const v=validarCupon(inp.value,sub);
 if(!v.ok){msg.textContent=v.msg;msg.className='cupon-msg error';return}
 setCuponAplicado(v.cupon.codigo);msg.dataset.fijo='';renderCarrito();
 msg.textContent='Descuento aplicado (simulado): '+v.cupon.codigo;msg.className='cupon-msg ok';
}
function quitarCupon(){setCuponAplicado('');const inp=document.getElementById('cupon-input');if(inp)inp.value='';const m=document.getElementById('cupon-msg');if(m){m.textContent='';m.className='cupon-msg'}renderCarrito()}
function modificarCantidad(i,d){const c=getCart();if(!c[i])return;c[i].cantidad+=d;if(c[i].cantidad<1)c.splice(i,1);saveCart(c);renderCarrito()}
function confirmarEliminarCarrito(i){
 const c=getCart(),p=c[i];if(!p)return;
 document.getElementById('alertTitulo').textContent='Eliminar producto';
 document.getElementById('alertMensaje').textContent=`¿Deseas eliminar "${p.nombre}" de tu carrito?`;
 document.getElementById('alertBotones').innerHTML=`<div style="display:flex;gap:10px"><button class="btn btn-secundario" style="flex:1" onclick="cerrarAlerta()">No</button><button class="btn" style="flex:1" onclick="ejecutarEliminarCarrito(${i})">Sí, eliminar</button></div>`;
 document.getElementById('customAlert').style.display='flex';
}
function ejecutarEliminarCarrito(i){const c=getCart();c.splice(i,1);saveCart(c);renderCarrito();cerrarAlerta()}
const CART_MODAL_HTML=`<div id="modalCarrito" class="modal-overlay"><div class="modal-box" style="max-width:520px;width:calc(100% - 30px);text-align:left"><h2>🛒 Mi carrito</h2><div id="lista-carrito" style="margin:20px 0;max-height:240px;overflow:auto"></div><div class="cupon-row"><input id="cupon-input" placeholder="Código de descuento (ej. VANTA10)"><button class="btn btn-secundario" onclick="aplicarCuponCarrito()">Aplicar</button></div><p id="cupon-msg" class="cupon-msg"></p><div class="resumen-carrito"><div><span>Subtotal</span><span id="subtotal-carrito">$0.00 MXN</span></div><div id="fila-descuento" style="display:none"><span id="desc-label">Descuento</span><span id="descuento-carrito"></span></div><div class="resumen-total"><span>Total</span><span id="total-carrito">$0.00 MXN</span></div></div><div class="terminos-check"><input type="checkbox" id="terminos-checkbox"><label for="terminos-checkbox">Acepto los <a href="terminos.html" target="_blank">términos y condiciones</a></label></div><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn btn-secundario" onclick="cerrarModalCarrito()">Seguir comprando</button><button class="btn" onclick="procesarPago()">Ir a pagar</button></div></div></div>`;
const ALERT_MODAL_HTML=`<div id="customAlert" class="modal-overlay"><div class="modal-box"><h3 id="alertTitulo">Aviso</h3><p id="alertMensaje">Mensaje</p><div id="alertBotones"><button class="btn" onclick="cerrarAlerta()">Aceptar</button></div></div></div>`;
function ensureModals(){
 if(!document.getElementById('customAlert'))document.body.insertAdjacentHTML('beforeend',ALERT_MODAL_HTML);
 if(!document.getElementById('modalCarrito'))document.body.insertAdjacentHTML('beforeend',CART_MODAL_HTML);
}
function abrirCarrito(){ensureModals();renderCarrito();document.getElementById('modalCarrito').style.display='flex'}
function procesarPago(){
 const c=getCart();if(!c.length){mostrarAlerta('Agrega algunos productos antes de ir a pagar.','Carrito vacío');return}
 const cb=document.getElementById('terminos-checkbox');if(cb&&!cb.checked){mostrarAlerta('Debes aceptar los términos y condiciones antes de continuar.','Atención');return}
 const t=calcTotales(c);
 const order={id:'ORD-'+Date.now(),fecha:new Date().toLocaleString('es-MX'),items:c,subtotal:t.subtotal,descuento:t.descuento,cupon:t.cupon?t.cupon.codigo:'',total:t.total};
 const orders=JSON.parse(localStorage.getItem('vantaOrders')||'[]');orders.unshift(order);localStorage.setItem('vantaOrders',JSON.stringify(orders));saveCart([]);setCuponAplicado('');cerrarModalCarrito();
 mostrarAlerta(`Pedido ${order.id} generado por ${money(t.total)}${t.cupon?` (cupón ${t.cupon.codigo}: −${money(t.descuento)})`:''}. El checkout real se integrará posteriormente.`,'¡Pedido generado!');
}
function filtrar(categoria,btn){
 document.querySelectorAll('.categoria-btn').forEach(x=>x.classList.remove('activa'));if(btn)btn.classList.add('activa');
 document.querySelectorAll('.item-producto').forEach(x=>x.style.display=(categoria==='todas'||x.dataset.categoria===categoria)?'block':'none');
 const t=document.getElementById('titulo-seccion');if(t)t.textContent=btn?btn.querySelector('.cat-titulo').textContent:'Todos los productos';
}
function buscarProducto(){
 const q=(document.getElementById('buscador')?.value||'').toLowerCase();
 document.querySelectorAll('.item-producto').forEach(x=>x.style.display=(x.dataset.nombre||'').toLowerCase().includes(q)?'block':'none');
 const t=document.getElementById('titulo-seccion');if(t)t.textContent=q?'Resultados de búsqueda':'Todos los productos';
}
function renderCatalog(){
 const grid=document.getElementById('grid-productos');if(!grid)return;
 const products=getAllProducts();
 grid.innerHTML=products.map(p=>`<div class="producto-card item-producto" data-categoria="${esc(p.categoria)}" data-nombre="${esc(p.nombre)}"><div class="producto-visual ${esc(p.clase||'')}">${p.comunidad?'<span class="producto-comunidad">Comunidad</span>':(p.oferta?'<span class="producto-oferta">Oferta</span>':'')}${visualInner(p)}</div><h3>${esc(p.nombre)}</h3><p>${money(p.precio)}</p><button class="btn btn-secundario" onclick="abrirDetalle('${esc(p.id)}')">Ver detalle</button></div>`).join('');
 updateCartBadge();
 if(location.hash==='#carrito')abrirCarrito();
}
function setupAuth(){
 const reg=document.getElementById('formRegistro');
 if(reg)reg.addEventListener('submit',e=>{e.preventDefault();const n=document.getElementById('reg-nombre').value.trim(),c=document.getElementById('reg-correo').value.trim(),p=document.getElementById('reg-password').value,pc=document.getElementById('reg-confirmar').value,msg=document.getElementById('registro-msg');if(p!==pc){msg.textContent='Las contraseñas no coinciden.';msg.style.color='#c0392b';return}localStorage.setItem('vantaUser',JSON.stringify({nombre:n||'Usuario',correo:c||'usuario@vanta.com',password:p}));localStorage.setItem('vantaLogged','true');localStorage.removeItem('vantaGuest');mostrarAlerta('Tu cuenta fue creada correctamente.','¡Bienvenido a VANTA!',()=>location.href='perfil.html')});
 const login=document.getElementById('formLogin');
 if(login)login.addEventListener('submit',e=>{e.preventDefault();const c=document.getElementById('login-correo').value.trim(),p=document.getElementById('login-password').value,u=JSON.parse(localStorage.getItem('vantaUser')||'null'),msg=document.getElementById('login-msg');if(!c&&!p){localStorage.setItem('vantaLogged','true');localStorage.setItem('vantaGuest','true');mostrarAlerta('Entraste como invitado.','Bienvenido',()=>location.href='inicio.html');return}if(u&&u.correo===c&&u.password===p){localStorage.setItem('vantaLogged','true');localStorage.removeItem('vantaGuest');mostrarAlerta('Inicio de sesión exitoso.','Bienvenido',()=>location.href='perfil.html')}else{msg.textContent='Correo o contraseña incorrectos. Para entrar como invitado deja ambos campos vacíos.';msg.style.color='#c0392b'}});
 const inv=document.getElementById('btnInvitado');if(inv)inv.onclick=()=>{localStorage.setItem('vantaLogged','true');localStorage.setItem('vantaGuest','true');location.href='inicio.html'};
}
function cargarPerfil(){
 const n=document.getElementById('perfil-nombre');if(!n)return;
 const u=JSON.parse(localStorage.getItem('vantaUser')||'null');const guest=localStorage.getItem('vantaGuest')==='true';
 n.textContent=guest?'¡Hola, Invitado!':'¡Hola, '+(u?.nombre||'Usuario')+'!';
 const c=document.getElementById('perfil-correo');if(c)c.textContent=guest?'Navegando como invitado':(u?.correo||'usuario@vanta.com');
 const orders=JSON.parse(localStorage.getItem('vantaOrders')||'[]');const oc=document.getElementById('mis-compras');if(oc)oc.innerHTML=orders.length?orders.slice(0,10).map(o=>`<div class="fila"><strong>${o.id}</strong><br><small>${o.fecha} · ${money(o.total)}${o.cupon?' · cupón '+esc(o.cupon):''}</small></div>`).join(''):'<p>No tienes compras registradas todavía.</p>';
}
function editarPerfil(){
 const u=JSON.parse(localStorage.getItem('vantaUser')||'null');if(!u){mostrarAlerta('Los invitados no tienen un perfil editable.');return}
 document.getElementById('edit-nombre').value=u.nombre;document.getElementById('edit-correo').value=u.correo;document.getElementById('modalEditarPerfil').style.display='flex';
}
function guardarPerfil(e){e.preventDefault();const u=JSON.parse(localStorage.getItem('vantaUser')||'{}');u.nombre=document.getElementById('edit-nombre').value.trim()||u.nombre||'Usuario';u.correo=document.getElementById('edit-correo').value.trim()||u.correo||'usuario@vanta.com';localStorage.setItem('vantaUser',JSON.stringify(u));document.getElementById('modalEditarPerfil').style.display='none';cargarPerfil();mostrarAlerta('Tus datos fueron actualizados.','Perfil actualizado')}
function mostrarPanelPerfil(tipo){
 const titles={direcciones:'Mis Direcciones',metodos:'Métodos de pago',deseos:'Lista de deseos'};
 const msgs={direcciones:'Aquí puedes gestionar tus domicilios de entrega.',metodos:'Los métodos de pago se administrarían en el checkout.',deseos:'Aquí aparecerán tus productos favoritos.'};
 mostrarAlerta(msgs[tipo],titles[tipo]);
}
function initAdmin(){
 if(!document.getElementById('admin-productos'))return;
 renderAdminProducts();updateAdminStats();renderAdminCoupons();
 const f=document.getElementById('formProductoAdmin');if(f)f.onsubmit=guardarProductoAdmin;
 const fc=document.getElementById('formCuponAdmin');if(fc)fc.onsubmit=guardarCuponAdmin;
}
function navegarAdmin(sec,btn){document.querySelectorAll('.admin-section').forEach(x=>x.style.display='none');const el=document.getElementById('sec-'+sec);if(el)el.style.display='block';document.querySelectorAll('.admin-menu button').forEach(x=>x.classList.remove('activo'));if(btn)btn.classList.add('activo')}
let adminEditId=null;
function abrirModalProducto(modo,id=''){adminEditId=modo==='editar'?id:null;const p=getProducts().find(x=>x.id===id);document.getElementById('modalFormTitulo').textContent=modo==='nuevo'?'Nuevo producto':'Editar producto';document.getElementById('admin-prod-nombre').value=p?.nombre||'';document.getElementById('admin-prod-precio').value=p?.precio||'';document.getElementById('admin-prod-categoria').value=p?.categoria||'playeras';document.getElementById('admin-prod-desc').value=p?.desc||'';document.getElementById('admin-prod-visual').value=p?.visual||'✦';document.getElementById('modalFormProducto').style.display='flex'}
function cerrarModalProducto(){document.getElementById('modalFormProducto').style.display='none'}
function guardarProductoAdmin(e){e.preventDefault();let ps=getProducts();const prev=adminEditId?ps.find(x=>x.id===adminEditId):null;const precioIn=Number(document.getElementById('admin-prod-precio').value);const data={nombre:document.getElementById('admin-prod-nombre').value.trim()||prev?.nombre||'Producto nuevo',precio:precioIn>0?precioIn:(prev?.precio||199),categoria:document.getElementById('admin-prod-categoria').value,desc:document.getElementById('admin-prod-desc').value.trim()||prev?.desc||'Sin descripción.',visual:document.getElementById('admin-prod-visual').value.trim()||'✦',clase:document.getElementById('admin-prod-clase').value};if(adminEditId){const i=ps.findIndex(x=>x.id===adminEditId);if(i>=0)ps[i]={...ps[i],...data}}else{data.id='V'+Date.now();ps.push(data)}saveProducts(ps);cerrarModalProducto();renderAdminProducts();updateAdminStats();mostrarAlerta('Los cambios del catálogo fueron guardados.','¡Guardado!')}
function renderAdminProducts(){const t=document.getElementById('admin-productos');if(!t)return;t.innerHTML=getProducts().map(p=>`<tr><td><div class="producto-visual ${esc(p.clase||'')}" style="width:70px;height:55px;font-size:1.5rem;margin:0">${esc(p.visual||'✦')}</div></td><td><strong>${esc(p.nombre)}</strong><br><small>ID: ${esc(p.id)}</small></td><td>${esc(p.categoria)}</td><td><span class="badge-activo">Activo</span></td><td><strong>${money(p.precio)}</strong></td><td><div class="admin-producto-acciones"><button class="btn-secundario" onclick="abrirModalProducto('editar','${p.id}')">✏️</button><button class="btn-eliminar" onclick="confirmarEliminarAdmin('${p.id}')">🗑️</button></div></td></tr>`).join('')}
function confirmarEliminarAdmin(id){const p=getProducts().find(x=>x.id===id);if(!p)return;document.getElementById('alertTitulo').textContent='Eliminar producto';document.getElementById('alertMensaje').textContent=`¿Estás seguro de eliminar "${p.nombre}"?`;document.getElementById('alertBotones').innerHTML=`<div style="display:flex;gap:10px"><button class="btn btn-secundario" onclick="cerrarAlerta()">Cancelar</button><button class="btn" onclick="ejecutarEliminarAdmin('${id}')">Eliminar</button></div>`;document.getElementById('customAlert').style.display='flex'}
function ejecutarEliminarAdmin(id){saveProducts(getProducts().filter(x=>x.id!==id));cerrarAlerta();renderAdminProducts();updateAdminStats();mostrarAlerta('El producto fue eliminado del catálogo.','Eliminado')}
let adminCuponEdit=null;
function renderAdminCoupons(){
 const t=document.getElementById('admin-cupones');if(!t)return;
 const cs=getCoupons();
 t.innerHTML=cs.length?cs.map(c=>`<tr><td><strong>${esc(c.codigo)}</strong><br><small>${esc(c.desc||'')}</small></td><td>${esc(c.pct)}%</td><td>${Number(c.min)?money(c.min):'Sin mínimo'}</td><td><span class="${c.activo?'badge-activo':'badge-inactivo'}">${c.activo?'Activo':'Pausado'}</span></td><td><div class="admin-producto-acciones"><button class="btn-secundario" title="Activar / pausar" onclick="toggleCuponAdmin('${esc(c.codigo)}')">${c.activo?'⏸':'▶'}</button><button class="btn-secundario" onclick="abrirModalCupon('editar','${esc(c.codigo)}')">✏️</button><button class="btn-eliminar" onclick="confirmarEliminarCupon('${esc(c.codigo)}')">🗑️</button></div></td></tr>`).join(''):'<tr><td colspan="5" style="color:#888">No hay cupones registrados.</td></tr>';
}
function abrirModalCupon(modo,codigo=''){
 adminCuponEdit=modo==='editar'?codigo:null;
 const c=getCoupons().find(x=>x.codigo===codigo);
 document.getElementById('modalCuponTitulo').textContent=modo==='nuevo'?'Nuevo cupón':'Editar cupón';
 document.getElementById('cup-codigo').value=c?.codigo||'';document.getElementById('cup-codigo').readOnly=!!c;
 document.getElementById('cup-pct').value=c?.pct||10;document.getElementById('cup-min').value=c?.min||0;
 document.getElementById('cup-desc').value=c?.desc||'';
 document.getElementById('modalCupon').style.display='flex';
}
function cerrarModalCupon(){document.getElementById('modalCupon').style.display='none'}
function guardarCuponAdmin(e){
 e.preventDefault();
 const codigo=document.getElementById('cup-codigo').value.trim().toUpperCase().replace(/\s+/g,'')||('PROMO'+Math.floor(100+Math.random()*900));
 const pct=Math.min(90,Math.max(1,Number(document.getElementById('cup-pct').value)||10)),min=Math.max(0,Number(document.getElementById('cup-min').value)||0),desc=document.getElementById('cup-desc').value.trim()||`${pct}% de descuento`;
 const cs=getCoupons();
 if(adminCuponEdit){const i=cs.findIndex(x=>x.codigo===adminCuponEdit);if(i>=0)cs[i]={...cs[i],pct,min,desc}}
 else{if(cs.some(x=>x.codigo===codigo)){mostrarAlerta('Ya existe un cupón con ese código.','Código repetido');return}cs.push({codigo,pct,min,desc,activo:true})}
 saveCoupons(cs);cerrarModalCupon();renderAdminCoupons();mostrarAlerta('El cupón fue guardado y ya se puede usar en la tienda.','¡Guardado!');
}
function toggleCuponAdmin(codigo){const cs=getCoupons(),c=cs.find(x=>x.codigo===codigo);if(!c)return;c.activo=!c.activo;saveCoupons(cs);renderAdminCoupons()}
function confirmarEliminarCupon(codigo){document.getElementById('alertTitulo').textContent='Eliminar cupón';document.getElementById('alertMensaje').textContent=`¿Seguro que deseas eliminar el cupón "${codigo}"?`;document.getElementById('alertBotones').innerHTML=`<div style="display:flex;gap:10px"><button class="btn btn-secundario" onclick="cerrarAlerta()">Cancelar</button><button class="btn" onclick="ejecutarEliminarCupon('${codigo}')">Eliminar</button></div>`;document.getElementById('customAlert').style.display='flex'}
function ejecutarEliminarCupon(codigo){saveCoupons(getCoupons().filter(x=>x.codigo!==codigo));cerrarAlerta();renderAdminCoupons()}
function updateAdminStats(){const p=getProducts(),o=JSON.parse(localStorage.getItem('vantaOrders')||'[]'),ventas=o.reduce((n,x)=>n+x.total,0);const a=document.getElementById('stat-productos'),b=document.getElementById('stat-pedidos'),c=document.getElementById('stat-ventas');if(a)a.textContent=p.length;if(b)b.textContent=o.length;if(c)c.textContent=money(ventas)}
document.addEventListener('DOMContentLoaded',()=>{
 if(!localStorage.getItem('vantaProducts'))saveProducts(DEFAULT_PRODUCTS);
 if(localStorage.getItem('vantaC2C')===null)saveC2C(DEFAULT_C2C);
 if(localStorage.getItem('vantaCoupons')===null)saveCoupons(DEFAULT_COUPONS);
 ensureModals();
 updateAuth();setupAuth();cargarPerfil();initAdmin();
 if(document.getElementById('grid-productos'))renderCatalog();
 const contacto=document.getElementById('formContacto');if(contacto)contacto.addEventListener('submit',e=>{e.preventDefault();const m=document.getElementById('msg-exito');if(m)m.style.display='block';contacto.reset();setTimeout(()=>m.style.display='none',3000)});
 const fmarketing=document.getElementById('formMarketing');if(fmarketing)fmarketing.addEventListener('submit',e=>{e.preventDefault();location.href='inicio.html'});
});
