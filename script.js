// script.js

const startBtn = document.getElementById('startBtn');
const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const videoWrapper = document.querySelector('.video-wrapper');
const statusEl = document.getElementById('status');

let detector = null;
let modelLoading = false;

// Initialize the face detector
async function initDetector() {
    if (modelLoading) return;
    modelLoading = true;
    statusEl.textContent = 'Loading face detection model...';

    try {
        // Use MediaPipe BlazeFace model (lightweight and fast)
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detectorConfig = {
            runtime: 'tfjs', // Use TensorFlow.js backend
            maxFaces: 10,
        };
        detector = await faceDetection.createDetector(model, detectorConfig);
        
        statusEl.textContent = '✅ Model loaded. Click "Start Camera" to begin.';
        startBtn.disabled = false;
    } catch (err) {
        console.error('Failed to load model:', err);
        statusEl.innerHTML = '❌ Failed to load face detection model. ' +
                             'Please check your internet connection and <button id="retryBtn">retry</button>.';
        document.getElementById('retryBtn')?.addEventListener('click', () => {
            modelLoading = false;
            initDetector();
        });
    } finally {
        modelLoading = false;
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
    if (!detector || video.paused || video.ended) return;

    try {
        // Ensure canvas dimensions match video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        // Detect faces
        const faces = await detector.estimateFaces(video);

        // Draw video frame onto canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw emoji on each face
        faces.forEach(face => {
            // The bounding box is in [x1, y1, x2, y2] format
            const box = face.box;
            const x = box.xMin;
            const y = box.yMin;
            const width = box.xMax - box.xMin;
            const height = box.yMax - box.yMin;

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
startBtn.addEventListener('click', startVideo);

// Start loading the model
initDetector();