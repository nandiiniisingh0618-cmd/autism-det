import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ShieldAlert, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SignIn from './SignIn';
import EmergencySupport from './EmergencySupport';

export function Navbar() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Live Detection', path: '/live' },
    { name: 'Results', path: '/results' },
    { name: 'About', path: '/about' },
  ];

  const handleSignIn = (userData) => {
    setShowSignIn(false);
    // User is now signed in via AuthContext
  };

  const handleSignOut = () => {
    logout();
  };

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/10">
        <div className="max-w-screen-2xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold tracking-tight text-primary font-headline">
            AuraClinical AI
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === link.path 
                    ? "text-primary border-b-2 border-primary pb-1" 
                    : "text-on-surface-variant"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Authentication */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-sm text-on-surface-variant">
                  <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {user?.role}
                  </span>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowSignIn(true)}
                className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2"
              >
                <User size={16} />
                Sign In
              </button>
            )}
            
            {/* Emergency Support */}
            <button 
              onClick={() => setShowEmergency(true)}
              className="bg-error text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-error/10"
            >
              <ShieldAlert size={16} />
              Emergency Support
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-surface-container rounded-xl transition-colors"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-surface-container-low border-t border-outline-variant/20">
            <div className="px-8 py-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block text-sm font-medium transition-colors hover:text-primary py-2",
                    location.pathname === link.path 
                      ? "text-primary" 
                      : "text-on-surface-variant"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="pt-4 border-t border-outline-variant/20 space-y-3">
                {isAuthenticated ? (
                  <>
                    <div className="text-sm text-on-surface-variant py-2">
                      <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                      <div className="text-xs">{user?.role}</div>
                    </div>
                    <button 
                      onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                      className="block text-sm font-medium text-on-surface-variant hover:text-primary transition-colors py-2 w-full text-left"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => { setShowSignIn(true); setMobileMenuOpen(false); }}
                    className="block text-sm font-medium text-on-surface-variant hover:text-primary transition-colors py-2 w-full text-left"
                  >
                    Sign In
                  </button>
                )}
                
                <button 
                  onClick={() => { setShowEmergency(true); setMobileMenuOpen(false); }}
                  className="w-full bg-error text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShieldAlert size={16} />
                  Emergency Support
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Modals */}
      <SignIn isOpen={showSignIn} onClose={() => setShowSignIn(false)} onSignIn={handleSignIn} />
      <EmergencySupport isOpen={showEmergency} onClose={() => setShowEmergency(false)} />
    </>
  );
}

export function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant/20 mt-20">
      <div className="max-w-screen-2xl mx-auto px-12 py-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-on-surface-variant text-xs max-w-md text-center md:text-left leading-relaxed">
          © 2026 AuraClinical AI. For clinical screening purposes only. Not a definitive medical diagnosis.
        </div>
        
        <div className="flex flex-wrap justify-center gap-8">
          {['Privacy Policy', 'Terms of Service', 'Clinical Validation', 'Contact Support'].map((item) => (
            <a 
              key={item} 
              href="#" 
              className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
