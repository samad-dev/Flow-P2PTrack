const mysql = require('mysql');
const express = require('express');
const route = express.Router();
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


// Dashboard
route.get('/', (req, res, next) => {
    res.render('index', { title: 'Dashboard' });
})
route.get('/index', (req, res, next) => {
    res.render('index', { title: 'Dashboard' });
})
//////////////////////////////////////////////////////////// Apis /////////////////////////////////////////////////


//// ======================================Customers
route.get('/customer', (req, res) => {
    db.query('SELECT * FROM customer', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
route.get('/depots', (req, res) => {
    db.query('SELECT * FROM customer where is_depot = 1', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});


route.get('/customer/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM customer WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});
route.post('/customer', (req, res) => {
    const { ship_to, site_name, scheduling, customer_name, depot_code, scope, street, town, country_code, post_code, market, priority, status, is_customer, is_depot, is_park_loc } = req.body;
    // var pref = JSON.parse(prefs);
    db.query('INSERT INTO `customer`( `ship_to`, `site_name`, `scheduling`,customer_name,depot_code, `scope`, `street`, `town`, `country_code`, `post_code`, `market`, `priority`, `status`, `is_customer`, `is_depot`, `is_park_loc`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [ship_to, site_name, scheduling, customer_name, depot_code, scope, street, town, country_code, post_code, market, priority, status, is_customer, is_depot, is_park_loc
        ], (err, result) => {
            if (err) {
                res.json({ message: err, status: 500 })
            }
            else {

                res.json({ message: 'Customer added successfully', id: result.insertId, status: 200 });

            }

        });
});

route.get('/auth-login', (req, res, next) => {
    res.render('auth/auth-login', { title: 'Login In', layout: false })
})

route.put('/customer/:id', (req, res) => {
    const { id } = req.params;
    const { ship_to, site_name, customer_name, depot_code, scheduling, scope, street, town, country_code, post_code, market, priority, status, is_customer, is_depot, is_park_loc } = req.body;

    const query = `
        UPDATE customer 
        SET 
            ship_to = ?, 
            site_name = ?, 
            customer_name = ?,
            depot_code=?, 
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
        depot_code,
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
    const { customer_name, post_code, country_code, gsap_code, street, latitude, longitude, short_code } = req.body;

    const query = `
        UPDATE customer 
        SET 
            customer_name = ?, 
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
        customer_name, post_code, country_code, gsap_code, street, latitude, longitude, short_code, id], (err, result) => {
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
        [customer_id, name, contact_type, detail,  id
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
    const {id}=req.params
    db.query('SELECT * FROM customer_tanks where customer_id=?',[id], (err, results) => {
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

    const {status} = req.body;

    db.query('UPDATE `customer_tanks` SET `status`=? WHERE id = ?;',
        [ status,  id],
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

    const {  code, tg, product_id, product_name, discharge_seq
    } = req.body;

    db.query('UPDATE customer_tanks SET  code = ?, tg = ?, product_id = ?, product_name = ?, discharge_seq = ? WHERE id = ?;',
        [ code, tg, product_id, product_name, discharge_seq,  id],
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
    db.query('SELECT * FROM customer_selopening WHERE customer_id = ?', [id], (err, results) => {
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
    db.query('SELECT * FROM customer_contact_time WHERE customer_id = ?', [id], (err, results) => {
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
    const { customer_id, on_off, loc_code, loc_name, distance, time, speed

    } = req.body;

    db.query('INSERT INTO `routes`( `customer_id`, `status`, `loc_code`,loc_name, `distance`, `time`, `speed`) VALUES (?,?,?,?,?,?,?)',
        [customer_id, on_off, loc_code, loc_name, distance, time, speed

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

    const {  loc_code, loc_name, distance, time, speed
    } = req.body;

    db.query('UPDATE routes SET  loc_code = ?,loc_name=?, distance = ?, time = ?, speed = ?WHERE id = ?;',
        [ loc_code, loc_name, distance, time, speed, id],
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
        [ lst_sch_date, priority, market, allow_shift_order, stop_delivery, vmi, tailer_drop_loc, depot, park_loc, id],
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
    res.render('admin/customers/task', { title: 'Customers' });
})

route.get('/plan', (req, res, next) => {
    res.render('admin/plan/plan_board', { title: 'Plan Board' });
})
//// ======================================Vehicles 

route.get('/vehicles', (req, res, next) => {
    res.render('admin/vehicle/vehicle_list', { title: 'Vehicle' });
})

route.get('/vehicle_details', (req, res, next) => {
    res.render('admin/vehicle/vehicle_details', { title: 'Vehicle' });
})

route.get('/vehicle_properties', (req, res, next) => {
    res.render('admin/vehicle/vehicle_properties', { title: 'Vehicle' });
})
route.get('/vehicle_tracktor', (req, res, next) => {
    res.render('admin/vehicle/vehicle_tractor', { title: 'Vehicle' });
})
route.get('/vehicle_trailer', (req, res, next) => {
    res.render('admin/vehicle/vehicle_trailer', { title: 'Vehicle' });
})
route.get('/vehicle_group', (req, res, next) => {
    res.render('admin/vehicle/vehicle_group', { title: 'Vehicle' });
})
//// ======================================Depot 

route.get('/depot', (req, res, next) => {
    res.render('admin/depot/depot_list', { title: 'Depot' });
})
route.get('/depot_tanks', (req, res, next) => {
    const id = req.query.id
    res.render('admin/depot/depot_tank', { title: 'Depot', id: id });
})
route.get('/depot_address', (req, res, next) => {
    const id = req.query.id
    res.render('admin/depot/depot_address', { title: 'Depot', id: id });
})
route.get('/depot_group', (req, res, next) => {
    const id = req.query.id
    res.render('admin/depot/depot_groups', { title: 'Depot', id: id });
})
route.get('/depot_event', (req, res, next) => {
    const id = req.query.id
    res.render('admin/depot/depot_events', { title: 'Depot', id: id });
})
route.get('/depot_status', (req, res, next) => {
    const id = req.query.id
    res.render('admin/depot/depot_status', { title: 'Depot', id: id });
})
route.get('/depot_timing', (req, res, next) => {
    const id = req.query.id
    res.render('admin/depot/depot_timings', { title: 'Depot', id: id });
})
route.get('/depot_routes', (req, res, next) => {
    const id = req.query.id
    res.render('admin/depot/depot_routes', { title: 'Depot', id: id });
})

//// ===================================== Parking Location 
route.get('/parkingloc_tanks', (req, res, next) => {
    const id = req.query.id
    res.render('admin/parkingloc/parkingloc_tank', { title: 'Parking Location', id: id });
})
route.get('/parkingloc_list', (req, res, next) => {
    res.render('admin/parkingloc/parkingloc_list', { title: 'Parking Location' });
})
route.get('/parkingloc_address', (req, res, next) => {
    const id = req.query.id
    res.render('admin/parkingloc/parkingloc_address', { title: 'Parking Location', id: id });
})
route.get('/parkingloc_group', (req, res, next) => {
    const id = req.query.id
    res.render('admin/parkingloc/parkingloc_groups', { title: 'Parking Location', id: id });
})
route.get('/parkingloc_event', (req, res, next) => {
    const id = req.query.id
    res.render('admin/parkingloc/parkingloc_events', { title: 'Parking Location', id: id });
})
route.get('/parkingloc_status', (req, res, next) => {
    const id = req.query.id
    res.render('admin/parkingloc/parkingloc_status', { title: 'Parking Location', id: id });
})
route.get('/parkingloc_timing', (req, res, next) => {
    const id = req.query.id
    res.render('admin/parkingloc/parkingloc_timings', { title: 'Parking Location', id: id });
})
route.get('/parkingloc_routes', (req, res, next) => {
    const id = req.query.id
    res.render('admin/parkingloc/parkingloc_routes', { title: 'Parking Location', id: id });
})

route.get('/trip', (req, res, next) => {
    res.render('admin/parkingloc/trip_action', { title: 'Depot' });
})

//////////////////////////////////////////////////////// Routs /////////////////////////////////////////////////////
module.exports = route;