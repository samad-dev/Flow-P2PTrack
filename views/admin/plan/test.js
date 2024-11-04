function formatGeocoordinates(coordinateString) {
    // Split the string by spaces to get individual coordinates
    const coordinates = coordinateString.split('	');

    let formattedCoordinates = '';

    // Iterate through the list two elements at a time (lat, lng)
    for (let i = 0; i < coordinates.length; i += 2) {
        formattedCoordinates += `${coordinates[i]},${coordinates[i + 1]}`;

        // If not the last pair, add a semicolon
        if (i + 2 < coordinates.length) {
            formattedCoordinates += ';';
        }
    }

    return formattedCoordinates;
}

// Example usage:
const geocoordinateString ="24.6505399	68.54230843	24.64554723	68.54205093	24.62651087	68.55295143	24.61792796	68.55758629	24.60801786	68.5581871	24.60029212	68.56745682	24.58226354	68.57792816	24.56376399	68.588657";
const result = formatGeocoordinates(geocoordinateString);
console.log(result); // Output: "35.48774,72.58397;35.48769,72.58401;35.48769,72.58401"
