// 1. Initialize the Leaflet map
const map = L.map('map').setView([20, 0], 2); // Centered roughly on the world, zoom level 2

// Add a tile layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const infoPanel = document.getElementById('country-details');
let clickedLayer = null; // To keep track of the currently clicked country

// 2. Sample Country Data (Add more as needed!)
// In a real application, this would likely be fetched from a database or API
const countryData = {
    "USA": {
        capital: "Washington, D.C.",
        population: "331,000,000",
        flag: "https://flagcdn.com/us.svg"
    },
    "CAN": {
        capital: "Ottawa",
        population: "38,000,000",
        flag: "https://flagcdn.com/ca.svg"
    },
    "GBR": {
        capital: "London",
        population: "67,000,000",
        flag: "https://flagcdn.com/gb.svg"
    },
    "FRA": {
        capital: "Paris",
        population: "65,000,000",
        flag: "https://flagcdn.com/fr.svg"
    },
    "DEU": {
        capital: "Berlin",
        population: "83,000,000",
        flag: "https://flagcdn.com/de.svg"
    },
    "IND": {
        capital: "New Delhi",
        population: "1,400,000,000",
        flag: "https://flagcdn.com/in.svg"
    },
    "CHN": {
        capital: "Beijing",
        population: "1,440,000,000",
        flag: "https://flagcdn.com/cn.svg"
    },
    "BRA": {
        capital: "Brasília",
        population: "215,000,000",
        flag: "https://flagcdn.com/br.svg"
    },
    "AUS": {
        capital: "Canberra",
        population: "26,000,000",
        flag: "https://flagcdn.com/au.svg"
    },
    "ZAF": {
        capital: "Pretoria (executive), Bloemfontein (judicial), Cape Town (legislative)",
        population: "60,000,000",
        flag: "https://flagcdn.com/za.svg"
    },
    "JPN": {
        capital: "Tokyo",
        population: "125,000,000",
        flag: "https://flagcdn.com/jp.svg"
    },
    "ARE": { // United Arab Emirates - since you're there!
        capital: "Abu Dhabi",
        population: "9,900,000",
        flag: "https://flagcdn.com/ae.svg"
    }
    // ... add more countries here as needed, using their ISO 3166-1 alpha-3 codes as keys
};


// Function to update the info panel
function updateInfoPanel(properties, isHover = true) {
    let content = '<p>Hover over a country to see details, or click to lock information.</p>';
    if (properties && properties.name) {
        const countryCode = properties.iso_a3; // ISO 3-letter code from GeoJSON
        const data = countryData[countryCode];

        if (data) {
            content = `
                <h3><img src="${data.flag}" alt="Flag of ${properties.name}"> ${properties.name}</h3>
                <p><strong>Capital:</strong> ${data.capital}</p>
                <p><strong>Population:</strong> ${data.population}</p>
            `;
        } else {
            content = `
                <h3>${properties.name}</h3>
                <p>No detailed data available for this country yet.</p>
            `;
        }
    }

    if (isHover && clickedLayer) {
        // If there's a clicked layer, don't update on hover
        // unless it's the same country being hovered over again
        if (properties && clickedLayer.feature.properties.iso_a3 === properties.iso_a3) {
             infoPanel.innerHTML = content;
        }
        // else, keep the clicked country's info
    } else {
        infoPanel.innerHTML = content;
    }
}

// Reset the panel to default
function resetInfoPanel() {
    if (!clickedLayer) { // Only reset if no country is clicked
        infoPanel.innerHTML = '<p>Hover over a country to see details, or click to lock information.</p>';
    }
}

// Style for countries
function style(feature) {
    return {
        fillColor: '#80bfff', // Light blue
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

// Highlight style on hover
function highlightFeature(e) {
    const layer = e.target;

    if (clickedLayer && layer === clickedLayer) return; // Don't re-highlight if it's the clicked layer

    layer.setStyle({
        weight: 3,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.9
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    updateInfoPanel(layer.feature.properties, true);
}

// Reset highlight
function resetHighlight(e) {
    const layer = e.target;
    if (clickedLayer && layer === clickedLayer) return; // Don't reset if it's the clicked layer

    countriesLayer.resetStyle(layer); // Use the original style defined by countriesLayer
    resetInfoPanel(); // Reset info panel if nothing is clicked
}

// Click to lock info
function clickFeature(e) {
    const layer = e.target;

    if (clickedLayer) {
        countriesLayer.resetStyle(clickedLayer); // Reset previous clicked layer's style
    }

    clickedLayer = layer; // Set the new clicked layer

    layer.setStyle({
        weight: 3,
        color: '#000', // Darker border on click
        dashArray: '',
        fillOpacity: 1,
        fillColor: '#007bff' // Deeper blue on click
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    updateInfoPanel(layer.feature.properties, false); // Lock info, no longer a hover
}

// Add listeners for each country
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: clickFeature
    });
}

let countriesLayer; // To store the GeoJSON layer for easier style resets

// 3. Fetch GeoJSON data for world countries
// Using a simplified world countries GeoJSON from a public source
// For a production app, you might host this yourself or use a more robust API
fetch('https://raw.githubusercontent.com/datasets/geo-countries/main/data/countries.geojson')
    .then(response => response.json())
    .then(data => {
        countriesLayer = L.geoJson(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
    })
    .catch(error => {
        console.error('Error loading the GeoJSON data:', error);
        infoPanel.innerHTML = '<p style="color: red;">Error loading map data. Please try again later.</p>';
    });

// Event listener for map clicks to deselect a country
map.on('click', function(e) {
    // If the click wasn't on a country feature, reset the clicked layer
    if (clickedLayer && !e.originalEvent.target.closest('.leaflet-interactive')) {
        countriesLayer.resetStyle(clickedLayer);
        clickedLayer = null;
        resetInfoPanel();
    }
});