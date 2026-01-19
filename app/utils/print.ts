/**
 * Utility for printing specific elements by isolating them in an iframe.
 * This avoids layout conflicts with parent containers (flex/grid/scroll-hijacking).
 */
export const printElement = (elementId: string, title: string = 'Report') => {
    // 1. Find the content
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id ${elementId} not found`);
        return;
    }

    // 2. Create invisible iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    // 3. Get iframe document
    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // 4. Copy all styles from the main document (Tailwind, Fonts, etc.)
    // We clone them to ensure the print view looks exactly like the screen view.
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    const headContent = Array.from(styles)
        .map(node => node.cloneNode(true)) 
        .map(node => {
            // Check if it's a DOM node and get outerHTML, or append properly
            const div = document.createElement('div');
            div.appendChild(node);
            return div.innerHTML;
        })
        .join('\n');

    // 5. Construct the iframe content
    iframeDoc.open();
    iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            ${headContent}
            <style>
                /* BASE RESET */
                body {
                    background: white !important;
                    color: black !important;
                    margin: 0;
                    padding: 15mm; /* Default padding for the iframe body */
                    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                }
                
                /* DISABLE ANIMATIONS FOR PRINT */
                *, *::before, *::after {
                    animation-duration: 0s !important;
                    transition-duration: 0s !important;
                    animation-fill-mode: forwards !important;
                }

                /* PRINT SPECIFIC OVERRIDES */
                @media print {
                    @page {
                        margin: 10mm;
                        size: auto;
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .noprint { display: none !important; }
                    
                    /* Force Grid to strict stack */
                    .md\\:grid-cols-2 {
                        grid-template-columns: 1fr !important;
                    }
                    
                    /* Page Break Logic */
                    .break-inside-avoid {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            ${element.outerHTML}
            <script>
                // Wait for resources to load, then print
                window.addEventListener('load', () => {
                   setTimeout(() => {
                       window.focus();
                       window.print();
                       // Cleanup isn't strictly necessary as the iframe is hidden, 
                       // but good practice if we wanted to remove it.
                       // For now we leave it to avoid errors if print dialog is still open.
                   }, 500);
                });
            </script>
        </body>
        </html>
    `);
    iframeDoc.close();
};
