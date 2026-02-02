
export default function ReportLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // This simple layout wraps the page but removes the main app shell
    // to provide a clean, print-friendly canvas.
    return (
        <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
            {children}
        </div>
    );
}
