// AppError.ts - Clase personalizada para errores
export class AppError extends Error {
    public status: number;
    public type: string;

    constructor(status: number, type: string) {
        super(type);
        this.status = status;
        this.type = type;
    }
}
