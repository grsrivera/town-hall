document.addEventListener("DOMContentLoaded", async function () {
    try {
        let BASE_URL;
        if (window.location.hostname === "127.0.0.1" && window.location.port === "5500") {
            BASE_URL = "http://127.0.0.1:5000";
        } else {
            BASE_URL = "https://town-hall-prototype.onrender.com";
        }

        let response = await fetch(`${BASE_URL}/get-summary`)
        let data = await response.json()
  
        let summBox = document.querySelector(".summ");
        
        let formattedSummary = data.summary
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") 
            .replace(/\n/g, "<br>")  
            .replace(/\* (.*?)\*/g, "<ul><li>$1</li></ul>");  

        summBox.innerHTML = formattedSummary;


    } catch (error) {
        console.error("Error posting comment:", error);
    }

});
