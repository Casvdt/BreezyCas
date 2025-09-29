const url = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";
const reverseGeoUrl = "https://api.openweathermap.org/geo/1.0/reverse";

// Import API key from config
import { API_KEY } from './config.js';

const APIKey = API_KEY;

 

const searchBox = document.querySelector(".search input")
const searchBtn = document.querySelector(".search button")
const weatherIcon = document.querySelector(".weather-icon")
const loadingEl = document.querySelector(".loading")
const weatherEl = document.querySelector(".weather")
const errorEl = document.querySelector(".error")
const forecastGridEl = document.querySelector(".forecast-grid")
const geoBtn = document.querySelector(".geo-btn")
const themeToggle = document.querySelector(".theme-toggle")
const unitsToggle = document.querySelector(".units-toggle")
const suggestionsEl = document.querySelector(".suggestions")
const favListEl = document.querySelector(".fav-list")
const favToggleEl = document.querySelector(".fav-toggle")
const hourlyList = document.querySelector('.hourly-list')
const hourLeftBtn = document.querySelector(".hour-left")
const hourRightBtn = document.querySelector(".hour-right")

// Units state
let currentUnits = localStorage.getItem('units') || 'metric'; // 'metric' | 'imperial'
// Language state for API localization
let currentLang = 'en';
function getApiLang(){ return currentLang === 'nl' ? 'nl' : 'en'; }
function getLocale(){ return currentLang === 'nl' ? 'nl-NL' : 'en-GB'; }

function toF(c) { return Math.round((c * 9/5) + 32); }
function mpsToKmh(ms) { return Math.round(ms * 3.6); }
function mpsToMph(ms) { return Math.round(ms * 2.23694); }
function formatTempC(c) { return Math.round(c) + "°C"; }
function formatTemp(c) { return currentUnits === 'metric' ? formatTempC(c) : (toF(c) + "°F"); }
function formatWind(ms) {
    if (currentUnits === 'metric') return mpsToKmh(ms) + " km/u";
    return mpsToMph(ms) + " mph";
}
function beaufortFromMps(ms) {
    const thresholds = [0.3,1.6,3.4,5.5,8.0,10.8,13.9,17.2,20.8,24.5,28.5,32.7];
    let b = 0; while (b < thresholds.length && ms >= thresholds[b]) b++; return b;
}
function degToWindDir(deg){
    const dirs = ['N','NNO','NO','ONO','O','OZO','ZO','ZZO','Z','ZZW','ZW','WZW','W','WNW','NW','NNW'];
    const i = Math.round(((deg % 360) / 22.5)) % 16; return dirs[i];
}

function updateAstro(sys, coord) {
    if (!sys) return;
    const sunriseEl = document.querySelector('.sunrise-time');
    const sunsetEl = document.querySelector('.sunset-time');
    if (sunriseEl && sys.sunrise) sunriseEl.textContent = new Date(sys.sunrise * 1000).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
    if (sunsetEl && sys.sunset) sunsetEl.textContent = new Date(sys.sunset * 1000).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
    // UV requires One Call API; placeholder '-' unless we add that endpoint later
}

// Removed UV index fetch (One Call API requires paid plan and triggers 401)

// Auto refresh configuration
const REFRESH_MS = 60000; // 60 seconds
let refreshTimer = null;
let lastQuery = { type: null, city: null, lat: null, lon: null };
// Persist last system/coord for astro re-render on language switch
let lastSys = null;
let lastCoord = null;

function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = setInterval(refreshCurrent, REFRESH_MS);
}

async function refreshCurrent() {
    if (document.hidden) return; // avoid refreshing when tab is hidden
    if (lastQuery.type === 'city' && lastQuery.city) {
        await checkWeather(lastQuery.city);
    } else if (lastQuery.type === 'coords' && lastQuery.lat != null && lastQuery.lon != null) {
        await updateByCoords(lastQuery.lat, lastQuery.lon);
    }
}

