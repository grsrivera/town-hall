document.addEventListener("DOMContentLoaded", async function () {
    let quill = new Quill('#comment-textdiv', {
        theme: 'snow', // "snow" is the Reddit-style toolbar theme
        placeholder: 'Add a comment',
        modules: {
            toolbar: [
                ['bold', 'italic', 'strike'],        // Basic formatting
                ['code-block'],        // Quotes & Code
                [{ 'list': 'ordered'}, { 'list': 'bullet' }], // Lists
                ['link', 'image'],                   // Links & Images
                [{ 'script': 'sub'}, { 'script': 'super' }], // Subscript/Superscript
                [{ 'header': [1, 2, 3, false] }],     // Headings
                ['clean']                             // Remove formatting
            ]
        }
    });

    // So clicking anywhere on the textbox focuses it, not just first line
    document.getElementById("comment-textdiv").addEventListener("click", function() {
        quill.focus();  // ✅ This forces focus when clicking anywhere
    });


    // Submit when click on Comment!
    let commentBtn = document.querySelector(".submit-btn")
    commentBtn.addEventListener("click", async function () {
        let postContent = quill.getContents();
        let postTitle = document.getElementById("post-title").value;
        if (postContent.ops.length === 0 || postTitle.length ===0) return;
    
        try {
            let response = await fetch(`http://127.0.0.1:5000/create-thread`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: 1990,
                    topic: postTitle,
                    content: postContent,
                    timestamp: new Date().toISOString() 
                })
            });
    
            if (!response.ok) throw new Error("Failed to post comment");
            
            let responseData = await response.json();
            window.location.href = `post.html?thread_id=${responseData.thread_id}`;
        } catch (error) {
            console.error("Error posting comment:", error);
        }
    });
    

});
