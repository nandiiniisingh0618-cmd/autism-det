import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ShieldAlert } from 'lucide-react';

export function Navbar() {
  const location = useLocation();
  
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Live Detection', path: '/live' },
    { name: 'Results', path: '/results' },
    { name: 'About', path: '/about' },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/10">
      <div className="max-w-screen-2xl mx-auto px-8 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold tracking-tight text-primary font-headline">
          AuraClinical AI
        </Link>
        
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
        
        <div className="flex items-center gap-4">
          <button className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
            Sign In
          </button>
          <button className="bg-error text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-error/10">
            <ShieldAlert size={16} />
            Emergency Support
          </button>
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant/20 mt-20">
      <div className="max-w-screen-2xl mx-auto px-12 py-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-on-surface-variant text-xs max-w-md text-center md:text-left leading-relaxed">
          © 2024 AuraClinical AI. For clinical screening purposes only. Not a definitive medical diagnosis.
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
