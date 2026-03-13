// script.js

const startBtn = document.getElementById('startBtn');
const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const videoWrapper = document.querySelector('.video-wrapper');
const statusEl = document.getElementById('status');

let modelsLoaded = false;

// Load face-api.js models
async function loadModels() {
    try {
        statusEl.textContent = 'Loading face detection models...';
        const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js-models@master/models';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        // Optionally load landmarks if you need better placement
        // await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        modelsLoaded = true;
        statusEl.textContent = 'Models loaded. Click "Start Camera" to begin.';
        startBtn.disabled = false;
    } catch (err) {
        console.error('Failed to load models:', err);
        statusEl.textContent = 'Error loading models. Check console.';
    }
}

// Start webcam stream
async function startVideo() {
    try {
        statusEl.textContent = 'Requesting camera access...';
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 }
            } 
        });
        video.srcObject = stream;
        statusEl.textContent = 'Camera started. Detecting faces...';
        // Show video wrapper
        videoWrapper.style.display = 'block';
        startBtn.style.display = 'none'; // Hide start button once running

        // Wait for video metadata to load to set canvas dimensions
        video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        });

        // Start detection loop when video plays
        video.addEventListener('play', detectFaces);
    } catch (err) {
        console.error('Error accessing webcam:', err);
        if (err.name === 'NotAllowedError') {
            statusEl.textContent = 'Camera access denied. Please allow access and try again.';
        } else if (err.name === 'NotFoundError') {
            statusEl.textContent = 'No camera found. Please connect a webcam.';
        } else {
            statusEl.textContent = 'Error accessing camera. Check console.';
        }
    }
}

// Detection loop
async function detectFaces() {
    if (!modelsLoaded || video.paused || video.ended) return;

    try {
        // Ensure canvas dimensions match video (in case they changed)
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        // Detect faces
        const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({ 
                inputSize: 512, 
                scoreThreshold: 0.5 
            })
        );

        // Draw video frame onto canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw emoji on each face
        detections.forEach(detection => {
            const { x, y, width, height } = detection.box;
            const emoji = '😊';
            const fontSize = height * 0.8;
            ctx.font = `${fontSize}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'EmojiOne Color', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, x + width / 2, y + height / 2);
        });
    } catch (err) {
        console.error('Detection error:', err);
    }

    // Continue loop
    requestAnimationFrame(detectFaces);
}

// Event listener for the start button
startBtn.addEventListener('click', () => {
    if (modelsLoaded) {
        startVideo();
    } else {
        statusEl.textContent = 'Models not loaded yet. Please wait.';
    }
});

// Load models when page loads
loadModels();