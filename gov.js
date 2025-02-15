document.addEventListener("DOMContentLoaded", async function () {
    try {
        let response = await fetch(`http://127.0.0.1:5000/get-summary`)
        let data = await response.json()
        console.log(data)
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
