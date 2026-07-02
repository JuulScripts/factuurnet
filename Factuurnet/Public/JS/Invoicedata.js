
const statusButton = document.getElementById("status")
const statusText = document.querySelector('[for="status"]');
let send_status = false



async function updateStatus(id, newvalue) {

  try {
    
  const response = await fetch(`/changebyid?id=${id}&db=invoices&alterid=status&newValue=${newvalue}`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json'
      },
        body: JSON.stringify({sessiontoken:  localStorage.getItem('sessionToken')})
    });

     if (response.ok) {
      createNotification("updated status!")
     }
      
  } catch (err){
    console.error("an error occured in updatestatus", err)
  }
}

statusButton.addEventListener("change", async () => {
    const queryString = window.location.search;

// Parse it
const urlParams = new URLSearchParams(queryString);

// Get the 'id' parameter
const id = urlParams.get('invoiceid');
  updateStatus(id,statusButton.value )
})
async function fetchInvoiceData(e) {
     e.preventDefault();


   const params = new URLSearchParams(window.location.search);
   const invoiceid = params.get("invoiceid");
      
    const data = {
        sessiontoken: localStorage.getItem('sessionToken')
      };
   try{
        const response = await fetch(`/data/invoicedata?invoiceid=${encodeURIComponent(invoiceid)}`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json'
      },
        body: JSON.stringify(data) 
    });
   
   const result = await response.json();
   statusButton.value = result.data.status
   send_status = result.data.send_status
   if (result.success == false) {
     console.error("a server error has occured")
     return;
   }
   console.log(result)

    makeContent (result)
  } catch (err) {
     console.error("network error occured: "  + err)
     return;
  }
 }




