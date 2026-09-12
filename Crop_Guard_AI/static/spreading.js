const queryParams = new URLSearchParams(window.location.search);

const cropName = queryParams.get("crop");
const diseaseName = queryParams.get("disease");
const confidence = queryParams.get("confidence");
let latestCoordinates = null;

if (cropName) {
    document.getElementById("cropName").textContent = cropName;
}

if (diseaseName) {
    document.getElementById("diseaseName").textContent = diseaseName;
}

if (confidence) {
    document.getElementById("confidence").textContent = confidence;
}

function detectLocation() {
    const locationDisplay = document.getElementById("locationDisplay");

    if (!navigator.geolocation) {
        locationDisplay.textContent = "GPS is not supported by this browser.";
        return;
    }

    locationDisplay.textContent = "Detecting your location...";

    navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
            locationDisplay.textContent = "GPS location detected";
            latestCoordinates = {
                latitude: coords.latitude,
                longitude: coords.longitude,
            };
            getWeatherData(coords.latitude, coords.longitude);
        },
        () => {
            locationDisplay.textContent = "Location permission denied.";
        }
    );
}

function updateRiskMap(risk = "LOW", probability = null) {
    if (!latestCoordinates) {
        return;
    }

    const params = new URLSearchParams({
        lat: latestCoordinates.latitude,
        lon: latestCoordinates.longitude,
        crop: cropName || "Unknown",
        disease: diseaseName || "Unknown",
        risk,
        probability: probability == null ? "--" : `${probability.toFixed(2)}%`,
    });
    document.getElementById("riskMap").src = `/api/risk-map?${params}`;
    document.getElementById("mapCoordinates").textContent =
        `${latestCoordinates.latitude.toFixed(5)}, ${latestCoordinates.longitude.toFixed(5)}`;
    document.getElementById("waveArea").hidden = true;
    document.getElementById("riskMapPanel").hidden = false;
    document.getElementById("mapTitle").textContent = `${risk} RISK FIELD MAP`;
}

async function getWeatherData(latitude, longitude) {
    const status = document.getElementById("weatherStatus");
    const condition = document.getElementById("weatherCondition");

    status.textContent = "LOADING";
    condition.textContent = "Fetching weather...";

    try {
        const response = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
        const weather = await response.json();

        if (!response.ok) {
            throw new Error(weather.error || "Weather request failed");
        }

        document.getElementById("temperature").textContent = `${weather.temperature}°C`;
        document.getElementById("humidity").textContent = `${weather.humidity}%`;
        document.getElementById("rainfall").textContent = `${weather.rainfall} mm`;
        document.getElementById("wind").textContent = `${weather.wind} km/h`;
        condition.textContent = weather.condition;
        document.getElementById("weatherIcon").textContent = weather.icon;
        status.textContent = "LIVE";
        window.latestWeather = weather;
    } catch (error) {
        status.textContent = "ERROR";
        condition.textContent = error.message;
    }
}

