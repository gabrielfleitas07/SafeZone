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
        
        mensajesHistorial.innerHTML = ''; // Limpiamos contenedor de mensajes
        let hayAlertaActiva = false;

        if (alertas) {
            Object.keys(alertas).forEach((key) => {
                const alerta = alertas[key];

                if (alerta.estado === "PELIGRO") {
                    hayAlertaActiva = true;

                    // Mostramos la alerta activa en la pantalla superior
                    if (alerta.latitud && alerta.longitud) {
                        coordsText.innerHTML = `<strong>Emisor: ${alerta.emisorNombre}</strong><br>Lat: ${alerta.latitud.toFixed(5)}<br>Lon: ${alerta.longitud.toFixed(5)}<br><span style="font-size:11px; color:#FCA5A5;">Margen: ±${Math.round(alerta.precision || 0)}m</span>`;
                        btnVerMapa.href = `https://www.google.com/maps?q=${alerta.latitud},${alerta.longitud}`;
                        btnVerMapa.style.display = 'inline-block';
                    } else {
                        coordsText.innerText = `Ubicación de ${alerta.emisorNombre || 'Emisor'}\n(${alerta.error_geo || 'Obteniendo GPS...'})`;
                        btnVerMapa.style.display = 'none';
                    }
                } else if (alerta.estado === "CANCELADA") {
                    // Se crea la tarjeta de mensaje en la parte inferior
                    const msgCard = document.createElement('div');
                    msgCard.style.backgroundColor = '#0F172A';
                    msgCard.style.border = '1px solid #334155';
                    msgCard.style.borderRadius = '10px';
                    msgCard.style.padding = '12px';
                    msgCard.style.textAlign = 'left';
                    msgCard.style.fontSize = '13px';
                    msgCard.style.color = '#F8FAFC';
                    msgCard.style.width = '100%';
                    msgCard.style.boxSizing = 'border-box';

                    let mapLink = '';
                    if (alerta.latitud && alerta.longitud) {
                        const mapsUrl = `https://www.google.com/maps?q=${alerta.latitud},${alerta.longitud}`;
                        mapLink = `<a href="${mapsUrl}" target="_blank" style="color: #38BDF8; text-decoration: underline; font-weight: bold; display: inline-block; margin-top: 6px;">📍 Ver ubicación en Google Maps</a>`;
                    } else {
                        mapLink = `<span style="color: #94A3B8; font-size: 11px;">(Ubicación GPS no registrada)</span>`;
                    }

                    msgCard.innerHTML = `
                        <div style="font-weight: bold; color: #EF4444; margin-bottom: 4px;">ℹ️ Alerta Finalizada</div>
                        <div style="margin-bottom: 4px;"><strong>Emisor:</strong> ${alerta.emisorNombre || 'Desconocido'}</div>
                        <div>${mapLink}</div>
                    `;

                    mensajesHistorial.appendChild(msgCard);
                }
            });
        }

        // Cambio entre vista de peligro y vista de espera
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