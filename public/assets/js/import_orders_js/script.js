document.getElementById('fileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function () {
        const text = reader.result;
        // const orders = decodeOrders(text);
        text1 = text;
        // document.getElementById('output').textContent = JSON.stringify(orders, null, 2);
    };

    reader.readAsText(file);
});
$('<style>')
.prop('type', 'text/css')
.html('table.dataTable tbody td.select-checkbox:before, table.dataTable tbody td.select-checkbox:after { visibility: hidden; } ' +
    'table.dataTable tbody>tr.selected td { color: #fffff; background-color: #007bff; }')
.appendTo('head');

document.getElementById('decodeButton').addEventListener('click', function () {
    const text = text1;
    orders1 = decodeOrders(text);
    console.log("orders1", orders1)
    const file = document.getElementById('fileInput').files[0];
    if (file) {
        const fileName = file.name;
        const index = fileName.indexOf("ORDERS_0");

        if (index !== -1) {
            const extractedNumber = fileName.slice(index + 8, index + 11);
            var settings = {
                "url": "scope_detail/" + extractedNumber,
                "method": "GET",
                "timeout": 0,
            };

            $.ajax(settings).done(function (response) {
                var lcscope = localStorage.getItem('scope')
                if (response[0]['scope_id'] == lcscope) {
                    var orderIds = orders1.map(ord => ord.orderId);



                    // Convert orderIds array to a comma-separated string
                    var orderIds = orders1.map(ord => ord.orderId);

                    // Convert orderIds array to a comma-separated string
                    var orderIdsString = orderIds.join(',');


                    // Define the settings for the AJAX request
                    var settings = {
                        "url": "orders_log",  // Base URL for the endpoint
                        "method": "GET",      // HTTP method for the request
                        "timeout": 0,         // Timeout setting
                        "data": {
                            "orderId": orderIdsString  // Pass the orderIds as a query parameter
                        }
                    };

                    // Make the AJAX request using jQuery
                    $.ajax(settings).done(function (response) {
                        // Extract order_id from response array
                        var responseOrderIds = response.map(res => res.orderId);

                        // Filter out orders that do not exist in the response
                        orders = orders1.filter(ord => !responseOrderIds.includes(ord.orderId));
                        ordertbl = orders1.filter(ord => responseOrderIds.includes(ord.orderId));
                        totalorders = orders1.length;
                        failedorders = response.length;
                        successfull = totalorders - failedorders

                        orders.forEach(order => {
                            order["status"] = "NotScheduled";
                        });

                        // Call your unscheduled_orderlist function to update the view
                        unsheduled_orderlist(orders, 1);

                        // Display JSON data in 'output' element
                        document.getElementById('output').textContent = JSON.stringify(orders, null, 2);

                        // Show modal if response length is greater than 0
                        // if (response.length > 0) {
                        // Generate a table with response data
                        let table = '<table class="table table-striped table-centered mb-0" style="height"><thead><tr><th>Order ID</th><th>Ship To</th><th>Customer Name</th><th>Order Date</th><th>Product</th><th>Target</th><th>City</th></tr></thead><tbody>';

                        // Loop through the response to build table rows


                        ordertbl.forEach(function (item) {
                            table += `<tr><td>${item.orderId}</td><td>${item.shipTo}</td><td>${item.customerName}</td><td>${formatDate(item.date)}</td><td>${item.materialCode}</td><td>${item.target}</td><td>${item.city}</td></tr>`;
                        });

                        table += '</tbody></table>';

                        // Add the table to the modal body
                        $('#modalBody').html(table);

                        // Show Bootstrap modal
                        $('#myModal').modal('show');
                        $('#totals').html(`<h5 style="font-size:0.71rem;">Total Orders: <span>${totalorders}</span></h5><h5 style="font-size:0.71rem;">Failed Orders: <span>${failedorders}</span></h5><h5 style="font-size:0.71rem;">SuccessFull Orders: <span>${successfull}</span></h5>`)
                        // }

                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        // Handle errors here
                        console.error("Request failed:", textStatus, errorThrown);
                    });

                    $('tr td').css({
                        'padding': '0.5em 1em 0.5em 1em'
                    });
                
                } else {
                    $.toast({
                        heading: 'Invalid Orders',
                        text: 'Orders cannot Import from other scope!',
                        position: 'top-right',
                        showHideTransition: 'slide',
                        icon: 'error',
                        stack: false
                    });
                    console.log("Invalid Orders");

                }
            })
            console.log(extractedNumber); // Output the extracted number
        } else {
        }
    }






    // console.log(orders)
    // console.log(text)
    // Populate DataTable with orders data
    // table = $('#ordersTable').DataTable({
    //     columnDefs: [{
    //         orderable: false,
    //         className: 'select-checkbox',
    //         targets: 0
    //     }],
    //     select: {
    //         style: 'multi',
    //         selector: 'td:first-child'
    //     },
    //     order: [[1, 'asc']]
    // });
    // table.clear().draw();


    // orders.forEach(order => {
    //     console.log(order.shipTo);
    //     // alert("1")
    //     $('#order_card').append(`<div class="col-md-3" >

    //     <div class="card" >
    //         <div class="row bg-dark-subtle" style="margin-left: 0;margin-right: 0;">
    //             <div class="col-8">

    //                 <h5 class="card-header ">Order# `+ order.orderId + `</h5>
    //             </div>

    //             <div class="col-4 d-flex flex-row  justify-content-end" style="align-items: center;">

    //             <div class="form-check">
    //             <input type="checkbox" class="form-check-input"  id="customCheckcolor1" data-id="`+ order.orderId + `" >

    //         </div>
    //             <div class="card-widgets">

    //                 <a data-bs-toggle="collapse" href="#`+ order.orderId + `" role="button" aria-expanded="true" aria-controls="cardCollpase1" class=""><i class="ri-subtract-fill"></i></a>

    //             </div>
    //             </div>
    //         </div>
    //         <div class="card-body collapse show" id="`+ order.orderId + `">
    //             <h5 class="card-title"><i class="ri-account-circle-fill"></i>`+ order.customerName + `</h5>
    //             <div class="row">
    //                 <div class="col-6 cad-text">
    //                     <i class="ri-arrow-right-circle-fill"></i>`+ order.shipTo + `
    //                 </div>
    //                 <div class="col-6 cad-text d-flex flex-row justify-content-end">
    //                     <i class="ri-calendar-fill"></i>
    //                     <p>`+ formatDate(order.date) + `</p>
    //                 </div>
    //             </div>

    //             <div class="row mb-2">
    //                 <div class="col-6 cad-text">
    //                     <i class="ri-parking-fill"></i> `+ order.materialCode + `
    //                 </div>
    //                 <div class="col-6 cad-text d-flex flex-row justify-content-end">
    //                     <i class="ri-bubble-chart-fill"></i>`+ order.target + ` Ltr.
    //                 </div>
    //             </div>
    //             <div class="row">
    //                 <div class="col-6 cad-text">
    //                     <i class="ri-road-map-fill"></i> `+ order.address + `
    //                 </div>
    //                 <div class="col-6 cad-text d-flex flex-row justify-content-end">
    //                     <i class="ri-building-2-fill"></i>`+ order.city + `
    //                 </div>
    //             </div>
    //             <div class="row mt-3" >
    //             <div style="display:flex;justify-content:center;">
    //             <button class="btn btn-primary" data-bs-toggle="modal"
    //             data-bs-target="#modal" onclick="order_details(`+ order.orderId + `)">More Details</button>
    //             </div>
    //             </div>
    //             <!-- <a href="javascript: void(0);" class="btn btn-primary">Go somewhere</a> -->
    //         </div> <!-- end card-body-->
    //     </div> <!-- end card-->
    // </div>`)
    //     // table.row.add([
    //     //     order.shipTo,
    //     //     order.customerName,
    //     //     order.address,
    //     //     order.city,
    //     //     order.orderId,
    //     //     order.dispatchNumber
    //     //     // Add more columns as needed
    //     // ]).draw();
    // });
    // $('#ordersTable tbody').on('click', 'tr', function () {
    //     // Toggle row selection class
    //     $(this).toggleClass('selected');
    // });
});
function sunsheduled_orderlist(orders) {
    let notScheduledOrders = orders.filter(order => order.status === "NotScheduled");
    console.log("notscheduled", notScheduledOrders);

    table.clear().draw();
    notScheduledOrders.forEach(order => {
        // Add order row
        order_row = table.row.add([
            order.orderId,
            order.shipTo,
            order.customerName,
            formatDate(order.date),
            order.materialCode,
            `<input type="number" class="form-control target-input" style="font-size:1em; padding: 0.3em 0.5em 0.3em 0.3em;" value="${order.target}" data-orderid="${order.orderId}" style="width: 100px;">`,
            order.city,
            order.address,
        ]).draw(false).node();

        // Add double-click event to open modal for order details
        $(order_row).dblclick(function () {
            order_details(order.orderId);
            openmodal(); // Redirect to customer_address with id as query parameter
        });
    });

    // Apply padding styles
    $('tr td').css({
        'padding': '0.5em 1em 0.5em 1em'
    });
    $('tfoot tr td').css({
        'padding-top': '0.2em',
        'padding-bottom': '0.2em'
    });
}


