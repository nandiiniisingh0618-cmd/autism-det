import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Users, Globe, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12 md:py-20">
      <section className="mb-20 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl font-extrabold text-on-surface tracking-tight mb-6"
        >
          Our Mission
        </motion.h1>
        <p className="text-xl text-on-surface-variant max-w-3xl mx-auto leading-relaxed">
          AuraClinical AI was founded with a single goal: to make early autism screening accessible, objective, and non-invasive for families worldwide.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        <div className="bg-surface-container-low p-10 rounded-[2.5rem] border border-outline-variant/10">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-bold mb-4">Clinical Integrity</h2>
          <p className="text-on-surface-variant leading-relaxed">
            Our algorithms are developed in collaboration with leading pediatric neurologists and psychologists. We prioritize clinical accuracy over speed, ensuring that every data point we provide is scientifically sound.
          </p>
        </div>

        <div className="bg-surface-container-low p-10 rounded-[2.5rem] border border-outline-variant/10">
          <div className="w-14 h-14 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center mb-8">
            <Award size={32} />
          </div>
          <h2 className="text-3xl font-bold mb-4">Ethical AI</h2>
          <p className="text-on-surface-variant leading-relaxed">
            We believe in transparent AI. Our models are trained on diverse datasets to minimize bias and ensure equitable screening results across all demographics and backgrounds.
          </p>
        </div>
      </div>

      <section className="bg-primary p-12 md:p-20 rounded-[3rem] text-white relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Global Impact</h2>
            <p className="text-white/80 text-lg leading-relaxed mb-8">
              By providing tools that can be used at home or in smaller clinics, we're helping bridge the gap in diagnostic access, especially in underserved regions.
            </p>
            <div className="flex gap-8">
              <div>
                <p className="text-4xl font-black mb-1">120+</p>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60">Countries reached</p>
              </div>
              <div>
                <p className="text-4xl font-black mb-1">15k+</p>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60">Early detections</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Globe className="text-white/20" size={48} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
