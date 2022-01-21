let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let bcrypt = require('bcrypt');
let mysql = require('mysql');

let PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*'); //หรือใส่แค่เฉพาะ domain ที่ต้องการได้
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

// homepage route
app.get('/', (req, res) => {
    return res.send({
        message: 'Welcome to RESTful CRUD API with NodeJS, Express, MYSQL',
        written_by: 'WEERAWAT.',
        published_on: 'https://vee_ws.dev',
    })
})

// connection to mysql database
let conn = mysql.createConnection({
    host: 'i0rgccmrx3at3wv3.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'kyi9c5r2zsv952xg',
    password: 'y52hb979209p8h8s',
    database: 'fq0ylbj2q0cofeza'
})

// login
app.post('/login', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (!username || !password) {
        return res.status(400).send({ error: true, message: "Please provide username, password." });
    } else {
        conn.query("SELECT * FROM tb_users WHERE username = ?", username ,(error, result, fields) => {
            if (error) throw error;
            bcrypt.compare(password, result[0].password, (err, resp) => {
                if(resp === true) {
                    return res.send({ error: false, data: result[0], message: "Logged in." });
                } else {
                    return res.send({ error: true,  message: "Invalid Password!" });
                }
            })
        })
    }

})

// Register
app.post('/register', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let tel = req.body.tel;
    let email = req.body.email;

    if (!username && !password) {
        return res.status(400).send({ error: true, message: "Please provide username, password, tel, email." });
    } else {
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        conn.query("INSERT INTO tb_users (username, password, tel, email) VALUES (?,?,?,?)", [username, hashPassword, tel, email], (error, result, fields) => {
            if (error) throw error;
            return res.send({ error: false, data: result, message: "User successfully added" });
        })
    }
})

// check username
app.post('/check_username', (req, res) => {
    let username = req.body.username;

    if (!username) {
        return res.status(400).send({ error: true, message: "Please provide username." });
    } else {
        conn.query("SELECT * FROM tb_users WHERE username = ?", username ,(error, result, fields) => {
            if (error) throw error;
            
            if (result === undefined || result.length == 0) {
                return res.send({ error: false });
            } else {
                return res.send({ error: true });
            }
        })
    }

})

// get products from category name
app.post('/products/category', (req, res) => {
    let name = req.body.name;
    conn.query('SELECT p.* FROM tb_products as p INNER JOIN tb_category as c ON c.id_category = p.category WHERE c.name = ?',name, (error, result, fields) => {
        if (error) throw error;

        let message = "";
        if (result === undefined || result.length == 0) {
            message = "Users table is empty";
        } else {
            message = "Successfully retrieved all users";
        }
        return res.send({ error: false, data: result, message: message });
    })
})

// get cart from user
app.post('/user/cart', (req, res) => {
    let uid = req.body.uid;

    if (!uid) {
        return res.status(400).send({ error: true, message: "Error." });
    } else {
        conn.query("SELECT p.id_product as pid, img as img, "+
                        "p.name as pname , p.price as price, "+
                        "c.qty as qty, c.id_cart as cid "+
                    "FROM tb_cart as c "+
                    "INNER JOIN tb_products as p "+
                    "ON c.id_product = p.id_product "+
                    "WHERE c.id_user = ? AND "+
                            "p.qty > 0 AND p.qty >= c.qty "+
                    "GROUP BY pid "+
                    "ORDER BY id_cart DESC", uid ,(error, result, fields) => {
            if (error) throw error;
            
            let message = "";
            if (result === undefined || result.length == 0) {
                message = "Cart table is empty";
            } else {
                message = "Successfully retrieved all cart";
            }
            return res.send({ error: false, data: result, message: message });
        })
    }
})

// -------------------------------------------------------------------------

// retrieve all users
app.get('/users', (req, res) => {
    conn.query('SELECT * FROM tb_users', (error, result, fields) => {
        if (error) throw error;

        let message = "";
        if (result === undefined || result.length == 0) {
            message = "Users table is empty";
        } else {
            message = "Successfully retrieved all users";
        }
        return res.send({ error: false, data: result, message: message });
    })
})

