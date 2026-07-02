let currentFilter = 'Afwachting';
let fetchAmount = 1; // initial number
 
 // Dropdown toggle
  document.querySelector('.filter-btn').addEventListener('click', function() {
    document.querySelector('.dropdown-content').classList.toggle('show');
  });

  // Close dropdown if clicked outside
  window.addEventListener('click', function(e) {
    if (!e.target.matches('.filter-btn')) {
      document.querySelectorAll('.dropdown-content').forEach(drop => drop.classList.remove('show'));
    }
  });

  // Handle filter option clicks
  document.querySelectorAll('.filter-option').forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');
      console.log('Filter clicked:', filter);
  
      // TODO: Implement filtering logic in JS
      currentFilter = filter
      document.querySelector('.dropdown-content').classList.remove('show');
          fetchInvoices();
    });
  });




async function fetchInvoices()  {
     const data = {
        sessiontoken: localStorage.getItem("sessionToken"),
        filter:currentFilter,
        page: fetchAmount
    };
const tbody = document.getElementById("invoice-list");
tbody.innerHTML = ""; // removes all rows

    try {
        const response = await fetch('/fetchinvoicedata', {
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
        populateInvoiceList(result.data)
        console.log('data loaded succesfully ', result);

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


function populateInvoiceList(invoices) {
  const tbody = document.getElementById("invoice-list");
  if (!tbody) return;

  tbody.innerHTML = ""; // Clear previous rows

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  invoices.forEach((invoice) => {
    const row = document.createElement("tr");

    // Store invoice ID as a data attribute on the row
    row.dataset.invoiceId = invoice.id;
    const sendMap = ["concept", "verzonden"]
    let status = invoice.status
     if (invoice.status == "Afwachting") {
      status = "Openstaand" //status name fix becuse im lazy 
    }
   row.innerHTML = `
  <td>${invoice.show_id === null ? 'concept' : "#" + invoice.show_id}</td>
  <td>${invoice.customer_id}</td>
  <td>${invoice.address}</td>
  <td>${formatDate(invoice.invoice_date)}</td>
  <td>${formatDate(invoice.due_date)}</td>
  <td>${invoice.show_id === null ? 'concept' :  invoice.status}</td>
  <td>€${parseFloat(invoice.subtotal).toFixed(2)}</td>
  <td>€${parseFloat(invoice.total).toFixed(2)}</td>
  <td>${formatDate(invoice.date)}</td>
  <td>
    <button class="view-btn">Bekijk</button>
  </td>
  <td>
    <button class="delete-btn">Verwijder</button>
  </td>
    <td>
    <div class="concept"> ${sendMap[invoice.send_status]} </div>
  </td>
`;
    tbody.appendChild(row);


const deleteBtn = row.querySelector(".delete-btn");
deleteBtn.addEventListener("click", async () => {
  if (! await createConfirmNotification(`Weet je zeker dat je factuur #${invoice.id} wilt verwijderen?`)) return;

  try {
    const response = await fetch(`/delete?type=invoiceId&what=invoices&misc=${invoice.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({sessiontoken: localStorage.getItem("sessionToken")})
    });

    if (response.ok) {
      row.remove(); // remove the row from the table
      createNotification(`Factuur #${invoice.id} is verwijderd.`);
    } else {
      createNotification("Verwijderen mislukt.", "error");
    }
  } catch (err) {
    console.error(err);
    createNotification("Er is een fout opgetreden tijdens het verwijderen.", "error");
  }
});  });

  

  // Add click listeners to all "View" buttons
  tbody.querySelectorAll(".view-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const invoiceId = e.target.closest("tr").dataset.invoiceId;
      window.location.href = `invoicedata?invoiceid=${invoiceId}`;
    });
  });
}


document.addEventListener('DOMContentLoaded', async (e) => {
    e.preventDefault()
    fetchInvoices();
    await FetchUserData()
});


const currentPage = document.getElementById("currentPage");
const scrollLeftBtn = document.getElementById("scrollLeft");
const scrollRightBtn = document.getElementById("scrollRight");

currentPage.textContent = fetchAmount;

scrollRightBtn.addEventListener("click", () => {
  fetchAmount++;
  currentPage.textContent = fetchAmount;
fetchInvoices()

});

// 
scrollLeftBtn.addEventListener("click", () => {
  fetchAmount--;
  currentPage.textContent = fetchAmount;
fetchInvoices()
});


async function FetchUserData() {



fetch("/getuserdata", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"  
  },
  body: JSON.stringify({sessiontoken: localStorage.getItem("sessionToken")})
})
.then(response => response.json())
.then(result => {
  if (result.success == false) {
     window.location.href = "/"
  }
  
})
.catch(error => {
  console.error("Error:", error);
  if (error.invalidsesh != null) {
    window.location.href = "/"
  }
});


}
