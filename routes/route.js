const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const generatePDF = require('../public/assets/js/import_orders_js/generate_pdf');
const generatePDF1 = require('../public/assets/js/import_orders_js/excelPdf');

const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const route = express.Router();
const app = express();
const xlsx1 = require('xlsx');
const multer = require('multer');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shell',
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});


// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const uploads = multer({ storage });

// Middleware for parsing request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use(session({
    secret: 'user',
    saveUninitialized: true,
    resave: true
}));

// Function to convert text to MD5
function textToMD5(text) {
    if (!text) {
        throw new Error('The "text" argument must be a non-empty string.');
    }
    return crypto.createHash('md5').update(text).digest('hex');
}

route.post('/login_auth', (req, res) => {
    const { email, password, scope } = req.body;
    console.log(email)
    console.log(password)
    if (!email || !password) {
        return res.status(400).json({ status: 'error', message: 'Email and password are required.', email: "email" + email, });
    }

    let encrypted_password;
    try {
        encrypted_password = textToMD5(password);
        console.log('Encrypted password:', encrypted_password);
    } catch (error) {
        return res.status(400).json({ status: 'error', message: error.message });
    }
    console.log('SELECT * FROM users WHERE is_logged_in = 1 AND logged_in_from = ' + scope + ' and email != ' + email + '');

    db.query('SELECT * FROM users WHERE is_logged_in = 1 AND logged_in_from = ? and email != ?', [scope, email], (err, results1) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ status: 'error', message: err.message });
        }
        else {
            console.log(results1);

            if (results1.length > 0) {
                return res.status(401).json({ status: 'error', message: results1 });
            }
            else {
                db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, encrypted_password], (err, results) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ status: 'error', message: 'Invalid email or password' });
                    }


                    if (results.length > 0) {
                        const user = results[0];
                        req.session.user = user.id;
                        console.log('Login successful for user:', user.id);
                        db.query('UPDATE users set  is_logged_in = 1 , logged_in_from = ? WHERE users.id = ?;', [scope, user.id], (err, results2) => {
                            if (err) {
                                console.error('Database error:', err);
                                return res.status(500).json({ status: 'error', message: err.message });
                            }
                            else {
                                console.log('UPDATE users set  is_logged_in = 1 , logged_in_from = ? WHERE users.id = ?');

                                return res.json({ status: 'success', message: 'Logged in successfully', id: user.id, session: req.session.user, scope_id: scope });
                            }
                        })


                        // req.session.save((err) => {
                        //     if (err) {
                        //         console.error('Session save error:', err);
                        //         return res.status(500).json({ status: 'error', message: 'Session save failed' });
                        //     }
                        //     });
                    } else {
                        console.log('Invalid email or password');
                        return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
                    }

                });
            }
        }


    });
});
// route.post('/login_auth', (req, res) => {
//     const { email, password, scope } = req.body;
//     console.log(email)
//     console.log(password)
//     if (!email || !password) {
//         return res.status(400).json({ status: 'error', message: 'Email and password are required.', email: "email" + email, });
//     }

//     let encrypted_password;
//     try {
//         encrypted_password = textToMD5(password);
//         console.log('Encrypted password:', encrypted_password);
//     } catch (error) {
//         return res.status(400).json({ status: 'error', message: error.message });
//     }

//     db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, encrypted_password], (err, results) => {
//         if (err) {
//             console.error('Database error:', err);
//             return res.status(500).json({ status: 'error', message: err.message });
//         }

//         if (results.length > 0) {
//             const user = results[0];
//             req.session.user = user.id;
//             console.log('Login successful for user:', user.id);
//             return res.json({ status: 'success', message: 'Logged in successfully', id: user.id, session: req.session.user, scope_id: scope });

//             // req.session.save((err) => {
//             //     if (err) {
//             //         console.error('Session save error:', err);
//             //         return res.status(500).json({ status: 'error', message: 'Session save failed' });
//             //     }
//             //     });
//         } else {
//             console.log('Invalid email or password');
//             return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
//         }

//     });
// });
route.get('/vmi_order', (req, res) => {
    const { id, p_id } = req.params;
    db.query('SELECT order_id  AS incremented_order_id FROM vmi_orders WHERE id = 1;', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
route.post('/vmi_orders', (req, res) => {
    const { order_id } = req.body;

    db.query('UPDATE `vmi_orders` SET`order_id`=? WHERE id=1',
        [order_id], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Product Assign successfully', id: result.insertId, status: 200 });

            }

        });
});
// route.post("/login_auth", (req, res) => {
//     const { login_email, password, scope } = req.body;
//     console.log('Received email:', login_email);
//     console.log('Received password:', password);

//     // if (!login_email || !password) {
//     //     return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
//     // }

//     // let encrypted_password;
//     // try {
//     //     encrypted_password = textToMD5(password);
//     //     console.log('Encrypted password:', encrypted_password);
//     // } catch (error) {
//     //     return res.status(400).json({ status: 'error', message: error.message });
//     // }

//     // db.query('SELECT * FROM users WHERE email = ? AND password = ?', [login_email, encrypted_password], (err, results) => {
//     //     if (err) {
//     //         console.error('Database error:', err);
//     //         return res.status(500).json({ status: 'error', message: err.message });
//     //     }

//     //     if (results.length > 0) {
//     //         const user = results[0];
//     //         req.session.user = user.id;
//     //         req.session.save((err) => {
//     //             if (err) {
//     //                 console.error('Session save error:', err);
//     //                 return res.status(500).json({ status: 'error', message: 'Session save failed' });
//     //             }
//     //             console.log('Login successful for user:', user.id);
//     //             return res.json({ status: 'success', message: 'Logged in successfully', id: user.id, session: req.session.user, scope_id: scope });
//     //         });
//     //     } else {
//     //         console.log('Invalid email or password');
//     //         return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
//     //     }

//     // });
//     return login_email;
// });
route.get('/auth-logout', (req, res, next) => {
    res.render('auth/auth-logout', { title: 'Logout', layout: false })
})


// Dashboard
route.get('/', (req, res, next) => {
    res.render('index', { title: 'Dashboard' });
})
route.get('/index', (req, res, next) => {
    res.render('index', { title: 'Dashboard' });
})

route.get('/auth-login', (req, res, next) => {
    res.render('auth/auth-login', { title: 'Login In', layout: false })
})
//////////////////////////////////////////////////////////// Apis /////////////////////////////////////////////////


//// ======================================Customers
route.get('/get_all_shipto/:id', (req, res) => {
    const { id } = req.params
    db.query('SELECT * FROM `customer` where scope=?;', [id]
        , (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
});
route.get('/get_sitename/:id', (req, res) => {
    const { id } = req.params
    db.query('SELECT * FROM `customer` where id=?;', [id]
        , (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
});

route.get('/get_sitenamebyship/:id', (req, res) => {
    const { id } = req.params
    db.query('SELECT * FROM `customer` where ship_to=?;', [id]
        , (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
});
route.get('/customer_list', (req, res) => {
    db.query('SELECT c.*,s.name as scopename FROM `customer` c left join scopes s on c.scope = s.id where is_customer =1;'
        , (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
});
route.get('/customer_shipto', (req, res) => {
    const id = req.query.id;
    db.query(`SELECT * FROM customer where ship_to in (${id})`
        , (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
});
route.get('/depots/:id', (req, res) => {
    const { id } = req.params;

    db.query('SELECT c.*,s.name as scopename FROM `customer` c left join scopes s on c.scope = s.id  where is_depot = 1 and scope=?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/depots', (req, res) => {
    db.query('SELECT c.*,s.name as scopename FROM `customer` c left join scopes s on c.scope = s.id  where is_depot = 1', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});


route.get('/customer/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT c.*,s.name as scopename FROM customer c left join scopes s on c.scope = s.id WHERE  c.id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.get('/customer_byshipto/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT c.*,s.name as scopename FROM customer c left join scopes s on c.scope = s.id WHERE  c.ship_to = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.get('/depot_delopn/:id', (req, res) => {
    const { id } = req.params;
    db.query(`SELECT ct.* FROM customer_timings ct 
    join customer c 
    on ct.customer_id= c.id
    WHERE c.is_depot=1 and  ct.customer_id =?;
    `, [id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
route.get('/customer_byscopes/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT c.*,s.name as scopename FROM customer c left join scopes s on c.scope = s.id WHERE is_customer = 1 AND scope = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
route.get('/parkingloc_byscopes/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT c.*,s.name as scopename FROM customer c left join scopes s on c.scope = s.id WHERE is_park_loc = 1 AND scope = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
route.get('/parkingloc/', (req, res) => {
    const { id } = req.params;
    db.query('SELECT c.*,s.name as scopename FROM customer c left join scopes s on c.scope = s.id WHERE is_park_loc = 1', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
route.post('/customer', (req, res) => {
    const { ship_to, site_name, scheduling, customer_name, scope, street, town, country_code, post_code, market, priority, status, is_customer, is_depot, is_park_loc } = req.body;
    // var pref = JSON.parse(prefs);
    db.query('INSERT INTO `customer`( `ship_to`, `site_name`, `scheduling`,customer_name, `scope`, `street`, `town`, `country_code`, `post_code`, `market`, `priority`, `status`, `is_customer`, `is_depot`, `is_park_loc`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [ship_to, site_name, scheduling, customer_name, scope, street, town, country_code, post_code, market, priority, status, is_customer, is_depot, is_park_loc
        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Customer added successfully', id: result.insertId, status: 200 });

            }

        });
});

route.put('/customer/:id', (req, res) => {
    const { id } = req.params;
    const { ship_to, site_name, customer_name, scheduling, scope, street, town, country_code, post_code, market, priority, status, is_customer, is_depot, is_park_loc } = req.body;

    const query = `
        UPDATE customer 
        SET 
            ship_to = ?, 
            site_name = ?, 
            customer_name = ?,
            scheduling = ?, 
            scope = ?, 
            street = ?, 
            town = ?, 
            country_code = ?, 
            post_code = ?, 
            market = ?, 
            priority = ?, 
            status = ?, 
            is_customer = ?, 
            is_depot = ?, 
            is_park_loc = ? 
        WHERE id = ?;
    `;

    db.query(query, [
        ship_to,
        site_name,
        customer_name,
        scheduling,
        scope,
        street,
        town,
        country_code,
        post_code,
        market,
        priority,
        status,
        is_customer,
        is_depot,
        is_park_loc,
        id
    ], (err, result) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.status(200).json({ message: 'Customer updated successfully' });
    });
});
route.put('/customer_address/:id', (req, res) => {
    const { id } = req.params;
    const { site_name, post_code, country_code, gsap_code, street, latitude, longitude, short_code } = req.body;

    const query = `
        UPDATE customer 
        SET 
        site_name = ?, 
            post_code = ?,  
            country_code = ?, 
            gsap_code=? ,
            street = ?, 
            latitude = ?, 
            longitude = ?, 
            short_code = ?
        WHERE id = ?;
    `;

    db.query(query, [
        site_name, post_code, country_code, gsap_code, street, latitude, longitude, short_code, id], (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            res.status(200).json({ message: 'Customer updated successfully' });
        });
});

route.put('/customer_status/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    db.query('UPDATE `customer` SET`status` = ? WHERE id = ?;',
        [status, id
        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Updated successfully', status: 200 });

            }

        });
});

route.delete('/customer/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM customer WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Customer deleted successfully', status: 200 });
    });
});
route.put('/customer_status_update/:id', (req, res) => {
    const { id } = req.params;
    const { scheduling, market, priority, alternat_shift, stop_del, vmi, trailer_drop_loc } = req.body;

    const query = `
        UPDATE customer 
        SET 
            scheduling = ?, 
            market = ?, 
            priority = ?, 
            alternat_shift = ?, 
            stop_del = ?, 
            vmi = ?, 
            trailer_drop_loc = ? 
        WHERE 
            id = ?;
    `;

    const values = [scheduling, market, priority, alternat_shift, stop_del, vmi, trailer_drop_loc, id];

    db.query(query, values, (err, result) => {
        if (err) {
            res.json({ message: err, status: 500 });
        } else {
            res.json({ message: 'Customer updated successfully', status: 200 });
        }
    });
});



/////////////////////////////// Customer Contact //////////////

route.get('/customer_contact', (req, res) => {
    db.query('SELECT * FROM customer_contacts', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/customer_contact_byId/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM customer_contacts where customer_id=?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});



route.get('/customer_contact/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM customer_contacts WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.post('/customer_contact', (req, res) => {

    const { customer_id, name, contact_type, detail, active } = req.body;
    // var pref = JSON.parse(prefs);
    db.query('INSERT INTO `customer_contacts`( `customer_id`, `name`, `contact_type`, `detail`, `active`) VALUES (?,?,?,?,?)',
        [customer_id, name, contact_type, detail, active
        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Customer added successfully', id: result.insertId, status: 200 });

            }

        });
});
route.put('/customer_contact/:id', (req, res) => {
    const { id } = req.params;

    const { customer_id, name, contact_type, detail } = req.body;
    // var pref = JSON.parse(prefs);
    db.query('UPDATE customer_contacts SET customer_id = ?, name = ?, contact_type = ?, detail = ? WHERE id = ?;',
        [customer_id, name, contact_type, detail, id
        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Customer Updated successfully', status: 200 });

            }

        });
});
route.put('/customer_contact_status/:id', (req, res) => {
    const { id } = req.params;

    const { active } = req.body;
    // var pref = JSON.parse(prefs);
    db.query('UPDATE `customer_contacts` SET `active`=? WHERE id = ?;',
        [active, id
        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Customer Updated successfully', status: 200 });

            }

        });
});

route.delete('/customer_contact/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM customer_contacts WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Customer deleted successfully', status: 200 });
    });
});



////////////////////////////////////// Customer tanks ////////////////////

route.get('/customer_tank', (req, res) => {
    db.query('SELECT * FROM customer_tanks', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/customer_tank_byId/:id', (req, res) => {
    const { id } = req.params
    db.query('SELECT c.customer_id,c.status,c.created_at,c.updated_at,c.tg,c.discharge_seq,p.code,p.name as product_name FROM customer_tanks c join product p on c.product_name = p.id where customer_id=?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/customer_tank/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM customer_tanks WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.post('/customer_tank', (req, res) => {

    const { customer_id, code, tg, product_id, product_name, discharge_seq, status } = req.body;
    // var pref = JSON.parse(prefs);
    db.query('INSERT INTO `customer_tanks`(`customer_id`, `code`, `tg`, `product_id`, `product_name`, `discharge_seq`, `status`) VALUES (?,?,?,?,?,?,?)',
        [customer_id, code, tg, product_id, product_name, discharge_seq, status
        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Customer added successfully', id: result.insertId, status: 200 });

            }

        });
});


route.put('/customer_tank_status/:id', (req, res) => {
    const { id } = req.params;

    const { status } = req.body;

    db.query('UPDATE `customer_tanks` SET `status`=? WHERE id = ?;',
        [status, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Tank Updated successfully', status: 200 });

            }

        });
});
route.put('/customer_tank/:id', (req, res) => {
    const { id } = req.params;

    const { code, tg, product_id, product_name, discharge_seq
    } = req.body;

    db.query('UPDATE customer_tanks SET  code = ?, tg = ?, product_id = ?, product_name = ?, discharge_seq = ? WHERE id = ?;',
        [code, tg, product_id, product_name, discharge_seq, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {
                // for (var i = 0; i < pref.length; i++) {
                //     console.log(pref[i]);
                //     db.query('INSERT INTO factor75.customer_prefs (customer_id,prefs) VALUES (?,?)', [result.insertId, pref[i]], (err2, result2) => {
                //         if (err2) {
                //             res.json({ message: err, status: 500 })
                //         }


                //     });

                // }
                res.json({ message: 'Customer Updated successfully', status: 200 });

            }

        });
});
route.delete('/customer_tank/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM customer_tanks WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Customer deleted successfully', status: 200 });
    });
});


/////////////////////////////////////////////////////////// Customer Timing //////////////////////////

route.get('/customer_timings', (req, res) => {
    db.query('SELECT * FROM customer_timings', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/customer_timings/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM customer_timings WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.get('/customer_timings_byId/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM customer_timings WHERE customer_id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
route.post('/customer_timings', (req, res) => {
    const { customer_id, start_day, start_time, end_day, end_time
    } = req.body;

    db.query('INSERT INTO `customer_timings`( `customer_id`, `start_day`, `start_time`, `end_day`, `end_time`) VALUES (?,?,?,?,?)',
        [customer_id, start_day, start_time, end_day, end_time

        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {
                // for (var i = 0; i < pref.length; i++) {
                //     console.log(pref[i]);
                //     db.query('INSERT INTO factor75.customer_prefs (customer_id,prefs) VALUES (?,?)', [result.insertId, pref[i]], (err2, result2) => {
                //         if (err2) {
                //             res.json({ message: err, status: 500 })
                //         }


                //     });

                // }
                res.json({ message: 'Customer added successfully', id: result.insertId, status: 200 });

            }

        });
});
route.put('/customer_timings/:id', (req, res) => {
    const { id } = req.params;

    const { customer_id, start_day, start_time, end_day, end_time
    } = req.body;

    db.query('UPDATE customer_timings SET customer_id = ?, start_day = ?, start_time = ?, end_day = ?, end_time = ? WHERE id = ?;',
        [customer_id, start_day, start_time, end_day, end_time, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {
                // for (var i = 0; i < pref.length; i++) {
                //     console.log(pref[i]);
                //     db.query('INSERT INTO factor75.customer_prefs (customer_id,prefs) VALUES (?,?)', [result.insertId, pref[i]], (err2, result2) => {
                //         if (err2) {
                //             res.json({ message: err, status: 500 })
                //         }


                //     });

                // }
                res.json({ message: 'Customer added successfully', id: result.insertId, status: 200 });

            }

        });
});
route.delete('/customer_timings/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM customer_timings WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Customer deleted successfully', status: 200 });
    });
});

/////////////////////////////////////////////////////////// Customer Sales Opening //////////////////////////

