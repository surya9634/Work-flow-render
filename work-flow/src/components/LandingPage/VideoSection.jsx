import React, { useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";

const VideoSection = () => {
  const videoRef = useRef(null);
  const sectionRef = useRef(null);

  // Trigger only when 80% of the section is in view
  const isInView = useInView(sectionRef, {
    amount: 0.1, // equivalent to 80%
    once: true,
  });

  useEffect(() => {
    if (isInView && videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay failed:", err);
      });
    }
  }, [isInView]);

  return (
    <div className="overflow-hidden">
      <motion.section
        ref={sectionRef}
        initial={{ y: 200, opacity: 0, rotateX: 60 }}
        animate={isInView ? { y: 0, opacity: 1, rotateX: 0 } : {}}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="h-screen bg-black flex items-center justify-center"
      >
        {/* aspect-vide class is removed for the photo input */}
        <div className="w-[100%]  max-w-4xl border border-white rounded-xl overflow-hidden shadow-[0_0_60px_rgba(255,255,255,0.5)] transition duration-500">
          {/* <video
            ref={videoRef}
            src="/Work-flow.mp4"
            className="w-full h-full object-cover"
            poster="/Work-flow.jpg"
            controls
            muted // Needed for autoplay
          /> */}
          <img src="/work-flow-dashboard.png" alt="workflow" />
        </div>
      </motion.section>
    </div>
  );
};

export default VideoSection;
