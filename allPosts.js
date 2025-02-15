// Fetch and extract functions
function fetchUsersAndThreads() {
    return Promise.all([
        fetch("http://127.0.0.1:5000/users"),
        fetch("http://127.0.0.1:5000/messages")
    ]);
}

function extractJSON(response) {
    return response.json();
};

function populateThread(user, thread) {
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
    threadContainer.appendChild(threadDivider);

}

document.addEventListener("DOMContentLoaded", async function () {
    // Get post_id from url
    let params = new URLSearchParams(window.location.search);
    let govResponse = params.get("response") === "true"; // String to boolean value  

    let response = await fetchUsersAndThreads();
    let users = await extractJSON(response[0])
    let threads = await extractJSON(response[1])

    for (let thread of threads) {
        if (govResponse === thread.government) {
            let user;
            for (u of users) {
                if (thread.comments[0].user_id === u.user_id) {
                    user = u;
                    break;
                }
            }
            populateThread(user, thread);
        }
    } 
    
});