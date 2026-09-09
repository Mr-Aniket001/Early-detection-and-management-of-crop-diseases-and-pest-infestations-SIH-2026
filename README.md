# 🌾 Crop Disease Predictor & Weather Risk Forecaster

> *Smart India Hackathon (SIH) Project*
> Developed by a 6-member team to empower Indian farmers with image-based disease detection and localized weather insights in their native languages.

## 🚀 Introduction
Welcome to our Smart India Hackathon (SIH) repository. We built this Flask-based web platform to bridge the gap between advanced deep learning and grassroots agriculture. By simply uploading an image of their crop, farmers receive instant disease predictions, actionable remedies, and weather-based risk assessments. We designed this solution to be highly accessible, featuring seamless multilingual support for major Indian regional languages. 

## ✨ Features
* *Image-Based Disease Detection:* Deep learning computer vision models trained specifically to identify diseases in Rice, Cotton, and Sugarcane.
* *Intelligent Risk Forecasting:* Dynamic fetching of user location and real-time weather data to assess environmental risks impacting crop health.
* *Native Language Support:* Client-side translation dropdown allowing users to navigate the platform in Hindi, Bengali, Telugu, Tamil, Marathi, and more, with persistent tracking across all pages.
* *Accessible UI:* A clean, responsive frontend tailored for ease of use in agricultural fields.

## 🛠️ Technology Stack
* *Backend:* Python, Flask
* *Machine Learning:* Keras (CNN image classification models), Scikit-Learn (Secondary ML risk model)
* *Frontend:* HTML5, CSS3, JavaScript (Jinja2 Templates)
* *APIs & Integration:* Weather Data API, Google Translate Web Element

## 🧩 Code Explanation & Workflow

* *app.py (The Brain of the Application):* This is the central controller of our platform. It handles all core routing and logic:
  1. Receives the uploaded crop image from the user.
  2. Dynamically decides which specific Keras CNN model (rice_CNN.keras, cotton_CNN.keras, or Sugarcane_CNN.keras) to run based on the input.
  3. Fetches the user's current location and retrieves real-time weather data via API.
  4. Feeds both the initial disease prediction and the live weather data into our secondary machine learning model (secondary_ML_model.pkl) to generate a comprehensive, final risk forecast.
* *Frontend & UI (template/ & static/):* Contains our custom HTML interfaces and CSS stylesheets crafted for a straightforward, farmer-friendly user experience.
* *Translation Logic (translate.js):* A custom JavaScript implementation that hooks into the Google Translate web element. It uses browser cookies to remember the farmer's selected regional language and applies it automatically across all active Flask routes.
