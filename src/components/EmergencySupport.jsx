/**
 * EmergencySupport Component - Emergency help and resources modal
 * Provides immediate access to crisis support and clinical resources
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, MessageCircle, MapPin, Clock, AlertTriangle, Heart, Users, Book, X, ExternalLink, Shield } from 'lucide-react';

const EmergencySupport = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('crisis');

  const emergencyContacts = [
    {
      name: 'National Suicide Prevention Lifeline',
      phone: '988',
      available: '24/7',
      description: 'Free, confidential support for people in distress',
      type: 'crisis'
    },
    {
      name: 'Crisis Text Line',
      phone: 'Text HOME to 741741',
      available: '24/7',
      description: 'Text-based crisis support',
      type: 'crisis'
    },
    {
      name: 'SAMHSA National Helpline',
      phone: '1-800-662-HELP (4357)',
      available: '24/7',
      description: 'Treatment referral and information service',
      type: 'crisis'
    },
    {
      name: 'Autism Speaks Response Team',
      phone: '1-888-288-4762',
      available: 'Mon-Fri 9AM-7PM ET',
      description: 'Autism-specific support and resources',
      type: 'autism'
    },
    {
      name: 'National Autism Association',
      phone: '1-877-622-2888',
      available: 'Mon-Fri 9AM-5PM ET',
      description: 'Family support and advocacy',
      type: 'autism'
    }
  ];

  const clinicalResources = [
    {
      name: 'American Academy of Pediatrics',
      description: 'Guidelines for autism screening and diagnosis',
      url: 'https://www.aap.org/en-us/advocacy-and-policy/aap-health-initiatives/Pages/Autism.aspx',
      type: 'guidelines'
    },
    {
      name: 'CDC Developmental Milestones',
      description: 'Checklists for developmental monitoring',
      url: 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html',
      type: 'screening'
    },
    {
      name: 'Autism Speaks Resource Guide',
      description: 'Comprehensive autism resource directory',
      url: 'https://www.autismspeaks.org/resource-guide',
      type: 'resources'
    },
    {
      name: 'National Institute of Mental Health',
      description: 'Autism Spectrum Disorder research and information',
      url: 'https://www.nimh.nih.gov/health/topics/autism-spectrum-disorders-asd/index.shtml',
      type: 'research'
    }
  ];

  const localResources = [
    {
      name: 'Local Emergency Services',
      phone: '911',
      description: 'For immediate medical emergencies',
      icon: <AlertTriangle className="text-error" />,
      type: 'emergency'
    },
    {
      name: 'Local Hospital Emergency Room',
      phone: 'Check local listings',
      description: 'For urgent medical care',
      icon: <MapPin className="text-tertiary" />,
      type: 'medical'
    },
    {
      name: 'Mental Health Crisis Center',
      phone: 'Check local listings',
      description: 'Local mental health emergency services',
      icon: <Heart className="text-secondary" />,
      type: 'mental'
    },
    {
      name: 'Pediatric Urgent Care',
      phone: 'Check local listings',
      description: 'Child-focused urgent medical care',
      icon: <Users className="text-primary" />,
      type: 'pediatric'
    }
  ];

  const handleCall = (phoneNumber) => {
    window.open(`tel:${phoneNumber}`);
  };

  const handleSms = (phoneNumber) => {
    window.open(`sms:${phoneNumber}`);
  };

  const renderEmergencyContacts = () => (
    <div className="space-y-4">
      <div className="p-4 bg-error-container/10 rounded-xl border border-error/20">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle size={20} className="text-error" />
          <h4 className="font-bold text-error">Immediate Crisis Support</h4>
        </div>
        <p className="text-sm text-on-surface-variant">
          If you or someone you know is in immediate danger, call 911 or go to the nearest emergency room.
        </p>
      </div>

      {emergencyContacts.map((contact, index) => (
        <div key={index} className="bg-surface-container rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-bold text-on-surface mb-1">{contact.name}</h4>
              <p className="text-sm text-on-surface-variant mb-2">{contact.description}</p>
              <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                <div className="flex items-center gap-1">
                  <Phone size={12} />
                  <span>{contact.phone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{contact.available}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCall(contact.phone)}
                className="p-2 bg-primary text-white rounded-lg hover:opacity-90 transition-all"
                title="Call"
              >
                <Phone size={16} />
              </button>
              {contact.phone.includes('Text') && (
                <button
                  onClick={() => handleSms('741741')}
                  className="p-2 bg-tertiary text-white rounded-lg hover:opacity-90 transition-all"
                  title="Text"
                >
                  <MessageCircle size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderClinicalResources = () => (
    <div className="space-y-4">
      {clinicalResources.map((resource, index) => (
        <div key={index} className="bg-surface-container rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-bold text-on-surface mb-1">{resource.name}</h4>
              <p className="text-sm text-on-surface-variant mb-2">{resource.description}</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-surface-container-high rounded-lg text-xs text-on-surface-variant">
                  {resource.type}
                </span>
              </div>
            </div>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-secondary text-white rounded-lg hover:opacity-90 transition-all"
              title="Visit Website"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      ))}
    </div>
  );

  const renderLocalResources = () => (
    <div className="space-y-4">
      <div className="p-4 bg-[#e8f5e9] rounded-xl border border-[#2e7d32]/20">
        <div className="flex items-center gap-3 mb-2">
          <MapPin size={20} className="text-[#2e7d32]" />
          <h4 className="font-bold text-[#2e7d32]">Local Emergency Services</h4>
        </div>
        <p className="text-sm text-on-surface-variant">
          Contact your local emergency services for immediate medical assistance in your area.
        </p>
      </div>

      {localResources.map((resource, index) => (
        <div key={index} className="bg-surface-container rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-surface-container-high rounded-lg">
                {resource.icon}
              </div>
              <div>
                <h4 className="font-bold text-on-surface mb-1">{resource.name}</h4>
                <p className="text-sm text-on-surface-variant mb-2">{resource.description}</p>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <Phone size={12} />
                  <span>{resource.phone}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleCall(resource.phone)}
              className="p-2 bg-primary text-white rounded-lg hover:opacity-90 transition-all"
              title="Call"
            >
              <Phone size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-surface-container-lowest rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-outline-variant/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-error" />
              <h2 className="text-2xl font-bold text-on-surface">Emergency Support</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-container rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Warning Banner */}
          <div className="mb-6 p-4 bg-error-container text-error rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} />
              <div>
                <p className="font-bold mb-1">Emergency Support Disclaimer</p>
                <p className="text-sm">
                  This application is for screening purposes only and is not a substitute for professional medical advice. 
                  If you are experiencing a medical emergency, please call 911 or go to the nearest emergency room immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-outline-variant/20">
            {[
              { id: 'crisis', label: 'Crisis Support', icon: <AlertTriangle size={16} /> },
              { id: 'clinical', label: 'Clinical Resources', icon: <Book size={16} /> },
              { id: 'local', label: 'Local Services', icon: <MapPin size={16} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'crisis' && renderEmergencyContacts()}
            {activeTab === 'clinical' && renderClinicalResources()}
            {activeTab === 'local' && renderLocalResources()}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="text-sm text-on-surface-variant">
                <p>Remember: You are not alone. Help is available 24/7.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleCall('988')}
                  className="px-4 py-2 bg-error text-white rounded-xl font-medium hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <Phone size={16} />
                  Call 988
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-xl font-medium hover:bg-surface-container-highest transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmergencySupport;
