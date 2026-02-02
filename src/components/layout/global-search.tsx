'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirebase } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Search, LoaderCircle, Network, Box, Spline, Split, GitBranch, Terminal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import type { Odf, CajaNap, Mufla, Splitter, Fiber, OdfPosition, CajaNapPort, SplitterOutput, InventoryItem } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';

type ResultItem = {
    id: string;
    name: string;
    path: string;
    type: 'ODF' | 'Caja NAP' | 'Mufla' | 'Splitter' | 'Fibra' | 'Posición' | 'Puerto' | 'Salida';
    description: string;
    icon: React.ReactNode;
}

const getElementIcon = (type: ResultItem['type']) => {
    switch(type) {
        case 'ODF': return <Network className="mr-2 h-4 w-4 text-blue-500" />;
        case 'Caja NAP': return <Box className="mr-2 h-4 w-4 text-green-500" />;
        case 'Mufla': return <Spline className="mr-2 h-4 w-4 text-yellow-500" />;
        case 'Splitter': return <Split className="mr-2 h-4 w-4 text-purple-500" />;
        case 'Fibra': return <GitBranch className="mr-2 h-4 w-4 text-gray-500" />;
        default: return <Terminal className="mr-2 h-4 w-4 text-gray-400" />;
    }
}

const typeDisplayNames: {[key: string]: ResultItem['type']} = {
    'Odf': 'ODF',
    'CajaNap': 'Caja NAP',
    'Mufla': 'Mufla',
    'Splitter': 'Splitter',
};

