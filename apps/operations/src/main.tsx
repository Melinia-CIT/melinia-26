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
                position="top-right"
                toastOptions={{
                    style: {
                        background: "#18181b",
                        color: "#fafafa",
                        border: "2px solid #2E2E32"
                    },
                }}
            />
        </QueryClientProvider>
    </StrictMode>
);
