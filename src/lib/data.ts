import type { Odf, CajaNap, Mufla, Splitter, Fiber } from './types';
import { Timestamp } from 'firebase/firestore';

export const odfs: Omit<Odf, 'id'>[] = [
  {
    name: 'ODF Central Principal',
    latitude: 4.60971,
    longitude: -74.08175,
    address: 'Calle Falsa 123, Bogotá',
    capacity: 144,
  },
  {
    name: 'ODF Nodo Norte',
    latitude: 4.658333,
    longitude: -74.096944,
    address: 'Avenida Siempre Viva 456',
    capacity: 96,
  },
];

export const cajasNap: Omit<CajaNap, 'id'>[] = [
  {
    name: 'NAP Res. El Parque',
    latitude: 4.624335,
    longitude: -74.063644,
    address: 'Frente a poste 34B',
    capacity: 16,
  },
  {
    name: 'NAP Edif. Los Andes',
    latitude: 4.638333,
    longitude: -74.085,
    address: 'Poste 78A - Calle 45',
    capacity: 32,
  },
  {
    name: 'NAP Centro Comercial',
    latitude: 4.60271,
    longitude: -74.06475,
    address: 'Sotano 2, cuarto de redes',
    capacity: 16,
  },
];

export const mufas: Omit<Mufla, 'id'>[] = [
  {
    name: 'Mufa Troncal 1',
    latitude: 4.61,
    longitude: -74.08,
    address: 'Cerca a ODF Central',
    capacity: 144,
  },
  {
    name: 'Mufa Derivación A',
    latitude: 4.63,
    longitude: -74.07,
    address: 'Esquina Calle 80',
    capacity: 72,
  },
];

export const splitters: Omit<Splitter, 'id'>[] = [
  {
    name: 'Splitter 1 NAP-001',
    latitude: 4.624335,
    longitude: -74.063644,
    address: 'Dentro de NAP Res. El Parque',
    splittingRatio: '1:8',
  },
  {
    name: 'Splitter 2 NAP-001',
    latitude: 4.624335,
    longitude: -74.063644,
    address: 'Dentro de NAP Res. El Parque',
    splittingRatio: '1:8',
  },
];

export const fibers: Omit<Fiber, 'id'>[] = [
  {
    name: 'Fibra 001',
    odfId: 'ODF-001', // Placeholder, will be replaced by actual ID
    muflaId: 'MUF-001', // Placeholder
    cajaNapId: 'NAP-001', // Placeholder
    isActive: true,
    type: 'secundaria',
  },
  {
    name: 'Fibra 002',
    odfId: 'ODF-001', // Placeholder
    muflaId: 'MUF-002', // Placeholder
    cajaNapId: 'NAP-002', // Placeholder
    isActive: false,
    type: 'secundaria',
  },
];
