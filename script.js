const productosPrivados = [
    { id: 101, nombre: "Kit Facial Pro", precio: 89.90 },
    { id: 102, nombre: "Reloj Elegance Rose", precio: 145.00 },
    { id: 103, nombre: "Perfume Deep Blue", precio: 110.00 },
    { id: 104, nombre: "Set de Brochas (12pcs)", precio: 55.00 }
];

function handleLogin() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;

    if(user.trim() !== "" && pass.length >= 4) {
        // Ocultar landing y mostrar dashboard
        document.getElementById('publicView').style.display = 'none';
        document.getElementById('privateView').style.display = 'block';
        document.getElementById('displayUserName').innerText = user;
        
        loadPrivateContent();
    } else {
        alert("Por favor, ingrese un usuario y contraseña (min. 4 caracteres)");
    }
}

function loadPrivateContent() {
    const grid = document.getElementById('privateProductGrid');
    grid.innerHTML = productosPrivados.map(p => `
        <div class="card-prod">
            <div style="font-size: 3rem; margin-bottom: 10px;">📦</div>
            <h4>${p.nombre}</h4>
            <p style="color: var(--accent); font-weight: bold;">S/ ${p.precio.toFixed(2)}</p>
            <button onclick="addToCart('${p.nombre}')" class="btn-add">Añadir al Carrito</button>
        </div>
    `).join('');
}

function addToCart(nombre) {
    alert(`Éxito: Se ha añadido ${nombre} a tu pedido actual.`);
}

function handleLogout() {
    location.reload(); // Forma sencilla de resetear la vista para este ejemplo
}