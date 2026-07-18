const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const port = 5000;

const app=express();

app.use(cors());
app.use(express.json());


var db = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'postbook'
});

db.connect( (err) => {
if(err){
    console.log("Something went wrong with the database");
    throw err;
}
else console.log("Server Connected");
});



// getting user data from server

app.post('/getUserInfo', (req, res) =>{
console.log(req.body);

const {userId, password} = req.body;

const getUserInfosql = `SELECT userId, userName,userImage FROM users WHERE users.userId= ? AND users.userPassword =?`;
let query = db.query(getUserInfosql, [userId, password], (err, result) => {

    if(err) {
      console.log("Error getting user info from the server : ", err);
      throw err;
    }
    else {
      res.send(result);
    }
});

});


app.get('/getAllPosts', (req, res) => {
  const sqlForAllPosts = `
  SELECT 
    users.userName AS postedUserName,
    users.userImage AS postedUserImage,
    posts.postedUserId,
    posts.postedTime,
    posts.postText,
    posts.postImageUrl,
    posts.postId
  FROM posts
  JOIN users ON posts.postedUserId = users.userId
  ORDER BY posts.postId DESC
`;

  let query = db.query(sqlForAllPosts, (err, result) => {
    if(err){
      console.log("Error loading all posts from database ", err);
      throw err;
    }
    else {
      console.log(result);
      res.send(result);
    }
  })

});


// getting comments from the post

app.get('/getAllComments/:postId', (req, res) => {
  const id = req.params.postId;

  const sqlForAllComments = `
    SELECT 
      users.userName AS commentedUserName, 
      users.userImage AS commentedUserImage, 
      comments.commentId,
      comments.commentOfPostId,
      comments.commentText, 
      comments.commentTime 
    FROM comments 
    JOIN users ON comments.commentedUserId = users.userId 
    WHERE commentOfPostId = ? 
    ORDER BY comments.commentTime DESC
  `;

  db.query(sqlForAllComments, [id], (err, result) => {
    if (err) {
      console.log("Error fetching comments ", err);
      return res.status(500).send([]);
    }
    res.send(result);
  });
});



// Adding new comment
app.post('/postComment', (req, res) => {

    const { commentedPostId, commentedUserId, commentText, commentTime } = req.body;

    if (!commentedPostId || !commentedUserId || !commentText || !commentTime) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const sqlForAddingNewComments = `
        INSERT INTO comments (commentOfPostId, commentedUserId, commentText, commentTime)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sqlForAddingNewComments,
        [commentedPostId, commentedUserId, commentText, commentTime],
        (err, result) => {
            if (err) {
                console.log("Error adding comment:", err);
                return res.status(500).json({ success: false, error: err });
            }

            res.json({
                success: true,
                message: "Comment added successfully",
                commentId: result.insertId
            });
        }
    );
});



// ADD NEW POST
app.post('/addNewPost', (req, res) => {
    const { postedUserId, postedTime, postText, postImageUrl } = req.body;

    if (!postedUserId || !postedTime || !postText) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const sql = `
        INSERT INTO posts (postedUserId, postedTime, postText, postImageUrl)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [postedUserId, postedTime, postText, postImageUrl], (err, result) => {
        if (err) {
            console.log("Error adding post:", err);
            return res.status(500).json({ success: false, error: err });
        }

        res.json({
            success: true,
            message: "Post added successfully",
            postId: result.insertId
        });
    });
});

// Edit Post
app.put('/editPost/:id', (req, res) => {
    const postId = req.params.id;
    const { newText } = req.body;

    const sql = "UPDATE posts SET postText = ? WHERE postId = ?";

    db.query(sql, [newText, postId], (err, result) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, message: "Post updated" });
    });
});


//Delete Post
app.delete('/deletePost/:id/:userId', (req, res) => {
    const postId = req.params.id;
    const userId = req.params.userId;

    const checkSql = "SELECT postedUserId FROM posts WHERE postId = ?";

    db.query(checkSql, [postId], (err, result) => {
        if (err) return res.status(500).json({ success: false });

        if (result.length === 0)
            return res.status(404).json({ success: false, message: "Post not found" });

        if (result[0].postedUserId != userId)
            return res.status(403).json({ success: false, message: "Not allowed" });

        const deleteSql = "DELETE FROM posts WHERE postId = ?";
        db.query(deleteSql, [postId], (err2) => {
            if (err2) return res.status(500).json({ success: false });
            res.json({ success: true, message: "Post deleted" });
        });
    });
});




app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
});