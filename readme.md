# Blog Project — Documentation

This document describes the current full‑stack Blog project (frontend + backend), how the code is organized, how to run it locally, important files/endpoints, and next steps. Use it as a quick onboarding/reference for development, debugging, and enhancement.

---

## 1) Project summary
A full‑stack Blog website:
- Frontend: React + Vite + Tailwind (JSX + CSS), pages for reading, creating, editing posts, user auth, admin UI.
- Backend: Node.js + Express, MongoDB (Mongoose schemas) REST API with controllers for posts, tags, categories, comments, users, and admin flows.
- State management: Redux Toolkit (slices + central store), axios / axios instance for API calls.
- Goals: performant, responsive blog with admin CMS, search/filter, comments and basic engagement features.

---

## 2) Repo layout (local paths)
Root contains two folders: `blog_frontend` and `blog_backend`.

Frontend (path):
`c:\Users\Lenovo\OneDrive\Desktop\all web dev\FSWD project\blog\blog_frontend`
- package.json, vite.config.js, index.html
- src/
  - main.jsx, App.jsx
  - pages/ (HomePage.jsx, CreatePost.jsx, EditPost.jsx, SinglePostView.jsx, Profile.jsx, Login/Register, admin/*)
  - components/
  - helper/ (axiosinstance.js)
  - store/ (slices and store files)
  - Redux/ (legacy/compat Store.js)
  - utils/axiosInstance.js
  - assets, styles

Backend (path):
`c:\Users\Lenovo\OneDrive\Desktop\all web dev\FSWD project\blog\blog_backend`
- server.js, app.js
- config/db.js
- routes/ (post.routes.js, tags.routes.js, categories.routes.js, comments.routes.js, user.routes.js, admin.routes.js, miscellaneous.routes.js)
- controller/ (post.controller.js, tag.controller.js, category.controller.js, comment.controller.js, user.controller.js, Admin.controller.js)
- model/ (post.schema.js, user.schema.js, tag.schema.js, category.schema.js, comment.schema.js)
- middleware/ (auth, multer, admin checks, errors)
- uploads/, mail/, utils/

---

## 3) Important frontend files
- `src/main.jsx` — app entry; should wrap `<App />` with Redux `<Provider>`.
- `src/App.jsx` — app routes (React Router).
- `src/helper/axiosinstance.js` & `src/utils/axiosInstance.js` — axios wrapper(s) handling baseURL + auth header.
- `src/pages/*` — page components (HomePage, CreatePost, EditPost, SinglePostView, Profile, admin pages).
- `src/store/` — Redux Toolkit slices and store:
  - `store.js` — central configured store
  - `authSlice.js, postSlice.js, categorySlice.js, tagSlice.js, commentSlice.js, adminSlice.js`
  - `hooks.js` — useAppDispatch/useAppSelector helpers
- `src/Redux/Store.js` — compatibility shim (re-exports store if used by older imports).

---

## 4) Important backend files & endpoints
Routes are organized under `routes/`. Example endpoints (inspect route files for exact signatures):

- Posts
  - GET  `/api/v1/post/:id`             — get single post
  - GET  `/api/v1/post/all` or `/getAll` — list posts (pagination/filter)
  - POST `/api/v1/post/createPost`      — create post
  - PUT  `/api/v1/post/updatePost`      — update post
  - DELETE `/api/v1/post/:id`           — delete post
- Categories
  - GET `/api/v1/category/getAll`
  - POST `/api/v1/category/create`
- Tags
  - GET `/api/v1/tag/getAll`
  - POST `/api/v1/tag/create`
- Comments
  - POST `/api/v1/comment/create`
  - GET `/api/v1/comment/byPost/:postId`
- User / Auth
  - POST `/api/v1/user/register`
  - POST `/api/v1/user/login`
- Admin
  - admin routes for user/post/category/tag management, permissions

Note: open `routes/*.js` and `controller/*.js` for exact request/response shapes.

---

## 5) Environment variables (examples)
Frontend:
- VITE_API_URL (Vite env): `VITE_API_URL=http://localhost:5000/api/v1`

Backend (.env):
- PORT=5000
- MONGODB_URI=mongodb://localhost:27017/blogdb
- JWT_SECRET=your_jwt_secret
- EMAIL_* and other service keys

Keep secrets out of version control.

---

## 6) Local setup & run (Windows PowerShell)

Backend:
```powershell
cd "c:\Users\Lenovo\OneDrive\Desktop\all web dev\FSWD project\blog\blog_backend"
npm install
# set .env values
npm run dev
```

Frontend:
```powershell
cd "c:\Users\Lenovo\OneDrive\Desktop\all web dev\FSWD project\blog\blog_frontend"
npm install
npm run dev
# open http://localhost:5173
```

---

## 7) State management & conventions
- Redux Toolkit slices are in `src/store/`.
- Central store in `src/store/store.js` and provided in `src/main.jsx`.
- Thunks use single axiosInstance that attaches auth token.
- Use `useAppDispatch` and `useAppSelector` from `src/store/hooks.js`.

Common errors:
- "does not provide an export named X": fix by matching slice exports with imports.
- Store not provided: wrap App with Provider.
- Multiple axios instances: standardize imports.

---

## 8) Frontend routes / UI pages
- `/` — HomePage
- `/posts/:id` — SinglePostView
- `/create-post` — CreatePost
- `/posts/:id/edit` — EditPost
- `/bookmarks`, `/login`, `/register`, `/profile`, `/admin/*`

Ensure UI maps category/tag ids → names.

---

## 9) How to add Edit Post
- Route: `/posts/:id/edit`
- Load post (GET `/api/v1/post/:id`) and categories/tags
- Submit to `PUT /api/v1/post/updatePost` with `postId` and fields (multipart/form-data if image)

---

## 10) Known tasks / next steps
- Fix missing named exports between slices and imports.
- Ensure single axiosInstance used across project.
- Wire central store; remove legacy duplicates.
- Convert id displays to names.
- Add UI polish: dark mode, forms validation.
- Test auth and protected routes.

---

## 11) Troubleshooting tips
- Use DevTools Network tab for requests.
- Confirm expected request payloads and headers.
- Restart dev server after code changes.

---

## 12) Contributing & conventions
- Keep API base in `VITE_API_URL`.
- Place Redux slices in `src/store/`.
- Follow route naming: `/api/v1/<resource>/...`.
- Document new env vars in `.env.example`.

---

## 13) Future enhancements
- Dark mode toggle and accessible themes.
- Role-based permissions.
- Rich text editor, CDN for images, search indexing.
- Analytics and CI/CD.

---
