// script.js

const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');
const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const videoWrapper = document.querySelector('.video-wrapper');
const statusEl = document.getElementById('status');

let modelsLoaded = false;
let modelsLoading = false;

// Use local models folder (relative path)
const MODEL_URL = 'models/';  // Points to /models/ in your repo

async function loadModels() {
    if (modelsLoading) return;
    modelsLoading = true;
    statusEl.textContent = 'Loading face detection models...';

    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        modelsLoaded = true;
        statusEl.textContent = '✅ Models loaded. Click "Start Camera" to begin.';
        startBtn.disabled = false;
        retryBtn.style.display = 'none';
    } catch (err) {
        console.error('Failed to load models:', err);
        statusEl.innerHTML = '❌ Failed to load face detection models. ' +
                             'Make sure the model files are in the "models" folder. ' +
                             '<button id="retryBtn">Retry</button>';
        document.getElementById('retryBtn')?.addEventListener('click', () => {
            modelsLoaded = false;
            modelsLoading = false;
            loadModels();
        });
        retryBtn.style.display = 'inline-block';
    } finally {
        modelsLoading = false;
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
        
        videoWrapper.style.display = 'block';
        startBtn.style.display = 'none';
        retryBtn.style.display = 'none';

        video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        });

        video.addEventListener('play', detectFaces);
    } catch (err) {
        console.error('Error accessing webcam:', err);
        if (err.name === 'NotAllowedError') {
            statusEl.textContent = '❌ Camera access denied. Please allow access and try again.';
        } else if (err.name === 'NotFoundError') {
            statusEl.textContent = '❌ No camera found. Please connect a webcam.';
        } else {
            statusEl.textContent = '❌ Error accessing camera. Check console.';
        }
    }
}

// Detection loop
async function detectFaces() {
    if (!modelsLoaded || video.paused || video.ended) return;

    try {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({ 
                inputSize: 512, 
                scoreThreshold: 0.5 
            })
        );

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

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

    requestAnimationFrame(detectFaces);
}

// Event listeners
startBtn.addEventListener('click', () => {
    if (modelsLoaded) {
        startVideo();
    } else {
        statusEl.textContent = 'Models still loading. Please wait...';
    }
});

retryBtn.addEventListener('click', () => {
    modelsLoaded = false;
    modelsLoading = false;
    loadModels();
});

// Start loading models
loadModels();