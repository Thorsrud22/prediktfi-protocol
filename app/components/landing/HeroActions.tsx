'use client';

import { motion } from 'framer-motion';
import { InstantLink } from '../InstantLink';

export default function HeroActions() {
    return (
        <div className="flex flex-col items-center justify-center gap-6 pt-10">
            <div className="flex flex-col sm:flex-row items-center gap-5">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <InstantLink
                        href="/studio"
                        className="btn-premium btn-premium-primary min-w-[240px] text-sm shadow-[0_0_20px_rgba(59,130,246,0.5)]"
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
                        className="btn-premium btn-premium-secondary min-w-[240px] text-sm"
                    >
                        View Sample Report
                    </InstantLink>
                </motion.div>
            </div>
        </div>
    );
}

