import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { config } from '../config';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';

// Conditionally import players based on platform
let Player: any;
let playSound: any;

// For Linux
try {
  Player = require('node-aplay').Player;
} catch (e) {
  // Player will be undefined on macOS
}

// For macOS and other platforms
try {
  playSound = require('play-sound')({});
} catch (e) {
  // playSound will be undefined if module not available
}

/**
 * Class for handling audio playback operations with layering support
 */
export class AudioPlayer extends EventEmitter {
  private activePlayers: Map<string, any> = new Map();
  private platform: string = os.platform();
  private allRecordings: string[] = [];

  /**
   * Get all recordings sorted by creation date (newest first)
   */
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

  /**
   * Play newest recording and maintain a list of all recordings
   */
  public playNewestRecording(): Promise<void> {
    const recordings = this.getRecordings();
    
    if (recordings.length === 0) {
      console.log('No recordings available to play');
      return Promise.resolve();
    }

    // Add recording to our collection if it's not already there
    const newestRecording = recordings[0];
    if (!this.allRecordings.includes(newestRecording)) {
      this.allRecordings.push(newestRecording);
    }

    return this.playFile(newestRecording);
  }

  /**
   * Add a new recording to the layered playback
   */
  public addRecordingToLayeredPlayback(filePath: string): Promise<void> {
    console.log(`Adding recording to layered playback: ${filePath}`);
    
    // Add to our collection if not already there
    if (!this.allRecordings.includes(filePath)) {
      this.allRecordings.push(filePath);
    }
    
    // Start playing this file in a loop
    return this.playFileInLoop(filePath);
  }
  
  /**
   * Play a file in a continuous loop
   */
  private playFileInLoop(filePath: string): Promise<void> {
    return new Promise((resolve) => {
      // We're intentionally not resolving the promise as this should loop forever
      this.playFile(filePath).then(() => {
        // When file finishes playing, if looping is enabled and we're still tracking this file
        if (config.playback.loop && this.allRecordings.includes(filePath)) {
          console.log(`Restarting playback loop for: ${filePath}`);
          this.playFileInLoop(filePath);
        }
      }).catch(err => {
        console.error(`Error in playback loop for ${filePath}:`, err);
        // If there was an error, wait a bit and try again
        setTimeout(() => {
          if (this.allRecordings.includes(filePath)) {
            this.playFileInLoop(filePath);
          }
        }, 1000);
      });
    });
  }

  /**
   * Play all existing recordings in layers
   */
  public playAllRecordingsInLayers(): Promise<void>[] {
    // Ensure we have the latest recordings
    const recordings = this.getRecordings();
    if (recordings.length === 0) {
      console.log('No recordings available to play in layers');
      return [];
    }
    
    // Update our collection with any new recordings
    recordings.forEach(recording => {
      if (!this.allRecordings.includes(recording)) {
        this.allRecordings.push(recording);
      }
    });
    
    console.log(`Playing ${this.allRecordings.length} recordings in layers`);
    
    const promises: Promise<void>[] = [];
    
    // Start each recording in its own loop
    this.allRecordings.forEach(recording => {
      promises.push(this.playFileInLoop(recording));
    });
    
    return promises;
  }

  /**
   * Play a single audio file
   */
  public playFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        reject(new Error(`File not found: ${filePath}`));
        return;
      }

      console.log(`Playing audio file: ${filePath}`);
      
      try {
        if (this.platform === 'linux' && Player) {
          // Linux - use node-aplay
          this.playWithAplay(filePath, resolve, reject);
        } else {
          // macOS or other - use play-sound
          this.playWithPlaySound(filePath, resolve, reject);
        }
      } catch (error) {
        console.error('Failed to start playback:', error);
        reject(error);
      }
    });
  }

  /**
   * Play with aplay on Linux systems
   */
  private playWithAplay(filePath: string, resolve: Function, reject: Function): void {
    try {
      // For aplay, we need to handle looping manually since we're using the JS wrapper
      const player = new Player(filePath);
      this.activePlayers.set(filePath, player);
      
      player.on('complete', () => {
        console.log(`Playback complete: ${filePath}`);
        this.activePlayers.delete(filePath);
        this.emit('playbackComplete', filePath);
        resolve();
      });

      player.on('error', (err?: Error) => {
        console.error(`Playback error for ${filePath}:`, err);
        this.activePlayers.delete(filePath);
        reject(err || new Error('Unknown playback error'));
      });
      
      player.play();
    } catch (error) {
      console.error(`Failed to start aplay playback for ${filePath}:`, error);
      reject(error);
    }
  }

  /**
   * Play with play-sound on macOS and other systems
   */
  private playWithPlaySound(filePath: string, resolve: Function, reject: Function): void {
    try {
      if (playSound) {
        // For macOS, we can pass loop option directly to afplay
        const options: string[] = ['-v', (config.playback.volume / 100).toString()];
        
        const player = playSound.play(filePath, { 'afplay': options }, (err: any) => {
          if (err) {
            console.error(`Playback error for ${filePath}:`, err);
            this.activePlayers.delete(filePath);
            reject(err);
            return;
          }
          
          console.log(`Playback complete: ${filePath}`);
          this.activePlayers.delete(filePath);
          this.emit('playbackComplete', filePath);
          resolve();
        });
        
        if (player) {
          this.activePlayers.set(filePath, player);
        }
      } else {
        // Fallback to native afplay on macOS
        this.playWithNativeCommand(filePath, resolve, reject);
      }
    } catch (error) {
      console.error(`Failed to start play-sound playback for ${filePath}:`, error);
      this.playWithNativeCommand(filePath, resolve, reject);
    }
  }

  /**
   * Fallback player using native commands
   */
  private playWithNativeCommand(filePath: string, resolve: Function, reject: Function): void {
    try {
      let command: string;
      let args: string[];
      
      if (this.platform === 'darwin') {
        // macOS
        command = 'afplay';
        args = [filePath];
      } else if (this.platform === 'linux') {
        // Linux
        command = 'aplay';
        args = [filePath];
      } else {
        throw new Error(`Unsupported platform: ${this.platform}`);
      }
      
      const process = spawn(command, args);
      this.activePlayers.set(filePath, process);
      
      process.on('close', (code) => {
        if (code !== 0) {
          console.error(`Process exited with code ${code}`);
          reject(new Error(`Process exited with code ${code}`));
        } else {
          console.log(`Playback complete: ${filePath}`);
          this.emit('playbackComplete', filePath);
          resolve();
        }
        this.activePlayers.delete(filePath);
      });
      
      process.on('error', (err) => {
        console.error(`Process error: ${err}`);
        this.activePlayers.delete(filePath);
        reject(err);
      });
    } catch (error) {
      console.error(`Failed to start native playback for ${filePath}:`, error);
      reject(error);
    }
  }

  /**
   * Stop all active playbacks
   */
  public stop(): void {
    if (this.activePlayers.size > 0) {
      console.log(`Stopping ${this.activePlayers.size} active playbacks`);
      
      this.activePlayers.forEach((player, filePath) => {
        try {
          if (player.stop) {
            player.stop();
          } else if (player.kill) {
            player.kill();
          }
        } catch (error) {
          console.error(`Error stopping playback for ${filePath}:`, error);
        }
      });
      
      this.activePlayers.clear();
    }
  }

  public getIsPlaying(): boolean {
    return this.activePlayers.size > 0;
  }

  public getPlayingFiles(): string[] {
    return Array.from(this.activePlayers.keys());
  }
}
