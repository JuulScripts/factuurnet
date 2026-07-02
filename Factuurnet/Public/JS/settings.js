
 // Simple tab switching
    const tabs = document.querySelectorAll('.sidebar li');
    const contents = document.querySelectorAll('.tab-content');
  function addMakeUserTab() {
    const sidebarList = document.querySelector('.sidebar ul');

    const li = document.createElement('li');
    li.id = 'makeuser';
    li.textContent = 'Make User';

    sidebarList.appendChild(li);
  }
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
      });
    });

   


document.addEventListener("DOMContentLoaded", async (e) => {
  e.preventDefault()
  await FetchUserData()

})


document.getElementById("log-out").addEventListener("click", async () => {


 if (await createConfirmNotification("weet je zeker dat je uit wilt loggen?")){
try {
  console.log( localStorage.getItem("sessionToken"))
const response = await fetch("/log-out", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"  
  },
  body: JSON.stringify({sessiontoken: localStorage.getItem("sessionToken")}) 
})


let result = await response.json()


if (response.ok) {
  console.log('scuces')
  createNotification("succesvol uitgelogd")
  await FetchUserData()
}
} catch (er) { 
 console.log(er) // alert
  createNotification("er is iets fout gegaan tijdens het uitloggen", "error")

}}
})


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


document.getElementById("update-date").addEventListener("click", async () => {
try

  { let response = await fetch("/data/update-due-date", 
    {
        method: "POST",
        headers: {
          "Content-Type": "application/json"  
        },
        body: JSON.stringify({sessiontoken: localStorage.getItem("sessionToken"), newDue: document.getElementById('due-value').value}) 
    })
    if (response.ok) {
      createNotification("Niewe due date ingesteld")
    } else {
       createNotification("er is iets fout gegaan.", "error")
    }} catch (err) {
      console.log(err)
       createNotification("er is iets fout gegaan.", "error")
    }
})