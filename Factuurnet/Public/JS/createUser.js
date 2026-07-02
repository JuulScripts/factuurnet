
const form = document.getElementById('userForm');




async function createUser(e) {
  e.preventDefault();
 const data = {
        username: form.username.value,
        password: form.password.value,
        email: form.email.value,
        sessiontoken: localStorage.getItem('sessionToken')
      };

      
fetch("/createuser", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"  
  },
  body: JSON.stringify(data) 
})
.then(response => {response.json(); 
  if (response.ok) createNotification("succesfully created");

})
.then(result => {
  console.log("Server response:", result);
})
.catch(error => {
  console.error("Error:", error);
 createNotification("notification", "error")
});

}

form.addEventListener('submit', (e) => { 
        createUser(e)
});

document.addEventListener('DOMContentLoaded', async () => await getUsers() )

async function populateContent(data) {
  console.log(data)
  const tbody = document.querySelector(".invoice-table tbody");
  tbody.innerHTML = ""; // clear existing rows

  data.forEach(item => {
    const tr = document.createElement("tr");

tr.innerHTML = `
  <td id="item-id">${item.id}</td>
  <td>${item.username}</td>
  <td>${item.email}</td>
  <td><button class="delete-btn">Verwijder</button></td>
  <td><input id="new-pass-${item.id}" input type="password" style="width:100%;padding:0.5rem;margin-top:0.3rem;margin-bottom:1rem;border:1px solid #ddd;border-radius:5px;"> </input> </td>
  <td> <button id="update-button-${item.id}" class="download-btn update-pass"> Update </button> </td>
`;

tr.querySelector(".delete-btn").addEventListener("click", async () => {
  if (!confirm(`Weet je zeker dat je gebruiker #${item.id} wilt verwijderen?`)) return;

  try {
    const response = await fetch(`/delete?type=id&what=users&misc=${item.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify( {sessiontoken: localStorage.getItem("sessionToken")})
    });

    if (response.ok) {
      tr.remove(); // remove the row from the table
      createNotification(`Gebruiker #${item.id} is verwijderd.`);
    } else {
      createNotification("Verwijderen mislukt.", "error");
    }
  } catch (err) {
    console.error(err);
    createNotification("Er is een fout opgetreden tijdens het verwijderen.", "error");
  }
});


    tbody.appendChild(tr);
  });
}



async function getUsers() {
  
 const data = {
        sessiontoken: localStorage.getItem('sessionToken')
      };
try {



const response= await fetch("/getusers", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"  
  },
  body: JSON.stringify(data) 
})


const result = await response.json()
if (response.ok) {
  console.log(result)
populateContent(result.data)
document.querySelectorAll(".update-pass").forEach((button) => {
  button.addEventListener("click", async () => {
    let id = Number(button.parentElement.parentElement.querySelector("#item-id").textContent);
    await updatePass(id)
  })
})
}
} catch (err) {
  console.log("something went wrong while getting usrs error: " + err, "error")
} 
}


async function updatePass(id) {
  const pass = document.getElementById("new-pass-"+id)
  
  try {
  let response = await fetch("/update-password", {
    method: "POST",
    body: JSON.stringify({sessiontoken: localStorage.getItem("sessionToken"), pass: pass.value, id}),
      headers: {"Content-Type": "application/json"}
  })

  if (response.ok) {
    createNotification("Wachtwoord succesvol geupdate")
  } else {
    createNotification("Er is iets fout gegaan", "error")
  }
   
  } catch (er)
  {
    console.log(er)
    createNotification("er is iets fout gegaan", error)
  }

}