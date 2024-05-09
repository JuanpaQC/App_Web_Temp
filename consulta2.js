document.addEventListener('DOMContentLoaded', function() {
    const mostrarTemperaturasButton = document.getElementById('mostrarTemperaturasBtn');

    mostrarTemperaturasButton.addEventListener('click', function() {
        const fechaInput1 = document.getElementById('date1').value;
        const fechaInput2 = document.getElementById('date2').value;
        
        // Verificar si se seleccionaron ambas fechas
        if (!fechaInput1 || !fechaInput2) {
            console.error('¡Por favor selecciona ambas fechas!');
            return;
        }

        // Mostrar un mensaje al usuario para confirmar las fechas seleccionadas
        const confirmacion = confirm(`¿Consultar temperaturas para las fechas ${fechaInput1} y ${fechaInput2}?`);

        if (confirmacion) {
            mostrarTemperaturas(fechaInput1, fechaInput2);
        }
    });
});

async function mostrarTemperaturas(fechaInput1, fechaInput2) {
    try {
        // Obtener las fechas intermedias entre fechaInput1 y fechaInput2
        const fechasIntermedias = getFechasIntermedias(fechaInput1, fechaInput2);

        // Crear un array con las fechas seleccionadas y las fechas intermedias, si existen
        const fechas = [fechaInput1, ...fechasIntermedias, fechaInput2];

        // Obtener datos para todas las fechas
        const promesasDatos = fechas.map(async (fechaInput) => {
            const fechaFormateada = formatDate(fechaInput);
            const snapshot = await firebase.firestore().collection('App_Temp').doc(fechaFormateada).get();
            if (snapshot.exists) {
                const data = snapshot.data();
                return data.temperaturas;
            } else {
                console.log('El documento no existe para la fecha:', fechaFormateada);
                return [];
            }
        });

        const datosTemperaturas = await Promise.all(promesasDatos);

        // Combinar todos los datos de temperaturas en un solo arreglo
        const temperaturasCombinadas = datosTemperaturas.reduce((acumulador, temperaturas) => {
            return acumulador.concat(temperaturas);
        }, []);

        // Extraer las horas y las temperaturas de la combinación de datos
        const horas = temperaturasCombinadas.map(temp => temp.hour);
        const celsius = temperaturasCombinadas.map(temp => temp.celcius);

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


function getFechasIntermedias(fechaInput1, fechaInput2) {
    const fechasIntermedias = [];
    const fechaInicio = new Date(fechaInput1);
    const fechaFin = new Date(fechaInput2);

    // Avanzar un día desde la fecha de inicio para evitar duplicados
    fechaInicio.setDate(fechaInicio.getDate() + 1);

    while (fechaInicio < fechaFin) {
        fechasIntermedias.push(new Date(fechaInicio));
        fechaInicio.setDate(fechaInicio.getDate() + 1);
    }

    return fechasIntermedias.map(date => date.toISOString().slice(0, 10));
}


// Función para formatear la fecha al formato 'dd-mm-yyyy'
function formatDate(date) {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
}