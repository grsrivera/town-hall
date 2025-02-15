// Fetch and extract functions
function fetchUsersAndThreads() {
    return Promise.all([
        fetch("http://127.0.0.1:5000/users"),
        fetch("http://127.0.0.1:5000/get-messages")
    ]);
}

function extractJSON(response) {
    return response.json();
};

// Populate thread
function populateThread(users, thread) {
    // Original poster pic
    let originatorUserID = thread.comments[0].user_id
    let user = users.find(u => u.user_id === originatorUserID);
    let originatorInfo = document.querySelector(".originator-info")
    let originatorPic = originatorInfo.querySelector("img"); 
    originatorPic.src = `${user.profile_pic}`

    // OP name
    originatorName = originatorInfo.querySelector(".username").querySelector("a")
    originatorName.innerHTML = `${user.first_name} ${user.last_name}`

    // Original title and content
    let postTitle = document.getElementById("post-title");
    postTitle.innerHTML = `${thread.topic}`

    let postContent = document.querySelector(".post-content");
    let tempQuill = new Quill(postContent);
    tempQuill.setContents(thread.comments[0].content);
    postContent.innerHTML = tempQuill.root.innerHTML;

    // Time ago
    let pastDate = `${thread.comments[0].timestamp}`;
    const pastMoment = moment(pastDate);
    let timeAgoText = pastMoment.fromNow();
    let timeAgoBlock = document.createElement("div");
    timeAgoBlock.className = "time-ago-block";
    timeAgoBlock.innerHTML = timeAgoText;
    originatorInfo.appendChild(timeAgoBlock);
}


document.addEventListener("DOMContentLoaded", async function () {
    // Get thread_id from url
    let params = new URLSearchParams(window.location.search);
    let threadId = Number(params.get("thread_id"));  
    let thread = null;
    let users

    try {
        let response = await fetchUsersAndThreads();
        users = await extractJSON(response[0])
        let threads = await extractJSON(response[1])

        for (let t of threads) {
            if (t.thread_id === threadId) {
                thread = t;
                break; 
            }
        }

        populateThread(users, thread);
    } catch (error) {
        console.error("Error fetching", error);
    }

    let commentBox = document.getElementById("comment-textdiv");
    let actionBtnsContainer = document.getElementById("comment-actions-container");
    let cancelBtn = actionBtnsContainer.querySelector(".cancel-btn");
    let commentBtn = actionBtnsContainer.querySelector(".submit-btn");

    let quill = new Quill('#comment-textdiv', {
        theme: 'snow', // "snow" is the Reddit-style toolbar theme
        placeholder: 'Add a comment',
        modules: {
            toolbar: [
                ['bold', 'italic', 'strike'],        // Basic formatting
                ['blockquote', 'code-block'],        // Quotes & Code
                [{ 'list': 'ordered'}, { 'list': 'bullet' }], // Lists
                ['link', 'image'],                   // Links & Images
                [{ 'script': 'sub'}, { 'script': 'super' }], // Subscript/Superscript
                [{ 'header': [1, 2, 3, false] }],     // Headings
                ['clean']                             // Remove formatting
            ]
        }
    });

    // Expand when click on comment box
    commentBox.addEventListener("click", function () {
        commentBox.classList.add("expanded");
        actionBtnsContainer.classList.remove("hidden");
    });

    // Collapse when click on cancel
    cancelBtn.addEventListener("click", function () {
        commentBox.classList.remove("expanded");
        actionBtnsContainer.classList.add("hidden");
        quill.setContents([]); // Clear text when collapsing
    });

    // Populate replies
    function createReplyBox(comment, users) {
        // Find user
        let ReplierUserId
        if (users.length > 1) {
            ReplierUserId = comment.user_id;
        } else {ReplierUserId = 1990 // For testing purposes
        }; 

        let user;
        for (let u of users) {
            if (u.user_id === ReplierUserId) {
                user = u;
            }
        }
        // User Info
        let replyBox = document.createElement("div");
        replyBox.classList.add("reply");

        let replierInfo = document.createElement("div");
        replierInfo.classList.add("replier-info");
        let replierPic = document.createElement("img");
        replierPic.src = `${user.profile_pic}`;
        let replierNameBox = document.createElement("div");
        replierNameBox.classList.add("username");
        let replierNameLink = document.createElement("a");
        replierNameLink.href = "#";
        replierNameLink.innerHTML= `${user.first_name} ${user.last_name}`

        let commentContainer = document.querySelector(".comment-container");
        commentContainer.insertAdjacentElement("beforebegin", replyBox);

        replyBox.appendChild(replierInfo);
        replierInfo.appendChild(replierPic)
        replierInfo.appendChild(replierNameBox)
        replierNameBox.appendChild(replierNameLink)

        // Replier Post
        let replierComment = document.createElement("div");
        replierComment.classList.add("post-content");
        // Convert Quill Delta to HTML
        let tempQuill = new Quill(document.createElement("div"));
        tempQuill.setContents(comment.content);
        replierComment.innerHTML = tempQuill.root.innerHTML;
        replyBox.appendChild(replierComment);

        // Reply Button
        let replyButton = document.createElement("button");
        replyButton.classList.add("reply-action-container");
        let bubbleIcon = document.createElement("i");
        bubbleIcon.className = "fa-regular fa-comment";
        let replyText = document.createElement("span");
        replyText.innerHTML = " Reply";
        replyButton.appendChild(bubbleIcon);
        replyButton.appendChild(replyText);
        replyBox.appendChild(replyButton);
        // Scroll to put comment box into view
        replyButton.addEventListener("click", function () {
            commentContainer.scrollIntoView({behavior:"smooth"});
            // Expand comment box
            commentBox.classList.add("expanded");
            actionBtnsContainer.classList.remove("hidden");
            
            // Convert Quill Delta to plain text
            let tempQuill = new Quill(document.createElement("div"));
            tempQuill.setContents(comment.content); 
            let formattedHTML = tempQuill.getText();

            // Insert formatted HTML into the editor
            let currentQuillContents = quill.getContents();
            let newQuote = [
                { insert: `@${user.first_name} ${user.last_name}\n`, attributes: { blockquote: true } },
                { insert: formattedHTML + "\n", attributes: { blockquote: true } },
                { insert: "\n\n" }
            ];
          
            quill.setContents([...currentQuillContents.ops, ...newQuote]);
        })
    }

    for (let i=1; i < thread.comments.length; i++) {
        createReplyBox(thread.comments[i], users)
    }

    // Submit when click on Comment!
    commentBtn.addEventListener("click", async function () {
        let myCommentContent = quill.getContents();
        if (myCommentContent.ops.length === 0) return;
    
        try {
            let response = await fetch(`http://127.0.0.1:5000/post-comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    thread_id: threadId,
                    user_id: 1990,
                    content: myCommentContent,
                    timestamp: new Date().toISOString() 
                })
            });
    
            if (!response.ok) throw new Error("Failed to post comment");
    
            quill.setContents([]);
    
            createReplyBox(myCommentContent, [{"user_id": 1990,"first_name": "G","last_name": "Rivera", "profile_pic": "img/user.jpg"}]); 
        } catch (error) {
            console.error("Error posting comment:", error);
        }
    });
    

});