route.get('/customer_salopen', (req, res) => {
    db.query('SELECT * FROM customer_selopening', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/customer_salopen/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM customer_selopening WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.get('/customer_salopen_byId/:id', (req, res) => {
    const { id } = req.params;
    db.query(`SELECT cs.* FROM 
    customer_selopening cs 
    JOIN customer c 
    on cs.customer_id =c.id
    WHERE  cs.customer_id=?`, [id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
route.post('/customer_salopen', (req, res) => {
    const { customer_id, start_day, start_time, end_day, end_time
    } = req.body;

    db.query('INSERT INTO `customer_selopening`( `customer_id`, `start_day`, `start_time`, `end_day`, `end_time`) VALUES (?,?,?,?,?)',
        [customer_id, start_day, start_time, end_day, end_time

        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {
                // for (var i = 0; i < pref.length; i++) {
                //     console.log(pref[i]);
                //     db.query('INSERT INTO factor75.customer_prefs (customer_id,prefs) VALUES (?,?)', [result.insertId, pref[i]], (err2, result2) => {
                //         if (err2) {
                //             res.json({ message: err, status: 500 })
                //         }


                //     });

                // }
                res.json({ message: 'Customer added successfully', id: result.insertId, status: 200 });

            }

        });
});
route.put('/customer_salopen/:id', (req, res) => {
    const { id } = req.params;

    const { customer_id, start_day, start_time, end_day, end_time
    } = req.body;

    db.query('UPDATE customer_selopening SET customer_id = ?, start_day = ?, start_time = ?, end_day = ?, end_time = ? WHERE id = ?;',
        [customer_id, start_day, start_time, end_day, end_time, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {
                // for (var i = 0; i < pref.length; i++) {
                //     console.log(pref[i]);
                //     db.query('INSERT INTO factor75.customer_prefs (customer_id,prefs) VALUES (?,?)', [result.insertId, pref[i]], (err2, result2) => {
                //         if (err2) {
                //             res.json({ message: err, status: 500 })
                //         }


                //     });

                // }
                res.json({ message: 'Customer added successfully', id: result.insertId, status: 200 });

            }

        });
});
route.delete('/customer_salopen/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM customer_selopening WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Customer deleted successfully', status: 200 });
    });
});

/////////////////////////////////////////////////////////// Customer Contact time //////////////////////////

route.get('/customer_conttime', (req, res) => {
    db.query('SELECT * FROM customer_contact_time', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/customer_conttime/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM customer_contact_time WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.get('/customer_conttime_byId/:id', (req, res) => {
    const { id } = req.params;
    db.query(`SELECT c.*,cc.id as contId,cc.customer_id,cc.start_time,cc.end_time,cc.contact_time,cc.created_at,cc.updated_at FROM customer_contact_time cc JOIN customer c 
    on c.id = cc.customer_id  WHERE cc.customer_id =?;`, [id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
route.post('/customer_conttime', (req, res) => {
    const { customer_id, start_time, end_time, contact_time
    } = req.body;

    db.query('INSERT INTO `customer_contact_time`(`customer_id`, `start_time`, `end_time`, `contact_time`) VALUES (?,?,?,?)',
        [customer_id, start_time, end_time, contact_time

        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {
                // for (var i = 0; i < pref.length; i++) {
                //     console.log(pref[i]);
                //     db.query('INSERT INTO factor75.customer_prefs (customer_id,prefs) VALUES (?,?)', [result.insertId, pref[i]], (err2, result2) => {
                //         if (err2) {
                //             res.json({ message: err, status: 500 })
                //         }


                //     });

                // }
                res.json({ message: 'Customer added successfully', id: result.insertId, status: 200 });

            }

        });
});
route.put('/customer_conttime/:id', (req, res) => {
    const { id } = req.params;

    const { customer_id, start_time, end_time, contact_time
    } = req.body;

    db.query('UPDATE customer_contact_time SET customer_id = ?, start_time = ?, end_time = ?, contact_time = ? WHERE id = ?;',
        [customer_id, start_time, end_time, contact_time, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Customer added successfully', id: result.insertId, status: 200 });

            }

        });
});
route.delete('/customer_conttime/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM customer_contact_time WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Customer deleted successfully', status: 200 });
    });
});

/////////////////////////////////////////////////////////// Customer Events //////////////////////////

route.get('/customer_events', (req, res) => {

    db.query('SELECT * FROM event', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/customer_events/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM event WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.get('/customer_events_byId/:id', (req, res) => {
    const { id } = req.params
    db.query('SELECT * FROM event WHERE customer_id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

route.post('/customer_events', (req, res) => {
    const { customer_id, event_name, start_date, end_date, info
    } = req.body;
    // var pref = JSON.parse(prefs);
    db.query('INSERT INTO `event`( `customer_id`, `event_name`, `start_date`, `end_date`, `info`) VALUES (?,?,?,?,?)',
        [customer_id, event_name, start_date, end_date, info

        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Customer added successfully', id: result.insertId, status: 200 });

            }

        });
});
route.put('/customer_events/:id', (req, res) => {
    const { id } = req.params;

    const { customer_id, event_name, start_date, end_date, info
    } = req.body;

    db.query('UPDATE event SET  customer_id = ?, event_name = ?, start_date = ?, end_date = ?, info = ? WHERE id = ?;',
        [customer_id, event_name, start_date, end_date, info, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Customer Updated successfully', status: 200 });

            }

        });
});
route.delete('/customer_events/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM customer_timings WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Customer deleted successfully', status: 200 });
    });
});

/////////////////////////////////////////////////////////// Customer Routses //////////////////////////

route.get('/customer_route', (req, res) => {
    db.query('SELECT * FROM routes', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/customer_route_byId/:id', (req, res) => {
    const { id } = req.params
    db.query('SELECT * FROM routes where customer_id =?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/customer_route/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM routes WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.post('/customer_route', (req, res) => {
    const { customer_id, on_off, from_loc_code, from_loc_name, to_loc_code, to_loc_name, distance, time, speed

    } = req.body;

    db.query('INSERT INTO `routes`( `customer_id`, `status`,  `from_loc_code`, `from_loc_name`, `to_loc_code`, `to_loc_name`, `distance`, `time`, `speed`) VALUES (?,?,?,?,?,?,?,?,?)',
        [customer_id, on_off, from_loc_code, from_loc_name, to_loc_code, to_loc_name, distance, time, speed

        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {
                // for (var i = 0; i < pref.length; i++) {
                //     console.log(pref[i]);
                //     db.query('INSERT INTO factor75.customer_prefs (customer_id,prefs) VALUES (?,?)', [result.insertId, pref[i]], (err2, result2) => {
                //         if (err2) {
                //             res.json({ message: err, status: 500 })
                //         }


                //     });

                // }
                res.json({ message: 'Customer added successfully', id: result.insertId, status: 200 });

            }

        });
});

route.put('/route_status/:id', (req, res) => {
    const { id } = req.params;

    const { status
    } = req.body;

    db.query('UPDATE `routes` SET`status` = ? WHERE id = ?;',
        [status, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {
                // for (var i = 0; i < pref.length; i++) {
                //     console.log(pref[i]);
                //     db.query('INSERT INTO factor75.customer_prefs (customer_id,prefs) VALUES (?,?)', [result.insertId, pref[i]], (err2, result2) => {
                //         if (err2) {
                //             res.json({ message: err, status: 500 })
                //         }


                //     });

                // }
                res.json({ message: 'Customer added successfully', id: result.insertId, status: 200 });

            }

        });
});
route.put('/customer_route/:id', (req, res) => {
    const { id } = req.params;

    const { loc_code, loc_name, distance, time, speed
    } = req.body;

    db.query('UPDATE routes SET  loc_code = ?,loc_name=?, distance = ?, time = ?, speed = ?WHERE id = ?;',
        [loc_code, loc_name, distance, time, speed, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {
                // for (var i = 0; i < pref.length; i++) {
                //     console.log(pref[i]);
                //     db.query('INSERT INTO factor75.customer_prefs (customer_id,prefs) VALUES (?,?)', [result.insertId, pref[i]], (err2, result2) => {
                //         if (err2) {
                //             res.json({ message: err, status: 500 })
                //         }


                //     });

                // }
                res.json({ message: 'Customer added successfully', id: result.insertId, status: 200 });

            }

        });
});
route.delete('/customer_route/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM routes WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Customer deleted successfully', status: 200 });
    });
});


/////////////////////////////////////////////////////////// Customer Status //////////////////////////

route.get('/customer_status_api', (req, res) => {
    db.query('SELECT * FROM status', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/customer_status_api/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM status WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.post('/customer_status_api', (req, res) => {
    const { customer_id, lst_sch_date, priority, market, allow_shift_order, stop_delivery, vmi, tailer_drop_loc, depot, park_loc

    } = req.body;

    db.query('INSERT INTO `status`( `customer_id`, `lst_sch_date`, `priority`, `market`, `allow_shift_order`, `stop_delivery`, `vmi`, `tailer_drop_loc`, `depot`, `park_loc`) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [customer_id, lst_sch_date, priority, market, allow_shift_order, stop_delivery, vmi, tailer_drop_loc, depot, park_loc

        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Status added successfully', id: result.insertId, status: 200 });

            }

        });
});
route.put('/customer_status_api/:id', (req, res) => {
    const { id } = req.params;

    const { customer_id, lst_sch_date, priority, market, allow_shift_order, stop_delivery, vmi, tailer_drop_loc, depot, park_loc
    } = req.body;

    db.query('UPDATE status SET  lst_sch_date = ?, priority = ?, market = ?, allow_shift_order = ?, stop_delivery = ?, vmi = ?, tailer_drop_loc = ?, depot = ?, park_loc = ? WHERE id = ?;',
        [lst_sch_date, priority, market, allow_shift_order, stop_delivery, vmi, tailer_drop_loc, depot, park_loc, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Status Updated successfully', status: 200 });

            }

        });
});
route.delete('/customer_status_api/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM routes WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Status deleted successfully', status: 200 });
    });
});



/////////////////////////////////////////////////////////// Customer Tank properties //////////////////////////

route.get('/tank_properties', (req, res) => {
    db.query('SELECT * FROM tank_properties', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/tank_properties/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM tank_properties WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.post('/tank_properties', (req, res) => {
    const { tank_id, customer_id, sched_date, avg_sales, link_name, task_classifier, mark_for_deletion, product_name, product_code, ogg, code, tg, capacity, target_l, target_d, min_drop, max_order_redn, special_allow, min_duration, trig_order, cal_volume, over_vol, cal_weight, over_weight, max_order, req_trailer, req_method, override_rate, trailer_no


    } = req.body;

    db.query('INSERT INTO `tank_properties`(`tank_id`, `customer_id`, `sched_date`, `avg_sales`, `link_name`, `task_classifier`, `mark_for_deletion`, `product_name`, `product_code`, `ogg`, `code`, `tg`, `capacity`, `target_l`, `target_d`, `min_drop`, `max_order_redn`, `special_allow`, `min_duration`, `trig_order`, `cal_volume`, `over_vol`, `cal_weight`, `over_weight`, `max_order`, `req_trailer`, `req_method`, `override_rate`, `trailer_no`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [tank_id, customer_id, sched_date, avg_sales, link_name, task_classifier, mark_for_deletion, product_name, product_code, ogg, code, tg, capacity, target_l, target_d, min_drop, max_order_redn, special_allow, min_duration, trig_order, cal_volume, over_vol, cal_weight, over_weight, max_order, req_trailer, req_method, override_rate, trailer_no


        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Status added successfully', id: result.insertId, status: 200 });

            }

        });
});
route.put('/tank_properties/:id', (req, res) => {
    const { id } = req.params;

    const { tank_id, customer_id, sched_date, avg_sales, link_name, task_classifier, mark_for_deletion, product_name, product_code, ogg, code, tg, capacity, target_l, target_d, min_drop, max_order_redn, special_allow, min_duration, trig_order, cal_volume, over_vol, cal_weight, over_weight, max_order, req_trailer, req_method, override_rate, trailer_no

    } = req.body;

    db.query('UPDATE tank_properties SET tank_id = ?, customer_id = ?, sched_date = ?, avg_sales = ?, link_name = ?, task_classifier = ?, mark_for_deletion = ?, product_name = ?, product_code = ?, ogg = ?, code = ?, tg = ?, capacity = ?, target_l = ?, target_d = ?, min_drop = ?, max_order_redn = ?, special_allow = ?, min_duration = ?, trig_order = ?, cal_volume = ?, over_vol = ?, cal_weight = ?, over_weight = ?, max_order = ?, req_trailer = ?, req_method = ?, override_rate = ?, trailer_no = ? WHERE id = ?;',
        [tank_id, customer_id, sched_date, avg_sales, link_name, task_classifier, mark_for_deletion, product_name, product_code, ogg, code, tg, capacity, target_l, target_d, min_drop, max_order_redn, special_allow, min_duration, trig_order, cal_volume, over_vol, cal_weight, over_weight, max_order, req_trailer, req_method, override_rate, trailer_no, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Status Updated successfully', status: 200 });

            }

        });
});
route.delete('/tank_properties/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM routes WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Status deleted successfully', status: 200 });
    });
});


/////////////////////////////////////////////////////////// Vehicles  //////////////////////////

route.get('/vehicle', (req, res) => {
    db.query('SELECT v.*,s.name as scopename,v.name as title FROM vehicle v join scopes s on v.scope=s.id', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/all_vehicle', (req, res) => {

    db.query(`SELECT v.*,c.name as scopename ,h.haulier_name as h_name FROM vehicle 
    v join scopes c on v.scope =c.id
    JOIN hauliers h ON v.gsap_haulier = h.id 
   `, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/allvehicle_bycompartment', (req, res) => {
    let { id } = req.query;


    // Retrieve vehicles that have compartments in the vehicle_compartments table
    db.query(`SELECT v.*, h.haulier_name, h.phone, h.group_code
    FROM vehicle v
    JOIN hauliers h ON v.gsap_haulier = h.id
    WHERE v.gsap_status = 0
    AND v.id IN (SELECT DISTINCT veh_id FROM vehicle_compartments);`, [id],
        (err, vehicleResults) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (vehicleResults.length === 0) {
                res.status(404).json({ error: 'No vehicles with compartments found' });
                return;
            }

            // Retrieve compartments for the filtered vehicles
            const vehicleIds = vehicleResults.map(vehicle => vehicle.id);
            db.query(`SELECT id, loadable_volume, compartment_no, veh_id, 
                      CAST(loadable_volume AS INT) AS size 
                      FROM vehicle_compartments 
                      WHERE veh_id IN(?)`, [vehicleIds],
                (err, compartmentResults) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }

                    // Group compartments by vehicle ID for easy mapping
                    const compartmentMap = compartmentResults.reduce((acc, compartment) => {
                        if (!acc[compartment.veh_id]) acc[compartment.veh_id] = [];
                        acc[compartment.veh_id].push(compartment);
                        return acc;
                    }, {});

                    // Map compartments to each vehicle
                    const vehiclesWithCompartments = vehicleResults.map(vehicle => {
                        vehicle.compartments = compartmentMap[vehicle.id] || [];
                        return vehicle;
                    });

                    res.json(vehiclesWithCompartments);
                });
        });
});
route.get('/get_vehicle/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM veh_base WHERE scope =?', [id], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        else {
            for (let a = 0; a < results.length; a++) {
                const data = JSON.parse(JSON.stringify(results[a]));
                try {
                    const results2 = await vehicle_prodcuts(data.id);
                    data.allowed_prod = results2;
                    results[a] = data;
                } catch (error) {
                    res.json({ message: error, status: 500 });
                    return;
                }
            }

        }
        res.json(results);
    });
    function vehicle_prodcuts(vehicle_id) {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT vp.*,p.code,p.name FROM vehicle_products vp join product p on vp.product_id = p.id WHERE veh_id = ?', [vehicle_id],
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
            );
        });
    }
});
route.get('/vehicle/:id', (req, res) => {
    const { id } = req.params;
    db.query(`SELECT v.*,c.name as scopename ,h.haulier_name as h_name FROM vehicle 
    v join scopes c on v.scope =c.id
    JOIN hauliers h ON v.gsap_haulier = h.id 
    where scope=?`, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/vehicle_byId/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM veh_base WHERE id = ?', [id], async (err, results) => {
        if (err) {
            console.log(err);
        }
        else {
            const data = JSON.parse(JSON.stringify(results[0]));
            try {
                const results2 = await vehicle_prodcuts(data.id);
                data.allowed_prod = results2;
                results[0] = data;
            }
            catch (error) {
                res.json({ message: error, status: 500 });
                return;
            }
        }

        res.json(results);
    });
    function vehicle_prodcuts() {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT vp.*,p.code,p.name FROM vehicle_products vp join product p on vp.product_id = p.id WHERE veh_id = ?', [id],
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
            );
        });
    }
});


route.post('/tracktor_tsd', (req, res) => {
    const { vehicle_id, start_day, start_time, end_day, end_time, availability, shift, start_location, end_location, preload_depot, postload_depot, driver


    } = req.body;

    db.query('INSERT INTO `tracktor_tsd`( `vehicle_id`, `start_day`, `start_time`, `end_day`, `end_time`, `availability`, `shift`, `start_location`, `end_location`, `preload_depot`, `postload_depot`, `driver`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [vehicle_id, start_day, start_time, end_day, end_time, availability, shift, start_location, end_location, preload_depot, postload_depot, driver


        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {


                res.json({ message: 'Status added successfully', id: result.insertId, status: 200 });

            }

        });
});
route.get('/get_vehicleby_shift/:scope/:sord/:shift', (req, res) => {
    const { scope, sord, shift } = req.params;

    if (sord == 1) {
        db.query(`SELECT * FROM veh_base WHERE start_day = LEFT(DAYNAME(CURDATE()), 3)
            AND availability = 'Fully Available' AND shift = ? AND scope = ?;`, [shift, scope], async (err, results) => {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            for (let a = 0; a < results.length; a++) {
                const data = JSON.parse(JSON.stringify(results[a]));
                try {
                    const results2 = await vehicle_prodcuts(data.id);
                    data.allowed_prod = results2;
                    results[a] = data;
                } catch (error) {
                    return res.status(500).json({ message: error.message, status: 500 });
                }
            }

            res.json(results);
        });
    } else if (sord == 2) {
        db.query(`SELECT * FROM veh_base WHERE start_day = LEFT(DAYNAME(CURDATE()), 3)
            AND availability = 'Fully Available' AND scope = ?;`, [scope], async (err, results) => {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            for (let a = 0; a < results.length; a++) {
                const data = JSON.parse(JSON.stringify(results[a]));
                try {
                    const results2 = await vehicle_prodcuts(data.id);
                    data.allowed_prod = results2;
                    results[a] = data;
                } catch (error) {
                    return res.status(500).json({ message: error.message, status: 500 });
                }
            }

            res.json(results);
        });
    }


    function vehicle_prodcuts(id) {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT vp.*, p.code, p.name FROM vehicle_products vp JOIN product p ON vp.product_id = p.id WHERE vp.veh_id = ?',
                [id],
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
            );
        });
    }
});



const { promisify } = require('util');

// Convert db.query to return a promise
const dbQuery = promisify(db.query).bind(db);

route.get('/search_vehicle', async (req, res) => {
    try {
        const { name, size, start_loc, end_loc, scope, date, shift, type } = req.query;

        const getDayOfWeek = (dateStr) => {
            const date = new Date(dateStr);
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            return dayNames[date.getDay()];
        };

        let dayOfWeek = date && date !== "null" ? getDayOfWeek(date) : null;

        let query = `
            SELECT *, 
                CONCAT(?, ' ', start_time) AS start,
                CASE 
                    WHEN TIME(end_time) >= TIME(start_time) THEN 
                        CONCAT(?, ' ', end_time)
                    ELSE 
                        CONCAT(DATE_ADD(?, INTERVAL 1 DAY), ' ', end_time)
                END AS end,
                name AS title,
                id AS resourceId,
                TRUE AS editable
            FROM veh_base
            WHERE 1=1
        `;

        const params = [date, date, date, date, date];

        if (name && name !== "null") {
            const names = name.split(',').map(n => n.trim());
            query += ` AND name IN (${names.map(() => '?').join(', ')})`;
            params.push(...names);
        }

        if (size && size !== "null") {
            const numericSize = parseFloat(size.replace('kl', '')) * 1000;
            query += ` AND trailer_size = ?`;
            params.push(numericSize);
        }

        if (start_loc && start_loc !== "null") {
            query += ` AND start_loc = ?`;
            params.push(start_loc);
        }

        if (end_loc && end_loc !== "null") {
            query += ` AND end_loc = ?`;
            params.push(end_loc);
        }

        if (scope && scope !== "null") {
            query += ` AND scope = ?`;
            params.push(scope);
        }

        if (dayOfWeek) {
            query += ` AND start_day = ?`;
            params.push(dayOfWeek);
        }

        if (type && type !== "null") {
            const shiftPlanQuery = `
                SELECT * FROM shift_planning 
                WHERE shift = ? AND scope = ? AND day = LEFT(DAYNAME(?), 3)
            `;

            const shiftResults = await dbQuery(shiftPlanQuery, [shift, scope, date]);
            if (!shiftResults.length) {
                return res.status(400).json({ error: 'No shift planning data found for the given parameters' });
            }

            if (type === '1' && shift && shift !== "null") {
                query += ` AND shift = ? AND TIME(start_time) > ? AND TIME(end_time) < ?`;
                params.push(shift, shiftResults[0].start_time, shiftResults[0].end_time);
            } else if (type === '2') {
                const amShift = shiftResults.find(s => s.shift.toLowerCase() === 'am');
                const pmShift = shiftResults.find(s => s.shift.toLowerCase() === 'pm');

                if (amShift && pmShift) {
                    query += ` AND (
                        (shift = 'AM' AND TIME(start_time) > ? AND TIME(end_time) <= ?)
                        OR
                        (shift = 'PM' AND TIME(start_time) > ? AND TIME(end_time) <= ?)
                    )`;
                    params.push(amShift.start_time, amShift.end_time, pmShift.start_time, pmShift.end_time);
                } else {
                    return res.status(400).json({ error: 'AM or PM shift times not found' });
                }
            }
        }

        const results = await dbQuery(query, params);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err });
    }
});


// route.get('/search_vehicle', (req, res) => {
//     // Extract query parameters
//     const { name, size, start_loc, end_loc, scope, date, shift, type } = req.query;
//     const shift_planq = `
//     SELECT * FROM shift_planning sp 
//     WHERE shift = ? AND scope = ? AND day = LEFT(DAYNAME(?), 3);`;

//     // Function to convert date string to three-letter day of the week
//     const getDayOfWeek = (dateStr) => {
//         const date = new Date(dateStr);
//         const dayIndex = date.getDay(); // getDay() returns 0 (Sunday) to 6 (Saturday)
//         const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
//         return dayNames[dayIndex];
//     };

//     // Convert the date to a three-letter day if provided
//     let dayOfWeek = null;
//     if (date && date !== "null") {
//         dayOfWeek = getDayOfWeek(date);
//     }

//     // Construct the base query with placeholders
//     let query = `
//         SELECT *, 
//             CONCAT(?, ' ', start_time) AS start,
//             CASE 
//                 WHEN TIME(end_time) >= TIME(start_time) THEN 
//                     CONCAT(?, ' ', end_time) -- Same day
//                 ELSE 
//                     CONCAT(DATE_ADD(?, INTERVAL 1 DAY), ' ', end_time) -- Next day
//             END AS end,
//             name AS title,
//             id AS resourceId,
//             TRUE AS editable
//         FROM veh_base
//         WHERE start_time > ? AND end_time < ?
//     `;

//     // Parameters array for the query
//     const params = [date, date, date];

//     // Add conditions dynamically based on the provided parameters
//     if (name && name !== "null") {
//         const names = name.split(',').map(n => n.trim());
//         query += ` AND name IN (${names.map(() => '?').join(', ')})`;
//         params.push(...names);
//     }

//     if (size && size !== "null") {
//         const numericSize = parseFloat(size.replace('kl', '')) * 1000; // Converts "45kl" to 45000
//         query += ` AND trailer_size = ?`;
//         params.push(numericSize);
//     }

//     if (start_loc && start_loc !== "null") {
//         query += ` AND start_loc = ?`;
//         params.push(start_loc);
//     }

//     if (end_loc && end_loc !== "null") {
//         query += ` AND end_loc = ?`;
//         params.push(end_loc);
//     }

//     if (scope && scope !== "null") {
//         query += ` AND scope = ?`;
//         params.push(scope);
//     }

//     if (dayOfWeek) {
//         query += ` AND start_day = ?`;
//         params.push(dayOfWeek);
//     }

//     if (type && type !== "null") {
//         if (type === '1' && shift && shift !== "null") {
//             query += ` AND shift = ? AND start_time > ? AND end_time < ?;`;

//             db.query(shift_planq, [shift, scope, date], (err, shitresults) => {
//                 if (err) {
//                     return res.status(500).json({ error: 'Database error', details: err });
//                 }
//                 params.push(shift, shiftResults[0]?.start_time, shiftResults[0]?.end_time)
//             })

//         } else if (type === '2') {
//             query += ` AND (
//                 -- AM shift condition: start after 20:00 and end before 10:00 next day
//                 (shift = 'AM' AND TIME(start_time) > ? AND TIME(end_time) <= ?)
//                 OR
//                 -- PM shift condition: start after 08:00 and end before 22:00
//                 (shift = 'PM' AND TIME(start_time) > ? AND TIME(end_time) <= ?)
//             );`;
//             db.query(shift_planq, [shift, scope, date], (err, shitresults) => {
//                 if (err) {
//                     return res.status(500).json({ error: 'Database error', details: err });
//                 }
//                 const pmshift = shiftResults.filter(shi => shi.shift.toLowerCase() === 'pm');
//                 const amshift = shiftResults.filter(shi => shi.shift.toLowerCase() === 'am');
//                 params.push(shift,amshift[0].start_time, amshift[0].end_time, pmshift[0].start_time, pmshift[0].end_time)
//             })
//         }
//     }

