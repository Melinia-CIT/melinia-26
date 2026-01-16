import { SystemRestart } from "iconoir-react";
interface Props{
    h: number,
    w: number;
}

export const Spinner = ({h, w}:Props) => (
    <div className="flex flex-col items-center justify-center gap-4">
        <SystemRestart className="animate-spin text-zinc-500" width={w} height={h} strokeWidth={1.5} />
    </div>
);

