"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioPlayer = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const node_aplay_1 = require("node-aplay");
const config_1 = require("../config");
const events_1 = require("events");
/**
 * Class for handling audio playback operations
 */
class AudioPlayer extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.player = null;
        this.isPlaying = false;
        this.playingFile = null;
    }
    /**
     * Get a list of all recordings sorted by creation time (newest first)
     */
    getRecordings() {
        try {
            if (!fs.existsSync(config_1.config.recording.directory)) {
                return [];
            }
            const files = fs.readdirSync(config_1.config.recording.directory)
                .filter(file => file.endsWith(config_1.config.recording.format))
                .map(file => ({
                name: file,
                path: path.join(config_1.config.recording.directory, file),
                created: fs.statSync(path.join(config_1.config.recording.directory, file)).birthtime
            }))
                .sort((a, b) => b.created.getTime() - a.created.getTime()) // Sort newest first
                .map(file => file.path);
            return files;
        }
        catch (error) {
            console.error('Error fetching recordings:', error);
            return [];
        }
    }
    /**
     * Play the newest recording
     */
    playNewestRecording() {
        const recordings = this.getRecordings();
        if (recordings.length === 0) {
            console.log('No recordings available to play');
            return Promise.resolve();
        }
        return this.playFile(recordings[0]);
    }
    /**
     * Play a specific audio file
     */
    playFile(filePath) {
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
                this.player = new node_aplay_1.Player(filePath);
                this.isPlaying = true;
                this.playingFile = filePath;
                this.player.on('complete', () => {
                    console.log('Playback complete');
                    this.isPlaying = false;
                    this.playingFile = null;
                    this.emit('playbackComplete', filePath);
                    resolve();
                });
                this.player.on('error', (err) => {
                    console.error('Playback error:', err);
                    this.isPlaying = false;
                    this.playingFile = null;
                    reject(err || new Error('Unknown playback error'));
                });
                // Start playback
                this.player.play();
            }
            catch (error) {
                console.error('Failed to start playback:', error);
                this.isPlaying = false;
                reject(error);
            }
        });
    }
    /**
     * Stop the current playback
     */
    stop() {
        if (this.isPlaying && this.player) {
            console.log('Stopping playback');
            this.player.stop();
            this.isPlaying = false;
            this.playingFile = null;
            this.player = null;
        }
    }
    /**
     * Check if audio is currently playing
     */
    getIsPlaying() {
        return this.isPlaying;
    }
    /**
     * Get the path of the currently playing file
     */
    getPlayingFile() {
        return this.playingFile;
    }
}
exports.AudioPlayer = AudioPlayer;
