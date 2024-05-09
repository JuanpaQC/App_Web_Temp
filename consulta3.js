document.addEventListener('DOMContentLoaded', function() {
    const mostrarTemperaturasButton = document.getElementById('mostrarTemperaturasBtn');

    mostrarTemperaturasButton.addEventListener('click', function() {
        const fechaInput = document.getElementById('date').value;
        const horaInicio = document.getElementById('horaInicio').value;
        const horaFin = document.getElementById('horaFin').value;
        
        // Verificar si se seleccionó una fecha
        if (!fechaInput) {
            console.error('¡Por favor selecciona una fecha!');
            return;
        }

        // Mostrar un mensaje al usuario para confirmar la fecha seleccionada
        const confirmacion = confirm(`¿Consultar temperaturas para la fecha ${fechaInput}, desde las ${horaInicio} hasta las ${horaFin}?`);

        if (confirmacion) {
            mostrarTemperaturas(fechaInput, horaInicio, horaFin);
        }
    });
});

async function mostrarTemperaturas(fechaInput, horaInicio, horaFin) {
    try {
        // Convertir la fecha al formato 'dd-mm-yyyy'
        const fechaFormateada = formatDate(fechaInput);

        // Obtener las temperaturas dentro del rango de horas seleccionado
        const snapshot = await firebase.firestore().collection('App_Temp').doc(fechaFormateada).get();
        if (!snapshot.exists) {
            console.log('El documento no existe para la fecha:', fechaFormateada);
            return;
        }

        const data = snapshot.data();
        const temperaturas = data.temperaturas.filter(temp => {
            const horaTemp = parseInt(temp.hour.split(':')[0]);
            const horaInicioTemp = parseInt(horaInicio.split(':')[0]);
            const minutoTemp = parseInt(temp.hour.split(':')[1]);
            const minutoInicioTemp = parseInt(horaInicio.split(':')[1]);
            const horaFinTemp = parseInt(horaFin.split(':')[0]);
            const minutoFinTemp = parseInt(horaFin.split(':')[1]);

            // Verificar si la hora está dentro del rango
            if (horaTemp > horaInicioTemp && horaTemp < horaFinTemp) {
                return true;
            } else if (horaTemp === horaInicioTemp && minutoTemp >= minutoInicioTemp) {
                return true;
            } else if (horaTemp === horaFinTemp && minutoTemp <= minutoFinTemp) {
                return true;
            } else {
                return false;
            }
        });

        // Preparar datos para el gráfico
        const horas = temperaturas.map(temp => temp.hour);
        const celsius = temperaturas.map(temp => temp.celcius);

        // Calcular temperatura más alta, más baja y promedio
        const maxima = Math.max(...celsius);
        const minima = Math.min(...celsius);
        const promedio = celsius.reduce((acc, curr) => acc + curr, 0) / celsius.length;

        // Mostrar temperatura más alta, más baja y promedio
        document.getElementById('temperaturaMaxima').innerText = `Temperatura máxima: ${maxima}°C`;
        document.getElementById('temperaturaMinima').innerText = `Temperatura mínima: ${minima}°C`;
        document.getElementById('temperaturaPromedio').innerText = `Temperatura promedio: ${promedio.toFixed(2)}°C`;

        // Configurar el gráfico
        const ctx = document.getElementById('graficoTemperaturas').getContext('2d');
        const graficoTemperaturas = new Chart(ctx, {
            type: 'line',
            data: {
                labels: horas,
                datasets: [{
                    label: 'Temperatura (°C)',
                    data: celsius,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error al mostrar las temperaturas:', error);
    }
}


// Función para formatear la fecha al formato 'dd-mm-yyyy'
function formatDate(date) {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
}