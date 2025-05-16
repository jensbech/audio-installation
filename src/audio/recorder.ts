import * as record from 'node-record-lpcm16';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { EventEmitter } from 'events';

export class AudioRecorder extends EventEmitter {
  private recordingPath: string = '';
  private recorder: record.Recorder | null = null;
  private isRecording: boolean = false;
  private recordingNumber: number = 1;

  constructor() {
    super();
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(config.recording.directory)) {
      fs.mkdirSync(config.recording.directory, { recursive: true });
    }
  }

  private generateFilename(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `recording-${this.recordingNumber}-${timestamp}${config.recording.format}`;
    this.recordingPath = path.join(config.recording.directory, filename);
    return this.recordingPath;
  }

  public startRecording(): Promise<string> {
    if (this.isRecording) {
      return Promise.reject(new Error('Already recording'));
    }

    return new Promise((resolve, reject) => {
      const filename = this.generateFilename();
      console.log(`Starting recording: ${filename}`);
      
      const fileStream = fs.createWriteStream(filename);
      
      try {
        this.recorder = record.record({
          sampleRate: config.recording.sampleRate,
          channels: config.recording.channels,
          threshold: config.recording.threshold,
        });

        const stream = this.recorder.stream();
        stream.on('error', (err: Error) => {
          console.error('Recording error:', err);
          this.stopRecording();
          reject(err);
        });
        stream.pipe(fileStream);
        
        this.isRecording = true;

        // Set a timeout to stop the recording after the specified duration
        setTimeout(() => {
          if (this.isRecording) {
            this.stopRecording();
            this.recordingNumber++;
            resolve(filename);
          }
        }, config.recording.duration);
        
      } catch (error) {
        console.error('Failed to start recording:', error);
        this.isRecording = false;
        reject(error);
      }
    });
  }

  public stopRecording(): void {
    if (this.isRecording && this.recorder) {
      console.log('Stopping recording');
      this.recorder.stop();
      this.isRecording = false;
      this.emit('recordingStopped', this.recordingPath);
      this.recorder = null;
    }
  }

  public cleanupOldRecordings(): void {
    try {
      const files = fs.readdirSync(config.recording.directory)
        .filter(file => file.endsWith(config.recording.format))
        .map(file => ({
          name: file,
          path: path.join(config.recording.directory, file),
          created: fs.statSync(path.join(config.recording.directory, file)).birthtime
        }))
        .sort((a, b) => a.created.getTime() - b.created.getTime());
      
      if (files.length > config.general.maxRecordingsToKeep) {
        const filesToDelete = files.slice(0, files.length - config.general.maxRecordingsToKeep);
        filesToDelete.forEach(file => {
          console.log(`Removing old recording: ${file.name}`);
          fs.unlinkSync(file.path);
        });
      }
    } catch (error) {
      console.error('Error cleaning up old recordings:', error);
    }
  }
}
