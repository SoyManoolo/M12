import multer from 'multer';
import { AppError } from './errors/AppError';

const storage = multer.diskStorage({});

// Tipos de archivos permitidos
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = ['image/', 'video/'];

  if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
    cb(null, true);
  } else {
    cb(new AppError(400, "InvalidFileExtension"), false);
  }
};

// Configuración de Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB como límite de tamaño
  }
});

export default upload;
