
/* =========================================================
   WeatherHub - Complete Frontend JavaScript
   Flask REST API Integration
   ========================================================= */


/* -------------------- API ROUTES -------------------- */

const API = {
    current: (city, country = "") =>
        `/api/weather/current?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`,

    forecast: (city, country = "") =>
        `/api/weather/forecast?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`,

    favourites: "/api/favorites"
};


/* -------------------- WORLD CITIES -------------------- */

const WORLD = [
    ["New York", "US"],
    ["London", "GB"],
    ["Tokyo", "JP"],
    ["Sydney", "AU"]
];


/* -------------------- HELPERS -------------------- */

const $ = id => document.getElementById(id);

function get(obj, ...keys) {
    if (!obj || typeof obj !== "object") return undefined;

    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) {
            return obj[key];
        }
    }

    return undefined;
}

function fmt(value, decimals = 1) {
    if (
        value === undefined ||
        value === null ||
        value === "" ||
        !Number.isFinite(Number(value))
    ) {
        return "--";
    }

    return Number(value).toFixed(decimals);
}

function title(value) {
    return String(value || "")
        .replace(/\b\w/g, character => character.toUpperCase());
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}


/* -------------------- WEATHER CONDITION -------------------- */

// Handles your Flask response:
// { "weather": "moderate rain", "temperature": 24.48 }
//
// Also supports OpenWeather-style responses.

function getWeatherCondition(data) {
    if (!data || typeof data !== "object") return "";

    const current = data.current || data;

    const weatherValue =
        current.weather ??
        data.weather ??
        current.conditions ??
        data.conditions ??
        current.description ??
        data.description ??
        current.condition ??
        data.condition ??
        current.weather_description ??
        data.weather_description;

    if (typeof weatherValue === "string") {
        return title(weatherValue);
    }

    if (Array.isArray(weatherValue)) {
        const item = weatherValue[0] || {};

        return title(
            item.description ||
            item.main ||
            ""
        );
    }

    if (weatherValue && typeof weatherValue === "object") {
        return title(
            weatherValue.description ||
            weatherValue.main ||
            weatherValue.name ||
            ""
        );
    }

    return "";
}


/* -------------------- WEATHER ICON -------------------- */

function icon(description = "", night = false) {
    const text = String(description || "").toLowerCase();

    if (
        text.includes("thunder") ||
        text.includes("storm")
    ) {
        return "⛈️";
    }

    if (
        text.includes("rain") ||
        text.includes("drizzle") ||
        text.includes("shower")
    ) {
        return "🌧️";
    }

    if (text.includes("snow")) {
        return "❄️";
    }

    if (
        text.includes("mist") ||
        text.includes("fog") ||
        text.includes("haze")
    ) {
        return "🌫️";
    }

    if (
        text.includes("partly cloudy") ||
        text.includes("few clouds") ||
        text.includes("scattered clouds")
    ) {
        return "🌤️";
    }

    if (
        text.includes("cloud") ||
        text.includes("overcast")
    ) {
        return "☁️";
    }

    if (
        text.includes("clear") ||
        text.includes("sunny") ||
        text.includes("sun")
    ) {
        return night ? "🌙" : "☀️";
    }

    if (text.includes("wind")) {
        return "💨";
    }

    // Unknown conditions should not show a misleading sun/rain icon.
    return "🌡️";
}


/* -------------------- NORMALIZE WEATHER DATA -------------------- */

function norm(data) {
    const current = data?.current || data || {};
    const main = current.main || data?.main || {};

    const temp =
        get(current, "temperature", "temp", "temp_c") ??
        get(main, "temp") ??
        get(data, "temperature", "temp", "temp_c");

    const feels =
        get(current, "feels_like", "feelsLike", "feels_like_temp") ??
        get(main, "feels_like") ??
        get(data, "feels_like", "feelsLike");

    const windObject = current.wind || data?.wind || {};

    const wind =
        get(current, "wind_speed", "windSpeed") ??
        get(windObject, "speed") ??
        get(data, "wind_speed", "windSpeed");

    const weatherArray = Array.isArray(current.weather)
        ? current.weather
        : Array.isArray(data?.weather)
            ? data.weather
            : [];

    const weatherInfo =
        weatherArray[0] ||
        (
            current.weather &&
            typeof current.weather === "object" &&
            !Array.isArray(current.weather)
                ? current.weather
                : {}
        );

    return {
        city:
            get(current, "city", "name") ||
            get(data, "city", "name") ||
            "",

        country:
            get(current, "country") ||
            get(data, "country") ||
            "",

        region:
            get(current, "region", "state") ||
            get(data, "region", "state") ||
            "",

        temp,
        feels,

        // Important: your API uses "weather": "moderate rain".
        desc: getWeatherCondition(data),

        hum:
            get(current, "humidity") ??
            get(main, "humidity") ??
            get(data, "humidity"),

        wind,

        pres:
            get(current, "pressure") ??
            get(main, "pressure") ??
            get(data, "pressure"),

        vis:
            get(current, "visibility") ??
            get(data, "visibility"),

        icon:
            get(current, "icon") ||
            get(weatherInfo, "icon") ||
            get(data, "icon") ||
            ""
    };
}


