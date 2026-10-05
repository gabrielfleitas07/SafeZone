// Credenciales de tu proyecto Firebase[cite: 6]
const firebaseConfig = {
    apiKey: "AIzaSyBzFo4tAspET175kUceKjR8d9-4WeHzUi8",
    authDomain: "safezone-9afe4.firebaseapp.com",
    databaseURL: "https://safezone-9afe4-default-rtdb.firebaseio.com",
    projectId: "safezone-9afe4",
    storageBucket: "safezone-9afe4.firebasestorage.app",
    messagingSenderId: "366054781732",
    appId: "1:366054781732:web:a3fe42d60d90130732b9b1"
};

// Inicialización[cite: 6]
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const panelReceptor = document.getElementById('panel-receptor');
const viewWaiting = document.getElementById('receptor-waiting');
const viewAlarm = document.getElementById('receptor-alarm');
const coordsText = document.getElementById('display-shared-coords');
const btnVerMapa = document.getElementById('btn-ver-mapa');

// --- LEER ATRIBUTOS DESDE LA URL (Decodificados) ---
const urlParams = new URLSearchParams(window.location.search);
const rawIdReceptor = urlParams.get('id') ? atob(urlParams.get('id')) : null;

// Reemplazamos caracteres no válidos para la lectura en Firebase
const miIdReceptor = rawIdReceptor ? rawIdReceptor.replace(/[.#$[\]]/g, '_') : null;

if (!miIdReceptor) {
    alert("Falta ID de Receptor. Regresando al inicio.");
    window.location.href = "index.html";
} else {
    database.ref('usuarios/' + miIdReceptor).set({
        rol: "receptor",
        emailOriginal: rawIdReceptor // Guardamos el correo original como registro
    });

    database.ref('usuarios').on('value', (snapshot) => {
        const usuarios = snapshot.val();
        let emisorAsignadoId = null;

        for (let idUser in usuarios) {
            if (usuarios[idUser].rol === "emisor" && usuarios[idUser].receptorAsignado === miIdReceptor) {
                emisorAsignadoId = idUser;
                break;
            }
        }

        if (emisorAsignadoId) {
            console.log("Conectado al emisor asignado: " + emisorAsignadoId);
            iniciarMonitoreoTarget(emisorAsignadoId);
        }
    });
}

function iniciarMonitoreoTarget(idEmisor) {
    database.ref('alertas/' + idEmisor).off();

    database.ref('alertas/' + idEmisor).on('value', (snapshot) => {
        const data = snapshot.val();

        if (data && data.estado === "PELIGRO") {
            panelReceptor.classList.add('danger-mode');
            viewWaiting.style.display = 'none';
            viewAlarm.style.display = 'flex';

            if (data.latitud && data.longitud) {
                coordsText.innerHTML = `<strong>¡Alerta de ${data.emisorNombre}!</strong><br>Lat: ${data.latitud.toFixed(5)}<br>Lon: ${data.longitud.toFixed(5)}<br><span style="font-size:11px; color:#FCA5A5;">Margen: ±${Math.round(data.precision)}m</span>`;
                
                // Redirigir a Google Maps con las coordenadas[cite: 6]
                btnVerMapa.href = `https://www.google.com/maps?q=${data.latitud},${data.longitud}`;
                btnVerMapa.style.display = 'inline-block';
            } else {
                coordsText.innerText = `Ubicación no disponible de ${data.emisorNombre || 'Emisor'}\n(${data.error_geo || 'Error de permisos'})`;
                btnVerMapa.style.display = 'none';
            }
        } else {
            panelReceptor.classList.remove('danger-mode');
            viewWaiting.style.display = 'flex';
            viewAlarm.style.display = 'none';
        }
    });
}