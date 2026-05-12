const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Node.js DNS resolution issues on some networks
// This resolves the ECONNREFUSED error when using mongodb+srv URIs
try {
	dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
	console.warn('Could not set DNS servers, using default:', err.message);
}

const connectDB = async () => {
	const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mess-erp';
	try {
		await mongoose.connect(uri, {
			family: 4 // Force IPv4 to avoid common connectivity issues
		});
		console.log('Successfully connected to MongoDB');
	} catch (err) {
		console.error('MongoDB connection error details:', err);
		process.exit(1);
	}
};

module.exports = connectDB;