async function checkWeather(city) {
    const trimmedCity = city.trim();
    if (!trimmedCity) {
        return;
    }
    try {
        // Show loading, hide previous states
        if (loadingEl) loadingEl.classList.add("show");
        if (errorEl) errorEl.style.display = "none";
        if (weatherEl) weatherEl.style.display = "none";

        const response = await fetch(url + encodeURIComponent(trimmedCity) + `&lang=${getApiLang()}&appid=${APIKey}`);

        if (response.status === 404) {
            if (errorEl) errorEl.style.display = "block";
            if (weatherEl) weatherEl.style.display = "none";
            if (loadingEl) loadingEl.classList.remove("show");
            return;
        }

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        const data = await response.json();
        document.querySelector(".city").innerHTML = data.name;
        document.querySelector(".temp").innerHTML = formatTemp(data.main.temp);
        document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
        const windText = formatWind(data.wind.speed) + ` (Bft ${beaufortFromMps(data.wind.speed)})`;
        document.querySelector(".wind").innerHTML = windText;
        const winddirEl = document.querySelector('.winddir');
        if (winddirEl && typeof data.wind.deg === 'number') winddirEl.textContent = degToWindDir(data.wind.deg);
        const visEl = document.querySelector('.visibility');
        if (visEl && typeof data.visibility === 'number') visEl.textContent = (data.visibility/1000).toFixed(1) + ' km';
        const presEl = document.querySelector('.pressure');
        if (presEl && data.main && typeof data.main.pressure === 'number') presEl.textContent = data.main.pressure + ' hPa';
        const feelsEl = document.querySelector('.feels');
        if (feelsEl && data.main && typeof data.main.feels_like === 'number') {
            feelsEl.textContent = formatTemp(data.main.feels_like);
        }
        if (data.weather && data.weather[0] && data.weather[0].description) {
            const d = data.weather[0].description;
            const descEl = document.querySelector('.desc');
            if (descEl) descEl.textContent = d.charAt(0).toUpperCase() + d.slice(1);
        }

        if (data.weather[0].main == "Clouds") {
            weatherIcon.src = "IMG/clouds.png";
        }
        else if (data.weather[0].main == "Clear") {
            weatherIcon.src = "IMG/clear.png";
        }
        else if (data.weather[0].main == "Rain") {
            weatherIcon.src = "IMG/rain.png";
        }
        else if (data.weather[0].main == "Drizzle") {
            weatherIcon.src = "IMG/drizzle.png";
        }
        else if (data.weather[0].main == "Mist") {
            weatherIcon.src = "IMG/mist.png";
        }

        if (errorEl) errorEl.style.display = "none";
        if (weatherEl) {
            weatherEl.style.display = "block";
            weatherEl.classList.remove("show");
            // trigger reflow for animation restart
            void weatherEl.offsetWidth;
            weatherEl.classList.add("show");
        }
        const updatedAt = document.querySelector('.updated-at');
        if (updatedAt) updatedAt.textContent = new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
        // Astro
        lastSys = data.sys || null;
        lastCoord = data.coord || null;
        updateAstro(lastSys, lastCoord);
        // Fetch and render 5-day forecast (also updates precip chance in details)
        renderForecastByCity(trimmedCity);
        // Remember last query and (re)start auto refresh
        lastQuery = { type: 'city', city: trimmedCity, lat: null, lon: null };
        startAutoRefresh();
    } catch (error) {
        if (errorEl) errorEl.style.display = "block";
        if (weatherEl) weatherEl.style.display = "none";
        // Optionally log error to console for debugging
        console.error(error);
    }
    finally {
        if (loadingEl) loadingEl.classList.remove("show");
    }
}

async function renderForecastByCity(city) {
    if (!forecastGridEl) return;
    try {
        const res = await fetch(forecastUrl + encodeURIComponent(city) + `&lang=${getApiLang()}&appid=${APIKey}`);
        if (!res.ok) throw new Error("Forecast request failed");
        const data = await res.json();
        // Update precip chance in details from the next forecast slice if available
        const precipEl = document.querySelector('.precip');
        if (precipEl && data.list && data.list.length) {
            const pop = data.list[0].pop; // probability of precipitation (0..1)
            if (typeof pop === 'number') {
                precipEl.textContent = Math.round(pop * 100) + "%";
            }
        }
        // OpenWeather 3-hourly forecast; pick one snapshot per day at noon
        const byDay = {};
        for (const item of data.list) {
            const date = new Date(item.dt * 1000);
            const key = date.toISOString().slice(0,10);
            const hour = date.getUTCHours();
            if (!byDay[key] || Math.abs(hour - 12) < Math.abs(byDay[key].hour - 12)) {
                byDay[key] = { item, hour };
            }
            if (!byDay[key].maxPop || (typeof item.pop === 'number' && item.pop > byDay[key].maxPop)) {
                byDay[key].maxPop = item.pop || 0;
            }
        }
        const days = Object.keys(byDay).slice(0,5);
        forecastGridEl.innerHTML = "";
        for (const key of days) {
            const { item, maxPop } = byDay[key];
            const date = new Date(item.dt * 1000);
            const dayName = date.toLocaleDateString("nl-NL", { weekday: "short" });
            const min = Math.round(item.main.temp_min);
            const max = Math.round(item.main.temp_max);
            const main = item.weather && item.weather[0] ? item.weather[0].main : "Clear";
            const iconSrc = getIconForMain(main);
            const el = document.createElement("div");
            el.className = "forecast-day";
            el.innerHTML = `
                <div class="day-name">${dayName}</div>
                <img src="${iconSrc}" alt="${main}">
                <div class="day-temps">${formatTemp(max)} / ${formatTemp(min)}${typeof maxPop==='number' ? ` • ${Math.round(maxPop*100)}%` : ''}</div>
            `;
            forecastGridEl.appendChild(el);
        }

        // Hourly: next 10 upcoming entries from now (can span midnight)
        renderHourlyFromForecast(data.list, 10);
    } catch (e) {
        console.error(e);
    }
}