//     // Execute the query with parameterized values
//     db.query(query, params, (err, results) => {
//         if (err) {
//             return res.status(500).json({ error: 'Database error', details: err });
//         }
//         res.json(results);
//     });

// });



route.get('/distinct_veh_values', (req, res) => {
    const { scope, date, shift, type } = req.query;

    const getDayOfWeek = (dateStr) => {
        const date = new Date(dateStr);
        const dayIndex = date.getDay(); // getDay() returns 0 (Sunday) to 6 (Saturday)
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return dayNames[dayIndex];
    };

    // Convert the date to a three-letter day
    let dayOfWeek = null;
    if (date && date !== "null") {
        dayOfWeek = getDayOfWeek(date);
    }

    // Base queries for each distinct value
    let nameq = 'SELECT DISTINCT name FROM veh_base WHERE name IS NOT NULL';
    let sizeq = 'SELECT DISTINCT CONCAT(trailer_size / 1000, "kl") AS trailer_size FROM veh_base WHERE trailer_size IS NOT NULL';
    let start_locq = 'SELECT DISTINCT start_loc FROM veh_base WHERE start_loc IS NOT NULL';
    let end_locq = 'SELECT DISTINCT end_loc FROM veh_base WHERE end_loc IS NOT NULL';

    // Apply filters if provided


    if (scope && scope !== "null") {
        nameq += ` AND scope = ${db.escape(scope)}`;
        sizeq += ` AND scope = ${db.escape(scope)}`;
        start_locq += ` AND scope = ${db.escape(scope)}`;
        end_locq += ` AND scope = ${db.escape(scope)}`;
    }

    if (dayOfWeek) {
        nameq += ` AND start_day = ${db.escape(dayOfWeek)}`;
        sizeq += ` AND start_day = ${db.escape(dayOfWeek)}`;
        start_locq += ` AND start_day = ${db.escape(dayOfWeek)}`;
        end_locq += ` AND start_day = ${db.escape(dayOfWeek)}`;
    }

    if (type && type !== "null") {
        if (type == '1') {
            if (shift && shift !== "null") {
                nameq += ` AND shift = ${db.escape(shift)}`;
                sizeq += ` AND shift = ${db.escape(shift)}`;
                start_locq += ` AND shift = ${db.escape(shift)}`;
                end_locq += ` AND shift = ${db.escape(shift)}`;
            }
        } else if (type == '2') {
            // Handle AM/PM shifts
            nameq += ` AND shift IN ('AM', 'PM')`;
            sizeq += ` AND shift IN ('AM', 'PM')`;
            start_locq += ` AND shift IN ('AM', 'PM')`;
            end_locq += ` AND shift IN ('AM', 'PM')`;
        }
    }

    // Store the queries
    const queries = {
        name: nameq,
        size: sizeq,
        start_loc: start_locq,
        end_loc: end_locq
    };

    // Initialize results object and query count
    const results = {};
    let completedQueries = 0;
    const totalQueries = Object.keys(queries).length;

    // Execute query function
    const executeQuery = (key, query) => {
        db.query(query, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Database error', details: err });
            }

            // Map results specifically for each query
            if (key === 'size') {
                results[key] = result.map(row => row.trailer_size); // Trailer size is unique
            } else {
                results[key] = result.map(row => row[key]);
            }

            completedQueries++;

            // Send response when all queries are completed
            if (completedQueries === totalQueries) {
                res.json(results);
            }
        });
    };

    // Execute each query in the list
    for (const key in queries) {
        executeQuery(key, queries[key]);
    }
});



route.get('/tsd_byvehId/:id', (req, res) => {
    const { id } = req.params;
    db.query(`SELECT tsd.*, sts.name as st_loc,eds.name as ed_loc,prec.site_name AS prload,posc.site_name as pst_load, v.name FROM tracktor_tsd tsd join vehicle v on tsd.vehicle_id= v.id
    JOIN scopes sts on tsd.start_location = sts.id
    JOIN scopes eds on tsd.end_location = eds.id
    JOIN customer prec on tsd.preload_depot = prec.id
    JOIN customer posc on tsd.preload_depot = posc.id
    WHERE tsd.vehicle_id = ?`, [id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
route.get('/get_vehicle_forOrders/:id', (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM `veh_base` where id = ?', [id],
        (err, vehicleResults) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            db.query('SELECT id,loadable_volume,compartment_no,cast(loadable_volume as int) as size from vehicle_compartments WHERE veh_id = ?', [id],
                (err, compartmentResults) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }

                    if (vehicleResults.length === 0) {
                        res.status(404).json({ error: 'Vehicle not found' });
                        return;
                    }

                    const vehicle = vehicleResults[0];
                    vehicle.compartments = compartmentResults;

                    res.json(vehicle);
                });
        });
});



route.get('/tsd_byId/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM tracktor_tsd WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
route.get('/tsd_edit/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT tsd.*,v.name,v.tractor_code,v.trailer_code, v.start_loc,v.end_loc,v.pre_load,v.post_load FROM `tracktor_tsd` tsd JOIN vehicle v  on tsd.vehicle_id =v.id WHERE tsd.vehicle_id =?', [id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

route.put('/tracktor_tsd/:id', (req, res) => {
    const { id } = req.params;

    const {
        start_day, start_time, end_day, end_time, availability, shift, start_location, end_location,
        preload_depot, postload_depot, driver, start_loc, end_loc, pre_load, post_load
    } = req.body;

    // SQL query for updating tracktor_tsd table
    const sqlQuery = `
    UPDATE tracktor_tsd 
    SET 
        start_day = ?, 
        start_time = ?, 
        end_day = ?, 
        end_time = ?, 
        availability = ?, 
        shift = ?, 
        start_location = ?, 
        end_location = ?, 
        preload_depot = ?, 
        postload_depot = ?, 
        driver = ?     
    WHERE id = ?;
    `;

    db.query(sqlQuery, [start_day, start_time, end_day, end_time, availability, shift, start_location, end_location, preload_depot, postload_depot, driver, id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            // SQL query for updating vehicle table
            db.query(
                'UPDATE vehicle SET start_loc = ?, end_loc = ?, pre_load = ?, post_load = ? WHERE id = ?',
                [start_loc, end_loc, pre_load, post_load, id],
                (err, updateResult) => {
                    if (err) {
                        return res.status(500).json({ message: err.message });
                    }

                    // Successful response
                    res.status(200).json({ message: 'Status updated successfully', status: 200 });
                }
            );
        }
    );
});

route.put('/plan_multtsd_edit/:am_pm/:shift_ord', (req, res) => {
    const { shift_ord, am_pm } = req.params; // `id` would be a string like "1,2"
    const { ids } = req.body;
    // Convert the comma-separated string into an array of integers
    const idss = ids.split(',').map(Number); // Converts "1,2" into [1, 2]

    const {
        start_time, end_time, availability, start_location, end_location,
        preload_depot, postload_depot, contact_type, start_loc, end_loc, pre_load, post_load
    } = req.body;

    if (!Array.isArray(idss) || idss.length === 0) {
        return res.status(400).json({ message: 'Please provide a valid array of IDs' });
    }

    // Define the SQL queries with placeholders
    let tracktorSqlQuery, tracktorParams, vehicleSqlQuery, vehicleParams;

    // If `shift_ord` is 1, include the `shift` condition
    if (shift_ord == 1) {
        tracktorSqlQuery = `
            UPDATE tracktor_tsd 
            SET 
                start_time = ?, 
                end_time = ?, 
                availability = ?, 
                start_location = ?, 
                end_location = ?, 
                preload_depot = ?, 
                postload_depot = ?, 
                contact_type = ? 
            WHERE vehicle_id IN (?) 
            AND shift = ?;
        `;
        tracktorParams = [start_time, end_time, availability, start_location, end_location, preload_depot, postload_depot, contact_type, idss, am_pm];
    } else {
        // If `shift_ord` is not 1, don't include the `shift` condition
        tracktorSqlQuery = `
            UPDATE tracktor_tsd 
            SET 
                start_time = ?, 
                end_time = ?, 
                availability = ?, 
                start_location = ?, 
                end_location = ?, 
                preload_depot = ?, 
                postload_depot = ?, 
                contact_type = ? 
            WHERE vehicle_id IN (?);
        `;
        tracktorParams = [start_time, end_time, availability, start_location, end_location, preload_depot, postload_depot, contact_type, idss];
    }

    // Query to update `vehicle` table
    vehicleSqlQuery = `
        UPDATE vehicle 
        SET start_loc = ?, end_loc = ?, pre_load = ?, post_load = ? 
        WHERE id IN (?);
    `;
    vehicleParams = [start_location, end_location, preload_depot, postload_depot, idss];

    // Execute the first query to update the `tracktor_tsd` table
    db.query(tracktorSqlQuery, tracktorParams, (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error updating tracktor_tsd: ' + err.message });
        }

        // If the first query succeeds, execute the second query to update the `vehicle` table
        db.query(vehicleSqlQuery, vehicleParams, (err, updateResult) => {
            if (err) {
                return res.status(500).json({ message: 'Error updating vehicle: ' + err.message });
            }

            // Successful response
            res.status(200).json({ message: 'Status updated successfully for all specified vehicles', status: 200 });
        });
    });
});
route.put('/plan_multtsd_edit3', (req, res) => {
    const { ids } = req.body; // `id` would be a string like "13" or "13,14"

    // Convert the comma-separated string into an array of integers
    // const idss = ids.split(',').map(Number); // Converts "13" into [13] or "13,14" into [13, 14]

    const {
        start_time, end_time, availability, shift, start_location, end_location,
        preload_depot, postload_depot, driver, contact_type, start_loc, end_loc, pre_load, post_load
    } = req.body;

    // if (!Array.isArray(idss) || idss.length === 0) {
    //     return res.status(400).json({ message: 'Please provide a valid array of IDs' });
    // }

    // SQL query to update `tracktor_tsd` table for multiple `vehicle_id` values
    const tracktorSqlQuery = `
    UPDATE tracktor_tsd 
    SET 
     
        start_time = ?, 
        end_time = ?, 
        availability = ?, 
        shift = ?, 
        start_location = ?, 
        end_location = ?, 
        preload_depot = ?, 
        postload_depot = ?, 
        driver = ?, 
        contact_type = ? 
    WHERE vehicle_id IN (?) AND shit;
    `;

    // SQL query to update `vehicle` table for multiple `id` values
    const vehicleSqlQuery = `
    UPDATE vehicle 
    SET start_loc = ?, end_loc = ?, pre_load = ?, post_load = ? 
    WHERE id IN (?);
    `;

    // First query to update `tracktor_tsd` table
    db.query(tracktorSqlQuery, [start_time, end_time, availability, shift, start_location, end_location, preload_depot, postload_depot, driver, contact_type, ids], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error updating tracktor_tsd: ' + err.message });
        }

        // Second query to update `vehicle` table
        db.query(vehicleSqlQuery, [start_loc, end_loc, pre_load, post_load, ids], (err, updateResult) => {
            if (err) {
                return res.status(500).json({ message: 'Error updating vehicle: ' + err.message });
            }

            // Successful response
            res.status(200).json({ message: 'Status updated successfully for all specified vehicles', status: 200 });
        });
    });
});

route.put('/plan_multtsd_edit2', (req, res) => {
    const { id } = req.body; // `id` would be a string like "1,2"

    // Convert the comma-separated string into an array of integers
    const ids = id.split(',').map(Number); // Converts "1,2" into [1, 2]

    const {
        start_day, start_time, end_day, end_time, availability, shift, start_location, end_location,
        preload_depot, postload_depot, driver, contact_type, start_loc, end_loc, pre_load, post_load
    } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Please provide a valid array of IDs' });
    }

    // Generate placeholders for each ID
    const placeholders = ids.map(() => '?').join(',');

    // SQL query to update `tracktor_tsd` table for multiple `vehicle_id` values
    const tracktorSqlQuery = `
    UPDATE tracktor_tsd 
    SET 
        start_day = ?, 
        start_time = ?, 
        end_day = ?, 
        end_time = ?, 
        availability = ?, 
        shift = ?, 
        start_location = ?, 
        end_location = ?, 
        preload_depot = ?, 
        postload_depot = ?, 
        driver = ?, 
        contact_type = ? 
    WHERE vehicle_id IN (${placeholders});
    `;

    // SQL query to update `vehicle` table for multiple `id` values
    const vehicleSqlQuery = `
    UPDATE vehicle 
    SET start_loc = ?, end_loc = ?, pre_load = ?, post_load = ? 
    WHERE id IN (${placeholders});
    `;

    // First query to update `tracktor_tsd` table
    db.query(tracktorSqlQuery, [
        start_day, start_time, end_day, end_time, availability, shift, start_location, end_location,
        preload_depot, postload_depot, driver, contact_type, ...ids
    ], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error updating tracktor_tsd: ' + err.message });
        }

        // Second query to update `vehicle` table
        db.query(vehicleSqlQuery, [
            start_loc, end_loc, pre_load, post_load, ...ids
        ], (err, updateResult) => {
            if (err) {
                return res.status(500).json({ message: 'Error updating vehicle: ' + err.message });
            }

            // Successful response
            res.status(200).json({ message: 'Status updated successfully for all specified vehicles', status: 200 });
        });
    });
});

route.put('/plan_tsd_edit/:id', (req, res) => {
    const { id } = req.params;

    const {
        start_day, start_time, end_day, end_time, availability, shift, start_location, end_location,
        preload_depot, postload_depot, driver, contact_type, start_loc, end_loc, pre_load, post_load
    } = req.body;

    // SQL query for updating tracktor_tsd table
    const sqlQuery = `
    UPDATE tracktor_tsd 
    SET 
        
        start_time = ?, 
        
        end_time = ?, 
        availability = ?, 
        shift = ?, 
        start_location = ?, 
        end_location = ?, 
        preload_depot = ?, 
        postload_depot = ?, 
        driver = ?, 
        contact_type = ?
    WHERE vehicle_id = ?;
    `;

    // First query to update tracktor_tsd table
    db.query(sqlQuery, [start_day, start_time, end_day, end_time, availability, shift, start_location, end_location, preload_depot, postload_depot, driver, contact_type, id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error updating tracktor_tsd: ' + err.message });
        }

        // SQL query for updating vehicle table
        const updateVehicleQuery = `
            UPDATE vehicle 
            SET start_loc = ?, end_loc = ?, pre_load = ?, post_load = ? 
            WHERE id = ?
        `;

        // Second query to update vehicle table
        db.query(updateVehicleQuery, [start_location, end_location, preload_depot, postload_depot, id], (err, updateResult) => {
            if (err) {
                return res.status(500).json({ message: 'Error updating vehicle: ' + err.message });
            }

            // Successful response
            res.status(200).json({ message: 'Status updated successfully', status: 200 });
        });
    });
});




route.post('/vehicle', (req, res) => {
    const {
        name, tractor_code, tractor_reg, tracktor_reg2, trailer_reg2, tracktor_cv, rigid, gsap_haulier, user_field, trailer_code, trailer_reg, scope, trailer_payload, active, trailer_size, vehicle_group, ms_alu
    } = req.body;

    db.query(
        'INSERT INTO vehicle (name, tractor_code, tractor_reg, rigid, gsap_haulier, user_field, trailer_code, trailer_reg, scope, trailer_payload, active, trailer_size,tracktor_reg2,trailer_reg2,tracktor_cv,vehicle_group,cvweight,ms_alu) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [name, tractor_code, tractor_reg, rigid, gsap_haulier, user_field, trailer_code, trailer_reg, scope, trailer_payload, active, trailer_size, tracktor_reg2, trailer_reg2, tracktor_cv, vehicle_group, trailer_payload, ms_alu],
        (err, result) => {
            if (err) {
                return res.json({ message: err, status: 500 });
            } else {
                const vehicleId = result.insertId;
                db.query(
                    'INSERT INTO vehicle_properties (veh_id, plan_abb, volume, weight, loading_factor, dicharge_factor, fuel_type, is_rigid, m_drop_all, expiry_date, parking_location) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                    [vehicleId, 0, trailer_size, trailer_payload, 0, 0, 0, 0, 0, 0, 0],
                    (err, result) => {
                        if (err) {
                            return res.json({ message: err, status: 500 });
                        } else {
                            return res.json({ message: 'Vehicle and properties added successfully', id: vehicleId, status: 200 });
                        }
                    }
                );
            }
        }
    );
});
route.post('/create_order', (req, res) => {
    const { orders, scope } = req.body;

    if (!orders || !scope) {
        return res.status(400).json({ message: 'Please provide both orders and scope' });
    }

    // Step 1: Check if a record exists for the same scope and current date
    const checkQuery = `
        SELECT id FROM orders_log 
        WHERE scope = ? AND DATE(created_at) = CURDATE()
    `;

    db.query(checkQuery, [scope], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error: ' + err.message });
        }

        if (results.length > 0) {
            // Step 2: If the record exists, update it
            const updateQuery = `
                UPDATE orders_log 
                SET orders = ? 
                WHERE id = ?
            `;

            db.query(updateQuery, [orders, results[0].id], (updateErr) => {
                if (updateErr) {
                    return res.status(500).json({ message: 'Error updating orders: ' + updateErr.message });
                }
                return res.status(200).json({ message: 'Orders updated successfully' });
            });
        } else {
            // Step 3: If no record exists, insert a new one
            const insertQuery = `
                INSERT INTO orders_log (orders, scope) 
                VALUES (?, ?)
            `;

            db.query(insertQuery, [orders, scope], (insertErr) => {
                if (insertErr) {
                    return res.status(500).json({ message: 'Error creating orders: ' + insertErr.message });
                }
                return res.status(201).json({ message: 'Orders created successfully' });
            });
        }
    });
});
route.get('/get_orders/:scope', (req, res) => {
    const { scope } = req.params; // Use req.params to get the route parameter

    db.query(
        ` SELECT * FROM orders_log 
        WHERE scope = ? AND DATE(created_at) = CURDATE()`,
        [scope],
        (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Database error: ' + err.message });
            }

            res.json(results);
        }
    );
});

route.post('/create_shipment', (req, res) => {
    const { shipment, scope, date } = req.body;

    if (!shipment || !scope) {
        return res.status(400).json({ message: 'Please provide both shipment and scope' });
    }

    // Step 1: Check if a record exists for the same scope and current date
    const checkQuery = `
        SELECT id FROM full_shipment 
        WHERE scope = ? AND created_at = ?
    `;

    db.query(checkQuery, [scope, date], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error: ' + err.message });
        }

        if (results.length > 0) {
            // Step 2: If the record exists, update it
            const updateQuery = `
                UPDATE full_shipment 
                SET shipment = ? 
                WHERE id = ?
            `;

            db.query(updateQuery, [shipment, results[0].id], (updateErr) => {
                if (updateErr) {
                    return res.status(500).json({ message: 'Error updating shipment: ' + updateErr.message });
                }
                return res.status(200).json({ message: 'Shipment updated successfully' });
            });
        } else {
            // Step 3: If no record exists, insert a new one
            const insertQuery = `
                INSERT INTO full_shipment (shipment, scope,created_at) 
                VALUES (?, ?,?)
            `;

            db.query(insertQuery, [shipment, scope, date], (insertErr) => {
                if (insertErr) {
                    return res.status(500).json({ message: 'Error creating shipment: ' + insertErr.message });
                }
                return res.status(201).json({ message: 'Shipment created successfully' });
            });
        }
    });
});
route.get('/get_shipments/:scope', (req, res) => {
    const { scope } = req.params; // Use req.params to get the route parameter

    db.query(
        `SELECT * FROM full_shipment WHERE scope = ? AND DATE(created_at) = CURDATE()`,
        [scope],
        (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Database error: ' + err.message });
            }

            res.json(results);
        }
    );
});

route.post('/update_orders/:id', (req, res) => {
    const { id } = req.params;

    const { shipTo, customerName, address, dispatchNumber, minQuantity, maxQty, target, materialCode, status, orderId } = req.body;
    const sqlQuery = 'UPDATE `orders_log` SET `shipTo`=?,`customerName`=?,`address`=?,`dispatchNumber`=?,`minQuantity`=?,`maxQty`=?,`target`=?,`materialCode`=?,`status`=? WHERE `orderId` =?`';

    db.query(sqlQuery, [shipTo, customerName, address, dispatchNumber, minQuantity, maxQty, target, materialCode, status, orderId],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 });
            } else {

                res.json({ message: 'Status Updated successfully', status: 200 });


            }
        }
    );


});

route.put('/vehicle/:id', (req, res) => {
    const { id } = req.params;

    const { name, tractor_code, tractor_reg, rigid, gsap_haulier, user_field, trailer_code, trailer_reg, scope, trailer_payload, trailer_size, tracktor_reg2, trailer_reg2, tracktor_cv, vehicle_group, ms_alu } = req.body;

    const sqlQuery = `
        UPDATE vehicle 
        SET name = ?, 
            tractor_code = ?, 
            tractor_reg = ?, 
            rigid = ?, 
            gsap_haulier = ?, 
            user_field = ?, 
            trailer_code = ?, 
            trailer_reg = ?, 
            scope = ?, 
            trailer_payload = ?, 
            trailer_size = ? ,
            tracktor_reg2=?,
            trailer_reg2=?,
            tracktor_cv=?,
            vehicle_group=?,
            cvweight=?,
            ms_alu=?
        WHERE id = ?;
    `;

    const veh_pro = 'UPDATE vehicle_properties SET volume=?,weight=? WHERE veh_id=?';

    db.query(sqlQuery, [name, tractor_code, tractor_reg, rigid, gsap_haulier, user_field, trailer_code, trailer_reg, scope, trailer_payload, trailer_size, tracktor_reg2, trailer_reg2, tracktor_cv, vehicle_group, trailer_payload, ms_alu, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 });
            } else {
                db.query(veh_pro, [trailer_size, trailer_payload, id],
                    (err, result) => {
                        if (err) {
                            res.json({ message: err, status: 500 });
                        } else {
                            res.json({ message: 'Status Updated successfully', status: 200 });
                        }
                    }
                );

            }
        }
    );


});


