// Credenciales de tu proyecto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBzFo4tAspET175kUceKjR8d9-4WeHzUi8",
    authDomain: "safezone-9afe4.firebaseapp.com",
    databaseURL: "https://safezone-9afe4-default-rtdb.firebaseio.com",
    projectId: "safezone-9afe4",
    storageBucket: "safezone-9afe4.firebasestorage.app",
    messagingSenderId: "366054781732",
    appId: "1:366054781732:web:a3fe42d60d90130732b9b1"
};

// Inicialización
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let clickCount = 0;
let clickTimer, touchTimer;

const emisorOverlay = document.getElementById('emisor-overlay');
const touchArea = document.getElementById('touch-multitouch-zone');
const btnCancelar = document.getElementById('btn-cancelar');

// --- LEER ATRIBUTOS DESDE LA URL ---
const urlParams = new URLSearchParams(window.location.search);
const miIdEmisor = urlParams.get('id');
const idReceptorElegido = urlParams.get('receptor');

if (!miIdEmisor || !idReceptorElegido) {
    alert("Faltan configuraciones de ID. Regresando al inicio.");
    window.location.href = "index.html";
} else {
    // Escribimos el rol de emisor y asociamos al receptor correspondiente en Firebase
    const userRef = database.ref('usuarios/' + miIdEmisor);
    userRef.set({
        rol: "emisor",
        receptorAsignado: idReceptorElegido
    });

    // LIMPIEZA AUTOMÁTICA: Si el emisor cierra la pestaña, se remueve su rol y alerta de la DB
    userRef.onDisconnect().remove();
    database.ref('alertas/' + miIdEmisor).onDisconnect().remove();
}

// 1. Simulación botón de encendido (4 clics)
document.getElementById('btn-power-trigger').addEventListener('click', () => {
    clickCount++;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => { clickCount = 0; }, 1500);

    if (clickCount === 4) {
        dispararAlertaFirebase();
        clickCount = 0;
    }
});

// 2. Control multitáctil de 4 dedos (2 segundos)
touchArea.addEventListener('touchstart', (e) => {
    if (e.touches.length === 4) {
        touchArea.style.backgroundColor = "rgba(56, 189, 248, 0.2)";
        touchArea.innerText = "¡MANTENÉ EL CONTACTO!";
        touchTimer = setTimeout(() => {
            dispararAlertaFirebase();
        }, 2000); 
    }
});

touchArea.addEventListener('touchend', () => {
    clearTimeout(touchTimer);
    touchArea.style.backgroundColor = "rgba(15, 23, 42, 0.2)";
    touchArea.innerText = "ZONA MULTITÁCTIL\nApoyá 4 dedos acá por 2s";
});

// 3. Envío de datos a Firebase con Geolocalización
function dispararAlertaFirebase() {
    emisorOverlay.style.display = 'flex';

    if ("geolocation" in navigator) {
        const opcionesGeo = {
            enableHighAccuracy: true, 
            timeout: 10000,           
            maximumAge: 0             
        };

        navigator.geolocation.getCurrentPosition(
            (posicion) => {
                database.ref('alertas/' + miIdEmisor).set({
                    estado: "PELIGRO",
                    emisorNombre: miIdEmisor,
                    latitud: posicion.coords.latitude,
                    longitud: posicion.coords.longitude,
                    precision: posicion.coords.accuracy
                });
            },
            (error) => {
                console.error("Error de geolocalización:", error);
                database.ref('alertas/' + miIdEmisor).set({
                    estado: "PELIGRO",
                    emisorNombre: miIdEmisor,
                    latitud: null,
                    longitud: null,
                    error_geo: "Permiso denegado o GPS inaccesible"
                });
            },
            opcionesGeo
        );
    } else {
        database.ref('alertas/' + miIdEmisor).set({
            estado: "PELIGRO",
            emisorNombre: miIdEmisor,
            latitud: null,
            longitud: null,
            error_geo: "API no soportada"
        });
    }
}

// 4. Cancelar Alerta
btnCancelar.addEventListener('click', () => {
    emisorOverlay.style.display = 'none';
    if (miIdEmisor) {
        database.ref('alertas/' + miIdEmisor).set({
            estado: "NORMAL"
        });
    }
});