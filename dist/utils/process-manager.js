"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessManager = void 0;
/**
 * Utility for managing process signals and graceful shutdown
 */
class ProcessManager {
    constructor() {
        this.shutdownCallbacks = [];
        this.isShuttingDown = false;
        // Register signal handlers for graceful shutdown
        process.on('SIGINT', this.handleShutdown.bind(this));
        process.on('SIGTERM', this.handleShutdown.bind(this));
        process.on('uncaughtException', (error) => {
            console.error('Uncaught exception:', error);
            this.handleShutdown();
        });
    }
    /**
     * Register a callback to be executed during shutdown
     */
    onShutdown(callback) {
        this.shutdownCallbacks.push(callback);
    }
    /**
     * Handle graceful shutdown of the application
     */
    async handleShutdown() {
        if (this.isShuttingDown) {
            return;
        }
        this.isShuttingDown = true;
        console.log('\nShutting down gracefully...');
        try {
            // Execute all shutdown callbacks in reverse order
            for (let i = this.shutdownCallbacks.length - 1; i >= 0; i--) {
                await this.shutdownCallbacks[i]();
            }
            console.log('Shutdown complete');
        }
        catch (error) {
            console.error('Error during shutdown:', error);
        }
        // Exit with success code
        process.exit(0);
    }
}
exports.ProcessManager = ProcessManager;
