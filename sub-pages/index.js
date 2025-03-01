// function populateThread(user, thread, government)
function populateThread(thread) {
    // Make all divs first
    let threadContainer = document.createElement("a");
    threadContainer.className = "thread-container";
    threadContainer.href = `post.html?thread_id=${thread.thread_id}`

    let originatorBlock = document.createElement("div");
    originatorBlock.className = "originator-block";
    let titleBlock = document.createElement("div");
    titleBlock.className = "title";
    let postContent = document.createElement("div");
    postContent.className = "post-content";

    let govBox = document.querySelector(".gov-box");
    let citizensBox = document.querySelector(".citizens-box");
    if (thread.government === 1) {
        govBox.appendChild(threadContainer);
        originatorBlock.innerHTML = "✅";
    } else {
        citizensBox.appendChild(threadContainer);
    }
    
    threadContainer.appendChild(originatorBlock);
    threadContainer.appendChild(titleBlock);
    threadContainer.appendChild(postContent);

    // Originator info
    let originatorPic = document.createElement("img");
    originatorPic.src = `profile_pics/${thread.profile_pic}`;
    let originatorName = document.createElement("div");
    originatorName.innerHTML = `${thread.first_name} ${thread.last_name}<span class="dot">&nbsp;•&nbsp;</span>`;
    originatorBlock.appendChild(originatorPic);
    originatorBlock.appendChild(originatorName);

    // Time ago
    let pastDate = `${thread.last_activity}`;
    const pastMoment = moment(pastDate);
    let timeAgoText = pastMoment.fromNow();
    let timeAgoBlock = document.createElement("div");
    timeAgoBlock.className = "time-ago-block";
    timeAgoBlock.innerHTML = `Latest reply ${timeAgoText}`;
    originatorBlock.appendChild(timeAgoBlock);

    // Post title
    titleBlock.innerHTML = `${thread.topic}`;
    
    // Post content
    let tempQuill = new Quill(document.createElement("div"));
    let quillContent = JSON.parse(thread.content)
    tempQuill.setContents(quillContent);

    let textContent = tempQuill.root.innerHTML; // Pulls text from quill
    if (textContent.length < 100 ) {
        postContent.innerHTML = textContent;
    } else {
        postContent.innerHTML = textContent.slice(0, 150) + "..."  
    }

    // Border
    let threadDivider = document.createElement("hr");
    threadContainer.insertAdjacentElement("afterend", threadDivider);

}

document.addEventListener("DOMContentLoaded", async function () {
    let BASE_URL;
    if (window.location.hostname === "127.0.0.1" && window.location.port === "5500") {
        BASE_URL = "http://127.0.0.1:5000";
    } else {
        BASE_URL = "https://town-hall-prototype.onrender.com";
    }

    let response = await fetch(`${BASE_URL}/recent-threads`);
    let threads = await response.json();

    for (let thread of threads) {
        populateThread(thread)
    }
        
    let govCounter = document.querySelector(".post-pages-gov").querySelector("a");
    let citCounter = document.querySelector(".post-pages-citizens").querySelector("a");
    let govCount = 0;
    let citCount = 0;
    response = await fetch("http://localhost:5000/get-threads");
    let data = await response.json();
    allThreads = data.threads;

    for (let thread of allThreads) {
        if (thread.government === 1) {
        govCount += 1;
        } else {
            citCount += 1;
        } 
    }

    govCounter.innerHTML = `${govCount} Government Posts`
    citCounter.innerHTML = `${citCount} Total Posts`
});