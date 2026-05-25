const mongoose = require('mongoose')

// Dev environment ke liye Google DNS resolution
if (process.env.NODE_ENV !== 'production') {
  const dns = require('dns')
  dns.setServers(['8.8.8.8', '8.8.4.4'])
}

const connectDB = async () => {
  // Mongoose ke connection states check karein: 1 = Connected, 2 = Connecting
  if (mongoose.connection.readyState >= 1) {
    console.log("Using existing MongoDB connection")
    return
  }

  try {
    console.log("Creating new MongoDB connection...")
    
    // Vercel par bufferCommands ko true (default) ya hatai dena behtar hai
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000 // 5 seconds mein connect na ho to timeout kare
    })
    
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`)
    // Vercel par process.exit(1) nahi lagana, balki error throw karna hai
    throw error 
  }
}

module.exports = connectDB