/* -------------------- TOAST MESSAGE -------------------- */

function toast(message) {
    const element = $("toast");

    if (!element) {
        console.log(message);
        return;
    }

    element.textContent = message;
    element.classList.add("show");

    setTimeout(() => {
        element.classList.remove("show");
    }, 2500);
}


/* -------------------- API REQUEST HELPER -------------------- */

async function api(url, options = {}) {
    const response = await fetch(url, options);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.message ||
            `Request failed (${response.status})`
        );
    }

    return data;
}


/* -------------------- CLOCK -------------------- */

function tick() {
    const now = new Date();

    const clockDate = $("clockDate");
    const clockTime = $("clockTime");
    const heroDate = $("hDate");

    if (clockDate) {
        clockDate.textContent = now.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).replace(",", "");
    }

    if (clockTime) {
        clockTime.textContent = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    if (heroDate) {
        heroDate.innerHTML =
            now.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }).replace(/^(\w+)/, "$1,") +
            "<br>" +
            now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit"
            });
    }
}


/* -------------------- CURRENT WEATHER -------------------- */

async function loadCurrent(city, country = "") {
    try {
        const raw = await api(API.current(city, country));
        const weather = norm(raw);

        if ($("hCity")) {
            $("hCity").innerHTML =
                `${escapeHtml(weather.city || city)}<small>, ${escapeHtml(weather.country || country)}</small>`;
        }

        if ($("hRegion")) {
            const regionText = [
                weather.region,
                weather.country === "IN" ? "India" : ""
            ].filter(Boolean).join(", ");

            $("hRegion").textContent =
                regionText || weather.country || "";
        }

        if ($("hTemp")) {
            $("hTemp").textContent = fmt(weather.temp);
        }

        if ($("hDesc")) {
            $("hDesc").textContent =
                weather.desc || "Weather condition unavailable";
        }

        if ($("hFeels")) {
            $("hFeels").textContent = fmt(weather.feels);
        }

        if ($("mFeels")) {
            $("mFeels").textContent =
                `${fmt(weather.feels)}°C`;
        }

        if ($("mHum")) {
            $("mHum").textContent =
                `${fmt(weather.hum, 0)}%`;
        }

        if ($("mWind")) {
            $("mWind").textContent =
                `${fmt(weather.wind)} m/s`;
        }

        if ($("mPres")) {
            $("mPres").textContent =
                `${fmt(weather.pres, 0)} hPa`;
        }

        if ($("mVis")) {
            const rawVisibility = weather.vis;

            if (
                rawVisibility !== undefined &&
                rawVisibility !== null &&
                rawVisibility !== "" &&
                Number.isFinite(Number(rawVisibility))
           ) {
              const visibility = Number(rawVisibility);
              // API visibility is normally in metres.
              const visibilityKm = visibility > 100 ? visibility / 1000 : visibility;
              $("mVis").textContent = `${visibilityKm.toFixed(1)} km`;
            } else {
                $("mVis").textContent = "-- km";
                console.log("Visibility missing. Weather data:", weather);
            }
        }

        const now = new Date();
        const night =
            now.getHours() >= 18 ||
            now.getHours() < 6;

        const weatherIcon = $("weatherIcon");

        if (weatherIcon) {
            if (weather.icon) {
                weatherIcon.src =
                    `https://openweathermap.org/img/wn/${encodeURIComponent(weather.icon)}@2x.png`;

                weatherIcon.alt =
                    weather.desc || "Weather icon";

                weatherIcon.hidden = false;
            } else {
                weatherIcon.hidden = true;
            }
        }

        const hero = document.querySelector(".hero");

        if (hero) {
            hero.dataset.day = String(!night);
        }

        await loadForecast(city, country);

    } catch (error) {
        console.error("Current weather error:", error);
        toast(error.message || "Unable to load current weather.");
    }
}


/* -------------------- FIVE-DAY FORECAST -------------------- */