// retrieve one user
app.get('/user/:id', (req, res) => {
    let id = req.params.id;

    if (!id) {
        return res.status(400).send({ error: true, message: "Please provide user id." });
    } else {
        conn.query("SELECT * FROM tb_users WHERE id_user = ?", id, (error, result, fields) => {
            if (error) throw error;

            let message = "";
            if (result === undefined || result.length == 0) {
                message = "User not found";
            } else {
                message = "Successfully retrieved user data";
            }
            return res.send({ error: false, data: result[0], message: message });
        })
    }
})

// aad a new user
app.post('/user', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let tel = req.body.tel;
    let email = req.body.email;

    if (!username && !password && !tel && !email) {
        return res.status(400).send({ error: true, message: "Please provide username, password, tel, email." });
    } else {
        conn.query("INSERT INTO tb_users (username,password,tel,email,role) VALUES(?,?,?,?,'member')", [username, password, tel, email], (error, result, fields) => {
            if (error) throw error;
            return res.send({ error: false, data: result, message: "User successfully added" });
        })
    }
})

// update user
app.put('/user', (req, res) => {
    let id = req.body.id;
    let fullname = req.body.fullname;
    let tel = req.body.tel;
    let email = req.body.email;
    let address = req.body.address;

    if (!id && !fullname && !tel && !email && !address) {
        return res.status(400).send({ error: true, message: "Please provide id, fullname, password, tel, email, address." });
    } else {
        conn.query('UPDATE tb_users SET fullname = ?, tel = ?, email = ?, address = ? WHERE id_user = ?', [fullname, tel, email, address, id], (error, result, fields) => {
            if(result.changedRows === 0){
                message = "User not found or data are same";
            } else {
                message = "User successfully updated";
            }
            return res.send({ error: false, data: result, message: message });
        })
    }
})

// delete user
app.delete('/user', (req, res) => {
    let id = req.body.id;

    if (!id) {
        return res.status(400).send({ error: true, message: "Please provide user id." });
    } else {
        conn.query('DELETE FROM tb_users WHERE id_user = ?', id, (error, result, fields) => {
            if (error) throw error;
            
            let message = "";
            if(result.affectedRows === 0){
                message = "User not found";
            } else {
                message = "User successfully deleted";
            }
            return res.send({ error: false, data: result, message: message });
        })
    }
})

// -------------------------------------------------------------------------

// retrieve all products
app.get('/products', (req, res) => {
    conn.query('SELECT * FROM tb_products', (error, result, fields) => {
        if (error) throw error;

        let message = ""
        if (result === undefined || result.length == 0) {
            message = "Products table is empty";
        } else {
            message = "Successfully retrieved all products";
        }
        return res.send({ error: false, data: result, message: message });
    })
})

// retrieve one product
app.get('/product/:id', (req, res) => {
    let id = req.params.id;

    if (!id) {
        return res.status(400).send({ error: true, message: "Please provide product id." });
    } else {
        conn.query("SELECT * FROM tb_products WHERE id_product = ?", id, (error, result, fields) => {
            if (error) throw error;

            let message = "";
            if (result === undefined || result.length == 0) {
                message = "product not found";
            } else {
                message = "Successfully retrieved product data";
            }
            return res.send({ error: false, data: result[0], message: message });
        })
    }
})

// aad a new product
app.post('/product', (req, res) => {
    let category = req.body.category;
    let name = req.body.name;
    let price = req.body.price;
    let qty = req.body.qty;
    let spec = req.body.spec;
    let img = req.body.img;

    if (!category && !name && !price && !qty && !spec && !img) {
        return res.status(400).send({ error: true, message: "Please provide productname, password, tel, email." });
    } else {
        conn.query("INSERT INTO tb_products (category, name, price, qty, spec, img) VALUES(?,?,?,?,?,?)", [category, name, price, qty, spec, img], (error, result, fields) => {
            if (error) throw error;
            return res.send({ error: false, data: result, message: "product successfully added" });
        })
    }
})

// update product
app.put('/product', (req, res) => {
    let id = req.body.id;
    let category = req.body.category;
    let name = req.body.name;
    let price = req.body.price;
    let qty = req.body.qty;
    let spec = req.body.spec;
    let img = req.body.img;

    if (!id && !category && !name && !price && !qty && !spec && !img) {
        return res.status(400).send({ error: true, message: "Please provide id, fullname, password, tel, email, address." });
    } else {
        conn.query('UPDATE tb_products SET category = ?, name = ?, price = ?, qty = ?, spec = ?, img = ? WHERE id_product = ?', [category, name, price, qty, spec, img, id], (error, result, fields) => {
            if(result.changedRows === 0){
                message = "product not found or data are same";
            } else {
                message = "product successfully updated";
            }
            return res.send({ error: false, data: result, message: message });
        })
    }
})

