async function predictDisease() {

    const input = document.getElementById("imageInput");
    const result = document.getElementById("result");

    if (input.files.length === 0) {
        result.innerHTML = "Please select an image.";
        return;
    }

    const image = input.files[0];

    // FormData is used to send the image
    const formData = new FormData();

    formData.append("image", image);

    result.innerHTML = "Predicting...";

    try {

        const response = await fetch("/predict", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            result.innerHTML = data.error;
            return;
        }

        const confidence =
            (data.confidence * 100).toFixed(2);

        result.innerHTML = `
            <h2>Prediction: ${data.class}</h2>
            <p>Confidence: ${confidence}%</p>
        `;

    } catch (error) {

        result.innerHTML =
            "Something went wrong: " + error;

    }
}