async function loadForecast(city, country = "") {
    const forecastRow = $("forecastRow");

    if (!forecastRow) return;

    forecastRow.innerHTML =
        '<p class="text-secondary">Loading forecast...</p>';

    try {
        const data = await api(API.forecast(city, country));

        const entries = Array.isArray(data)
            ? data
            : get(data, "forecast", "days", "list");

        if (!Array.isArray(entries) || entries.length === 0) {
            forecastRow.innerHTML =
                '<p class="text-secondary">Forecast data unavailable.</p>';
            return;
        }

        forecastRow.innerHTML = entries.slice(0, 5).map((day, index) => {
            const dateText = get(day, "date", "dt_txt", "datetime");

            const date = dateText
                ? new Date(`${String(dateText).slice(0, 10)}T12:00:00`)
                : new Date(Date.now() + index * 86400000);

            const minTemp = get(day, "min_temp", "temp_min", "min");
            const maxTemp = get(day, "max_temp", "temp_max", "max");

            const description = title(
                get(day, "conditions", "weather", "description", "condition") ||
                "Forecast unavailable"
            );

            const chanceValue = get(
                day,
                "rain_chance",
                "pop",
                "precipitation_probability"
            );

            let chance = null;

            if (
                chanceValue !== undefined &&
                chanceValue !== null &&
                Number.isFinite(Number(chanceValue))
            ) {
                chance = Math.round(
                    Number(chanceValue) <= 1
                        ? Number(chanceValue) * 100
                        : Number(chanceValue)
                );
            }

            return `
                <div class="col">
                    <div class="day ${index === 0 ? "today" : ""}">
                        <b>${date.toLocaleDateString("en-GB", { weekday: "short" })}</b>

                        <small>${date.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short"
                        })}</small>

                        <div class="ic">${icon(description)}</div>

                        <div class="t">
                            <span class="hi">${fmt(maxTemp, 0)}°</span>
                            /
                            <span class="lo">${fmt(minTemp, 0)}°</span>
                        </div>

                        <div class="d">${escapeHtml(description)}</div>

                        <div class="p">
                            💧 ${chance === null ? "Precipitation unavailable" : `${chance}%`}
                        </div>
                    </div>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Forecast error:", error);

        forecastRow.innerHTML =
            '<p class="text-warning">Unable to load forecast.</p>';
    }
}


/* -------------------- FAVOURITES RESPONSE -------------------- */

function extractFavourites(data) {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.favorites)) return data.favorites;
    if (Array.isArray(data?.favourites)) return data.favourites;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;

    return [];
}


/* -------------------- FAVOURITE CITIES -------------------- */

async function loadFavs() {
    const favList = $("favList");

    if (!favList) return;

    favList.innerHTML =
        '<p class="text-secondary py-3">Loading favourite cities...</p>';

    try {
        const response = await api(API.favourites);
        const favourites = extractFavourites(response);

        if (favourites.length === 0) {
            favList.innerHTML = `
                <p class="text-secondary py-3">
                    No favourite cities yet. Click Add City to save one.
                </p>`;
            return;
        }

        const rows = await Promise.all(
            favourites.slice(0, 5).map(async favourite => {
                const city = favourite.city || favourite.name || "";
                const country = favourite.country || "";
                const nickname = favourite.nickname || "";
                const id = favourite.id ?? favourite.favorite_id ?? "";

                let weather = {
                    temp: null,
                    desc: "",
                    icon: ""
                };

                // Call the current-weather API only once per favourite.
                try {
                    const weatherData = await api(
                        API.current(city, country)
                    );

                    weather = norm(weatherData);

                } catch (error) {
                    console.error(
                        `Weather request failed for ${city}:`,
                        error
                    );
                }

                const condition =
                    weather.desc || "Weather unavailable";

                const weatherIcon = weather.icon
                    ? `<img class="fav-weather-icon"
                            src="https://openweathermap.org/img/wn/${encodeURIComponent(weather.icon)}@2x.png"
                            alt="${escapeHtml(condition)}"
                            onerror="this.onerror=null;this.outerHTML='${icon(condition)}'">`
                    : icon(condition);

                const temperature =
                    weather.temp !== null &&
                    weather.temp !== undefined &&
                    Number.isFinite(Number(weather.temp))
                        ? `${fmt(weather.temp)}°C`
                        : "--°C";

                return `
                    <div class="fav">
                        <div class="ic">${weatherIcon}</div>

                        <div class="nm">
                            <b>${escapeHtml(city)}</b>
                            <small>${escapeHtml(country)}</small>
                            ${
                                nickname
                                    ? `<small>Nickname: ${escapeHtml(nickname)}</small>`
                                    : ""
                            }
                        </div>

                        <div class="tm">
                            <b>${temperature}</b>
                            <small>${escapeHtml(condition)}</small>
                        </div>

                        <div class="fav-actions">
                            <button
                                type="button"
                                class="btn btn-sm btn-primary view-fav"
                                data-city="${encodeURIComponent(city)}"
                                data-country="${encodeURIComponent(country)}">
                                View Weather
                            </button>

                            <button
                                type="button"
                                class="ib e edit-fav"
                                data-id="${encodeURIComponent(id)}"
                                data-city="${encodeURIComponent(city)}"
                                title="Edit">
                                <i class="bi bi-pencil-fill"></i>
                            </button>

                            <button
                                type="button"
                                class="ib x delete-fav"
                                data-id="${encodeURIComponent(id)}"
                                title="Delete">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </div>
                `;
            })
        );

        favList.innerHTML = rows.join("");

    } catch (error) {
        console.error("Favourite cities error:", error);

        favList.innerHTML = `
            <p class="text-warning py-3">
                Unable to load favourite cities:
                ${escapeHtml(error.message)}
            </p>`;
    }
}


/* -------------------- FAVOURITE BUTTON ACTIONS -------------------- */

if ($("favList")) {
    $("favList").addEventListener("click", event => {
        const viewButton = event.target.closest(".view-fav");
        const editButton = event.target.closest(".edit-fav");
        const deleteButton = event.target.closest(".delete-fav");

        if (viewButton) {
            const city = decodeURIComponent(
                viewButton.dataset.city || ""
            );

            const country = decodeURIComponent(
                viewButton.dataset.country || ""
            );

            if ($("cityInput")) $("cityInput").value = city;
            if ($("countryInput")) $("countryInput").value = country;

            loadCurrent(city, country);
        }

        if (editButton) {
            const id = decodeURIComponent(
                editButton.dataset.id || ""
            );

            const city = decodeURIComponent(
                editButton.dataset.city || ""
            );

            if (id) {
                window.editFav(id, city);
            } else {
                toast("Favourite ID missing. Check GET /api/favorites response.");
            }
        }

        if (deleteButton) {
            const id = decodeURIComponent(
                deleteButton.dataset.id || ""
            );

            if (id) {
                window.delFav(id);
            } else {
                toast("Favourite ID missing. Check GET /api/favorites response.");
            }
        }
    });
}


/* -------------------- ADD FAVOURITE CITY -------------------- */

if ($("addCityBtn")) {
    $("addCityBtn").onclick = async () => {
        const city = prompt("City name");

        if (!city || !city.trim()) return;

        const country = (
            prompt("Country code (e.g. IN)", "IN") || ""
        ).trim().toUpperCase();

        const nickname = prompt("Nickname (optional)", "") || "";

        try {
            await api(API.favourites, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    city: city.trim(),
                    country,
                    nickname: nickname.trim() || null
                })
            });

            toast("City added");
            await loadFavs();

        } catch (error) {
            toast(error.message);
        }
    };
}


/* -------------------- EDIT FAVOURITE CITY -------------------- */

window.editFav = async (id, oldCity) => {
    const city = prompt("Update city name", oldCity);

    if (!city || !city.trim()) return;

    try {
        await api(
            `${API.favourites}/${encodeURIComponent(id)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    city: city.trim()
                })
            }
        );

        toast("City updated");
        await loadFavs();

    } catch (error) {
        toast(error.message);
    }
};


