// OpenWeatherMap API key configuration for GitHub Pages
// Priority: URL param ?apikey=... > localStorage('owm_api_key') > placeholder

const params = new URLSearchParams(location.search);
const apikeyFromParam = params.get('apikey');

if (apikeyFromParam) {
	try { localStorage.setItem('owm_api_key', apikeyFromParam); } catch {}
}

const storedKey = (() => {
	try { return localStorage.getItem('owm_api_key'); } catch { return null; }
})();

export const API_KEY = apikeyFromParam || storedKey || 'YOUR_OPENWEATHERMAP_API_KEY';

if (!API_KEY || API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
	console.warn('[BreezyCas] No OpenWeather API key set. Add ?apikey=YOUR_KEY to the URL once, or set localStorage("owm_api_key", YOUR_KEY).');
}


