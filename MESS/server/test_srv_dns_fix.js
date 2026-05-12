const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Fix for Node.js DNS resolution issues on some networks
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = "mongodb+srv://neelambarkumar966_db_user:N12345678%40sn@cluster0.b6185mr.mongodb.net/?appName=Cluster0";

console.log('Attempting SRV connection with custom DNS servers (8.8.8.8)...');
mongoose.connect(uri)
.then(() => {
    console.log('Successfully connected via SRV!');
    process.exit(0);
})
.catch(err => {
    console.error('SRV connection failed:');
    console.error(err);
    process.exit(1);
});
