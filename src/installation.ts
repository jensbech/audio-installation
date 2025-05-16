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
    
    // Listen for playback completion, but we don't need to take any action
    // since each recording manages its own looping
    this.player.on('playbackComplete', (filePath: string) => {
      console.log(`Playback completed for ${filePath}`);
      // The playFileInLoop method will handle starting playback again
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
      
      console.log('Recording cycle complete, adding to layered playback');
      // Add the new recording to the playback swarm
      this.player.addRecordingToLayeredPlayback(recordingPath);
      
      // Schedule the next recording cycle immediately
      setTimeout(() => {
        if (this.isRunning) {
          this.startRecordingCycle();
        }
      }, 0);
      
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
