'use client';

import { motion } from 'framer-motion';
import { InstantLink } from '../InstantLink';

const buttonBaseClassName =
    'inline-flex items-center justify-center px-8 py-3.5 sm:py-4 text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-200 min-w-[200px]';

export default function HeroActions() {
    return (
        <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <InstantLink
                        href="/studio"
                        className={`${buttonBaseClassName} text-white bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 hover:-translate-y-0.5`}
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
                        className={`${buttonBaseClassName} text-slate-200 bg-white/5 border border-white/20 hover:bg-white/10 hover:text-white backdrop-blur-sm`}
                    >
                        View Sample Report
                    </InstantLink>
                </motion.div>
            </div>
        </div>
    );
}
