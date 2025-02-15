// Fetch and extract functions
function fetchUsersAndThreads() {
    return Promise.all([
        fetch("http://127.0.0.1:5000/users"),
        fetch("http://127.0.0.1:5000/get-threads"),
        fetch("http://127.0.0.1:5000/get-comments")
    ]);
}

function extractJSON(response) {
    return response.json();
};

function populateThread(user, thread, government) {
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
    if (government === true) {
        govBox.appendChild(threadContainer);
    } else {
        citizensBox.appendChild(threadContainer);
    }
    

    threadContainer.appendChild(originatorBlock);
    threadContainer.appendChild(titleBlock);
    threadContainer.appendChild(postContent);

    // Originator info
    let originatorPic = document.createElement("img");
    originatorPic.src = `${user.profile_pic}`;
    let originatorName = document.createElement("div");
    originatorName.innerHTML = `${user.first_name} ${user.last_name}`;
    originatorBlock.appendChild(originatorPic);
    originatorBlock.appendChild(originatorName);

    // Time ago
    let pastDate = `${thread.comments[0].timestamp}`;
    const pastMoment = moment(pastDate);
    let timeAgoText = pastMoment.fromNow();
    let timeAgoBlock = document.createElement("div");
    timeAgoBlock.className = "time-ago-block";
    timeAgoBlock.innerHTML = timeAgoText;
    originatorBlock.appendChild(timeAgoBlock);

    // Post title
    titleBlock.innerHTML = `${thread.topic}`;
    
    // Post content
    let tempQuill = new Quill(document.createElement("div"));
    tempQuill.setContents(thread.comments[0].content);
    if (tempQuill.root.innerHTML.length < 100 ) {
        postContent.innerHTML = tempQuill.root.innerHTML;
    } else {postContent.innerHTML = tempQuill.root.innerHTML.slice(0, 100) + "..."  
    }

    // Border
    let threadDivider = document.createElement("hr");
    threadContainer.insertAdjacentElement("afterend", threadDivider);

}

document.addEventListener("DOMContentLoaded", async function () {
    let response = await fetchUsersAndThreads();
    let users = await extractJSON(response[0])
    let threads = await extractJSON(response[1])
    let comments = await extractJSON(response[2])

    let govPosts = 0;
    let citizenPosts = 0;
    let curr = 0;
    while (govPosts < 5 || citizenPosts < 5 && curr < threads.length) {
        let originalPosterId = threads[curr].comments[0].user_id;
        let user;
        for (u of users) {
            if (u.user_id === originalPoster) {
                user = u;
            }
        }
        if (threads[curr]["government"] === true && govPosts < 5) {
            populateThread(user, threads[curr], true);
            govPosts += 1;
        } else if (threads[curr]["government"] === false && citizenPosts < 5) {
            populateThread(user, threads[curr], false)
            citizenPosts += 1
        }
        curr += 1
    };

    let govCounter = document.querySelector(".post-pages-gov").querySelector("a");
    let citCounter = document.querySelector(".post-pages-citizens").querySelector("a");
    let govCount = 0;
    let citCount = 0;
    for (let thread of threads) {
        if (thread["government"] === true) {
            govCount += 1
        } else {
            citCount += 1
        }
    };
    govCounter.innerHTML = `${govCount} Government Posts`
    citCounter.innerHTML = `${citCount} Total Posts`
});