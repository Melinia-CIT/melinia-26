const Login = () => {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center px-4 py-6 items-center">
            <div className="w-full max-w-md flex flex-col items-center">
                <div
                    className=" w-full h-36 sm:h-40 rounded-2xl bg-[image:url('/melinia-alt.jpg')] bg-cover bg-center mb-10"
                />

                <div className="w-full flex flex-col items-center gap-4">
                    <input
                        type="text"
                        placeholder="Email"
                        className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                    />

                    <button
                        className="w-full rounded-lg bg-white py-2 text-zinc-900 font-semibold hover:bg-zinc-200 transition"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    )
};

export default Login;
