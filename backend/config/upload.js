import multer from "multer";
import path from "path";

const storage = multer.diskStorage({

destination: (req, file, cb) => {
cb(null, "uploads/");
},

filename: (req, file, cb) => {

const uniqueName =
Date.now() + "-" + file.originalname;

cb(null, uniqueName);

}

});

const fileFilter = (req, file, cb) => {

const allowedTypes = [
"image/jpeg",
"image/png",
"application/pdf"
];

if (allowedTypes.includes(file.mimetype)) {
cb(null, true);
} else {
cb(new Error("Invalid file type"), false);
}

};

const upload = multer({

storage,
fileFilter,

limits:{
fileSize: 5 * 1024 * 1024
}

});

export default upload;