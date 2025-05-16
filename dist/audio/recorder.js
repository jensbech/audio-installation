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
exports.AudioRecorder = void 0;
const record = __importStar(require("node-record-lpcm16"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("../config");
const events_1 = require("events");
class AudioRecorder extends events_1.EventEmitter {
    constructor() {
        super();
        this.recordingPath = '';
        this.recorder = null;
        this.isRecording = false;
        this.recordingNumber = 1;
        this.ensureDirectoryExists();
    }
    ensureDirectoryExists() {
        if (!fs.existsSync(config_1.config.recording.directory)) {
            fs.mkdirSync(config_1.config.recording.directory, { recursive: true });
        }
    }
    generateFilename() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `recording-${this.recordingNumber}-${timestamp}${config_1.config.recording.format}`;
        this.recordingPath = path.join(config_1.config.recording.directory, filename);
        return this.recordingPath;
    }
    startRecording() {
        if (this.isRecording) {
            return Promise.reject(new Error('Already recording'));
        }
        return new Promise((resolve, reject) => {
            const filename = this.generateFilename();
            console.log(`Starting recording: ${filename}`);
            const fileStream = fs.createWriteStream(filename);
            try {
                this.recorder = record.record({
                    sampleRate: config_1.config.recording.sampleRate,
                    channels: config_1.config.recording.channels,
                    threshold: config_1.config.recording.threshold,
                });
                const stream = this.recorder.stream();
                stream.on('error', (err) => {
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
                }, config_1.config.recording.duration);
            }
            catch (error) {
                console.error('Failed to start recording:', error);
                this.isRecording = false;
                reject(error);
            }
        });
    }
    stopRecording() {
        if (this.isRecording && this.recorder) {
            console.log('Stopping recording');
            this.recorder.stop();
            this.isRecording = false;
            this.emit('recordingStopped', this.recordingPath);
            this.recorder = null;
        }
    }
    cleanupOldRecordings() {
        try {
            const files = fs.readdirSync(config_1.config.recording.directory)
                .filter(file => file.endsWith(config_1.config.recording.format))
                .map(file => ({
                name: file,
                path: path.join(config_1.config.recording.directory, file),
                created: fs.statSync(path.join(config_1.config.recording.directory, file)).birthtime
            }))
                .sort((a, b) => a.created.getTime() - b.created.getTime());
            if (files.length > config_1.config.general.maxRecordingsToKeep) {
                const filesToDelete = files.slice(0, files.length - config_1.config.general.maxRecordingsToKeep);
                filesToDelete.forEach(file => {
                    console.log(`Removing old recording: ${file.name}`);
                    fs.unlinkSync(file.path);
                });
            }
        }
        catch (error) {
            console.error('Error cleaning up old recordings:', error);
        }
    }
}
exports.AudioRecorder = AudioRecorder;
