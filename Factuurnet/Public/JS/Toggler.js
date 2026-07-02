const toggleSubscription = document.getElementById("isSubscription");

toggleSubscription.addEventListener("change", function() {
  // Find the wrapper
  const wrapper = document.querySelector(".id-wrapper");
  if (!wrapper) return;

  // All fields inside the wrapper
  const fields = wrapper.querySelectorAll(".subscription-field");

  // Toggle display based on checkbox
  fields.forEach(field => {
    field.style.display = this.checked ? "block" : "none";
  });
});