// app.js

// Initialize a Leaflet map
var map = L.map('map').setView([0, 0], 2); // Center the map at a default location

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Arrays to hold node and path data
let markers = [];
let paths = [];

// Event listener for map clicks to add nodes
map.on('click', function (e) {
    const { lat, lng } = e.latlng;
    const marker = L.marker([lat, lng]).addTo(map);
    markers.push(marker);

    // Prompt for node details
    const nodeName = prompt("Enter node name:");
    if (nodeName) {
        marker.bindPopup(`<b>${nodeName}</b>`).openPopup();
        // Store additional attributes related to the node here
    }
}); 
