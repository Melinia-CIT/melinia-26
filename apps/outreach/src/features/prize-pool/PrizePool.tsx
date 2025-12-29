function PrizePool() {
    return (
        <div
            className="w-full py-20 px-4 relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0F0B13] via-[#0F0B13] to-[#200a26]"
        >
            <div className="px-6 pb-4 md:pb-8 font-bold text-3xl md:text-5xl tracking-wider uppercase text-center">
                Total Prize Pool
            </div>

            <div className="relative z-10 text-center animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-6xl sm:text-7xl md:text-8xl lg:text-[12rem] font-black tracking-tight text-[#050608]">
                    <span className="prize-shadow text-[#E1062C]">₹3,50,000</span>
                </h2>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                    opacity: 0;
                }
                .prize-shadow {
                    text-shadow: 4px 4px 0px #000000;
                    -webkit-text-stroke: 1.5px black;
                }
                @media (min-width: 768px) {
                    .prize-shadow {
                        text-shadow: 10px 10px 0px #000000;
                        -webkit-text-stroke: 3px black;
                    }
                }
            `}</style>
        </div>
    );
}

export default PrizePool;
