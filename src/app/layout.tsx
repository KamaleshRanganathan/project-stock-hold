import type {Metadata} from 'next';
import './globals.css';

export const metadata : Metadata = {
    title: 'Project Stock Hold',
    description: 'A dynamic stock management system made for interview purposes.',
}

export default function RootLayout({children,}:{children :React.ReactNode;}){
    return (
        <html lang='en'>
            <body>{children}</body>
        </html>
    )
}