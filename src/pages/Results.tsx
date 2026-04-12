import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Eye, 
  Brain, 
  BarChart3, 
  Stethoscope, 
  BookOpen, 
  ChevronRight,
  BadgeCheck,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get result from navigation state
    if (location.state?.analysisResult) {
      setAnalysisResult(location.state.analysisResult);
    }
    setLoading(false);
  }, [location.state]);

  const getRiskLevel = (prediction, confidence) => {
    if (prediction === 'Autism') {
      return confidence > 0.7 ? 'High Risk' : confidence > 0.5 ? 'Moderate Risk' : 'Low Risk';
    }
    return 'Low Risk';
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'High Risk': return 'text-error border-error';
      case 'Moderate Risk': return 'text-tertiary border-tertiary';
      case 'Low Risk': return 'text-[#2e7d32] border-[#2e7d32]';
      default: return 'text-primary border-primary';
    }
  };

  const getRiskBgColor = (riskLevel) => {
    switch (riskLevel) {
      case 'High Risk': return 'bg-error-container';
      case 'Moderate Risk': return 'bg-tertiary-container';
      case 'Low Risk': return 'bg-[#e8f5e9]';
      default: return 'bg-primary-container';
    }
  };

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-12 md:py-20">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-on-surface-variant">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-12 md:py-20">
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto text-error mb-4" />
          <h1 className="text-3xl font-bold text-on-surface mb-4">No Results Found</h1>
          <p className="text-on-surface-variant mb-8">Please complete an analysis first to view results.</p>
          <button 
            onClick={() => navigate('/live')}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
          >
            Start Analysis
          </button>
        </div>
      </div>
    );
  }

  const riskLevel = getRiskLevel(analysisResult.prediction, analysisResult.confidence);
  const riskColor = getRiskColor(riskLevel);
  const riskBgColor = getRiskBgColor(riskLevel);
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12 md:py-20">
      {/* Header Section */}
      <header className="mb-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-primary text-[10px] font-bold uppercase tracking-widest mb-4"
        >
          <BadgeCheck size={14} /> Screening Complete
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
          Clinical Screening Results
        </h1>
        <p className="text-on-surface-variant mt-4 max-w-2xl text-lg leading-relaxed">
          Detailed analysis based on behavioral markers and eye-tracking data. These results provide an initial clinical outlook for further professional consultation.
        </p>
      </header>

      {/* Main Report Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Primary Results */}
        <div className="md:col-span-8 space-y-8">
          {/* Final Output Result */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-surface-container-lowest p-8 rounded-2xl shadow-sm border-l-8 ${riskColor}`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Final Clinical Outlook</span>
                <h2 className={`text-5xl font-extrabold mt-2 ${riskColor}`}>{riskLevel}</h2>
                <p className="text-on-surface-variant mt-4 leading-relaxed text-lg">
                  {analysisResult.prediction === 'Autism' 
                    ? `The analysis indicates potential autism traits with ${analysisResult.confidence_percentage}% confidence. Further professional evaluation is recommended for comprehensive assessment.`
                    : `The analysis indicates that the observed behaviors align with typical developmental patterns with ${analysisResult.confidence_percentage}% confidence. No significant indicators of immediate concern were detected during this session.`
                  }
                </p>
                <div className="mt-4 flex items-center gap-4 text-sm text-on-surface-variant">
                  <span><strong>Model Prediction:</strong> {analysisResult.prediction}</span>
                  <span>•</span>
                  <span><strong>Confidence:</strong> {analysisResult.confidence_percentage}%</span>
                </div>
              </div>
              <div className={`flex-shrink-0 flex items-center justify-center w-28 h-28 rounded-full ${riskBgColor} ${riskColor} shadow-inner`}>
                {riskLevel === 'Low Risk' ? (
                  <CheckCircle2 size={64} strokeWidth={2.5} />
                ) : riskLevel === 'Moderate Risk' ? (
                  <AlertCircle size={64} strokeWidth={2.5} />
                ) : (
                  <AlertCircle size={64} strokeWidth={2.5} />
                )}
              </div>
            </div>
          </motion.div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Model Confidence */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface-container-low p-8 rounded-2xl group hover:bg-surface-container-lowest transition-all duration-300 border border-transparent hover:border-outline-variant/20"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Brain size={28} />
                </span>
                <span className="text-3xl font-extrabold text-primary">{analysisResult.confidence_percentage}%</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Model Confidence</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">AI model confidence level in the prediction based on visual analysis.</p>
              <div className="w-full bg-outline-variant/20 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${analysisResult.confidence_percentage}%` }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="bg-primary h-full rounded-full"
                ></motion.div>
              </div>
            </motion.div>

            {/* Analysis Threshold */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface-container-low p-8 rounded-2xl group hover:bg-surface-container-lowest transition-all duration-300 border border-transparent hover:border-outline-variant/20"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="p-3 rounded-xl bg-tertiary/10 text-tertiary">
                  <BarChart3 size={28} />
                </span>
                <span className="text-3xl font-extrabold text-tertiary">{(analysisResult.threshold_used * 100).toFixed(0)}%</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Decision Threshold</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">Classification threshold used to determine autism vs non-autism prediction.</p>
              <div className="w-full bg-outline-variant/20 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${analysisResult.threshold_used * 100}%` }}
                  transition={{ duration: 1.5, delay: 0.6 }}
                  className="bg-tertiary h-full rounded-full"
                ></motion.div>
              </div>
            </motion.div>
          </div>

          {/* Behavioral Indicators List */}
          <div className="bg-surface-container-low p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <BarChart3 className="text-primary" size={28} /> Behavioral Indicators
            </h3>
            <div className="space-y-4">
              {[
                { title: "Joint Attention", desc: "Consistent ability to share focus on an object with the examiner." },
                { title: "Facial Expression Reciprocity", desc: "Appropriate reactive expressions observed during interactive cues." },
                { title: "Vocal Interaction", desc: "Standard vocal response latency within expected age-appropriate ranges." }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex items-start gap-5 p-5 rounded-xl bg-surface-container-lowest transition-colors border border-outline-variant/10"
                >
                  <CheckCircle2 className="text-[#2e7d32] shrink-0 mt-1" size={24} />
                  <div>
                    <h4 className="font-bold text-on-surface text-lg">{item.title}</h4>
                    <p className="text-on-surface-variant leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="md:col-span-4 space-y-8">
          {/* Back Button */}
          <button 
            onClick={() => navigate('/live')}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all text-on-surface font-medium mb-6"
          >
            <ArrowLeft size={18} />
            Back to Analysis
          </button>

          {/* Next Steps */}
          <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-xl shadow-primary/5 border border-outline-variant/20">
            <h3 className="text-2xl font-bold mb-8">Next Steps</h3>
            <div className="space-y-4">
              <button className="w-full flex items-center justify-between p-5 rounded-2xl border border-outline-variant/30 hover:bg-surface-container-low transition-all text-left group">
                <div className="flex gap-4 items-center">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <span className="block font-bold text-on-surface">Consult a professional</span>
                    <span className="text-xs text-on-surface-variant">Find pediatric specialists near you.</span>
                  </div>
                </div>
                <ChevronRight className="text-outline group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              
              <button className="w-full flex items-center justify-between p-5 rounded-2xl border border-outline-variant/30 hover:bg-surface-container-low transition-all text-left group">
                <div className="flex gap-4 items-center">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <span className="block font-bold text-on-surface">Learn more about signs</span>
                    <span className="text-xs text-on-surface-variant">Explore our clinical library.</span>
                  </div>
                </div>
                <ChevronRight className="text-outline group-hover:translate-x-1 transition-transform" size={20} />
              </button>
            </div>
            
            <div className="mt-10 pt-8 border-t border-outline-variant/20">
              <div className="bg-surface-container-high p-5 rounded-2xl">
                <p className="text-xs text-on-surface-variant italic leading-relaxed">
                  "The screening results are intended for guidance and preliminary identification. They do not constitute a definitive medical diagnosis."
                </p>
              </div>
            </div>
          </div>

          {/* CTA Card */}
          <div className="relative overflow-hidden p-10 rounded-3xl medical-gradient text-white shadow-2xl shadow-primary/20">
            <div className="relative z-10">
              <h4 className="text-2xl font-bold mb-3">Want a deeper analysis?</h4>
              <p className="text-white/80 mb-8 leading-relaxed">Schedule a virtual consultation with one of our AI-assisted clinical experts today.</p>
              <button className="bg-white text-primary px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-opacity-90 transition-all shadow-lg">
                Book Session
              </button>
            </div>
            {/* Decorative background icon */}
            <div className="absolute -right-12 -bottom-12 opacity-10">
              <BarChart3 size={200} strokeWidth={1} />
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Stability Section */}
      <section className="mt-16 bg-surface-container-low p-10 rounded-3xl border border-outline-variant/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h3 className="text-2xl font-bold">Engagement Stability</h3>
            <p className="text-on-surface-variant mt-1">Real-time session attention consistency</p>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm"></span> Live Metric
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary shadow-sm"></span> Clinical Pivot
            </span>
          </div>
        </div>
        
        <div className="h-48 w-full relative overflow-hidden rounded-2xl bg-surface-container-lowest flex items-end px-6 py-4 border border-outline-variant/10 shadow-inner">
          {/* SVG Sparkline */}
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 100">
            <motion.path 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              d="M0,60 Q100,20 200,70 T400,30 T600,80 T800,40 T1000,60" 
              fill="none" 
              stroke="var(--color-primary)" 
              strokeWidth="4"
              strokeLinecap="round"
            />
            <motion.circle 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2 }}
              cx="1000" cy="60" fill="var(--color-tertiary)" r="6" 
            />
          </svg>
          
          {/* Pulse animation on the last point */}
          <div className="absolute right-5 bottom-[38%] h-4 w-4">
            <div className="absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75 animate-ping"></div>
            <div className="relative inline-flex rounded-full h-4 w-4 bg-tertiary shadow-lg"></div>
          </div>
        </div>
      </section>
    </div>
  );
}
