import { LoginPage } from './index';
import type { LoginCredentials } from './types';

/**
 * LoginPreview Component
 * 
 * A simple preview/test wrapper for the LoginPage component.
 * This allows you to see the login page in action before router integration.
 * Remove this file once routing is implemented.
 */
function LoginPreview() {
  const handleLogin = (credentials: LoginCredentials) => {
    console.log('Login attempted with credentials:', credentials);
    alert(`Login submitted!\nEmail: ${credentials.email}\nORCID ID: ${credentials.orcidId}`);
  };

  return <LoginPage onLogin={handleLogin} />;
}

export default LoginPreview;