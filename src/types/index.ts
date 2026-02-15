// Exportar todos los tipos
export * from './agro';
// Exportar tipos de campania.ts que no conflictúan con agro.ts
// (Campania en agro.ts usa fechaFin, en campania.ts usa fechaFinPrevista/fechaFinReal)
export type {
    Evento,
    EstadoEvento,
    ProductoAplicado as ProductoAplicadoCampania,
    CategoriaCosto,
    CostoBasico,
    Ingreso,
    MargenBruto
} from './campania';
export * from './contabilidad';
export * from './contabilidad-simple';
export * from './organization';
export * from './domain-model';

