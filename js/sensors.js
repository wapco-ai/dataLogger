// sensors.js

let gpsData = [];
let imuData = [];

// Start GPS tracking
function startGPS() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition((position) => {
            const { latitude, longitude } = position.coords;
            gpsData.push({ latitude, longitude, timestamp: Date.now() });
            console.log('GPS Position:', gpsData);
            // Optional: Update GPS path on the map
        }, (error) => {
            console.error('Error obtaining GPS data:', error);
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

// Start IMU tracking
function startIMU() {
    if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', (event) => {
            imuData.push({
                acceleration: event.acceleration,
                timestamp: event.timeStamp
            });
            // Optional: Use IMU data for dead reckoning
            console.log('IMU Data:', imuData);
        });
    } else {
        alert('DeviceMotion is not supported by this browser.');
    }
}

startGPS();
startIMU(); 
