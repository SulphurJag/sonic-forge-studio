
export class WebGpuDetector {
  private static cachedResult: boolean | null = null;
  
  static async isWebGpuSupported(): Promise<boolean> {
    // Return cached result if available
    if (this.cachedResult !== null) {
      return this.cachedResult;
    }
    
    try {
      // Check if WebGPU is available
      if (!('gpu' in navigator)) {
        console.log("WebGPU not available: navigator.gpu not found");
        this.cachedResult = false;
        return false;
      }
      
      // Try to request an adapter
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (!adapter) {
        console.log("WebGPU not available: no adapter found");
        this.cachedResult = false;
        return false;
      }
      
      // Try to request a device
      const device = await adapter.requestDevice();
      if (!device) {
        console.log("WebGPU not available: no device found");
        this.cachedResult = false;
        return false;
      }
      
      console.log("WebGPU is supported and available");
      this.cachedResult = true;
      return true;
    } catch (error) {
      console.log("WebGPU not available:", error);
      this.cachedResult = false;
      return false;
    }
  }
  
  static clearCache(): void {
    this.cachedResult = null;
  }
}
