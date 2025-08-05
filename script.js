import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    where,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const quill = new Quill('#blog-input', {
    theme: 'snow'  // or 'bubble'
});



// quill.on('text-change', updateUserDraft)

const firebaseConfig = {
    apiKey: "AIzaSyA0nPGRb-Ny2UVb0iUyKjo54hXi3647vpc",
    authDomain: "blog-website-767af.firebaseapp.com",
    projectId: "blog-website-767af",
    storageBucket: "blog-website-767af.firebasestorage.app",
    messagingSenderId: "774286026663",
    appId: "1:774286026663:web:51ad6fd4e22b4858b27882",
    measurementId: "G-RH5YMVE93Z"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app)

const db = getFirestore(app)

let formConatiner = document.querySelector('#form-container');
let fullNameInput = document.querySelector('.full-name');
let loginAndSignupSwitch = document.querySelector('.loginAndSignupSwitcher');
let formBtn = document.querySelector('.formBtn');
let alertBox = document.querySelector('.alert-box');
let alertMessage = document.querySelector('.alert-message');
let nameInput = document.querySelector('.full-name');
let emailInput = document.querySelector('.email');
let passwordInput = document.querySelector('.password');
let emailVericationMessageConatiner = document.querySelector('#call-to-verify-email-container');
let loaderContainer = document.querySelector('#loader-container');
let blogInputContainer = document.querySelector('#Blog-input-container');
let blogTitleInput = document.querySelector('#Blog-title-input');
let blogDescInput = document.querySelector('#Blog-description-input');
let imgInput = document.querySelector('#blog-image-input');
let blogSection = document.querySelector('#blog-section');
let blogImageToShow = document.querySelector('#blog-img-to-show');
let imageChangeBtn = document.querySelector('#change-image');
let blogSearchBar = document.querySelector('#public-search-bar');
let blogPage = document.querySelector('.blog-page');
let adminBlogPage = document.querySelector('#my-blogs');
let adminSearchBar = document.querySelector('#admin-search-bar');
let adminBlogContainer = document.querySelector('#admin-blog-container');
let blogInputBtn = document.querySelector('.blog-input-btn');
let saveBlogDraftBtn = document.querySelector('#save-blog-draft-btn');
let showPasswordBtn = document.querySelector('.fa-eye');
let hidePasswordBtn = document.querySelector('.fa-eye-slash');
let navBar = document.querySelector('nav');

let passwordEye = document.querySelector('#hideOrShowPassowrd');


let registerBtn = document.querySelector('.register-btn');
let loginBtn = document.querySelector('.login-btn');
let ourStoryNav = document.querySelector('#our-story-nav');
let writeBlogBtn = document.querySelector('.write-blog-btn');
let logoutNavBtn = document.querySelector('nav .logout-btn');
let adminBlogsBtn = document.querySelector('#view-my-blogs');

let isOffline = false;
window.addEventListener('offline' , ()=>{
    showAlert('Your connection has lost!')
    isOffline = true;
});

window.addEventListener('online', (e)=>{
   showAlert('Your internet connection has recovered!');
   isOffline = false;
});



let blogData;
getBlogsFromDB()
    .then((blog) => {
        blogData = blog;
        hideElem(loaderContainer)
    })

  
    
    blogSearchBar.addEventListener('input', () => {
        let searchTerm = blogSearchBar.value.toLowerCase();
        let filterBlogs = blogData.filter((blog) => (blog.blogTitle.toLowerCase().includes(searchTerm) ||
        blog.blogContent.toLowerCase().includes(searchTerm) ||
        blog.description.toLowerCase().includes(searchTerm)));
        renderBlogs(filterBlogs);
    });
    
    async function Signup(name, email, password) {
        try {
            showFlexElem(loaderContainer)
        await createUserWithEmailAndPassword(auth, email, password)
        await createUserInDB(email, name);
        showAlert(`Welcome ${name}, you have sccessfully register!`);
        hideElem(formConatiner)
    } catch (error) {
        showAlert(`Some Error occured <br>${error.message} `);
    } finally {
        hideElem(loaderContainer)
        resetInput(emailInput, passwordInput, nameInput)
    }
}

