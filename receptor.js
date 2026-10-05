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
const alertasContainer = document.getElementById('alertas-container');

// --- LEER ATRIBUTOS DESDE LA URL (Decodificados) ---
const urlParams = new URLSearchParams(window.location.search);
const rawIdReceptor = urlParams.get('id') ? atob(urlParams.get('id')) : null;

// Reemplazamos caracteres no válidos para la lectura en Firebase
const miIdReceptor = rawIdReceptor ? rawIdReceptor.replace(/[.#$[\]]/g, '_') : null;

if (!miIdReceptor) {
    alert("Falta ID de Receptor. Regresando al inicio.");
    window.location.href = "index.html";
} else {
    // Guardamos al receptor en Firebase
    database.ref('usuarios/' + miIdReceptor).set({
        rol: "receptor",
        emailOriginal: rawIdReceptor 
    });

    // Escuchamos de forma permanente las alertas dirigidas a este receptor
    database.ref('alertas/' + miIdReceptor).on('value', (snapshot) => {
        const alertas = snapshot.val();
        alertasContainer.innerHTML = ''; // Limpiamos contenedor para redibujar

        if (alertas) {
            // Entra si hay al menos una alerta activa
            panelReceptor.classList.add('danger-mode');
            viewWaiting.style.display = 'none';

            // Iteramos sobre cada alerta activa encontrada
            Object.keys(alertas).forEach((alertKey) => {
                const data = alertas[alertKey];

                // Creamos el elemento visual para cada alerta individual
                const alertCard = document.createElement('div');
                alertCard.className = 'alarm-state';
                alertCard.style.display = 'flex';
                alertCard.style.flexDirection = 'column';
                alertCard.style.alignItems = 'center';
                alertCard.style.borderTop = '2px dashed #EF4444';
                alertCard.style.paddingTop = '15px';
                alertCard.style.marginTop = '10px';
                alertCard.style.width = '100%';

                let coordsHtml = '';
                let mapButtonHtml = '';

                // Validamos si hay coordenadas disponibles
                if (data.latitud && data.longitud) {
                    coordsHtml = `Lat: ${data.latitud.toFixed(5)}<br>Lon: ${data.longitud.toFixed(5)}<br><span style="font-size:11px; color:#FCA5A5;">Margen: ±${Math.round(data.precision || 0)}m</span>`;
                    mapButtonHtml = `<a href="https://www.google.com/maps?q=${data.latitud},${data.longitud}" target="_blank" class="btn-cancel" style="background-color: #38BDF8; color: #0F172A; text-decoration: none; display: inline-block; text-align: center; margin-top: 15px; width: 90%; box-sizing: border-box;">📍 Ver en Google Maps</a>`;
                } else {
                    coordsHtml = `Ubicación no disponible<br>(${data.error_geo || 'Error de permisos'})`;
                } // <-- Cierre del IF de coordenadas

                alertCard.innerHTML = `
                    <h2 style="color: white; margin: 0; font-size: 20px; text-align: center;">⚠️ ALERTA DE ${data.emisorNombre || 'Emisor'}</h2>
                    <div class="ip-box" style="font-size: 14px; text-align: center; width: 90%;">
                        ${coordsHtml}
                    </div>
                    ${mapButtonHtml}
                `;

                // Se agrega en la parte inferior del área
                alertasContainer.appendChild(alertCard);
            }); // <-- Cierre del forEach

        } else {
            // Entra si NO hay alertas activas, volvemos al estado seguro
            panelReceptor.classList.remove('danger-mode');
            viewWaiting.style.display = 'flex';
        } // <-- Cierre del IF/ELSE de alertas
        
    }); // <-- Cierre del on('value')
} // <-- Cierre del IF/ELSE principal (!miIdReceptor)