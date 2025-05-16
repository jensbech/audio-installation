"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const installation_1 = require("./installation");
const process_manager_1 = require("./utils/process-manager");
async function main() {
    console.log('===== AUDIO LAYERING INSTALLATION =====');
    console.log('Starting up...');
    const processManager = new process_manager_1.ProcessManager();
    try {
        const installation = new installation_1.AudioInstallation();
        processManager.onShutdown(() => {
            console.log('Stopping audio installation...');
            installation.stop();
            return Promise.resolve();
        });
        console.log('Launching audio installation...');
        installation.start();
        console.log('Installation is running. Press Ctrl+C to stop.');
    }
    catch (error) {
        console.error('Failed to initialize audio installation:', error);
        process.exit(1);
    }
}
main().catch((error) => {
    console.error('Unhandled error in main process:', error);
    process.exit(1);
});
