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

const panelReceptor = document.getElementById('panel-receptor');
const viewWaiting = document.getElementById('receptor-waiting');
const viewAlarm = document.getElementById('receptor-alarm');
const coordsText = document.getElementById('display-shared-coords');
const btnVerMapa = document.getElementById('btn-ver-mapa');
const mensajesHistorial = document.getElementById('mensajes-historial');

// --- LEER ATRIBUTOS DESDE LA URL ---
const urlParams = new URLSearchParams(window.location.search);
const rawIdReceptor = urlParams.get('id') ? atob(urlParams.get('id')) : null;
const miIdReceptor = rawIdReceptor ? rawIdReceptor.replace(/[.#$[\]]/g, '_') : null;

if (!miIdReceptor) {
    alert("Falta ID de Receptor. Regresando al inicio.");
    window.location.href = "index.html";
} else {
    database.ref('usuarios/' + miIdReceptor).set({
        rol: "receptor",
        emailOriginal: rawIdReceptor
    });

    // Escuchamos las alertas dirigidas a este receptor
    database.ref('alertas/' + miIdReceptor).on('value', (snapshot) => {
        const alertas = snapshot.val();
        
        mensajesHistorial.innerHTML = ''; // Limpiamos la sección inferior
        let hayAlertaActiva = false;

        if (alertas) {
            Object.keys(alertas).forEach((key) => {
                const alerta = alertas[key];

                if (alerta.estado === "PELIGRO") {
                    hayAlertaActiva = true;

                    // Mostramos la alerta activa en la sección superior
                    if (alerta.latitud && alerta.longitud) {
                        coordsText.innerHTML = `<strong>Emisor: ${alerta.emisorNombre}</strong><br>Lat: ${alerta.latitud.toFixed(5)}<br>Lon: ${alerta.longitud.toFixed(5)}<br><span style="font-size:11px; color:#FCA5A5;">Margen: ±${Math.round(alerta.precision || 0)}m</span>`;
                        btnVerMapa.href = `https://www.google.com/maps?q=${alerta.latitud},${alerta.longitud}`;
                        btnVerMapa.style.display = 'inline-block';
                    } else {
                        coordsText.innerText = `Ubicación no disponible de ${alerta.emisorNombre || 'Emisor'}\n(${alerta.error_geo || 'Error de permisos'})`;
                        btnVerMapa.style.display = 'none';
                    }
                } else if (alerta.estado === "CANCELADA") {
                    // Si la alerta fue quitada, generamos un mensaje en la parte inferior
                    const msgCard = document.createElement('div');
                    msgCard.style.backgroundColor = '#0F172A';
                    msgCard.style.border = '1px solid #334155';
                    msgCard.style.borderRadius = '10px';
                    msgCard.style.padding = '12px';
                    msgCard.style.textAlign = 'left';
                    msgCard.style.fontSize = '13px';
                    msgCard.style.color = '#F8FAFC';

                    let mapLink = '';
                    if (alerta.latitud && alerta.longitud) {
                        const mapsUrl = `https://www.google.com/maps?q=${alerta.latitud},${alerta.longitud}`;
                        mapLink = `<br><a href="${mapsUrl}" target="_blank" style="color: #38BDF8; text-decoration: underline; font-weight: bold; display: inline-block; margin-top: 6px;">📍 Abrir en Google Maps</a>`;
                    } else {
                        mapLink = `<br><span style="color: #94A3B8; font-size: 11px;">(Ubicación no registrada)</span>`;
                    }

                    msgCard.innerHTML = `
                        <div style="font-weight: bold; color: #EF4444; margin-bottom: 4px;">ℹ️ Alerta Finalizada</div>
                        <div><strong>Correo del emisor:</strong> ${alerta.emisorNombre || 'Desconocido'}</div>
                        ${mapLink}
                    `;

                    mensajesHistorial.appendChild(msgCard);
                }
            });
        }

        // Estado visual del panel según si hay alerta activa o no
        if (hayAlertaActiva) {
            panelReceptor.classList.add('danger-mode');
            viewWaiting.style.display = 'none';
            viewAlarm.style.display = 'flex';
        } else {
            panelReceptor.classList.remove('danger-mode');
            viewWaiting.style.display = 'flex';
            viewAlarm.style.display = 'none';
        }
    });
}