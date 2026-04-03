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
      <div className="absolute inset-0 z-0 bg-white"></div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 z-0 h-64 w-64 -translate-x-20 -translate-y-20 rounded-full bg-amber-100/20"></div>
      <div className="absolute bottom-0 left-0 z-0 h-64 w-64 translate-x-10 translate-y-20 rounded-full bg-amber-100/20"></div>

      <div
        className="scrollbar-hide relative z-10 max-h-[70vh] overflow-y-auto p-6 sm:p-8 md:p-12"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <h2 className="mb-6 text-center text-xl font-bold text-gray-600 sm:mb-8 sm:text-2xl">
          Welcome to{' '}
          {metadata?.auth_web_skillsai?.display_title_info ||
            metadata?.platform_name ||
            'ibl.ai academy'}
        </h2>

        <div className="mb-8 text-center">
          <p className="mx-auto max-w-2xl text-sm text-gray-600 sm:text-base">
            Let's set your learning profile. It will be used to find instructional content
            personalized to your skills and goals. These selected resources, along with our
            AI-driven pedagogical method, will allow you to boost your career and set a successful
            life-long learning experience.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="relative h-48 w-48 sm:h-56 sm:w-56">
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
                className="mx-auto object-contain"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
