/* =========================================================
   CROPGUARD AI - FARMER SCANNER
========================================================= */

/* =========================================================
   GET HTML ELEMENTS
========================================================= */
const cropName = document.getElementById("cropName");
const cropImage = document.getElementById("cropImage");
const uploadArea = document.getElementById("uploadArea");
const imagePreview = document.getElementById("imagePreview");
const previewImage = document.getElementById("previewImage");
const removeImage = document.getElementById("removeImage");
const scannerImage = document.getElementById("scannerImage");
const scanCard = document.getElementById("scanCard");
const analyzeBtn = document.getElementById("analyzeBtn");
const scannerStatus = document.getElementById("scannerStatus");
const statusLight = document.getElementById("statusLight");
const scanMessage = document.getElementById("scanMessage");
const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");
const progressText = document.getElementById("progressText");
const activityLog = document.getElementById("activityLog");
const resultSection = document.getElementById("resultSection");
const diseaseResult = document.getElementById("diseaseResult");
const diseaseDescription = document.getElementById("diseaseDescription");
const confidenceResult = document.getElementById("confidenceResult");
const confidenceFill = document.getElementById("confidenceFill");
const riskResult = document.getElementById("riskResult");
const warningBox = document.getElementById("warningBox");
const analyzedLink = document.getElementById("analyzedLink");

/* =========================================================
   IMAGE UPLOAD
========================================================= */
cropImage.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const imageURL = URL.createObjectURL(file);

    previewImage.src = imageURL;
    imagePreview.style.display = "block";
    uploadArea.style.display = "none";

    scannerImage.src = imageURL;
    scanCard.classList.add("has-image");

    addActivity("Crop image received");
    addActivity("Image ready for AI analysis");

    scannerStatus.textContent = "IMAGE READY";
    scanMessage.innerHTML = `
        <strong>IMAGE READY</strong>
        <span>Press Analyze Crop to begin</span>
    `;
});

/* =========================================================
   REMOVE IMAGE
========================================================= */
removeImage.addEventListener("click", function () {
    cropImage.value = "";
    imagePreview.style.display = "none";
    uploadArea.style.display = "flex";
    scannerImage.src = "";
    scanCard.classList.remove("has-image");

    scannerStatus.textContent = "READY";
    scanMessage.innerHTML = `
        <strong>SYSTEM READY</strong>
        <span>Upload an image to begin</span>
    `;
});

/* =========================================================
   ACTIVITY LOG
========================================================= */
function addActivity(message) {
    const item = document.createElement("p");
    item.innerHTML = `<span>›</span>${message}`;
    activityLog.appendChild(item);
    activityLog.scrollTop = activityLog.scrollHeight;
}

/* =========================================================
   ANALYZE BUTTON
========================================================= */
/* =========================================================
   ANALYZE BUTTON
========================================================= */
analyzeBtn.addEventListener("click", function () {
    if (cropName.value === "") {
        showCropGuardAlert("Please select your crop first.");
        return;
    }
    if (!cropImage.files[0]) {
        showCropGuardAlert("Please upload a crop image first.");
        return;
    }
    startScan(); // animation starts first
});

/* =========================================================
   START SCAN
========================================================= */
function startScan() {
    resultSection.classList.remove("show");
    warningBox.classList.remove("show");

    analyzeBtn.disabled = true;
    analyzeBtn.style.opacity = "0.5";

    scanCard.classList.add("scanning");
    scannerStatus.textContent = "SCANNING";
    statusLight.style.background = "#00ff8c";
    scanMessage.innerHTML = `
        <strong>SCANNING...</strong>
        <span>Analyzing crop symptoms</span>
    `;

    progressFill.style.width = "0%";
    progressPercent.textContent = "0%";
    progressText.textContent = "Initializing AI scanner";
    activityLog.innerHTML = "";
    addActivity("Initializing CropGuard vision engine");

    const steps = [
        { percent: 10, message: "Image quality check", activity: "Checking image quality" },
        { percent: 25, message: "Detecting crop structure", activity: "Crop structure identified" },
        { percent: 40, message: "Extracting visual symptoms", activity: "Extracting symptom patterns" },
        { percent: 55, message: "Running CNN analysis", activity: "Crop-specific CNN activated" },
        { percent: 70, message: "Comparing disease patterns", activity: "Comparing disease signatures" },
        { percent: 85, message: "Checking environmental risk", activity: "Weather risk engine activated" },
        { percent: 100, message: "Analysis complete", activity: "AI analysis completed" }
    ];

    let index = 0;
    function nextStep() {
        if (index >= steps.length) {
            finishScan(); // only after animation ends
            return;
        }
        const step = steps[index];
        progressFill.style.width = step.percent + "%";
        progressPercent.textContent = step.percent + "%";
        progressText.textContent = step.message;
        scanMessage.innerHTML = `
            <strong>${step.message.toUpperCase()}</strong>
            <span>AI engine processing...</span>
        `;
        addActivity(step.activity);
        index++;
        setTimeout(nextStep, 900);
    }
    nextStep();
}

/* =========================================================
   FINISH SCAN
========================================================= */
function finishScan() {
    scanCard.classList.remove("scanning");
    scannerStatus.textContent = "COMPLETE";
    scanMessage.innerHTML = `
        <strong>✓ SCAN COMPLETE</strong>
        <span>Crop health analysis finished</span>
    `;
    progressText.textContent = "Analysis complete";
    progressPercent.textContent = "100%";

    addActivity("Disease prediction generated");
    addActivity("Risk assessment completed");
    addActivity("Advisory engine ready");

    setTimeout(() => {
        showDemoResult(); //Backend
    }, 1500);

    analyzeBtn.disabled = false;
    analyzeBtn.style.opacity = "1";
}


/* =========================================================
   DEMO RESULT (with cotton fix)
========================================================= */
async function showDemoResult() {
    const result = document.getElementById("result_card");
    const crop = cropName.value;

    let disease = "Unknown";
    let confidence = 0;
    let risk = "LOW";

    try {
        // Prepare form data with crop name + image
        const formData = new FormData();
        formData.append("crop", crop);              // send crop name
        formData.append("file", cropImage.files[0]); // send image file

        const response = await fetch("/predict", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            result.innerHTML = data.error;
            return;
        }

        confidence = (data.confidence * 100).toFixed(2);
        disease = data.class;
        risk = data.risk || "HIGH"; // backend can decide risk

        const cropLabel = cropName.options[cropName.selectedIndex].text.trim();
        const spreadingUrl = new URL(analyzedLink.href, window.location.origin);
        spreadingUrl.search = new URLSearchParams({
            crop: cropLabel,
            disease,
            confidence: `${confidence}%`,
            risk
        }).toString();
        analyzedLink.href = spreadingUrl.toString();

        result.innerHTML = `
            <h3>Prediction: ${data.class}</h3>
            <h4>Confidence: ${confidence}%</h4>
            <h4>Risk: ${risk}</h4>
        `;
    } catch (error) {
        result.innerHTML = "Something went wrong: " + error;
    }

    // Update UI elements
    diseaseResult.textContent = disease;
    diseaseDescription.textContent = "Possible condition identified from visible crop symptoms.";
    confidenceResult.textContent = confidence + "%";

    setTimeout(() => {
        confidenceFill.style.width = confidence + "%";
    }, 300);

    if (confidence < 70) {
        warningBox.classList.add("show");
    } else {
        warningBox.classList.remove("show");
    }

    resultSection.classList.add("show");
    setTimeout(() => {
        resultSection.scrollIntoView({ behavior: "smooth" });
    }, 500);
}
