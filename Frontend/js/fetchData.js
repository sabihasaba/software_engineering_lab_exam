const showLoggedUsername = () => {
    const userNameElement = document.getElementById('logged-username');
    let user = localStorage.getItem('loggedInUser');
    if(user) {
        user = JSON.parse(user);
    }
    userNameElement.innerText = user.userName;
}

const checkLOggedInUser = () => {
    let user = localStorage.getItem('loggedInUser');
    if(user) {
        user = JSON.parse(user);
    }
    else{
        window.location.href = '/index.html';
    }
};


const logOut = () => {
    localStorage.clear();
    checkLOggedInUser();
}


const fetchAllPosts = async () => {
    let data;
    
    try{
        const res = await fetch('http://localhost:5000/getAllPosts')
        data= await res.json();
        console.log(data);
        showAllPosts(data);

    }
    catch(err) {
        console.log("Error fetching data from the server");
    }
};

const showAllPosts = (allPosts) => {
    const postContainer = document.getElementById('post-container');
    postContainer.innerHTML = "";

    allPosts.forEach( async post => {
        const postDiv = document.createElement('div');
        postDiv.classList.add('post');

        postDiv.innerHTML = `
    <div class="post-header">
        <div class="post-user-image">
            <img src="${post.postedUserImage}" alt="Post User Image">
        </div>

        <div class="post-username-time">
            <p class="post-username">${post.postedUserName}</p>
            <div class="posted-time">
                <span>${timeDifference(post.postedTime)}</span>
            </div>
        </div>

        ${post.postedUserId == JSON.parse(localStorage.getItem("loggedInUser")).userId 
            ? `<div class="post-actions">
                   <button onclick="editPost(${post.postId})" class="edit-post-btn">Edit</button>
                   <button onclick="deletePost(${post.postId})" class="delete-post-btn">Delete</button>
               </div>` 
            : "" }
    </div>

    <div class="post-text">
        <p id="post-text-${post.postId}">${post.postText}</p>
    </div>

    <div class="post-image">
        <img src="${post.postImageUrl}" alt="post-image">
    </div>
`;

            postContainer.appendChild(postDiv);

            // comments under a post
            let postComments = await fetchAllCommentsOfAPost(post.postId);
            console.log("postComments : ", postComments);

            postComments.forEach((comment) => {
                const commentsHolderDiv = document.createElement('div');
                commentsHolderDiv.classList.add('comments-holder');

                commentsHolderDiv.innerHTML = `
                 <div class="comment">
                    <div class="comment-user-image">
                        <img src="${comment.commentedUserImage}" alt="comment-user-image">
                    </div>
                    <div class="comment-text-container">
                        <h4>${comment.commentedUserName}</h4>
                        <p class="comment-text">
                            ${comment.commentText}
                    </div>
                </div>
                `;

                postDiv.appendChild(commentsHolderDiv);
            });

            // adding a new comment to the post

            const addNewCommentDiv = document.createElement('div');
            addNewCommentDiv.classList.add('postComment-holder');
            addNewCommentDiv.innerHTML = `
            <div class="post-comment-input-field-holder">
                        <input type="text" name="" id="postComment-input-for-${post.postId}" class="postComment-input-field" placeholder="Post your Comment">

                    </div>
                    <div class="comment-btn-holder">
                        <button onClick=handlePostComment(${post.postId}) id="comment-btn" class="postComment-btn">Comment</button>
                    </div>
            `;

            postDiv.appendChild(addNewCommentDiv);

    });
}

const handlePostComment = async(postId) => {

    // get logged user
    let user = localStorage.getItem('loggedInUser');
    if(user){
        user = JSON.parse(user);
    }
    const commentedUserId = user.userId;

    // collect comment text
    const commentTextElement = document.getElementById(`postComment-input-for-${postId}`);
    const commentText = commentTextElement.value;

    // timezone corrected timestamp
    let now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    let timeOfComment = now.toISOString();

    const commentObject = {
        commentedPostId : postId,
        commentedUserId : commentedUserId,
        commentText : commentText,
        commentTime : timeOfComment,
    };

    try{
        const res = await fetch('http://localhost:5000/postComment', {
            method: 'POST',
            headers: {
                "content-type" : "application/json", 
            },
            body: JSON.stringify(commentObject),
        });

        const data = await res.json();
        console.log("Response from server:", data);

        // OPTIONAL → reload comments after posting
        fetchAllPosts();

    } catch(err) {
        console.log("Error sending to server", err);
    }
    finally{
        location.reload();
    }
};



const fetchAllCommentsOfAPost = async(postId) => {
    let commentsOfPost = [];

    try {
        const res = await fetch(`http://localhost:5000/getAllComments/${postId}`);
        commentsOfPost = await res.json();
    }
    catch(err) {
        console.log("Error fetching comments from the server ", err);
    }
    finally {
        return commentsOfPost;
    }

};


const handleAddNewPost = async() => {
   let user = localStorage.getItem('loggedInUser');
    if(user) {
        user = JSON.parse(user);
    }
    const postedUserId = user.userId;
    // timezone corrected timestamp
    let now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    let timeOfPost = now.toISOString();

    const postTextElement = document.getElementById('newPost-text');
    const postText = postTextElement.value;

    
    const postImageElement = document.getElementById('newPost-image');
    const postImageUrl = postImageElement.value;
    
    const postObject = {
        postedUserId : postedUserId,
        postedTime : timeOfPost,
        postText : postText,
        postImageUrl : postImageUrl,
    };
        try{
        const res = await fetch('http://localhost:5000/addNewPost', {
            method: 'POST',
            headers: {
                "content-type" : "application/json", 
            },
            body: JSON.stringify(postObject),
        });

        const data = await res.json();
        console.log("Response from server:", data);

        // OPTIONAL → reload comments after posting
        fetchAllPosts();

    } catch(err) {
        console.log("Error sending to server", err);
    }
    finally{
        location.reload();
    }
}

// Edit Post
const editPost = (postId) => {

    const textElement = document.getElementById(`post-text-${postId}`);
    const oldText = textElement.innerText;

    const newText = prompt("Edit your post:", oldText);

    if (!newText || newText.trim() === "") return;

    fetch(`http://localhost:5000/editPost/${postId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ newText })
    })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            fetchAllPosts();
        });
};


// Delete Post
const deletePost = (postId) => {
    const userId = JSON.parse(localStorage.getItem("loggedInUser")).userId;

    if (!confirm("Delete this post?")) return;

    fetch(`http://localhost:5000/deletePost/${postId}/${userId}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);
        fetchAllPosts();
    });
};





fetchAllPosts();
showLoggedUsername();