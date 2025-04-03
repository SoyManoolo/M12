export const errorMessages: Record<string, string> = {
    // Errores de validación:
    "PutDNI": "Inserte un DNI",
    "MissingDNI": "Introduzca el DNI",
    "InvalidDNI": "DNI no válido",
    "MissingPassword": "Introduzca la contraseña",
    "IncorrectPassword": "Contraseña incorrecta",
    "MissingEmail": "Introduzca el email",
    "MissingName": "Introduzca el nombre",
    "MissingSurname": "Introduzca el apellido",
    "NoAdmin": "No tiene permisos de administrador",
    "InvalidIdentifier": "Identificador no válido",

    // Errores de JWT
    "MissingJwtSecret": "La contraseña JWT no está definida",
    "MissingJWT": "No se ha proporcionado un JWT",
    "FormatJWT": "Formato del JWT invalido",
    "InvalidTempToken": "Token temporal inválido",

    //Errores de usuario
    "IncorrectCredentials": "Credenciales incorrectas",
    "UserDontExist": "Usuario no existente",
    "UserNotFound": "Usuario no encontrado",
    "UsersNotFound": "No se encontraron usuarios",
    "MissingIdentifier": "Falta el identificador",
    "UserExist": "El usuario ya existe",
    "NoDataToUpdate": "No hay datos para actualizar",

    //Errores de fichaje
    "RegistryOpen": "Fichaje de entrada ya registrado",
    "RegistryNotOpen": "Fichaje de entrada no registrado",
    "RegistriesNotFound": "No se encontraron registros",

    // Errores de status
    "NotFound": "Recurso no encontrado",
    "InternalServerError": "Error interno del servidor",
    "Unauthorized": "No autorizado",
    "Forbidden": "Prohibido",
    "BadRequest": "Solicitud incorrecta",
    "Conflict": "Conflicto",
    "UnprocessableEntity": "Entidad no procesable",
    "TooManyRequests": "Demasiadas solicitudes",
    "ServiceUnavailable": "Servicio no disponible",
    "GatewayTimeout": "Tiempo de espera de la puerta de enlace agotado",
    "BadGateway": "Puerta de enlace incorrecta",

    // Errores de conexión
    "FailedConnection": "Error al conectar con la base de datos",
}
