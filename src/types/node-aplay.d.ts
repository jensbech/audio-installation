declare module 'node-aplay' {
  class Player {
    constructor(filename: string);
    play(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    on(event: 'complete' | 'error', callback: (err?: Error) => void): this;
  }
  
  export { Player };
}
