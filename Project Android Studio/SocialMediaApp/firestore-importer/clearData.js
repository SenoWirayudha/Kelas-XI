const { db } = require('./firebase-config');

async function clearCollection(collectionName) {
  console.log(`🔄 Clearing ${collectionName} collection...`);
  
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    console.log(`   • ${collectionName} collection is already empty`);
    return 0;
  }
  
  const batch = db.batch();
  let count = 0;
  
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
    count++;
  });
  
  await batch.commit();
  console.log(`✅ Cleared ${count} documents from ${collectionName}`);
  return count;
}

async function clearAllData() {
  try {
    console.log('🗑️  Starting data clearing process...\n');
    
    const collections = ['users', 'posts', 'stories', 'notifications'];
    let totalDeleted = 0;
    
    for (const collection of collections) {
      const deleted = await clearCollection(collection);
      totalDeleted += deleted;
    }
    
    console.log('\n🎯 Data clearing completed!');
    console.log(`📊 Total documents deleted: ${totalDeleted}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  clearAllData();
}

module.exports = {
  clearCollection,
  clearAllData
};
