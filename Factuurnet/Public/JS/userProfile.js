
const invoiceModal = document.querySelector(".modal-wrapper"); 
const invoiceModalBox = document.querySelector(".modal-box"); 
const closeInvoiceModalBtn = document.getElementById("closeInvoiceModal");
const currentPage = document.getElementById("currentPage");

const togglePrices = document.getElementById("togglePrices");
const addProductBtn = document.getElementById("addProductBtn");

const successText = document.getElementById("success");
const openInvoiceModalBtn = document.getElementById("openInvoiceModalBtn");
const subscriptionModal = document.getElementById("subscriptionModal");
const priceSubCheckbox = document.getElementById("priceSub");
const subscriptionMenu = document.getElementById("subscriptionMenu");
const saveChanges = document.getElementById("save-btn-changes");


let productTermeinen; 




let currentType = "standard"



saveChanges.addEventListener("click", async (e) => {
    e.preventDefault(); // prevent page reload
    await updateUserProfile(e);
});
    const toggle = document.getElementById("togglePrices");

let currentProductType = toggle.checked;
let isSubscription = priceSubCheckbox.checked;
let currentSelectedMenu = "invoice";
let CurrentMenu = invoiceModal;

const pages = {
  Invoices: {
    name: "invoice",
    submitBtnId: "submit",
    pageBtnId: "facturenBtn",
    fetchData: fetchInvoices,
    modalTitle: "Factuur aanmaken",
    getProducts: getProducts,
    openBtnId: "openInvoiceModalBtn",
    modal: invoiceModal,
    submitHandler: makeNewInvoice,
      columns: `
      <thead>
        <tr>
          <th>Factuurnummer</th>
          <th>Datum</th>
          <th>Vervaldatum</th>
          <th>Totaal</th>
          <th>Status</th>
          <th>Actie</th>
          <th>Verzonden</th> 
          <th>Verwijder</th>

        </tr>
      </thead>
      <tbody>
      </tbody>
    </table>
  </div>
    `
  },
  Subscriptions: {
    name: "subscription",
    submitBtnId: "subscriptionSubmit",
    pageBtnId: "abonnementenBtn",
    fetchData: fetchSubscriptions,
    modalTitle: "Abonnement toevoegen",
    getProducts: getProductsByMonth,
    openBtnId: "openSubscriptionModalBtn",
    modal: subscriptionModal,
    submitHandler: makeNewSubscription, // or your subscription submit function
    columns: `
  <div class="invoice-section">
    <table class="invoice-table" border="1" cellspacing="0" cellpadding="5">
      <thead>
        <tr>
          <th>ID</th>                
          <th>Naam</th>                 
          <th>Gebruiker ID</th>       
          <th>subtotal</th>              
          <th>Abonnoment lengte</th>  
          <th>Start datum</th> 
          <th>Verwijder</th>           
          <th>Actie</th>           
        </tr>
      </thead>
      <tbody>
      </tbody>
    </table>
  </div>
    `
  }
};

Object.values(pages).forEach(page => {
  const pageBtn = document.getElementById(page.pageBtnId);
  const submitBtn = document.getElementById(page.submitBtnId);

  if (submitBtn) {
    submitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      page.submitHandler(e);
    });
  }

  if (!pageBtn) return;
  pageBtn.addEventListener("click", () => {
   currentSelectedMenu = page.name

    document.getElementById("columns").innerHTML = page.columns
    page.getProducts();

    document.querySelectorAll(".toggle-btn").forEach(btn => {
      btn.style.backgroundColor = "#f3f4f6";
    });

   

    pageBtn.style.backgroundColor = "#2563eb";

    page.fetchData();
  });
});


let fetchAmount = 1; // initial number
const scrollLeftBtn = document.getElementById("scrollLeft");
const scrollRightBtn = document.getElementById("scrollRight");

currentPage.textContent = fetchAmount;

