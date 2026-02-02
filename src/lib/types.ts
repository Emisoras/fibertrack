

export type Odf = {
    id: string;
    name: string;
    capacity: number;
    tipo: 'Odf';
    estado: string;
    fechaCreacion: string;
    address: string;
    latitude: number;
    longitude: number;
    mapPosition?: {
        top: string;
        left: string;
    };
};

export type Mufla = {
    id: string;
    name: string;
    capacity: number;
    tipo: 'Mufla';
    estado: string;
    fechaCreacion: string;
    address: string;
    latitude: number;
    longitude: number;
    mapPosition?: {
        top: string;
        left: string;
    };
};

export type CajaNap = {
    id: string;
    name: string;
    capacity: number;
    tipo: 'CajaNap';
    estado: string;
    fechaCreacion: string;
    address: string;
    latitude: number;
    longitude: number;
    functionType: 'De Paso' | 'Terminal' | 'Terminal (Cliente) + De Paso';
    mapPosition?: {
        top: string;
        left: string;
    };
    inFiberId?: string;
    inFiberThread?: number;
};

export type Splitter = {
    id: string;
    name: string;
    splittingRatio: string;
    muflaId: string;
    capacity: number;
    tipo: 'Splitter';
    estado: string;
    fechaCreacion: string;
    address: string;
    latitude: number;
    longitude: number;
    mapPosition?: {
        top: string;
        left: string;
    };
    inFiberId?: string;
    inFiberThread?: number;
};

export type Fiber = {
    id: string;
    name: string;
    originId: string;
    originType: 'Odf' | 'Mufla' | 'CajaNap' | 'Splitter';
    destinationId: string;
    destinationType: 'Odf' | 'Mufla' | 'CajaNap' | 'Splitter';
    distance: number; // in meters
    threadCount: number;
    type: 'troncal' | 'secundaria';
    estado: 'Activo' | 'Inactivo' | 'Corte';
    fechaCreacion: string;
};

export type OdfPosition = {
    id: string;
    positionNumber: number;
    color: string;
    status: 'Libre' | 'Ocupado' | 'Reservado' | 'Dañado';
    serviceName?: string;
    fiberId?: string; // Composite ID, e.g. FIB-001-H1
    fiberTrunkId?: string;
    fiberThreadNumber?: number;
    destination?: string;
    destinationLabel?: string;
};

export type SplitterOutput = {
    id: string;
    outputNumber: number;
    status: 'Libre' | 'Ocupado' | 'Reservado' | 'Dañado';
    serviceName?: string;
    fiberId?: string;
    fiberTrunkId?: string;
    fiberThreadNumber?: number;
    destination?: string;
    destinationLabel?: string;
};

export type CajaNapPort = {
    id: string;
    portNumber: number;
    status: 'Libre' | 'Ocupado' | 'Reservado' | 'Dañado';
    serviceName?: string;
    outputPower?: number; // in dBm
};

export type MuflaSplice = {
    id: string;
    trayNumber: number;
    spliceNumber: number;
    inFiberId: string;
    inFiberThread: number;
    outFiberId: string;
    outFiberThread: number;
    notes?: string;
};

export type InventoryItem = Odf | Mufla | CajaNap | Splitter;


export type TraceStep = {
    type: 'ODF' | 'Fiber' | 'Mufla' | 'Splitter' | 'Caja NAP' | 'End';
    elementId: string;
    elementName: string;
    details: string;
    status?: string;
};

export type Log = {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    elementId: string;
    elementName: string;
    elementType: string;
    details: string;
};

export type UserProfile = {
    id: string;
    email: string;
    role: 'Admin' | 'Viewer';
    status: 'Activo' | 'Inactivo';
    displayName?: string;
    createdAt: string;
};
