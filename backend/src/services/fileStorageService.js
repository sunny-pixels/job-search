const fs = require("fs");
const path = require("path");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const saveFile = async (fileBuffer, originalName) => {
  const timestamp = Date.now();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `${timestamp}_${sanitizedName}`;
  const filePath = path.join(uploadsDir, fileName);
  
  // Determine file type
  const ext = path.extname(originalName).toLowerCase();
  const fileType = ext === '.docx' ? 'docx' : 'pdf';
  
  await fs.promises.writeFile(filePath, fileBuffer);
  
  console.log(`✅ [FileStorage] Saved ${fileType.toUpperCase()} file:`, fileName);
  
  return {
    fileUrl: `/uploads/${fileName}`,
    fileName: originalName,
    fileType,
    savedFileName: fileName
  };
};

module.exports = { saveFile };