async function verifyEmail() {
    try {
        showFlexElem(loaderContainer)
        let user = await waitForUser();
        await sendEmailVerification(user, {
            url: 'https://mindscribeblog.netlify.app/'
        })
        showAlert("Verification email sent. Please check your inbox or spam box.");
    } catch (error) {
        showAlert(`Error sending verification email <br> ${error.message}`)
    } finally {
        hideElem(loaderContainer);
    }

}

function showAlert(message) {
    alertMessage.innerHTML = message;
    showBlockElem(alertBox);
}



function openSignupForm() {
    fullNameInput.style.display = 'block'
    formBtn.textContent = 'Register Now';
    formBtn.id = 'signupFormBtn';
    loginAndSignupSwitch.innerHTML = `Already have an account? <span id="jump-to-login">Login Now</span>`;
    passwordEye.style.top = '165px';
    showFlexElem(formConatiner);
}

function openLoginForm() {
    formBtn.textContent = 'Login Now';
    loginAndSignupSwitch.innerHTML = `Don't have an account? <span id="jump-to-signup">Register yourself now</span>`;
    formBtn.id = 'loginFormBtn'
    hideElem(fullNameInput)
    passwordEye.style.top = '105px';
    showFlexElem(formConatiner)
}

function waitForUser() {
    return new Promise((resolve, reject) => {
        if (isOffline) reject('Your are not connected with Interent!')
        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                unsubscribe(); // ✅ Call this only AFTER we get the user
                if (user) {
                    await user.reload();
                    resolve(user);
                } else {
                    resolve(null);
                }
            });
    });
}


onAuthStateChanged(auth, async (user) => {
    if (user) {
        await user.reload();
        if (!user.emailVerified) showFlexElem(emailVericationMessageConatiner)
        hideElem(registerBtn, loginBtn);
        showBlockElem(writeBlogBtn, logoutNavBtn , ourStoryNav , adminBlogsBtn);

        getBLogOnRoute()


    } else {
        showBlockElem(registerBtn, loginBtn , ourStoryNav);
        hideElem(emailVericationMessageConatiner, writeBlogBtn, logoutNavBtn , adminBlogsBtn);
    }

});

async function getLogin(email, password) {
    try {
        showFlexElem(loaderContainer);
        let userCredentials = await signInWithEmailAndPassword(auth, email, password);
        showAlert('You have successfully login to your account!');
        hideElem(formConatiner)
    } catch (error) {
        showAlert(`Failed to get login<br>${error.message}`);
    } finally {
        hideElem(loaderContainer);
        resetInput(emailInput, passwordInput, nameInput)
    }
}

function isBlogInputValid() {
    const html = quill.root.innerHTML.trim();
    const text = quill.getText().trim();

    if (text.length === 0 || html === '<p><br></p>') return false

    return true

}

imgInput.addEventListener('change', uploadBlogImage);

let isNavOpen = false;