scrollRightBtn.addEventListener("click", () => {
     if (fetchAmount >= maxPageAmount) return; 
  fetchAmount++;
  currentPage.textContent = fetchAmount+"/"+maxPageAmount;
  if (currentSelectedMenu == "invoice") {
    fetchInvoices();
  } else {
    fetchSubscriptions();
  }
});

// 
scrollLeftBtn.addEventListener("click", () => {
  if (fetchAmount <= maxPageAmount) return
  fetchAmount--;
  currentPage.textContent = fetchAmount+"/"+maxPageAmount;
    if (currentSelectedMenu == "invoice") {
    fetchInvoices();
  } else {
    fetchSubscriptions();
  }
});


let page = pages.Invoices;
function getUserId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

function clearTableRows() {
    const tableBody = document.querySelector(".invoice-table tbody");
    if (tableBody) tableBody.innerHTML = "";
}

function populateProfile(data) {
    if (!data) return;
document.getElementById("Naam").textContent = "Debiteur: " + (data.company_name || data.name || "Onbekend")
document.getElementById("customer_id").value = data.customer_id ?? "";
document.getElementById("name").value = data.name ?? "";
document.getElementById("company_name").value = data.company_name ?? "";
document.getElementById("contact_person").value = data.contact_person ?? "";
document.getElementById("email").value = data.email ?? "";
document.getElementById("website").value = data.website ?? "";
document.getElementById("phonenumber").value = data.phonenumber ?? "";
document.getElementById("mobile_number").value = data.mobile_number ?? "";
document.getElementById("fax_number").value = data.fax_number ?? "";
document.getElementById("address").value = data.address ?? "";
document.getElementById("postal_code_city").value = data.postal_code_city ?? "";
document.getElementById("country").value = data.country ?? "";
document.getElementById("chamber_of_commerce_number").value = data.chamber_of_commerce_number ?? "";
document.getElementById("vat_number").value = data.vat_number ?? "";
document.getElementById("peppol_id").value = data.peppol_id ?? "";
document.getElementById("notes").value = data.notes ?? "";
document.getElementById("lastname").value = data.lastname ?? ""
document.getElementById("city").value = data.city ?? ""



}
async function fetchUserProfile() {
    const userid = getUserId();
    const token = localStorage.getItem("sessionToken");
    try {
        const response = await fetch(`/data/userprofile?userid=${userid}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessiontoken: token })
        });
        const result = await response.json();
        if (!result.success) return;
        populateProfile(result.data);
    } catch (err) {
        console.error(err);
    }
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("nl-NL", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function addDeleteButton(row, id, type ) {
        if (typeof type !== "number") type = 0;
    const tdDelete = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Verwijder";
    deleteBtn.classList.add("delete-btn");

    deleteBtn.addEventListener("click", async () => {
        if (! await createConfirmNotification(`Weet je zeker dat je #${id} wilt verwijderen?`)) return;

        try {
            let types = [`/delete?type=invoiceId&what=invoices&misc=${id}`, `/delete?type=id&what=subscriptions&misc=${id}`]
            const response = await fetch(types[type], {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessiontoken: localStorage.getItem("sessionToken")})
            });

            if (response.ok) {
                row.remove(); // Remove the row from the table
                createNotification(`#${id} is verwijderd.`);
            } else {
                createNotification("Verwijderen mislukt.", "error");
            }
        } catch (err) {
            console.error(err);
            createNotification("Er is een fout opgetreden tijdens het verwijderen.", "error");
        }
    });

    tdDelete.appendChild(deleteBtn);
    row.appendChild(tdDelete);
}

