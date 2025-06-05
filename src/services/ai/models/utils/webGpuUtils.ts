
export class WebGpuUtils {
  private static webGpuSupported: boolean | null = null;
  
  /**
   * Check if WebGPU is supported and available
   */
  static async checkSupport(): Promise<boolean> {
    if (this.webGpuSupported !== null) {
      return this.webGpuSupported;
    }
    
    try {
      if (!('gpu' in navigator)) {
        this.webGpuSupported = false;
        return false;
      }
      
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (!adapter) {
        this.webGpuSupported = false;
        return false;
      }
      
      const device = await adapter.requestDevice();
      if (!device) {
        this.webGpuSupported = false;
        return false;
      }
      
      // Clean up
      device.destroy();
      
      this.webGpuSupported = true;
      return true;
    } catch (error) {
      console.warn('WebGPU not supported:', error);
      this.webGpuSupported = false;
      return false;
    }
  }
  
  /**
   * Get WebGPU device info
   */
  static async getDeviceInfo(): Promise<{
    supported: boolean;
    adapterInfo?: any;
    limits?: any;
  }> {
    const supported = await this.checkSupport();
    
    if (!supported) {
      return { supported: false };
    }
    
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      return {
        supported: true,
        adapterInfo: adapter?.info || null,
        limits: adapter?.limits || null
      };
    } catch (error) {
      return { supported: false };
    }
  }
}