document.addEventListener('click', (event) => {
    const target = event.target;

    // Signup triggers
    if (target.id === 'jump-to-signup' || target.matches('.register-btn')) {
        openSignupForm();
        return;
    }

    // Login triggers
    if (target.id === 'jump-to-login' || target.matches('.login-btn')) {
        openLoginForm();
        return;
    }

    // Close form
    if (target.matches('.fa-xmark')) {
        hideElem(formConatiner);
        return;
    }

    // OK button (alert)
    if (target.matches('.ok-button')) {
        hideElem(alertBox);
        return;
    }

    // Signup form submission
    if (target.id === 'signupFormBtn') {
        event.preventDefault();

        const isValid = isInputValid(emailInput, nameInput, passwordInput);

        if (!isValid) {
            showAlert('Please Fill all input fields correctly');
            return;
        }

        Signup(nameInput.value, emailInput.value, passwordInput.value);
        return;
    }

    // Logout
    if (target.matches('.logout-btn')) {
        getLogout();
        return;
    }

    // Login form submission
    if (target.id === 'loginFormBtn') {
        event.preventDefault();

        const isValid = isInputValid(emailInput, passwordInput);

        if (!isValid) {
            showAlert('Please Fill all input fields correctly');
            return;
        }

        getLogin(emailInput.value, passwordInput.value);
        return;
    }

    // Email verification link
    if (target.id === 'get-verify-link-btn') {
        verifyEmail();
        return;
    }

    if (target.matches('.write-blog-btn')) {
        InsertDraftToBlogInput();
        blogInputBtn.id = 'Blog-publish-btn';
        blogInputBtn.textContent = 'Publish Now';
        showBlockElem(blogInputContainer)
        return;
    }

    if (target.id === 'close-blog-input') {
        // quill.setText('');
        hideElem(blogInputContainer)
        return;
    }

    if (target.id === 'Blog-publish-btn') {
        publishBlog()
        return;
    }

    if (target.id === 'save-blog-draft-btn') {
        updateUserDraft();
        return
    }

    if (target.id === 'Start-Writing-main-btn') {
        showFlexElem(loaderContainer)
        waitForUser()
        .then((user) => {
            if (!user) {
                showAlert('First Login to your account to start writing.')
            } else{
                showBlockElem(blogInputContainer)

            }
            hideElem(loaderContainer)    
        });
        return;

    }

    if (target.id === 'back-from-blog-page') {
        window.location.hash = '';
        hideElem(blogPage);

        return;
    }

    if (target.matches('.copy-url')) {
        let url = window.location.href;
        navigator.clipboard.writeText(url)
            .then(() => {
                showAlert('Blog URL has copied, now you can share it anywhere!')
            })
            .catch(() => {
                showAlert('Failed To copy URL, please try again')
            })

        return;
    }

    if (target.matches('.give-like')) {
        likeBlog()
        return;

    }

    if (target.id === 'back-from-admin-blog-page-btn') {
        hideElem(adminBlogPage);

        return;
    }

    if (target.id === 'view-my-blogs') {
        getAdminBlogs()
        return;
    }

    if (target.matches('.delete')) {
        deleteBlog(target.dataset.blogid);
        return;
    }

    if (target.matches('.edit')) {
        openBlogInputForBlogEdit(target.dataset.blogid);
        return;

    }

    if (target.id === 'edit-done') {
        saveEditedBlog(target.dataset.currentEditedBlogId);
        return
    }

    if (target.matches('.fa-eye')) {
        passwordInput.type = 'text';
        showBlockElem(hidePasswordBtn);
        hideElem(showPasswordBtn);
        return;
    }

    if (target.matches('.fa-eye-slash')) {
        passwordInput.type = 'password';
        hideElem(hidePasswordBtn);
        showBlockElem(showPasswordBtn);
        return;
    }

    if (target.matches('.fa-bars')) {
        if (isNavOpen) {
            navBar.style.height = '70px';
            isNavOpen = false
        } else {
            navBar.style.height = 'auto';
            isNavOpen = true
        }
        return;
    }
});

async function likeBlog() {

    let LikeBtnLoader = document.querySelector('.like-btn-loader-container');
    let LikeElem = document.querySelector('.fa-thumbs-up');
    let LikeCount = blogPage.querySelector('.like-count');
    let LikeBtn = document.querySelector('.like-btn');

    try {


        showBlockElem(LikeBtnLoader)
        LikeBtn.style.pointerEvents = 'none';


        let isLike;
        let hash = window.location.hash;
        let BlogId = hash.slice(7, hash.length);

        let user = await waitForUser();

        let userDocRef = doc(db, 'users', user.uid);
        let blogDocRef = doc(db, 'blogs', BlogId)

        let userDoc = await getDoc(userDocRef);
        let userData = userDoc.data();

        let blogDoc = await getDoc(blogDocRef);
        let blogData = blogDoc.data();

        let likeCount = blogData.Likes;
        let likeBlogList = userData.likeBlogList;

        if (likeBlogList.includes(BlogId)) {

            for (let i = 0; i < likeBlogList.length; i++) {

                if (likeBlogList[i] === BlogId) {
                    likeBlogList.splice(i, 1);
                    isLike = false;
                    --likeCount;
                    break;
                }

            }

        } else {

            likeBlogList.push(BlogId);
            isLike = true
            ++likeCount;

        }

        await setDoc(userDocRef, { likeBlogList: likeBlogList }, { merge: true });
        await setDoc(blogDocRef, { Likes: likeCount }, { merge: true }) // continue

        LikeElem.dataset.isLike = isLike;
        LikeCount.textContent = likeCount;

    } catch (error) {
        showAlert('Some error occured');
    } finally {
        hideElem(LikeBtnLoader);
        LikeBtn.style.pointerEvents = 'all';

    }




}