async function fetchInvoices() {
    const userid = getUserId();
    const token = localStorage.getItem("sessionToken");
    const tableBody = document.querySelector(".invoice-table tbody");
    const heading = document.querySelector(".invoice h1");

    const statusMap = {
        "Betaald": "paid",
        "Afwachting": "pending",
        "Laat": "late"
    };

    clearTableRows(); 
    try {
        const response = await fetch(`/data/debitor?user=${userid}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessiontoken: token, page: fetchAmount })
        });

        const result = await response.json();
        const username = result.company_name || result.name;
        if (!username) {
            heading.textContent = "Geen gebruiker gevonden.";
        }

        heading.textContent = `Facturen voor ${username}`;

        if (!result.success || !result.data?.length) {
            heading.textContent = `Geen facturen gevonden voor ${username}`;
        }
        if (result.data) {
            const sendMap = ["  Concept", "Verzonden"]
            result.data.forEach(inv => {
                let statusClass = statusMap[inv.status] || "";
                              
                let fithRow = `<td><span class="status ${statusClass}">${inv.status}</span></td>`
                if (!inv.send_status) {
                    statusClass = "concept"
                    fithRow = `<td><span class="status ${statusClass}">concept</span></td>`;
            }
                const row = document.createElement("tr");
                row.innerHTML = `
                   <td>${inv.show_id === null ? 'concept' : '#' + inv.show_id}</td>
                    <td>${formatDate(inv.invoice_date)}</td>
                    <td>${formatDate(inv.due_date)}</td>
                    <td>€${inv.total.toFixed(2)}</td>
                    ${fithRow}
                    <td><div class="view-btn"><a href="invoicedata?invoiceid=${inv.id}" class="link">Bekijken</a></div></td>
                    <td> <div class="sendtype"> ${sendMap[inv.send_status]} </div></td>
                `;
      
                // Add the delete button column
                addDeleteButton(row, inv.id);

                tableBody.appendChild(row);
            });
        }

    } catch (err) {
        console.error(err);
        heading.textContent = "Geen facturen gevonden.";
    }
}

async function fetchSubscriptions() {
    const token = localStorage.getItem("sessionToken");
    const tableBody = document.querySelector(".invoice-table tbody");
    const heading = document.querySelector(".invoice h1");

    // Clear previous rows
    tableBody.innerHTML = "";

    try {
        const response = await fetch(`/fetchsubscriptions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessiontoken: token, page: fetchAmount, id: getUserId() })
        });

        const result = await response.json();

        if (!result.success || !result.data?.length) {
            heading.textContent = "Geen abonnementen gevonden.";
            return;
        }

        heading.textContent = "Abonnementen";
if (result.data) {
        result.data.forEach(sub => {
            // Format price nicely
            const priceDisplay =
                (typeof sub.price === "number")
                    ? "€" + sub.price.toFixed(2)
                    : (sub.price ? "€" + sub.price : "N/A");

            // Subscription length display
            const lengthDisplay = sub.subscription_length ? "per " + sub.subscription_length  : "N/A";

            // Periodes - assuming this is number of periods or something similar
            console.log(sub)
            const periodesDisplay = sub.start_date || "N/A";

            const row = document.createElement("tr");
row.innerHTML = `
    <td>#${sub.id}</td>
    <td>${sub.name || "N/A"}</td>
    <td>${sub.user_id || "N/A"}</td>
    <td>${priceDisplay}</td>
    <td>${lengthDisplay}</td>
    <td>${periodesDisplay}</td>
`;

// Add delete button column
addDeleteButton(row, sub.id, 1);
 const tdInvoices = document.createElement('td');
const a = document.createElement('a');

a.href = `/subscriptiondata?id=${sub.id}`;
a.textContent = 'Bekijken';
a.classList.add('link', 'view-btn'); // add view-btn here

tdInvoices.appendChild(a);
row.appendChild(tdInvoices);
tableBody.appendChild(row);

        });
    }
    } catch (err) {
        console.error(err);
        heading.textContent = "Geen abonnementen gevonden.";
    }
}


