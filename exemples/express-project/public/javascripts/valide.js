let form = document.querySelector("#form");
let error = document.querySelector(".error")

form.addEventListener("submit", (e) => {
  let number = form.querySelector("#form_code").value
  e.preventDefault();
  axios.post("/sql/teacher/validate/", {number: number}).then((response) => {
    if(response.data) {
      window.location.replace("/calendar");
    }
    else
    {
      error.innerText = "Erreur le code est probablement erroné, retentez le code ou tentez de vous reconnecter";
    }
  })
})