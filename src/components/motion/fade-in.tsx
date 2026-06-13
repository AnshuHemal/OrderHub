"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const directionMap = {
  up:    { y: 16, x: 0 },
  down:  { y: -16, x: 0 },
  left:  { y: 0, x: 16 },
  right: { y: 0, x: -16 },
  none:  { y: 0, x: 0 },
};

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: keyof typeof directionMap;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.4,
  direction = "up",
}: FadeInProps) {
  const { x, y } = directionMap[direction];

  return (
    <motion.div
      initial={{ opacity: 0, x, y }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