// delete product
app.delete('/product', (req, res) => {
    let id = req.body.id;

    if (!id) {
        return res.status(400).send({ error: true, message: "Please provide product id." });
    } else {
        conn.query('DELETE FROM tb_products WHERE id_product = ?', id, (error, result, fields) => {
            if (error) throw error;
            
            let message = "";
            if(result.affectedRows === 0){
                message = "product not found";
            } else {
                message = "product successfully deleted";
            }
            return res.send({ error: false, data: result, message: message });
        })
    }
})

// -------------------------------------------------------------------------

// retrieve all category
app.get('/category', (req, res) => {
    conn.query('SELECT * FROM tb_category', (error, result, fields) => {
        if (error) throw error;

        let message = ""
        if (result === undefined || result.length == 0) {
            message = "Category table is empty";
        } else {
            message = "Successfully retrieved all category";
        }
        return res.send({ error: false, data: result, message: message });
    })
})

// retrieve one category
app.get('/category/:id', (req, res) => {
    let id = req.params.id;

    if (!id) {
        return res.status(400).send({ error: true, message: "Please provide category id." });
    } else {
        conn.query("SELECT * FROM tb_category WHERE id_category = ?", id, (error, result, fields) => {
            if (error) throw error;

            let message = "";
            if (result === undefined || result.length == 0) {
                message = "category not found";
            } else {
                message = "Successfully retrieved category data";
            }
            return res.send({ error: false, data: result[0], message: message });
        })
    }
})

// aad a new category
app.post('/category', (req, res) => {
    let name = req.body.name;

    if (!name) {
        return res.status(400).send({ error: true, message: "Please provide name." });
    } else {
        conn.query("INSERT INTO tb_category (name) VALUE(?)", name, (error, result, fields) => {
            if (error) throw error;
            return res.send({ error: false, data: result, message: "category successfully added" });
        })
    }
})

// update category
app.put('/category', (req, res) => {
    let id = req.body.id;
    let name = req.body.name;

    if (!id && !name) {
        return res.status(400).send({ error: true, message: "Please provide name." });
    } else {
        conn.query('UPDATE tb_category SET name = ? WHERE id_category = ?', [name, id], (error, result, fields) => {
            if(result.changedRows === 0){
                message = "category not found or data are same";
            } else {
                message = "category successfully updated";
            }
            return res.send({ error: false, data: result, message: message });
        })
    }
})

// delete category
app.delete('/category', (req, res) => {
    let id = req.body.id;

    if (!id) {
        return res.status(400).send({ error: true, message: "Please provide category id." });
    } else {
        conn.query('DELETE FROM tb_category WHERE id_category = ?', id, (error, result, fields) => {
            if (error) throw error;
            
            let message = "";
            if(result.affectedRows === 0){
                message = "category not found";
            } else {
                message = "category successfully deleted";
            }
            return res.send({ error: false, data: result, message: message });
        })
    }
})

// -------------------------------------------------------------------------

// // retrieve all cart
// app.get('/cart', (req, res) => {
//     conn.query('SELECT * FROM tb_cart', (error, result, fields) => {
//         if (error) throw error;

//         let message = ""
//         if (result === undefined || result.length == 0) {
//             message = "Cart table is empty";
//         } else {
//             message = "Successfully retrieved all cart";
//         }
//         return res.send({ error: false, data: result, message: message });
//     })
// })

// // retrieve one cart
// app.get('/cart/:id', (req, res) => {
//     let id = req.params.id;

//     if (!id) {
//         return res.status(400).send({ error: true, message: "Please provide cart id." });
//     } else {
//         conn.query("SELECT * FROM tb_cart WHERE id_user = ?", id, (error, result, fields) => {
//             if (error) throw error;

//             let message = "";
//             if (result === undefined || result.length == 0) {
//                 message = "cart not found";
//             } else {
//                 message = "Successfully retrieved cart data";
//             }
//             return res.send({ error: false, data: result[0], message: message });
//         })
//     }
// })