route.put('/vehicle_status/:id', (req, res) => {
    const { id } = req.params;

    const { status

    } = req.body;

    db.query('UPDATE `vehicle` SET `active`=?  where id =?',
        [status, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Status Updated successfully', status: 200 });

            }

        });
});

route.put('/vehicle/:id', (req, res) => {
    const { id } = req.params;

    const { name, tractor_code, tractor_reg, rigid, gsap_haulier, user_field, trailer_code, trailer_reg, scope, trailer_payload, trailer_size, tracktor_reg2, trailer_reg2, tracktor_cv, vehicle_group, ms_alu } = req.body;

    const sqlQuery = `
        UPDATE vehicle 
        SET name = ?, 
            tractor_code = ?, 
            tractor_reg = ?, 
            rigid = ?, 
            gsap_haulier = ?, 
            user_field = ?, 
            trailer_code = ?, 
            trailer_reg = ?, 
            scope = ?, 
            trailer_payload = ?, 
            trailer_size = ? ,
            tracktor_reg2=?,
            trailer_reg2=?,
            tracktor_cv=?,
            vehicle_group=?,
            cvweight=?,
            ms_alu=?
        WHERE id = ?;
    `;

    const veh_pro = 'UPDATE vehicle_properties SET volume=?,weight=? WHERE veh_id=?';

    db.query(sqlQuery, [name, tractor_code, tractor_reg, rigid, gsap_haulier, user_field, trailer_code, trailer_reg, scope, trailer_payload, trailer_size, tracktor_reg2, trailer_reg2, tracktor_cv, vehicle_group, trailer_payload, ms_alu, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 });
            } else {
                db.query(veh_pro, [trailer_size, trailer_payload, id],
                    (err, result) => {
                        if (err) {
                            res.json({ message: err, status: 500 });
                        } else {
                            res.json({ message: 'Status Updated successfully', status: 200 });
                        }
                    }
                );

            }
        }
    );


});
route.delete('/vehicle/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM vehicle WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Status deleted successfully', status: 200 });
    });
});

route.put('/veh_trackedit/:id', (req, res) => {
    const { id } = req.params;

    const { weight, scope, expiry_date, parking_loc, user_field } = req.body;

    const sqlQuery = 'UPDATE vehicle SET cvweight=?,scope=?,expiry_date=?,parking_loc=?,user_field=? WHERE id=?';


    db.query(sqlQuery, [weight, scope, expiry_date, parking_loc, user_field, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 });
            } else {
                res.json({ message: 'Status Updated successfully', status: 200 });

            }
        }
    );
});
route.put('/veh_propedit/:id', (req, res) => {
    const { id } = req.params;

    const { volume, weight, fuel_type, simultaneous_loading, product_subs, m_drop_all, co2det } = req.body;

    const sqlQuery = 'UPDATE vehicle SET trailer_size=?,cvweight=?,fuel_type=?,drop_last=?,simultaneous_loading=?,product_subs=?,co2_detail=? WHERE id=?';

    const weightedit = `UPDATE  vehicle set cvweight =? where id =?`;
    db.query(sqlQuery, [volume, weight, fuel_type, m_drop_all, simultaneous_loading, product_subs, co2det, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 });
            } else {
                db.query(weightedit, [weight, id],
                    (err, result) => {
                        if (err) {
                            res.json({ message: err, status: 500 });
                        } else {
                            res.json({ message: 'Status Updated successfully', status: 200 });
                        }
                    }
                );

            }
        }
    );
});

/////////////////////////////////////////////////////////// Vehicles Properties  //////////////////////////

route.get('/vehicle_property', (req, res) => {
    db.query('SELECT * FROM vehicle_properties', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/vehicle_property/:id', (req, res) => {
    const { id } = req.params;

    // First query to get vehicle properties
    db.query('SELECT * FROM vehicle WHERE id = ?', [id], (err, vehicleProperties) => {
        if (err) throw err;

        if (vehicleProperties.length > 0) {
            // Second query to get vehicle products
            db.query('SELECT product_id FROM vehicle_products WHERE veh_id = ?', [id], (err, vehicleProducts) => {
                if (err) throw err;

                // Nest the vehicleProducts inside the vehicleProperties object
                const result = {
                    ...vehicleProperties[0],
                    vehicleProducts: vehicleProducts
                };

                res.json(result);
            });
        } else {
            res.status(404).json({ message: 'Vehicle property not found' });
        }
    });
});



route.get('/veh_byid&p_id/:id/:p_id', (req, res) => {
    const { id, p_id } = req.params;
    db.query('SELECT * FROM `vehicle_products` WHERE veh_id =? and product_id=?', [id, p_id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
route.post('/vehicle_property', (req, res) => {
    const { veh_id, plan_abb, volume, weight, loading_factor, dicharge_factor, fuel_type, is_rigid, m_drop_all, expiry_date, parking_location


    } = req.body;

    db.query('INSERT INTO `vehicle_properties`(`veh_id`, `plan_abb`, `volume`, `weight`, `loading_factor`, `dicharge_factor`, `fuel_type`, `is_rigid`, `m_drop_all`, `expiry_date`, `parking_location`) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [veh_id, plan_abb, volume, weight, loading_factor, dicharge_factor, fuel_type, is_rigid, m_drop_all, expiry_date, parking_location


        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Status added successfully', id: result.insertId, status: 200 });

            }

        });
});

route.post('/assign_productv', (req, res) => {
    const { veh_id, product_id


    } = req.body;

    db.query('INSERT INTO `vehicle_products`(`veh_id`, `product_id`) VALUES (?,?)',
        [veh_id, product_id


        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Product Assign successfully', id: result.insertId, status: 200 });

            }

        });
});


route.put('/vehicle_property/:id', (req, res) => {
    const { id } = req.params;

    const { plan_abb, volume, weight, loading_factor, dicharge_factor, fuel_type, is_rigid, simultaneous_loading, product_subs, m_drop_all, expiry_date, parking_location } = req.body;

    const sqlQuery = `UPDATE vehicle_properties 
    SET 
      
        plan_abb = ?, 
        volume = ?, 
        weight = ?, 
        loading_factor = ?, 
        dicharge_factor = ?, 
        fuel_type = ?, 
        is_rigid = ?, 
        simultaneous_loading=?,
        product_subs=?,
        m_drop_all = ?, 
        expiry_date = ?, 
        parking_location = ? 
    WHERE veh_id = ?;`

    db.query(sqlQuery, [plan_abb, volume, weight, loading_factor, dicharge_factor, fuel_type, is_rigid, simultaneous_loading, product_subs, m_drop_all, expiry_date, parking_location, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 });
            } else {
                res.json({ message: 'Status Updated successfully', status: 200 });
            }
        }
    );
});

route.put('/vehicle_tracktors/:id', (req, res) => {
    const { id } = req.params;
    const { weight, discharge_factor, expiry_date, parking_location, scope } = req.body;

    const sqlQuery = `UPDATE vehicle_properties 
    SET 
        weight = ?, 
        dicharge_factor = ?, 
        expiry_date = ?, 
        parking_location = ? 
    WHERE veh_id = ?;`;

    const scope_edit = 'UPDATE vehicle SET scope = ? WHERE id = ?;';

    db.query(sqlQuery, [weight, discharge_factor, expiry_date, parking_location, id], (err, result) => {
        if (err) {
            return res.json({ message: err, status: 500 });
        } else {
            db.query(scope_edit, [scope, id], (err, result) => {
                if (err) {
                    return res.json({ message: err, status: 500 });
                } else {
                    return res.json({ message: 'Status Updated successfully', status: 200 });
                }
            });
        }
    });
});


route.get('/vehicle_tracktors/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * from vehicle where id =?', [id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

route.delete('/vehicle_property/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM vehicle_properties WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Status deleted successfully', status: 200 });
    });
});

/////////////////////////////////////////////////////////// Vehicles Compartment  //////////////////////////

route.get('/vehicle_compartment', (req, res) => {
    db.query('SELECT * FROM vehicle_compartments', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/vehicle_compartment/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM vehicle_compartments WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.get('/vehicle_compartmentbyveh/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM vehicle_compartments WHERE veh_id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
route.post('/vehicle_compartment', (req, res) => {
    const { veh_id, compartment_no, loadable_volume, hazardous_volume, must_use_indicator, manifold_value_indicator, must_use_split, bulkload_indicator, part_loading_indicator


    } = req.body;

    db.query('INSERT INTO `vehicle_compartments`(veh_id,`compartment_no`, `loadable_volume`, `hazardous_volume`, `must_use_indicator`, `manifold_value_indicator`,must_use_split, `bulkload_indicator`, `part_loading_indicator`) VALUES (?,?,?,?,?,?,?,?,?)',
        [
            veh_id, compartment_no, loadable_volume, hazardous_volume, must_use_indicator, manifold_value_indicator, must_use_split, bulkload_indicator, part_loading_indicator


        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Status added successfully', id: result.insertId, status: 200 });

            }

        });
});


route.put('/vehicle_compartment/:id', (req, res) => {
    const { id } = req.params;

    const { compartment_no, loadable_volume, hazardous_volume, must_use_indicator, manifold_value_indicator, must_use_split, bulkload_indicator, part_loading_indicator } = req.body;

    const sqlQuery = `UPDATE vehicle_compartments 
    SET 
        compartment_no = ?, 
        loadable_volume = ?, 
        hazardous_volume = ?, 
        must_use_indicator = ?, 
        manifold_value_indicator = ?, 
        must_use_split=?,
        bulkload_indicator = ?, 
        part_loading_indicator = ? 
    WHERE id = ?;
    `

    db.query(sqlQuery, [compartment_no, loadable_volume, hazardous_volume, must_use_indicator, manifold_value_indicator, must_use_split, bulkload_indicator, part_loading_indicator, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 });
            } else {
                res.json({ message: 'Status Updated successfully', status: 200 });
            }
        }
    );
});

route.delete('/vehicle_compartment/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM vehicle_compartments WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Status deleted successfully', status: 200 });
    });
});
/////////////////////////////////////////////////////////// Data Management  //////////////////////////

/////////////////////////////////////////////////////////// Scope  //////////////////////////

route.get('/scope', (req, res) => {
    db.query('SELECT * FROM scopes', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/scope/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM scopes WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});

route.post('/scope', (req, res) => {
    const { name, radius, area, latiitude, longitude


    } = req.body;

    db.query('INSERT INTO `scopes`( `name`, `radius`, `area`, `latiitude`, `longitude`) VALUES (?,?,?,?,?)',
        [
            name, radius, area, latiitude, longitude


        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Scope added successfully', id: result.insertId, status: 200 });

            }

        });
});


route.put('/scope/:id', (req, res) => {
    const { id } = req.params;

    const { name, radius, area, latiitude, longitude } = req.body;

    const sqlQuery = 'UPDATE `scopes` SET  `name` = ?, `radius` = ?, `area` = ?, `latiitude` = ?, `longitude` = ? WHERE id = ?';


    db.query(sqlQuery, [name, radius, area, latiitude, longitude, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 });
            } else {
                res.json({ message: 'Scope Updated successfully', status: 200 });
            }
        }
    );
});

route.delete('/scope/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM scopes WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Status deleted successfully', status: 200 });
    });
});


/////////////////////////////////////////////////////////// Scope  //////////////////////////

