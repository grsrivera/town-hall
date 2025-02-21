function populateThread(thread) {
    // Make all divs first
    let mainBody = document.querySelector(".town-Hall-Section");

    let threadContainer = document.createElement("a");
    threadContainer.className = "thread-container";
    threadContainer.href = `post.html?thread_id=${thread.thread_id}`

    let originatorBlock = document.createElement("div");
    originatorBlock.className = "originator-block";
    let titleBlock = document.createElement("div");
    titleBlock.className = "title";
    let postContent = document.createElement("div");
    postContent.className = "post-content";

    mainBody.appendChild(threadContainer);
    threadContainer.appendChild(originatorBlock);
    threadContainer.appendChild(titleBlock);
    threadContainer.appendChild(postContent);

    // Originator info
    let originatorPic = document.createElement("img");
    originatorPic.src = `profile_pics/${thread.profile_pic}`;
    let originatorName = document.createElement("div");
    originatorName.innerHTML = `${thread.first_name} ${thread.last_name}`;
    originatorBlock.appendChild(originatorPic);
    originatorBlock.appendChild(originatorName);

    // Time ago
    let pastDate = `${thread.last_activity}`;
    const pastMoment = moment(pastDate);
    let timeAgoText = pastMoment.fromNow();
    let timeAgoBlock = document.createElement("div");
    timeAgoBlock.className = "time-ago-block";
    timeAgoBlock.innerHTML = `Last comment ${timeAgoText}`;
    originatorBlock.appendChild(timeAgoBlock);

    // Post title
    titleBlock.innerHTML = `${thread.topic}`;
    
    // Post content
    let tempQuill = new Quill(document.createElement("div"));
    let quillContent = JSON.parse(thread.content)
    tempQuill.setContents(quillContent);
    if (tempQuill.root.innerHTML.length < 100 ) {
        postContent.innerHTML = tempQuill.root.innerHTML;
    } else {postContent.innerHTML = tempQuill.root.innerHTML.slice(0, 100) + "..."  
    }

    let textContent = tempQuill.root.innerHTML; // Pulls text from quill
    if (textContent.length < 100 ) {
        postContent.innerHTML = textContent;
    } else {
        postContent.innerHTML = textContent.slice(0, 100) + "..."  
    }

    // Border
    let threadDivider = document.createElement("hr");
    threadContainer.insertAdjacentElement("afterend", threadDivider);

    return {threadContainer, threadDivider};
}

document.addEventListener("DOMContentLoaded", async function () {
    // Get "government" reply info from url
    let params = new URLSearchParams(window.location.search);
    
    let govResponse = parseInt(params.get("response"));

    let response = await fetch(`http://127.0.0.1:5000/get-threads?response=${govResponse}`);
    let data = await response.json();
    threads = data.threads;
    total_count = data.total_count;

    let tableTitle = document.querySelector(".table-title");
    if (govResponse === true) {
        tableTitle.innerHTML = "Government Responses";
    } else {
        tableTitle.innerHTML = "From Alaskans";
    }

    let lastThreadId = null;
    for (let thread of threads) {
        let elements = populateThread(thread);
        elements.threadContainer.classList.add("show");
        elements.threadDivider.classList.add("show");
        lastThreadId = thread.thread_id
    } 

    // Observer for infinite scroll
    const observer = new IntersectionObserver(async (entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                try {
                    const response = await fetch(`http://127.0.0.1:5000/get-threads?response=${govResponse}&lastThreadId=${lastThreadId}`);
                    const data = await response.json();
                    let threads = data.threads;

                    for (let thread of threads) {
                        let elements = populateThread(thread);
                        elements.threadContainer.classList.add("show");
                        elements.threadDivider.classList.add("show");
                        lastThreadId = thread.thread_id;
                    }

                    const threadBoxes = document.querySelectorAll(".thread-container");
                    const lastThreadBox = threadBoxes[threadBoxes.length - 1];
                    
                    if (lastThreadBox) {
                        observer.observe(lastThreadBox);
                    } 
                } catch (error) {
                    console.error("Error fetching threads:", error);
                }
            }
        }
    }, {threshold: 1, rootMargin: "0px 0px -200px 0px"});


    // Start of the Search Feature
    async function runSearch () {
        const searchQuery = document.querySelector(".form input").value.trim();
    
        if (searchQuery === "") {
            return;
        } 

        let response = await fetch(`http://127.0.0.1:5000/search?query=${encodeURIComponent(searchQuery)}`);
        let data = await response.json();
        let threads = data.threads;
        let total_count = data.total_count;

        let threadContainersAndHRs = document.querySelectorAll(".thread-container, hr");
        threadContainersAndHRs.forEach(threadContainerAndHR => {threadContainerAndHR.remove()});
        
        let lastThreadID = null;
        let threadContainers = [];

        for (let thread of threads) {
            let elements = populateThread(thread);
            elements.threadContainer.classList.add("show");
            elements.threadDivider.classList.add("show");
            lastThreadId = thread.thread_id

            threadContainers.push(elements.threadContainer);
        } 

        if (threadContainers.length > 0) {
            observer.observe(threadContainers[threadContainers.length - 1]);
        }

        // Total post count
        let total = document.querySelector(".total");
        total.innerHTML = `${total_count} Total Posts`;

        // Hide the "From Alaskans" or "From the Governor"
        tableTitle.classList.add("hide")
    };

    let searchButton = document.querySelector(".form button");
    searchButton.addEventListener("click", runSearch);

    let searchBox = document.querySelector(".form input");
    searchBox.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent form submission if inside a form
            runSearch();
        }
    });
    
    searchBox.addEventListener("input", function resetSearch() {
        const searchQuery = searchBox.value;

        if (searchQuery === "") {
            let threadContainersAndHRs = document.querySelectorAll(".thread-container, hr");
            threadContainersAndHRs.forEach(threadContainerAndHR => {threadContainerAndHR.remove()});

            let threadContainers = [];
            for (let thread of threads) {
                let elements = populateThread(thread);
                elements.threadContainer.classList.add("show");
                elements.threadDivider.classList.add("show");
                lastThreadId = thread.thread_id
                
                threadContainers.push(elements.threadContainer);
                observer.observe(threadContainers[threadContainers.length - 1]);
            }

            tableTitle.classList.remove("hide")
            total.innerHTML = `${total_count} Total Posts`;
        }
    })


// End of Search Feature



    const threadBoxes = document.querySelectorAll(".thread-container")
    const lastThreadBox = threadBoxes[threadBoxes.length - 1]
    observer.observe(lastThreadBox)

    let total = document.querySelector(".total");
    total.innerHTML = `${total_count} Total Posts`;


});