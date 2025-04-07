var map = L.map('map-container').setView([44.31, -69.78], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const fileInput = document.getElementById("file-upload");


fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (file) {
        const validTypes = [
            'application/vnd.ms-excel', // .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'text/csv', // .csv
            'text/plain',
            'application/gpx+xml', // .gpx
            'application/geo+json', // .geojson
        ];

        const fileType = file.type;
        console.log("Filetype:" + fileType)

        if (!validTypes.includes(fileType)) {
            alert("Invalid file type. Please upload a .csv, .xls, .xlsx, .gpx, or .geojson file.");
            return;
        }
        console.log("Filetype valid")

        const maxFileSize = 1 * 1024 * 1024; // 1MB
        if (file.size > maxFileSize) {
            alert("File is too large. Please upload a file smaller than 1MB.");
            return;
        }

        console.log("File size valid")
        handleCSV(file);

        // Proceed with file processing (parse content)
        // switch (fileType) {
        //     case 'text/csv':
        //         console.log("Handling .txt/.csv")
        //         handleCSV(file);
        //         break;
        //     case 'text/plain':
        //         console.log("Handling text/plain")
        //         handleCSV(file);
        //         break;
        //     case 'application/vnd.ms-excel':
        //         console.log("Handling excel")
        //         handleCSV(file);
        //         break;
        //     case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        //         console.log("Handling excel")
        //         handleXLSX(file);
        //         break;
        //     default:
        //         alert("Unsupported file banana: " + fileType);
        //         console.log("Handling invalid filetype")
        //         break;
        // }
    }
});

function handleCSV(file) {
    Papa.parse(file, {
        complete: function (results) {
            const zipCodes = results.data[0];
            const sanitizedZips = zipCodes
            .map(zip => String(zip).replace(/\s+/g, ''))
            .filter(zip => zip.length > 0);
            
            fetchPolygonsForZipCodes(sanitizedZips);
        },
        header: false
    });
}

function fetchPolygonsForZipCodes(zipCodes) {
    clearPolygons()
    zipCodes.forEach(zipCode => {
        const polygons = getPolygonsByZip(zipCode); 
        polygons.forEach(polygon => {
            plotPolygon(polygon); 
        });
    });
}

let currentPolygons = [];
function plotPolygon(polygonData) {
    polygonData.forEach(ring => {
        const corrected = ring.map(([lon, lat]) => [lat, lon]);  // Correcting coordinates order
        const polygon = L.polygon(corrected, {
            color: 'blue',
            weight: 3,
            opacity: 0.5
        }).addTo(map);

        currentPolygons.push(polygon);
    });
}

let polygonJsonData = []; 

function clearPolygons() {
    currentPolygons.forEach(p => map.removeLayer(p));
    currentPolygons = [];
}

function getPolygonsByZip(zipCode) {
    const matches = polygonJsonData.filter(entry => entry.zip === zipCode);
    return matches.flatMap(entry => entry.polygons); 
}

fetch("MaineBorderData.zip")
    .then(res => res.arrayBuffer())
    .then(JSZip.loadAsync)
    .then(zip => zip.file("MaineBorderData.json").async("string"))
    .then(jsonText => {
        polygonJsonData = JSON.parse(jsonText);
        console.log("Loaded polygons.");
    });

