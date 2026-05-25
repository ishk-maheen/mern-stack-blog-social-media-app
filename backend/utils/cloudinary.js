const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Wraps upload_stream in a Promise so controllers can await it
const uploadToCloudinary = (buffer, resourceType = 'image', folder = 'blog-app') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )
    stream.end(buffer)
  })
}

// Deletes a file from Cloudinary by its public_id
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

module.exports = { uploadToCloudinary, deleteFromCloudinary }
