'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { FinalSlideProps } from './types';

export default function FinalSlide({}: FinalSlideProps) {
  return (
    <motion.div
      key="slide5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden"
    >
      {/* Background - plain white */}
      <div className="absolute inset-0 z-0 bg-white"></div>

      {/* Decorative elements - smaller circles */}
      <div className="absolute top-0 right-0 z-0 h-48 w-48 -translate-x-20 -translate-y-20 rounded-full bg-amber-100/20"></div>
      <div className="absolute bottom-0 left-0 z-0 h-56 w-56 translate-x-10 translate-y-20 rounded-full bg-amber-100/20"></div>

      <div
        className="scrollbar-hide relative z-10 max-h-[70vh] overflow-y-auto p-6 sm:p-8 md:p-12"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <h2 className="mb-4 text-center text-xl font-bold text-gray-600 sm:text-2xl">
          Start Boosting Your Skills!
        </h2>
        <p className="mb-6 text-center text-sm text-gray-600 sm:mb-8 sm:text-base">
          Check our content selection or manually add more learning items
        </p>

        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.5,
            type: 'spring',
            stiffness: 200,
            damping: 10,
          }}
          className="relative mx-auto mb-6 flex h-48 w-48 items-center justify-center sm:mb-8 sm:h-56 sm:w-56 md:h-64 md:w-64"
        >
          <div className="relative mx-auto flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48 md:h-56 md:w-56">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/7ed5debe3bafdd92058f422986d2223f-ejd2kaxcEwSANlBrEEywuTSczK0lL0.gif"
              alt="Rocket animation"
              width={280}
              height={280}
              className="mx-auto object-contain"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
