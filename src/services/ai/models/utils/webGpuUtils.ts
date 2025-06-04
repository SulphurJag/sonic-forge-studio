
export class WebGpuUtils {
  static async checkSupport(): Promise<boolean> {
    try {
      if (!('gpu' in navigator)) return false;
      const adapter = await (navigator as any).gpu?.requestAdapter();
      return !!adapter;
    } catch {
      return false;
    }
  }
}
