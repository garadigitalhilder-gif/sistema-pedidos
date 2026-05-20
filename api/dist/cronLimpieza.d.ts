/**
 * Realiza la purga física de registros antiguos y eliminados lógicamente
 * para no exceder los límites del plan gratuito de la base de datos.
 */
export declare function ejecutarLimpiezaHistorial(): Promise<void>;
/**
 * Configura la tarea programada para ejecutarse inmediatamente al arrancar la API
 * y posteriormente cada 24 horas.
 */
export declare function inicializarCronLimpieza(): void;