route.get('/product', (req, res) => {
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
) p2 ON p1.id = p2.min_id;`, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/product/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM product WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.get('/product_bypcode/:code', (req, res) => {
    const { code } = req.params;
    db.query('SELECT * FROM `product` WHERE code=?', [code], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.post('/product', (req, res) => {
    const { name, code, density, plain_board_ab


    } = req.body;

    db.query('INSERT INTO`product`(`name`, `code`, `density`, `plain_board_ab`) VALUES(?,?,?,?)',
        [name, code, density, plain_board_ab


        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Product added successfully', id: result.insertId, status: 200 });

            }

        });
});


route.put('/product/:id', (req, res) => {
    const { id } = req.params;

    const { name, code, density, plain_board_ab } = req.body;

    const sqlQuery = 'UPDATE `product` SET `name` = ?, `code` = ?, `density` = ?, `plain_board_ab` = ? WHERE id = ?';


    db.query(sqlQuery, [name, code, density, plain_board_ab, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 });
            } else {
                res.json({ message: 'Scope Updated successfully', status: 200 });
            }
        }
    );
});

route.delete('/product/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM product WHERE id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Status deleted successfully', status: 200 });
    });
});

/////////////////////////////////////////////////////////// users  //////////////////////////

route.get('/user', (req, res) => {
    db.query(`SELECT u.*,r.id as rol_id,r.roles,r.created_at,r.updated_at from users u JOIN roles r ON
    u.role =r.id `, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/user/:id', (req, res) => {
    const { id } = req.params;
    db.query(`SELECT u.*,r.id as rol_id,r.roles,r.created_at,r.updated_at from users u JOIN roles r ON
    u.role =r.id where u.id=?;`, [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.post('/user', (req, res) => {
    const { name, email, password, role } = req.body;

    // Insert into hauliers table
    const haulierQuery = 'INSERT INTO `users`(`name`, `email`, `password`,`role`) VALUES (?,?,?,?)';
    db.query(haulierQuery, [name, email, password, role], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error inserting haulier');
        }
        else {


            res.status(200).send('Haulier and emails inserted successfully');
        }
    });
});
route.post('/user/:id', (req, res) => {
    const id = req.params.id;
    const { name, email, password, role } = req.body;

    // Update haulier details (name and phone)
    const updateHaulierQuery = 'UPDATE `users` SET `name`=?,`email`=?,`password`=?,`description`=?,`role`=?';
    db.query(updateHaulierQuery, [name, email, password, role, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error updating haulier details');
        } else {
            res.status(200).send('Haulier and emails updated successfully');

        }

        // If everything went well, send success response

    });
});

route.delete('/user/:id', (req, res) => {
    const haulierId = req.params.id;

    // First, delete the associated emails
    const deleteEmailsQuery = `DELETE FROM users WHERE id = ?`;
    db.query(deleteEmailsQuery, [haulierId], (err, deleteEmailsResult) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error deleting haulier emails');
        }

        else {
            res.status(200).send('Haulier and associated emails deleted successfully');
        }
    });
});
/////////////////////////////////////////////////////////// Hauliers Start  //////////////////////////////////

route.get('/haulier', (req, res) => {
    db.query(`SELECT h.id, h.haulier_name, h.phone, GROUP_CONCAT(he.email SEPARATOR ' , ') AS emails
    FROM hauliers h
    JOIN haulier_email he ON h.id = he.haulier_id
    GROUP BY h.id;`, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/haulier/:id', (req, res) => {
    const { id } = req.params;
    db.query(`SELECT h.id, h.haulier_name, h.phone, GROUP_CONCAT(he.email SEPARATOR ' , ') AS emails
    FROM hauliers h
    JOIN haulier_email he ON h.id = he.haulier_id
    WHERE h.id = ?
    GROUP BY h.id `, [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.post('/haulier', (req, res) => {
    const { haulier_name, phone, email_fields } = req.body;

    // Insert into hauliers table
    const haulierQuery = `INSERT INTO hauliers (haulier_name, phone) VALUES (?, ?)`;
    db.query(haulierQuery, [haulier_name, phone], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error inserting haulier');
        }

        const haulier_id = result.insertId; // Get the inserted haulier ID

        // Insert emails into haulier_email table
        const emailQuery = `INSERT INTO haulier_email (haulier_id, email) VALUES (?, ?)`;

        email_fields.forEach(email => {
            db.query(emailQuery, [haulier_id, email], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error inserting haulier email');
                }
            });
        });

        res.status(200).send('Haulier and emails inserted successfully');
    });
});
route.post('/haulier/:id', (req, res) => {
    const haulierId = req.params.id;
    const { haulier_name, phone, email_fields } = req.body;

    // Update haulier details (name and phone)
    const updateHaulierQuery = `UPDATE hauliers SET haulier_name = ?, phone = ? WHERE id = ?`;
    db.query(updateHaulierQuery, [haulier_name, phone, haulierId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error updating haulier details');
        }

        // Delete existing emails
        const deleteEmailsQuery = `DELETE FROM haulier_email WHERE haulier_id = ?`;
        db.query(deleteEmailsQuery, [haulierId], (err, deleteResult) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error deleting existing haulier emails');
            }

            // Prepare and insert the new list of emails
            const insertEmailsQuery = `INSERT INTO haulier_email (haulier_id, email) VALUES ?`;
            const emailValues = email_fields.map(email => [haulierId, email]);

            db.query(insertEmailsQuery, [emailValues], (err, insertResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error inserting new haulier emails');
                }

                // If everything went well, send success response
                res.status(200).send('Haulier and emails updated successfully');
            });
        });
    });
});

route.delete('/haulier/:id', (req, res) => {
    const haulierId = req.params.id;

    // First, delete the associated emails
    const deleteEmailsQuery = `DELETE FROM haulier_email WHERE haulier_id = ?`;
    db.query(deleteEmailsQuery, [haulierId], (err, deleteEmailsResult) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error deleting haulier emails');
        }

        // Then, delete the haulier record
        const deleteHaulierQuery = `DELETE FROM hauliers WHERE id = ?`;
        db.query(deleteHaulierQuery, [haulierId], (err, deleteHaulierResult) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error deleting haulier');
            }

            // Send success response if both deletions succeed
            res.status(200).send('Haulier and associated emails deleted successfully');
        });
    });
});




/////////////////////////////////////////////////////////// Hauliers End  //////////////////////////////////
route.get('/comp_rules', (req, res) => {

    db.query('SELECT * FROM `compartment`   ', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/comp_rules/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM `compartment` WHERE id =?;', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.get('/comp_rules_bycomp/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM `compartment` WHERE compartments=?;', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});



route.post('/comp_rules', (req, res) => {
    const { name, compartments, seq


    } = req.body;

    db.query('INSERT INTO `compartment` (`name`, `compartments`, `seq`)VALUES (?, ?, ?)ON DUPLICATE KEY UPDATE`name` = VALUES(`name`),`compartments` = VALUES(`compartments`),`seq` = VALUES(`seq`);',
        [name, compartments, seq


        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Compartment Rules added successfully', id: result.insertId, status: 200 });

            }

        });
});


route.put('/comp_rules/:id', (req, res) => {
    const { id } = req.params;

    const { name, compartments, seq } = req.body;

    const sqlQuery = `UPDATE compartment 
    SET 
        name = ?, 
        compartments = ?, 
        seq = ?
    WHERE id = ?`;


    db.query(sqlQuery, [name, compartments, seq, id],
        (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 });
            } else {
                res.json({ message: 'Scope Updated successfully', status: 200 });
            }
        }
    );
});

route.delete('/comp_rules/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM compartment WHERE  id = ?', [id], (err) => {
        if (err) throw err;
        res.json({ message: 'Status deleted successfully', status: 200 });
    });
});


//////////////////////////////////////////////////////////// Compartment Rules

/////////////////////////////////////////////////////////// Shift Planing////////////////////////////////////
route.post('/shift_planing', (req, res) => {
    const { day, shift, start_time, end_time, scope } = req.body;

    db.query('INSERT INTO `shift_planning`( `day`, `shift`, `start_time`, `end_time`, `scope`) VALUES (?,?,?,?,?)',
        [day, shift, start_time, end_time, scope], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Compartment Rules added successfully', id: result.insertId, status: 200 });

            }

        });
});

//////////////////////////////////////////////////////////// Apis /////////////////////////////////////////////////




//////////////////////////////////////////////////////// Routs /////////////////////////////////////////////////////
//// ======================================Customers
route.get('/customers', (req, res, next) => {
    db.query('SELECT * FROM customer', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        else {
            res.render('admin/customers/customers_list', { title: 'Customers', customer: results });

        }

    });
})

route.get('/customer_contacts', (req, res, next) => {
    db.query('SELECT * FROM customer_contacts', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        else {
            res.render('admin/customers/customers_list', { title: 'Customers', customer: results });

        }

    });
})


route.get('/customer_details', (req, res, next) => {
    res.render('admin/customers/customer_details', { title: 'Customers' });
})
route.get('/customer_tanks', (req, res, next) => {
    const id = req.query.id;
    res.render('admin/customers/customer_tank', { title: 'Customers Tanks', id: id });


})

route.get('/customer_address', (req, res) => {
    const id = req.query.id; // Retrieve id parameter from query
    // Process the id parameter as needed
    res.render('admin/customers/customer_address', {
        title: 'Customer Address',
        id: id
    });
});
route.get('/customer_group', (req, res, next) => {
    const id = req.query.id;
    res.render('admin/customers/customer_groups', { title: 'Customers', id: id });
})
route.get('/customer_event', (req, res, next) => {
    const id = req.query.id
    db.query('SELECT * FROM customer_tanks', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        else {
            res.render('admin/customers/customer_events', { title: 'Customers Events', customer: results, id: id });

        }

    });

})
route.get('/customer_event_cusId', (req, res, next) => {
    const id = req.query.id
    db.query('SELECT * FROM customer_tanks', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        else {
            res.render('admin/customers/customer_events', { title: 'Customers Events', customer: results, id: id });

        }

    });

})
route.get('/customer_status', (req, res, next) => {
    const id = req.query.id;
    res.render('admin/customers/customer_status', {
        title: 'Customer Address',
        id: id
    });
})
route.get('/customer_timing', (req, res, next) => {

    const id = req.query.id
    db.query('SELECT * FROM customer_tanks', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        else {
            res.render('admin/customers/customer_timings', { title: 'Customers Timing', id: id });


        }

    });



})
route.get('/customer_routes', (req, res, next) => {
    const id = req.query.id

    db.query('SELECT * FROM routes', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        else {
            res.render('admin/customers/customer_routes', { title: 'Customers Routes', customer: results, id: id });
        }

    });

})
route.get('/task', (req, res, next) => {
    res.render('admin/customers/task', { title: 'Tasks' });
})
//// ======================================Vehicles 

route.get('/vehicles', (req, res, next) => {
    res.render('admin/vehicle/vehicle_list', { title: 'Vehicle' });
})

route.get('/vehicles_data', (req, res, next) => {
    res.render('admin/vehicle/vehicle_list', { title: 'Vehicle' });
})
route.get('/vehicle_details', (req, res, next) => {
    res.render('admin/vehicle/vehicle_details', { title: 'Details' });
})


route.get('/vehicle_properties', (req, res) => {
    const id = req.query.id; // Retrieve id parameter from query
    // Process the id parameter as needed
    res.render('admin/vehicle/vehicle_properties', {
        title: 'Properties', id: id
    });
});
route.get('/vehicle_tracktor', (req, res, next) => {
    const id = req.query.id
    res.render('admin/vehicle/vehicle_tractor', { title: 'Tracktors', id: id });
})
route.get('/vehicle_trailer', (req, res, next) => {
    const id = req.query.id
    res.render('admin/vehicle/vehicle_trailer', { title: 'Trailers', id: id });
})
route.get('/vehicle_group', (req, res, next) => {
    const id = req.query.id
    res.render('admin/vehicle/vehicle_group', { title: 'Groups', id: id });
})
route.get('/tsd_edit', (req, res, next) => {
    const id = req.query.id
    res.render('admin/vehicle/tsd_edit', { title: 'TSD Edit', id: id });
})
route.get('/hauliers', (req, res, next) => {
    const id = req.query.id
    res.render('admin/data_management/hauliers', { title: 'Hauliers', id: id });
})
//// ======================================Depot 

route.get('/depot', (req, res, next) => {
    res.render('admin/depot/depot_list', { title: 'Depot' });
})
route.get('/depot_tanks', (req, res, next) => {
    const id = req.query.id
    res.render('admin/depot/depot_tank', { title: 'Tanks', id: id });
})
route.get('/depot_address', (req, res, next) => {
    const id = req.query.id
    res.render('admin/depot/depot_address', { title: 'Addresses', id: id });
})
route.get('/depot_group', (req, res, next) => {
    const id = req.query.id
    res.render('admin/depot/depot_groups', { title: 'Groups', id: id });
})
route.get('/depot_event', (req, res, next) => {
    const id = req.query.id
    res.render('admin/depot/depot_events', { title: 'Events', id: id });
})
route.get('/depot_status', (req, res, next) => {
    const id = req.query.id
    res.render('admin/depot/depot_status', { title: 'Statuses', id: id });
})
route.get('/depot_timing', (req, res, next) => {
    const id = req.query.id
    res.render('admin/depot/depot_timings', { title: 'Timings', id: id });
})
route.get('/depot_routes', (req, res, next) => {
    const id = req.query.id
    res.render('admin/depot/depot_routes', { title: 'Routes', id: id });
})

//// ===================================== Parking Location 
route.get('/parkingloc_tanks', (req, res, next) => {
    const id = req.query.id
    res.render('admin/parkingloc/parkingloc_tank', { title: 'Tanks', id: id });
})
route.get('/parkingloc_list', (req, res, next) => {
    res.render('admin/parkingloc/parkingloc_list', { title: 'Parking Locations' });
})
route.get('/parkingloc_address', (req, res, next) => {
    const id = req.query.id
    res.render('admin/parkingloc/parkingloc_address', { title: 'Address', id: id });
})
route.get('/parkingloc_group', (req, res, next) => {
    const id = req.query.id
    res.render('admin/parkingloc/parkingloc_groups', { title: 'Group', id: id });
})
route.get('/parkingloc_event', (req, res, next) => {
    const id = req.query.id
    res.render('admin/parkingloc/parkingloc_events', { title: 'Event', id: id });
})
route.get('/parkingloc_status', (req, res, next) => {
    const id = req.query.id
    res.render('admin/parkingloc/parkingloc_status', { title: 'Status', id: id });
})
route.get('/parkingloc_timing', (req, res, next) => {
    const id = req.query.id
    res.render('admin/parkingloc/parkingloc_timings', { title: 'Timing', id: id });
})
route.get('/parkingloc_routes', (req, res, next) => {
    const id = req.query.id
    res.render('admin/parkingloc/parkingloc_routes', { title: 'Routes', id: id });
})

route.get('/trip', (req, res, next) => {
    res.render('admin/parkingloc/trip_action', { title: 'Trip' });
})
//////////////////////////////////////////////////////// Data Management ////////////////////////////////

route.get('/scopes', (req, res, next) => {
    res.render('admin/data_management/scope', { title: 'Scopes' });
})
route.get('/products', (req, res, next) => {
    res.render('admin/data_management/product', { title: 'Products' });
})
route.get('/users', (req, res, next) => {
    res.render('admin/data_management/users', { title: 'Users' });
})
route.get('/upload_excels', (req, res, next) => {
    res.render('admin/data_management/uploadexcel', { title: 'Users' });
})
route.get('/compartment_rules', (req, res, next) => {
    res.render('admin/data_management/compartment_rules', { title: 'Users' });
})
route.get('/upload_shipments2', (req, res, next) => {
    res.render('admin/data_management/upload_shipment2', { title: 'Upload Shipments' });
})
route.get('/shift_plan', (req, res, next) => {
    res.render('admin/data_management/shift_planing', { title: 'Upload Shipments' });
})

///////////////////////////////////////////////// Plain Board ////////////////////////////

route.get('/plans', (req, res, next) => {
    res.render('admin/plan/plan_board', { title: 'Plan Board' });
})

route.get('/plans_new', (req, res, next) => {
    res.render('admin/plan/plan_new', { title: 'Plan Board' });
})
route.get('/plansnew', (req, res, next) => {
    res.render('admin/plan/plansnewdesign', { title: 'Plan Board' });
})
route.get('/new_plan2', (req, res, next) => {
    res.render('admin/plan/new_plan2', { title: 'Plan Board' });
})

route.get('/compartments', (req, res, next) => {
    const id = req.query.id;
    const t_id = req.query.t_id;
    const shift = req.query.shift;
    res.render('admin/plan/compartment', { title: 'Compartement', id: id, t_id: t_id, shift: shift });
})
/////////////////////////////////////////////     Routes End     ///////////////////////////

route.post('/upload_customers/:scope', (req, res) => {
    const { scope } = req.params;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    sampleFile = req.files.customers.tempFilePath;
    console.log(sampleFile)
    const workbook = xlsx1.readFile(sampleFile);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const data = xlsx1.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length === 0) {
        return res.status(400).json({ error: 'Empty file' });
    }

    const headers = data[0];
    const jsonData = data.slice(1).map(row => {
        return headers.reduce((acc, header, index) => {
            acc[header] = row[index];
            return acc;
        }, {});
    });

    let errorOccurred = false;

    jsonData.forEach((row, index) => {
        const query = `
            INSERT INTO customer (ship_to, site_name, latitude, longitude, town, post_code, country_code, street,is_customer,status,scope)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?,?)
        `;
        const values = [
            row.ShipTo,
            row.SiteName,
            row.Eastings,
            row.Northings,
            row.Town,
            row.PostCode,
            row.CityCode,
            row.Street,
            1,
            1,
            row.ScopeID


        ];
        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Database insertion error:', err);
                if (index === jsonData.length - 1) {
                    return res.status(500).json({ error: 'Customers Import failed' });
                }
                errorOccurred = true;
            }
        });
    });

    if (!errorOccurred) {
        res.json({ message: 'Customers Imported successfully!' });
    }
});
route.post('/upload_products', (req, res) => {

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    sampleFile = req.files.products.tempFilePath;
    console.log(sampleFile)
    const workbook = xlsx1.readFile(sampleFile);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const data = xlsx1.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length === 0) {
        return res.status(400).json({ error: 'Empty file' });
    }

    const headers = data[0];
    const jsonData = data.slice(1).map(row => {
        return headers.reduce((acc, header, index) => {
            acc[header] = row[index];
            return acc;
        }, {});
    });

    let errorOccurred = false;

    jsonData.forEach((row, index) => {
        const query = 'INSERT INTO `product`(`code`,`name`, `density`) VALUES (?,?,?)';
        const values = [
            row.ProductCode,
            row.ProductName,
            row.Density
        ];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Database insertion error:', err);
                if (index === jsonData.length - 1) {
                    return res.status(500).json({ error: 'Products Import failed' });
                }
                errorOccurred = true;
            }
        });
    });

    if (!errorOccurred) {
        res.json({ message: 'Product Imported successfully!' });
    }
});
route.post('/upload_depots/:scope', (req, res) => {
    const { scope } = req.params;
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    sampleFile = req.files.depots.tempFilePath;
    console.log(sampleFile)

    const workbook = xlsx1.readFile(sampleFile);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const data = xlsx1.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length === 0) {
        return res.status(400).json({ error: 'Empty file' });
    }

    const headers = data[0];
    const jsonData = data.slice(1).map(row => {
        return headers.reduce((acc, header, index) => {
            acc[header] = row[index];
            return acc;
        }, {});
    });
    console.log(jsonData)
    let errorOccurred = false;

    jsonData.forEach((row, index) => {
        const query = 'INSERT INTO `customer`( `ship_to`, `site_name`,`short_code`, `is_depot`, `is_park_loc`,`is_customer`, `town`,`street`,`post_code`, `country_code`,status,scope) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';

        const values = [
            row.LocationCode,
            row.Name,
            row.ShortCode,
            (row.IsDepot == "T" ? 1 : 0),
            (row.IsParkingLocation == "T" ? 1 : 0),
            1,
            row.TownAddress,
            row.StreetAddress,
            row.PostCodeAddress,
            row.CountryCodeAddress,
            1,
            row.ScopeID

        ];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Database insertion error:', err);
                if (index === jsonData.length - 1) {
                    return res.status(500).json({ error: 'Depot Import failed' });
                }
                errorOccurred = true;
            }
        });
    });

    if (!errorOccurred) {
        res.json({ message: 'Depot Imported successfully!' });
    }
});
route.post('/upload_vehicles', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    sampleFile = req.files.vehicle.tempFilePath;
    console.log(sampleFile)

    const workbook = xlsx1.readFile(sampleFile);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const data = xlsx1.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length === 0) {
        return res.status(400).json({ error: 'Empty file' });
    }

    const headers = data[0];
    const jsonData = data.slice(1).map(row => {
        return headers.reduce((acc, header, index) => {
            acc[header] = row[index];
            return acc;
        }, {});
    });

    let errorOccurred = false;

    jsonData.forEach((row, index) => {
        const query = 'INSERT INTO `vehicle`(`name`, `tractor_code`, `tractor_reg`, `trailer_code`, `trailer_reg`, `trailer_size`, `scope`,active) VALUES (?,?,?,?,?,?,?,?)';
        const values = [
            row.CvCode,
            row.TractorCode,
            row.TractorReg,
            row.TrailerCode,
            row.TrailerReg,
            row.CvVolume,
            row.SchedulingScopeName,
            1

        ];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Database insertion error:', err);
                if (index === jsonData.length - 1) {
                    return res.status(500).json({ error: 'Vehicle Import failed' });
                }
                errorOccurred = true;
            }
        });
    });

    if (!errorOccurred) {
        res.json({ message: 'Vehicle Imported successfully!' });
    }
});





// route.post('/upload', upload.single('file'), (req, res) => {
//     if (!req.file) {
//         console.log('No file uploaded');
//         return res.status(400).json({ error: 'No file uploaded' });
//     }

//     console.log('File uploaded:', req.file);

//     // Read the uploaded file
//     const filePath = path.join(__dirname, req.file.path);
//     console.log('File path:', filePath);

//     try {
//         const workbook = xlsx1.readFile(filePath);
//         const worksheet = workbook.Sheets[workbook.SheetNames[0]];

//         // Convert the worksheet to JSON using headers as keys
//         const data = xlsx1.utils.sheet_to_json(worksheet, { header: 1 });

//         if (data.length === 0) {
//             console.log('Empty file');
//             return res.status(400).json({ error: 'Empty file' });
//         }

//         const headers = data[0];
//         const jsonData = data.slice(1).map(row => {
//             return headers.reduce((acc, header, index) => {
//                 acc[header] = row[index];
//                 return acc;
//             }, {});
//         });

//         // Insert data into the customer table
//         jsonData.forEach(row => {
//             const query = `
//                 INSERT INTO customer (ship_to, site_name, latitude, longitude, town, post_code, country_code, street)
//                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//             `;

//             const values = [
//                 row.ShipTo,
//                 row.SiteName,
//                 row.Eastings,
//                 row.Northings,
//                 row.Town,
//                 row.PostCode,
//                 row.CityCode,
//                 row.Street
//             ];

//             console.log(values)
//             db.query(query, values, (err, result) => {
//                 if (err) {
//                     console.error('Database insertion error:', err);
//                     return res.status(500).json({ error: 'Database insertion failed' });
//                 }
//             });
//         });

//         res.json({ message: 'File uploaded and data inserted successfully' });
//         console.log(jsonData);
//     } catch (err) {
//         console.error('Error processing file:', err);
//         res.status(500).json({ error: 'Failed to process file' });
//     } finally {
//         // Clean up uploaded file
//         fs.unlink(filePath, (err) => {
//             if (err) {
//                 console.error('Error deleting file:', err);
//             } else {
//                 console.log('Uploaded file deleted');
//             }
//         });
//     }
// });
//////////////////////////////////////////////////////// Routs /////////////////////////////////////////////////////



route.get('/sa', (req, res, next) => {
    let arr = req.query.arr;
    console.log(arr);

    let totalTime = 0;
    async function calculateTotalDistance(resultArray) {
        let totalDistance = 0;


        // Loop through the resultArray to get from_loc_code and to_loc_code pairs
        for (let i = 0; i < resultArray.length - 1; i++) {
            const fromLoc = resultArray[i];
            const toLoc = resultArray[i + 1];

            // Query to get the distance for each pair
            const query = 'SELECT distance,time FROM shell.routes WHERE from_loc_code = ? AND to_loc_code = ?';
            const query2 = 'SELECT distance,time FROM shell.routes WHERE from_loc_code = ' + fromLoc + ' AND to_loc_code = ' + toLoc + '';
            console.log(query2);

            const distance = await new Promise((resolve, reject) => {
                db.query(query, [fromLoc, toLoc], (error, results) => {
                    if (error) return reject(error);
                    totalTime += parseFloat(results[0]?.time) || 0;
                    resolve(results[0]?.distance || 0); // Handle case where no route exists
                });
            });
            console.log(distance);

            // Add the distance to the total distance
            totalDistance += distance;
        }

        return totalDistance;
    }

    // Example usage
    const resultArray = JSON.parse(arr); // Sample resultArray
    calculateTotalDistance(resultArray)
        .then(totalDistance => {
            console.log('Total Distance:', totalDistance);
            res.json({ 'Total Distance': totalDistance, 'Total Time': totalTime });
            //   connection.end(); // Close the connection after use
        })
        .catch(error => {
            console.error(error);
            res.json({ title: 'Compartement' });
            //   connection.end(); // Close the connection in case of error
        });

})


route.get('/contacttime', (req, res, next) => {
    let arr = req.query.arr;
    console.log(arr);

    let totalTime = 0;
    async function calculateTotalDistance(resultArray) {
        let totalDistance = 0;
        const query = 'SELECT SUM(contact_time) as contacttime FROM shell.customer_contact_time where customer_id IN (?)';

        const distance = await new Promise((resolve, reject) => {
            db.query(query, [fromLoc], (error, results) => {
                if (error) return reject(error);
                totalTime += parseFloat(results[0]?.time) || 0;
                resolve(results[0]?.distance || 0); // Handle case where no route exists
            });
        });
        return totalDistance;
    }

    // Example usage
    const resultArray = JSON.parse(arr); // Sample resultArray
    calculateTotalDistance(resultArray)
        .then(totalDistance => {
            console.log('Total Distance:', totalDistance);
            res.json({ 'Total Distance': totalDistance, 'Total Time': totalTime });
            //   connection.end(); // Close the connection after use
        })
        .catch(error => {
            console.error(error);
            res.json({ title: 'Compartement' });
            //   connection.end(); // Close the connection in case of error
        });

})


route.post('/shipment', (req, res) => {
    const { orders, veh_id, shift_am_pm, shipment_date, shipment_no } = req.body;

    db.query('INSERT INTO shipments(orders, veh_id, shift_am_pm,shipment_date,shipment_no ) VALUES (?,?,?,?,?)',
        [orders, veh_id, shift_am_pm, shipment_date, shipment_no


        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Shipment added successfully', id: result.insertId, status: 200 });

            }

        });
});

