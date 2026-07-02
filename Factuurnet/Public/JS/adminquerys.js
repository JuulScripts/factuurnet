/*
queryInput
encryptToggle
runQueryBtn
queryResults
queryResponse
*/


let queryInput = document.getElementById("queryInput")
let encryptToggle = document.getElementById("encryptToggle")
let runQueryBtn = document.getElementById("runQueryBtn")
let queryResults = document.getElementById("queryResults")
let queryResponse = document.getElementById("queryResponse")


async function runQuery(data, e) {
  e.preventDefault();
  try {
    const response = await fetch('/send', {
      method: 'POST', // POST is better for creating new data
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
      
    if (response.status === 500) {
        queryResponse.textContent = result.message;
    }
     
    if (response.ok) {
//    return res.status(200).json({ success: true, sqlresponse: fields.info, data:rows[0] });
      queryResponse.textContent = result.sqlresponse;  
      populateContent(result.data)    
    } else if (response.status !== 500) {
     queryResponse.textContent = result.sqlresponse;  
    }
  } catch (err) {
    console.error('Fetch error:', err);
       queryResponse.textContent = err;  

  }
}

/*
  let data = req.body
  let sessiontoken = data.sessiontoken
  let query = data.query


*/

function updateCheckboxValue() {
  encryptToggle.value = encryptToggle.checked ? 'on' : 'off';
}

// Update when toggled
encryptToggle.addEventListener('change', updateCheckboxValue);

// Initialize on page load
updateCheckboxValue();

runQueryBtn.addEventListener("click", async (e) =>{
    
let data = {
 sessiontoken: localStorage.getItem("sessionToken"),
 query: queryInput.value,
 toggle: encryptToggle.value,
}  
  
  
    runQuery(data, e);
})

function populateContent(rows) {
  const table = document.getElementById("queryResults");
  const tableBody = table.querySelector("tbody");
  const tableHead = table.querySelector("thead");
  const responseDiv = document.getElementById("queryResponse");

  // Clear existing table
  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  if (!rows || rows.length === 0) {
    responseDiv.textContent = "OK — 0 rows returned.";
    return;
  }

  // Dynamically generate table headers from object keys
  const headerRow = document.createElement("tr");
  const columns = Object.keys(rows[0]);
  columns.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col;
    headerRow.appendChild(th);
  });
  tableHead.appendChild(headerRow);

  // Populate table rows
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    columns.forEach((col) => {
      const td = document.createElement("td");
      td.textContent = row[col] ?? "";
      td.style.wordBreak = "break-all"; // handle long/encrypted text
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });

  
}