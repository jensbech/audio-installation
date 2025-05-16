"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioInstallation = void 0;
const player_1 = require("./audio/player");
const recorder_1 = require("./audio/recorder");
/**
 * Main class for the audio installation that coordinates recording and playback
 */
class AudioInstallation {
    constructor() {
        this.isRunning = false;
        this.recordings = [];
        this.recorder = new recorder_1.AudioRecorder();
        this.player = new player_1.AudioPlayer();
        this.recorder.on('recordingStopped', (filePath) => {
            console.log(`Recording completed: ${filePath}`);
            this.recordings.push(filePath);
        });
        // Listen for playback completion, but we don't need to take any action
        // since each recording manages its own looping
        this.player.on('playbackComplete', (filePath) => {
            console.log(`Playback completed for ${filePath}`);
            // The playFileInLoop method will handle starting playback again
        });
    }
    start() {
        if (this.isRunning) {
            console.log('Installation is already running');
            return;
        }
        console.log('Starting audio installation');
        this.isRunning = true;
        this.startRecordingCycle();
    }
    stop() {
        if (!this.isRunning) {
            console.log('Installation is not running');
            return;
        }
        console.log('Stopping audio installation');
        this.recorder.stopRecording();
        this.player.stop();
        this.isRunning = false;
    }
    async startRecordingCycle() {
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
        }
        catch (error) {
            console.error('Error in recording cycle:', error);
            setTimeout(() => {
                if (this.isRunning) {
                    this.startRecordingCycle();
                }
            }, 5000);
        }
    }
    isInstallationRunning() {
        return this.isRunning;
    }
}
exports.AudioInstallation = AudioInstallation;