function unsheduled_orderlist(orders, parm = null) {
    var locscope = localStorage.getItem('scope')
    let notScheduledOrders = orders.filter(order => order.status === "NotScheduled");
    let ScheduledOrders = orders.filter(order => order.status === "Scheduled");


    let rows = []; // Store rows temporarily

    orders.forEach(order => {
        // Add order row to temporary rows array
        let order_row = [
            order.orderId,
            order.shipTo,
            order.customerName,
            formatDate(order.date),
            order.materialCode,
            `<input type="number" class="form-control target-input" style="font-size:1em; padding: 0.3em 0.5em 0.3em 0.3em;" value="${order.target}" data-orderid="${order.orderId}" style="width: 100px;">`,
            order.status,
            order.city

        ];

        rows.push(order_row);

        var form = new FormData();
        form.append("shipTo", order.shipTo);
        form.append("customerName", order.customerName);
        form.append("address", order.address);
        form.append("orderId", order.orderId);
        form.append("dispatchNumber", order.dispatchNumber);
        form.append("minQuantity", order.minQuantity);
        form.append("maxQty", order.maxQty);
        form.append("target", order.target);
        form.append("materialCode", order.materialCode);
        form.append("status", order.status);
        form.append("date", order.date);
        form.append("city", order.city);
        form.append("scope", locscope);

        var settings = {
            "url": "/in_temp_order",
            "method": "POST",
            "timeout": 0,
            "processData": false,
            "mimeType": "multipart/form-data",
            "contentType": false,
            "data": form
        };

        $.ajax(settings).done(function (response) {
            console.log(response);
        }).fail(function (xhr, textStatus, errorThrown) {
            console.error(xhr);
            console.error(textStatus);
            console.error(errorThrown);
        })

    });

    // Clear the table and add all rows in bulk
    table.clear().rows.add(rows).draw(false); // Add all rows at once

    // Apply double-click event to all new rows for order details
    $('#ordersTable tbody').on('dblclick', 'tr', function () {
        let data = table.row(this).data();
        order_details(data[0]); // Assumes orderId is in the first column
        openmodal(); // Redirect to customer_address with id as query parameter
    });

    // Apply padding styles after the rows have been added
    $('tr td').css({
        'padding': '0.5em 1em 0.5em 1em'
    });
    $('tfoot tr td').css({
        'padding-top': '0.2em',
        'padding-bottom': '0.2em'
    });

    ScheduledOrders.forEach(temp => {
        // alert(temp.orderId);
        $('#row-' + temp.orderId)
            .removeClass('selected') // Remove the 'selected' class
            .prop('disabled', true)  // Set the 'disabled' property
            .css({                   // Apply CSS styles
                'background-color': 'yellow',
                'color': 'white'
            });
        $('#row-' + temp.orderId).find('td').eq(-2).text('Scheduled');
        // orders[index].status = "Scheduled";

    })

   




}