async function updateUserProfile(e) {
    e.preventDefault();

    const token = localStorage.getItem("sessionToken");
const notesValue = document.getElementById("notes")?.value || "";

    const data = {
  customer_id: document.getElementById("customer_id").value,
  name: document.getElementById("name").value,
  company_name: document.getElementById("company_name").value,
  contact_person: document.getElementById("contact_person").value,
  email: document.getElementById("email").value,
  website: document.getElementById("website").value,
  phone_number: document.getElementById("phonenumber").value,
  mobile_number: document.getElementById("mobile_number").value,
  fax_number: document.getElementById("fax_number").value,
  address: document.getElementById("address").value,
  postal_code_city: document.getElementById("postal_code_city").value,
  country: document.getElementById("country").value,
  chamber_of_commerce_number: document.getElementById("chamber_of_commerce_number").value,
  vat_number: document.getElementById("vat_number").value,
  peppol_id: document.getElementById("peppol_id").value,
  lastname: document.getElementById("lastname").value,
  notes:document.getElementById("notes").value,
  city:document.getElementById("city").value,


  sessiontoken: token
    };

    try {
        const response = await fetch("/updateuserprofile?id="+getUserId(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            createNotification(result.message);
        } else {
            createNotification("Fout bij bijwerken: " + result.message, 'error');
        }

    } catch (err) {
        console.error(err);
        createNotification("Er is een fout opgetreden bij het bijwerken van het profiel.", "error");
    }
}

const productSelect = document.querySelector('select#name');

const productList = document.getElementById("productList");
const selectedProductInput = document.getElementById("selectedProduct");
function populateProductNames(data) {
    productSelect.innerHTML = ` 
        <option value="" disabled selected>Selecteer een product</option>
    `;

    data.forEach(row => {
        const option = document.createElement("option");
        option.value = row.name;   // or row.id if you prefer
        option.textContent = row.name;
        productSelect.appendChild(option);
    });
}


function populateSubscriptionNames(products) {
    const select = document.getElementById("subscriptionSelect");
    const list = document.getElementById("subscriptionList");
    const hiddenField = document.getElementById("selectedSubscription");

    list.innerHTML = ""; // Clear old entries

    products.forEach(p => {
        const li = document.createElement("li");

        // Build the text shown in the dropdown
        li.textContent = `${p.name} - $${p.price} / ${p.periodes} (${p.periode_type})`;

        // Store all values inside the element
        li.dataset.id = p.id;
        li.dataset.name = p.name;
        li.dataset.price = p.price;
        li.dataset.periodes = p.periodes;
        li.dataset.periodeType = p.periode_type;

        li.addEventListener("click", () => {
            // What shows in the select box when chosen
            select.textContent = `${p.name} - $${p.price} / ${p.periodes} (${p.periode_type})`;

            // Store the ID or full record if needed  
            hiddenField.value = p.id;

            list.style.display = "none";
        });

        list.appendChild(li);
    });

    select.addEventListener("click", () => {
        list.style.display = list.style.display === "block" ? "none" : "block";
    });
}



async function getProductsByMonth() {
    const data = {
        sessiontoken: localStorage.getItem("sessionToken")
    };

    try {
        const response = await fetch('/fetchproductsmonthly', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            console.error("Backend returned error", response.status);
            return;
        }

        const result = await response.json();


        if (result?.data) {
            populateSubscriptionNames(result.data);
        }

    } catch (error) {
        console.error('Error fetching subscription product data:', error);
    }
}

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
        if (result.data) {
        populateProductNames(result.data)

        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }

}





