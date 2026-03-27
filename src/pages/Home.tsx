import React from 'react';
import { motion } from 'motion/react';
import { Video, FileText, Users, CheckCircle2, Eye, Smile, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 px-8">
        <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-primary text-xs font-bold tracking-wide uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Clinical Grade Analysis
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-on-surface tracking-tight leading-[1.1]">
              AI-Based Autism Detection
            </h1>
            
            <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl leading-relaxed">
              A professional-grade AI tool to assist in the early screening of autism traits through visual analysis. Our advanced neural networks provide objective data points for clinical consultation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/results">
                <button className="medical-gradient text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3 w-full sm:w-auto">
                  <Video size={24} />
                  Start Camera Analysis
                </button>
              </Link>
              <button className="bg-surface-container-high text-on-surface-variant px-8 py-4 rounded-xl font-bold text-lg hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-3 w-full sm:w-auto">
                <FileText size={24} />
                View Clinical Whitepaper
              </button>
            </div>
            
            <div className="flex items-center gap-6 pt-8 border-t border-outline-variant/20">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <img 
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-surface object-cover" 
                    src={`https://picsum.photos/seed/doc${i}/100/100`}
                    alt="Doctor"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <p className="text-sm text-on-surface-variant font-medium">
                Trusted by <span className="text-primary font-bold">2,400+</span> healthcare providers worldwide
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 relative">
              <img 
                className="w-full h-full object-cover" 
                src="https://picsum.photos/seed/child-clinical/800/800"
                alt="Child in clinical setting"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent"></div>
              
              {/* UI Overlay Element */}
              <div className="absolute bottom-6 left-6 right-6 glass-panel p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Live Analysis Feed</span>
                  <span className="px-2 py-1 bg-primary text-white text-[10px] rounded uppercase font-bold">Active</span>
                </div>
                <div className="space-y-3">
                  <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "78.4%" }}
                      transition={{ duration: 2, delay: 1 }}
                      className="h-full bg-primary"
                    ></motion.div>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    <span>Gaze Pattern Consistency</span>
                    <span className="text-primary">78.4%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-6 -right-6 h-32 w-32 bg-secondary-container/50 blur-3xl rounded-full -z-10"></div>
            <div className="absolute -bottom-10 -left-10 h-48 w-48 bg-primary-container/20 blur-3xl rounded-full -z-10"></div>
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 px-8 bg-surface-container-low">
        <div className="max-w-screen-2xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4">The Screening Process</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">Simple, non-invasive, and scientifically backed visual analysis designed for accuracy and patient comfort.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Eye, title: "Visual Gaze Tracking", desc: "AI monitors eye movements and fixation patterns in response to social stimuli to identify characteristic markers.", color: "bg-primary-fixed", iconColor: "text-primary" },
              { icon: Smile, title: "Facial Response Mapping", desc: "Subtle micro-expressions and emotional reactivity are quantified against a database of verified clinical observations.", color: "bg-tertiary-fixed", iconColor: "text-tertiary" },
              { icon: BarChart3, title: "Instant Data Report", desc: "Receive a comprehensive metric-based report that your doctor can use to accelerate the diagnostic journey.", color: "bg-secondary-container", iconColor: "text-secondary" }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm hover:shadow-md transition-all group"
              >
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", item.color, item.iconColor)}>
                  <item.icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">{item.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Validation Section */}
      <section className="py-24 px-8">
        <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="bg-primary p-12 rounded-[2.5rem] text-white shadow-2xl shadow-primary/30 relative z-10">
              <h2 className="text-3xl font-bold mb-8">Why Early Detection Matters</h2>
              <ul className="space-y-8">
                {[
                  { title: "Neuroplasticity Window", desc: "Early intervention during peak brain development leads to significantly better long-term outcomes." },
                  { title: "Support Planning", desc: "Families can begin accessing specialized educational and therapeutic resources years sooner." },
                  { title: "Objective Insights", desc: "Move past subjective observations with data-driven reports that facilitate clearer medical communication." }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-5">
                    <CheckCircle2 className="text-secondary-container shrink-0" size={28} />
                    <div>
                      <p className="font-bold text-lg mb-1">{item.title}</p>
                      <p className="text-white/80 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="absolute -top-10 -right-10 w-full h-full bg-secondary-container rounded-[2.5rem] -z-0"></div>
          </div>
          
          <div className="space-y-12">
            <div>
              <h2 className="text-4xl font-extrabold text-on-surface mb-6">Built on Peer-Reviewed Clinical Validation</h2>
              <p className="text-on-surface-variant text-lg leading-relaxed">AuraClinical AI isn't just software—it's the culmination of years of collaborative research between neuroscientists and machine learning engineers.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-10">
              {[
                { val: "94%", label: "Accuracy Rate", sub: "Validated against clinical gold-standard ADOS-2 tests." },
                { val: "3.2min", label: "Avg. Analysis", sub: "Rapid assessment reduces patient stress and fatigue." },
                { val: "50k+", label: "Data Sets", sub: "Trained on diverse behavioral videos across all demographics." },
                { val: "12", label: "Global Labs", sub: "Partnership with leading neuro-research institutions." }
              ].map((stat, idx) => (
                <div key={idx}>
                  <p className="text-primary text-5xl font-extrabold mb-2">{stat.val}</p>
                  <p className="text-on-surface font-bold text-lg">{stat.label}</p>
                  <p className="text-on-surface-variant text-xs mt-1 leading-relaxed">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-8 pb-24">
        <div className="max-w-screen-2xl mx-auto rounded-[2.5rem] bg-surface-container py-20 px-12 text-center border border-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold text-on-surface">Ready to begin?</h2>
            <p className="text-on-surface-variant text-lg leading-relaxed">Our camera-based analysis is private, secure, and compliant with all medical data privacy standards. No recordings are stored without explicit consent.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link to="/results">
                <button className="bg-primary text-white px-10 py-4 rounded-xl font-bold shadow-xl shadow-primary/20 hover:bg-primary-container transition-all active:scale-95 w-full sm:w-auto">
                  Start Guided Screening
                </button>
              </Link>
              <button className="bg-white text-on-surface-variant border border-outline-variant px-10 py-4 rounded-xl font-bold hover:bg-surface-container-low transition-colors w-full sm:w-auto">
                Request Info Kit
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
