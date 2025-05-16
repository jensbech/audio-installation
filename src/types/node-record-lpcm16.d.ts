declare module 'node-record-lpcm16' {
  interface RecordOptions {
    sampleRate?: number;
    channels?: number;
    threshold?: number;
    device?: string;
    additionalOptions?: string[];
    recordProgram?: string;
    sampleSize?: number;
    silence?: number;
    verbose?: boolean;
  }

  interface Recorder {
    stream(): NodeJS.ReadableStream;
    stop(): void;
  }

  function record(options?: RecordOptions): Recorder;
  
  export { record, RecordOptions, Recorder };
}
