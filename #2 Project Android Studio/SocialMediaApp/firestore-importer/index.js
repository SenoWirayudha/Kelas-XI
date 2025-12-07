const { seedAllData } = require('./seedData');
const { clearAllData } = require('./clearData');

function showHelp() {
  console.log(`
🔥 Firestore Data Importer Tool

Usage:
  node index.js <command>

Commands:
  seed    - Import all sample data to Firestore
  clear   - Clear all data from Firestore
  help    - Show this help message

Examples:
  node index.js seed
  node index.js clear
  
Or use npm scripts:
  npm run seed
  npm run clear
`);
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'seed':
      await seedAllData();
      break;
      
    case 'clear':
      await clearAllData();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      console.log('❌ Unknown command. Use "help" for available commands.');
      showHelp();
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Application error:', error);
    process.exit(1);
  });
}
