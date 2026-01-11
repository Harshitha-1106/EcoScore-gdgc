/*********************************************************
 * 🌱 GLOBAL STATE
 *********************************************************/
let transportImpact = 0;
let plasticImpact = 0;
let electricityImpact = 0;
let streakDays = Number(localStorage.getItem("ecoStreak")) || 1;

/*********************************************************
 * 🚲 TRANSPORT + MAP (LEAFLET)
 *********************************************************/
let selectedVehicle = "lorry";
let transportDistance = 0;

let map;
let userLocation = null;
let userMarker = null;
let destinationMarker = null;

/* Vehicle selection */
function selectVehicle(vehicle, btn) {
  selectedVehicle = vehicle;

  document.querySelectorAll(".vehicle .btn").forEach(b => {
    b.classList.remove("btn-success");
    b.classList.add("btn-outline-success");
  });

  btn.classList.remove("btn-outline-success");
  btn.classList.add("btn-success");

  updateTransportImpact();
}

/* Map initialization */
window.addEventListener("load", () => {
  map = L.map("map").setView([17.3850, 78.4867], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // Default vehicle
  document.querySelector(".vehicle .btn").classList.add("btn-success");
});

/* Use current location */
document.getElementById("useLocationBtn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      userLocation = { lat: latitude, lng: longitude };

      map.setView([latitude, longitude], 14);

      if (userMarker) map.removeLayer(userMarker);
      userMarker = L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup("📍 Your Location")
        .openPopup();
    },
    () => alert("Location permission denied")
  );
});

/* Calculate distance */
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
    .bindPopup("🎯 Destination")
    .openPopup();

  transportDistance = calculateDistanceKm(
    userLocation.lat,
    userLocation.lng,
    destLat,
    destLng
  );

  updateTransportImpact();
});

/* Transport impact */
function updateTransportImpact() {
  const impactText = document.getElementById("impactText");

  if (!transportDistance) {
    transportImpact = 0;
    impactText.textContent = "Impact will be calculated after distance";
    impactText.className = "fw-semibold text-secondary";
    updateScore();
    return;
  }

  const factors = { bike: 0.2, car: 1, lorry: 3 };
  transportImpact = transportDistance * factors[selectedVehicle];

  if (transportImpact <= 5) {
    impactText.textContent = `Low Impact 🙂 (${transportDistance.toFixed(2)} km)`;
    impactText.className = "fw-semibold text-success";
  } else if (transportImpact <= 20) {
    impactText.textContent = `Medium Impact ⚠️ (${transportDistance.toFixed(2)} km)`;
    impactText.className = "fw-semibold text-warning";
  } else {
    impactText.textContent = `High Impact 🚨 (${transportDistance.toFixed(2)} km)`;
    impactText.className = "fw-semibold text-danger";
  }

  updateScore();
}

/* Haversine formula */
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

/*********************************************************
 * ♻️ PLASTIC
 *********************************************************/
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
  plasticImpact = 0;

  document.querySelectorAll(".plastic-card").forEach(card => {
    plasticImpact +=
      Number(card.dataset.impact) *
      Number(card.querySelector(".count").textContent);
  });

  document.getElementById("totalImpact").textContent = plasticImpact;
  updateScore();
}

/*********************************************************
 * ⚡ ELECTRICITY
 *********************************************************/
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
  electricityImpact = electricityTotal * 5;

  document.getElementById("electricityTotal").textContent =
    electricityTotal.toFixed(3);

  updateScore();
};

/*********************************************************
 * 🌱 ECOSCORE + CATEGORY BREAKDOWN
 *********************************************************/
function updateScore() {
  const score = Math.max(
    0,
    Math.round(100 - (transportImpact + plasticImpact + electricityImpact))
  );

  document.getElementById("score").innerText = score;

  let feedback = "🌱 Eco Champion";
  if (score < 70) feedback = "🙂 Eco Saver";
  if (score < 40) feedback = "🚨 High Impact";

  document.getElementById("feedback").innerText = feedback;

  updateCategoryBreakdown();
}

function updateCategoryBreakdown() {
  const t = Math.max(0, Math.round(100 - transportImpact));
  const p = Math.max(0, Math.round(100 - plasticImpact));
  const e = Math.max(0, Math.round(100 - electricityImpact));

  document.getElementById("transportScore").innerText = t;
  document.getElementById("plasticScore").innerText = p;
  document.getElementById("electricityScore").innerText = e;

  document.getElementById("transportBar").style.width = t + "%";
  document.getElementById("plasticBar").style.width = p + "%";
  document.getElementById("electricityBar").style.width = e + "%";
}

/*********************************************************
 * 🔥 STREAK + SAVE
 *********************************************************/
function saveProgress() {
  const today = new Date().toDateString();
  const lastSaved = localStorage.getItem("lastEcoDate");

  if (lastSaved !== today) {
    streakDays++;
    localStorage.setItem("ecoStreak", streakDays);
    localStorage.setItem("lastEcoDate", today);
  }

  updateStreakUI();
  updateWeeklyTrend(Number(document.getElementById("score").innerText));

  alert("✅ Today's progress saved!");
}

function resetAll() {
  transportImpact = plasticImpact = electricityImpact = 0;
  electricityTotal = 0;
  transportDistance = 0;

  document.getElementById("destination").value = "";
  document.getElementById("impactText").textContent =
    "Impact will be calculated after distance";

  document.getElementById("electricityTotal").textContent = "0.000";
  document.getElementById("totalImpact").textContent = "0";

  updateScore();
}

function updateStreakUI() {
  document.getElementById("streakDays").innerText = streakDays;
  document.getElementById("streakProgress").style.width =
    Math.min((streakDays / 7) * 100, 100) + "%";
}

updateStreakUI();

/*********************************************************
 * 📈 WEEKLY TREND (Chart.js)
 *********************************************************/
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let weeklyData = JSON.parse(localStorage.getItem("weeklyEcoScores")) || {
  Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
};

const weeklyChart = new Chart(
  document.getElementById("weeklyChart"),
  {
    type: "line",
    data: {
      labels: WEEK_DAYS,
      datasets: [{
        data: WEEK_DAYS.map(d => weeklyData[d]),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.15)",
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { min: 0, max: 100 } }
    }
  }
);

function updateWeeklyTrend(score) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "short" });
  weeklyData[today] = score;

  localStorage.setItem("weeklyEcoScores", JSON.stringify(weeklyData));

  weeklyChart.data.datasets[0].data =
    WEEK_DAYS.map(d => weeklyData[d]);
  weeklyChart.update();

  const values = Object.values(weeklyData).filter(v => v > 0);
  const avg = values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 100;

  document.getElementById("weeklyAverage").innerText = avg;
}