// CSS for the input field to show only bottom border when focused
$('<style>')
    .prop('type', 'text/css')
    .html(`
        .target-input {
            border: none;
            border-bottom: 2px solid transparent;
            outline: none;
        }
        .target-input:focus {
            border-bottom: 2px solid #007bff; /* Add color as needed */
        }
    `).appendTo('head');

// Listen for 'blur' to hide the bottom border after editing
$(document).on('blur', '.target-input', function () {
    $(this).css('border-bottom', '2px solid transparent');
});

// Listen for the 'Enter' key to save and update the target in the JSON
$(document).on('keypress', '.target-input', function (e) {
    if (e.which === 13) { // Enter key
        let newTarget = $(this).val();
        let orderId = $(this).data('orderid');
        console.log("ordersId", orderId)
        // Find the order in the JSON and update the target value
        let orderToUpdate = orders.find(order => order.orderId == orderId);
        console.log("orderToUpdate", orderToUpdate)
        if (orderToUpdate) {
            alert("Quantity Updated")
            orderToUpdate.target = newTarget;

            console.log("Updated target for orderId", orderId, ":", newTarget);
            console.log("uporders", orderToUpdate);

            let check = orders.find(order => order.orderId == orderId);
            console.log("check", check, check.target)
            $(this).blur();
            table.draw(false);
        }
    }
});