// aad a new cart
app.post('/cart', (req, res) => {
    let uid = req.body.uid;
    let pid = req.body.pid;
    let qty = req.body.qty;

    if (!uid && !pid && !qty) {
        return res.status(400).send({ error: true, message: "Please provide uid, pid, qty." });
    } else {
        conn.query("INSERT INTO tb_cart (id_user, id_product, qty) VALUES(?,?,?)", [uid, pid, qty], (error, result, fields) => {
            if (error) throw error;
            return res.send({ error: false, data: result, message: "cart successfully added" });
        })
    }
})

// update cart
app.put('/cart', (req, res) => {
    let cid = req.body.cid;
    let qty = req.body.qty;

    if (!cid && !qty) {
        return res.status(400).send({ error: true, message: "Please provide id, fullname, password, tel, email, address." });
    } else {
        conn.query('UPDATE tb_cart SET qty = ? WHERE id_cart = ?', [qty,], (error, result, fields) => {
            if(result.changedRows === 0){
                message = "cart not found or data are same";
            } else {
                message = "cart successfully updated";
            }
            return res.send({ error: false, data: result, message: message });
        })
    }
})

// delete cart
app.delete('/cart', (req, res) => {
    let id = req.body.id;

    if (!id) {
        return res.status(400).send({ error: true, message: "Please provide cart id." });
    } else {
        conn.query('DELETE FROM tb_cart WHERE id_cart = ?', id, (error, result, fields) => {
            if (error) throw error;
            
            let message = "";
            if(result.affectedRows === 0){
                message = "cart not found";
            } else {
                message = "cart successfully deleted";
            }
            return res.send({ error: false, data: result, message: message });
        })
    }
})

// -------------------------------------------------------------------------

// retrieve all orders
app.get('/orders', (req, res) => {
    conn.query('SELECT * FROM tb_orders', (error, result, fields) => {
        if (error) throw error;

        let message = ""
        if (result === undefined || result.length == 0) {
            message = "Orders table is empty";
        } else {
            message = "Successfully retrieved all orders";
        }
        return res.send({ error: false, data: result, message: message });
    })
})

// retrieve one order
app.get('/order/:id', (req, res) => {
    let id = req.params.id;

    if (!id) {
        return res.status(400).send({ error: true, message: "Please provide order id." });
    } else {
        conn.query("SELECT * FROM tb_orders WHERE id_order = ?", id, (error, result, fields) => {
            if (error) throw error;

            let message = "";
            if (result === undefined || result.length == 0) {
                message = "order not found";
            } else {
                message = "Successfully retrieved order data";
            }
            return res.send({ error: false, data: result[0], message: message });
        })
    }
})

// aad a new order
app.post('/order', (req, res) => {
    let oid = req.body.oid;
    let uid = req.body.uid;
    let pid = req.body.pid;
    let qty = req.body.qty;
    let total = req.body.total;
    let date = req.body.date;

    if (!oid && !uid && !pid && !qty && !total && !date) {
        return res.status(400).send({ error: true, message: "Please provide ordername, password, tel, email." });
    } else {
        conn.query("INSERT INTO tb_orders (id_order, id_user, id_product, qty, total, date) VALUES(?,?,?,?,?,?)", [oid, uid, pid, qty, total, date], (error, result, fields) => {
            if (error) throw error;
            return res.send({ error: false, data: result, message: "order successfully added" });
        })
    }
})

// update order
app.put('/order', (req, res) => {
    let oid = req.body.oid;
    let status = req.body.status;

    if (!oid && !status) {
        return res.status(400).send({ error: true, message: "Please provide id, fullname, password, tel, email, address." });
    } else {
        conn.query('UPDATE tb_orders SET status = ? WHERE id_order = ?', [status, oid], (error, result, fields) => {
            if(result.changedRows === 0){
                message = "order not found or data are same";
            } else {
                message = "order successfully updated";
            }
            return res.send({ error: false, data: result, message: message });
        })
    }
})

// delete order
app.delete('/order', (req, res) => {
    let oid = req.body.oid;

    if (!oid) {
        return res.status(400).send({ error: true, message: "Please provide order id." });
    } else {
        conn.query('DELETE FROM tb_orders WHERE id_order = ?', oid, (error, result, fields) => {
            if (error) throw error;
            
            let message = "";
            if(result.affectedRows === 0){
                message = "order not found";
            } else {
                message = "order successfully deleted";
            }
            return res.send({ error: false, data: result, message: message });
        })
    }
})