route.get('/shipment', (req, res) => {

    db.query(`SELECT * FROM shipments ORDER BY shipments.id DESC LIMIT 1;`, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

route.get('/customers_byscope/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM `customer` WHERE scope=?', [id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
route.get('/customers_byscope/:id/:c_id', (req, res) => {
    const { id } = req.params;
    const { c_id } = req.params;
    db.query('SELECT * FROM `customer` WHERE scope=? and id=?', [id, c_id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
route.get('/scope_detail/:id', (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM `scope_details` where tpp= ? ORDER by id DESC LIMIT 1;', [id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

route.get('/scope_details/:id', (req, res) => {
    const { id } = req.params;
    db.query(`SELECT * FROM scope_details WHERE scope_id = ?`, [id], (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

route.get('/latest_order_id', (req, res) => {
    db.query('SELECT * FROM `vmi_orders` order by order_id desc limit 1;', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

route.post('/generate-pdf', async (req, res) => {
    const { pre } = req.body
    try {
        const jsonString = req.body.json;
        // Get the JSON string from the request body

        if (!jsonString) {
            return res.status(400).send('Error: JSON data is required.');
        }

        const parsedData = JSON.parse(jsonString);  // Parse the JSON string to an object

        const outputPath = path.join(__dirname, 'output.pdf');
        await generatePDF(outputPath, parsedData, pre);  // Pass the parsed JSON to generatePDF

        // Send the generated PDF file path as a response
        res.json({ outputPath });
    } catch (error) {
        res.status(500).send('Error generating PDF: ' + error.message);
    }
});
route.get('/orders_log', (req, res) => {
    // Extract the order_ids query parameter
    const orderIds = req.query.orderId.split(',');

    // Query your database with the orderIds array
    db.query('SELECT orderId FROM orders_log WHERE orderId IN (?)', [orderIds], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error');
        } else {
            res.json(results);
        }
    });
});




route.post('/insert-shipment', (req, res) => {
    const { jsonData, date } = req.body;

    // Insert into shipment_log
    const shipmentQuery = `INSERT INTO shipment_log (plan_date, shipment) VALUES (?, ?)`;
    db.query(shipmentQuery, [date, jsonData], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error inserting shipment data');
        }

        const shipment_no = result.insertId; // Get the inserted shipment ID (auto-incremented ID)

        // Function to insert trips and orders from either AM or PM
        const insertTrips = (vehicleArray) => {
            vehicleArray.forEach(vehicle => {
                vehicle.trip.forEach(trip => {
                    trip.orders.forEach(order => {
                        const orderQuery = `INSERT INTO orders_log (shipment_no, order_id) VALUES (?, ?)`;
                        // Use the shipment_no from the outer query instead of trip.shipment_no
                        db.query(orderQuery, [trip.shipment_no, order.orderId], (err, result) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).send('Error inserting order data');
                            }
                        });
                    });
                });
            });
        };

        // Parse JSON data if needed
        const jsonDataParsed = JSON.parse(jsonData);

        // Process both AM and PM trips
        insertTrips(jsonDataParsed.am);
        insertTrips(jsonDataParsed.pm);

        res.status(200).send('Data inserted successfully');
    });
});

route.post('/upload', (req, res) => {
    const filePath = req.files.file.tempFilePath;  // Get uploaded file path
    const { date } = req.body;
    try {
        // Step 2: Read and process the Excel file
        const workbook = xlsx1.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx1.utils.sheet_to_json(workbook.Sheets[sheetName]);
        let vehicleList = [];
        let vehicleList1 = [];
        let vehicleList2 = [];
        // Step 3: Group orders by vehicle and trip
        let vehicles = {};

        sheetData.forEach((row, index) => {
            var { Vehicle, 'Trip': Trip, Plant, 'Ship-To': ShipTo, Order, Name, Product, Qty, 'Promise Date': PromiseDate, Item } = row;
            // Only process orders with a non-empty Ship-To
            let strRev;
            var order_id;
            if (!Item) {

            }
            else {
                strRev = Item.toString();
                order_id = Order
                Order += strRev.split('').reverse().join('');
                console.log("Str rev", Order);

            }
            if (!vehicles[Vehicle]) {
                vehicles[Vehicle] = {};
            }
            if (!vehicles[Vehicle][Trip]) {
                vehicles[Vehicle][Trip] = [];
            }
            vehicles[Vehicle][Trip].push({
                Plant,
                ShipTo,
                Order,
                Name,
                Product,
                Qty,
                PromiseDate
            });

            console.log(vehicles);
        });
        // Step 4: Clean up the uploaded file asynchronously
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting uploaded file:', err.message);
            }
        });

        // Step 5: Query vehicle information from MySQL
        const fetchVehicleData = (vehicleName) => {
            return new Promise((resolve, reject) => {
                db.query('SELECT * FROM veh_base WHERE tractor_code = ?', [vehicleName], (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results[0]);  // Assuming you're interested in the first result
                    }
                });
            });
        };

        const fetchVehicleCompartment = (vehicl_id) => {
            return new Promise((resolve, reject) => {
                db.query("SELECT id,loadable_volume,compartment_no,cast(loadable_volume as int) as size,null as product,null as orderId,null as customer,'false' as used from vehicle_compartments WHERE veh_id =  ?", [vehicl_id], (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);  // Assuming you're interested in the first result
                    }
                });
            });
        };

        const compartseq = (compart_size) => {
            return new Promise((resolve, reject) => {
                db.query('SELECT * FROM compartment WHERE compartments = ?', [compart_size], (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);  // Assuming you're interested in the first result
                    }
                });
            });
        };



        const calc = async (listt) => {
            try {
                for (const vehicle of vehicleList) {
                    console.log(vehicle.tractor_code, "-", vehicle.id);
                    // console.log("Date: "+date);
                    let order_start;
                    var trip_index = 0;
                    for (const trip of vehicle.trips) {

                        const orders = trip.orders;
                        let totalDistance = 0;
                        let totalTime = 0; // This will be used to calculate the end_time
                        // Get the current date
                        // console.log(date+' '+vehicle.start_time);


                        // console.log("Start Time: "+today);

                        const dateString = date + ' ' + vehicle.start_time;
                        const dateObject = new Date(dateString + ' GMT');
                        // console.log("SOMI"+dateObject.toISOString());
                        // Split the time string into hours and minutes
                        let [hours, minutes] = vehicle.start_time.split(":").map(Number);
                        // console.log(hours,minutes);
                        let loading_time = vehicle.trailer_size / 1000
                        trip.loading_time = loading_time;
                        // console.log("Loading Time:" + loading_time);
                        // Set the time on the current date
                        // today.setHours(hours, minutes, 0, 0); // Setting hours, minutes, seconds, milliseconds
                        let startTime = dateObject.toISOString();

                        const query = 'SELECT * FROM shell.customer_contact_time where customer_id = "' + vehicle.load_depot + '"';
                        // console.log(query);

                        const result = await new Promise((resolve, reject) => {
                            db.query(query, (error, results) => {
                                if (error) return reject(error);
                                resolve(results[0] || {}); // Return an empty object if no result
                            });
                        });
                        trip.contact_time = result.contact_time || 0;
                        let dcontact_time = result.contact_time || 0;

                        dcontact_time = parseInt(dcontact_time) + parseInt(loading_time);

                        const dateString2 = date + ' ' + vehicle.start_time;
                        const dateObject2 = new Date(dateString2);
                        var dates;
                        var dateOb;
                        if (trip_index == 0) {
                            dates = dateObject2.toISOString()
                            // console.log(dates);
                            dateOb = new Date(dates)
                            dateOb.setMinutes(dateOb.getMinutes() + parseInt(dcontact_time));
                        }
                        else {
                            dates = order_start;
                            // console.log(dates);
                            dateOb = new Date(dates)
                            dateOb.setMinutes(dateOb.getMinutes() + parseInt(dcontact_time));
                        }
                        // console.log("Time Added: "+dateOb);

                        // console.log("Contact Time Depot:" + result.contact_time);


                        for (let index = 0; index < orders.length; index++) {
                            const order = orders[index];
                            let distance = 0;
                            let time = 0;

                            // Query the distance and time for the first order from Plant to ShipTo
                            if (index === 0) {
                                order_start = dateOb;
                                // console.log("Order Start: "+order_start);


                                const query = 'SELECT distance, time FROM shell.routes WHERE from_loc_code = "' + order.Plant + '"AND to_loc_code = "' + order.ShipTo + '"';
                                // console.log(query);

                                const result = await new Promise((resolve, reject) => {
                                    db.query(query, (error, results) => {
                                        if (error) return reject(error);
                                        resolve(results[0] || {}); // Return an empty object if no result
                                    });
                                });

                                const query2 = 'SELECT * FROM shell.customer_contact_time where customer_id = "' + order.ShipTo + '"';
                                // console.log(query2);

                                const result2 = await new Promise((resolve, reject) => {
                                    db.query(query2, (error, results) => {
                                        if (error) return reject(error);
                                        resolve(results[0] || {}); // Return an empty object if no result
                                    });
                                });


                                distance = result.distance || 0;
                                let contact_time = result2.contact_time || 0;
                                time = result.time || 0;
                                // console.log("Travel Time: " + result.time);

                                order_start.setMinutes(order_start.getMinutes() + parseInt(time));
                                let order_eta = order_start;
                                // console.log("Arrival Time: " + order_eta);
                                order.order_eta = order_eta.toLocaleString();

                                let discharge_time = order.Qty / 1000
                                order.discharge_time = parseInt(contact_time) + discharge_time;

                                time = parseInt(contact_time) + parseInt(discharge_time);
                                // console.log("Discharge Time:" + time);

                                order_start.setMinutes(order_start.getMinutes() + parseInt(time));

                            }
                            // Query the distance and time for subsequent orders based on the previous ShipTo
                            else {
                                // console.log("2nd Order: "+order_start);

                                const prevOrder = orders[index - 1];

                                // console.log('Querying subsequent order route from previous ShipTo to current ShipTo:', prevOrder.ShipTo, order.ShipTo);
                                const query = 'SELECT distance, time FROM shell.routes WHERE from_loc_code = ? AND to_loc_code = ?';
                                // console.log(query);

                                const result = await new Promise((resolve, reject) => {
                                    db.query(query, [prevOrder.ShipTo, order.ShipTo], (error, results) => {
                                        if (error) return reject(error);
                                        resolve(results[0] || {});
                                    });
                                });

                                const query2 = 'SELECT * FROM shell.customer_contact_time where customer_id = "' + order.ShipTo + '"';
                                // console.log(query2);

                                const result2 = await new Promise((resolve, reject) => {
                                    db.query(query2, (error, results) => {
                                        if (error) return reject(error);
                                        resolve(results[0] || {}); // Return an empty object if no result
                                    });
                                });

                                if (prevOrder.ShipTo === order.ShipTo) {
                                    order.order_eta = prevOrder.order_eta;
                                    distance = 0;
                                    order.discharge_time = prevOrder.discharge_time;
                                }
                                else {
                                    distance = result.distance || 0;
                                    time = result.time || 0;
                                    order_start.setMinutes(order_start.getMinutes() + parseInt(time));
                                    let order_eta = order_start;
                                    order.order_eta = order_eta.toLocaleString();
                                    let contact_time = result2.contact_time || 0;
                                    let discharge_time = order.Qty / 800
                                    order.discharge_time = parseInt(contact_time) + discharge_time;
                                    time = parseInt(contact_time) + parseInt(discharge_time);
                                    // console.log("Excluded Time:"+time);
                                    order_start.setMinutes(dateOb.getMinutes() + parseInt(time));
                                }


                                // time = parseInt(discharge_time) + parseInt(time);

                                // console.log("Order Finishing time:"+time);

                            }

                            // Update the order with distance and time
                            order.distance = distance;
                            order.eta = time;
                            // console.log("Order ETA"+order.order_eta);
                            // console.log("Order Time"+order_start);


                            // Accumulate the total distance and total time
                            totalDistance += distance;
                            // totalTime = parseInt(time) + parseInt(totalTime);
                            // console.log("Total Time:" + totalTime);

                        }
                        var lastshipto = trip.orders[trip.orders.length - 1].ShipTo;
                        var vend_depot = trip.orders[trip.orders.length - 1].Plant;

                        // console.log("trip_orderindex", trip.orders[trip.orders.length - 1].ShipTo, vehicle.end_depot)
                        // Query the distance and time for the trip's end depot
                        const endQuery = 'SELECT distance, time FROM shell.routes WHERE from_loc_code = ? AND to_loc_code = ?';
                        const endResult = await new Promise((resolve, reject) => {
                            db.query(endQuery, [lastshipto, vend_depot], (error, results) => {
                                if (error) return reject(error);
                                resolve(results[0] || {}); 5
                            });
                        });

                        let endtripdistance = endResult.distance || 0;
                        let endtriptime = endResult.time || 0;
                        trip.endtripdistance = endtripdistance;
                        trip.endtriptime = endtriptime;
                        order_start.setMinutes(order_start.getMinutes() + parseInt(endtriptime));
                        let trip_eta = order_start;
                        let endTime = new Date(startTime);
                        endTime.setMinutes(endTime.getMinutes() + totalTime); // Add total time to start time

                        // Add total_distance, start_time, and end_time to the trip
                        trip.total_distance = totalDistance + parseInt(endtripdistance);
                        trip.start_time = vehicle.start_time; // Use ISO format for standard representation
                        trip.end_time = trip_eta.toLocaleString();
                        vehicle.trip_end_time = trip_eta.toLocaleString();
                        // console.log(`Trip for vehicle ${vehicle.tractor_code} (ID: ${vehicle.id})`);
                        // console.log(`Start Time: ${trip.start_time}`);
                        // console.log(`End Time: ${trip.end_time}`);
                        // console.log(`Total Distance: ${trip.total_distance} km`);
                        trip_index++;
                    }
                }

                return listt;
            } catch (error) {
                throw error;
            }
        };






        function allocateCompartments(orders, compartments, sequence) {
            let unallocatedOrders = [];
            let allocatedCompartments = [];
            // console.log("Recieved Orders",orders);
            // console.log("Recieved Compartments",compartments);
            // console.log("Recieved Sequence",sequence);

            // Function to find a compartment by ID
            function findCompartmentById(id) {
                return compartments.find(compartment => compartment.id === id);
            }

            // Iterate through orders and try to allocate compartments
            orders.forEach(order => {
                let remainingQuantity = order.Qty;
                let allocated = false;

                // Attempt to allocate using exact compartment size
                for (let i = 0; i < compartments.length; i++) {
                    let compartment = findCompartmentById(sequence[i]); // Check in discharge sequence
                    console.log("compartment:", compartment);

                    // Check for exact match
                    if (!compartment.used && compartment.size === remainingQuantity) {
                        console.log(`Allocating Order ${order.Order} (${order.Product}) to Compartment ${compartment.id}`);
                        compartment.used = true; // Mark compartment as used
                        compartment.product = order.Product;

                        allocatedCompartments.push({
                            compartment_no: compartment.id,
                            compartmentNumber: compartment.id,
                            product: order.Product,
                            product_id: order.Product,
                            shipto: order.ShipTo,
                            size: compartment.size,
                            orderId: order.Order,
                            customerName: order.ShipTo,
                            customer_name: order.Name,
                            order_id: order.Order,
                            loaded_volume: compartment.size,
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
                            console.log(`Allocating remaining quantity ${remainingQuantity} liters of Order ${order.Order} to Compartment ${compartment.id}`);
                            compartment.used = true;
                            compartment.product = order.Product;

                            allocatedCompartments.push({
                                compartment_no: compartment.id,
                                compartmentNumber: compartment.id,
                                product: order.Product,
                                shipto: order.ShipTo,
                                product_id: order.Product,
                                size: compartment.size,
                                orderId: order.Order,
                                customerName: order.ShipTo,
                                customer_name: order.Name,
                                order_id: order.Order,
                                loaded_volume: compartment.size,
                                allocatedQuantity: remainingQuantity
                            });

                            remainingQuantity = 0; // Fully allocated
                            allocated = true;
                            break; // Exit loop as allocation is done
                        } else if (!compartment.used && compartment.size < remainingQuantity) {
                            // Partially allocate if no single compartment can fully satisfy the order
                            console.log(`Partially Allocating Order ${order.Order} to Compartment ${compartment.id}`);
                            compartment.used = true;
                            compartment.product = order.Product;

                            allocatedCompartments.push({
                                compartment_no: compartment.id,
                                compartmentNumber: compartment.id,
                                product: order.Product,
                                shipto: order.ShipTo,
                                product_id: order.Product,
                                size: compartment.size,
                                orderId: order.Order,
                                customerName: order.ShipTo,
                                customer_name: order.Name,
                                order_id: order.Order,
                                loaded_volume: compartment.size,
                                allocatedQuantity: compartment.size // Allocate the full compartment size
                            });

                            remainingQuantity -= compartment.size; // Reduce remaining quantity
                        }
                    }
                }

                // If still not fully allocated, check for any other compatible compartments for the same customer and product
                if (remainingQuantity > 0) {
                    console.log(`Order ${order.Order} could not be fully allocated, remaining quantity: ${remainingQuantity}`);
                    // Try to find alternative compartments that are not used
                    for (let i = 0; i < compartments.length; i++) {
                        let compartment = findCompartmentById(sequence[i]);

                        if (!compartment.used && compartment.size >= remainingQuantity) {
                            console.log(`Allocating remaining quantity ${remainingQuantity} liters of Order ${order.Order} to Compartment ${compartment.id} (alternative)`);
                            compartment.used = true;
                            compartment.product = order.Product;

                            allocatedCompartments.push({
                                compartment_no: compartment.id,
                                compartmentNumber: compartment.id,
                                product: order.Product,
                                shipto: order.ShipTo,
                                product_id: order.Product,
                                size: compartment.size,
                                orderId: order.Order,
                                customerName: order.ShipTo,
                                customer_name: order.Name,
                                order_id: order.Order,
                                loaded_volume: compartment.size,
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
                    unallocatedOrders.push({ order: order.Order, remainingQuantity });
                }
            });

            return { allocatedCompartments, unallocatedOrders };
        }

        const processVehicles = async () => {
            let shipment;
            const query = 'SELECT * FROM shipments ORDER BY shipments.id DESC LIMIT 1;';
            db.query(query, (error, results) => {
                if (error) return reject(error);
                shipment = parseInt(results[0].shipment_no)
            });
            for (const vehicle in vehicles) {
                try {

                    const vehicleData = await fetchVehicleData(vehicle);
                    // console.log(vehicleData.id);

                    const vehicleComp = await fetchVehicleCompartment(vehicleData.id)
                    const formattedCompartments = vehicleComp.map(compartment => ({
                        id: compartment.compartment_no,
                        size: parseInt(compartment.loadable_volume, 10),
                        used: compartment.used === "false" ? false : true,
                        product: compartment.product,
                        orderId: compartment.orderId,
                        customer: compartment.customer
                    }));
                    // console.log("Formatted Compartments:",formattedCompartments);
                    const comp_seq = await compartseq(vehicleComp.length)
                    // console.log(comp_seq);

                    var sortOrder = comp_seq[0]['seq'].split(',').map(num => Number(num) - 1);
                    var sortOrder2 = comp_seq[0]['seq'].split(',').map(num => Number(num));
                    // console.log("Discharge Seq:",sortOrder2);

                    // let result = allocateCompartments(vehicles[vehicle][tripNumber], formattedCompartments, sortOrder2);
                    // Start with the initial shipment number
                    // console.log('Allocated Compartments:', result.allocatedCompartments);
                    const trips = Object.keys(vehicles[vehicle]).map(tripNumber => {
                        // Create the trip object
                        // console.log("Required Orders:",vehicles[vehicle][tripNumber]);
                        const formattedCompartments = vehicleComp.map(compartment => ({
                            id: compartment.compartment_no,
                            size: parseInt(compartment.loadable_volume, 10),
                            used: compartment.used === "false" ? false : true,
                            product: compartment.product,
                            orderId: compartment.orderId,
                            customer: compartment.customer
                        }));

                        let orders = vehicles[vehicle][tripNumber];
                        let totalQuantity = orders.reduce((total, order) => total + parseInt(order.Qty), 0);
                        console.log("Total Quantity", totalQuantity);
                        console.log("Vehicle Volume", vehicleData.trailer_size);
                        if (totalQuantity == vehicleData.trailer_size) {
                            shipment++;
                            let result = allocateCompartments(vehicles[vehicle][tripNumber], formattedCompartments, sortOrder2);
                            console.log('Allocated Compartments:', result.allocatedCompartments);
                            const trip = {
                                trip_no: tripNumber,
                                orders: vehicles[vehicle][tripNumber],
                                compartments: vehicleComp,
                                compartmentsu: result.allocatedCompartments,
                                seq: sortOrder,
                                shipment_no: shipment // Assign current shipment number
                            };
                            const query2 = 'UPDATE `shipments` SET `shipment_no` = ' + shipment + ' WHERE `shipments`.`id` = 95;';
                            db.query(query2, (error, results) => {
                                if (error) return reject(error);
                                // shipment = parseInt(results[0].shipment_no)
                            });
                            // formattedCompartments = formattedCompartments;
                            // Increment shipment number for the next trip

                            return trip;
                        }
                        else {
                            let result = allocateCompartments(vehicles[vehicle][tripNumber], formattedCompartments, sortOrder2);
                            console.log('Allocated Compartments:', result.allocatedCompartments);
                            const trip = {
                                trip_no: tripNumber,
                                orders: vehicles[vehicle][tripNumber],
                                compartments: vehicleComp,
                                compartmentsu: result.allocatedCompartments,
                                error: 1,
                                seq: sortOrder,
                                // shipment_no: shipment // Assign current shipment number
                            };
                            shipment++
                            const query2 = 'UPDATE `shipments` SET `shipment_no` = ' + shipment + ' WHERE `shipments`.`id` = 95;';
                            db.query(query2, (error, results) => {
                                if (error) return reject(error);
                                // shipment = parseInt(results[0].shipment_no)
                            });

                            return trip;
                        }


                        // Start with the initial shipment number
                        // Return the trip object
                    });

                    // console.log(vehicles[vehicle]['trip']);
                    // Create the vehicle JSON with the trips included
                    const vehicleJson = {
                        ...vehicleData,
                        trips  // Array of trips with trip_no and associated orders
                    };

                    vehicleList.push(vehicleJson);
                    // resolve(vehicleList);
                } catch (error) {
                    // reject(error)
                    console.error(`Error fetching vehicle data for ${vehicle}:, error.message`);
                }
            }

            // vehicleList1 = await processorder(vehicleList);
            vehicleList2 = await calc(vehicleList);
            // console.log(vehicleList2[0].trips[0].orders);

            // Step 7: Return the list of vehicles
            res.status(200).json(vehicleList2);
        };

        // console.log();
        processVehicles();



    } catch (error) {
        console.error('Error processing the file:', error.message);
        res.status(500).json({ message: 'Error processing the file' });
    }
});
route.post('/upload3', (req, res) => {
    const filePath = req.files.file.tempFilePath;  // Get uploaded file path
    const { date } = req.body;
    try {
        // Step 2: Read and process the Excel file
        const workbook = xlsx1.readFile(filePath, { cellDates: false });
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx1.utils.sheet_to_json(workbook.Sheets[sheetName],);
        let vehicleList = [];
        let vehicleList1 = [];
        let vehicleList2 = [];
        // Step 3: Group orders by vehicle and trip
        let vehicles = {};

        sheetData.forEach((row, index) => {
            var { Vehicle, 'Trip': Trip, Plant, 'Ship-To': ShipTo, Order, Name, Product, Qty, 'Promise Date': PromiseDate, Item, StartDate, StartTime, } = row;
            // Only process orders with a non-empty Ship-To
            let strRev;
            var order_id;
            if (!Item) {

            }
            else {
                strRev = Item.toString();
                order_id = Order
                Order += strRev.split('').reverse().join('');
                console.log("Str rev", Order);

            }
            if (!vehicles[Vehicle]) {
                vehicles[Vehicle] = {};
            }
            if (!vehicles[Vehicle][Trip]) {
                vehicles[Vehicle][Trip] = [];
            }
            vehicles[Vehicle][Trip].push({
                Plant,
                ShipTo,
                Order,
                Name,
                Product,
                Qty,
                PromiseDate,
                StartDate,
                StartTime,
            });

            console.log(vehicles);
        });
        // Step 4: Clean up the uploaded file asynchronously
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting uploaded file:', err.message);
            }
        });

        // Step 5: Query vehicle information from MySQL
        const fetchVehicleData = (vehicleName) => {
            return new Promise((resolve, reject) => {
                db.query('SELECT * FROM veh_base WHERE tractor_code = ?', [vehicleName], (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results[0]);  // Assuming you're interested in the first result
                    }
                });
            });
        };

        const fetchVehicleCompartment = (vehicl_id) => {
            return new Promise((resolve, reject) => {
                db.query("SELECT id,loadable_volume,compartment_no,cast(loadable_volume as int) as size,null as product,null as orderId,null as customer,'false' as used from vehicle_compartments WHERE veh_id =  ?", [vehicl_id], (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);  // Assuming you're interested in the first result
                    }
                });
            });
        };

        const compartseq = (compart_size) => {
            return new Promise((resolve, reject) => {
                db.query('SELECT * FROM compartment WHERE compartments = ?', [compart_size], (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);  // Assuming you're interested in the first result
                    }
                });
            });
        };

        function excelDateTimeToJSDate(excelDate, excelTime) {
            console.log(excelDate, excelTime);
            // Excel epoch start date: January 1, 1900
            // const excelEpoch = new Date(1900, 0, 1);

            // // Calculate the date part with Excel's leap year adjustment
            // const jsDate = new Date(excelEpoch.getTime() + (excelDate - 2) * 86400000);

            // Convert the time fraction to milliseconds and add to the date
            // const timeInMilliseconds = excelTime * 24 * 60 * 60 * 1000;
            // jsDate.setTime(jsDate.getTime() + timeInMilliseconds);

            const excelEpoch = new Date(1900, 0, 1);

            // Calculate date part with Excel's 2-day leap year adjustment
            const jsDate = new Date(excelEpoch.getTime() + (excelDate - 2) * 86400000);

            // Extract hours, minutes, and seconds from the time fraction
            const hours = Math.floor(excelTime * 24);
            const minutes = Math.floor((excelTime * 24 * 60) % 60);
            const seconds = Math.floor((excelTime * 24 * 60 * 60) % 60);

            // Set the extracted hours, minutes, and seconds on the jsDate object
            jsDate.setHours(hours, minutes + 1, seconds, 0);

            return jsDate.toLocaleString();
        }


        function excelSerialToJSDateTime(dateSerial, timeSerial) {
            const baseDate = new Date(1900, 0, 1); // Excel's base date is Dec 30, 1899
            const dateInMs = dateSerial * 24 * 60 * 60 * 1000; // Convert date to milliseconds
            const timeInMs = timeSerial * 24 * 60 * 60 * 1000; // Convert time to milliseconds

            // Combine date and time in JavaScript Date object
            const jsDateTime = new Date(baseDate.getTime() + dateInMs + timeInMs);

            return jsDateTime;
        }

        const calc = async (listt) => {
            try {
                for (const vehicle of vehicleList) {
                    console.log(vehicle.tractor_code, "-", vehicle.id);
                    // console.log("Date: "+date);
                    let order_start;
                    var trip_index = 0;
                    for (const trip of vehicle.trips) {
                        const orders = trip.orders;
                        let totalDistance = 0;
                        let totalTime = 0; // This will be used to calculate the end_time
                        // Get the current date
                        // console.log(date+' '+vehicle.start_time);
                        // console.log("Start Time: "+today);
                        let plant = orders[0].Plant.slice(1);
                        console.log(orders[0].StartTime);
                        // console.log(excelDateToJSDate(orders[0].StartTime));

                        const dateString = excelDateTimeToJSDate(orders[0].StartDate, orders[0].StartTime);

                        vehicle.start_time = orders[0].StartTime

                        console.log("Samad", dateString);
                        const dateObj = new Date(dateString);
                        console.log(dateObj);
                        const datePart = dateObj.toLocaleDateString(); // Gives "2024-10-27"

                        const timePart = dateObj.toTimeString().slice(0, 5); // Gives "04:31"

                        console.log("Date:", datePart); // "2024-10-27"
                        console.log("Time:", timePart);
                        vehicle.start_dates = datePart + " " + timePart;
                        vehicle.start_time = timePart
                        vehicle.load_depot = plant;
                        vehicle.end_depot = plant;
                        const dateObject = new Date(dateString + ' GMT');
                        console.log("SOMI" + dateObject);

                        // Split the time string into hours and minutes
                        // var st_time = orders[0].StartTime
                        // let [hours, minutes] = st_time.split(":").map(Number);
                        // console.log(hours,minutes);
                        let loading_time = vehicle.trailer_size / 1000
                        trip.loading_time = loading_time;

                        // console.log("Loading Time:" + loading_time);
                        // Set the time on the current date
                        // today.setHours(hours, minutes, 0, 0); // Setting hours, minutes, seconds, milliseconds
                        let startTime = dateObject.toISOString();

                        const query = 'SELECT * FROM shell.customer_contact_time where customer_id = "' + vehicle.load_depot + '"';
                        // console.log(query);

                        const result = await new Promise((resolve, reject) => {
                            db.query(query, (error, results) => {
                                if (error) return reject(error);
                                resolve(results[0] || {}); // Return an empty object if no result
                            });
                        });
                        trip.contact_time = result.contact_time || 0;
                        let dcontact_time = result.contact_time || 0;

                        dcontact_time = parseInt(dcontact_time) + parseInt(loading_time);

                        const dateString2 = excelDateTimeToJSDate(orders[0].StartDate, orders[0].StartTime);
                        const dateObject2 = new Date(dateString2);
                        var dates;
                        var dateOb;
                        if (trip_index == 0) {
                            dates = dateObject2.toISOString()
                            // console.log(dates);
                            dateOb = new Date(dates)
                            dateOb.setMinutes(dateOb.getMinutes() + parseInt(dcontact_time));
                        }
                        else {
                            dates = order_start;
                            // console.log(dates);
                            dateOb = new Date(dates)
                            dateOb.setMinutes(dateOb.getMinutes() + parseInt(dcontact_time));
                        }
                        // console.log("Time Added: "+dateOb);

                        // console.log("Contact Time Depot:" + result.contact_time);


                        for (let index = 0; index < orders.length; index++) {
                            const order = orders[index];
                            let distance = 0;
                            let time = 0;

                            // Query the distance and time for the first order from Plant to ShipTo
                            if (index === 0) {
                                order_start = dateOb;
                                // console.log("Order Start: "+order_start);


                                const query = 'SELECT distance, time FROM shell_n.routes WHERE from_loc_code = "' + order.Plant + '"AND to_loc_code = "' + order.ShipTo + '"';
                                // console.log(query);

                                const result = await new Promise((resolve, reject) => {
                                    db.query(query, (error, results) => {
                                        if (error) return reject(error);
                                        resolve(results[0] || {}); // Return an empty object if no result
                                    });
                                });

                                const query2 = 'SELECT * FROM shell.customer_contact_time where customer_id = "' + order.ShipTo + '"';
                                // console.log(query2);

                                const result2 = await new Promise((resolve, reject) => {
                                    db.query(query2, (error, results) => {
                                        if (error) return reject(error);
                                        resolve(results[0] || {}); // Return an empty object if no result
                                    });
                                });


                                distance = result.distance || 0;
                                let contact_time = result2.contact_time || 0;
                                time = result.time || 0;
                                // console.log("Travel Time: " + result.time);

                                order_start.setMinutes(order_start.getMinutes() + parseInt(time));
                                let order_eta = order_start;
                                // console.log("Arrival Time: " + order_eta);
                                order.order_eta = order_eta.toLocaleString();

                                let discharge_time = order.Qty / 1000
                                order.discharge_time = parseInt(contact_time) + discharge_time;

                                time = parseInt(contact_time) + parseInt(discharge_time);
                                // console.log("Discharge Time:" + time);

                                order_start.setMinutes(order_start.getMinutes() + parseInt(time));

                            }
                            // Query the distance and time for subsequent orders based on the previous ShipTo
                            else {
                                // console.log("2nd Order: "+order_start);

                                const prevOrder = orders[index - 1];

                                // console.log('Querying subsequent order route from previous ShipTo to current ShipTo:', prevOrder.ShipTo, order.ShipTo);
                                const query = 'SELECT distance, time FROM shell_n.routes WHERE from_loc_code = ? AND to_loc_code = ?';
                                // console.log(query);

                                const result = await new Promise((resolve, reject) => {
                                    db.query(query, [prevOrder.ShipTo, order.ShipTo], (error, results) => {
                                        if (error) return reject(error);
                                        resolve(results[0] || {});
                                    });
                                });

                                const query2 = 'SELECT * FROM shell.customer_contact_time where customer_id = "' + order.ShipTo + '"';
                                // console.log(query2);

                                const result2 = await new Promise((resolve, reject) => {
                                    db.query(query2, (error, results) => {
                                        if (error) return reject(error);
                                        resolve(results[0] || {}); // Return an empty object if no result
                                    });
                                });

                                if (prevOrder.ShipTo === order.ShipTo) {
                                    order.order_eta = prevOrder.order_eta;
                                    distance = 0;
                                    order.discharge_time = prevOrder.discharge_time;
                                }
                                else {
                                    distance = result.distance || 0;
                                    time = result.time || 0;
                                    order_start.setMinutes(order_start.getMinutes() + parseInt(time));
                                    let order_eta = order_start;
                                    order.order_eta = order_eta.toLocaleString();
                                    let contact_time = result2.contact_time || 0;
                                    let discharge_time = order.Qty / 800
                                    order.discharge_time = parseInt(contact_time) + discharge_time;
                                    time = parseInt(contact_time) + parseInt(discharge_time);
                                    // console.log("Excluded Time:"+time);
                                    order_start.setMinutes(dateOb.getMinutes() + parseInt(time));
                                }


                                // time = parseInt(discharge_time) + parseInt(time);

                                // console.log("Order Finishing time:"+time);

                            }

                            // Update the order with distance and time
                            order.distance = distance;
                            order.eta = time;
                            // console.log("Order ETA"+order.order_eta);
                            // console.log("Order Time"+order_start);


                            // Accumulate the total distance and total time
                            totalDistance += distance;
                            // totalTime = parseInt(time) + parseInt(totalTime);
                            // console.log("Total Time:" + totalTime);

                        }
                        var lastshipto = trip.orders[trip.orders.length - 1].ShipTo;
                        var vend_depot = trip.orders[trip.orders.length - 1].Plant;

                        // console.log("trip_orderindex", trip.orders[trip.orders.length - 1].ShipTo, vehicle.end_depot)
                        // Query the distance and time for the trip's end depot
                        const endQuery = 'SELECT distance, time FROM shell_n.routes WHERE from_loc_code = ? AND to_loc_code = ?';
                        const endResult = await new Promise((resolve, reject) => {
                            db.query(endQuery, [lastshipto, vend_depot], (error, results) => {
                                if (error) return reject(error);
                                resolve(results[0] || {}); 5
                            });
                        });

                        let endtripdistance = endResult.distance || 0;
                        let endtriptime = endResult.time || 0;
                        trip.endtripdistance = endtripdistance;
                        trip.endtriptime = endtriptime;
                        order_start.setMinutes(order_start.getMinutes() + parseInt(endtriptime));
                        let trip_eta = order_start;
                        let endTime = new Date(startTime);
                        endTime.setMinutes(endTime.getMinutes() + totalTime); // Add total time to start time

                        // Add total_distance, start_time, and end_time to the trip
                        trip.total_distance = totalDistance + parseInt(endtripdistance);
                        trip.start_time = orders[0].StartTime; // Use ISO format for standard representation
                        trip.end_time = trip_eta.toLocaleString();
                        vehicle.trip_end_time = trip_eta.toLocaleString();
                        // console.log(Trip for vehicle ${vehicle.tractor_code} (ID: ${vehicle.id}));
                        // console.log(Start Time: ${trip.start_time});
                        // console.log(End Time: ${trip.end_time});
                        // console.log(Total Distance: ${trip.total_distance} km);
                        trip_index++;
                    }
                }

                return listt;
            } catch (error) {
                throw error;
            }
        };






        function allocateCompartments(orders, compartments, sequence) {
            let unallocatedOrders = [];
            let allocatedCompartments = [];
            // console.log("Recieved Orders",orders);
            // console.log("Recieved Compartments",compartments);
            // console.log("Recieved Sequence",sequence);

            // Function to find a compartment by ID
            function findCompartmentById(id) {
                return compartments.find(compartment => compartment.id === id);
            }

            // Iterate through orders and try to allocate compartments
            orders.forEach(order => {
                let remainingQuantity = order.Qty;
                let allocated = false;

                // Attempt to allocate using exact compartment size
                for (let i = 0; i < compartments.length; i++) {
                    let compartment = findCompartmentById(sequence[i]); // Check in discharge sequence
                    console.log("compartment:", compartment);

                    // Check for exact match
                    if (!compartment.used && compartment.size === remainingQuantity) {
                        console.log(`Allocating Order ${ order.Order }(${ order.Product }) to Compartment ${ compartment.id }`);
                        compartment.used = true; // Mark compartment as used
                        compartment.product = order.Product;

                        allocatedCompartments.push({
                            compartment_no: compartment.id,
                            compartmentNumber: compartment.id,
                            product: order.Product,
                            product_id: order.Product,
                            shipto: order.ShipTo,
                            size: compartment.size,
                            orderId: order.Order,
                            customerName: order.ShipTo,
                            customer_name: order.Name,
                            order_id: order.Order,
                            loaded_volume: compartment.size,
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
                            console.log(`Allocating remaining quantity ${ remainingQuantity } liters of Order ${ order.Order } to Compartment ${ compartment.id }`);
                            compartment.used = true;
                            compartment.product = order.Product;

                            allocatedCompartments.push({
                                compartment_no: compartment.id,
                                compartmentNumber: compartment.id,
                                product: order.Product,
                                shipto: order.ShipTo,
                                product_id: order.Product,
                                size: compartment.size,
                                orderId: order.Order,
                                customerName: order.ShipTo,
                                customer_name: order.Name,
                                order_id: order.Order,
                                loaded_volume: compartment.size,
                                allocatedQuantity: remainingQuantity
                            });

                            remainingQuantity = 0; // Fully allocated
                            allocated = true;
                            break; // Exit loop as allocation is done
                        } else if (!compartment.used && compartment.size < remainingQuantity) {
                            // Partially allocate if no single compartment can fully satisfy the order
                            console.log(`Partially Allocating Order ${ order.Order } to Compartment ${ compartment.id }`);
                            compartment.used = true;
                            compartment.product = order.Product;

                            allocatedCompartments.push({
                                compartment_no: compartment.id,
                                compartmentNumber: compartment.id,
                                product: order.Product,
                                shipto: order.ShipTo,
                                product_id: order.Product,
                                size: compartment.size,
                                orderId: order.Order,
                                customerName: order.ShipTo,
                                customer_name: order.Name,
                                order_id: order.Order,
                                loaded_volume: compartment.size,
                                allocatedQuantity: compartment.size // Allocate the full compartment size
                            });

                            remainingQuantity -= compartment.size; // Reduce remaining quantity
                        }
                    }
                }

                // If still not fully allocated, check for any other compatible compartments for the same customer and product
                if (remainingQuantity > 0) {
                    console.log(`Order ${ order.Order } could not be fully allocated, remaining quantity: ${ remainingQuantity }`);
                    // Try to find alternative compartments that are not used
                    for (let i = 0; i < compartments.length; i++) {
                        let compartment = findCompartmentById(sequence[i]);

                        if (!compartment.used && compartment.size >= remainingQuantity) {
                            console.log(`Allocating remaining quantity ${ remainingQuantity } liters of Order ${ order.Order } to Compartment ${ compartment.id }(alternative)`);
                            compartment.used = true;
                            compartment.product = order.Product;

                            allocatedCompartments.push({
                                compartment_no: compartment.id,
                                compartmentNumber: compartment.id,
                                product: order.Product,
                                shipto: order.ShipTo,
                                product_id: order.Product,
                                size: compartment.size,
                                orderId: order.Order,
                                customerName: order.ShipTo,
                                customer_name: order.Name,
                                order_id: order.Order,
                                loaded_volume: compartment.size,
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
                    unallocatedOrders.push({ order: order.Order, remainingQuantity });
                }
            });

            return { allocatedCompartments, unallocatedOrders };
        }

        const processVehicles = async () => {
            let shipment;
            const query = 'SELECT * FROM shipments ORDER BY shipments.id DESC LIMIT 1;';
            db.query(query, (error, results) => {
                if (error) return reject(error);
                shipment = parseInt(results[0].shipment_no)
            });
            for (const vehicle in vehicles) {
                try {

                    const vehicleData = await fetchVehicleData(vehicle);
                    // console.log(vehicleData.id);

                    const vehicleComp = await fetchVehicleCompartment(vehicleData.id)
                    const formattedCompartments = vehicleComp.map(compartment => ({
                        id: compartment.compartment_no,
                        size: parseInt(compartment.loadable_volume, 10),
                        used: compartment.used === "false" ? false : true,
                        product: compartment.product,
                        orderId: compartment.orderId,
                        customer: compartment.customer
                    }));
                    // console.log("Formatted Compartments:",formattedCompartments);
                    const comp_seq = await compartseq(vehicleComp.length)
                    // console.log(comp_seq);

                    var sortOrder = comp_seq[0]['seq'].split(',').map(num => Number(num) - 1);
                    var sortOrder2 = comp_seq[0]['seq'].split(',').map(num => Number(num));
                    // console.log("Discharge Seq:",sortOrder2);

                    // let result = allocateCompartments(vehicles[vehicle][tripNumber], formattedCompartments, sortOrder2);
                    // Start with the initial shipment number
                    // console.log('Allocated Compartments:', result.allocatedCompartments);
                    const trips = Object.keys(vehicles[vehicle]).map(tripNumber => {
                        // Create the trip object
                        // console.log("Required Orders:",vehicles[vehicle][tripNumber]);
                        const formattedCompartments = vehicleComp.map(compartment => ({
                            id: compartment.compartment_no,
                            size: parseInt(compartment.loadable_volume, 10),
                            used: compartment.used === "false" ? false : true,
                            product: compartment.product,
                            orderId: compartment.orderId,
                            customer: compartment.customer
                        }));

                        let orders = vehicles[vehicle][tripNumber];
                        let totalQuantity = orders.reduce((total, order) => total + parseInt(order.Qty), 0);
                        console.log("Total Quantity", totalQuantity);
                        console.log("Vehicle Volume", vehicleData.trailer_size);
                        if (totalQuantity == vehicleData.trailer_size) {
                            shipment++;
                            let result = allocateCompartments(vehicles[vehicle][tripNumber], formattedCompartments, sortOrder2);
                            console.log('Allocated Compartments:', result.allocatedCompartments);
                            const trip = {
                                trip_no: tripNumber,
                                orders: vehicles[vehicle][tripNumber],
                                compartments: vehicleComp,
                                compartmentsu: result.allocatedCompartments,
                                seq: sortOrder,
                                shipment_no: shipment // Assign current shipment number
                            };
                            const query2 = 'UPDATE shipments SET shipment_no = ' + shipment + ' WHERE shipments.id = 95;';
                            db.query(query2, (error, results) => {
                                if (error) return reject(error);
                                // shipment = parseInt(results[0].shipment_no)
                            });
                            // formattedCompartments = formattedCompartments;
                            // Increment shipment number for the next trip

                            return trip;
                        }
                        else {
                            let result = allocateCompartments(vehicles[vehicle][tripNumber], formattedCompartments, sortOrder2);
                            console.log('Allocated Compartments:', result.allocatedCompartments);
                            const trip = {
                                trip_no: tripNumber,
                                orders: vehicles[vehicle][tripNumber],
                                compartments: vehicleComp,
                                compartmentsu: result.allocatedCompartments,
                                error: 1,
                                seq: sortOrder,
                                // shipment_no: shipment // Assign current shipment number
                            };
                            shipment++
                            const query2 = 'UPDATE shipments SET shipment_no = ' + shipment + ' WHERE shipments.id = 95;';
                            db.query(query2, (error, results) => {
                                if (error) return reject(error);
                                // shipment = parseInt(results[0].shipment_no)
                            });

                            return trip;
                        }


                        // Start with the initial shipment number
                        // Return the trip object
                    });

                    // console.log(vehicles[vehicle]['trip']);
                    // Create the vehicle JSON with the trips included
                    const vehicleJson = {
                        ...vehicleData,
                        trips  // Array of trips with trip_no and associated orders
                    };

                    vehicleList.push(vehicleJson);
                    // resolve(vehicleList);
                } catch (error) {
                    // reject(error)
                    console.error(`Error fetching vehicle data for ${ vehicle }:`, error.message);
                }
            }

// vehicleList1 = await processorder(vehicleList);
vehicleList2 = await calc(vehicleList);
// console.log(vehicleList2[0].trips[0].orders);

// Step 7: Return the list of vehicles
res.status(200).json(vehicleList2);
        };

// console.log();
processVehicles();



    } catch (error) {
    console.error('Error processing the file:', error.message);
    res.status(500).json({ message: 'Error processing the file' });
}
});

route.post('/genexcelpdf', async (req, res) => {
    const { pre } = req.body
    try {
        const jsonString = req.body.json;
        // Get the JSON string from the request body

        if (!jsonString) {
            return res.status(400).send('Error: JSON data is required.');
        }

        const parsedData = JSON.parse(jsonString);  // Parse the JSON string to an object

        const outputPath = path.join(__dirname, 'output.pdf');
        await generatePDF1(outputPath, parsedData, pre);  // Pass the parsed JSON to generatePDF

        // Send the generated PDF file path as a response
        res.json({ outputPath });
    } catch (error) {
        res.status(500).send('Error generating PDF: ' + error.message);
    }
});

route.get('/tpp_byplant/:id', (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM customer WHERE ship_to =? LIMIT 1;', [id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});


route.get('/vehicle_bycompartment', (req, res) => {
    let { id } = req.query;


    // Retrieve vehicles that have compartments in the vehicle_compartments table
    db.query(`SELECT v.*, h.haulier_name, h.phone, h.group_code
    FROM vehicle v
    JOIN hauliers h ON v.gsap_haulier = h.id
    WHERE v.gsap_status = 0  and v.scope =?
    AND v.id IN (SELECT DISTINCT veh_id FROM vehicle_compartments);`, [id],
        (err, vehicleResults) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (vehicleResults.length === 0) {
                res.status(404).json({ error: 'No vehicles with compartments found' });
                return;
            }

            // Retrieve compartments for the filtered vehicles
            const vehicleIds = vehicleResults.map(vehicle => vehicle.id);
            db.query(`SELECT id, loadable_volume, compartment_no, veh_id, 
                      CAST(loadable_volume AS INT) AS size 
                      FROM vehicle_compartments 
                      WHERE veh_id IN(?)`, [vehicleIds],
                (err, compartmentResults) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }

                    // Group compartments by vehicle ID for easy mapping
                    const compartmentMap = compartmentResults.reduce((acc, compartment) => {
                        if (!acc[compartment.veh_id]) acc[compartment.veh_id] = [];
                        acc[compartment.veh_id].push(compartment);
                        return acc;
                    }, {});

                    // Map compartments to each vehicle
                    const vehiclesWithCompartments = vehicleResults.map(vehicle => {
                        vehicle.compartments = compartmentMap[vehicle.id] || [];
                        return vehicle;
                    });

                    res.json(vehiclesWithCompartments);
                });
        });
});

route.get('/vehicle_induced', (req, res, next) => {
    res.render('admin/vehicle/vehicle_induced', { title: 'Details' });
})

route.get('/vehicles_id/:id', (req, res) => {
    const { id } = req.params;
    db.query(`SELECT v.* , s.name as scope, s.id as scope_id FROM vehicle v JOIN scopes s on v.scope = s.id  where v.id =?`, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        else {
            if (results.length > 0) {
                // Second query to get vehicle products
                db.query('SELECT product_id FROM vehicle_products WHERE veh_id = ?', [id], (err, vehicleProducts) => {
                    if (err) throw err;

                    // Nest the vehicleProducts inside the vehicleProperties object
                    const result = {
                        ...results[0],
                        vehicleProducts: vehicleProducts
                    };

                    res.json(result);
                });
            } else {
                res.status(404).json({ message: 'Vehicle property not found' });
            }
        }

    });
});

route.post('/multtsdedit', (req, res) => {
    const filePath = req.files.file.tempFilePath;  // Get uploaded file path
    const { date } = req.body;

    try {
        // Step 1: Read the Excel file
        const workbook = xlsx1.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx1.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Step 2: Extract unique vehicle names and locations from Excel data
        const vehicleNames = [...new Set(sheetData.map(row => row.Vehicle))];
        const locationNames = [...new Set(sheetData.flatMap(row => [
            row['Start Location'], row['End Location'], row['Preload Depot'], row['Postload Depot']
        ]))];

        // Step 3: Get vehicle IDs for the vehicle names from the `vehicle` table
        const vehicleIdQuery = `SELECT id, name FROM vehicle WHERE name IN (?)`;
        db.query(vehicleIdQuery, [vehicleNames], (err, vehicles) => {
            if (err) {
                return res.status(500).json({ message: 'Error fetching vehicle IDs: ' + err.message });
            }

            // Step 4: Create a mapping from vehicle name to vehicle ID
            const vehicleMap = {};
            vehicles.forEach(vehicle => {
                vehicleMap[vehicle.name] = vehicle.id;
            });

            // Step 5: Get site IDs for the location names from the `customer` table
            const locationIdQuery = `SELECT id, site_name FROM customer WHERE site_name IN (?)`;
            db.query(locationIdQuery, [locationNames], (err, locations) => {
                if (err) {
                    return res.status(500).json({ message: 'Error fetching location IDs: ' + err.message });
                }

                // Step 6: Create a mapping from site name to site ID
                const locationMap = {};
                locations.forEach(location => {
                    locationMap[location.site_name] = location.id;
                });

                // Step 7: Prepare SQL queries and parameters based on the Excel data
                let updateTracktorPromises = [];
                let updateVehiclePromises = [];

                sheetData.forEach((row) => {
                    const { Vehicle, Trip, Shift, 'Start Location': startLocation, 'End Location': endLocation,
                        'Preload Depot': preloadDepot, 'Postload Depot': postloadDepot, Driver, 'Contact Type': contactType,
                        'Start Time': startTime, 'End Time': endTime, Availability } = row;

                    // Use the vehicle ID from the map
                    const vehicleId = vehicleMap[Vehicle];

                    // Use the site IDs for locations from the map
                    const startLocId = locationMap[startLocation];
                    const endLocId = locationMap[endLocation];
                    const preloadDepotId = locationMap[preloadDepot];
                    const postloadDepotId = locationMap[postloadDepot];

                    if (vehicleId && startLocId && endLocId) {
                        // Prepare update for `tracktor_tsd`
                        const tracktorSqlQuery = `
                        UPDATE tracktor_tsd 
                        SET 
                            start_time = ?, 
                            end_time = ?, 
                            availability = ?, 
                            shift = ?, 
                            start_location = ?, 
                            end_location = ?, 
                            preload_depot = ?, 
                            postload_depot = ?, 
                            driver = ?, 
                            contact_type = ? 
                        WHERE vehicle_id = ? AND shift = ?;
                        `;
                        const tracktorParams = [startTime, endTime, Availability, Shift, startLocId, endLocId, preloadDepotId, postloadDepotId, Driver, contactType, vehicleId, Shift];
                        updateTracktorPromises.push(new Promise((resolve, reject) => {
                            db.query(tracktorSqlQuery, tracktorParams, (err, result) => {
                                if (err) reject(err);
                                resolve(result);
                            });
                        }));

                        // Prepare update for `vehicle`
                        const vehicleSqlQuery = `
                        UPDATE vehicle 
                        SET start_loc = ?, end_loc = ?, pre_load = ?, post_load = ? 
                        WHERE id = ?;
                        `;
                        const vehicleParams = [startLocId, endLocId, preloadDepotId, postloadDepotId, vehicleId];
                        updateVehiclePromises.push(new Promise((resolve, reject) => {
                            db.query(vehicleSqlQuery, vehicleParams, (err, result) => {
                                if (err) reject(err);
                                resolve(result);
                            });
                        }));
                    }
                });

                // Step 8: Execute all update queries
                Promise.all([...updateTracktorPromises, ...updateVehiclePromises])
                    .then((results) => {
                        // Delete the temporary uploaded file
                        fs.unlink(filePath, (err) => {
                            if (err) {
                                console.error('Error deleting uploaded file:', err.message);
                            }
                        });

                        // Successful response
                        res.status(200).json({ message: 'Data updated successfully for all specified vehicles', status: 200 });
                    })
                    .catch((err) => {
                        console.error('Error updating data:', err.message);
                        res.status(500).json({ message: 'Error updating data: ' + err.message });
                    });
            });
        });
    } catch (error) {
        console.error('Error processing the file:', error.message);
        res.status(500).json({ message: 'Error processing the file: ' + error.message });
    }
});


route.get('/calendar', (req, res, next) => {
    res.render('admin/plan/calendar', { title: 'Calendar' });
})

route.get('/calendars', (req, res, next) => {
    res.render('admin/plan/calendars', { title: 'Calendar' });
})
route.get('/calendarvehicle', (req, res) => {
    // const { scope, sord, shift } = req.params;

    // if (sord == 1) {
    db.query(`SELECT *, CONCAT('2024-10-12', ' ', start_time) AS start, CONCAT('2024-10-12', ' ', end_time) AS end,name as title,id as resourceId,true as editable FROM veh_base WHERE start_day = LEFT(DAYNAME('2024-10-12'), 3) AND availability = 'Fully Available' AND shift = 'PM' AND scope = 5;`, async (err, results) => {

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        for (let a = 0; a < results.length; a++) {
            const data = JSON.parse(JSON.stringify(results[a]));
            try {
                const results2 = await vehicle_prodcuts(data.id);
                data.allowed_prod = results2;
                results[a] = data;
            } catch (error) {
                return res.status(500).json({ message: error.message, status: 500 });
            }
        }

        res.json(results);
    });
    // } else if (sord == 2) {
    //     db.query(`SELECT *, CONCAT('2024-10-12', ' ', start_time) AS full_start_time, CONCAT('2024-10-12', ' ', end_time) AS full_end_time FROM veh_base WHERE start_day = LEFT(DAYNAME('2024-10-12'), 3) AND availability = 'Fully Available' AND shift = 'PM' AND scope = 5;`, async (err, results) => {

    //         if (err) {
    //             return res.status(500).json({ error: err.message });
    //         }

    //         for (let a = 0; a < results.length; a++) {
    //             const data = JSON.parse(JSON.stringify(results[a]));
    //             try {
    //                 const results2 = await vehicle_prodcuts(data.id);
    //                 data.allowed_prod = results2;
    //                 results[a] = data;
    //             } catch (error) {
    //                 return res.status(500).json({ message: error.message, status: 500 });
    //             }
    //         }

    //         res.json(results);
    //     });
    // }


    function vehicle_prodcuts(id) {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT vp.*, p.code, p.name FROM vehicle_products vp JOIN product p ON vp.product_id = p.id WHERE vp.veh_id = ?',
                [id],
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
            );
        });
    }
});
route.get('/calendarby_shift/:date/:scope/:sord/:shift', (req, res) => {
    const { date, scope, sord, shift } = req.params;

    if (sord == 1) {
        const shift_planq = `
        SELECT * FROM shift_planning sp 
        WHERE shift = ? AND scope = ? AND day = LEFT(DAYNAME(?), 3);`;

        db.query(shift_planq, [shift, scope, date], (err, shiftResults) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Extract start and end times from the shiftResults for AM/PM conditions
            const start_time = shiftResults[0]?.start_time;
            const end_time = shiftResults[0]?.end_time;

            db.query(
                `SELECT *,
                    CONCAT(?, ' ', start_time) AS start,
                    CASE 
                        WHEN TIME(end_time) >= TIME(start_time) THEN 
                            CONCAT(?, ' ', end_time)
                        ELSE 
                            CONCAT(DATE_ADD(?, INTERVAL 1 DAY), ' ', end_time)
                    END AS end,
                    name AS title,
                    id AS resourceId,
                    TRUE AS editable
                FROM veh_base
                WHERE start_day = LEFT(DAYNAME(?), 3)
                    AND availability = 'Fully Available' 
                    AND shift = ? 
                    AND scope = ?
                    AND TIME(start_time) > ? AND TIME(end_time) < ?;`,
                [date, date, date, date, shift, scope, start_time, end_time],
                async (err, results) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    // Process each result to add vehicle products
                    for (let a = 0; a < results.length; a++) {
                        const data = JSON.parse(JSON.stringify(results[a]));
                        try {
                            const results2 = await vehicle_prodcuts(data.id);
                            data.allowed_prod = results2;
                            results[a] = data;
                        } catch (error) {
                            return res.status(500).json({ message: error.message, status: 500 });
                        }
                    }

                    res.json(results);
                }
            );
        });
    } else if (sord == 2) {
        const shift_planq = `
        SELECT * FROM shift_planning sp 
        WHERE scope = ? AND day = LEFT(DAYNAME(?), 3);`;

        db.query(shift_planq, [scope, date], (err, shiftResults) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Separate shiftResults into AM and PM shifts
            const pmshift = shiftResults.filter(shi => shi.shift.toLowerCase() === 'pm');
            const amshift = shiftResults.filter(shi => shi.shift.toLowerCase() === 'am');
            console.log("shift", amshift, pmshift)

            db.query(
                `SELECT *,
                    CONCAT(?, ' ', start_time) AS start,
                    CASE 
                        WHEN TIME(end_time) >= TIME(start_time) THEN 
                            CONCAT(?, ' ', end_time)
                        ELSE 
                            CONCAT(DATE_ADD(?, INTERVAL 1 DAY), ' ', end_time)
                    END AS end,
                    name AS title,
                    id AS resourceId,
                    TRUE AS editable
                FROM veh_base
                WHERE start_day = LEFT(DAYNAME(?), 3)
                    AND availability = 'Fully Available' 
                    AND scope = ?
                    AND (
                        -- AM shift condition: start after 20:00 and end before 10:00 next day
                        (shift = 'AM' AND TIME(start_time) > ? AND TIME(end_time) <= ?)
                        OR
                        -- PM shift condition: start after 08:00 and end before 22:00
                        (shift = 'PM' AND TIME(start_time) > ? AND TIME(end_time) <= ?)
                    );`,
                [date, date, date, date, scope, amshift[0].start_time, amshift[0].end_time, pmshift[0].start_time, pmshift[0].end_time],
                async (err, results) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    // Process each result to add vehicle products
                    for (let a = 0; a < results.length; a++) {
                        const data = JSON.parse(JSON.stringify(results[a]));
                        try {
                            const results2 = await vehicle_prodcuts(data.id);
                            data.allowed_prod = results2;
                            results[a] = data;
                        } catch (error) {
                            return res.status(500).json({ message: error.message, status: 500 });
                        }
                    }

                    res.json(results);
                }
            );
        });
    }

    function vehicle_prodcuts(id) {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT vp.*, p.code, p.name FROM vehicle_products vp JOIN product p ON vp.product_id = p.id WHERE vp.veh_id = ?',
                [id],
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
            );
        });
    }
});



