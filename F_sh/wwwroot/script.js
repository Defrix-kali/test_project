  const api = {
  getFlowers: () => fetch('/api/flowers').then(r => r.json()),
  clientLogin: (d)=>fetch('/api/client/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(async r=>{ if(!r.ok) throw new Error(await r.text()); return r.json(); }),
  clientRegister: (d)=>fetch('/api/client/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(async r=>{ if(!r.ok) throw new Error(await r.text()); return r.json(); }),
  postApplication: (data) => fetch('/api/applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(async r=>{ if(!r.ok){ throw new Error(await r.text()); } return r.json(); }),
  adminGetApplications: (login,password)=>fetch(`/api/applications?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`).then(r=>r.json()),
  adminApprove: (id,login,password)=>fetch(`/api/applications/${id}/approve?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`,{method:'PUT'}).then(async r=>{ if(!r.ok) throw new Error(await r.text()); return r.json(); }),
  adminReject: (id,login,password)=>fetch(`/api/applications/${id}/reject?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`,{method:'PUT'}).then(async r=>{ if(!r.ok) throw new Error(await r.text()); return r.text(); }),
  adminGetShops: (login,password)=>fetch(`/api/shops?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`).then(r=>r.json()),
  adminDeleteShop: (id,login,password)=>fetch(`/api/shops/${id}?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`,{method:'DELETE'}).then(async r=>{ if(!r.ok) throw new Error(await r.text()); return true }),
  sellerLogin: (d)=>fetch('/api/seller/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(r=>r.json()),
  sellerAddFlower: (data)=>fetch('/api/flowers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(async r=>{ if(!r.ok) throw new Error(await r.text()); return r.json(); }),
  sellerUpdateFlower: (id,data)=>fetch(`/api/flowers/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(async r=>{ if(!r.ok) throw new Error(await r.text()); return r.json(); }),
  sellerDeleteFlower: (id,login,password)=>fetch(`/api/flowers/${id}?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`,{method:'DELETE'}).then(async r=>{ if(!r.ok) throw new Error(await r.text()); return true }),
  sellerGetFlowers: (sellerId)=>fetch(`/api/flowers/seller/${sellerId}`).then(r=>r.json()),
  placeOrder: (data)=>fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>r.json()),
  sellerOrders: (d)=>fetch('/api/orders/seller',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(r=>r.json()),
  placeBouquetOrder: (data)=>fetch('/api/orders/bouquet',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>r.json()),
};

// Notification system
function showNotification(message, type = 'info') {
  const container = document.getElementById('notificationContainer');
  if (!container) return;
  
  const notif = document.createElement('div');
  notif.className = `notification notification-${type}`;
  notif.style.cssText = `
    padding: 12px 16px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
    word-break: break-word;
  `;
  
  if (type === 'success') {
    notif.style.background = '#e8f5e9';
    notif.style.color = '#2e7d32';
    notif.style.border = '1px solid #c8e6c9';
  } else if (type === 'error') {
    notif.style.background = '#ffebee';
    notif.style.color = '#c62828';
    notif.style.border = '1px solid #ffcdd2';
  } else {
    notif.style.background = '#e3f2fd';
    notif.style.color = '#1565c0';
    notif.style.border = '1px solid #bbdefb';
  }
  
  notif.textContent = message;
  container.appendChild(notif);
  
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// Confirm dialog
function showConfirm(message, onConfirm, onCancel) {
  const container = document.getElementById('notificationContainer')?.parentElement || document.body;
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  const box = document.createElement('div');
  box.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    text-align: center;
    max-width: 300px;
  `;
  
  const msg = document.createElement('p');
  msg.textContent = message;
  msg.style.cssText = `margin: 0 0 20px 0; font-size: 16px; color: #333;`;
  
  const btnOk = document.createElement('button');
  btnOk.textContent = 'Да';
  btnOk.style.cssText = `
    padding: 8px 16px;
    margin-right: 10px;
    background: linear-gradient(120deg, #667eea, #764ba2);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  `;
  
  const btnCancel = document.createElement('button');
  btnCancel.textContent = 'Нет';
  btnCancel.style.cssText = `
    padding: 8px 16px;
    background: #ccc;
    color: #333;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  `;
  
  btnOk.onclick = () => {
    dialog.remove();
    onConfirm();
  };
  
  btnCancel.onclick = () => {
    dialog.remove();
    if (onCancel) onCancel();
  };
  
  box.appendChild(msg);
  box.appendChild(btnOk);
  box.appendChild(btnCancel);
  dialog.appendChild(box);
  document.body.appendChild(dialog);
}

// Add styles for animations
if (!document.getElementById('notificationStyles')) {
  const style = document.createElement('style');
  style.id = 'notificationStyles';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// Logout function — clears session and redirects to login
function logout() {
  sessionStorage.removeItem('userType');
  sessionStorage.removeItem('clientId');
  sessionStorage.removeItem('clientName');
  sessionStorage.removeItem('clientEmail');
  sessionStorage.removeItem('sellerEmail');
  sessionStorage.removeItem('sellerPassword');
  sessionStorage.removeItem('shopId');
  sessionStorage.removeItem('adminEmail');
  sessionStorage.removeItem('adminPassword');
  window.location.href = '/login.html';
}

// Check auth and attach logout handlers
function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
}

// Basic JS runtime error reporting to help debug UI issues.
console.log('[script.js] loaded');
window.addEventListener('error', function(e){
  try{
    console.error('Global error', e.error || e.message || e);
    var m = document.getElementById('adminMessage');
    if(m) m.textContent = 'JS Error: ' + (e.message || (e.error && e.error.message) || String(e));
  }catch(_){}
});
window.addEventListener('unhandledrejection', function(ev){
  try{
    console.error('Unhandled rejection', ev.reason);
    var m = document.getElementById('adminMessage');
    if(m) m.textContent = 'Promise rejection: ' + (ev.reason && ev.reason.message ? ev.reason.message : String(ev.reason));
  }catch(_){}
});

document.addEventListener('DOMContentLoaded', ()=>{
  // Show bouquet link only for authorized clients
  const userType = sessionStorage.getItem('userType');
  const clientId = sessionStorage.getItem('clientId');
  const bouquetLink = document.getElementById('bouquetLink');
  if (bouquetLink && userType === 'client' && clientId) {
    bouquetLink.style.display = 'inline';
  }

  const path = location.pathname.split('/').pop();
  if(path === '' || path === 'index.html') renderIndex();
  if(path === 'client.html') renderClient();
  if(path === 'admin.html') renderAdmin();
  if(path === 'seller.html') renderSeller();
  if(path === 'bouquet.html') renderBouquet();
  initLogout();
});

function renderBouquet(){
  const root = document.getElementById('singleList');
  const paperRoot = document.getElementById('paperList');
  root.innerHTML = '<p>Загрузка...</p>';
  api.getFlowers().then(list=>{
    const singles = list.filter(f=>f.type === 'single');
    const papers = list.filter(f=>f.type === 'paper');
    root.innerHTML = '';
    singles.forEach(f=>{
      const div = document.createElement('div'); div.className='card';
      const imgUrl = f.imageUrl && f.imageUrl.length>0 ? f.imageUrl : `https://source.unsplash.com/featured/?${encodeURIComponent(f.name)}`;
      div.innerHTML = `<img src="${imgUrl}" alt="${f.name}"><div><h4>${f.name}</h4><p>${f.description}</p><p>Цена: ${f.price} сом</p><p>В наличии: ${f.stock ?? 0}</p><label>Количество <input type="number" min="0" value="0" data-id="${f.id}" class="pickQty"></label></div>`;
      root.appendChild(div);
    });
    paperRoot.innerHTML = '';
    papers.forEach(p=>{
      const div = document.createElement('div'); div.className='card';
      const imgUrl = p.imageUrl && p.imageUrl.length>0 ? p.imageUrl : `https://source.unsplash.com/featured/?${encodeURIComponent(p.name)}`;
      div.innerHTML = `<img src="${imgUrl}" alt="${p.name}"><div><h4>${p.name}</h4><p>Цена: ${p.price} сом</p><label>Добавить <input type="radio" name="paper" value="${p.id}"></label></div>`;
      paperRoot.appendChild(div);
    });
    const form = document.getElementById('bouquetOrder');
    form.onsubmit = async (ev)=>{
      ev.preventDefault();
      const picks = Array.from(document.querySelectorAll('.pickQty')).map(i=>({id:i.dataset.id, qty:parseInt(i.value)})).filter(x=>x.qty>0);
      if(picks.length===0){ showNotification('Выберите хотя бы один цветок', 'error'); return; }
      const items = picks.map(p=>({productId:p.id, quantity:p.qty}));
      const paperSel = form.elements['paper'] ? form.elements['paper'].value : null;
      const data = { clientName: form.elements['clientName'].value, address: form.elements['address'].value, items: items, paperId: paperSel };
      try{
        await api.placeBouquetOrder(data);
        showNotification('Заказ букета оформлен', 'success');
        form.reset();
        renderBouquet();
      }catch(e){showNotification('Ошибка при оформлении', 'error')}
    };
  });
}

function renderIndex(){
  const root = document.getElementById('catalog');
  root.innerHTML = '<p>Загрузка...</p>';
  api.getFlowers().then(list=>{
    root.innerHTML = '';
    list.forEach(f=>{
      const div = document.createElement('div'); div.className='card';
      // choose image: use provided imageUrl or fallback to Unsplash by name
      const imgUrl = f.imageUrl && f.imageUrl.length>0 ? f.imageUrl : `https://source.unsplash.com/featured/?${encodeURIComponent(f.name)}`;
      div.innerHTML = `<img src="${imgUrl}" alt="${f.name}"><div><h3>${f.name}</h3><p>${f.description}</p><p>Цена: ${f.price} сом</p><button data-id="${f.id}" class="orderBtn">Заказать</button></div>`;
      root.appendChild(div);
    });
    document.querySelectorAll('.orderBtn').forEach(b=>b.addEventListener('click', (e)=>{
      e.preventDefault();
      const userType = sessionStorage.getItem('userType');
      const clientId = sessionStorage.getItem('clientId');
      
      // Check if client is logged in
      if (userType !== 'client' || !clientId) {
        showNotification('Требуется вход в свою учётку для оформления заказа', 'error');
        window.location.href = '/login.html';
        return;
      }
      
      const id = e.currentTarget.dataset.id; 
      location.href = '/client.html?flowerId='+id;
    }));
  });
}

function renderClient(){
  // Check if client is logged in
  const userType = sessionStorage.getItem('userType');
  const clientId = sessionStorage.getItem('clientId');
  
  if (userType !== 'client' || !clientId) {
    showNotification('Требуется вход в свою учётку', 'error');
    window.location.href = '/login.html';
    return;
  }

  const q = new URLSearchParams(location.search);
  const fid = q.get('flowerId');
  api.getFlowers().then(list=>{
    const root = document.getElementById('catalogClient');
    root.innerHTML = '';
    list.forEach(f=>{
      const div = document.createElement('div'); div.className='card';
      const imgUrl = f.imageUrl && f.imageUrl.length>0 ? f.imageUrl : `https://source.unsplash.com/featured/?${encodeURIComponent(f.name)}`;
      div.innerHTML = `<img src="${imgUrl}" alt="${f.name}"><div><h3>${f.name}</h3><p>${f.description}</p><p>Цена: ${f.price} сом</p><button data-id="${f.id}" class="orderBtn">Заказать</button></div>`;
      root.appendChild(div);
    });
    document.querySelectorAll('.orderBtn').forEach(b=>b.addEventListener('click', (e)=>{
      const id = e.currentTarget.dataset.id; showOrderForm(id);
    }));
    if(fid) showOrderForm(fid);
  });
}

function showOrderForm(flowerId){
  // Check if client is logged in
  const userType = sessionStorage.getItem('userType');
  const clientId = sessionStorage.getItem('clientId');
  const clientEmail = sessionStorage.getItem('clientEmail');
  
  if (userType !== 'client' || !clientId) {
    alert('Требуется вход в свою учётку для оформления заказа');
    window.location.href = '/login.html';
    return;
  }

  document.getElementById('catalogClient').style.display='none';
  document.getElementById('orderForm').style.display='block';
  const form = document.getElementById('placeOrder');
  form.elements['flowerId'].value = flowerId;
  form.elements['clientName'].value = clientEmail;
  form.onsubmit = (ev)=>{
    ev.preventDefault();
    const data = {flowerId: form.elements['flowerId'].value, clientName: form.elements['clientName'].value, address: form.elements['address'].value, quantity: parseInt(form.elements['quantity'].value)};
    api.placeOrder(data).then(()=>{showNotification('Заказ отправлен', 'success'); form.reset(); document.getElementById('orderForm').style.display='none'; document.getElementById('catalogClient').style.display='block';});
  };
}

function renderAdmin(){
  const refreshBtn = document.getElementById('refreshData');
  const msg = document.getElementById('adminMessage');
  
  // Check if user is authorized as admin
  const userType = sessionStorage.getItem('userType');
  if (userType !== 'admin') {
    window.location.href = '/login.html';
    return;
  }
  
  const adminPassword = sessionStorage.getItem('adminPassword');
  
  async function loadAdminData(login, password){
    msg.textContent = 'Загрузка...';
    try{
      const apps = await api.adminGetApplications(login,password).catch(e=>{throw new Error('Не удалось загрузить заявки (авторизация?)')});
      document.getElementById('apps').style.display='block';
      const tbody = document.querySelector('#appsTable tbody'); tbody.innerHTML='';
      if(!apps || apps.length===0){ tbody.innerHTML = '<tr><td colspan="3">Заявок нет</td></tr>'; }
      else apps.forEach(a=>{const row = document.createElement('tr'); row.innerHTML=`<td>${a.name}</td><td>${a.email}</td><td><button data-id="${a.id}" class="approve">Одобрить</button> <button data-id="${a.id}" class="reject">Отклонить</button></td>`; tbody.appendChild(row)});
      document.querySelectorAll('.approve').forEach(b=>b.addEventListener('click', async (e)=>{const id=e.currentTarget.dataset.id; try{await api.adminApprove(id,login,password); showNotification('Одобрено', 'success'); await loadAdminData(login,password);}catch(ex){showNotification('Ошибка при одобрении', 'error')}}));
      document.querySelectorAll('.reject').forEach(b=>b.addEventListener('click', async (e)=>{const id=e.currentTarget.dataset.id; try{await api.adminReject(id,login,password); showNotification('Отклонено', 'success'); await loadAdminData(login,password);}catch(ex){showNotification('Ошибка при отклонении', 'error')}}));

      // shops
      const shops = await api.adminGetShops(login,password).catch(e=>{throw new Error('Не удалось загрузить магазины')});
      document.getElementById('shops').style.display='block';
      const stbody = document.querySelector('#shopsTable tbody'); stbody.innerHTML='';
      if(!shops || shops.length===0){ stbody.innerHTML = '<tr><td colspan="3">Магазинов нет</td></tr>'; }
      else shops.forEach(s=>{const row=document.createElement('tr'); row.innerHTML=`<td>${s.name}</td><td>${s.login}</td><td><button data-id="${s.id}" class="delshop">Удалить</button></td>`; stbody.appendChild(row)});
      document.querySelectorAll('.delshop').forEach(b => {
        b.addEventListener('click', async (e) => {
          const id = e.currentTarget.dataset.id;
          showConfirm('Вы уверены? Это удалит магазин.', async () => {
            try{
              await api.adminDeleteShop(id, login, password);
              showNotification('Магазин удалён', 'success');
              await loadAdminData(login, password);
            }catch(ex){
              showNotification('Ошибка при удалении', 'error');
            }
          });
        });
      });

      // admin dump removed — debug info suppressed for production

      msg.textContent = '';
      refreshBtn.style.display = '';
      }catch(err){
      msg.textContent = 'Ошибка: ' + (err.message || err);
      console.error(err);
      document.getElementById('apps').style.display='none';
      document.getElementById('shops').style.display='none';
      refreshBtn.style.display = '';
    }
  }

  refreshBtn.onclick = ()=>{
    const login = 'admin';
    loadAdminData(login, adminPassword);
  };
  
  // Auto-load from sessionStorage
  if (adminPassword) {
    document.getElementById('admin-panel').style.display = 'block';
    loadAdminData('admin', adminPassword);
  }
}

function renderSeller(){
  // Check if user is authorized as seller
  const userType = sessionStorage.getItem('userType');
  if (userType !== 'seller') {
    window.location.href = '/login.html';
    return;
  }
  
  const sellerEmail = sessionStorage.getItem('sellerEmail');
  const sellerPassword = sessionStorage.getItem('sellerPassword');
  const shopId = sessionStorage.getItem('shopId');
  
  // Automatically load seller data
  document.getElementById('login').style.display = 'none';
  document.getElementById('sellerPanel').style.display = 'block';
  
  const addForm = document.getElementById('addFlower');
  const cancelBtn = document.getElementById('cancelEdit');
  
  addForm.onsubmit = async (e)=>{
    e.preventDefault();
    const f = e.currentTarget;
    const editId = f.elements['editId'].value;
    const imageFile = f.elements['imageFile'].files[0];
    
    let imageUrl = '';
    if (imageFile) {
      // Convert file to base64
      imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(imageFile);
      });
    }
    
    const data = { 
      login: sellerEmail, 
      password: sellerPassword, 
      name: f.elements['name'].value, 
      description: f.elements['description'].value, 
      price: parseFloat(f.elements['price'].value), 
      imageUrl: imageUrl, 
      type: f.elements['type'].value, 
      stock: parseInt(f.elements['stock'].value) || 0 
    };
    
    try{
      if(editId){
        await api.sellerUpdateFlower(editId,data);
        showNotification('Обновлено', 'success');
        f.elements['editId'].value = '';
        cancelBtn.style.display='none';
      }else{
        await api.sellerAddFlower(data);
        showNotification('Добавлено', 'success');
      }
    }catch(err){
      console.error('seller add/update error', err);
      showNotification('Ошибка: '+ (err.message || err), 'error');
    }
    f.reset();
    loadSellerData({ id: shopId }, sellerEmail, sellerPassword);
  };
  
  cancelBtn.onclick = ()=>{ document.getElementById('addFlower').reset(); document.getElementById('addFlower').elements['editId'].value=''; cancelBtn.style.display='none'; };
  
  loadSellerData({ id: shopId }, sellerEmail, sellerPassword);
}

async function loadSellerData(shop,login,password){
  const flowers = await api.sellerGetFlowers(shop.id);
  const ul = document.getElementById('myFlowers'); ul.innerHTML='';
  flowers.forEach(f=>{
    const li=document.createElement('li');
    li.style.justifyContent='space-between';
    li.innerHTML = `<span>${f.name} - ${f.price} сом (${f.type}${f.type==='single' ? ', шт' : ''})</span><div style="display:flex;gap:8px"><button class="btn btn.secondary editf" data-id="${f.id}" data-name="${f.name}" data-desc="${f.description}" data-price="${f.price}" data-url="${f.imageUrl}" data-type="${f.type}" data-stock="${f.stock}">Редактировать</button><button class="btn delf" data-id="${f.id}" style="background:linear-gradient(120deg,#f93b1d,#ea1e63)">Удалить</button></div>`;
    ul.appendChild(li);
  });
  document.querySelectorAll('.editf').forEach(b=>b.addEventListener('click', (e)=>{
    const btn = e.currentTarget;
    const id = btn.dataset.id;
    const form = document.getElementById('addFlower');
    form.elements['name'].value = btn.dataset.name || '';
    form.elements['description'].value = btn.dataset.desc || '';
    form.elements['price'].value = btn.dataset.price || '';
    form.elements['type'].value = btn.dataset.type || 'bouquet';
    form.elements['stock'].value = btn.dataset.stock || 0;
    form.elements['editId'].value = id;
    document.getElementById('cancelEdit').style.display = '';
    window.scrollTo({top:0,behavior:'smooth'});
  }));
  document.querySelectorAll('.delf').forEach(b=>b.addEventListener('click', async (e)=>{
    const id=e.currentTarget.dataset.id; 
    showConfirm('Удалить этот цветок?', async () => {
      try{
        await api.sellerDeleteFlower(id,login,password); 
        showNotification('Цветок удалён', 'success');
        loadSellerData(shop,login,password);
      }catch(err){
        showNotification('Ошибка при удалении', 'error');
      }
    });
  }));
  const orders = await api.sellerOrders({login,password});
  const ol = document.getElementById('myOrders'); ol.innerHTML='';
  orders.forEach(o=>{
    const li=document.createElement('li');
    // if order has items filtered
    if(o.items){
      const parts = o.items.map(it=>`${it.ProductId || it.productId} x${it.Quantity || it.quantity}`);
      li.textContent = `Заказ ${o.orderId || o.Id}: ${o.clientName}, ${o.address} — ${parts.join(', ')}`;
    }else{
      li.textContent = `Заказ: ${o.clientName}, ${o.address}, x${o.quantity || o.Quantity}`;
    }
    ol.appendChild(li);
  });
}

// Theme switcher removed - using fixed gradient background
