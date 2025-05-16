export const config = {
  recording: {
    duration: 30 * 60 * 1000,
    directory: './recordings',
    format: '.wav',
    sampleRate: 44100,
    channels: 1,
    threshold: 0.5,
  },
  
  playback: {
    volume: 80,
    loop: false,
  },
  
  general: {
    maxRecordingsToKeep: 10,
  }
};
