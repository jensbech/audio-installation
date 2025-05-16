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
        // Set up event listeners
        this.recorder.on('recordingStopped', (filePath) => {
            console.log(`Recording completed: ${filePath}`);
            this.recordings.push(filePath);
        });
        this.player.on('playbackComplete', () => {
            console.log('Playback completed, starting next recording cycle');
            this.startRecordingCycle();
        });
    }
    /**
     * Start the audio installation cycle
     */
    start() {
        if (this.isRunning) {
            console.log('Installation is already running');
            return;
        }
        console.log('Starting audio installation');
        this.isRunning = true;
        this.startRecordingCycle();
    }
    /**
     * Stop the audio installation
     */
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
    /**
     * Start a recording cycle (record for the configured duration, then play back)
     */
    async startRecordingCycle() {
        if (!this.isRunning) {
            return;
        }
        try {
            // Clean up old recordings if needed
            this.recorder.cleanupOldRecordings();
            // Start recording
            console.log('Starting recording cycle');
            const recordingPath = await this.recorder.startRecording();
            // Recording has finished, start playback
            console.log('Recording cycle complete, starting playback');
            await this.player.playFile(recordingPath);
        }
        catch (error) {
            console.error('Error in recording cycle:', error);
            // If there was an error, wait a bit and try again
            setTimeout(() => {
                if (this.isRunning) {
                    this.startRecordingCycle();
                }
            }, 5000);
        }
    }
    /**
     * Check if the installation is currently running
     */
    isInstallationRunning() {
        return this.isRunning;
    }
}
exports.AudioInstallation = AudioInstallation;
