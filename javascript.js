/* ================= GLOBAL SCORES ================= */
let transportScore = 0;
let plasticScore = 0;
let electricityScore = 0;

/* ================= TRANSPORT ================= */
let selectedVehicle = "lorry";
let transportDistance = 0;

// Vehicle selection
function selectVehicle(vehicle, btn) {
  selectedVehicle = vehicle;

  document.querySelectorAll(".vehicle .btn").forEach(b => {
    b.classList.remove("btn-success");
    b.classList.add("btn-outline-success");
  });

  btn.classList.remove("btn-outline-success");
  btn.classList.add("btn-success");

  updateImpact();
}

// Update transport impact text
function updateImpact() {
  const impactText = document.getElementById("impactText");

  if (!transportDistance || transportDistance <= 0) {
    transportScore = 0;
    impactText.textContent = "Impact will be calculated after distance";
    impactText.className = "fw-semibold text-secondary";
    return;
  }

  let impactScore = 0;
  if (selectedVehicle === "bike") impactScore = transportDistance * 0.2;
  else if (selectedVehicle === "car") impactScore = transportDistance * 1;
  else impactScore = transportDistance * 3;

  transportScore = impactScore;

  if (impactScore <= 5) {
    impactText.textContent = `Low Impact 🙂 (${transportDistance.toFixed(2)} km)`;
    impactText.className = "fw-semibold text-success";
  } else if (impactScore <= 20) {
    impactText.textContent = `Medium Impact ⚠️ (${transportDistance.toFixed(2)} km)`;
    impactText.className = "fw-semibold text-warning";
  } else {
    impactText.textContent = `High Impact 🚨 (${transportDistance.toFixed(2)} km)`;
    impactText.className = "fw-semibold text-danger";
  }
}

/* ================= OPENSTREETMAP (LEAFLET) ================= */
let map = L.map("map").setView([17.3850, 78.4867], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

let userLocation = null;
let userMarker = null;
let destinationMarker = null;

// Use current location
document.getElementById("useLocationBtn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      userLocation = { lat, lng };

      map.setView([lat, lng], 14);

      if (userMarker) map.removeLayer(userMarker);
      userMarker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup("📍 Your Location")
        .openPopup();
    },
    () => alert("Location permission denied")
  );
});

// Calculate distance using OpenStreetMap
document.getElementById("calcDistanceBtn").addEventListener("click", async () => {
  if (!userLocation) {
    alert("Please use current location first");
    return;
  }

  const destination = document.getElementById("destination").value.trim();
  if (!destination) {
    alert("Please enter destination");
    return;
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${destination}`
  );
  const data = await res.json();

  if (!data.length) {
    alert("Destination not found");
    return;
  }

  const destLat = parseFloat(data[0].lat);
  const destLng = parseFloat(data[0].lon);

  if (destinationMarker) map.removeLayer(destinationMarker);
  destinationMarker = L.marker([destLat, destLng])
    .addTo(map)
    .bindPopup("🎯 Destination");

  transportDistance = calculateDistanceKm(
    userLocation.lat,
    userLocation.lng,
    destLat,
    destLng
  );

  document.getElementById("calculateTotal").disabled = false;
  updateImpact();
});

// Haversine formula
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/* ================= PLASTIC (UNCHANGED) ================= */
document.querySelectorAll(".plastic-card").forEach(card => {
  const countEl = card.querySelector(".count");

  card.querySelector(".plus").onclick = () => {
    countEl.textContent++;
    updatePlastic();
  };

  card.querySelector(".minus").onclick = () => {
    if (countEl.textContent > 0) countEl.textContent--;
    updatePlastic();
  };
});

function updatePlastic() {
  plasticScore = 0;
  document.querySelectorAll(".plastic-card").forEach(card => {
    plasticScore +=
      Number(card.dataset.impact) *
      Number(card.querySelector(".count").textContent);
  });
  document.getElementById("totalImpact").textContent = plasticScore;
}

/* ================= ELECTRICITY (UNCHANGED) ================= */
let selectedPower = 10;
let hoursUsed = 1;
let electricityTotal = 0;

document.querySelectorAll(".appliance-card").forEach(card => {
  card.onclick = () => {
    document.querySelectorAll(".appliance-card").forEach(c =>
      c.classList.remove("active")
    );
    card.classList.add("active");
    selectedPower = parseInt(card.querySelector(".appliance-power").textContent);
  };
});

document.querySelectorAll(".hours-control button").forEach(btn => {
  btn.onclick = () => {
    if (btn.textContent === "+") hoursUsed++;
    else if (hoursUsed > 1) hoursUsed--;
    document.querySelector(".hours-control span").textContent = hoursUsed;
  };
});

document.querySelector(".add-btn").onclick = () => {
  const kwh = (selectedPower * hoursUsed) / 1000;
  electricityTotal += kwh;
  electricityScore = electricityTotal * 5;
  document.getElementById("electricityTotal").textContent =
    electricityTotal.toFixed(3);
};

/* ================= FINAL ECOSCORE ================= */
document.getElementById("calculateTotal").onclick = () => {
  const totalImpact =
    transportScore + plasticScore + electricityScore;

  let ecoScore = Math.max(0, 100 - totalImpact);
  ecoScore = Math.min(100, ecoScore);

  document.getElementById("ecoScoreValue").textContent =
    Math.round(ecoScore);

  const suggestion = document.getElementById("ecoSuggestion");
  if (ecoScore >= 80) {
    suggestion.textContent = "🌱 Eco Champion! Excellent habits";
    suggestion.className = "text-success fw-bold";
  } else if (ecoScore >= 50) {
    suggestion.textContent = "🙂 Eco Saver. Can improve";
    suggestion.className = "text-warning fw-bold";
  } else {
    suggestion.textContent = "🚨 High Impact! Reduce usage";
    suggestion.className = "text-danger fw-bold";
  }
};

/* ================= DEFAULT ================= */
window.onload = () => {
  document.querySelector(".vehicle .btn").classList.add("btn-success");
};