function getSelectedData() {
    const selectedData = [];
    table.rows('.selected').every(function (rowIdx, tableLoop, rowLoop) {
        const data = this.data();
        // console.log(data);
        selectedData.push(data[0]);
    });
    return selectedData;
}

function openmodal() {
    $('#modal').modal('show')
}
// Event listener for button click to get selected data
$('#getDataButton').on('click', function () {
    const selectedData = getSelectedData();
    // console.log(selectedData); // Output selected data to console
    // If you want to send selected data to server, you can do it here
});

function decodeOrders(text) {
    const lines = text.split('\n');
    const orders = [];
    let currentOrder = null;
    const firstLine = text.split('\n')[0];

    // Extract the "379" from the first line
    const fname = firstLine.substring(8, 12);

    for (let i = 3; i < lines.length; i += 7) {
        // console.log(lines[i]);

        if (isStartOfOrder(lines[i]) == true && isEndOfOrder(lines[i]) == true) {

            if (currentOrder !== null) {
                orders.push(currentOrder);
            }

            currentOrder = {
                file_name: fname,
                shipTo: lines[i].substring(6, 15).trim(),
                customerName: lines[i].substring(16, lines[i].lastIndexOf('##')).trim(),
                address: lines[i + 1].substring(0, 36).trim(),
                city: lines[i + 1].substring(36).trim(),
                orderId: lines[i + 2].substring(2, 13).trim(),
                dispatchNumber: lines[i + 2].substring(67, 74).trim(),
                unknownValues: [lines[i + 3].substring(10, 12).trim(), lines[i + 3].substring(36, 39).trim(), lines[i + 3].substring(40, 42).trim()],
                date: lines[i + 4].substring(72).trim(),
                date2: lines[i + 5].substring(0, 6).trim(),
                dispatchNumber2: lines[i + 5].substring(9, 15).trim(),
                unknownValue: lines[i + 5].substring(20, 22).trim(),
                minQuantity: lines[i + 6].substring(6, 13).trim(),
                maxQty: lines[i + 6].substring(14, 19).trim(),
                target: lines[i + 6].substring(20, 25).trim(),
                materialCode: lines[i + 6].substring(68).trim()
            };
        }
    }

    if (currentOrder !== null) {
        orders.push(currentOrder);
    }

    return orders;
}

