function Hero() {
    return(
        <>
            <div
                className="bg-blue-200 h-[100dvh] w-full bg-cover bg-center"
                style={{ backgroundImage: "url('/atsv-bg.jpg')" }}
            >
                <img
                    src="melinia-26.png"
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                />
			</div>
        </>
    );
}

export default Hero;
