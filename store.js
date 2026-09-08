const params = new URLSearchParams(window.location.search);

const websiteId = params.get("id");


// لو مفيش ID
if (!websiteId) {

    document.body.innerHTML = `
        <h1 style="
            text-align:center;
            margin-top:100px;
            color:white;
        ">
            الموقع غير موجود
        </h1>
    `;

} else {

    loadWebsite();

}


// تحميل بيانات الموقع
async function loadWebsite() {

    try {

        const response =
            await fetch(`/api/website/${websiteId}`);


        if (!response.ok) {
            throw new Error("الموقع غير موجود");
        }


        const data =
            await response.json();


        if (!data.success) {
            throw new Error("الموقع غير موجود");
        }


        const website =
            data.website;

        const products =
            data.products;


        // =========================
        // بيانات البراند
        // =========================

        document.title =
            website.name;


        document.getElementById(
            "brandName"
        ).textContent =
            website.name;


        document.getElementById(
            "brandTitle"
        ).textContent =
            website.name;


        document.getElementById(
            "loaderBrand"
        ).textContent =
            website.name;


        document.getElementById(
            "footerBrand"
        ).textContent =
            website.name;


        document.getElementById(
            "brandDescription"
        ).textContent =
            website.description ||
            "اكتشف مجموعتنا الجديدة";


        // =========================
        // واتساب
        // =========================

        let phone =
            website.whatsapp || "";

        phone =
            phone.replace(/\D/g, "");


        if (phone.startsWith("01")) {

            phone =
                "2" + phone;

        }


        document.getElementById(
            "whatsappButton"
        ).href =
            `https://wa.me/${phone}`;


        // =========================
        // المنتجات
        // =========================

        const container =
            document.getElementById(
                "productsContainer"
            );


        container.innerHTML = "";


        if (products.length === 0) {

            container.innerHTML = `

                <p style="
                    grid-column: 1 / -1;
                    text-align: center;
                    color: #777;
                    padding: 80px 20px;
                ">
                    المنتجات هتظهر هنا قريبًا
                </p>

            `;

        }


        products.forEach((product, index) => {

            const div =
                document.createElement("div");


            div.className =
                "product";


            div.innerHTML = `

                <img
                    src="${product.image}"
                    alt="${product.name}"
                    loading="lazy"
                >

                <div class="product-info">

                    <h3>
                        ${product.name}
                    </h3>

                    <p class="price">
                        ${product.price} جنيه
                    </p>

                </div>

            `;


            container.appendChild(div);

        });


        // =========================
        // عدد المنتجات
        // =========================

        const productCount =
            document.querySelector(
                ".product-count"
            );


        if (productCount) {

            productCount.textContent =
                `${products.length} PRODUCTS`;

        }


        // =========================
        // إنهاء الـ Loader
        // =========================

        setTimeout(() => {

            const loader =
                document.getElementById(
                    "loader"
                );


            if (loader) {

                loader.classList.add(
                    "loaded"
                );

            }

        }, 2000);


    } catch (error) {

        console.error(error);


        document.body.innerHTML = `

            <div style="
                min-height:100vh;
                display:flex;
                align-items:center;
                justify-content:center;
                background:#050505;
                color:white;
                text-align:center;
                padding:20px;
            ">

                <div>

                    <h1>
                        حصل خطأ
                    </h1>

                    <p style="
                        margin-top:15px;
                        color:#777;
                    ">
                        مش قادرين نحمل بيانات المتجر
                    </p>

                </div>

            </div>

        `;

    }

}