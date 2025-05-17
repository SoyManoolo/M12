import multer from 'multer';
import { AppError } from './errors/AppError';

// Tipos de archivos permitidos
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const allowedTypes = ['image/'];

    if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
        cb(null, true);
    } else {
        cb(new AppError(400, "InvalidFileExtension"), false);
    }
};

// Configuración de Multer usando almacenamiento en memoria
const upload = multer({
    storage: multer.memoryStorage(), // Usar almacenamiento en memoria
    fileFilter,
    limits: {
        fileSize: 30 * 1024 * 1024, // 30MB como límite de tamaño
    }
});

export default upload;
