


  const createBtn = document.getElementById('createInvoiceBtn');
  const popup = document.getElementById('invoicePopup');
  const closeBtn = document.getElementById('closePopup');
  const invoiceForm = document.getElementById('invoiceForm');
let fetchAmount = 1; // initial number
const currentPage = document.getElementById("currentPage");

  const succescode = document.getElementById('succescode');

  // Open popup
  createBtn.addEventListener('click', () => {
   popup.style.display = 'flex';
  });

  // Close popup
  closeBtn.addEventListener('click', () => {
    popup.style.display = 'none';
  });

  // Close popup if click outside content
  window.addEventListener('click', (e) => {
    if (e.target === popup) {
      popup.style.display = 'none';
    }
  });



function populateContent(userdata) {
    const tbody = document.querySelector('.invoice-table tbody');
    tbody.innerHTML = ''; // Clear existing rows

    userdata.forEach(user => {
        const tr = document.createElement('tr');

        // User ID
        const tdId = document.createElement('td');
        tdId.textContent = `#${user.id.toString().padStart(3, '0')}`;
        tr.appendChild(tdId);

        // Name
        const tdName = document.createElement('td');
        tdName.textContent = user.company_name || user.name;
        tr.appendChild(tdName);

       

        // Email
        const tdEmail = document.createElement('td');
        tdEmail.textContent = user.email;
        tr.appendChild(tdEmail);

        // Actie (profile link)
        const tdInvoices = document.createElement('td');
        const a = document.createElement('a');
        a.href = `/userprofile?id=${encodeURIComponent(user.id)}`;
        a.textContent = 'Zie profiel';
        a.classList.add('link');
        tdInvoices.appendChild(a);
        tr.appendChild(tdInvoices);

        // Verwijder (delete button)
        const tdDelete = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Verwijder';
        deleteBtn.classList.add('delete-btn');
        
        // Handle click
        deleteBtn.addEventListener('click', async () => {
            if ( ! await createConfirmNotification(`Weet je zeker dat je ${user.name} wilt verwijderen?`)) return;

            try {
                const response = await fetch(`/delete?type=Cid&what=customers&misc=${user.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ sessiontoken: localStorage.getItem("sessionToken") })
                });

                if (response.ok) {
                    // Remove the row from the table
                    tr.remove();
                    
                    createNotification(`${user.name} is verwijderd.`)
                } else {
                    createNotification('Verwijderen mislukt.', "error");
                }
            } catch (error) {
                console.error(error);
                createNotification('Er is een fout opgetreden.', "error");
            }
        });

        tdDelete.appendChild(deleteBtn);
        tr.appendChild(tdDelete);

        tbody.appendChild(tr);
    });
}


let maxPageAmount
async function FetchUserData(e) {
    e.preventDefault();

let response = await fetch(
 "/data/page-length?db=customers", {
  method: "GET"
 }
)
let result = await response.json()

let amount = result.amount
currentPage.textContent = fetchAmount+"/"+amount;  
maxPageAmount = amount
fetch("/getuserdata", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"  
  },
  body: JSON.stringify({sessiontoken: localStorage.getItem("sessionToken"), page: fetchAmount})
})
.then(response => response.json())
.then(result => {
  if (result.success == true) {
 populateContent(result.data)
  } else {
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

  document.addEventListener('DOMContentLoaded', async (e) => {
  await   FetchUserData(e)

});






async function createNewCustomer(data, e) {
  e.preventDefault();
  try {
    const response = await fetch('/createnewcustomer', {
      method: 'POST', // POST is better for creating new data
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (response.ok) {
      createNotification('Nieuwe debiteur aangemaakt!')
      console.log('Customer created:', result);
      FetchUserData(e);
      
    } else {
      console.error('Error:', result.message);
      createNotification('Error creating customer: ' + result.message);
    }
  } catch (err) {
    console.error('Fetch error:', err);
    createNotification('Network error: ' + err.message);
  }
}



invoiceForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const data = {

  name: document.getElementById('userName').value,
  email: document.getElementById('userEmail').value,
  phonenumber: document.getElementById('userPhone').value,
  mobile_number: document.getElementById('mobile_number').value,
  fax_number: document.getElementById('fax_number').value,
  company_name: document.getElementById('company_name').value,
  chamber_of_commerce_number: document.getElementById('chamber_of_commerce_number').value,
  vat_number: document.getElementById('vat_number').value,
  peppol_id: document.getElementById('peppol_id').value,
  contact_person: document.getElementById('contact_person').value,
  website: document.getElementById('website').value,
  address: document.getElementById('adress').value,
  postal_code_city: document.getElementById('postal_code_city').value,
  country: document.getElementById('country').value,
  sessiontoken: localStorage.getItem('sessionToken'),
  lastname:  document.getElementById('lastname').value,
  city: document.getElementById('city').value
  };

  createNewCustomer(data, e);
  invoiceForm.reset();
  document.getElementById('invoicePopup').style.display = 'none';
});



const scrollLeftBtn = document.getElementById("scrollLeft");
const scrollRightBtn = document.getElementById("scrollRight");

currentPage.textContent = fetchAmount;
 
scrollRightBtn.addEventListener("click", (e) => {
     if (fetchAmount >= maxPageAmount) return; 

  fetchAmount++;
  currentPage.textContent = fetchAmount;  
   FetchUserData(e)
});

// 
scrollLeftBtn.addEventListener("click", (e) => {
  if (fetchAmount <= maxPageAmount) return

  fetchAmount--;
  currentPage.textContent = fetchAmount;
   FetchUserData(e)
});