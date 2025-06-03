
// WebGPU detection utility
export class WebGpuDetector {
  private static cachedResult: boolean | null = null;
  
  // Check if WebGPU is supported in the current browser
  static async isWebGpuSupported(): Promise<boolean> {
    // Return cached result if available
    if (WebGpuDetector.cachedResult !== null) {
      return WebGpuDetector.cachedResult;
    }
    
    try {
      // Check if navigator.gpu exists
      if (!('gpu' in navigator)) {
        console.log('WebGPU not supported: navigator.gpu not available');
        WebGpuDetector.cachedResult = false;
        return false;
      }
      
      // Try to request an adapter
      const adapter = await (navigator as any).gpu.requestAdapter();
      
      if (!adapter) {
        console.log('WebGPU not supported: no adapter available');
        WebGpuDetector.cachedResult = false;
        return false;
      }
      
      // Try to request a device
      const device = await adapter.requestDevice();
      
      if (!device) {
        console.log('WebGPU not supported: no device available');
        WebGpuDetector.cachedResult = false;
        return false;
      }
      
      console.log('WebGPU is supported and available');
      WebGpuDetector.cachedResult = true;
      return true;
    } catch (error) {
      console.log('WebGPU not supported:', error);
      WebGpuDetector.cachedResult = false;
      return false;
    }
  }
  
  // Get WebGPU adapter info if available
  static async getAdapterInfo(): Promise<any> {
    try {
      if (!('gpu' in navigator)) {
        return null;
      }
      
      const adapter = await (navigator as any).gpu.requestAdapter();
      return adapter ? adapter.info : null;
    } catch (error) {
      console.error('Error getting WebGPU adapter info:', error);
      return null;
    }
  }
}
