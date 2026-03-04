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
      <div className="absolute inset-0 bg-white z-0"></div>

      {/* Decorative elements - smaller circles */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-100/20 rounded-full -translate-x-20 -translate-y-20 z-0"></div>
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-amber-100/20 rounded-full translate-x-10 translate-y-20 z-0"></div>

      <div
        className="relative z-10 p-6 sm:p-8 md:p-12 max-h-[70vh] overflow-y-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-gray-600 text-center mb-4">
          Start Boosting Your Skills!
        </h2>
        <p className="text-gray-600 text-center mb-6 sm:mb-8 text-sm sm:text-base">
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
          className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mb-6 sm:mb-8 flex items-center justify-center mx-auto"
        >
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 flex items-center justify-center mx-auto">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/7ed5debe3bafdd92058f422986d2223f-ejd2kaxcEwSANlBrEEywuTSczK0lL0.gif"
              alt="Rocket animation"
              width={280}
              height={280}
              className="object-contain mx-auto"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
