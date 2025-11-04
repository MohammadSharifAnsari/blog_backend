import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    media: [
      {
        //is id ke though avatar ko uniquely identify kara jaega
        public_id: {
          type: String,
        },
        //is url ke throuh avatar ko access kar ajaega yeh clodnary la url hai jahan image store hogi
        secure_url: {
          type: String,
        },
        //below two string used for forget password
      },
    ], // URLs for images/videos
    avatar: {
      //is id ke though avatar ko uniquely identify kara jaega
      public_id: {
        type: String,
      },
      //is url ke throuh avatar ko access kar ajaega yeh clodnary la url hai jahan image store hogi
      secure_url: {
        type: String,
      },
      //below two string used for forget password
    }, // <-- new field for post thumbnail
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // users who liked
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // unique viewers
    viewedByAnon: [{ type: String }], // unique anonymous viewers (hashed IP+UA)
    views: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    publishedAt: { type: Date },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }], // <-- new field
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
