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
}

document.addEventListener("DOMContentLoaded", async function () {
    // Get "government" reply info from url
    let params = new URLSearchParams(window.location.search);
 
    let govResponse = parseInt(params.get("response"));

    let response = await fetch(`http://127.0.0.1:5000/get-threads?response=${govResponse}`);
    let threads = await response.json();

    let tableTitle = document.querySelector(".table-title");
    if (govResponse === true) {
        tableTitle.innerHTML = "Government Responses";
    } else {
        tableTitle.innerHTML = "From Alaskans";
    }

    for (let thread of threads) {
        populateThread(thread);
    } 

    let total = document.querySelector(".total");
    total.innerHTML = `${threads.length} Total Posts`
    
});