function getIconForMain(main) {
    if (main === "Clouds") return "IMG/clouds.png";
    if (main === "Clear") return "IMG/clear.png";
    if (main === "Rain") return "IMG/rain.png";
    if (main === "Drizzle") return "IMG/drizzle.png";
    if (main === "Mist") return "IMG/mist.png";
    if (main === "Snow") return "IMG/snow.png";
    return "IMG/clear.png";
}




searchBtn.addEventListener("click", () => {
    checkWeather(searchBox.value);
})

// Also trigger search when pressing Enter in the input
searchBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        checkWeather(searchBox.value);
    }
})

// Geolocation
// Helper: get a more precise position by waiting for an accurate reading
async function getPrecisePosition({
    desiredAccuracy = 100, // meters
    timeoutMs = 12000,
    maximumAge = 0
} = {}) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Geolocation unsupported'));
        let best = null;
        const options = { enableHighAccuracy: true, timeout: timeoutMs, maximumAge };
        const watcher = navigator.geolocation.watchPosition((pos) => {
            const acc = typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : Infinity;
            if (!best || acc < best.coords.accuracy) best = pos;
            if (acc <= desiredAccuracy) {
                navigator.geolocation.clearWatch(watcher);
                resolve(pos);
            }
        }, (err) => {
            navigator.geolocation.clearWatch(watcher);
            reject(err);
        }, options);
        // Safety timeout: resolve with best-so-far after timeout
        setTimeout(() => {
            try { navigator.geolocation.clearWatch(watcher); } catch {}
            if (best) resolve(best); else reject(new Error('Geolocation timeout'));
        }, timeoutMs + 1000);
    });
}

if (geoBtn && navigator.geolocation) {
    geoBtn.addEventListener("click", async () => {
        if (errorEl) errorEl.style.display = "none";
        // Quick first fix using cached/network location for speed
        let quickPos = null;
        try {
            quickPos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 300000, timeout: 5000 });
            });
        } catch {}

        // Start precise fix in background
        const precisePromise = getPrecisePosition({ desiredAccuracy: 50, timeoutMs: 15000, maximumAge: 0 }).catch(() => null);

        try {
            if (quickPos) {
                // Render quickly
                await updateByCoords(quickPos.coords.latitude, quickPos.coords.longitude);
                lastQuery = { type: 'coords', city: null, lat: quickPos.coords.latitude, lon: quickPos.coords.longitude };
                startAutoRefresh();
            } else {
                if (loadingEl) loadingEl.classList.add("show");
            }

            // When precise fix arrives, update if it's meaningfully different/better
            const precisePos = await precisePromise;
            if (precisePos) {
                const q = quickPos?.coords;
                const p = precisePos.coords;
                const dist = q ? haversineKm(q.latitude, q.longitude, p.latitude, p.longitude) : Infinity;
                const accImproved = q && typeof q.accuracy === 'number' && typeof p.accuracy === 'number' ? (p.accuracy + 50 < q.accuracy) : true;
                if (!quickPos || dist > 0.3 || accImproved) {
                    await updateByCoords(p.latitude, p.longitude);
                    lastQuery = { type: 'coords', city: null, lat: p.latitude, lon: p.longitude };
                    startAutoRefresh();
                }
            }
        } catch (e) {
            if (errorEl) errorEl.style.display = "block";
            console.error(e);
        } finally {
            if (loadingEl) loadingEl.classList.remove("show");
        }
    });
}