export function GlobalSearch() {
    const { firestore } = useFirebase();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [searchableData, setSearchableData] = useState<ResultItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [open, setOpen] = useState(false);
    
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    useEffect(() => {
        const fetchData = async () => {
            if (!firestore) return;
            setIsLoading(true);
            try {
                const results: ResultItem[] = [];
                const collections: {name: string, type: InventoryItem['tipo']}[] = [
                    { name: 'odfs', type: 'Odf' },
                    { name: 'muflas', type: 'Mufla' },
                    { name: 'cajas_nap', type: 'CajaNap' },
                    { name: 'splitters', type: 'Splitter' },
                ];
                
                const topLevelPromises = collections.map(async (col) => {
                    const snap = await getDocs(collection(firestore, col.name));
                    snap.forEach(doc => {
                        const item = doc.data() as any;
                        const typeName = typeDisplayNames[item.tipo] || item.tipo;
                        results.push({
                            id: doc.id,
                            name: item.name,
                            path: `/dashboard/inventario/${col.name}/${doc.id}`,
                            type: typeName,
                            description: item.address,
                            icon: getElementIcon(typeName),
                        });
                    });
                });
                
                const fibersPromise = getDocs(collection(firestore, 'fibers')).then(snap => {
                    snap.forEach(doc => {
                         const item = doc.data() as Fiber;
                         results.push({
                            id: doc.id,
                            name: item.name,
                            path: '/dashboard/inventario/fibras',
                            type: 'Fibra',
                            description: `De ${item.originType} a ${item.destinationType}`,
                            icon: getElementIcon('Fibra'),
                        });
                    });
                });

                await Promise.all([...topLevelPromises, fibersPromise]);
                
                const subCollectionPromises = [];

                // ODF Positions
                subCollectionPromises.push(getDocs(collection(firestore, 'odfs')).then(snap => {
                    return Promise.all(snap.docs.map(async (doc) => {
                        const posSnap = await getDocs(collection(doc.ref, 'positions'));
                        posSnap.forEach(posDoc => {
                            const pos = posDoc.data() as OdfPosition;
                            if (pos.serviceName) {
                                results.push({
                                    id: posDoc.id,
                                    name: pos.serviceName,
                                    path: `/dashboard/inventario/odf/${doc.id}`,
                                    type: 'Posición',
                                    description: `${doc.data().name} - Posición ${pos.positionNumber}`,
                                    icon: getElementIcon('Posición'),
                                });
                            }
                        });
                    }));
                }));

                // Caja NAP Ports
                 subCollectionPromises.push(getDocs(collection(firestore, 'cajas_nap')).then(snap => {
                    return Promise.all(snap.docs.map(async (doc) => {
                        const portSnap = await getDocs(collection(doc.ref, 'ports'));
                        portSnap.forEach(portDoc => {
                            const port = portDoc.data() as CajaNapPort;
                            if (port.serviceName) {
                                results.push({
                                    id: portDoc.id,
                                    name: port.serviceName,
                                    path: `/dashboard/inventario/caja-nap/${doc.id}`,
                                    type: 'Puerto',
                                    description: `${doc.data().name} - Puerto ${port.portNumber}`,
                                    icon: getElementIcon('Puerto'),
                                });
                            }
                        });
                    }));
                }));

                 // Splitter Outputs
                 subCollectionPromises.push(getDocs(collection(firestore, 'splitters')).then(snap => {
                    return Promise.all(snap.docs.map(async (doc) => {
                        const outSnap = await getDocs(collection(doc.ref, 'outputs'));
                        outSnap.forEach(outDoc => {
                            const output = outDoc.data() as SplitterOutput;
                            if (output.serviceName) {
                                results.push({
                                    id: outDoc.id,
                                    name: output.serviceName,
                                    path: `/dashboard/inventario/splitter/${doc.id}`,
                                    type: 'Salida',
                                    description: `${doc.data().name} - Salida ${output.outputNumber}`,
                                    icon: getElementIcon('Salida'),
                                });
                            }
                        });
                    }));
                }));

                await Promise.all(subCollectionPromises);

                setSearchableData(results);
            } catch (error) {
                console.error("Error fetching global search data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [firestore]);
    
    const searchResults = useMemo(() => {
        if (!debouncedSearchQuery) return [];
        const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
        
        const filtered = searchableData.filter(item => 
            item.name.toLowerCase().includes(lowerCaseQuery) ||
            item.description.toLowerCase().includes(lowerCaseQuery) ||
            item.id.toLowerCase().includes(lowerCaseQuery)
        );

        // Group results
        const grouped = filtered.reduce((acc, item) => {
            const key = item.type;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(item);
            return acc;
        }, {} as Record<string, ResultItem[]>);

        return Object.entries(grouped);

    }, [debouncedSearchQuery, searchableData]);

    const handleSelect = (path: string) => {
        router.push(path);
        setOpen(false);
        setSearchQuery('');
    };
    
    return (
        <div className="relative">
             <form onSubmit={(e) => e.preventDefault()}>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <div className="relative w-full">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar en la red..."
                                className="w-full appearance-none bg-background pl-8 shadow-none md:w-[350px] lg:w-[450px]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.length > 0 && setOpen(true)}
                            />
                            </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] md:w-[500px] p-0" align="start">
                        <Command>
                            <CommandList>
                            {(isLoading && debouncedSearchQuery) && (
                                    <div className="p-4 flex items-center justify-center text-sm text-muted-foreground">
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        Cargando...
                                    </div>
                                )}
                            {!isLoading && searchResults.length === 0 && debouncedSearchQuery ? (
                                    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                ) : (
                                    searchResults.map(([groupName, items]) => (
                                        <CommandGroup key={groupName} heading={groupName}>
                                            {items.map(item => (
                                                <CommandItem
                                                    key={item.id}
                                                    onSelect={() => handleSelect(item.path)}
                                                    value={`${item.name}-${item.id}`}
                                                    className="cursor-pointer"
                                                >
                                                        {item.icon}
                                                        <div className="flex flex-col ml-2">
                                                            <span>{item.name}</span>
                                                            <span className="text-xs text-muted-foreground">{item.description}</span>
                                                        </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    ))
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </form>
        </div>
    )
}
