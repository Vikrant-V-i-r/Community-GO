// Test the /api/analyze endpoint with the sample image
const fs = require('fs')

async function main() {
  const imageBuffer = fs.readFileSync('/home/z/my-project/public/uploads/sample-streetlight.jpg')
  const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
  console.log('Image size:', imageBuffer.length, 'bytes')
  console.log('Base64 length:', imageBase64.length)
  console.log('Calling /api/analyze...')

  try {
    const res = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    })
    console.log('Status:', res.status)
    const text = await res.text()
    console.log('Response:', text.slice(0, 1000))
  } catch (e) {
    console.error('Error:', e.message)
  }
}

main()
