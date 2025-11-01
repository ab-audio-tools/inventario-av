"use client";
import { MotionConfig, motion } from "framer-motion";

export default function PageFade({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      transition={{ duration: 0.16, ease: "easeOut" }} // default snappy
      reducedMotion="user"
    >
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
