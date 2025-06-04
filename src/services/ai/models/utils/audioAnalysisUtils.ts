
export class AudioAnalysisUtils {
  static analyzeCharacteristics(audioBuffer: AudioBuffer): string[] {
    const audioData = audioBuffer.getChannelData(0);
    const classifications: string[] = [];
    
    let lowEnergyRatio = 0;
    let midEnergyRatio = 0;
    let highEnergyRatio = 0;
    
    const frameSize = 1024;
    for (let i = 0; i < audioData.length - frameSize; i += frameSize) {
      const frame = audioData.slice(i, i + frameSize);
      const energy = frame.reduce((sum, sample) => sum + sample * sample, 0);
      
      if (energy > 0.001) {
        if (i / audioData.length < 0.3) lowEnergyRatio += energy;
        else if (i / audioData.length < 0.7) midEnergyRatio += energy;
        else highEnergyRatio += energy;
      }
    }
    
    const totalEnergy = lowEnergyRatio + midEnergyRatio + highEnergyRatio;
    if (totalEnergy > 0) {
      lowEnergyRatio /= totalEnergy;
      midEnergyRatio /= totalEnergy;
      highEnergyRatio /= totalEnergy;
      
      if (midEnergyRatio > 0.5) classifications.push('speech');
      if (highEnergyRatio > 0.3) classifications.push('music');
      if (lowEnergyRatio > 0.4) classifications.push('bass_heavy');
    }
    
    return classifications.length > 0 ? classifications : ['audio'];
  }
}
