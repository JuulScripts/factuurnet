
const id = new URLSearchParams(window.location.search).get("id");

async function makeNewConceptInvoice(id) {
      try {
        const response = await fetch("/data/create-concept?subscriptionid="+id, {
       method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sessiontoken: localStorage.getItem("sessionToken")
            })
        })

        const result = await response.json() 
        const data = result.data
        
        if (response.ok) {
          createNotification("succes, nieuw concept factuur gemaakt")
        }
    } catch (err) {
          createNotification("iets ging fout tijdens het maken van het concept factuur", 'error')

        console.error("a error occured : ", err)
    }
} 

async function getProductInvoiceData(id) {
    try {
        console.log(id)
        const response = await fetch(`/data/invoiceproducts?id=${id}`, {
       method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sessiontoken: localStorage.getItem("sessionToken")
            })
        })

        const result = await response.json() 
        const data = result.data
        console.log(data)
         populateProductTable(data)

    } catch (err) {
        console.error("a error occured : ", err)
    }
}

async function getData(id) {
    try {
        const response = await fetch(`/getbyid?id=${id}&db=subscriptions`, {
       method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sessiontoken: localStorage.getItem("sessionToken")
            })
        })

        const result = await response.json() 
        const data = result.data
        console.log(data)
        populateContent(data)
    } catch (err) {
        console.error("a error occured : ", err)
    }
}


function populateProductTable(items) {
  const tableBody = document.getElementById("productTableBody");
  tableBody.innerHTML = ""; // clear existing rows

  items.forEach(item => {
    const row = document.createElement("tr");


    row.innerHTML = `
<td id="invoice_productId">${item.id ?? "N/A"}</td>
<td>${item.invoice_id ?? "N/A"}</td>
<td>${item.subscription_id ?? "N/A"}</td>

<td>
  <input type="text" id="name" name="name" class="soft-input" value="${item.name ?? ''}">
</td>

<td>
  €<input type="number" step="0.01" id="price" name="price" class="soft-input" value="${item.price ?? 0}">
</td>

<td>
  <input type="number" step="0.01" id="amount" name="amount" class="soft-input" value="${item.amount ?? 0}">
</td>

<td>
  <input type="number" step="0.01" id="vat" name="vat_percentage" class="soft-input" value="${item.vat_percentage ?? 21}">
  %
</td>
    `;

    tableBody.appendChild(row);
  });
}


function populateContent(data) {
    // SUBSCRIPTION HEADER
    const headerTitle = document.querySelector(".subscription-header h1");
    const headerMuted = document.querySelector(".subscription-header .muted");
    headerTitle.textContent = data.name;
    headerMuted.innerHTML = `Abonnement ID: <strong>${data.id}</strong> • Gebruiker ID: <strong>${data.user_id}</strong>`;

    // STATUS

    // FACTURATIE CARD
    const facturatieCard = document.querySelector(".subscription-grid .card");
    if (facturatieCard) {
        facturatieCard.innerHTML = `
  <h3>Facturatie</h3>
  <p><strong>Prijs:</strong> €${parseFloat(data.price).toFixed(2)}</p>
<p>
  <strong>Start datum:</strong>
  <span>${data.start_date || '-'}</span>
</p>

<p>
  <strong>Facturatie termijn:</strong>
   <select id="subscription_length_term">
    <option value="" disabled>Termein</option>
    <option value="wekelijks">Wekelijks</option>
    <option value="maandelijks">Maandelijks</option>
    <option value="kwartaal">Per kwartaal</option>
    <option value="halfjaarlijks">Halfjaarlijks</option>
    <option value="jaarlijks">Jaarlijks</option>
  </select>
</p>

  <p>
    <strong>Eind datum:</strong>
    <input type="date" id="ends_at" class="soft-input" value="${data.ends_at || ''}">
  </p>
`;

    }

    console.log(data.subscription_length)
    document.getElementById('subscription_length_term').value = data.subscription_length;
    // KLANTGEGEVENS LINK
    const klantCardLink = document.querySelector(".subscription-grid .card-link");
    if (klantCardLink) {
        klantCardLink.href = `/userprofile?id=${data.user_id}`;
    }
   console.log(data.total)
    // FINANCIAL SUMMARY
    const financialCard = document.querySelector(".financial-summary");
    if (financialCard) {
        financialCard.innerHTML = `
            <h3>Financieel overzicht</h3>
            <div class="summary-row">
                <span>Subtotaal</span>
                <span>€${data.price}</span>
            </div>
           
            <div class="summary-row total">
                <span>Totaal </span>
                <span>€${data.total}</span>
            </div>
        `;
    }

    // INVOICE ACTIONS
    const invoiceActions = document.querySelector(".invoice-actions");
    if (invoiceActions) {
        const invoiceId = data.invoice_id ? data.invoice_id : "N/A";
    }
}



const queryString = window.location.search;

// Parse it
const urlParams = new URLSearchParams(queryString);

// Get the 'id' parameter
const subscriptionId = urlParams.get('id');

document.getElementById("verstuur").addEventListener("click", async () => {
    console.log("test")
    await makeNewConceptInvoice(subscriptionId)
})
async function loadAutoSendState() {
  const id = new URLSearchParams(window.location.search).get("id");

  const res = await fetch(`/get-auto-send?id=${id}`);
  const data = await res.json();

  document.getElementById("setAutoSend").checked = data.auto_send;
}

document.addEventListener("DOMContentLoaded", async () => {
await loadAutoSendState()
await getData(subscriptionId)
await getProductInvoiceData(subscriptionId)
})
 
document.getElementById("update").addEventListener("click", async () => {
    updateSubscriptions()
})

async function updateSubscriptions() {
    const params = new URLSearchParams(window.location.search);
const id = params.get('id'); // "41" as a string
console.log(id);
  // Collect values from the form inputs
  const data = {
    invoice_productId: Number(document.getElementById('invoice_productId').textContent) || '',
    name: document.getElementById('name')?.value || '',
    price: parseFloat(document.getElementById('price')?.value) || 0,
    subscription_length: document.getElementById('subscription_length_term')?.value || '',
    amount: parseFloat(document.getElementById('amount')?.value) || 0,
    adress: document.getElementById('adress')?.value || '',
    vat: parseFloat(document.getElementById('vat')?.value) || 0,
    ends_at: document.getElementById('ends_at')?.value || '',
    id: id || ''
  };

  try {
    const response = await fetch('/update-subscription', {  // change this URL to your API endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      createNotification('Subscription updated successfully!');
    } else {
      createNotification('Failed to update subscription.', "error");
    }
  } catch (error) {
    console.error(error);
    alert('An error occurred.');
  }
}



document.getElementById("setAutoSend").addEventListener("change", async (e) => {
  const url = e.target.checked ? "/auto-send-on" : "/auto-send-off";

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });

  if (e.target.checked) {
    createNotification("Auto-send enabled successfully!");
  } else {
    createNotification("Auto-send disabled successfully!");
  }
});