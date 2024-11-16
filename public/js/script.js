const socket = io();

const map = L.map("map").setView([0, 0], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "OpenStreetMap",
}).addTo(map);

const markers = {};
let routeControl = null;

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit("send-location", { latitude, longitude });
    },
    (error) => {
      console.log(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
}

// Listen for other users' locations
socket.on("recieved-location", (data) => {
  const { id, latitude, longitude } = data;

  // Set or update marker for the user
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }

  // If there are exactly 2 markers (2 users), draw the route
  const markerIds = Object.keys(markers);
  if (markerIds.length === 2) {
    const [firstUser, secondUser] = markerIds;

    const firstLatLng = markers[firstUser].getLatLng();
    const secondLatLng = markers[secondUser].getLatLng();

    // Remove any existing route
    if (routeControl) {
      map.removeControl(routeControl);
    }

    // Create a new route
    routeControl = L.Routing.control({
      waypoints: [firstLatLng, secondLatLng],
      routeWhileDragging: true,
      createMarker: () => null, // To avoid extra markers at waypoints
    }).addTo(map);
  }
});

socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }

  // Remove the route if there's only one user left
  if (Object.keys(markers).length < 2 && routeControl) {
    map.removeControl(routeControl);
    routeControl = null;
  }
});
