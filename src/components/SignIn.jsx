/**
 * SignIn Component - Authentication functionality
 * Supports login, registration, and user session management
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, LogIn, UserPlus, X } from 'lucide-react';

const SignIn = ({ isOpen, onClose, onSignIn }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'parent' // parent, clinician, researcher
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (isSignUp) {
      if (!formData.firstName) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName) {
        newErrors.lastName = 'Last name is required';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (isSignUp) {
        // Registration logic
        const userData = {
          id: Date.now(),
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          createdAt: new Date().toISOString()
        };
        
        // Store in localStorage (in production, use proper backend)
        localStorage.setItem('user', JSON.stringify(userData));
        
        setSuccessMessage('Account created successfully!');
        
        // Auto-login after successful registration
        setTimeout(() => {
          if (onSignIn) {
            onSignIn(userData);
          }
          handleClose();
        }, 1500);
      } else {
        // Login logic
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user.email === formData.email) {
            setSuccessMessage('Login successful!');
            
            setTimeout(() => {
              if (onSignIn) {
                onSignIn(user);
              }
              handleClose();
            }, 1000);
          } else {
            setErrors({ general: 'Invalid email or password' });
          }
        } else {
          // Demo account for testing
          if (formData.email === 'demo@autism.com' && formData.password === 'demo123') {
            const demoUser = {
              id: 1,
              email: formData.email,
              firstName: 'Demo',
              lastName: 'User',
              role: 'parent',
              createdAt: new Date().toISOString()
            };
            
            localStorage.setItem('user', JSON.stringify(demoUser));
            setSuccessMessage('Login successful!');
            
            setTimeout(() => {
              if (onSignIn) {
                onSignIn(demoUser);
              }
              handleClose();
            }, 1000);
          } else {
            setErrors({ general: 'Invalid email or password. Try demo@autism.com / demo123' });
          }
        }
      }
    } catch (error) {
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      role: 'parent'
    });
    setErrors({});
    setSuccessMessage('');
    setIsSignUp(false);
    if (onClose) onClose();
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setErrors({});
    setSuccessMessage('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-surface-container-lowest rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto border border-outline-variant/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-on-surface">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-surface-container rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-[#e8f5e9] text-[#2e7d32] rounded-xl flex items-center gap-3">
              <CheckCircle size={20} />
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {errors.general && (
            <div className="mb-6 p-4 bg-error-container text-error rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sign Up Fields */}
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                          errors.firstName ? 'border-error' : 'border-outline-variant'
                        } bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                        placeholder="John"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-error">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                          errors.lastName ? 'border-error' : 'border-outline-variant'
                        } bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                        placeholder="Doe"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-error">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="parent">Parent</option>
                    <option value="clinician">Clinician</option>
                    <option value="researcher">Researcher</option>
                  </select>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                    errors.email ? 'border-error' : 'border-outline-variant'
                  } bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-error">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border ${
                    errors.password ? 'border-error' : 'border-outline-variant'
                  } bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-error">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password (Sign Up) */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border ${
                      errors.confirmPassword ? 'border-error' : 'border-outline-variant'
                    } bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                    placeholder="Confirm password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-error">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                <>
                  {isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-on-surface-variant">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={switchMode}
                className="ml-1 text-primary font-medium hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          </div>

          {/* Demo Account Info */}
          {!isSignUp && (
            <div className="mt-4 p-3 bg-surface-container rounded-xl text-xs text-on-surface-variant">
              <p className="font-medium mb-1">Demo Account:</p>
              <p>Email: demo@autism.com</p>
              <p>Password: demo123</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SignIn;
