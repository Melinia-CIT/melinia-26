import { SystemRestart } from "iconoir-react";
export const Spinner = () => (
    <div className="flex flex-col items-center justify-center gap-4">
        <SystemRestart className="animate-spin text-zinc-500" width={48} height={48} strokeWidth={1.5} />
        <p className="text-zinc-500 animate-pulse">Loading...</p>
    </div>
);

