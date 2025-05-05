
// Utility for detecting WebGPU support
export class WebGpuDetector {
  // Check if browser supports WebGPU (required for efficient AI processing)
  static async isWebGpuSupported(): Promise<boolean> {
    if ('gpu' in navigator) {
      try {
        const adapter = await (navigator as any).gpu.requestAdapter();
        if (adapter) {
          return true;
        }
      } catch (e) {
        console.warn("WebGPU check failed:", e);
      }
    }
    return false;
  }
}