async function InsertDraftToBlogInput() {
    try {
        showFlexElem(loaderContainer)
        let user = await waitForUser()
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) throw new Error('')
        let BlogDraft = docSnap.data().BlogDraft;
        quill.root.innerHTML = BlogDraft.content;
        blogTitleInput.value = BlogDraft.title;
        blogDescInput.value = BlogDraft.description;
        if (BlogDraft.coverImg) {
            blogImageToShow.src = BlogDraft.coverImg;
            showBlockElem(blogImageToShow, imageChangeBtn)
        } else {
            blogImageToShow.src = '';
            hideElem(blogImageToShow, imageChangeBtn)
        }
    } catch (error) {
        showAlert('Failed to load your blog draft!' + error.message)
    } finally {
        hideElem(loaderContainer)
    }
}



async function publishBlog() {
    try {
        if (!isBlogInputValid() || !isInputValid(blogTitleInput, blogDescInput)) {
            showAlert('Oops! one or more input field is empty!');
            return;
        }

        if (blogImageToShow.src === '') {
            showAlert('Oops, you do not upload any cover image');
            return;
        }

        showFlexElem(loaderContainer)

        let blogContent = quill.root.innerHTML;

        const blogsCollection = collection(db, 'blogs')

        let user = await waitForUser();

        let publisherInfo = await getUserInfo(user.uid);

        await addDoc(blogsCollection, {  // create a new document of new blog with auto ID in blogs collection
            blogContent: blogContent,
            publishAt: new Date().toISOString(),
            publishBy: user.uid,
            blogTitle: blogTitleInput.value,
            coverImage: blogImageToShow.src,
            publisherName: publisherInfo.name,
            description: blogDescInput.value,
            Likes: 0
        });


        showAlert('Your Blog has successfully published!')
        hideElem(blogInputContainer)

        const userDoc = doc(db, 'users', user.uid);

        await setDoc(userDoc, {
            BlogDraft: {
                title: '',
                description: '',
                content: '<p><br></p>',
                coverImg: ''
            }
        }, { merge: true })

        quill.setText('');

        resetInput(blogTitleInput, blogDescInput, imgInput)
        hideElem(blogImageToShow, imageChangeBtn)

        getBlogsFromDB()
        getAdminBlogs()

    } catch (error) {
        showAlert(`Failed to publish blog<br>${error.message}`)
    } finally {
        hideElem(loaderContainer);
    }



}


async function getLogout() {
    try {
        showFlexElem(loaderContainer);
        await signOut(auth);
        showAlert('You have successfully logout!')
    } catch (error) {
        showAlert(`Failed to get logout ${error.message}`);
    } finally {
        hideElem(loaderContainer);
    }

}

async function createUserInDB(email, name) {
    let user = await waitForUser();
    let newDoc = doc(db, 'users', user.uid);
    let newDocRef = await setDoc(newDoc, {
        email: email,
        name: name,
        uid: user.uid,
        signupAt: new Date().toISOString(),
        BlogDraft: {
            title: '',
            description: '',
            content: '<p><br></p>',
            coverImg: ''
        },
        likeBlogList: []
    });

}

function showBlockElem(...elems) {
    elems.forEach(elem => elem.style.display = 'block')
}

function hideElem(...elems) {
    elems.forEach(elem => elem.style.display = 'none')
}

function showFlexElem(...elems) {
    elems.forEach(elem => elem.style.display = 'flex')
}

function isInputValid(...inputs) {
    for (const element of inputs) {
        if (element.value.trim() === '') {
            return false
        }
    }
    return true
}

async function updateUserDraft() {
    try {
        showFlexElem(loaderContainer)
        let user = await waitForUser();
        let userDoc = doc(db, 'users', user.uid);
        await setDoc(userDoc, {
            BlogDraft: {
                title: blogTitleInput.value,
                description: blogDescInput.value,
                content: quill.root.innerHTML,
                coverImg: blogImageToShow.getAttribute("src") || ""
            }
        }, { merge: true })

        showAlert('Your draft has succefully saved!')
        hideElem(blogInputContainer)
    } catch (error) {
        showAlert('Failed to save your draft!' + error.message)
    } finally {
        hideElem(loaderContainer)
    }
}

async function getBlogsFromDB() {
    try {
        let blogsCollection = collection(db, 'blogs')
        let blogsData = [];
        let docsSnap = await getDocs(blogsCollection);
        docsSnap.forEach((snap) => {
            let data = snap.data();
            blogsData.push({
                ...data,
                id: snap.id
            });

        })

        //Sort Blogs by time and  date
        blogsData.sort((a, b) => new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime())


        renderBlogs(blogsData)

        return blogsData

    } catch (error) {
        showAlert(`Failed to load blogs<br>${error.message}`)
    }
}

