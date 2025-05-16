"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
/**
 * Configuration for the audio installation
 */
exports.config = {
    // Recording settings
    recording: {
        // Duration of each recording in milliseconds (30 minutes)
        duration: 30 * 60 * 1000,
        // Directory to save recordings
        directory: './recordings',
        // File format for recordings
        format: '.wav',
        // Recording parameters
        sampleRate: 44100,
        channels: 1,
        threshold: 0.5,
    },
    // Playback settings
    playback: {
        // Volume level (0-100)
        volume: 80,
        // Whether to loop the playback
        loop: false,
    },
    // General settings
    general: {
        // Maximum number of recordings to keep
        maxRecordingsToKeep: 10,
    }
};
