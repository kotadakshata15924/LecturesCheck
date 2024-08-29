const express = require("express");
const app = express();
const mongoose = require("mongoose");
const fs = require("fs").promises;
const PDFParser = require("pdf-parse");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

app.use(express.json());
app.use(cors());
app.use("/files", express.static("files"));

// MongoDB connection
const mongoUrl = "mongodb+srv://sashakt:d123456@cluster0.veqvypu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to database");
}).catch((e) => console.log(e));

// Multer setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./files");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

// Schema and model setup
const PdfSchema = new mongoose.Schema({
    title: String,
    pdf: String,
    text: String, // Add a field for storing extracted text
});

const PdfDetails = mongoose.model("PdfDetails", PdfSchema);

app.post("/upload-files", upload.single("file"), async (req, res) => {
    const { title } = req.body;
    const fileName = req.file.filename;
    try {
        const filePath = `./files/${fileName}`;
        const dataBuffer = await fs.readFile(filePath);
        const pdfData = await PDFParser(dataBuffer);
        const text = pdfData.text;
        
        await PdfDetails.create({ title, pdf: fileName, text }); // Save text along with title and filename
        res.json({ status: "ok" });
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ status: "error", message: "Failed to upload file" });
    }
});

app.get("/get-files", async (req, res) => {
    try {
        const pdfs = await PdfDetails.find({});
        res.json({ status: "ok", data: pdfs });
    } catch (error) {
        console.error("Error fetching files:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch files" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});