async function makeNewSubscription(e) {
    e.preventDefault();
    const userid = getUserId(); // from URL
    const token = localStorage.getItem("sessionToken");
 	
    // Gather data from subscription form
    const data = {
        sessiontoken: token,
       subscription_length: document.getElementById("subFrequency").value,
       periodes: document.getElementById("subAmount").value,
        name: document.getElementById("selectedSubscription").value, // selected product
        status: document.getElementById("statusSub").value,
        price: parseFloat(document.getElementById("priceSub").value) || 0,
        due_time: document.getElementById("dueTime").value
    };

    try {
        const response = await fetch(`/addsubscription?id=${userid}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        // Show success / error message
        const successSubText = document.getElementById("successSub");
        successSubText.textContent = result.message || (result.success ? "Succes!" : "Fout opgetreden");

        // Refresh subscriptions table
        fetchSubscriptions();

    } catch (err) {
        console.error(err);
        document.getElementById("successSub").textContent = "Er is een fout opgetreden.";
    }
}

    async function makeNewInvoice(e) {
        e.preventDefault();
        const userid = getUserId();
        const token = localStorage.getItem("sessionToken");
        const toggle = document.getElementById("togglePrices");
   const allFields = document.querySelectorAll(".dataFields");
let  groups = [];
// sepperate if statement to add all datafields and both a unique id

// get all other input fields (cuistom added)
   document.querySelectorAll(".dataFields").forEach(groupDiv => {
    if (groupDiv.id != "original-double-fields" && groupDiv.id != "original-product"){
  let groupData = {};

  groupDiv.querySelectorAll("input").forEach(input => {
       if (input.type == "checkbox")
        groupData[input.id] = input.checked;
        else
        groupData[input.id] = input.value;
});

groupDiv.querySelectorAll("select").forEach(input => {
    groupData[input.id] = input.value

        
  
}


);



 groups.push(groupData);}
});
// get main input field

console.log(currentType, document.getElementById(currentType).style.display)
if (document.getElementById(currentType).style.display == 'block') {
    console.log("test")
    let mainGroupData = {};  // different variable name

    document.getElementById(currentType).querySelectorAll("input").forEach((input) => {
            document.getElementById(currentType).querySelectorAll("select").forEach((input) => {
        mainGroupData[input.id] = input.value;
    });
 
        if (input.type == "checkbox")
        mainGroupData[input.id] = input.checked;
        else
        mainGroupData[input.id] = input.value;
    });



    groups.push(mainGroupData);
}

        let data = {
            isSubscription: document.getElementById("priceSub").checked,
            sessiontoken: token,
            data: groups,

        };

       

        try {
            const response = await fetch(`/createinvoice?id=${userid}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            let type = "succes"
              if (!response.ok) {
                type = "error"
            }
            successText.textContent = result.message;
            createNotification(result.message, type)

          
            if (currentSelectedMenu == "invoice")
            {fetchInvoices();} else if (currentSelectedMenu == "subscription") {
             fetchSubscriptions();
            }
        } catch (err) {
            createNotification("er is iets fout gegaan tijdens het maken van het factuur", "error")

            console.error(err);
        }
    }


async function setProductTermeinsright() {
 let response = await fetch("/data/product-termein", {
    method: "GET",
 })

 let result = await response.json()

 productTermeinen = result.data
 console.log(productTermeinen)
}

function termeinRight(product, select) {
    let termein = productTermeinen.find(obj => obj.name === product)?.price_per;
    select.value = Array.from(select.children).map(opt => opt.value).indexOf(termein) === -1 ? "" : termein;
}


window.addEventListener("click", e => {
    if (e.target === invoiceModal) invoiceModal.style.display = "none";
});
  let productSelection 
  let maxPageAmount;
document.addEventListener("DOMContentLoaded", async () => {
    await fetchUserProfile();
    await fetchInvoices();
    await setProductTermeinsright();

    priceSubCheckbox.addEventListener("change", () => {
    isSubscription = priceSubCheckbox.checked
    subscriptionMenu.style.display = priceSubCheckbox.checked ? "block" : "none";
    });



    await getProducts();
    const allFields = document.querySelectorAll(".dataFields")
    productSelection = document.querySelector('.product-selection').innerHTML;
    
    // make the subscription items invisible, doing this because if display = none it wont get cloned by inner html
    const children = Array.from(
    document.querySelector('.product-selection')
    .querySelector('.id-wrapper')
    .children
    ); 

   children.forEach(el => el.style.display = "none");
 //---------------------------------------------------- 


    const standardProduct= document.getElementById('standard-product');
    const productFields = document.querySelector('.product-fields');
    const doubleFields = document.getElementById("double-fields")
    standardProduct.id = 'standard';
    productFields.id = 'original-product';
    doubleFields.id = 'original-double-fields';
     let buttons = document.querySelectorAll(".close-btn")
     let response = await fetch(
 "/data/page-length?db=customers", {
  method: "GET"
 }
)
let result = await response.json()

let amount = result.amount

currentPage.textContent = fetchAmount+"/"+amount;  
maxPageAmount = amount
    buttons.forEach((b) => {
      b.remove()
    })

        let selectTermein = document.getElementById("dropdown-termein");
        let nameSelect = document.querySelector(".dropdown-wrapper").querySelector("#name")
    nameSelect.addEventListener("change", () => {
        console.log("hey")
        termeinRight(nameSelect.value, selectTermein)
    })
});


window.addEventListener('pageshow', (event) => {
  const navType = performance.getEntriesByType("navigation")[0]?.type;

  if (event.persisted || navType === "back_forward") {
    location.reload();
  }
});
function openInvoiceModal() {
  invoiceModal.style.display = "flex";
}

function closeInvoiceModal() {
  invoiceModal.style.display = "none";
}

if (openInvoiceModalBtn) {
  openInvoiceModalBtn.addEventListener("click", openInvoiceModal);
}

if (closeInvoiceModalBtn) {
  closeInvoiceModalBtn.addEventListener("click", closeInvoiceModal);
}

window.addEventListener("click", (e) => {
  if (e.target === invoiceModal) {
    closeInvoiceModal();
  }
});
   


  document.getElementById('togglePrices').addEventListener('change', function() {
    
    const standardProduct= document.getElementById('standard');
    const productFields = document.getElementById('original-product');

    if (this.checked) {
      currentType = "original-product"
      productFields.style.display = 'block';
      standardProduct.style.display = 'none';
    
    } else {
      currentType = "standard"
      productFields.style.display = 'none';
      standardProduct.style.display = 'block';
    }
  });

  document.getElementById('priceSub').addEventListener('change', function() {
    if (this.checked) {
        
      subscriptionMenu.style.display = 'block';
    } else {
      subscriptionMenu.style.display = 'none';
    }
  });
let count = 1;


document.getElementById('addCustomProductBtn').addEventListener('click', function() {
  document.querySelector('.product-selection').insertAdjacentHTML('beforeend', productSelection);

   const standardProduct= document.getElementById('standard-product');
    const productFields = document.getElementById('product-field');
    standardProduct.remove()
    productFields.style.display = "block"
    
    productFields.id = 'original-product'+count;
    count++;
})

document.getElementById('addProductBtn').addEventListener('click', function() {
  // Append the same HTML again under itself
  document.querySelector('.product-selection').insertAdjacentHTML('beforeend', productSelection);

  

   let standardProduct= document.getElementById('standard-product');
    const productFields = document.getElementById('product-field');

    standardProduct.id = 'standard-product'+count;
    standardProduct = document.getElementById('standard-product'+count)
    const length = document.querySelectorAll("#isSubscription").length -1 
    const recentSubscriptionButton = document.querySelectorAll("#isSubscription")[length]
    const idWrapper = recentSubscriptionButton.parentElement.querySelector(".id-wrapper")

    
    recentSubscriptionButton.addEventListener("change", () => {
    idWrapper.style.display = recentSubscriptionButton.checked ? "block" : "none";
    });
    
    idWrapper.style.display = "none"


     let selectTermein = idWrapper.querySelector("#dropdown-termein");
    let nameSelect = standardProduct.querySelector("#name")
    nameSelect.addEventListener("change", () => {
        console.log("hey")
        termeinRight(nameSelect.value, selectTermein)
    })
    productFields.remove()
    count++;
});

// Add event listener to all close buttons
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('close-btn')) {
    const wrapper = e.target.closest('.dataFields');
    if (wrapper){ wrapper.remove(); count--;}

  }
});
 