// -------------------------------------------------------------------------

// retrieve all pay
app.get('/pay', (req, res) => {
    conn.query('SELECT * FROM tb_pay', (error, result, fields) => {
        if (error) throw error;

        let message = ""
        if (result === undefined || result.length == 0) {
            message = "Pay table is empty";
        } else {
            message = "Successfully retrieved all pay";
        }
        return res.send({ error: false, data: result, message: message });
    })
})

// retrieve one pay
app.get('/pay/:id', (req, res) => {
    let id = req.params.id;

    if (!id) {
        return res.status(400).send({ error: true, message: "Please provide pay id." });
    } else {
        conn.query("SELECT * FROM tb_pay WHERE id_pay = ?", id, (error, result, fields) => {
            if (error) throw error;

            let message = "";
            if (result === undefined || result.length == 0) {
                message = "pay not found";
            } else {
                message = "Successfully retrieved pay data";
            }
            return res.send({ error: false, data: result[0], message: message });
        })
    }
})

// aad a new pay
app.post('/pay', (req, res) => {
    let oid = req.body.oid;
    let slip = req.body.slip;
    let date = req.body.date;
    let user_bank = req.body.user_bank;
    let store_bank = req.body.store_bank;

    if (!oid && !slip && !date && !user_bank && !store_bank) {
        return res.status(400).send({ error: true, message: "Please provide payname, password, tel, email." });
    } else {
        conn.query("INSERT INTO tb_pay (id_order, slip, date, member_id_bank, store_id_bank) VALUES(?,?,?,?,?)", [oid, slip, date, user_bank, store_bank], (error, result, fields) => {
            if (error) throw error;
            return res.send({ error: false, data: result, message: "pay successfully added" });
        })
    }
})

// update pay
app.put('/pay', (req, res) => {
    let oid = req.body.oid;
    let slip = req.body.slip;
    let date = req.body.date;
    let user_bank = req.body.user_bank;
    let store_bank = req.body.store_bank;

    if (!oid && !slip && !date && !user_bank && !store_bank) {
        return res.status(400).send({ error: true, message: "Please provide id, fullname, password, tel, email, address." });
    } else {
        conn.query('UPDATE tb_pay SET slip = ?, date = ?, member_id_bank = ?, store_id_bank = ? WHERE id_order = ?', [slip, date, user_bank, store_bank, oid], (error, result, fields) => {
            if(result.changedRows === 0){
                message = "pay not found or data are same";
            } else {
                message = "pay successfully updated";
            }
            return res.send({ error: false, data: result, message: message });
        })
    }
})

// delete pay
app.delete('/pay', (req, res) => {
    let id = req.body.id;

    if (!id) {
        return res.status(400).send({ error: true, message: "Please provide pay id." });
    } else {
        conn.query('DELETE FROM tb_pay WHERE id_pay = ?', id, (error, result, fields) => {
            if (error) throw error;
            
            let message = "";
            if(result.affectedRows === 0){
                message = "pay not found";
            } else {
                message = "pay successfully deleted";
            }
            return res.send({ error: false, data: result, message: message });
        })
    }
})

// -------------------------------------------------------------------------

// retrieve all status
app.get('/status', (req, res) => {
    conn.query('SELECT * FROM tb_status', (error, result, fields) => {
        if (error) throw error;

        let message = ""
        if (result === undefined || result.length == 0) {
            message = "Status table is empty";
        } else {
            message = "Successfully retrieved all status";
        }
        return res.send({ error: false, data: result, message: message });
    })
})

// retrieve one status
app.get('/status/:id', (req, res) => {
    let id = req.params.id;

    if (!id) {
        return res.status(400).send({ error: true, message: "Please provide status id." });
    } else {
        conn.query("SELECT * FROM tb_status WHERE id_status = ?", id, (error, result, fields) => {
            if (error) throw error;

            let message = "";
            if (result === undefined || result.length == 0) {
                message = "status not found";
            } else {
                message = "Successfully retrieved status data";
            }
            return res.send({ error: false, data: result[0], message: message });
        })
    }
})

// aad a new status
app.post('/status', (req, res) => {
    let statusname = req.body.statusname;
    let password = req.body.password;
    let tel = req.body.tel;
    let email = req.body.email;

    if (!statusname && !password && !tel && !email) {
        return res.status(400).send({ error: true, message: "Please provide statusname, password, tel, email." });
    } else {
        conn.query("INSERT INTO tb_status (statusname,password,tel,email,role) VALUES(?,?,?,?,'member')", [statusname, password, tel, email], (error, result, fields) => {
            if (error) throw error;
            return res.send({ error: false, data: result, message: "status successfully added" });
        })
    }
})

