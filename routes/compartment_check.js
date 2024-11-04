
let compartments = [
    { id: 1, size: 8000, used: false, product: null, orderId: null, customer: null }, // Compartment 1
    { id: 2, size: 8000, used: false, product: null, orderId: null, customer: null },  // Compartment 2
    { id: 3, size: 16000, used: false, product: null, orderId: null, customer: null },  // Compartment 4
    { id: 4, size: 8000, used: false, product: null, orderId: null, customer: null },  // Compartment 4
    // { id: 5, size: 8000, used: false, product: null, orderId: null, customer: null },  // Compartment 4
    
];

// Discharge sequence (initial order: 4, 2, 3, 1)
let dischargeSequence = [ 4,2,3, 1];

// Sample list of orders
let orders = [
    { id: 105, quantity: 8000, product: 'A', customer: 'Customer3'},
    { id: 106, quantity: 8000, product: 'A', customer: 'Customer3'},
    { id: 104, quantity: 16000, product: 'A', customer: 'Customer2'},
    { id: 102, quantity: 8000, product: 'B', customer: 'Customer1'},
    
];


// Function to allocate compartments with flexibility for both types of orders
function allocateCompartments(orders, compartments, sequence) {
    let unallocatedOrders = [];
    let allocatedCompartments = [];

    // Function to find a compartment by ID
    function findCompartmentById(id) {
        return compartments.find(compartment => compartment.id === id);
    }

    // Iterate through orders and try to allocate compartments
    orders.forEach(order => {
        let remainingQuantity = order.quantity;
        let allocated = false;

        // Attempt to allocate using exact compartment size
        for (let i = 0; i < compartments.length; i++) {
            let compartment = findCompartmentById(sequence[i]); // Check in discharge sequence

            // Check for exact match
            if (!compartment.used && compartment.size === remainingQuantity) {
                console.log(`Allocating Order ${order.id} (${order.product}) to Compartment ${compartment.id}`);
                compartment.used = true; // Mark compartment as used
                compartment.product = order.product;

                allocatedCompartments.push({
                    compartmentNumber: compartment.id,
                    product: order.product,
                    orderId: order.id,
                    customerName: order.customer,
                    allocatedQuantity: remainingQuantity
                });
                remainingQuantity = 0; // Fully allocated
                allocated = true;
                break; // Exit loop as allocation is done
            }
        }

        // If the order is not fully allocated, check for partial allocations
        if (remainingQuantity > 0) {
            for (let i = 0; i < compartments.length; i++) {
                let compartment = findCompartmentById(sequence[i]);

                // If compartment is unused and can fit some quantity
                if (!compartment.used && compartment.size >= remainingQuantity) {
                    console.log(`Allocating remaining quantity ${remainingQuantity} liters of Order ${order.id} to Compartment ${compartment.id}`);
                    compartment.used = true;
                    compartment.product = order.product;

                    allocatedCompartments.push({
                        compartmentNumber: compartment.id,
                        product: order.product,
                        orderId: order.id,
                        customerName: order.customer,
                        allocatedQuantity: remainingQuantity
                    });

                    remainingQuantity = 0; // Fully allocated
                    allocated = true;
                    break; // Exit loop as allocation is done
                } else if (!compartment.used && compartment.size < remainingQuantity) {
                    // Partially allocate if no single compartment can fully satisfy the order
                    console.log(`Partially Allocating Order ${order.id} to Compartment ${compartment.id}`);
                    compartment.used = true;
                    compartment.product = order.product;

                    allocatedCompartments.push({
                        compartmentNumber: compartment.id,
                        product: order.product,
                        orderId: order.id,
                        customerName: order.customer,
                        allocatedQuantity: compartment.size // Allocate the full compartment size
                    });

                    remainingQuantity -= compartment.size; // Reduce remaining quantity
                }
            }
        }

        // If still not fully allocated, check for any other compatible compartments for the same customer and product
        if (remainingQuantity > 0) {
            console.log(`Order ${order.id} could not be fully allocated, remaining quantity: ${remainingQuantity}`);
            // Try to find alternative compartments that are not used
            for (let i = 0; i < compartments.length; i++) {
                let compartment = findCompartmentById(sequence[i]);

                if (!compartment.used && compartment.size >= remainingQuantity) {
                    console.log(`Allocating remaining quantity ${remainingQuantity} liters of Order ${order.id} to Compartment ${compartment.id} (alternative)`);
                    compartment.used = true;
                    compartment.product = order.product;

                    allocatedCompartments.push({
                        compartmentNumber: compartment.id,
                        product: order.product,
                        orderId: order.id,
                        customerName: order.customer,
                        allocatedQuantity: remainingQuantity
                    });

                    remainingQuantity = 0; // Fully allocated
                    allocated = true;
                    break; // Exit loop as allocation is done
                }
            }
        }

        // If still not fully allocated after all attempts, log the order as unallocated
        if (remainingQuantity > 0) {
            unallocatedOrders.push({ order: order.id, remainingQuantity });
        }
    });

    return { allocatedCompartments, unallocatedOrders };
}

// Call the allocation function
let result = allocateCompartments(orders, compartments, dischargeSequence);

console.log('Allocated Compartments:', result.allocatedCompartments);
console.log('Unallocated Orders:', result.unallocatedOrders);
