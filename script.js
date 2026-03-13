// script.js

const startBtn = document.getElementById('startBtn');
const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const videoWrapper = document.querySelector('.video-wrapper');
const statusEl = document.getElementById('status');

let faceDetector;
let lastVideoTime = -1;

// Initialize MediaPipe Face Detector
async function initDetector() {
    statusEl.textContent = 'Loading face detection model...';
    try {
        // Ensure the Vision library is loaded
        const vision = await window.FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
        );
        faceDetector = await vision.createFaceDetector(
            vision,
            {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
                    delegate: 'CPU'
                },
                runningMode: 'VIDEO',
                minDetectionConfidence: 0.5
            }
        );
        statusEl.textContent = '✅ Model loaded. Click "Start Camera" to begin.';
    } catch (err) {
        console.error('Failed to load face detector:', err);
        statusEl.textContent = '❌ Failed to load model. Please refresh and try again.';
    }
}

// Start webcam and detection loop
async function startCamera() {
    try {
        statusEl.textContent = 'Requesting camera access...';
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });
        video.srcObject = stream;
        videoWrapper.style.display = 'block';
        startBtn.style.display = 'none';
        statusEl.textContent = 'Camera started. Detecting faces...';

        // Wait for video metadata to set canvas size
        video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            // Start detection loop once video is playing
            video.play();
            detectLoop();
        });
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

// Detection loop using requestAnimationFrame
async function detectLoop() {
    if (!faceDetector || video.paused || video.ended) {
        requestAnimationFrame(detectLoop);
        return;
    }

    try {
        // Only run detection if video time has changed (to avoid duplicate processing)
        if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            const detections = faceDetector.detectForVideo(video, performance.now());

            // Draw video frame onto canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Draw emoji on each detected face
            if (detections.detections && detections.detections.length > 0) {
                detections.detections.forEach(detection => {
                    const bbox = detection.boundingBox;
                    const x = bbox.originX * canvas.width;
                    const y = bbox.originY * canvas.height;
                    const width = bbox.width * canvas.width;
                    const height = bbox.height * canvas.height;

                    const emoji = '😊';
                    const fontSize = height * 0.8;
                    ctx.font = `${fontSize}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'EmojiOne Color', sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(emoji, x + width / 2, y + height / 2);
                });
            }
        }
    } catch (err) {
        console.error('Detection error:', err);
    }

    requestAnimationFrame(detectLoop);
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