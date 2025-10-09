/**
 * Get local media stream without attaching to any peer
 * @param {Object} constraints - Media constraints
 * @returns {Promise<MediaStream>} The local media stream
 */
export async function getLocalMedia(constraints = { audio: true, video: false }) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("✅ Local media acquired");
    return stream;
  } catch (err) {
    console.error("❌ Failed to get local media:", err);
    throw err;
  }
}
/**
 * Stop and cleanup a MediaStream acquired from getLocalMedia
 * @param {MediaStream} stream - The MediaStream to stop
 */
export function cleanupLocalStream(stream) {
  if (!stream) return;

  stream.getTracks().forEach(track => track.stop());
  console.log("🧹 Local media tracks stopped (stream cleanup)");
}