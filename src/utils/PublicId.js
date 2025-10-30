const getPublicId = function extractPublicId(url) {
  try {
    // 1️⃣ Split karo 'upload/' ke baad ka part nikalne ke liye
    const parts = url.split('/upload/')[1];

    // 2️⃣ Extension hatao (.mp4, .jpg etc.)
    const withoutExtension = parts.split('.')[0];

    // 3️⃣ Version number (v12345) remove karo
    const publicId = withoutExtension.split('/')[1];

    return publicId;
  } catch (err) {
    console.error("Error extracting public_id:", err);
    return null;
  }
}

export {getPublicId}