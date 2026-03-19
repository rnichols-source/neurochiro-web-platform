import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

// Replace with actual environment variable management in your production setup
const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key: Ensure REACT_APP_CLERK_PUBLISHABLE_KEY is set in your .env file.");
}

/**
 * NeuroChiroAuthProvider
 * This acts as the "Identity Hub" glue. 
 * By wrapping our subdomains in this provider, we ensure 
 * unified login and seamless session sharing across:
 * - hub.neurochiro.co
 * - directory.neurochiro.co
 * - learn.neurochiro.co
 */
export const NeuroChiroAuthProvider = ({ children }) => {
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      // This setting is critical for cross-subdomain authentication
      // It enables the session to persist across domain names.
      domain="neurochiro.co"
    >
      {children}
    </ClerkProvider>
  );
};