route.get('/vehicle_access/:id', (req, res) => {
    const { id } = req.params;
    const shipTos = req.query.shipTos;

    // Ensure shipTos is provided
    if (!shipTos) {
        return res.status(400).json({ error: "shipTos parameter is required" });
    }

    // Split the comma-separated string into an array
    const shipToArray = shipTos.split(',');

    // Construct the query using placeholders
    const shipToPlaceholders = shipToArray.map(() => '?').join(',');

    // Construct the query
    const query = `
        SELECT v.id, v.trailer_size, 
               c.ship_to,
               SUBSTRING(c.vehicle_access, 1, 2) AS vehicle_access_prefix,
               SUBSTRING(v.trailer_size, 1, 2) AS trailer_size_prefix,
               CASE 
                   WHEN SUBSTRING(c.vehicle_access, 1, 2) < SUBSTRING(v.trailer_size, 1, 2) 
                   THEN 'rejected'
                   ELSE 'success'
               END AS status
        FROM customer c, vehicle v
        WHERE c.ship_to IN (${shipToPlaceholders})
          AND v.id = ?;
    `;

    // Execute the query with the split shipTo array and vehicle id
    db.query(query, [...shipToArray, id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database query failed" });
        }
        res.json(results);
    });
});

const calculate = async (vehicleList, date) => {
    try {
        for (const vehicle of vehicleList) {
            console.log(vehicle.tractor_code, "-", vehicle.id);
            // console.log("Date: "+date);
            let order_start;
            var trip_index = 0;
            for (const trip of vehicle.trip) {

                const orders = trip.orders;
                let totalDistance = 0;
                let totalTime = 0; // This will be used to calculate the end_time
                // Get the current date
                // console.log(date+' '+vehicle.start_time);


                // console.log("Start Time: "+today);

                const dateString = date + ' ' + vehicle.start_time;
                const dateObject = new Date(dateString + ' GMT');
                // console.log("SOMI"+dateObject.toISOString());
                // Split the time string into hours and minutes
                let [hours, minutes] = vehicle.start_time.split(":").map(Number);
                // console.log(hours,minutes);
                let loading_time = vehicle.trailer_size / 1000
                trip.loading_time = loading_time;
                // console.log("Loading Time:" + loading_time);
                // Set the time on the current date
                // today.setHours(hours, minutes, 0, 0); // Setting hours, minutes, seconds, milliseconds
                let startTime = dateObject.toISOString();

                const query = 'SELECT * FROM shell.customer_contact_time where customer_id = "' + vehicle.load_depot + '"';
                console.log(query);

                const result = await new Promise((resolve, reject) => {
                    db.query(query, (error, results) => {
                        if (error) return reject(error);
                        resolve(results[0] || {}); // Return an empty object if no result
                    });
                });
                trip.contact_time = result.contact_time || 0;
                let dcontact_time = result.contact_time || 0;

                dcontact_time = parseInt(dcontact_time) + parseInt(loading_time);

                const dateString2 = date + ' ' + vehicle.start_time;
                const dateObject2 = new Date(dateString2);
                var dates;
                var dateOb;
                if (trip_index == 0) {
                    dates = dateObject2.toISOString()
                    // console.log(dates);
                    dateOb = new Date(dates)
                    trip.start_time = dateString2;
                    dateOb.setMinutes(dateOb.getMinutes() + parseInt(dcontact_time));
                }
                else {
                    dates = order_start;

                    // console.log(dates);
                    dateOb = new Date(dates)
                    trip.start_time = vehicle.trip[trip_index - 1].end_time;
                    dateOb.setMinutes(dateOb.getMinutes() + parseInt(dcontact_time));

                }
                // console.log("Time Added: "+dateOb);

                // console.log("Contact Time Depot:" + result.contact_time);


                for (let index = 0; index < orders.length; index++) {
                    const order = orders[index];
                    console.log(order);

                    let distance = 0;
                    let time = 0;

                    // Query the distance and time for the first order from Plant to ShipTo
                    if (index === 0) {
                        order_start = dateOb;
                        // console.log("Order Start: "+order_start);


                        const query = 'SELECT distance, time FROM shell.routes WHERE from_loc_code = "' + vehicle.load_depot + '"AND to_loc_code = "' + order.shipTo + '"';
                        console.log(query);

                        const result = await new Promise((resolve, reject) => {
                            db.query(query, (error, results) => {
                                if (error) return reject(error);
                                resolve(results[0] || {}); // Return an empty object if no result
                            });
                        });

                        const query2 = 'SELECT * FROM shell.customer_contact_time where customer_id = "' + order.shipTo + '"';
                        console.log(query2);

                        const result2 = await new Promise((resolve, reject) => {
                            db.query(query2, (error, results) => {
                                if (error) return reject(error);
                                resolve(results[0] || {}); // Return an empty object if no result
                            });
                        });


                        distance = result.distance || 0;
                        let contact_time = result2.contact_time || 0;
                        time = result.time || 0;
                        // console.log("Travel Time: " + result.time);

                        order_start.setMinutes(order_start.getMinutes() + parseInt(time));
                        let order_eta = order_start;
                        // console.log("Arrival Time: " + order_eta);
                        order.order_eta = order_eta.toLocaleString();

                        let discharge_time = order.target / 1000
                        order.discharge_time = parseInt(contact_time) + discharge_time;

                        time = parseInt(contact_time) + parseInt(discharge_time);
                        // console.log("Discharge Time:" + time);

                        order_start.setMinutes(order_start.getMinutes() + parseInt(time));

                    }
                    // Query the distance and time for subsequent orders based on the previous ShipTo
                    else {
                        // console.log("2nd Order: "+order_start);

                        const prevOrder = orders[index - 1];

                        // console.log('Querying subsequent order route from previous ShipTo to current ShipTo:', prevOrder.ShipTo, order.ShipTo);
                        const query = 'SELECT distance, time FROM shell.routes WHERE from_loc_code = ? AND to_loc_code = ?';
                        // console.log(query);

                        const result = await new Promise((resolve, reject) => {
                            db.query(query, [prevOrder.shipTo, order.shipTo], (error, results) => {
                                if (error) return reject(error);
                                resolve(results[0] || {});
                            });
                        });

                        const query2 = 'SELECT * FROM shell.customer_contact_time where customer_id = "' + order.shipTo + '"';
                        // console.log("Query 2"+query2);

                        const result2 = await new Promise((resolve, reject) => {
                            db.query(query2, (error, results) => {
                                if (error) return reject(error);
                                resolve(results[0] || {}); // Return an empty object if no result
                            });
                        });

                        if (prevOrder.shipTo === order.shipTo) {
                            order.order_eta = prevOrder.order_eta;
                            distance = 0;
                            order.discharge_time = prevOrder.discharge_time;
                        }
                        else {
                            distance = result.distance || 0;
                            time = result.time || 0;
                            order_start.setMinutes(order_start.getMinutes() + parseInt(time));
                            let order_eta = order_start;
                            order.order_eta = order_eta.toLocaleString();
                            let contact_time = result2.contact_time || 0;
                            let discharge_time = order.target / 800
                            order.discharge_time = parseInt(contact_time) + discharge_time;
                            time = parseInt(contact_time) + parseInt(discharge_time);
                            // console.log("Excluded Time:"+time);
                            order_start.setMinutes(dateOb.getMinutes() + parseInt(time));
                        }


                        // time = parseInt(discharge_time) + parseInt(time);

                        // console.log("Order Finishing time:"+time);

                    }

                    // Update the order with distance and time
                    order.distance = distance;
                    order.eta = time;


                    // console.log("Order ETA"+order.order_eta);
                    // console.log("Order Time"+order_start);


                    // Accumulate the total distance and total time
                    totalDistance += distance;
                    // totalTime = parseInt(time) + parseInt(totalTime);
                    // console.log("Total Time:" + totalTime);

                }
                var lastshipto = trip.orders[trip.orders.length - 1].shipTo;
                var vend_depot = trip.orders[trip.orders.length - 1].end_depot;

                // console.log("trip_orderindex", trip.orders[trip.orders.length - 1].ShipTo, vehicle.end_depot)
                // Query the distance and time for the trip's end depot
                const endQuery = 'SELECT distance, time FROM shell.routes WHERE from_loc_code = ? AND to_loc_code = ?';
                const endResult = await new Promise((resolve, reject) => {
                    db.query(endQuery, [lastshipto, vend_depot], (error, results) => {
                        if (error) return reject(error);
                        resolve(results[0] || {}); 5
                    });
                });

                let endtripdistance = endResult.distance || 0;
                let endtriptime = endResult.time || 0;
                trip.endtripdistance = endtripdistance;
                trip.endtriptime = endtriptime;
                order_start.setMinutes(order_start.getMinutes() + parseInt(endtriptime));
                let trip_eta = order_start;
                let endTime = new Date(startTime);
                endTime.setMinutes(endTime.getMinutes() + totalTime); // Add total time to start time

                // Add total_distance, start_time, and end_time to the trip
                trip.total_distance = totalDistance + parseInt(endtripdistance);
                // trip.start_time = vehicle.start_time; // Use ISO format for standard representation
                trip.end_time = trip_eta.toLocaleString();
                vehicle.trip_end_time = trip_eta.toLocaleString();
                // console.log(`Trip for vehicle ${vehicle.tractor_code} (ID: ${vehicle.id})`);
                // console.log(`Start Time: ${trip.start_time}`);
                // console.log(`End Time: ${trip.end_time}`);
                // console.log(`Total Distance: ${trip.total_distance} km`);
                trip_index++;
            }
        }

        return vehicleList;
    } catch (error) {
        throw error;
    }
};