/* -------------------- DELETE FAVOURITE CITY -------------------- */

window.delFav = async id => {
    if (!confirm("Remove this city?")) return;

    try {
        await api(
            `${API.favourites}/${encodeURIComponent(id)}`,
            { method: "DELETE" }
        );

        toast("City removed");
        await loadFavs();

    } catch (error) {
        toast(error.message);
    }
};


/* -------------------- CITY IMAGES -------------------- */

const CITY_IMAGES = {
    "new york":
        "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=400&q=80",

    "london":
        "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=400&q=80",

    "tokyo":
        "https://images.unsplash.com/photo-1540959733332-eab4de?auto=format&fit=crop&w=400&q=80",

    "sydney":
        "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=400&q=80",

    "hyderabad":
        "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=400&q=80",

    "vijayawada":
        "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=400&q=80"
};

function getCityImage(city) {
    const key = String(city || "").trim().toLowerCase();

    return CITY_IMAGES[key] || "/static/img/default-city.jpg";
}


/* -------------------- WEATHER AROUND THE WORLD -------------------- */

async function loadWorld() {
    const worldList = $("worldList");

    if (!worldList) return;

    try {
        const rows = await Promise.all(
            WORLD.map(async ([city, country]) => {
                let weather = {
                    temp: null,
                    desc: "",
                    icon: ""
                };

                try {
                    const data = await api(
                        API.current(city, country)
                    );

                    weather = norm(data);

                } catch (error) {
                    console.error(
                        `World weather failed for ${city}:`,
                        error
                    );
                }

                const image = getCityImage(city);
                const condition =
                    weather.desc || "Weather unavailable";

                return `
                    <div
                        class="world"
                        role="button"
                        tabindex="0"
                        data-city="${encodeURIComponent(city)}"
                        data-country="${encodeURIComponent(country)}">

                        <img
                            class="th"
                            src="${image}"
                            alt="${escapeHtml(city)}"
                            loading="lazy"
                            onerror="this.onerror=null;this.src='/static/img/default-city.jpg';">

                        <div class="nm">
                            ${escapeHtml(city)}, ${escapeHtml(country)}
                        </div>

                        <div class="ic">${icon(condition)}</div>

                        <div class="tm">
                            <b>${
                                weather.temp !== null &&
                                weather.temp !== undefined &&
                                Number.isFinite(Number(weather.temp))
                                    ? `${fmt(weather.temp)}°C`
                                    : "--°C"
                            }</b>
                            <br>
                            <small>${escapeHtml(condition)}</small>
                        </div>

                        <i class="bi bi-chevron-right"></i>
                    </div>
                `;
            })
        );

        worldList.innerHTML = rows.join("");

    } catch (error) {
        console.error("World weather error:", error);

        worldList.innerHTML =
            '<p class="text-secondary">World weather is unavailable.</p>';
    }
}


