let apiUrl: string;

const apiUrls = {
  development: `http://localhost:${import.meta.env.VITE_API_PORT}`,
  production: import.meta.env.VITE_PROD_API_URL
}

if (window.location.hostname === 'localhost') {
  apiUrl = apiUrls.development;
} else {
  apiUrl = apiUrls.production;
}

export default apiUrl;