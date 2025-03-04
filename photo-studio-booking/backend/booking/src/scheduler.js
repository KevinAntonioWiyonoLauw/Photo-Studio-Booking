// src/scheduler.js
import pool from './config/db.js';

const generateDailySlots = async () => {
  try {
    // Your slot generation code here
    // Get all active studios
    const studios = await pool.query('SELECT * FROM studios WHERE active = true');
    
    // Rest of your code...
  } catch (error) {
    console.error('Error in scheduled slot generation:', error);
  }
};

export const startScheduler = () => {
  // Calculate milliseconds until midnight tonight
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight - now;
  
  console.log(`Scheduler will run in ${Math.floor(msUntilMidnight/1000/60)} minutes`);
  
  // Run immediately once
  generateDailySlots();
  
  // Schedule for midnight
  setTimeout(() => {
    generateDailySlots();
    
    // Then schedule to run every 24 hours
    setInterval(generateDailySlots, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
  
  console.log('Slot scheduler started - will generate slots daily at midnight');
};