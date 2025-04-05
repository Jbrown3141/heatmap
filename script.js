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
        console.log("Filetype valid")

        // Validate file size (e.g., limit to 1MB)
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
        const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Read the first sheet
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Get data as an array of arrays
        const zipCodes = json.map(row => row[0]); // Assuming Zip Codes are in the first column
        fetchPolygonsForZipCodes(zipCodes);
    };
    reader.readAsArrayBuffer(file);
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

let polygonJsonData = []; // This will be loaded from your JSON file

function getPolygonsByZip(zipCode) {
    // Filter the JSON data for entries with the matching zip code
    const matches = polygonJsonData.filter(entry => entry.zip === zipCode);
    // Return the list of polygons associated with that zip code
    console.log(matches)
    return matches.flatMap(entry => entry.polygons);  // Flatten the list of polygons
}

// Load the JSON data once at startup
// fetch("https://github.com/Jbrown3141/heatmap/releases/download/v0.1.0-alpha/MaineBorderData.json")
//     .then(response => response.json())
//     .then(data => {
//         polygonJsonData = data;
//     })
//     .catch(error => {
//         console.error('Error loading polygon data:', error);
//     });

fetch("MaineBorderData.zip")
    .then(res => res.arrayBuffer())
    .then(JSZip.loadAsync)
    .then(zip => zip.file("MaineBorderData.json").async("string"))
    .then(jsonText => {
        polygonJsonData = JSON.parse(jsonText);
        console.log("Loaded polygons.");
    });