// POST route to handle vehicle list
route.post('/process-vehicles', async (req, res) => {
    const vehicleList = req.body.vehicleList; // Accept vehicleList from the request body
    const date = req.body.date; // Accept vehicleList from the request body
    console.log(vehicleList);

    if (!Array.isArray(vehicleList)) {
        return res.status(400).json({ error: 'Invalid vehicleList format' });
    }

    try {
        const processedVehicles = await calculate(vehicleList, date);
        res.json(processedVehicles); // Return the modified vehicle list
    } catch (error) {
        console.error('Error processing vehicles:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


route.post('/in_temp_order', (req, res) => {
    const { scope, shipTo, customerName, address, orderId, dispatchNumber, minQuantity, maxQty, target, materialCode, status, date, city } = req.body;

    const getorder = "SELECT * FROM orders_log WHERE orderId=?";
    db.query(getorder, [orderId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ "Status": 'Error inserting order data' });
        } else {
            if (result.length === 0) { // No order found, insert a new one
                const orderQuery = `INSERT INTO orders_log (
                    scope, shipTo, customerName, address, orderId, dispatchNumber, 
                    minQuantity, maxQty, target, materialCode, status, date, city
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                const values = [scope, shipTo, customerName, address, orderId, dispatchNumber, minQuantity, maxQty, target, materialCode, status, date, city];

                db.query(orderQuery, values, (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ "Status": 'Error inserting order data' });
                    }
                    return res.status(200).json({ "Status": 'Order Imported' });
                });
            } else { // Order found, update it
                const updateQuery = `UPDATE orders_log SET
                    scope = ?, shipTo = ?, customerName = ?, address = ?, orderId = ?, dispatchNumber = ?, 
                    minQuantity = ?, maxQty = ?, target = ?, materialCode = ?, status = ?, date = ?, city = ?
                    WHERE orderId = ?`;

                const updateValues = [scope, shipTo, customerName, address, orderId, dispatchNumber, minQuantity, maxQty, target, materialCode, status, date, city, orderId];

                db.query(updateQuery, updateValues, (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ "Status": 'Error updating order data' });
                    }
                    return res.status(200).json({ "Status": 'Order Updated' });
                });
            }
        }
    });
});




route.delete('/release_temp_order/:orderId', (req, res) => {
    const { orderId } = req.params;
    console.log(orderId);

    const orderQuery = `DELETE from orders_log where order_id IN (${orderId})`;
    // Use the shipment_no from the outer query instead of trip.shipment_no
    db.query(orderQuery, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ "Status": 'Error Deleting order data' });
        }
        else {
            return res.status(200).json({ "Status": 'Order Released' });
        }
    });



})

module.exports = route;