// -------------------------------------------------------------------------

// retrieve all banks
app.get('/banks', (req, res) => {
    conn.query('SELECT * FROM tb_banks', (error, result, fields) => {
        if (error) throw error;

        let message = ""
        if (result === undefined || result.length == 0) {
            message = "Banks table is empty";
        } else {
            message = "Successfully retrieved all banks";
        }
        return res.send({ error: false, data: result, message: message });
    })
})

// retrieve one bank
app.get('/bank/:id', (req, res) => {
    let id = req.params.id;

    if (!id) {
        return res.status(400).send({ error: true, message: "Please provide bank id." });
    } else {
        conn.query("SELECT * FROM tb_banks WHERE id_bank = ?", id, (error, result, fields) => {
            if (error) throw error;

            let message = "";
            if (result === undefined || result.length == 0) {
                message = "bank not found";
            } else {
                message = "Successfully retrieved bank data";
            }
            return res.send({ error: false, data: result[0], message: message });
        })
    }
})

// aad a new bank
app.post('/bank', (req, res) => {
    let id_bankth = req.body.id_bankth;
    let name = req.body.name;
    let number = req.body.number;

    if (!id_bankth && !name && !number) {
        return res.status(400).send({ error: true, message: "Please provide bankname, password, tel, email." });
    } else {
        conn.query("INSERT INTO tb_banks (id_bankth, name, number) VALUES(?,?,?)", [id_bankth, name, number], (error, result, fields) => {
            if (error) throw error;
            return res.send({ error: false, data: result, message: "bank successfully added" });
        })
    }
})

// update bank
app.put('/bank', (req, res) => {
    let id_bank = req.body.id_bank;
    let id_bankth = req.body.id_bankth;
    let name = req.body.name;
    let number = req.body.number;

    if (!id_bank && !id_bankth && !name && !number) {
        return res.status(400).send({ error: true, message: "Please provide id, fullname, password, tel, email, address." });
    } else {
        conn.query('UPDATE tb_banks SET id_bankth = ?, name = ?, number = ? WHERE id_bank = ?', [id_bankth, name, number, id_bank], (error, result, fields) => {
            if(result.changedRows === 0){
                message = "bank not found or data are same";
            } else {
                message = "bank successfully updated";
            }
            return res.send({ error: false, data: result, message: message });
        })
    }
})

// delete bank
app.delete('/bank', (req, res) => {
    let id = req.body.id;

    if (!id) {
        return res.status(400).send({ error: true, message: "Please provide bank id." });
    } else {
        conn.query('DELETE FROM tb_banks WHERE id_bank = ?', id, (error, result, fields) => {
            if (error) throw error;
            
            let message = "";
            if(result.affectedRows === 0){
                message = "bank not found";
            } else {
                message = "bank successfully deleted";
            }
            return res.send({ error: false, data: result, message: message });
        })
    }
})

// -------------------------------------------------------------------------

// retrieve all banks_th
app.get('/banks_th', (req, res) => {
    conn.query('SELECT * FROM tb_banks_th', (error, result, fields) => {
        if (error) throw error;

        let message = ""
        if (result === undefined || result.length == 0) {
            message = "Bank_th table is empty";
        } else {
            message = "Successfully retrieved all banks_th";
        }
        return res.send({ error: false, data: result, message: message });
    })
})

// retrieve one banks_th
app.get('/banks_th/:id', (req, res) => {
    let id = req.params.id;

    if (!id) {
        return res.status(400).send({ error: true, message: "Please provide banks_th id." });
    } else {
        conn.query("SELECT * FROM tb_banks_th WHERE id_bankth = ?", id, (error, result, fields) => {
            if (error) throw error;

            let message = "";
            if (result === undefined || result.length == 0) {
                message = "banks_th not found";
            } else {
                message = "Successfully retrieved banks_th data";
            }
            return res.send({ error: false, data: result[0], message: message });
        })
    }
})

// -------------------------------------------------------------------------

// set port
app.listen(PORT, () => {
    console.log(`Node App is running on port ${PORT}`);
})