async function renderBlogs(blogs) {
    blogSection.innerHTML = '';
    if (blogs.length === 0) blogSection.innerHTML = `<h1 id="no-blog-message">No Blogs Found!</h1>`;
    blogs.forEach((blog) => {
        let publishDate = getDisplayDateFormat(blog.publishAt)
        let newElem = document.createElement('div')
        newElem.classList.add('blog-card');
        newElem.innerHTML = `
        <div class="blog-card-content">
            <h1 class="blog-head">${blog.blogTitle}</h1>
            <p class="blog-descript">${blog.description}</p>
            <a href="#/blog/${blog.id}" > <button class="btn read-blog-btn">  Read Blog  </button> </a>
            <p class="author-name">${blog.publisherName} post on ${publishDate}</p>
        </div>
        <div class="blog-card-img">
            <img src=${blog.coverImage} alt="Due to some error image could not load!">
        </div>`

        blogSection.appendChild(newElem)

    });

    return blogs
}


async function uploadBlogImage() {
    try {
        showFlexElem(loaderContainer)
        const file = imgInput.files[0];

        if (!file) {
            throw new Error('Please select an image');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'mindScribe_img');

        const response = await fetch('https://api.cloudinary.com/v1_1/dxdijw7zr/image/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload image, please try');
        }
        const data = await response.json();
        blogImageToShow.src = data.secure_url;
        showBlockElem(blogImageToShow, imageChangeBtn)
    } catch (error) {
        showAlert(error.message)
    } finally {
        hideElem(loaderContainer)
    }

}

function resetInput(...inputs) {
    inputs.forEach((elem) => elem.value = '')
}

async function getUserInfo(uid) {
    let userDoc = doc(db, 'users', uid);
    let userInfo = await getDoc(userDoc);
    return userInfo.data();
}

function getDisplayDateFormat(iso) {
    let dateObj = new Date(iso);
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    let month = months[dateObj.getMonth()];
    let date = dateObj.getDate();
    let year = dateObj.getFullYear();

    return `${date}-${month}-${year}`
}

async function getBLogOnRoute() {

    try {
        showFlexElem(loaderContainer)
        let blogLikeBtn = document.querySelector('.like-btn');
        let user = await waitForUser();
        if (!user) hideElem(blogLikeBtn);
        let hash = window.location.hash;
        if (!hash.startsWith('#/blog/')) {
            hideElem(blogPage);
            return;
        }



        let id = hash.slice(7, hash.length);


        let blogTitleElem = blogPage.querySelector('.blog-title');
        let blogContentElem = blogPage.querySelector('.blog-content');
        let LikeCount = blogPage.querySelector('.like-count');
        let blogCoverImg = blogPage.querySelector('.blog-cover');

        let docSnap = await getDoc(doc(db, 'blogs', id));
        let BlogObj = docSnap.data();


        await handleLike(id)
        blogTitleElem.textContent = BlogObj.blogTitle;
        blogContentElem.innerHTML = BlogObj.blogContent;
        LikeCount.textContent = BlogObj.Likes;
        blogCoverImg.src = BlogObj.coverImage;

        showBlockElem(blogPage)

    } catch (error) {

        showAlert(error.message)
    } finally {
        hideElem(loaderContainer)
    }


}

window.addEventListener('hashchange', getBLogOnRoute);

async function handleLike(id) {
    let user = await waitForUser();
    if (!user) return
    let LikeElem = document.querySelector('.fa-thumbs-up');

    let userDoc = await getDoc(doc(db, 'users', user.uid));

    let yourLikeBLogList = userDoc.data().likeBlogList;


    yourLikeBLogList.includes(id) ? LikeElem.dataset.isLike = 'true' : LikeElem.dataset.isLike = 'false';

}

let adminBlogs;

async function getAdminBlogs() {

    try {
        showFlexElem(loaderContainer)
        let blogsCollection = collection(db, 'blogs');
        let userBlogs = [];

        let user = await waitForUser()
        const queryOfUserBlogs = query(blogsCollection, where("publishBy", "==", user.uid));

        const docsSnap = await getDocs(queryOfUserBlogs);

        docsSnap.forEach((doc) => {
            userBlogs.push({
                ...doc.data(),
                id: doc.id
            })
        });

        userBlogs.sort((a, b) => new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime())


        adminBlogs = userBlogs;

        renderAdminBlogs(userBlogs)

    } catch (error) {
        showAlert(error.message)
    } finally {
        hideElem(loaderContainer)
    }


}



