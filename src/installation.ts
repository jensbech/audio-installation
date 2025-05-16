import { AudioPlayer } from './audio/player';
import { AudioRecorder } from './audio/recorder';
import { config } from './config';

/**
 * Main class for the audio installation that coordinates recording and playback
 */
export class AudioInstallation {
  private recorder: AudioRecorder;
  private player: AudioPlayer;
  private isRunning: boolean = false;
  private recordings: string[] = [];
  
  constructor() {
    this.recorder = new AudioRecorder();
    this.player = new AudioPlayer();
    
    this.recorder.on('recordingStopped', (filePath: string) => {
      console.log(`Recording completed: ${filePath}`);
      this.recordings.push(filePath);
    });
    
    this.player.on('playbackComplete', () => {
      console.log('Playback completed, starting next recording cycle');
      this.startRecordingCycle();
    });
  }
  
  public start(): void {
    if (this.isRunning) {
      console.log('Installation is already running');
      return;
    }
    
    console.log('Starting audio installation');
    this.isRunning = true;
    this.startRecordingCycle();
  }
  
  public stop(): void {
    if (!this.isRunning) {
      console.log('Installation is not running');
      return;
    }
    
    console.log('Stopping audio installation');
    this.recorder.stopRecording();
    this.player.stop();
    this.isRunning = false;
  }
  
  private async startRecordingCycle(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    try {
      this.recorder.cleanupOldRecordings();
      
      console.log('Starting recording cycle');
      const recordingPath = await this.recorder.startRecording();
      
      console.log('Recording cycle complete, starting playback');
      await this.player.playFile(recordingPath);
      
    } catch (error) {
      console.error('Error in recording cycle:', error);
      
      setTimeout(() => {
        if (this.isRunning) {
          this.startRecordingCycle();
        }
      }, 5000);
    }
  }
  
  public isInstallationRunning(): boolean {
    return this.isRunning;
  }
}
