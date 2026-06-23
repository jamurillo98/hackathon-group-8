/**
 * scene/camera-feed.js
 * Handles webcam access via getUserMedia.
 * No dependency on Three.js.
 *
 * Exports:
 *   startCamera(videoElement) -- requests webcam and streams to <video>
 *   stopCamera(videoElement)  -- stops the stream and clears the src
 */

// Keep a reference to the active stream so we can stop it later
let activeStream = null;

/**
 * startCamera(videoElement)
 * Requests getUserMedia with video only (no audio).
 * On success: assigns the stream to the video element and plays it.
 * On failure: shows a graceful placeholder message. Does not throw or alert.
 */
export async function startCamera(videoElement) {
  if (!videoElement) return;

  // Check if getUserMedia is available in this browser
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showFallback(videoElement, 'Camera not supported in this browser.');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    activeStream = stream;
    videoElement.srcObject = stream;
    // Play after the metadata is loaded (avoids autoplay policy issues)
    videoElement.onloadedmetadata = () => videoElement.play();
    // Hide any fallback text and show the video
    videoElement.style.display = 'block';
    const fallback = videoElement.parentElement && videoElement.parentElement.querySelector('.camera-fallback');
    if (fallback) fallback.style.display = 'none';
  } catch (err) {
    // Camera was denied or unavailable -- show placeholder, never crash
    console.warn('Camera unavailable:', err.message);
    showFallback(videoElement, 'Camera unavailable');
    videoElement.style.display = 'none';
  }
}

/**
 * stopCamera(videoElement)
 * Stops all tracks in the active stream and clears the video source.
 */
export function stopCamera(videoElement) {
  if (activeStream) {
    activeStream.getTracks().forEach(track => track.stop());
    activeStream = null;
  }
  if (videoElement) {
    videoElement.srcObject = null;
    videoElement.style.display = 'none';
    // Show the fallback placeholder again when camera is stopped
    const fallback = videoElement.parentElement && videoElement.parentElement.querySelector('.camera-fallback');
    if (fallback) fallback.style.display = 'flex';
  }
}

/**
 * showFallback(videoElement, message)
 * Internal helper: displays the camera fallback div with the given message.
 */
function showFallback(videoElement, message) {
  if (!videoElement || !videoElement.parentElement) return;
  let fallback = videoElement.parentElement.querySelector('.camera-fallback');
  if (fallback) {
    fallback.textContent = message;
    fallback.style.display = 'flex';
  }
}