async function renderForecastByCoords(lat, lon) {
    if (!forecastGridEl) return;
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?units=metric&lang=${getApiLang()}&lat=${lat}&lon=${lon}&appid=${APIKey}`);
        if (!res.ok) throw new Error("Forecast request failed");
        const data = await res.json();
        const precipEl = document.querySelector('.precip');
        if (precipEl && data.list && data.list.length) {
            const pop = data.list[0].pop;
            if (typeof pop === 'number') {
                precipEl.textContent = Math.round(pop * 100) + "%";
            }
        }
        const byDay = {};
        for (const item of data.list) {
            const date = new Date(item.dt * 1000);
            const key = date.toISOString().slice(0,10);
            const hour = date.getUTCHours();
            if (!byDay[key] || Math.abs(hour - 12) < Math.abs(byDay[key].hour - 12)) {
                byDay[key] = { item, hour };
            }
            if (!byDay[key].maxPop || (typeof item.pop === 'number' && item.pop > byDay[key].maxPop)) {
                byDay[key].maxPop = item.pop || 0;
            }
        }
        const days = Object.keys(byDay).slice(0,5);
        forecastGridEl.innerHTML = "";
        for (const key of days) {
            const { item, maxPop } = byDay[key];
            const date = new Date(item.dt * 1000);
            const dayName = date.toLocaleDateString("nl-NL", { weekday: "short" });
            const min = Math.round(item.main.temp_min);
            const max = Math.round(item.main.temp_max);
            const main = item.weather && item.weather[0] ? item.weather[0].main : "Clear";
            const iconSrc = getIconForMain(main);
            const el = document.createElement("div");
            el.className = "forecast-day";
            el.innerHTML = `
                <div class="day-name">${dayName}</div>
                <img src="${iconSrc}" alt="${main}">
                <div class="day-temps">${formatTemp(max)} / ${formatTemp(min)}${typeof maxPop==='number' ? ` • ${Math.round(maxPop*100)}%` : ''}</div>
            `;
            forecastGridEl.appendChild(el);
        }

        // Hourly: next 10 upcoming entries
        renderHourlyFromForecast(data.list, 10);
    } catch (e) {
        console.error(e);
    }
}

// Helper to update UI by coordinates (used by auto refresh)
async function updateByCoords(lat, lon) {
    try {
        if (loadingEl) loadingEl.classList.add("show");
        if (errorEl) errorEl.style.display = "none";
        if (weatherEl) weatherEl.style.display = "none";
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?units=metric&lang=${getApiLang()}&lat=${lat}&lon=${lon}&appid=${APIKey}`);
        if (!res.ok) throw new Error("Geo weather failed");
        const data = await res.json();
        const niceName = await reverseGeocode(lat, lon);
        document.querySelector(".city").innerHTML = niceName || data.name;
        document.querySelector(".temp").innerHTML = formatTemp(data.main.temp);
        document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
        document.querySelector(".wind").innerHTML = formatWind(data.wind.speed) + ` (Bft ${beaufortFromMps(data.wind.speed)})`;
        const winddirEl3 = document.querySelector('.winddir');
        if (winddirEl3 && typeof data.wind.deg === 'number') winddirEl3.textContent = degToWindDir(data.wind.deg);
        const visEl3 = document.querySelector('.visibility');
        if (visEl3 && typeof data.visibility === 'number') visEl3.textContent = (data.visibility/1000).toFixed(1) + ' km';
        const presEl3 = document.querySelector('.pressure');
        if (presEl3 && data.main && typeof data.main.pressure === 'number') presEl3.textContent = data.main.pressure + ' hPa';
        const feelsEl = document.querySelector('.feels');
        if (feelsEl && data.main && typeof data.main.feels_like === 'number') {
            feelsEl.textContent = formatTemp(data.main.feels_like);
        }
        weatherIcon.src = getIconForMain(data.weather[0].main);
        if (data.weather && data.weather[0] && data.weather[0].description) {
            const d = data.weather[0].description;
            const descEl = document.querySelector('.desc');
            if (descEl) descEl.textContent = d.charAt(0).toUpperCase() + d.slice(1);
        }
        if (weatherEl) {
            weatherEl.style.display = "block";
            weatherEl.classList.remove("show");
            void weatherEl.offsetWidth;
            weatherEl.classList.add("show");
        }
        const updatedAt = document.querySelector('.updated-at');
        if (updatedAt) updatedAt.textContent = new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
        lastSys = data.sys || null;
        lastCoord = data.coord || { lat, lon };
        await renderForecastByCoords(lat, lon);
    } catch (e) {
        if (errorEl) errorEl.style.display = "block";
        console.error(e);
    } finally {
        if (loadingEl) loadingEl.classList.remove("show");
    }
}