async function renderAdminBlogs(userBlogs) {

    adminBlogContainer.innerHTML = '';

    if (userBlogs.length === 0) {
        adminBlogContainer.innerHTML = `<h1 id="no-blog-message">No Blogs Found!</h1>`;
        showBlockElem(adminBlogPage)
        return;
    }

    userBlogs.forEach((blog) => {
        let newElem = document.createElement('div');
        newElem.classList.add('blog-card');
        newElem.innerHTML = `
             <div class="blog-card-content">
                <h1 class="blog-head">${blog.blogTitle}</h1>
                <p class="blog-descript">${blog.description}</p>
                <div id="Admin-blog-btn-container">
                    <a href="#/blog/${blog.id}"><button class="admin-btn view" >View live</button></a>
                    <button class="admin-btn edit" data-blogId=${blog.id}>Edit</button>
                    <button class="admin-btn delete" data-blogId=${blog.id}>Delete</button>
                </div>
                <p class="author-name">Post on ${getDisplayDateFormat(blog.publishAt)}<br>You get ${blog.Likes} Likes</p>
            </div>
            <div class="blog-card-img">
                <img src=${blog.coverImage} alt="Due to some error image could not load!">
            </div>`;

        adminBlogContainer.appendChild(newElem);

        showBlockElem(adminBlogPage)
    });
}

async function deleteBlog(id) {
    try {
        let isConfirm = confirm('Are you really want to delete this blog?');
        if (!isConfirm) {
            showAlert('Your blog is safe!');
            return;
        }
        showFlexElem(loaderContainer)

        await deleteDoc(doc(db, 'blogs', id));

        hideElem(loaderContainer);

        showAlert('Your blog has successfully deleted');

        getBlogsFromDB()
        getAdminBlogs()

    } catch (error) {
        showAlert(`Some error occured<br>${error.message}`)
    }

}

async function openBlogInputForBlogEdit(blogID) {
    try {
        showFlexElem(loaderContainer)
        blogInputBtn.id = 'edit-done';
        blogInputBtn.textContent = 'Save Now';
        blogInputBtn.dataset.currentEditedBlogId = blogID;
        let docSnap = await getDoc(doc(db, 'blogs', blogID));
        let blogData = docSnap.data();

        blogTitleInput.value = blogData.blogTitle;
        blogDescInput.value = blogData.description;
        quill.root.innerHTML = blogData.blogContent;
        blogImageToShow.src = blogData.coverImage;

        showBlockElem(blogImageToShow, imageChangeBtn, blogInputContainer)
        hideElem(saveBlogDraftBtn)

    } catch (error) {

        showAlert(`failed to load data<br>${error.message}`)

    } finally {
        hideElem(loaderContainer)
    }

}

async function saveEditedBlog(id) {
    try {

        if (!isBlogInputValid() || !isInputValid(blogTitleInput, blogDescInput)) {
            showAlert('Oops! one or more input field is empty!');
            return;
        }

        if (blogImageToShow.src === '') {
            showAlert('Oops, you do not upload any cover image');
            return;
        }

        showFlexElem(loaderContainer);

        let docRef = doc(db, 'blogs', id)
        await setDoc(docRef, {
            blogTitle: blogTitleInput.value,
            blogContent: quill.root.innerHTML,
            description: blogDescInput.value
        }, { merge: true });

        getBlogsFromDB()
        getAdminBlogs()

        hideElem(blogInputContainer)


    } catch (error) {
        showAlert(`Some error occured<br>${error.message}`)
    } finally {
        hideElem(loaderContainer)
    }
}

adminSearchBar.addEventListener('input', () => {
    let searchTerm = adminSearchBar.value.toLowerCase();
    let filterAdminBlogs = adminBlogs.filter((blog) => {
        return (blog.blogTitle.toLowerCase().includes(searchTerm) ||
            blog.description.toLowerCase().includes(searchTerm) ||
            blog.blogContent.toLowerCase().includes(searchTerm));
    });

    renderAdminBlogs(filterAdminBlogs)
})