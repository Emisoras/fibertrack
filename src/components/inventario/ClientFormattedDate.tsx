'use client';

import { useState, useEffect } from 'react';

export function ClientFormattedDate({ dateString }: { dateString: string }) {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after hydration, to get the
    // locale-specific date format.
    setFormattedDate(new Date(dateString).toLocaleDateString());
  }, [dateString]);

  // Return null on the server and initial client render to avoid a mismatch.
  // The formatted date will appear after the component mounts on the client.
  return <>{formattedDate}</>;
}
