import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';

function PrizePool() {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));

    useEffect(() => {
        const controls = animate(count, 120000, {
            duration: 2.5,
            ease: "easeOut",
        });

        return controls.stop;
    }, [count]);

    // Format number with Indian numbering system (₹1,20,000)
    const formatIndianNumber = (num: number) => {
        const numStr = num.toString();
        const lastThree = numStr.substring(numStr.length - 3);
        const otherNumbers = numStr.substring(0, numStr.length - 3);
        
        if (otherNumbers !== '') {
            return '₹' + otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
        } else {
            return '₹' + lastThree;
        }
    };

    return (
        <div
            className="w-full py-20 px-4 relative flex flex-col items-center justify-center overflow-hidden"
        >
            <motion.div 
                className="px-6 pb-4 md:pb-8 font-bold text-3xl md:text-5xl tracking-wider uppercase text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-[#5227FF]"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                Total Prize Pool
            </motion.div>

            <motion.div 
                className="relative z-10 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
                <h2 className="text-6xl sm:text-7xl md:text-8xl lg:text-[12rem] font-black tracking-tight text-[#050608]">
                    <motion.span className="prize-shadow text-[#E1062C]">
                        {useTransform(rounded, formatIndianNumber)}
                    </motion.span>
                </h2>
            </motion.div>

            <style>{`
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
