const brandName = document.getElementById("brandName");

const brandDescription =
    document.getElementById("brandDescription");

const whatsapp =
    document.getElementById("whatsapp");

const previewBrand =
    document.getElementById("previewBrand");

const previewTitle =
    document.getElementById("previewTitle");

const previewDescription =
    document.getElementById("previewDescription");

const whatsappButton =
    document.getElementById("whatsappButton");

let currentWebsiteId = null;


// استرجاع آخر موقع تم إنشاؤه
const savedWebsiteId =
    localStorage.getItem("currentWebsiteId");

if (savedWebsiteId) {
    currentWebsiteId = Number(savedWebsiteId);
}


// تغيير اسم البراند في المعاينة
if (brandName) {
    brandName.addEventListener("input", function () {

        const name =
            brandName.value || "اسم البراند";

        if (previewBrand) {
            previewBrand.textContent = name;
        }

        if (previewTitle) {
            previewTitle.textContent = name;
        }

    });
}


// تغيير وصف البراند في المعاينة
if (brandDescription) {
    brandDescription.addEventListener("input", function () {

        if (previewDescription) {
            previewDescription.textContent =
                brandDescription.value || "وصف البراند";
        }

    });
}


// إنشاء رابط واتساب
if (whatsapp) {
    whatsapp.addEventListener("input", function () {

        let number =
            whatsapp.value.replace(/\D/g, "");

        if (number.startsWith("01")) {
            number = "2" + number;
        }

        if (whatsappButton) {
            whatsappButton.href =
                "https://wa.me/" + number;
        }

    });
}


// إنشاء الموقع
async function createWebsite() {

    if (!brandName || !brandDescription || !whatsapp) {
        return;
    }

    const name =
        brandName.value || "اسم البراند";

    const description =
        brandDescription.value || "وصف البراند";

    const phone =
        whatsapp.value || "";


    const websiteData = {

        name: name,
        description: description,
        whatsapp: phone

    };


    try {

        const response =
            await fetch("/api/website", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(websiteData)

            });


        const result =
            await response.json();


        if (result.success) {

            // حفظ ID الموقع
            currentWebsiteId =
                result.websiteId;


            localStorage.setItem(
                "currentWebsiteId",
                currentWebsiteId
            );


            // رسالة النجاح
            const successMessage =
                document.getElementById("successMessage");

            if (successMessage) {
                successMessage.textContent =
                    "✅ تم إنشاء موقعك بنجاح";
            }


            // إنشاء رابط المتجر
            const websiteUrl =
                `${window.location.origin}/store.html?id=${currentWebsiteId}`;


            // إظهار الرابط
            const websiteLink =
                document.getElementById("websiteLink");


            if (websiteLink) {

                websiteLink.innerHTML = `

                    <div style="
                        margin-top: 15px;
                        padding: 15px;
                        background: #111;
                        border-radius: 10px;
                        text-align: center;
                    ">

                        <p style="
                            color: white;
                            margin-bottom: 10px;
                        ">
                            🔗 رابط متجرك
                        </p>


                        <input
                            type="text"
                            value="${websiteUrl}"
                            readonly
                            style="
                                width: 100%;
                                padding: 10px;
                                margin-bottom: 10px;
                                border-radius: 6px;
                                border: 1px solid #444;
                                background: #222;
                                color: white;
                            "
                        >


                        <button
                            onclick="copyWebsiteLink('${websiteUrl}')"
                            style="
                                margin-top: 0;
                                background: white;
                                color: black;
                            "
                        >
                            📋 نسخ الرابط
                        </button>


                        <a
                            href="${websiteUrl}"
                            target="_blank"
                            style="
                                display: block;
                                margin-top: 10px;
                                color: #aaa;
                                text-decoration: none;
                            "
                        >
                            🌐 فتح المتجر
                        </a>

                    </div>

                `;

            }


            console.log(
                "Website ID:",
                currentWebsiteId
            );

        }

    } catch (error) {

        console.error(error);


        const successMessage =
            document.getElementById("successMessage");

        if (successMessage) {
            successMessage.textContent =
                "❌ حصل خطأ في الاتصال بالسيرفر";
        }

    }

}


// نسخ رابط المتجر
function copyWebsiteLink(url) {

    navigator.clipboard.writeText(url);

    alert("✅ تم نسخ رابط المتجر");

}


// إضافة منتج
async function addProduct() {

    const productName =
        document.getElementById("productName");

    const productPrice =
        document.getElementById("productPrice");

    const productImage =
        document.getElementById("productImage");

    if (!productName || !productPrice || !productImage) {
        return;
    }

    const name =
        productName.value;

    const price =
        productPrice.value;

    const image =
        productImage.value;


    if (!name || !price || !image) {

        alert("اكتب بيانات المنتج كاملة");

        return;

    }


    if (!currentWebsiteId) {

        alert("اعمل إنشاء للموقع الأول");

        return;

    }


    try {

        const response =
            await fetch("/api/product", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    websiteId: currentWebsiteId,
                    name: name,
                    price: price,
                    image: image

                })

            });


        const result =
            await response.json();


        if (result.success) {

            const container =
                document.getElementById(
                    "productsContainer"
                );

            if (!container) {
                return;
            }


            const product =
                document.createElement("div");


            product.className =
                "product";


            product.innerHTML = `

                <img
                    src="${image}"
                    alt="${name}"
                >

                <div class="product-info">

                    <h3>
                        ${name}
                    </h3>

                    <p class="price">
                        ${price} جنيه
                    </p>

                </div>

            `;


            container.appendChild(product);


            productName.value = "";
            productPrice.value = "";
            productImage.value = "";


            alert("✅ تم حفظ المنتج");

        }

    } catch (error) {

        console.error(error);

        alert(
            "❌ حصل خطأ في الاتصال بالسيرفر"
        );

    }

}