var orders1 = [];
const nodemailer = require('nodemailer');
const mysql = require('mysql');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shell',
});
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

var scopes, product, hauliers;
db.query("SELECT * FROM scopes", function (err, result, fields) {
    if (err) throw err;
    scopes = result;
});
db.query(`SELECT p1.*
FROM 
    product p1
INNER JOIN (
    SELECT 
        name, 
        MIN(id) AS min_id
    FROM 
        product
    GROUP BY 
        name
) p2 ON p1.id = p2.min_id;`, function (err, result, fields) {
    if (err) throw err;
    product = result;
});
db.query("SELECT * FROM hauliers h JOIN haulier_email he on h.id =he.haulier_id;", function (err, result, fields) {
    if (err) throw err;
    hauliers = result;
});



const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
function generatePDF1(outputPath, json, pre) {
    // pre=false;
    console.log("pre", pre);
    console.log("json1", json);

    orders1 = json

    console.log("orders1", orders1)
    var stream;
    // const stream = fs.createWriteStream(outputPath);
    console.log("Samad");


    function transformOrders(orders) {
        let result = {
            am: {},
            pm: {}
        };

        // Iterate over each shift type ('am', 'pm')
        for (let shift in orders) {
            // Iterate over each vehicle in the shift
            orders[shift].forEach(vehicle => {
                let haulier = vehicle.gsap_haulier;

                // Initialize the haulier object if it doesn't exist
                if (!result[shift][haulier]) {
                    result[shift][haulier] = [];
                }

                // Add the vehicle data to the haulier object
                result[shift][haulier].push({
                    name: vehicle.name,
                    // You can add other vehicle properties as needed
                    ...vehicle
                });
            });
        }

        return result;
    }

    function convertMinutesToTime(minutes) {
        const hours = Math.floor(minutes / 60); // Get the number of hours
        const remainingMinutes = minutes % 60;  // Get the remaining minutes

        // Pad the minutes with leading zero if needed
        const formattedMinutes = remainingMinutes < 10 ? `0${remainingMinutes}` : remainingMinutes;

        return `${hours}:${formattedMinutes}`;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);

        const month = date.getMonth() + 1; // Months are zero-based, so add 1
        const day = date.getDate();
        const year = date.getFullYear();

        return `${month}/${day}/${year}`;
    }


    function truncateText(text, maxLength = 30) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength);
    }
    function getCurrentDateTime() {
        const now = new Date();

        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based in JS
        const day = now.getDate().toString().padStart(2, '0');
        const year = now.getFullYear();

        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');

        return `${month}${day}${year}${hours}${minutes}${seconds}`;
    }

    const hauliers_pdfs = 'hauliers_pdfs/'; // Replace with the correct path

    // Set up Nodemailer transporter (configure with your email service)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'abdulsamadq67@gmail.com', // Replace with your Gmail address
            pass: 'gsvsovyyrycvbbst' // Replace with your Gmail password or app password
        }
    });
    function sendfiles(to, fname) {
        const hauliers_pdfs = 'hauliers_pdfs/';  // Define the path to the directory

        // Return a promise so the caller can handle the result
        return new Promise((resolve, reject) => {
            if (!fname || !to || !hauliers_pdfs) {
                return reject({ message: 'Invalid input: Missing file name, recipient, or directory path.' });
            }

            // Read all files in the hauliers_pdfs directory
            fs.readdir(hauliers_pdfs, (err, files) => {
                if (err) {
                    return reject({ message: 'Failed to read directory', error: err });
                }

                // Filter files that match the pattern "fname"
                const attachments = files
                    .filter(file => file.includes(fname))
                    .map(file => ({
                        filename: file,
                        path: path.join(hauliers_pdfs, file)
                    }));

                if (attachments.length === 0) {
                    return reject({ message: 'No matching files found for the provided name.' });
                }

                // Set up email options
                const mailOptions = {
                    from: 'abdulsamadq67@gmail.com', // Replace with your email
                    to: to,
                    subject: 'Files Attached', // Default subject
                    text: 'Please find the attached files.', // Default text
                    attachments: attachments
                };

                // Send the email with attachments
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return reject({ message: 'Failed to send email', error });
                    }
                    return { message: 'Email sent successfully', info };
                    resolve({ message: 'Email sent successfully', info });
                });
            });
        });
    }
    function calculateTimeDifference(startTimeStr, endTimeStr) {
        // Convert endTimeStr to a Date object
        let endTime = new Date(endTimeStr);
    
        // Extract the time from startTimeStr and set it to a temporary Date object
        let [startHours, startMinutes] = startTimeStr.split(":");
        let startTime = new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate(), startHours, startMinutes);
    
        // Calculate the time difference in milliseconds
        let timeDifference = endTime - startTime;
    
        // Convert the difference to hours and minutes
        let diffHours = Math.floor(timeDifference / (1000 * 60 * 60)); // 1 hour = 1000 * 60 * 60 milliseconds
        let diffMinutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60)); // Remaining minutes
    
        // Ensure hours and minutes are formatted with two digits
        let formattedHours = String(diffHours).padStart(2, "0");
        let formattedMinutes = String(diffMinutes).padStart(2, "0");
    
        // Return the time difference in HH:mm format
        return `${formattedHours}:${formattedMinutes}`;
    }

    function presend() {

        // orders1 = localStorage.getItem('orders');
        transformedOrders = transformOrders(orders1);
        console.log("transform orders", transformedOrders)
        loopThroughResult(transformedOrders);
    }

    // Example output: "09042023153045"
    function convertTo24Hour(timeString) {
        let [time, modifier] = timeString.trim().split(' ');
        let [hours, minutes] = time.split(':');
      
        // Convert to 24-hour format
        if (modifier === 'PM' && hours !== '12') {
          hours = parseInt(hours, 10) + 12;
        } else if (modifier === 'AM' && hours === '12') {
          hours = '00';
        }
      
        // Return formatted time in HH:MM format
        return `${hours}:${minutes}`;
      }



    // Call the function to transform orders
    // let transformedOrders = transformOrders(orders);



    async function loopThroughResult(result) {

        // Loop through each shift ('am', 'pm')
        for (let shift in result) {
            console.log(`Shift: ${shift}`);

            // Loop through each haulier in the shift
            for (let haulier in result[shift]) {
                console.log(`Haulier: ${haulier}`);
                console.log('Trip Shift:');

                // Create a new PDF document
                const doc = new PDFDocument({
                    size: [800, 850], // Custom size
                    margin: 40
                });
                filename = "Shift_" + shift + haulier + getCurrentDateTime();
                // Define file name and path
                // path.join(__dirname, 'output_' + haulier+ '.pdf');

                const fileName = path.join('hauliers_pdfs/' + filename + '.pdf');
                console.log(`Saving PDF to: ${fileName}`);
                stream = fs.createWriteStream(fileName)
                // Save the PDF to a file
                doc.pipe(stream)

                // Track if this is the first vehicle to manage page breaks correctly
                let isFirstVehicle = true;

                result[shift][haulier].forEach((vehicle, vehicleIndex) => {
                    console.log(`Vehicle Name: ${vehicle.name}`);
                    console.log(`Tractor Code: ${vehicle.tractor_code}`);
                    console.log('vehicleIndex', vehicleIndex);

                    // Add a new page for each vehicle except the first one
                    if (!isFirstVehicle) {
                        console.log(`  Adding new page for vehicle index: ${vehicleIndex}`);
                        doc.addPage();



                    } else {
                        isFirstVehicle = false;
                    }

                    // Document content starts here

                    var x = 100; // X position on the page
                    var y = 0;
                    var y1 = 100;
                    var tripline = 0;
                    var tripline1 = 0;
                    var tripbl = 0;
                    var tripbl1 = 10;
                    var etal = 0;
                    var etabl = 0;
                    var etal1 = 25;
                    var etabl1 = 38;
                    var chead = 0;
                    var chead1 = 18;
                    var total_time = 0;
                    var amp = 85;
                    var amq = 85;
                    var amp1 = 95;
                    var amq1 = 95;
                    var amps = 62;
                    var tripheight = 80;
                    var tripheight1 = 60;
                    var amenheight = 85;
                    var etas = 102;
                    var order_array = [];
                    var total = 0

                    scope = scopes.find(sc => sc.id == vehicle.scope)
                    
                    let order_eta = vehicle.trips[0].orders[0]['order_eta'].split(',')[0]; // "10/1/2024"
                    let order_etatime = vehicle.trips[0].orders[0]['order_eta'].split(',')[1]; // "10/1/2024"
                    

                    // First Line: Date, PM, Chaklala with alignment
                    doc.fontSize(14).font('Helvetica-Bold').text(order_eta, 20, 20, { width: 410 })
                        .text(vehicle.shift.toUpperCase(), 270, 20, { width: 410, align: 'left', continued: true })
                        .text(scope.name, 330, 20, { align: 'left', continued: true });

                    // Right column: Fax and Tel Numbers with input fields
                    doc.fontSize(10).font('Helvetica-Bold').text('Fax Number: +', 230, 17, { align: 'right' })
                        .text('Tel Number: +', 572, 30);

                    // Draw input fields for Fax and Tel numbers
                    doc.rect(570, 15, 200, 12).stroke(); // Fax Number input field
                    doc.rect(570, 28, 200, 12).stroke(); // Tel Number input field
                    vehicle.trips.forEach((trip, index) => {
                        total_time += trip.endtriptime
                    })
                    hauliername = hauliers.find(h => h.haulier_id == haulier)

                    // Subheader with shading
                    doc.rect(20, 50, 750, 20).fill('#C0C0C0');
                    doc.fillColor('#000').fontSize(10).font('Helvetica-Bold')
                        .text(vehicle.name, 30, 57, { continued: true })  // Padding right
                        .text('Total Hours: ' + calculateTimeDifference(vehicle.start_time,vehicle.trip_end_time), 70, 57, { align: 'left', continued: true })  // Padding right
                        .text(hauliername.haulier_name, 190, 57, { align: 'left' });

                    // Iterate over each trip within the vehicle
                    vehicle.trips.forEach((trip, index) => {
                        doc.moveDown(1);
                        console.log(`Trip: ${index}`); // Log trip index for debugging

                        // Set the starting position for the trip line
                        let tripline1 = doc.y;

                        console.log("Trip end Time", trip.endtriptime)
                        doc.fontSize(8)
                            .font('Helvetica-Bold')
                            .fillColor('#000')
                            .text(`Trip: ${trip.trip_no}            ${order_eta} ${trip.start_time}          ${shift.toUpperCase()}            ${vehicle.start_location}              ${(pre == "true" ? "Shipment:" + trip.shipment_no : "")}             Distance: ${trip.total_distance}           Duration: ${calculateTimeDifference(trip.start_time,trip.end_time)}` + index, 20, tripline1);

                        // Move down to create some space after the trip details
                        doc.moveDown(1);

                        // Draw a horizontal line below the trip details
                        doc.moveTo(20, doc.y).lineTo(535, doc.y).stroke();

                        // Move down again to create space for the next section
                        doc.moveDown(1);

                        // Set the starting position for the ETA section
                        let etal = doc.y;

                        doc.fontSize(8)
                            .font('Helvetica-Bold')
                            .text('ETA Date            ETA Time         Customer                                                      Ship To                          Order', 50, etal - 5);

                        doc.save().strokeColor('#A9A9A9')

                            .rect(20, etal - 5, 20, 10).stroke()
                            .restore();
                        // Draw a horizontal line below the ETA section
                        doc.moveTo(20, doc.y).lineTo(770, doc.y).stroke();



                        // Horizontal Line with vertical text
                        doc.save() // Save the current state
                            .translate(x, y1) // Move the origin to (x, y)
                            .rotate(90, { origin: [x, y1] }) // Rotate 90 degrees around the new origin
                            .text("Trailer", chead - chead1, -245, { lineBreak: false }) // Write the text at the new origin, adjusted for rotation
                            .text("Comp", chead - chead1, -260, { lineBreak: false }) // Write the text at the specified coordinates, adjusted for rotation
                            .text("Product", chead - chead1, -278, { lineBreak: false })
                            .text("Quantity", chead - chead1, -390, { lineBreak: false })
                            .text("Site Tank", chead - chead1, -463, { lineBreak: false }) // Write the text at the new origin, adjusted for rotation
                            .restore(); // Restore the previous state

                        chead1 = 0;


                        console.log("chead", doc.y, tripheight)

                        doc.fontSize(8).font('Helvetica-Bold')
                            .text('Amended ', 620, amenheight)
                            .text('Product', 620, amenheight + 10);
                        amp += 75;
                        amp1 += 75;

                        doc.fontSize(8).font('Helvetica-Bold')
                            .text('Amended ', 700, amenheight)
                            .text('Quantity', 700, amenheight + 10);

                        amq += 75;
                        amq1 += 75;
                        amps += 60;

                        // Iterate over each order within the trip
                        trip.compartmentsu.forEach(comp => {
                            // Log order ID for debugging

                            // Find the corresponding compartment based on orderId
                            var order = trip.orders.find(order => order.Order == comp.order_id);
                            var orderetadate= order.order_eta.split(',')[0]
                            let order_etatime = order.order_eta.split(',')[1];
                                    

                            // Ensure compartment is found before using it
                            if (order) {
                                doc.fontSize(8).font('Helvetica')
                                    .text(orderetadate, 50, amps)
                                    .text(convertTo24Hour(order_etatime), 120, amps)
                                    .text(truncateText(order.Name), 165, amps)
                                    .text(order.ShipTo, 320, amps)
                                    .text(order.Order, 400, amps)
                                    .image(`telephone.png`, 480, amps, { width: 10 });

                                // order_array.push(order.orderId);
                                products = product.find(pro => pro.code == comp.product_id);
                                // Use the compartment details
                                doc.text(1, 540, amps)
                                    .text(comp.compartment_no, 555, amps)
                                    .text(products.name, 570, amps) // Adjust this if necessary
                                    .text(comp.size, 670, amps) // Adjust this if necessary
                                    .text(1, 760, amps);

                                doc.moveTo(535, amps + 12).lineTo(770, amps + 12).stroke();
                                doc.save().strokeColor('#A9A9A9')
                                    .rect(620, amps, 40, 12).stroke()
                                    .rect(700, amps, 40, 12).stroke()

                                    .restore();

                                amps += 20;
                                total += parseInt(comp.size, 10);
                            } else {
                                // console.log(`No compartment found for Order ID: ${order.orderId}`); // Log if no compartment is found
                            }
                        });



                        doc.font('Helvetica-Bold').text('Total', 540, amps)
                            .text(total, 670, amps);

                        doc.save().lineWidth(2) // Set the line width to 2 points (adjust as needed)
                            .moveTo(20, amps + 10) // Move to the starting point
                            .lineTo(770, amps + 10) // Draw the line to the endpoint
                            .stroke()
                            .restore();

                        amenheight = amps + 20;
                        chead = amps - 80
                        tripheight = doc.y;
                        console.log('tripheight', tripheight)
                        tripheight1 = 0;







                    });

                });

                doc.end();

                haulierdata = hauliers.filter(h => h.haulier_id == haulier)



                var trimmedPath = fileName.replace('hauliers_pdfs\\', '');
                console.log("SOMI", fileName);
                haulierdata.forEach(hd => {


                    stream.on('finish', () => {
                        // Now read the file into a buffer
                        fs.readFile(fileName, (err, data) => {
                            if (err) {
                                console.error("Failed to read PDF file", err);
                                return;
                            }

                            // haulierdata = hauliers.filter(h => h.haulier_id == includes(haulier));
                            var trimmedPath = fileName.replace('hauliers_pdfs\\', '');

                            const mailOptions = {
                                from: 'abdulsamadq67@gmail.com',
                                to: hd.email,
                                subject: 'Files Attached',
                                text: 'Please find the attached files.',
                                attachments: [{
                                    filename: trimmedPath,
                                    content: data, // Use the buffer
                                    contentType: 'application/pdf',
                                }]
                            };

                            // Send the email with attachments
                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    console.error('Failed to send email', error);
                                    return;
                                }
                                console.log('Email sent successfully', info);
                            });
                        });
                    });
                })

            }
        }

        return { status: "OK" };


    }
    presend();

    return new Promise((resolve, reject) => {
        stream.on('finish', () => {

            resolve(outputPath);
            return outputPath;
        });
        stream.on('error', (err) => {
            reject(err);
            return err;
        });
    });



}



module.exports = generatePDF1;


