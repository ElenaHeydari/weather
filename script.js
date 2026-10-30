const searchForm = document.querySelector("#searchForm");
const cityInput = document.querySelector("#cityInput");
const statusText = document.querySelector("#status");
const unitToggle = document.querySelector("#unitToggle");

let useFahrenheit = false;
let weatherData = null;

const weatherCodes = {
    0: ["آسمان صاف", "☀️"],
    1: ["عمدتاً صاف", "🌤️"],
    2: ["نیمه‌ابری", "⛅"],
    3: ["ابری", "☁️"],
    45: ["مه‌آلود", "🌫️"],
    48: ["مه یخ‌زده", "🌫️"],
    51: ["نم‌نم باران", "🌦️"],
    53: ["باران ملایم", "🌦️"],
    55: ["باران شدید", "🌧️"],
    61: ["بارش باران خفیف", "🌦️"],
    63: ["بارانی", "🌧️"],
    65: ["باران شدید", "🌧️"],
    71: ["برف خفیف", "🌨️"],
    73: ["بارش برف", "❄️"],
    75: ["برف شدید", "❄️"],
    80: ["رگبار پراکنده", "🌦️"],
    81: ["رگبار باران", "🌧️"],
    82: ["رگبار شدید", "⛈️"],
    95: ["رعدوبرق", "⛈️"],
    96: ["رعدوبرق و تگرگ", "⛈️"],
    99: ["رعدوبرق شدید و تگرگ", "⛈️"]
  };

function getWeatherInfo(code) {
  return weatherCodes[code] || ["شرایط متغیر", "🌤️"];
}

function convertTemperature(celsius) {
  return Math.round(
    useFahrenheit ? (celsius * 9) / 5 + 32 : celsius
  );
}

function getUnit() {
  return useFahrenheit ? "°F" : "°C";
}

async function loadWeather(city) {
  if (!city.trim()) {
    statusText.textContent = "لطفاً نام شهر را به انگلیسی وارد کنید.";
    return;
  }

  statusText.textContent = "در حال جستجوی شهر...";
  searchForm.querySelector("button").disabled = true;

  try {
    // Step 1: Find the city's coordinates.
    const geoUrl =
      `https://geocoding-api.open-meteo.com/v1/search` +
      `?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const geoResponse = await fetch(geoUrl);

    if (!geoResponse.ok) {
      throw new Error("امکان جستجوی این شهر وجود ندارد.");
    }

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("شهر پیدا نشد. نام دیگری را به انگلیسی امتحان کنید.");
    }

    const place = geoData.results[0];

    statusText.textContent = "در حال بارگذاری وضعیت آب‌وهوا...";

    // Step 2: Fetch weather using the coordinates.
    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${place.latitude}` +
      `&longitude=${place.longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=auto&forecast_days=5`;

    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      throw new Error("Weather service is unavailable.");
    }

    const data = await weatherResponse.json();

    weatherData = {
      city: place.name,
      country: place.country || "",
      current: data.current,
      daily: data.daily
    };

    renderWeather();
    statusText.textContent = "داده‌های زنده آب‌وهوا با موفقیت بارگذاری شدند.";
  } catch (error) {
    statusText.textContent =
      error.message || "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.";
  } finally {
    searchForm.querySelector("button").disabled = false;
  }
}

function renderWeather() {
  if (!weatherData) return;

  const { city, country, current, daily } = weatherData;
  const info = getWeatherInfo(current.weather_code);

  document.querySelector("#cityName").textContent =
    country ? `${city}, ${country}` : city;

  document.querySelector("#condition").textContent = info[0];
  document.querySelector("#weatherIcon").textContent = info[1];

  document.querySelector("#temperature").textContent =
    convertTemperature(current.temperature_2m);

  document.querySelector("#unit").textContent = getUnit();

  document.querySelector("#feelsLike").textContent =
    `${convertTemperature(current.apparent_temperature)}${getUnit()}`;

  document.querySelector("#feelsDetail").textContent =
    `${convertTemperature(current.apparent_temperature)}${getUnit()}`;

  document.querySelector("#humidity").textContent =
    `${current.relative_humidity_2m}%`;

  document.querySelector("#wind").textContent =
    `${Math.round(current.wind_speed_10m)} km/h`;

  const forecast = document.querySelector("#forecast");

  forecast.innerHTML = daily.time.map((date, index) => {
    const day = new Date(`${date}T12:00:00`);

    const dayName = index === 0
      ? "Today"
      : new Intl.DateTimeFormat("en", {
          weekday: "short"
        }).format(day);

    const weather = getWeatherInfo(daily.weather_code[index]);
    const high = convertTemperature(daily.temperature_2m_max[index]);
    const low = convertTemperature(daily.temperature_2m_min[index]);

    return `
      <article class="forecast-day">
        <h3>${dayName}</h3>
        <div class="forecast-icon">${weather[1]}</div>
        <p class="forecast-condition">${weather[0]}</p>
        <div class="forecast-temps">
          <span>${high}°</span>
          <span>${low}°</span>
        </div>
      </article>
    `;
  }).join("");
}

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  loadWeather(cityInput.value);
});

unitToggle.addEventListener("click", () => {
  useFahrenheit = !useFahrenheit;
  renderWeather();
});

loadWeather("Tehran");