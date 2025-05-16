import * as fs from 'fs';
import * as path from 'path';
import { Player } from 'node-aplay';
import { config } from '../config';
import { EventEmitter } from 'events';

/**
 * Class for handling audio playback operations
 */
export class AudioPlayer extends EventEmitter {
  private player: Player | null = null;
  private isPlaying: boolean = false;
  private playingFile: string | null = null;

  public getRecordings(): string[] {
    try {
      if (!fs.existsSync(config.recording.directory)) {
        return [];
      }

      const files = fs.readdirSync(config.recording.directory)
        .filter(file => file.endsWith(config.recording.format))
        .map(file => ({
          name: file,
          path: path.join(config.recording.directory, file),
          created: fs.statSync(path.join(config.recording.directory, file)).birthtime
        }))
        .sort((a, b) => b.created.getTime() - a.created.getTime())
        .map(file => file.path);

      return files;
    } catch (error) {
      console.error('Error fetching recordings:', error);
      return [];
    }
  }

  public playNewestRecording(): Promise<void> {
    const recordings = this.getRecordings();
    
    if (recordings.length === 0) {
      console.log('No recordings available to play');
      return Promise.resolve();
    }

    return this.playFile(recordings[0]);
  }

  public playFile(filePath: string): Promise<void> {
    if (this.isPlaying) {
      this.stop();
    }

    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        reject(new Error(`File not found: ${filePath}`));
        return;
      }

      console.log(`Playing audio file: ${filePath}`);
      
      try {
        this.player = new Player(filePath);
        this.isPlaying = true;
        this.playingFile = filePath;

        this.player.on('complete', () => {
          console.log('Playback complete');
          this.isPlaying = false;
          this.playingFile = null;
          this.emit('playbackComplete', filePath);
          resolve();
        });

        this.player.on('error', (err?: Error) => {
          console.error('Playback error:', err);
          this.isPlaying = false;
          this.playingFile = null;
          reject(err || new Error('Unknown playback error'));
        });
        
        this.player.play();
        
      } catch (error) {
        console.error('Failed to start playback:', error);
        this.isPlaying = false;
        reject(error);
      }
    });
  }

  public stop(): void {
    if (this.isPlaying && this.player) {
      console.log('Stopping playback');
      this.player.stop();
      this.isPlaying = false;
      this.playingFile = null;
      this.player = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getPlayingFile(): string | null {
    return this.playingFile;
  }
}
