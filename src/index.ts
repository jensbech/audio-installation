import { AudioInstallation } from './installation';
import { ProcessManager } from './utils/process-manager';


async function main(): Promise<void> {
  console.log('===== AUDIO LAYERING INSTALLATION =====');
  console.log('Starting up...');
  
  const processManager = new ProcessManager();
  
  try {
    const installation = new AudioInstallation();
    
    processManager.onShutdown(() => {
      console.log('Stopping audio installation...');
      installation.stop();
      return Promise.resolve();
    });
    
    console.log('Launching audio installation...');
    installation.start();
    
    console.log('Installation is running. Press Ctrl+C to stop.');
    
  } catch (error) {
    console.error('Failed to initialize audio installation:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error in main process:', error);
  process.exit(1);
});
