function Footer() {
    return (
        <footer className="relative w-full text-white overflow-hidden">
            {/* Background with filter */}
            <div
                className="absolute inset-0 z-0 scale-105"
                style={{
                    backgroundImage: "url('/footer-bg.jpg')",
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    filter: 'brightness(0.3) contrast(1.1) saturate(0.8)'
                }}
            />

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1">
                        <img
                            src="/melinia-26.png"
                            alt="Melinia 26"
                            className="h-16 mb-6 brightness-200"
                        />
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Experience the convergence of technology and creativity at Melinia '26.
                            The ultimate college fest that pushes boundaries and celebrates innovation.
                        </p>
                        <div className="flex space-x-4">
                            {[
                                { name: 'Instagram', path: 'M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z' },
                                { name: 'Twitter', path: 'M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.59,4 11.64,5.95 11.64,8.35C11.64,8.7 11.67,9.03 11.76,9.36C8.12,9.17 4.91,7.43 2.76,4.79C2.38,5.44 2.16,6.19 2.16,7C2.16,8.5 2.92,9.84 4.08,10.61C3.37,10.59 2.71,10.39 2.13,10.07L2.12,10.12C2.12,12.22 3.61,13.97 5.59,14.37C5.23,14.46 4.85,14.5 4.45,14.5C4.17,14.5 3.89,14.48 3.63,14.43C4.18,16.16 5.79,17.41 7.69,17.45C6.2,18.62 4.33,19.32 2.22,19.32C1.86,19.32 1.51,19.3 1.15,19.26C3.07,20.5 5.36,21.2 7.82,21.2C15.82,21.2 20.2,14.56 20.2,8.81C20.2,8.62 20.2,8.43 20.19,8.24C21.04,7.63 21.78,6.87 22.46,6Z' },
                                { name: 'Facebook', path: 'M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10.003 10.003 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z' },
                                { name: 'LinkedIn', path: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a2.76 2.76 0 0 0-2.76-2.76c-1.12 0-2.06.66-2.48 1.61V10.5h-2.1v7.5h2.1V13.8a1.44 1.44 0 0 1 1.44-1.44c.8 0 1.44.64 1.44 1.44v3.7h2.1M8.1 18h2.1V10.5H8.1V18M9.15 9.12a1.2 1.2 0 1 0-1.2-1.2a1.2 1.2 0 0 0 1.2 1.2Z' }
                            ].map((social) => (
                                <a
                                    key={social.name}
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#E1062C] hover:border-[#E1062C] transition-all duration-300 group"
                                    aria-label={social.name}
                                >
                                    <svg className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                        <path d={social.path} />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-white tracking-wider uppercase">Quick Links</h4>
                        <ul className="space-y-4 text-gray-400">
                            {['About Us', 'Events', 'Schedule', 'Contact'].map((link) => (
                                <li key={link}>
                                    <a href={`#${link.toLowerCase()}`} className="hover:text-[#E1062C] transition-colors duration-200 flex items-center group">
                                        <span className="w-0 group-hover:w-2 h-0.5 bg-[#E1062C] mr-0 group-hover:mr-2 transition-all duration-200" />
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Events Categories */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-white tracking-wider uppercase">Event Categories</h4>
                        <ul className="space-y-4 text-gray-400">
                            {['Technical', 'Non-Technical', 'Gaming', 'Workshops'].map((cat) => (
                                <li key={cat}>
                                    <a href="#" className="hover:text-[#E1062C] transition-colors duration-200 flex items-center group">
                                        <span className="w-0 group-hover:w-2 h-0.5 bg-[#E1062C] mr-0 group-hover:mr-2 transition-all duration-200" />
                                        {cat}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-white tracking-wider uppercase">Contact Us</h4>
                        <div className="space-y-4 text-sm text-gray-400">
                            <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-[#E1062C] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <span>Main Campus, Engineering College Road, City Name, State - 123456</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <svg className="w-5 h-5 text-[#E1062C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                <span>contact@melinia26.dev</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <svg className="w-5 h-5 text-[#E1062C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                <span>+91 98765 43210</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
                    <p>© 2026 Melinia. Organized by the Department of Technology.</p>
                    <div className="flex space-x-6">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-white transition-colors">Developer Credit</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
