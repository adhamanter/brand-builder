const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");
const session = require("express-session");

const app = express();

const PORT = 3000;

const db = new Database("brand-builder.db");
// إضافة user_id للـ websites لو القاعدة القديمة مش فيها العمود
try {

    db.exec(`
        ALTER TABLE websites
        ADD COLUMN user_id INTEGER
    `);

    console.log("تم تحديث جدول websites ✅");

} catch (error) {

    if (
        !error.message.includes(
            "duplicate column name"
        )
    ) {

        console.error(error);

    }

}

// =========================
// DATABASE
// =========================

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS websites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        whatsapp TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        website_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        image TEXT,
        FOREIGN KEY (website_id) REFERENCES websites(id)
    );
`);

console.log("Database is ready ✅");


// =========================
// MIDDLEWARE
// =========================

app.use(express.json());

app.use(
    session({
        secret: "brand-builder-secret-2026",

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
    })
);

app.use(express.static(__dirname));


// =========================
// HOME
// =========================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


// =========================
// REGISTER
// =========================

app.post("/api/register", (req, res) => {

    const {
        name,
        email,
        password
    } = req.body;


    if (!name || !email || !password) {

        return res.status(400).json({

            success: false,

            message: "املأ كل البيانات"

        });

    }


    if (password.length < 6) {

        return res.status(400).json({

            success: false,

            message: "الباسورد لازم يكون 6 حروف على الأقل"

        });

    }


    try {

        const existingUser =
            db.prepare(`
                SELECT id
                FROM users
                WHERE email = ?
            `).get(email);


        if (existingUser) {

            return res.status(400).json({

                success: false,

                message: "الإيميل ده مسجل بالفعل"

            });

        }


        const result =
            db.prepare(`
                INSERT INTO users
                (name, email, password)
                VALUES (?, ?, ?)
            `).run(

                name,

                email,

                password

            );


        req.session.userId =
            Number(result.lastInsertRowid);


        console.log(
            "تم إنشاء حساب جديد ✅"
        );


        res.json({

            success: true,

            message: "تم إنشاء الحساب بنجاح"

        });


    } catch (error) {

        console.error(error);


        res.status(500).json({

            success: false,

            message: "حصل خطأ في إنشاء الحساب"

        });

    }

});


// =========================
// LOGIN
// =========================

app.post("/api/login", (req, res) => {

    const {
        email,
        password
    } = req.body;


    if (!email || !password) {

        return res.status(400).json({

            success: false,

            message: "اكتب الإيميل والباسورد"

        });

    }


    const user =
        db.prepare(`
            SELECT *
            FROM users
            WHERE email = ?
            AND password = ?
        `).get(

            email,

            password

        );


    if (!user) {

        return res.status(401).json({

            success: false,

            message: "الإيميل أو الباسورد غلط"

        });

    }


    req.session.userId =
        user.id;


    res.json({

        success: true,

        message: "تم تسجيل الدخول"

    });

});


// =========================
// LOGOUT
// =========================

app.post("/api/logout", (req, res) => {

    req.session.destroy(() => {

        res.json({

            success: true

        });

    });

});


// =========================
// CURRENT USER
// =========================

app.get("/api/me", (req, res) => {

    if (!req.session.userId) {

        return res.status(401).json({

            success: false,

            message: "غير مسجل الدخول"

        });

    }


    const user =
        db.prepare(`
            SELECT id, name, email
            FROM users
            WHERE id = ?
        `).get(
            req.session.userId
        );


    if (!user) {

        return res.status(401).json({

            success: false,

            message: "المستخدم غير موجود"

        });

    }


    res.json({

        success: true,

        user: user

    });

});


// =========================
// AUTH MIDDLEWARE
// =========================

function requireLogin(req, res, next) {

    if (!req.session.userId) {

        return res.status(401).json({

            success: false,

            message: "لازم تسجل الدخول الأول"

        });

    }


    next();

}


// =========================
// CREATE WEBSITE
// =========================

app.post(
    "/api/website",
    requireLogin,
    (req, res) => {

        const {
            name,
            description,
            whatsapp
        } = req.body;


        if (!name) {

            return res.status(400).json({

                success: false,

                message: "اسم البراند مطلوب"

            });

        }


        const result =
            db.prepare(`
                INSERT INTO websites
                (user_id, name, description, whatsapp)
                VALUES (?, ?, ?, ?)
            `).run(

                req.session.userId,

                name,

                description || "",

                whatsapp || ""

            );


        res.json({

            success: true,

            websiteId:
                result.lastInsertRowid

        });

    }
);


// =========================
// GET WEBSITE
// =========================

app.get(
    "/api/website/:id",
    requireLogin,
    (req, res) => {

        const websiteId =
            req.params.id;


        const website =
            db.prepare(`
                SELECT *
                FROM websites
                WHERE id = ?
                AND user_id = ?
            `).get(

                websiteId,

                req.session.userId

            );


        if (!website) {

            return res.status(404).json({

                success: false,

                message: "الموقع غير موجود"

            });

        }


        const products =
            db.prepare(`
                SELECT *
                FROM products
                WHERE website_id = ?
                ORDER BY id DESC
            `).all(
                websiteId
            );


        res.json({

            success: true,

            website,

            products

        });

    }
);


// =========================
// UPDATE WEBSITE
// =========================

app.put(
    "/api/website/:id",
    requireLogin,
    (req, res) => {

        const websiteId =
            req.params.id;


        const {
            name,
            description,
            whatsapp
        } = req.body;


        if (!name) {

            return res.status(400).json({

                success: false,

                message: "اسم البراند مطلوب"

            });

        }


        const result =
            db.prepare(`
                UPDATE websites

                SET
                    name = ?,
                    description = ?,
                    whatsapp = ?

                WHERE id = ?
                AND user_id = ?
            `).run(

                name,

                description || "",

                whatsapp || "",

                websiteId,

                req.session.userId

            );


        if (result.changes === 0) {

            return res.status(404).json({

                success: false,

                message: "الموقع غير موجود"

            });

        }


        res.json({

            success: true,

            message: "تم تحديث بيانات البراند"

        });

    }
);


// =========================
// ADD PRODUCT
// =========================

app.post(
    "/api/product",
    requireLogin,
    (req, res) => {

        const {
            websiteId,
            name,
            price,
            image
        } = req.body;


        if (
            !websiteId ||
            !name ||
            price === undefined ||
            !image
        ) {

            return res.status(400).json({

                success: false,

                message: "بيانات المنتج ناقصة"

            });

        }


        const website =
            db.prepare(`
                SELECT id
                FROM websites
                WHERE id = ?
                AND user_id = ?
            `).get(

                websiteId,

                req.session.userId

            );


        if (!website) {

            return res.status(404).json({

                success: false,

                message: "الموقع غير موجود"

            });

        }


        const result =
            db.prepare(`
                INSERT INTO products
                (website_id, name, price, image)
                VALUES (?, ?, ?, ?)
            `).run(

                websiteId,

                name,

                Number(price),

                image

            );


        res.json({

            success: true,

            productId:
                result.lastInsertRowid

        });

    }
);


// =========================
// UPDATE PRODUCT
// =========================

app.put(
    "/api/product/:id",
    requireLogin,
    (req, res) => {

        const productId =
            req.params.id;


        const {
            name,
            price,
            image
        } = req.body;


        if (
            !name ||
            price === undefined ||
            !image
        ) {

            return res.status(400).json({

                success: false,

                message: "بيانات المنتج ناقصة"

            });

        }


        const result =
            db.prepare(`
                UPDATE products

                SET
                    name = ?,
                    price = ?,
                    image = ?

                WHERE id = ?

                AND website_id IN (
                    SELECT id
                    FROM websites
                    WHERE user_id = ?
                )
            `).run(

                name,

                Number(price),

                image,

                productId,

                req.session.userId

            );


        if (result.changes === 0) {

            return res.status(404).json({

                success: false,

                message: "المنتج غير موجود"

            });

        }


        res.json({

            success: true,

            message: "تم تحديث المنتج"

        });

    }
);


// =========================
// DELETE PRODUCT
// =========================

app.delete(
    "/api/product/:id",
    requireLogin,
    (req, res) => {

        const productId =
            req.params.id;


        const result =
            db.prepare(`
                DELETE FROM products

                WHERE id = ?

                AND website_id IN (
                    SELECT id
                    FROM websites
                    WHERE user_id = ?
                )
            `).run(

                productId,

                req.session.userId

            );


        if (result.changes === 0) {

            return res.status(404).json({

                success: false,

                message: "المنتج غير موجود"

            });

        }


        res.json({

            success: true,

            message: "تم حذف المنتج"

        });

    }
);


// =========================
// SERVER
// =========================

app.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});