function isStartOfOrder(line) {
    if (line.length > 6 && line.substring(0, 6) === '######') {
        // console.log("Start " + true);
        return true;
    }

    else {
        return false;
    }
}

function isEndOfOrder(line) {
    // console.log(line.length);
    line = line.slice(-3);
    // line = line.join("");
    // console.log(line)
    if (line.includes('##')) {
        // console.log("End " + true)
        return true;
    }
    else {
        return false;
    }
    // return line.length > 2 && line.substring(line.length - 2) === '##';
}

function formatDate(dateStr) {
    // Extract the components of the date string
    const day = dateStr.substring(0, 2);
    const month = dateStr.substring(2, 4);
    const year = '20' + dateStr.substring(4, 6);

    // Create a Date object
    const date = new Date(year, month - 1, day);

    // Options for formatting the date
    const options = { year: 'numeric', month: 'long', day: 'numeric' };

    // Format the date
    return date.toLocaleDateString('en-US', options);
}

$('#get_order').click(() => {
    // Clear the order_id array before pushing new IDs
    order_id = [];

    // Iterate over all checked checkboxes within #order_card
    $('#order_card input[type=checkbox]:checked').each((index, val) => {
        // Push the id of the checked checkbox into the order_id array
        order_id.push($(val).attr('data-id'));
    });

    // Filter the orders array where orderId matches any of the order_id
    let filteredOrders = orders.filter(order => order_id.includes(order.orderId));


});

function order_details(id) {

    // shipTo
    // customerName
    // address
    // city
    // orderId
    // dispatchNumber
    // unknownValues
    // date
    // date2
    // dispatchNumber2
    // unknownValue
    // minQuantity
    // maxQty
    // target
    // materialCode
    order_id = [];

    // Iterate over all checked checkboxes within #order_card

    let filteredOrders = orders.filter(order => order.orderId == id);



    var settings = {
        "url": "customer_byshipto/" + filteredOrders[0]['shipTo'],
        "method": "GET",
        "timeout": 0,
    };

    $.ajax(settings).done(function (response) {
        clear_fields('modal_row')
        $('#customer_name').text(filteredOrders[0]['customerName'])
        $('#asc_number').text(filteredOrders[0]['shipTo'])
        $('#ship_to').text(filteredOrders[0]['shipTo'])
        $('#type').text('C')
        $('#location_priority').text('9')
        $('#scheduling_status').text('free')
        $('#orderPriority').val(response['priority']).trigger('change')
        $('#orderStatus').val("Must").trigger('change')
        $('#orderReason').val("select").trigger('change')
        $('#scope').val(response['scope']).trigger('change')
        $('#acsSpecialInstruction').text()
        $('#deliveryInstruction').text()
        $('#tank').text(filteredOrders[0]['materialCode'])
        $('#min').text(filteredOrders[0]['minQuantity'])
        $('#target').text(filteredOrders[0]['target'])
        $('#max').text(filteredOrders[0]['maxQty'])
        $('#dead_stock').text()
        $('#buffer_stock').text()
        $('#sales').text("0")
        $('#stock').text("0")


    })




}

function select_field(id) {
    var settings = {
        "url": "scope",
        "method": "GET",
        "timeout": 0,
    };

    $.ajax(settings).done(function (response) {

        $('#' + id + '').append('<option label="Scope..." >Scope</option>')


        for (i = 0; i < response.length; i++) {
            $('#' + id + '').append($('<option>', {
                value: response[i]['id'],
                text: response[i]['name']
            }));
        }
    })
}

function clear_fields(id) {

    $('#' + id + '').find('input, textarea, select').val('');
    $('#' + id + '').find('h6, td').text('');
    $('#' + id + '').find('input:checkbox, input:radio').prop('checked', false);


}
