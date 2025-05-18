// storage.js

localforage.config({
    name: 'dataCollectionApp',
    storeName: 'myData',
});

// Function to save data
function saveData() {
    const dataToSave = {
        gpsData,
        imuData,
        markers: markers.map(marker => ({
            lat: marker.getLatLng().lat,
            lng: marker.getLatLng().lng,
            // Additional node attributes can go here
        })),
        paths // Include paths
    };

    localforage.setItem('dataSession', dataToSave).then(() => {
        console.log('Data saved locally.');
    }).catch(err => {
        console.error('Error saving data:', err);
    });
}

// Call saveData() as needed (e.g., on a button click) 
