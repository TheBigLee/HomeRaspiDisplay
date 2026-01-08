const API_BASE = 'https://transport.opendata.ch/v1';
let stations = JSON.parse(localStorage.getItem('stations')) || [];
let selectedStation = null;
let searchTimeout = null;

// Parse URL parameters
const urlParams = new URLSearchParams(window.location.search);
const kioskMode = urlParams.has('kiosk') || urlParams.has('k');
const urlStations = urlParams.get('stations') || urlParams.get('s');

const stationSearch = document.getElementById('stationSearch');
const searchResults = document.getElementById('searchResults');
const addStationBtn = document.getElementById('addStationBtn');
const stationsList = document.getElementById('stationsList');
const stationConfig = document.querySelector('.station-config');
const stationsListSection = document.querySelector('.stations-list');

function debounce(func, delay) {
    return function(...args) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => func.apply(this, args), delay);
    };
}

async function searchStations(query) {
    if (query.length < 2) {
        searchResults.classList.remove('show');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/locations?query=${encodeURIComponent(query)}&type=station`);
        const data = await response.json();

        displaySearchResults(data.stations || []);
    } catch (error) {
        console.error('Error searching stations:', error);
        searchResults.innerHTML = '<div class="search-result-item">Error searching stations</div>';
        searchResults.classList.add('show');
    }
}

function displaySearchResults(stations) {
    if (stations.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No stations found</div>';
        searchResults.classList.add('show');
        return;
    }

    searchResults.innerHTML = stations.map(station => `
        <div class="search-result-item" data-station='${JSON.stringify({id: station.id, name: station.name})}'>
            <div class="station-name">${station.name}</div>
            <div class="station-location">${station.coordinate ? `${station.coordinate.x}, ${station.coordinate.y}` : ''}</div>
        </div>
    `).join('');

    searchResults.classList.add('show');
}

stationSearch.addEventListener('input', debounce((e) => {
    searchStations(e.target.value);
}, 300));

searchResults.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item');
    if (item && item.dataset.station) {
        selectedStation = JSON.parse(item.dataset.station);
        stationSearch.value = selectedStation.name;
        searchResults.classList.remove('show');
        addStationBtn.disabled = false;
    }
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.add-station-form')) {
        searchResults.classList.remove('show');
    }
});

addStationBtn.addEventListener('click', () => {
    if (selectedStation && !stations.find(s => s.id === selectedStation.id)) {
        stations.push(selectedStation);
        saveStations();
        renderStations();
        stationSearch.value = '';
        selectedStation = null;
        addStationBtn.disabled = true;
    }
});

function saveStations() {
    localStorage.setItem('stations', JSON.stringify(stations));
}

function removeStation(stationId) {
    stations = stations.filter(s => s.id !== stationId);
    saveStations();
    renderStations();
}

async function fetchDepartures(stationId) {
    try {
        const response = await fetch(`${API_BASE}/stationboard?id=${stationId}&limit=5`);
        const data = await response.json();
        return data.stationboard || [];
    } catch (error) {
        console.error('Error fetching departures:', error);
        return null;
    }
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}

function renderDepartures(departures, containerId) {
    const container = document.getElementById(containerId);

    if (departures === null) {
        container.innerHTML = '<div class="error">Error loading departures</div>';
        return;
    }

    if (departures.length === 0) {
        container.innerHTML = '<div class="loading">No departures found</div>';
        return;
    }

    // Zurich tram line colors (official VBZ network map 2025)
    const tramColors = {
        '2': '#ed1c24',   // Red
        '3': '#00ac4f',   // Dark Green
        '4': '#49479d',   // Dark Blue / Violet
        '5': '#956438',   // Brown / Sepia
        '6': '#d99f4f',   // Golden / Orange-Brown
        '7': '#231f20',   // Black
        '8': '#a6ce39',   // Light Green
        '9': '#49479d',   // Same as Line 4 (Dark Blue / Violet)
        '10': '#ee3897',  // Pink / Magenta
        '11': '#00ac4f',  // Same as Line 3 (Dark Green)
        '12': '#7ad0e2',  // Light Blue / Cyan
        '13': '#ffd503',  // Yellow
        '14': '#00aeef',  // Blue / Sky Blue
        '15': '#ed1c24',  // Same as Line 2 (Red)
        '17': '#9e1762',  // Dark Pink / Plum
        '20': '#9e1762',  // Same as 17 (Dark Pink / Plum)
        '50': '#000000',  // Black (temporary/alternate line)
        '51': '#000000',  // Black (temporary/alternate line)
    };

    // S-Bahn train line colors (official ZVV network map)
    const sbahnColors = {
        '2': '#7DC242',   // Light Green
        '3': '#587AC2',   // Medium Blue
        '4': '#EE7267',   // Coral/Light Red
        '5': '#64A8CA',   // Light Blue
        '6': '#734B89',   // Purple
        '7': '#FBB402',   // Amber/Yellow
        '8': '#62198F',   // Dark Purple
        '9': '#069A5D',   // Teal/Green
        '10': '#FBCF02',  // Yellow
        '11': '#CCAAFF',  // Lavender
        '12': '#EF0503',  // Bright Red
        '13': '#BA8C53',  // Brown/Tan
        '14': '#AC6547',  // Brown
        '15': '#BB9977',  // Beige/Brown
        '16': '#4FAD82',  // Sea Green
        '17': '#0F89AB',  // Teal/Blue
        '18': '#EE1C23',  // Red
        '19': '#F08513',  // Orange
        '20': '#C44F97',  // Magenta
        '21': '#A3CCEE',  // Light Sky Blue
        '23': '#A1C854',  // Light Green
        '24': '#BA8C53',  // Brown/Tan (same as S13)
        '25': '#B80E80',  // Pink/Magenta
        '26': '#0F89AB',  // Teal/Blue (same as S17)
        '29': '#069A5D',  // Teal/Green (same as S9)
        '30': '#0B5A9C',  // Blue
        '33': '#7C93CE',  // Light Periwinkle
        '35': '#ACBCE7',  // Pale Blue
        '36': '#D181B5',  // Light Purple
        '40': '#B793C9',  // Light Lilac
        '41': '#F2B49B',  // Peach
        '42': '#9A6B31',  // Brown
    };

    const limit = kioskMode ? 10 : 5;
    const departuresHTML = departures.slice(0, limit).map(dep => {
        const time = formatTime(dep.stop.departure);
        const destination = dep.to;
        const category = dep.category || '';
        const number = dep.number || '';
        const platform = dep.stop.platform || '-';

        // Calculate delay
        const delayMinutes = dep.stop.delay || 0;
        const delayHTML = delayMinutes > 0 ? `<span class="delay">+${delayMinutes}&nbsp;min</span>` : '';

        // Determine transport type and color
        let transportClass = 'train'; // default
        let colorStyle = '';
        const cat = category.toLowerCase();
        const lineNumber = number.trim();

        if (cat.includes('bus') || cat === 'b' || cat === 'bvb' || cat === 'nfb') {
            transportClass = 'bus';
        } else if (cat.includes('tram') || cat === 't') {
            transportClass = 'tram';
            // Apply specific tram line color if available
            if (tramColors[lineNumber]) {
                colorStyle = `style="color: ${tramColors[lineNumber]}"`;
            }
        } else if (cat === 's') {
            transportClass = 'train';
            // Apply specific S-Bahn line color if available
            if (sbahnColors[lineNumber]) {
                colorStyle = `style="color: ${sbahnColors[lineNumber]}"`;
            }
        } else if (cat === 'ic' || cat === 'ir' || cat === 'ice' || cat === 're' || cat === 'ec') {
            transportClass = 'train';
        }

        if (kioskMode) {
            return `
                <li class="departure-item board-item">
                    <div class="board-time">${time} ${delayHTML}</div>
                    <div class="board-train transport-${transportClass}" ${colorStyle}>${category} ${number}</div>
                    <div class="board-destination">${destination}</div>
                    <div class="board-platform">${platform}</div>
                </li>
            `;
        }

        return `
            <li class="departure-item">
                <div class="departure-time">${time} ${delayHTML}</div>
                <div class="departure-info">
                    <div class="departure-destination">${destination}</div>
                    <div class="departure-line">
                        <span class="line-badge transport-${transportClass}" ${colorStyle}>${category} ${number}</span>
                    </div>
                </div>
                <div class="departure-platform">
                    <span class="platform-label">Platform</span>
                    <span class="platform-number">${platform}</span>
                </div>
            </li>
        `;
    }).join('');

    if (kioskMode) {
        container.innerHTML = `
            <div class="board-header">
                <div class="board-header-item">Time</div>
                <div class="board-header-item">Train</div>
                <div class="board-header-item">Destination</div>
                <div class="board-header-item">Platform</div>
            </div>
            <ul class="departures board-departures">${departuresHTML}</ul>
        `;
    } else {
        container.innerHTML = `<ul class="departures">${departuresHTML}</ul>`;
    }
}

async function updateDepartures(stationId) {
    const container = document.getElementById(`departures-${stationId}`);
    container.innerHTML = '<div class="loading">Loading departures...</div>';

    const departures = await fetchDepartures(stationId);
    renderDepartures(departures, `departures-${stationId}`);
}

function renderStations() {
    if (stations.length === 0) {
        stationsList.innerHTML = '<p class="empty-state">No stations added yet. Search and add a station above.</p>';
        return;
    }

    stationsList.innerHTML = stations.map(station => `
        <div class="station-card ${kioskMode ? 'kiosk-mode' : ''}">
            ${!kioskMode ? `
            <div class="station-header">
                <h3 class="station-title">${station.name}</h3>
                <button class="remove-btn" onclick="removeStation('${station.id}')">Remove</button>
            </div>
            ` : `
            <div class="station-board-header">
                <h3 class="station-board-title">${station.name}</h3>
            </div>
            `}
            <div id="departures-${station.id}">
                <div class="loading">Loading departures...</div>
            </div>
            ${!kioskMode ? '<div class="refresh-info">Auto-refreshes every 60 seconds</div>' : ''}
        </div>
    `).join('');

    stations.forEach(station => {
        updateDepartures(station.id);
    });
}

function startAutoRefresh() {
    setInterval(() => {
        stations.forEach(station => {
            updateDepartures(station.id);
        });
    }, 60000);
}

// Initialize URL-based configuration
async function initializeFromURL() {
    if (urlStations) {
        const stationNames = urlStations.split(',').map(s => s.trim());

        for (const stationName of stationNames) {
            try {
                const response = await fetch(`${API_BASE}/locations?query=${encodeURIComponent(stationName)}&type=station`);
                const data = await response.json();

                if (data.stations && data.stations.length > 0) {
                    const station = data.stations[0];
                    if (!stations.find(s => s.id === station.id)) {
                        stations.push({id: station.id, name: station.name});
                    }
                }
            } catch (error) {
                console.error(`Error loading station ${stationName}:`, error);
            }
        }

        if (!kioskMode) {
            saveStations();
        }
    }
}

// Apply kiosk mode styling
if (kioskMode) {
    document.body.classList.add('kiosk-mode');
    if (stationConfig) stationConfig.style.display = 'none';
    if (stationsListSection) {
        const heading = stationsListSection.querySelector('h2');
        if (heading) heading.style.display = 'none';
    }
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
}

// Initialize and start
initializeFromURL().then(() => {
    renderStations();
    startAutoRefresh();
});