function makeContent(result) {
  const data = result.data;
  if (!data) return;
  
  console.log(data.send_status)
  if (data.send_status) {
 //   statusButton.remove()
  //  statusText.remove()
  }
  const invoiceHeader = document.querySelector(".invoice h1");
  if (invoiceHeader) {
   let status = data.send_status ? "Verzonden" : "Concept";

    invoiceHeader.textContent =  status + ` factuur #${data.id ?? "N/A"}`;
  }

  const billingContainer = document.querySelector(".invoice-details > div:nth-child(1)");
  if (billingContainer) {
   billingContainer.innerHTML = `
  <h3>Gefactureerd aan:</h3>
  <p><span class="label">Klant ID:</span> <span class="value">${data.customer_id ?? "N/A"}</span></p>
  <p><span class="label">Klant Naam:</span> <span class="value">${result.name ?? "N/A"}</span></p>
  <p><span class="label">Factuur adress:</span> <span class="value">${data.address ?? ""}</span></p>
`;

  }

  const invoiceDateDiv = document.querySelector(".invoice-details > div:nth-child(2)");
  if (invoiceDateDiv) {
  const formatDate = (iso) => {
    if (!iso) return "N/A";
    return new Date(iso).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  invoiceDateDiv.innerHTML = `
  <h3>Factuurgegevens:</h3>
  <p>
    <span class="label">Datum:</span>
    <span class="value">
      ${
           `${formatDate(data.date)}`
      }
    </span>
  </p>
  <p>
    <span class="label">Vervaldatum:</span>
    <span class="value">
      ${
           `${formatDate(data.due_date)}`
      }
    </span>
  </p>
  <p>
    <span class="label">Status:</span>
    <span class="value">${data.status ?? "N/A"}</span>
  </p>
`;

}


  const tableBody = document.querySelector(".invoice-table tbody");
  if (tableBody) {
    tableBody.innerHTML = "";
    let items = result.productdata
    if (items) {
// Loop through the array
items.forEach(item => {
  const row = document.createElement("tr");

  if (send_status) {
  row.innerHTML = `
    <td>${item.id ?? "N/A"}</td>
    <td>${item.invoice_id ?? "N/A"}</td>
    <td>${item.subscription_id ?? "N/A"}</td>
    <td>${item.name ?? "N/A"}</td>
    <td>€${item.price ?? "N/A"}</td>
    <td>${item.amount ?? "N/A"}</td>
    <td>${item.vat_percentage ?? "N/A"}%</td>
  `;
  } else {
row.innerHTML = `
      <td>${item.id ?? "N/A"}</td>
    <td>${item.invoice_id ?? "N/A"}</td>
     <td>${item.subscription_id ?? "N/A"}</td>

  <td><input type="text" value="${item.name ?? ""}" placeholder="N/A"></td>
  <td>€<input type="number" step="0.01" value="${item.price ?? ""}" placeholder="N/A"></td>
  <td><input type="number" value="${item.amount ?? ""}" placeholder="N/A"></td>
  <td><input type="number" step="1" value="${item.vat_percentage ?? ""}" placeholder="N/A">%</td>
`;
  }
  tableBody.appendChild(row);
});

    } else {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="4" style="text-align:center;">Geen producten gevonden</td>`;
      tableBody.appendChild(row);
    }
  }

  const totalSection = document.querySelector(".total-section");
  if (totalSection) {
    totalSection.innerHTML = `
      <p><strong>Subtotaal:</strong> €${data.subtotal.toFixed(2) ?? "N/A"}</p>
      <p><strong>BTW:</strong> ${ data.subtotal
  ? Math.round((data.total - data.subtotal) / data.subtotal * 100)
  : 0}%</p>
      <p class="grand-total"><strong>Totaal te betalen:</strong> €${data.total.toFixed(2) ?? "N/A"}</p>
    `;
  }
}

document.getElementById("update").addEventListener("click", async () => {
     const params = new URLSearchParams(window.location.search);
    const id = params.get('invoiceid'); // get invoiceid from URL
  try {
    let response = await fetch("/data/update-concept?id="+id, { 
     body: JSON.stringify({sessiontoken: localStorage.getItem("sessionToken"), data: getAllFields(id)}),
     method: "POST", 
     headers:{'Content-Type': 'application/json'},

    })

    let result = await response.json()  

    if (response.ok) {
      createNotification("factuur succesvol aangepast")
    }
  } catch (err) {
    console.log(err)
    createNotification("Er is iets fout gegaan tijdens het aanpassen van het concept factuur", "error")
  }
})

function getAllFields(id) {
  const rows = document.querySelectorAll(".invoice-table tbody tr");
  const data = [];

  rows.forEach(row => {
    const inputs = row.querySelectorAll("input");
    const td = row.querySelectorAll("td");
    const item = [
       inputs[0]?.value || null,
       inputs[1]?.value || null,
       inputs[2]?.value || null,
       inputs[3]?.value || null,
       Number(td[0]?.textContent) || null ,
       
    ];

    data.push(item);
  });
  console.log(data)
  return data;
}


document.addEventListener('DOMContentLoaded', async (e) => {
   await fetchInvoiceData(e);
   if (!send_status) {
    statusButton.style.display = 'none'
    statusText.textContent = ""
   }
});



document.getElementById("verstuur").addEventListener("click", async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('invoiceid'); // get invoiceid from URL
   try {
     let response = await fetch("/send-invoice?id="+id, {
      method: "POST",
      headers:{'Content-Type': 'application/json'},
      body: JSON.stringify({sessiontoken: localStorage.getItem("sessiontoken")}) 
     })


     let result = await response.json() 


     if (result.success ) {
      createNotification("factuur is succesvol verstuurd !")
      return
     }

     createNotification("er is iets fout gegaan tijdens het versturen", "error")
  } catch (error) {
    console.log("error whilst sending invoice", error)
    createNotification("error whilst sending invoice")
  }
})


async function downloadInvoice(invoiceId) {
    const response = await fetch(`/data/invoice/pdf?id=${invoiceId}`, {
    method: 'POST'
});

    if (!response.ok) {
        createNotification("Failed to download invoice");
        return;
    }

    const blob = await response.blob(); // get file as blob
    const url = window.URL.createObjectURL(blob);

    // Create a temporary link to download
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${invoiceId}.pdf`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    a.remove();
    window.URL.revokeObjectURL(url);
}

document.getElementById('download').addEventListener('click', () => {
    const params = new URLSearchParams(window.location.search);
    const invoiceId = params.get('invoiceid'); // get invoiceid from URL
    downloadInvoice(invoiceId); // call your function
});
