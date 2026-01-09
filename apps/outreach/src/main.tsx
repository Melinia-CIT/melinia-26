import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast';


const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
            <Toaster
                position="top-center"
                reverseOrder={false}

                containerClassName="
                    fixed 
                    z-50 
                    flex 
                    flex-col 
                    items-center 
                    gap-3 
                    transition-all 
                    font-geist
                "

                toastOptions={{
                    duration: 5000,
                    style: {
                        background: 'rgba(24, 24, 27, 0.85)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        color: '#fafafa',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        fontSize: '15px',
                        width: '100%',
                        maxWidth: '400px',
                    },
                    success: {
                        iconTheme: {
                            primary: '#4ade80',
                            secondary: '#18181b',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#f87171',
                            secondary: '#18181b',
                        },
                    },
                }}
            />
        </QueryClientProvider>
    </StrictMode>
);