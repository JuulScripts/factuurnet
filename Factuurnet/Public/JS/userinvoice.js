let successText = document.getElementById("success")

document.addEventListener("DOMContentLoaded", async () => {

  getProducts()


  const tableBody = document.querySelector(".invoice-table tbody");
  const heading = document.querySelector(".invoice h1");

  // 1️⃣ Get user from URL query (?user=JohnDoe)
  const params = new URLSearchParams(window.location.search);
  const userid = params.get("user");
  




  const data = {sessiontoken: localStorage.getItem("sessionToken")}
  try {

    const response = await fetch(`/data/debitor?user=${encodeURIComponent(userid)}`,{
      method: 'POST', // POST is better for creating new data
      headers: {
        'Content-Type': 'application/json'
      },
        body: JSON.stringify(data) 
    });
    const result = await response.json();

    const username = result.name;
      if (!username) {
    heading.textContent = "geen gebruiker gevonden.";
    return;
  }

    heading.textContent = `Facturen for ${username}`;

    // 3️⃣ Handle possible errors
    if (!result.success || !result.data) {
      heading.textContent = "geen facturen gevonden voor " + result.name;
      return;
    }

    // 4️⃣ Clear any placeholder rows
    tableBody.innerHTML = "";

    // 5️⃣ Populate the table
    result.data.forEach((invoice) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>#${invoice.id}</td>
        <td>${formatDate(invoice.date)}</td>
        <td>${formatDate(invoice.due_date)}</td>
        <td>$${invoice.total.toFixed(2)}</td>
        <td><span class="status ${invoice.status.toLowerCase()}">${invoice.status}</span></td>
        <td><a href="invoicedata?invoiceid=${invoice.id}" class="link">View</a></td>
      `;

      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Error fetching invoices:", err);
    heading.textContent = "Geen facturen gevonden."
  }
});

function formatDate(isoDate) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}


// Variables
// Elements
const invoiceModal = document.getElementById("invoiceModal");
const openInvoiceModalBtn = document.getElementById("openInvoiceModalBtn");
const closeInvoiceModal = document.getElementById("closeInvoiceModal");

// Open modal
openInvoiceModalBtn.addEventListener("click", () => {
  invoiceModal.style.display = "flex";
});

// Close modal by X
closeInvoiceModal.addEventListener("click", () => {
  invoiceModal.style.display = "none";
});

// Close when clicking outside the modal
window.addEventListener("click", (e) => {
  if (e.target === invoiceModal) {
    invoiceModal.style.display = "none";
  }
});


async function makeNewInvoice(e) {
  e.preventDefault();

  const toggle = document.getElementById("togglePrices");

  // Default data
  let data = {
    customer_id: document.getElementById("customerId").value,
    address: document.getElementById("custAddress").value,
    invoice_date: document.getElementById("invoiceDate").value,
    due_date: document.getElementById("dueDate").value,
    status: document.getElementById("status").value,
    subtotal: document.getElementById("subtotal").value,
    total: document.getElementById("total").value,
    sessiontoken: localStorage.getItem("sessionToken"),
    product: document.getElementById("selectedProduct").value,

  };


  if (toggle.checked) {

    const customName = document.getElementById("customProductName").value;
    data.product = customName;
  } else {
    data.getProductPrice = true;
  }

  try {
    const response = await fetch("/createinvoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    let result = await response.json();

    if (!result.success) {
      console.log("error reaching out to createinvoice, error: " + result.message);
    }

    successText.textContent = result.message;
  } catch (err) {
    console.log("an error occurred whilst reaching out to createinvoice, error: " + err);
  }
}



let submit = document.getElementById("submit")


submit.addEventListener("click", (e) => {
  makeNewInvoice(e)
})

const productSelect = document.getElementById("productSelect");
const productList = document.getElementById("productList");
const selectedProductInput = document.getElementById("selectedProduct");

// Toggle dropdown
productSelect.addEventListener("click", () => {
  productList.style.display = productList.style.display === "block" ? "none" : "block";
});

// Populate product list from data
function populateProductNames(data) {
  productList.innerHTML = ""; // clear existing list
  data.forEach(row => {
    const li = document.createElement("li");
    li.textContent = row.name; // MySQL2 row.name
    li.addEventListener("click", () => {
      productSelect.textContent = row.name;
      selectedProductInput.value = row.name;
      productList.style.display = "none";
    });
    productList.appendChild(li);
  });
}

// Close dropdown if clicked outside
document.addEventListener("click", function(event) {
  if (!productSelect.contains(event.target) && !productList.contains(event.target)) {
    productList.style.display = "none";
  }
});



async function getProducts() {
     const data = {
        sessiontoken: localStorage.getItem("sessionToken")
    };

    try {
        const response = await fetch('/fetchproductnames', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        console.log('Name data found ', result);
        populateProductNames(result.data)
    } catch (error) {
        console.error('Error fetching data:', error);
    }

}


document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("togglePrices");

  const subtotalInput = document.getElementById("subtotal");
  const subtotalLabel = document.querySelector("label[for='subtotal']");

  const totalInput = document.getElementById("total");
  const totalLabel = document.querySelector("label[for='total']");

  const productLabel = document.querySelector("label[for='productSelect']");
  const productDropdown = document.querySelector(".product-dropdown");

  // New custom product field
  const customProductLabel = document.getElementById("customProductLabel");
  const customProductInput = document.getElementById("customProductName");

  function updateVisibility() {
    if (toggle.checked) {
      subtotalLabel.style.display = "";
      subtotalInput.style.display = "";

      totalLabel.style.display = "";
      totalInput.style.display = "";

      productLabel.style.display = "none";
      productDropdown.style.display = "none";

      customProductLabel.style.display = "";
      customProductInput.style.display = "";
    } else {
      productLabel.style.display = "";
      productDropdown.style.display = "";

      subtotalLabel.style.display = "none";
      subtotalInput.style.display = "none";

      totalLabel.style.display = "none";
      totalInput.style.display = "none";

      customProductLabel.style.display = "none";
      customProductInput.style.display = "none";
    }
  }

  toggle.addEventListener("change", updateVisibility);

  updateVisibility();
});

