import multer from 'multer';
import { AppError } from './errors/AppError';
import path from 'path';
import fs from 'fs';

// Guarda la ruta de la carpeta media y las subcarpetas images y videos
const uploadDir = path.join(process.cwd(), 'media');
const imageDir = path.join(uploadDir, 'images');
const videoDir = path.join(uploadDir, 'videos');

// Crear directorios si no existen
[uploadDir, imageDir, videoDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determinar si es imagen o video
    if (file.mimetype.startsWith('images/')) {
      cb(null, imageDir);
    } else if (file.mimetype.startsWith('videos/')) {
      cb(null, videoDir);
    } else {
      cb(new Error('Tipo de archivo no soportado'), '');
    }
  },
  filename: (req, file, cb) => {
    // Patrón común para nombres únicos:
    // [fieldname]-[timestamp]-[numerorandom].[extension]
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

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
