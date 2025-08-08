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
    alert(`Login submitted!\nORCID ID: ${credentials.orcidId}`);
  };

  const handleORCIDLogin = () => {
    console.log('ORCID authentication initiated');
    alert('ORCID authentication would redirect to ORCID.org in production');
  };

  return <LoginPage onLogin={handleLogin} onORCIDLogin={handleORCIDLogin} />;
}

export default LoginPreview;