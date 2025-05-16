export const config = {
  recording: {
    // 5 seconds
    duration: 5000,
    directory: './recordings',
    format: '.wav',
    sampleRate: 44100,
    channels: 1,
    threshold: 0.5,
  },
  
  playback: {
    volume: 80,
    loop: true,
  },
  
  general: {
    maxRecordingsToKeep: 100,
  }
};
