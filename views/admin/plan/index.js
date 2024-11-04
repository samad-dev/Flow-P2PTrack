let cvehicle = [
    {
        "id": 2,
        "name": "122AMMCV",
        "tractor_code": "122AMM",
        "tractor_reg": "AMM122",
        "tracktor_reg2": null,
        "trailer_reg2": null,
        "tracktor_cv": null,
        "rigid": null,
        "trailer_code": "A122AMM",
        "trailer_reg": "AMM122",
        "scope": "1",
        "trailer_payload": null,
        "gsap_haulier": null,
        "user_field": null,
        "active": "1",
        "trailer_size": "44000",
        "created_at": "2024-07-30T11:21:00.916Z",
        "updated_at": "2024-07-30T11:50:13.920Z",
        "allowed_prod": [
            {
                "id": 1,
                "veh_id": "2",
                "product_id": "1",
                "code": 4000034013,
                "name": "SUPER C"
            },
            {
                "id": 2,
                "veh_id": "2",
                "product_id": "13",
                "code": 4000034014,
                "name": "HSD C"
            }
        ]
    }
];
let errors_window = [];
let orders = [
    {
        "shipTo": "10041357",
        "customerName": "HP - WALI FILLING STATION",
        "address": "MIAN ADYALA ROAD",
        "city": "RAWALPINDI",
        "orderId": "29226809901",
        "dispatchNumber": "46120",
        "unknownValues": [
            "I",
            "NAN",
            "0"
        ],
        "date": "010324",
        "date2": "010324",
        "dispatchNumber2": "001235",
        "unknownValue": "1",
        "minQuantity": "30400",
        "maxQty": "32000",
        "target": "32000",
        "materialCode": "400003401"
    },
    {
        "shipTo": "10041357",
        "customerName": "HP - WALI FILLING STATION",
        "address": "MIAN ADYALA ROAD",
        "city": "RAWALPINDI",
        "orderId": "29226811801",
        "dispatchNumber": "46120",
        "unknownValues": [
            "I",
            "NAN",
            "0"
        ],
        "date": "010324",
        "date2": "010324",
        "dispatchNumber2": "001235",
        "unknownValue": "1",
        "minQuantity": "7600",
        "maxQty": "8000",
        "target": "8000",
        "materialCode": "400003404"
    }
]

let access = [{
    "shipTo": "10041357",
    "vehicle_access": 21000,
},];

access.forEach(access=>{
    console.log(access.vehicle_access);
    console.log(cvehicle[0].trailer_size);

    
    if(access.vehicle_access<cvehicle[0].trailer_size)
    {
        errors_window.push({"error_name":"Access Type Violated"})
    }
})

let compartments =
    [
        { "id": 6, "loadable_volume": "8000", "compartment_no": 1, "size": 8000 },
        { "id": 7, "loadable_volume": "8000", "compartment_no": 2, "size": 8000 },
        { "id": 8, "loadable_volume": "8000", "compartment_no": 3, "size": 8000 },
        { "id": 9, "loadable_volume": "8000", "compartment_no": 4, "size": 8000 },
        { "id": 10, "loadable_volume": "8000", "compartment_no": 5, "size": 8000 }
    ];

// Define sequence for compartments
let sequence = [4, 2, 3, 1, 0];  // Example sequence for 5 compartments

let codearray = [];
let accessarray = [];
// console.log(cvehicle[0].allowed_prod);

cvehicle[0].allowed_prod.forEach(val => {
    codearray.push(val.code);
})

orders.forEach(order => {
    accessarray.push(order.shipTo);
});
console.log(accessarray);


let dup_orders = orders;
let order_not_allowed = dup_orders.filter(order => codearray.includes(parseInt(order.materialCode)));
console.log(order_not_allowed.length);

if (order_not_allowed.length >= 1) {
    errors_window.push({
        "error_name": "Vehicle Cannot Carry Product"
    })
}
orders = orders.filter(order => !codearray.includes(parseInt(order.materialCode)));


function calculateTotalTargetValue(orders) {
    return orders.reduce((total, order) => total + parseInt(order.target), 0);
}

function processOrders(orders, compartments, sequence) {
    let result = [];
    let compartmentUsed = new Set(); // Track used compartments
    let totalTargetValue = calculateTotalTargetValue(orders);
    orders.forEach(order => {
        let targetQty = parseInt(order.target);
        let remainingQty = targetQty;
        let compartmentsToUse = [];

        // Use the sequence to fill compartments
        sequence.forEach(index => {
            if (remainingQty <= 0) return;

            let compartment = compartments[index];
            if (compartmentUsed.has(compartment.compartment_no)) return; // Skip if already used

            if (compartment.size > remainingQty) {
                compartmentsToUse.push({
                    compartment_no: compartment.compartment_no,
                    size: compartment.size,
                    loaded_volume: remainingQty,
                    product_id: order.materialCode,
                    order_id: order.orderId,
                    shipto: order.shipTo,
                    customer_name: order.customerName
                });
                remainingQty = 0;
            } else {
                compartmentsToUse.push({
                    compartment_no: compartment.compartment_no,
                    size: compartment.size,
                    loaded_volume: compartment.size,
                    product_id: order.materialCode,
                    order_id: order.orderId,
                    shipto: order.shipTo,
                    customer_name: order.customerName
                });
                remainingQty -= compartment.size;
            }
            compartmentUsed.add(compartment.compartment_no); // Mark compartment as used
        });

        // Check if there's any remaining quantity that hasn't been allocated
        if (remainingQty > 0) {
            errors_window.push({ "error_name": "Discharge Sequence Violated" })
            errors_window.push({ "error_name": "Compartmentation infeasible" })
            console.log(`Order ID: ${order.orderId} could not be fully allocated.`);
        } else {
            result.push(...compartmentsToUse);
        }
    });
    if (totalTargetValue > cvehicle[0].trailer_size) {
        errors_window.push({ "error_name": 'Trip Volume Exceeds Vehicle Volume' })
    }

    return result;
}

// Call the function and output the result
let filledCompartments = processOrders(orders, compartments, sequence);
console.log(JSON.stringify(filledCompartments, null, 2));
console.log(errors_window);

