'use client';

import { motion } from 'framer-motion';
import { InstantLink } from '../InstantLink';

export default function HeroActions() {
    return (
        <div className="flex flex-col items-center justify-center gap-6 pt-0">
            <div className="flex flex-col sm:flex-row items-center gap-5">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <InstantLink
                        href="/studio"
                        className="relative inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white uppercase tracking-wider bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 hover:-translate-y-0.5 transition-all duration-200 min-w-[200px]"
                    >
                        Start Validation
                    </InstantLink>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <InstantLink
                        href="/example-report"
                        className="relative inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-slate-300 uppercase tracking-wider bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-200 min-w-[200px] backdrop-blur-sm"
                    >
                        View Sample Report
                    </InstantLink>
                </motion.div>
            </div>
        </div>
    );
}

