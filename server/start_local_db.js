const { MongoMemoryReplSet } = require('mongodb-memory-server');

async function main() {
  console.log('Starting MongoDB Replica Set on port 27017...');
  try {
    const replSet = await MongoMemoryReplSet.create({
      replSet: {
        name: 'rs0',
        count: 1,
        storageEngine: 'wiredTiger',
      },
      instanceOpts: [
        {
          port: 27017,
          dbName: 'borrowbox',
        },
      ],
    });

    const uri = replSet.getUri('borrowbox');
    console.log('MongoDB Replica Set running!');
    console.log('ReplSet URI:', uri);
    console.log('Server is ready for connections on port 27017.');

    // Keep process alive
    process.on('SIGINT', async () => {
      console.log('Stopping replSet...');
      await replSet.stop();
      process.exit(0);
    });
  } catch (err) {
    console.error('Failed to start MongoDB Replica Set:', err);
    process.exit(1);
  }
}

main();
