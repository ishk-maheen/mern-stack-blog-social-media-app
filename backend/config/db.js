const mongoose = require('mongoose')

// Local routers sometimes can't resolve MongoDB SRV records — use Google DNS in dev only
if (process.env.NODE_ENV !== 'production') {
  const dns = require('dns')
  dns.setServers(['8.8.8.8', '8.8.4.4'])
}

let isConnected = false

const connectDB = async () => {
  if (isConnected) return

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
    })
    isConnected = true
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
