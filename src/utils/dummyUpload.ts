import multer from 'multer';
import { v4 as uuidv4 } from "uuid";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const fileName = `${uuidv4()}-${file.originalname}`;

    cb(null, fileName);
  }
});

const dummyUpload = multer({ storage });

export default dummyUpload;