/* -------------------- WORLD CITY CLICK -------------------- */

if ($("worldList")) {
    $("worldList").addEventListener("click", event => {
        const world = event.target.closest(".world");

        if (!world) return;

        const city = decodeURIComponent(world.dataset.city || "");
        const country = decodeURIComponent(world.dataset.country || "");

        loadCurrent(city, country);
    });

    $("worldList").addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;

        const world = event.target.closest(".world");

        if (!world) return;

        event.preventDefault();

        const city = decodeURIComponent(world.dataset.city || "");
        const country = decodeURIComponent(world.dataset.country || "");

        loadCurrent(city, country);
    });
}


/* -------------------- SEARCH FORM -------------------- */

const searchForm = $("searchForm") || $("citySearchForm");

if (searchForm) {
    searchForm.addEventListener("submit", async event => {
        event.preventDefault();

        const city = $("cityInput")?.value.trim();
        const country = $("countryInput")?.value.trim() || "";

        const loading = $("weatherLoading");
        const errorMessage = $("weatherError");
        const searchButton = $("searchButton");

        if (!city) {
            if (errorMessage) {
                errorMessage.textContent = "Please enter a city name.";
                errorMessage.hidden = false;
            }

            return;
        }

        if (loading) loading.hidden = false;
        if (errorMessage) errorMessage.hidden = true;
        if (searchButton) searchButton.disabled = true;

        try {
            await loadCurrent(city, country);
            await loadFavs();

        } catch (error) {
            if (errorMessage) {
                errorMessage.textContent =
                    error.message || "Unable to get weather data.";

                errorMessage.hidden = false;
            }

        } finally {
            if (loading) loading.hidden = true;
            if (searchButton) searchButton.disabled = false;
        }
    });
}


/* -------------------- LIGHT AND DARK THEME -------------------- */

function setTheme(theme) {
    document.documentElement.dataset.theme = theme;

    if ($("lightBtn")) {
        $("lightBtn").classList.toggle("on", theme === "light");
    }

    if ($("darkBtn")) {
        $("darkBtn").classList.toggle("on", theme === "dark");
    }
}

if ($("lightBtn")) {
    $("lightBtn").onclick = () => setTheme("light");
}

if ($("darkBtn")) {
    $("darkBtn").onclick = () => setTheme("dark");
}


/* -------------------- SIDEBAR NAVIGATION -------------------- */

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        document
            .querySelector(".nav-link.active")
            ?.classList.remove("active");

        link.classList.add("active");
    });
});


/* -------------------- START DASHBOARD -------------------- */

tick();

setInterval(tick, 30000);

loadCurrent("Vijayawada", "IN");
loadFavs();
loadWorld();
