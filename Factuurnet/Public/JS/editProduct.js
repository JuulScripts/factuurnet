

async function fetchData() {

   const params = new URLSearchParams(window.location.search);
   const invoiceid = params.get("id");
   
   
   const data = {
        sessiontoken: localStorage.getItem('sessionToken')
      };

try {


let response = await fetch("/data/editproduct?id="+invoiceid, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"  
  },
  body: JSON.stringify(data) 
}) 

let result = await response.json ();

if (!response.ok) {
 console.log("an error occured " + result.message)
 return
} 
console.log("succes")
populateContent(result.data)
} catch (err) {
    console.log("an error has occured: " + err)
}
  }


  function populateContent(data) {
      // Fill text fields
      document.querySelector("input[name='name']").value = data.name || "";
      document.querySelector("textarea[name='invoice_description']").value = data.invoice_description || "";
      document.querySelector("input[name='unit']").value = data.unit || "";
      document.querySelector("input[name='price_excl_vat']").value = data.price_excl_vat || "";
      document.querySelector("input[name='vat_percentage']").value = data.vat_percentage || "";
    let price_per = document.querySelector("#prijsPer").value = data.price_per || "";
      document.querySelector("input[name='cost_type']").value = data.cost_type || "";
       
  }



async function saveProductData() {

   const params = new URLSearchParams(window.location.search);
   const invoiceid = params.get("id");
let name = document.querySelector("input[name='name']").value;
let invoice_description = document.querySelector("textarea[name='invoice_description']").value;
let unit = document.querySelector("input[name='unit']").value;
let price_excl_vat = document.querySelector("input[name='price_excl_vat']").value;
let vat_percentage = document.querySelector("input[name='vat_percentage']").value;
let price_per = document.querySelector("#prijsPer").value;

let cost_type = document.querySelector("input[name='cost_type']").value;
const data = {
  name: name,
  invoice_description: invoice_description,
  unit: unit,
  price_excl_vat: price_excl_vat,
  vat_percentage: vat_percentage,
  price_per: price_per,
  cost_type: cost_type,
  sessiontoken: localStorage.getItem("sessionToken"),
};

try {
const response = await fetch("/data/saveproduct?id="+invoiceid,{  
  method: "POST",
  headers: {
    "Content-Type": "application/json"  
  },
  body: JSON.stringify(data)
 });

 const result = response.json();

 if (!response.ok) {
  console.error("A server error has occured:" + result.message)
  return
 }

console.log("success")

} catch (err) {
    console.log("an error has occured: " + err)
}
}
document.addEventListener("DOMContentLoaded", async (e) => {
  e.preventDefault();
  fetchData()
})


let submit = document.getElementById("submit")

submit.addEventListener("click", async (e) => {
  e.preventDefault();
  saveProductData();
})
