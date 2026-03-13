// script.js

const startBtn = document.getElementById('startBtn');
const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const videoWrapper = document.querySelector('.video-wrapper');
const statusEl = document.getElementById('status');

let faceDetector;
let camera = null;

// Initialize MediaPipe Face Detection
async function initDetector() {
    statusEl.textContent = 'Loading face detection model...';
    try {
        faceDetector = new faceDetection.FaceDetector({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4.1646425229/${file}`;
            }
        });

        // Set detection options
        faceDetector.setOptions({
            modelSelection: 0, // 0 for short-range, 1 for full-range
            minDetectionConfidence: 0.5
        });

        // Pass the video feed and receive detections
        faceDetector.onResults(onResults);

        statusEl.textContent = '✅ Model loaded. Click "Start Camera" to begin.';
    } catch (err) {
        console.error('Failed to load face detector:', err);
        statusEl.textContent = '❌ Failed to load model. Please refresh and try again.';
    }
}

// Callback when face detection results are ready
function onResults(results) {
    // Clear canvas and draw the video frame
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.detections && results.detections.length > 0) {
        results.detections.forEach(detection => {
            // MediaPipe returns normalized bounding box [x, y, width, height]
            const bbox = detection.boundingBox;
            const x = bbox.xMin * canvas.width;
            const y = bbox.yMin * canvas.height;
            const width = (bbox.xMax - bbox.xMin) * canvas.width;
            const height = (bbox.yMax - bbox.yMin) * canvas.height;

            // Draw emoji
            const emoji = '😊';
            const fontSize = height * 0.8;
            ctx.font = `${fontSize}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'EmojiOne Color', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, x + width / 2, y + height / 2);
        });
    }
    ctx.restore();
}

// Start camera and connect to MediaPipe
async function startCamera() {
    try {
        statusEl.textContent = 'Requesting camera access...';
        
        // Set up camera
        camera = new Camera(video, {
            onFrame: async () => {
                await faceDetector.send({ image: video });
            },
            width: 640,
            height: 480
        });

        // Start camera stream
        await camera.start();

        // Set canvas dimensions to match video
        video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        });

        // Show video wrapper and hide start button
        videoWrapper.style.display = 'block';
        startBtn.style.display = 'none';
        statusEl.textContent = 'Camera started. Detecting faces...';
    } catch (err) {
        console.error('Error starting camera:', err);
        if (err.name === 'NotAllowedError') {
            statusEl.textContent = '❌ Camera access denied. Please allow access and try again.';
        } else if (err.name === 'NotFoundError') {
            statusEl.textContent = '❌ No camera found. Please connect a webcam.';
        } else {
            statusEl.textContent = '❌ Error accessing camera. Check console.';
        }
    }
}

// Event listener for start button
startBtn.addEventListener('click', () => {
    if (faceDetector) {
        startCamera();
    } else {
        statusEl.textContent = 'Model still loading. Please wait...';
    }
});

// Initialize detector when page loads
initDetector();