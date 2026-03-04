'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { OnboardingSlideProps } from './types';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { getTenant } from '@/utils/helpers';

export default function WelcomeSlide({}: OnboardingSlideProps) {
  const { metadata } = useTenantMetadata({
    org: getTenant(),
  });
  return (
    <motion.div
      key="slide1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden"
    >
      {/* Background - plain white */}
      <div className="absolute inset-0 bg-white z-0"></div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100/20 rounded-full -translate-x-20 -translate-y-20 z-0"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-100/20 rounded-full translate-x-10 translate-y-20 z-0"></div>

      <div
        className="relative z-10 p-6 sm:p-8 md:p-12 max-h-[70vh] overflow-y-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-gray-600 text-center mb-6 sm:mb-8">
          Welcome to{' '}
          {metadata?.auth_web_skillsai?.display_title_info ||
            metadata?.platform_name ||
            'ibl.ai academy'}
        </h2>

        <div className="text-center mb-8">
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Let's set your learning profile. It will be used to find instructional content
            personalized to your skills and goals. These selected resources, along with our
            AI-driven pedagogical method, will allow you to boost your career and set a successful
            life-long learning experience.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56">
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [0, 2, 0, -2, 0],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: 'loop',
                ease: 'easeInOut',
              }}
            >
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/7ed5debe3bafdd92058f422986d2223f-ejd2kaxcEwSANlBrEEywuTSczK0lL0.gif"
                alt="Rocket animation"
                width={280}
                height={280}
                className="object-contain mx-auto"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
