// script.js

const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');

// Load face-api.js models from a CDN
async function loadModels() {
    const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js-models@master/models';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    // Optionally load landmarks for better placement (not required for simple overlay)
    // await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    console.log('Models loaded');
}

// Start webcam stream
async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (err) {
        console.error('Error accessing webcam:', err);
        alert('Could not access webcam. Please ensure you have granted permission.');
    }
}

// When video is ready, start detection loop
video.addEventListener('play', () => {
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Run detection every animation frame
    const detectFaces = async () => {
        // Detect faces using Tiny Face Detector
        const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 })
        );
        // If you loaded landmarks, you can get them with .withFaceLandmarks()

        // Draw the current video frame onto the canvas (as background)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // For each detected face, draw an emoji
        detections.forEach(detection => {
            const { x, y, width, height } = detection.box;

            // Choose emoji (you can change this to any Unicode emoji)
            const emoji = '😊';

            // Font size relative to face height (makes emoji fit nicely)
            const fontSize = height * 0.8;
            ctx.font = `${fontSize}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'EmojiOne Color', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Draw emoji at the center of the face bounding box
            ctx.fillText(emoji, x + width / 2, y + height / 2);
        });

        // Continue loop
        requestAnimationFrame(detectFaces);
    };

    detectFaces();
});

// Initialize everything
(async () => {
    await loadModels();
    await startVideo();
})();