async function calculateOutbreakRisk() {
    const status = document.getElementById("outbreakInputStatus");
    const weather = window.latestWeather;

    if (!weather) {
        status.textContent = "Detect your location first to load weather data.";
        return;
    }

    const input = {
        nitrogen: document.getElementById("nitrogen").value,
        phosphorus: document.getElementById("phosphorus").value,
        potassium: document.getElementById("potassium").value,
        ph: document.getElementById("ph").value,
        temperature: weather.temperature,
        humidity: weather.humidity,
        rainfall: weather.rainfall,
        label: cropName || "Unknown",
        disease: diseaseName || "Unknown",
    };

    if ([input.nitrogen, input.phosphorus, input.potassium, input.ph].some(value => value === "")) {
        status.textContent = "Enter nitrogen, phosphorus, potassium, and soil pH.";
        return;
    }

    status.textContent = "Calculating outbreak risk...";

    try {
        const response = await fetch("/api/outbreak-risk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Outbreak prediction failed");
        }

        status.textContent = `Model result: ${result.prediction}`;
        const probability = result.probability == null ? null : result.probability * 100;
        const prediction = String(result.prediction);

        // Use the model's spread probability to determine the three risk bands.
        let riskLevel;
        let displayPercentage = probability;
        if (probability == null) {
            riskLevel = prediction === "1" ? "HIGH" : "LOW";
            displayPercentage = riskLevel === "HIGH" ? 85 : 15;
        } else if (probability >= 70) {
            riskLevel = "HIGH";
        } else if (probability >= 40) {
            riskLevel = "MEDIUM";
        } else {
            riskLevel = "LOW";
        }

        document.getElementById("modelPrediction").textContent = prediction;
        document.getElementById("riskLevel").textContent = riskLevel;
        updateRiskMap(riskLevel, probability);
        
        // Set meter-fill width to display correct risk level visually
        document.getElementById("meterFill").style.width = `${displayPercentage}%`;

        if (probability != null) {
            document.getElementById("riskProbability").textContent = result.probability.toFixed(4);
            document.getElementById("riskPercentage").textContent = `${probability.toFixed(2)}%`;
            document.getElementById("riskExplanation").textContent =
                `Outbreak model prediction: ${prediction}. Risk level: ${riskLevel}. Model confidence: ${probability.toFixed(2)}%.`;
        } else {
            document.getElementById("riskExplanation").textContent =
                `Outbreak model prediction: ${prediction}. Risk level: ${riskLevel}. Disease spread risk has been assessed.`;
        }
        document.getElementById("analysisStatus").textContent = `${riskLevel} RISK - MODEL COMPLETE`;
        document.getElementById("analysisText").textContent = `${riskLevel} RISK LEVEL DETECTED`;
    } catch (error) {
        status.textContent = error.message;
    }
}

function calculateRisk(weather) {
    const analysisStatus = document.getElementById("analysisStatus");
    const analysisText = document.getElementById("analysisText");

    analysisStatus.textContent = "ANALYSING";
    analysisText.textContent = "PROCESSING ENVIRONMENT DATA...";

    let riskScore = 0;

    riskScore += weather.humidity >= 80 ? 35 : weather.humidity >= 65 ? 20 : 8;
    riskScore += weather.rainfall >= 7 ? 30 : weather.rainfall >= 3 ? 18 : 5;
    riskScore += weather.temperature >= 18 && weather.temperature <= 28 ? 25 : 10;
    riskScore += weather.wind <= 15 ? 10 : 0;

    showRisk(Math.min(riskScore, 100));
}

function showRisk(score) {
    document.getElementById("meterFill").style.width = `${score}%`;

    let level;
    let explanation;

    if (score >= 70) {
        level = "HIGH";
        explanation = "Current environmental conditions may favour disease development or spread. Increase field monitoring and follow local agricultural recommendations.";
    } else if (score >= 40) {
        level = "MEDIUM";
        explanation = "Some environmental conditions may support disease development. Continue regular field monitoring and follow preventive practices.";
    } else {
        level = "LOW";
        explanation = "Current environmental conditions are less favourable for rapid disease spread. Continue routine crop monitoring.";
    }

    document.getElementById("riskLevel").textContent = level;
    document.getElementById("analysisStatus").textContent = `${level} RISK`;
    document.getElementById("analysisText").textContent = `${level} SPREAD CONDITIONS DETECTED`;
    document.getElementById("riskExplanation").textContent = explanation;
}

const soilInputs = [
    document.getElementById("nitrogen"),
    document.getElementById("phosphorus"),
    document.getElementById("potassium"),
    document.getElementById("ph"),
].filter(Boolean);

const calculateButton = document.querySelector(".input-submit");

soilInputs.forEach((input, index) => {
    input.addEventListener("keydown", event => {
        const nextIndex = index + 1;
        const previousIndex = index - 1;
        const movesForward = event.key === "Enter" || event.key === "ArrowRight" || event.key === "ArrowDown";
        const movesBackward = event.key === "ArrowLeft" || event.key === "ArrowUp";

        if (movesForward && nextIndex < soilInputs.length) {
            event.preventDefault();
            soilInputs[nextIndex].focus();
        } else if (movesForward && calculateButton) {
            event.preventDefault();
            calculateButton.focus();
        } else if (movesBackward && previousIndex >= 0) {
            event.preventDefault();
            soilInputs[previousIndex].focus();
        }
    });
});
