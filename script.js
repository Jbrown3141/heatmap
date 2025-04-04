var map = L.map('map-container').setView([44.31, -69.78], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const fileInput = document.getElementById("file-upload");


fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (file) {

        // Validate file type
        const validTypes = [
            'application/vnd.ms-excel', // .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'text/csv', // .csv
            'application/gpx+xml', // .gpx
            'application/geo+json', // .geojson
        ];

        const fileType = file.type;
        console.log("Filetype:" + fileType)

        // Check if file type is valid or check file extension for .txt
        if (!validTypes.includes(fileType)) {
            alert("Invalid file type. Please upload a .csv, .xls, .xlsx, .gpx, or .geojson file.");
            return;
        }
        // console.log("Filetype valid")

        // Validate file size (e.g., limit to 1MB)
        const maxFileSize = 1 * 1024 * 1024; // 1MB
        if (file.size > maxFileSize) {
            alert("File is too large. Please upload a file smaller than 1MB.");
            return;
        }

        console.log("File size valid")

        // Proceed with file processing (parse content)
        switch (fileType) {
            case 'text/csv':
                // console.log("Handling .txt/.csv")
                handleCSV(file);
                break;
            case 'application/vnd.ms-excel':
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                // console.log("Handling .xls/.xlsx")
                handleXLSX(file);
                break;
            case 'application/geo+json':
                // console.log("Handling .geojson")
                handleGeoJSON(file);
                break;
            case 'application/gpx+xml':
                // console.log("Handling .gpx")
                handleGPX(file);
                break;
            default:
                alert("Unsupported file type.");
                // console.log("Handling invalid filetype")
                break;
        }
    }
});

function handleCSV(file) {
    Papa.parse(file, {
        complete: function (results) {
            const zipCodes = results.data[0];  // Assuming zip codes are in the first row
            fetchPolygonsForZipCodes(zipCodes);  // Fetch and plot polygons for all zip codes
        },
        header: false
    });
}

function handleXLSX(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const zipCodes = json.map(row => row[0]);
        fetchPolygonsForZipCodes(zipCodes);
    };
    reader.readAsArrayBuffer(file);
}

function handleGeoJSON(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const geojson = JSON.parse(event.target.result);
        const zipCodes = geojson.features.map(feature => feature.properties.zip_code);
        fetchPolygonsForZipCodes(zipCodes);
    };
    reader.readAsText(file);
}

function handleGPX(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(event.target.result, "text/xml");
        const trkpts = xmlDoc.getElementsByTagName("trkpt");
        const zipCodes = Array.from(trkpts).map(trkpt => trkpt.getAttribute("zip"));
        fetchPolygonsForZipCodes(zipCodes);
    };
    reader.readAsText(file);
}

function fetchPolygonsForZipCodes(zipCodes) {
    zipCodes.forEach(zipCode => {
        const polygons = getPolygonsByZip(zipCode);  // Get polygons for this zip code
        polygons.forEach(polygon => {
            plotPolygon(polygon);  // Plot each polygon
        });
    });
}

function plotPolygon(polygonData) {
    // Loop through the list of polygons and plot each one
    polygonData.forEach(ring => {
        const corrected = ring.map(([lon, lat]) => [lat, lon]);  // Correcting coordinates order
        L.polygon(corrected, {
            color: 'blue',
            weight: 3,
            opacity: 0.5
        }).addTo(map);
    });
}

document.getElementById('generate-coordinates').addEventListener('click', function () {
    plotPolygon(bangorPoly)
});

let polygonJsonData = []; // This will be loaded from your JSON file

function getPolygonsByZip(zipCode) {
    // Filter the JSON data for entries with the matching zip code
    const matches = polygonJsonData.filter(entry => entry.zip === zipCode);
    // Return the list of polygons associated with that zip code
    console.log(matches)
    return matches.flatMap(entry => entry.polygons);  // Flatten the list of polygons
}

// Load the JSON data once at startup
fetch("MaineBorderData.json")
    .then(response => response.json())
    .then(data => {
        polygonJsonData = data;
    })
    .catch(error => {
        console.error('Error loading polygon data:', error);
    });
