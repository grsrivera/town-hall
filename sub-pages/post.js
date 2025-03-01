// Populate thread
function populateOriginalPost(post) {
    // Pic
    let originatorInfo = document.querySelector(".originator-info")
    let originatorPic = originatorInfo.querySelector("img"); 
    originatorPic.src = `profile_pics/${post.profile_pic}`

    // Name
    originatorName = originatorInfo.querySelector(".username").querySelector("a")
    originatorName.innerHTML = `${post.first_name} ${post.last_name}<span class="dot">&nbsp;•&nbsp;</span>`

    // Title and content
    console.log(post)
    let postTitle = document.getElementById("post-title");
    if (post.government === 1) {
        postTitle.innerHTML = `✅ ${post.topic}`
    } else {
        postTitle.innerHTML = `${post.topic}`
    }

    let postContent = document.querySelector(".post-content");
    let tempQuill = new Quill(postContent);
    let quillContent = JSON.parse(post.content)
    tempQuill.setContents(quillContent);

    // Time ago
    let pastDate = `${post.timestamp}`;
    const pastMoment = moment(pastDate);
    let timeAgoText = pastMoment.fromNow();
    let timeAgoBlock = document.createElement("div");
    timeAgoBlock.className = "time-ago-block";
    timeAgoBlock.innerHTML = timeAgoText;
    originatorInfo.appendChild(timeAgoBlock);
}

function createReplyBox(reply) {
    // User Info
    let replyBox = document.createElement("div");
    replyBox.classList.add("reply");

    // Allows styling for gov response later
    if (reply.user_id === 1) {
        replyBox.classList.add("government");
    }

    let replierInfo = document.createElement("div");
    replierInfo.classList.add("replier-info");
    let replierPic = document.createElement("img");
    replierPic.src = `profile_pics/${reply.profile_pic}`;
    let replierNameBox = document.createElement("div");
    replierNameBox.classList.add("username");
    let replierNameLink = document.createElement("a");
    replierNameLink.href = "#";
    replierNameLink.innerHTML= `${reply.first_name} ${reply.last_name}<span class="dot">&nbsp;•&nbsp;</span>`

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
    let quillContent = JSON.parse(reply.content)
    tempQuill.setContents(quillContent);
    replierComment.innerHTML = tempQuill.root.innerHTML;
    replyBox.appendChild(replierComment);

    // Time ago
    let pastDate = `${reply.timestamp}`;
    const pastMoment = moment(pastDate);
    let timeAgoText = pastMoment.fromNow();
    let timeAgoBlock = document.createElement("div");
    timeAgoBlock.className = "time-ago-block";
    timeAgoBlock.innerHTML = timeAgoText;
    replierInfo.appendChild(timeAgoBlock);

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
        let commentBox = document.getElementById("comment-textdiv");
        let actionBtnsContainer = document.getElementById("comment-actions-container");
     
        commentBox.classList.add("expanded");
        actionBtnsContainer.classList.remove("hidden");
        
        // Convert Quill Delta to a Quill editor instance
        let tempQuill = new Quill(document.createElement("div"));
        tempQuill.setContents(JSON.parse(reply.content));

        let currentQuillContents = quill.getContents();
        let newQuote = [
            { insert: `@${reply.first_name} ${reply.last_name}\n`, attributes: { blockquote: true } },
            ...tempQuill.getContents().ops.map(op => ({
                insert: op.insert,
                attributes: { blockquote: true }
            })),
            { insert: "\n" }
        ];
      
        quill.updateContents({
            ops: [...currentQuillContents.ops, ...newQuote]
        });
        quill.setSelection(quill.getLength(), 0);
    })
}

let quill;

document.addEventListener("DOMContentLoaded", async function () {
    // Get thread_id from url
    let params = new URLSearchParams(window.location.search);
    let threadId = Number(params.get("thread_id"));  

    let BASE_URL;
    if (window.location.hostname === "127.0.0.1" && window.location.port === "5500") {
        BASE_URL = "http://127.0.0.1:5000";
    } else {
        BASE_URL = "https://town-hall-prototype.onrender.com";
    }
    let response = await fetch(`${BASE_URL}/get-posts?thread_id=${threadId}`);
    let data = await response.json();

    populateOriginalPost(data[0]);

    quill = new Quill('#comment-textdiv', {
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

    let commentBox = document.getElementById("comment-textdiv");
    let actionBtnsContainer = document.getElementById("comment-actions-container");
    let cancelBtn = actionBtnsContainer.querySelector(".cancel-btn");
    let commentBtn = actionBtnsContainer.querySelector(".submit-btn");

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
    for (let i=1; i < data.length; i++) {
        createReplyBox(data[i])
    }

    // Submit when click on Comment!
    commentBtn.addEventListener("click", async function () {
        let myCommentContent = quill.getContents();

        let checkBlankOps = myCommentContent.ops.filter(op => op.insert.trim() !== "");

        if (checkBlankOps.length === 0) {
            alert("Enter comment");
            return;
        }
    
        myCommentContent = JSON.stringify(quill.getContents()); // Needs to be json to go to backend

        try {
            let response = await fetch(`${BASE_URL}/post-reply`, {
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
    
            createReplyBox({"content": myCommentContent, "user_id": 1990,"first_name": "G","last_name": "Rivera", "profile_pic": "gerald.jpg"}); 
        } catch (error) {
            console.error("Error posting comment:", error);
        }
    });
});
