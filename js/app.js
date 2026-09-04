const products = [
    { name: "Essential Oversize Tee", category: "Playeras", price: "$499 MXN", icon: "◒", desc: "Playera de corte amplio y estilo minimalista." },
    { name: "Street Graphic Tee", category: "Playeras", price: "$549 MXN", icon: "✦", desc: "Diseño gráfico inspirado en el arte urbano." },
    { name: "VANTA Hoodie", category: "Sudaderas", price: "$899 MXN", icon: "◐", desc: "Sudadera cómoda para tus días de ciudad." },
    { name: "Night Hoodie", category: "Sudaderas", price: "$949 MXN", icon: "◇", desc: "Diseño sobrio con detalles contemporáneos." },
    { name: "Cargo Relaxed", category: "Pantalones", price: "$799 MXN", icon: "▱", desc: "Pantalón cargo de silueta relajada." },
    { name: "Classic Wide Pants", category: "Pantalones", price: "$749 MXN", icon: "△", desc: "Corte amplio para combinar con todo." },
    { name: "VANTA Cap", category: "Accesorios", price: "$349 MXN", icon: "⌒", desc: "Gorra clásica con identidad VANTA." },
    { name: "Street Tote", category: "Accesorios", price: "$399 MXN", icon: "□", desc: "Bolsa práctica para llevar tu día contigo." }
];

document.addEventListener("DOMContentLoaded", () => {
    setupMenu();
    updateSessionNavigation();
    setupCatalog();
    setupAuth();
    showSuccessMessage();
});

function setupMenu() {
    const toggle = document.querySelector(".menu-toggle");
    const links = document.querySelector(".nav-links");
    if (toggle && links) {
        toggle.addEventListener("click", () => links.classList.toggle("open"));
    }
}

function updateSessionNavigation() {
    const logged = localStorage.getItem("vantaLogged") === "true";
    if (!logged) return;

    // Cuando el cliente ya se registró o inició sesión,
    // se elimina "Iniciar sesión" de la navegación.
    document.querySelectorAll('a[href="login.html"]').forEach(link => {
        link.remove();
    });
}

function setupCatalog() {
    const grid = document.querySelector("#product-grid");
    if (!grid) return;

    const buttons = document.querySelectorAll(".filter");
    const count = document.querySelector("#product-count");

    function render(category = "Todos") {
        const list = category === "Todos"
            ? products
            : products.filter(product => product.category === category);

        grid.innerHTML = list.map(product => `
            <article class="product-card">
                <div class="product-image">${product.icon}</div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h3>${product.name}</h3>
                    <p>${product.desc}</p>
                    <div class="product-price">${product.price}</div>
                </div>
            </article>
        `).join("");

        if (count) count.textContent = `${list.length} productos`;
    }

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            buttons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            render(button.dataset.filter);
        });
    });

    render();
}

function setupAuth() {
    const registerForm = document.querySelector("#register-form");

    if (registerForm) {
        registerForm.addEventListener("submit", event => {
            event.preventDefault();

            const name = document.querySelector("#register-name").value.trim();
            const email = document.querySelector("#register-email").value.trim();
            const password = document.querySelector("#register-password").value;
            const user = { name, email, password };

            localStorage.setItem("vantaUser", JSON.stringify(user));
            localStorage.setItem("vantaLogged", "true");
            sessionStorage.setItem("vantaSuccess", "¡Registro exitoso! Bienvenido a VANTA.");

            const message = document.querySelector("#register-message");
            message.textContent = "Cuenta creada correctamente. Redirigiendo al inicio...";
            message.style.color = "green";

            setTimeout(() => {
                location.href = "index.html";
            }, 900);
        });
    }

    const loginForm = document.querySelector("#login-form");

    if (loginForm) {
        loginForm.addEventListener("submit", event => {
            event.preventDefault();

            const savedUser = JSON.parse(localStorage.getItem("vantaUser") || "null");
            const email = document.querySelector("#login-email").value.trim();
            const password = document.querySelector("#login-password").value;
            const message = document.querySelector("#login-message");

            if (savedUser && savedUser.email === email && savedUser.password === password) {
                localStorage.setItem("vantaLogged", "true");
                sessionStorage.setItem("vantaSuccess", "¡Inicio de sesión exitoso! Bienvenido de nuevo.");
                message.textContent = "Inicio de sesión correcto. Redirigiendo al inicio...";
                message.style.color = "green";

                setTimeout(() => {
                    location.href = "index.html";
                }, 700);
            } else {
                message.textContent = savedUser
                    ? "Correo o contraseña incorrectos."
                    : "Primero crea una cuenta en Registro.";
                message.style.color = "#c0392b";
            }
        });
    }
}


function showSuccessMessage() {
    const success = sessionStorage.getItem("vantaSuccess");
    if (!success || !location.pathname.endsWith("index.html") && location.pathname !== "/") return;

    const toast = document.createElement("div");
    toast.className = "success-toast";
    toast.innerHTML = `
        <div class="success-icon">✓</div>
        <div>
            <strong>¡Éxito!</strong>
            <span>${success}</span>
        </div>
        <button aria-label="Cerrar">×</button>
    `;

    document.body.appendChild(toast);
    sessionStorage.removeItem("vantaSuccess");

    const close = () => toast.classList.add("hide");
    toast.querySelector("button").addEventListener("click", close);
    setTimeout(close, 4500);
    setTimeout(() => toast.remove(), 5000);
}
