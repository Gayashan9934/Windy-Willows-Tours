document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    mobileMenu.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });

    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            navMenu.classList.remove('active'); // Close menu on click

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Scroll Animation (Fade In)
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(section);
    });

    // Add css class for the transition via JS to keep initial state clean in CSS
    const style = document.createElement('style');
    style.innerHTML = `
        .fade-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // --- Admin Mode Logic ---
    loadContent(); // Load saved content on startup
});

// Admin Toggle State
let isAdmin = false;

function toggleAdmin() {
    isAdmin = !isAdmin;
    const adminBar = document.getElementById('admin-bar');
    const body = document.body;

    if (isAdmin) {
        const password = prompt("Enter Admin Password:");
        if (password !== "admin123") { // Simple password for demo
            alert("Incorrect Password!");
            isAdmin = false;
            return;
        }
        adminBar.style.display = 'flex';
        body.classList.add('admin-mode');
        document.querySelectorAll('.admin-controls').forEach(el => el.style.display = 'block');
        enableEditing(true);
        alert("Admin Mode Enabled! Double-click bottom-right corner to toggle.\n\npassword: admin123");
    } else {
        adminBar.style.display = 'none';
        body.classList.remove('admin-mode');
        document.querySelectorAll('.admin-controls').forEach(el => el.style.display = 'none');
        enableEditing(false);
    }
}

function enableEditing(enable) {
    const editables = document.querySelectorAll('.editable');
    editables.forEach(el => {
        el.contentEditable = enable;
    });

    // Image Editing
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (enable) {
            const wrapper = document.createElement('div');
            wrapper.className = 'editable-image-container';
            if (img.parentNode.classList.contains('editable-image-container')) return; // prevent double wrap

            img.parentNode.insertBefore(wrapper, img);
            wrapper.appendChild(img);

            wrapper.onclick = (e) => {
                if (!isAdmin) return;
                e.preventDefault();
                e.stopPropagation();
                triggerImageUpload(img);
            };
        } else {
            // Unwrap if needed, or just leave it clean
            // For simplicity, we keep the wrapper structure but disable events
        }
    });
}

function saveChanges() {
    const editables = document.querySelectorAll('.editable');
    const data = {};

    editables.forEach(el => {
        const key = el.getAttribute('data-key');
        if (key) {
            data[key] = el.innerHTML;
        }
    });

    localStorage.setItem('windyWillowsContent', JSON.stringify(data));

    // Also save images
    // Note: Saving images to localstorage is heavy (Base64). 
    // We are just saving the src links here if they were changed.
    const imagesData = {};
    document.querySelectorAll('img').forEach((img, index) => {
        imagesData[`img-${index}`] = img.src;
    });
    localStorage.setItem('windyWillowsImages', JSON.stringify(imagesData));

    // Save Gallery Structure (HTML) to handle added images
    // We only save the innerHTML of the gallery grid
    const galleryGrid = document.getElementById('gallery-grid');
    localStorage.setItem('windyWillowsGalleryHTML', galleryGrid.innerHTML);

    alert("Changes Saved Locally! (Note: Since this is a static site demo, changes persist in your browser cache only.)");
    toggleAdmin(); // Exit admin mode
    location.reload(); // Reload to refresh event listeners clearly
}

function loadContent() {
    // Load Gallery HTML first (structure)
    const storedGallery = localStorage.getItem('windyWillowsGalleryHTML');
    if (storedGallery) {
        document.getElementById('gallery-grid').innerHTML = storedGallery;
    }

    // Load Text
    const storedContent = localStorage.getItem('windyWillowsContent');
    if (storedContent) {
        const data = JSON.parse(storedContent);
        // We select only existing elements
        // If gallery was dynamic, some text keys might be inside it, which is fine
        for (const [key, value] of Object.entries(data)) {
            const el = document.querySelector(`.editable[data-key="${key}"]`);
            if (el) el.innerHTML = value;
        }
    }

    // Load Images (Sources)
    // This overlays the sources on top of the structure
    const storedImages = localStorage.getItem('windyWillowsImages');
    if (storedImages) {
        const data = JSON.parse(storedImages);
        document.querySelectorAll('img').forEach((img, index) => {
            if (data[`img-${index}`]) {
                img.src = data[`img-${index}`];
            }
        });
    }
}

// Image Upload Logic
function triggerImageUpload(imgElement) {
    const input = document.getElementById('image-upload-input');

    // Remove previous listeners to avoid stacking
    input.onchange = null;

    input.click();

    input.onchange = function () {
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                // Resize check simplified
                if (e.target.result.length > 500000) {
                    if (!confirm("This image is large and might fill up your browser storage. Continue?")) {
                        return;
                    }
                }
                imgElement.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    };
}

function addNewGalleryImage() {
    const galleryGrid = document.getElementById('gallery-grid');
    const newDiv = document.createElement('div');
    newDiv.className = 'gallery-item';
    newDiv.innerHTML = `
        <img src="https://via.placeholder.com/800x600?text=New+Image" alt="New Gallery Image">
        <div class="overlay"><span class="editable" contenteditable="true">New Caption</span></div>
    `;
    galleryGrid.appendChild(newDiv);

    // Enable editing on the new image immediately
    enableEditing(true);
}