// Pause auto refresh when tab hidden, resume when visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopAutoRefresh();
    } else if (lastQuery.type) {
        startAutoRefresh();
        refreshCurrent();
    }
});

function haversineKm(lat1, lon1, lat2, lon2){
    const toRad = (v) => v * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

async function reverseGeocode(lat, lon) {
    try {
        const res = await fetch(`${reverseGeoUrl}?lat=${lat}&lon=${lon}&limit=10&appid=${APIKey}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
            // Prefer closest of desired types; fallback to globally closest
            const preferOrder = [ 'city', 'town', 'village', 'municipality' ];
            const withDist = data.map(p => ({
                p,
                dist: (typeof p.lat === 'number' && typeof p.lon === 'number') ? haversineKm(lat, lon, p.lat, p.lon) : Infinity
            }));
            const preferred = withDist.filter(x => preferOrder.includes(x.p?.type));
            const candidates = preferred.length ? preferred : withDist;
            candidates.sort((a,b) => a.dist - b.dist);
            const chosen = candidates[0]?.p || data[0];
            const locNames = chosen.local_names || {};
            const localized = locNames[currentLang] || locNames[getApiLang()] || null;
            return localized || chosen.name || null;
        }
        return null;
    } catch {
        return null;
    }
}

function renderHourlyFromForecast(list, count){
    if (!hourlyList) return;
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d0 = now.getDate();
    const nowTs = now.getTime();
    const limit = typeof count === 'number' ? count : 8;
    const upcoming = list.filter(item => {
        const d = new Date(item.dt * 1000);
        return d.getFullYear() === y && d.getMonth() === m && d.getDate() === d0 && d.getTime() >= nowTs;
    }).slice(0, limit);
    hourlyList.innerHTML = '';
    upcoming.forEach((h, idx) => {
        const d = new Date(h.dt * 1000);
        const time = d.toLocaleTimeString("nl-NL", { hour: '2-digit', minute: '2-digit' });
        const main = h.weather && h.weather[0] ? h.weather[0].main : "Clear";
        const iconSrc = getIconForMain(main);
        const el = document.createElement('div');
        el.className = 'hourly-item';
        el.innerHTML = `
            <div class="t">${time}</div>
            <img src="${iconSrc}" alt="${main}">
            <div class="v">${formatTemp(h.main.temp)}</div>
            <div class="p">${typeof h.pop==='number' ? Math.round(h.pop*100)+"%" : ''}</div>
        `;
        el.addEventListener('click', () => {
            Array.from(hourlyList.children).forEach(i => i.classList.remove('selected'));
            el.classList.add('selected');
            const desc = h.weather && h.weather[0] ? h.weather[0].description : '';
            if (weatherIcon) weatherIcon.src = iconSrc;
            const tempEl = document.querySelector('.temp');
            if (tempEl) tempEl.textContent = formatTemp(h.main.temp);
            const descEl = document.querySelector('.desc');
            if (descEl && desc) descEl.textContent = desc.charAt(0).toUpperCase() + desc.slice(1);
        });
        hourlyList.appendChild(el);
        if (idx === 0) el.classList.add('selected');
    });
}

// Theme toggle
if (themeToggle) {
    const saved = localStorage.getItem("theme") || "dark";
    if (saved === "light") document.body.classList.add("light");
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("light");
        localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
    });
}

// Units toggle
if (unitsToggle) {
    if (currentUnits === 'imperial') unitsToggle.textContent = '°F / °C';
    unitsToggle.addEventListener('click', () => {
        currentUnits = currentUnits === 'metric' ? 'imperial' : 'metric';
        localStorage.setItem('units', currentUnits);
        unitsToggle.textContent = currentUnits === 'metric' ? '°C / °F' : '°F / °C';
        // Re-render using last query
        refreshCurrent();
    });
}

// Favorites
function getFavorites(){
    try { return JSON.parse(localStorage.getItem('favorites')||'[]'); } catch { return []; }
}
function setFavorites(list){ localStorage.setItem('favorites', JSON.stringify(list)); }
function renderFavorites(){
    if (!favListEl) return;
    const favs = getFavorites();
    favListEl.innerHTML = '';
    favs.forEach(city => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = city;
        nameSpan.addEventListener('click', () => checkWeather(city));
        const rm = document.createElement('span');
        rm.className = 'rm';
        rm.textContent = '×';
        rm.title = 'Verwijder';
        rm.addEventListener('click', (e) => {
            e.stopPropagation();
            const list = getFavorites().filter(c => c !== city);
            setFavorites(list);
            renderFavorites();
        });
        chip.appendChild(nameSpan);
        chip.appendChild(rm);
        favListEl.appendChild(chip);
    });
}
renderFavorites();
if (favToggleEl) {
    favToggleEl.addEventListener('click', () => {
        const city = document.querySelector('.city')?.textContent?.trim();
        if (!city) return;
        const favs = getFavorites();
        if (!favs.includes(city)) {
            favs.push(city);
            setFavorites(favs);
            renderFavorites();
            favToggleEl.textContent = '★ Bewaard';
            setTimeout(()=>{ favToggleEl.textContent = '☆ Bewaar'; }, 1000);
        }
    });
}

// Deep link (?city=...)
const params = new URLSearchParams(location.search);
const initialCity = params.get('city');
if (initialCity) {
    checkWeather(initialCity);
}


// Autocomplete suggestions using OW Geocoding
async function fetchSuggestions(q){
    try {
        const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${APIKey}`);
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
}

// ===== Language switcher =====
const langBtns = document.querySelectorAll('.lang-btn');
const translatableElems = document.querySelectorAll('.translatable');

function applyLanguage(lang) {
    translatableElems.forEach(el => {
        const value = el.dataset[lang];
        if (value) {
            // For inputs, update placeholder; for others, innerHTML
            if (el.tagName === 'INPUT') {
                el.setAttribute('placeholder', value);
            } else {
                el.innerHTML = value;
            }
        }
    });
    langBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
    try { localStorage.setItem('preferred_lang', lang); } catch {}
    try { document.documentElement.setAttribute('lang', lang); } catch {}
    // Sync current language for API/localization
    currentLang = (lang === 'nl' ? 'nl' : 'en');
    // Re-render dynamic astro texts after language replacement resets innerHTML
    if (lastSys) {
        updateAstro(lastSys, lastCoord);
    }
    // Re-fetch current weather/forecast to localize description and other API-provided strings
    refreshCurrent();
}

if (langBtns.length) {
    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang; // 'nl' or 'en'
            applyLanguage(lang);
        });
    });
    let initialLang = 'en';
    try {
        const stored = localStorage.getItem('preferred_lang');
        if (stored === 'nl' || stored === 'en') initialLang = stored;
    } catch {}
    applyLanguage(initialLang);
}
if (suggestionsEl && searchBox) {
    let debounce;
    searchBox.addEventListener('input', () => {
        const q = searchBox.value.trim();
        clearTimeout(debounce);
        if (!q) { suggestionsEl.innerHTML = ''; return; }
        debounce = setTimeout(async () => {
            const results = await fetchSuggestions(q);
            suggestionsEl.innerHTML = '';
            results.forEach(r => {
                const li = document.createElement('li');
                const name = r.local_names && r.local_names.nl ? r.local_names.nl : r.name;
                li.textContent = `${name}${r.state? ', ' + r.state: ''}${r.country? ' ('+r.country+')':''}`;
                li.addEventListener('click', () => {
                    searchBox.value = name;
                    suggestionsEl.innerHTML = '';
                    checkWeather(name);
                });
                suggestionsEl.appendChild(li);
            });
        }, 200);
    });
}

// Hourly nav scrolling
function scrollHourly(direction){
    if (!hourlyList || !hourlyList.children.length) return;
    const items = Array.from(hourlyList.children);
    let selected = items.findIndex(el => el.classList.contains('selected'));
    if (selected === -1) selected = 0;
    selected = (selected + direction + items.length) % items.length;
    items.forEach((el, i) => el.classList.toggle('selected', i === selected));
    items[selected].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    items[selected].click();
}
if (hourLeftBtn) hourLeftBtn.addEventListener('click', () => scrollHourly(-1));
if (hourRightBtn) hourRightBtn.addEventListener('click', () => scrollHourly(1));

