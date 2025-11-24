import React, { useState } from 'react';
import { mockLogin, mockSignup } from '../services/mockDb';
import { Button } from './Button';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignup) {
        if (!name || !username) throw new Error("All fields are required");
        const { user, token } = await mockSignup(email, password, username, name);
        onAuthSuccess(user, token);
      } else {
        const { user, token } = await mockLogin(email, password);
        onAuthSuccess(user, token);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        {/* Modal */}
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
          <h3 className="text-2xl font-bold leading-6 text-slate-900 mb-2">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            {isSignup ? 'Join AskLaw to track your legal queries.' : 'Sign in to access your history and profile.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 outline-none"
                    placeholder="jdoe123"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

            <Button type="submit" className="w-full" isLoading={loading}>
              {isSignup ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};