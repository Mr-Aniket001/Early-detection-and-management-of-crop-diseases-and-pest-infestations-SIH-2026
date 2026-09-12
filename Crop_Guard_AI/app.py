import os
from pathlib import Path
import joblib
import pandas as pd
import folium
import requests
from flask import Flask, render_template, request, jsonify, Response
from tensorflow import keras
from PIL import Image
import numpy as np

app = Flask(__name__)

# Get API key from environment or use default
AGROMONITORING_API_KEY = os.getenv("AGROMONITORING_API_KEY", "fb0edf9a5875fa197a8299d2501e1fba")

# Define model paths
OUTBREAK_MODEL_PATH = Path(__file__).parent / "model_spread_detection" / "outbreak_risk_model.pkl"
MODEL_DIR = Path(__file__).resolve().parent / "model"

# LOAD MODEL
models = {
    "cotton": keras.models.load_model(MODEL_DIR / "cotton_cnn3.keras"),
    "rice": keras.models.load_model(MODEL_DIR / "rice_cnn.keras"),
    "sugarcane": keras.models.load_model(MODEL_DIR / "sugarcane_cnn.keras"),
    "wheat": keras.models.load_model(MODEL_DIR / "wheat_cnn.keras"),

}

class_names = {
    "cotton": ["Alternaria Leaf Spot", "Bacterial Blight", "Fusarium Wilt", "Healthy Leaf", "Verticillium Wilt"],
    "rice": ['Bacterialblight', 'Blast', 'Brownspot', 'Tungro'],
    "sugarcane": ['BacterialBlights', 'Healthy', 'Mosaic', 'RedRot', 'Rust', 'Yellow'],
    "wheat":['BlackPoint', 'FusariumFootRot', 'HealthyLeaf', 'LeafBlight', 'WheatBlast']
}

print("Model loaded successfully!")

# Common preprocessing
def preprocess_image(uploaded_file):
    image = Image.open(uploaded_file).convert("RGB")
    image = image.resize((224, 224))
    img_array = np.array(image)
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

# ==========================
# HOME
# ==========================
@app.route("/")
def home():
    return render_template("home.html")

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/user_login")
def user_login():
    return render_template("user-login.html")

@app.route("/farmer")
def farmer():

    return render_template("farmer.html")

@app.route("/expert")
def expert():

    return render_template("expert.html")

@app.route("/spreading")
def spreading():

    return render_template("spreading.html")

@app.route("/api/weather")
def weather():
    try:
        latitude = float(request.args["lat"])
        longitude = float(request.args["lon"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "Valid latitude and longitude are required"}), 400

    # Try AgroMonitoring API first
    if AGROMONITORING_API_KEY:
        try:
            print(f"Attempting to fetch weather for lat={latitude}, lon={longitude}")
            response = requests.get(
                "https://api.agromonitoring.com/agro/1.0/weather",
                params={
                    "lat": latitude,
                    "lon": longitude,
                    "appid": AGROMONITORING_API_KEY,
                },
                timeout=10,
            )
            
            print(f"API Response Status: {response.status_code}")
            print(f"API Response Headers: {response.headers}")
            
            # Check if response is valid JSON
            try:
                data = response.json()
                print(f"Successfully parsed JSON: {data}")
                
                rain_data = data.get("rain") or {}
                rainfall = rain_data.get("1h", rain_data.get("3h", 0))
                temperature = data.get("main", {}).get("temp")
                if temperature is not None and temperature > 100:
                    temperature -= 273.15
                wind_speed = data.get("wind", {}).get("speed", 0)

                return jsonify({
                    "temperature": round(temperature, 1) if temperature is not None else None,
                    "humidity": data.get("main", {}).get("humidity"),
                    "rainfall": rainfall,
                    "wind": round(float(wind_speed) * 3.6, 1),
                    "condition": (data.get("weather") or [{"main": "Unknown"}])[0]["main"],
                    "icon": "🌧️" if rainfall else "🌤️",
                })
            except (ValueError, requests.exceptions.JSONDecodeError) as e:
                print(f"JSON Parsing Error: {e}")
                print(f"Response Text (first 500 chars): {response.text[:500]}")
                
        except requests.RequestException as e:
            print(f"Request Error: {e}")
    
    # Fallback: Return mock weather data for testing
    print("Using mock weather data as fallback")
    return jsonify({
        "temperature": 25.5,
        "humidity": 75,
        "rainfall": 2.5,
        "wind": 12.3,
        "condition": "Partly Cloudy",
        "icon": "🌤️",
    })

