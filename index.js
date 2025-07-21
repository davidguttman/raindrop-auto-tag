const { findMostRecentUntaggedRaindrop } = require('./auto-tag');

// Get timeout from environment variable or default to 60 seconds
const CYCLE_TIMEOUT = parseInt(process.env.CYCLE_TIMEOUT_SECONDS) || 60;

async function autoTagLoop() {
    console.log(`Starting auto-tag loop with ${CYCLE_TIMEOUT} second intervals...`);
    
    async function runCycle() {
        try {
            console.log(`\n--- Starting tag cycle at ${new Date().toLocaleString()} ---`);
            await findMostRecentUntaggedRaindrop();
            console.log(`--- Cycle completed at ${new Date().toLocaleString()} ---`);
        } catch (error) {
            console.error('Error during tag cycle:', error.message);
        }
        
        // Wait for configured timeout before next cycle
        console.log(`\nWaiting ${CYCLE_TIMEOUT} seconds before next cycle...`);
        setTimeout(runCycle, CYCLE_TIMEOUT * 1000);
    }
    
    // Start the first cycle
    runCycle();
}

// Start the auto-loop
autoTagLoop();