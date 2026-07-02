const username = document.getElementById("username")
const password = document.getElementById("password")
const submit = document.getElementById("submit")


async function login(e) {
  e.preventDefault();

  const data = {
    username: username.value,
    password: password.value,
    sessiontoken: localStorage.getItem('sessionToken')
  };

  try {
    const response = await fetch("/adminlogin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      const sessionToken = result.sessiontoken;
      console.log("Session Token:", sessionToken);
      localStorage.setItem('sessionToken', sessionToken);
      goToDashboard(e)
    } else {
      createNotification(result.message, "error");
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

async function goToDashboard(e) {
  e.preventDefault();
  
  if (localStorage.getItem('sessionToken') == null) {
     return; // add dom element to show login failed
  }

  const data = {
    sessiontoken: localStorage.getItem('sessionToken')
  };

  try {
    const response = await fetch("/dashboardverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success == false) {
      console.error(result.message)
    } else {
      console.log("succesfull login")
      window.location.href = result.redirectUrl; // navigates to /dashboard

    }

  } catch (error) {
    console.error("Error:", error);
  }
}
submit.addEventListener('click', (e) => { 
        login(e)
});



document.addEventListener("DOMContentLoaded", (e) => {
  login(e)
});