

async function submitInvoiceData() {
    // Get form values
    const naam = document.getElementById('naam').value;
    const omschrijving = document.getElementById('omschrijving').value;
    const eenheid = document.getElementById('eenheid').value;
    const prijs = parseFloat(document.getElementById('prijs').value);
    const btw = parseInt(document.getElementById('btw').value);
    const prijsPer = document.getElementById('prijsPer').value;
    const kostprijs = parseFloat(document.getElementById('kostprijs').value);

    // Prepare JSON payload
    const data = {
        Name: naam,
        description: omschrijving,
        type: eenheid,
        price: prijs,
        vat: btw,
        pricePer: prijsPer,
        costPrice: kostprijs,
        sessiontoken: localStorage.getItem("sessionToken"),

    };

    try {
        const response = await fetch('/createproduct', {
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
        getProducts();
        createNotification("Product succesvol aangemaakt")
    } catch (error) {
        createNotification('Er is iets fout gegaan', "error");

    }
}


    const modal = document.getElementById("invoiceModal");
    const openBtn = document.getElementById("openInvoiceModalBtn");
    const closeBtn = document.getElementById("closeInvoiceModalBtn");
    
    openBtn.onclick = () => modal.style.display = "flex";
    closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

const save = document.getElementById("save") 


save.addEventListener("click", (e) => {
    e.preventDefault();

    submitInvoiceData();
})

function populateContent(data) {
    const tableBody = document.getElementById('productTableBody');
    tableBody.innerHTML = ''; // Clear existing content

    data.forEach((product, index) => {
        const row = document.createElement('tr');

        // ID
        const idCell = document.createElement('td');
        idCell.textContent = index + 1;
        row.appendChild(idCell);

        // Name
        const nameCell = document.createElement('td');
        nameCell.textContent = product.name;
        row.appendChild(nameCell);

        // Price
        const priceCell = document.createElement('td');
        priceCell.textContent = `€${product.price.toFixed(2)}`;
        row.appendChild(priceCell);
        // Actions (optional)
        const actionsCell = document.createElement('td');
        actionsCell.innerHTML = `<button onclick="editProduct(${index})">Edit</button> <button onclick="deleteProduct(${index})">Delete</button>`;
        row.appendChild(actionsCell);

        tableBody.appendChild(row);
    });
}

function populateContent(data) {
    const tableBody = document.getElementById('productTableBody');
    tableBody.innerHTML = ''; // Clear existing content

    // Loop over each item in data
    data.forEach(item => {
        const row = document.createElement('tr');

        // ID
        const idCell = document.createElement('td');
        idCell.textContent = item.id;
        row.appendChild(idCell);

        // Name
        const nameCell = document.createElement('td');
        nameCell.textContent = item.name;
        row.appendChild(nameCell);

        // Price
        const priceCell = document.createElement('td');
        priceCell.textContent = `€${item.price_excl_vat.toFixed(2)}`;
        row.appendChild(priceCell);

        // Actions (example: edit/delete buttons)
        const actionsCell = document.createElement('td');
        actionsCell.innerHTML = `
            <button class="blue" onclick="editProduct(${item.id})">Bewerk</button>
            <button onclick="deleteProduct(${item.id})">Verwijder</button>
        `;
        row.appendChild(actionsCell);

        tableBody.appendChild(row);
    });
}


function editProduct(id) {
      window.location.href = "/editproduct?id=" + id
}

async function getProducts() {
    

     const data = {
        sessiontoken: localStorage.getItem("sessionToken")
    };

    try {
        const response = await fetch('/fetchproducts', {
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
        populateContent(result.data)
        console.log('data loaded succesfully ', result);

    } catch (error) {
        console.error('Error fetching data:', error);
    }

}




document.addEventListener("DOMContentLoaded", async (e) => {
    await  getProducts();
    await FetchUserData(e)
})



async function deleteProduct(id) {
try {
if (!await createConfirmNotification("weet u zeker dat u het product wilt verwijderen")) return;
const response = await fetch(`/delete?type=id&what=products&misc=${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({sessiontoken: localStorage.getItem("sessionToken")})
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        getProducts()
        createNotification('Succesvol verwijderd');

    } catch (error) {
        createNotification('Er is iets fout gegaan tiujdenss het verwijderen', "error");
    }
}


async function FetchUserData(e) {
    e.preventDefault();



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