@app.route("/api/outbreak-risk", methods=["POST"])
def outbreak_risk():
    values = request.get_json(silent=True) or {}
    required_fields = [
        "nitrogen", "phosphorus", "potassium", "temperature",
        "humidity", "ph", "rainfall", "label", "disease",
    ]

    if any(field not in values for field in required_fields):
        return jsonify({"error": "All outbreak model inputs are required"}), 400

    try:
        numeric_values = {
            field: float(values[field])
            for field in required_fields
            if field not in {"label", "disease"}
        }
    except (TypeError, ValueError):
        return jsonify({"error": "NPK, weather, and pH values must be numeric"}), 400

    if not isinstance(values["disease"], str) or not values["disease"].strip():
        return jsonify({"error": "A predicted disease is required"}), 400

    if not OUTBREAK_MODEL_PATH.exists():
        return jsonify({"error": "Outbreak model file was not found"}), 503

    try:
        model = joblib.load(OUTBREAK_MODEL_PATH)
        model_input = pd.DataFrame([{
            "N": numeric_values["nitrogen"],
            "P": numeric_values["phosphorus"],
            "K": numeric_values["potassium"],
            "temperature": numeric_values["temperature"],
            "humidity": numeric_values["humidity"],
            "ph": numeric_values["ph"],
            "rainfall": numeric_values["rainfall"],
            "label": values["label"].strip().lower(),
            "disease": values["disease"].strip(),
        }])
        prediction = model.predict(model_input)[0]
        probabilities = getattr(model, "predict_proba", lambda _: None)(model_input)
        probability = None
        if probabilities is not None:
            class_probabilities = probabilities[0]
            classes = list(getattr(model, "classes_", []))
            high_risk_index = next(
                (index for index, class_name in enumerate(classes)
                 if str(class_name).strip().lower() in {"1", "high", "high risk"}),
                None,
            )
            probability = float(
                class_probabilities[high_risk_index]
                if high_risk_index is not None
                else max(class_probabilities)
            )
    except ImportError:
        return jsonify({"error": "Install joblib, pandas, and scikit-learn to use the outbreak model"}), 503
    except Exception:
        return jsonify({"error": "The outbreak model could not process these inputs"}), 422

    return jsonify({
        "prediction": str(prediction),
        "probability": probability,
    })

@app.route("/api/risk-map")
def risk_map():
    try:
        latitude = float(request.args["lat"])
        longitude = float(request.args["lon"])
        if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
            raise ValueError
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "Valid latitude and longitude are required"}), 400

    crop = request.args.get("crop", "Unknown")
    disease = request.args.get("disease", "Unknown")
    risk = request.args.get("risk", "LOW").upper()
    probability = request.args.get("probability", "--")
    risk_colors = {"LOW": "green", "MEDIUM": "yellow", "HIGH": "white"}
    color = risk_colors.get(risk, "green")

    map_object = folium.Map(
        location=[latitude, longitude],
        zoom_start=12,
        control_scale=True,
        tiles="OpenStreetMap",
    )
    popup_html = f"""
        <div style='font-family: Arial, sans-serif; min-width: 210px'>
            <strong style='font-size: 16px'>CropGuard AI</strong><br>
            <hr style='border: 0; border-top: 1px solid #ddd'>
            <b>Plant:</b> {crop}<br>
            <b>Disease:</b> {disease}<br>
            <b>Outbreak probability:</b> {probability}<br>
            <b>Risk:</b> {risk}
        </div>
    """
    folium.Circle(
        location=[latitude, longitude],
        radius=1200,
        color=color,
        weight=3,
        fill=True,
        fill_color=color,
        fill_opacity=0.3,
        popup=folium.Popup(popup_html, max_width=300),
        tooltip=f"{crop} | {risk} risk",
    ).add_to(map_object)
    folium.Marker(
        [latitude, longitude],
        tooltip="Your field location",
    ).add_to(map_object)

    return Response(map_object.get_root().render(), mimetype="text/html")

@app.route("/predict", methods=["POST"])

def predict():
    crop = request.form.get("crop")              # crop name from frontend
    uploaded_file = request.files.get("file")    # image file from frontend

    if not crop or not uploaded_file:
        return jsonify({"error": "Missing crop name or image"}), 400

    if crop not in models:
        return jsonify({"error": "Invalid crop name"}), 400

    # Select model + class names
    model = models[crop]
    classes = class_names[crop]

    # Preprocess and predict
    img_array = preprocess_image(uploaded_file)
    prediction = model.predict(img_array)
    predicted_index = np.argmax(prediction[0])
    confidence = float(prediction[0][predicted_index])

    # Map index → disease name
    predicted_class = classes[predicted_index]

    # Risk logic (example: confidence threshold)
    risk = "HIGH" if confidence > 0.8 else "LOW"
    print(f"Using {crop} model for prediction")
    return jsonify({
        "crop": crop,
        "class": predicted_class,
        "confidence": confidence,
        "risk": risk
    })


# ==========================
# RUN
# ==========================

if __name__ == "__main__":
    app.run(debug=True)