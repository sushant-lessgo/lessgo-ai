✅ IMAGE HANDLING FLOW (EDIT PAGE)

1. User Selects an Image Element (Element Level Toolbar)

✅ Show Image Configuration Modal with 3 tabs:

[ ] Upload

[ ] Unsplash/Pexels Search

[ ] Edit Existing Image

2. IF "Upload" is selected
Show file picker (.jpg, .png, .webp)

Store:

image.source = "upload"

image.url = <uploaded_url>

Upload to S3 / Vercel Blob / your image store

3. IF "Unsplash/Pexels Search" is selected
Show search bar and thumbnails

On selection:

Store:

image.source = "unsplash" | "pexels"

image.url = <selected_url>

4. IF "Edit Existing Image" is selected
Open simple editor (via third-party tool like Pintura / TUI Image Editor)

Allow basic actions:

Crop

Resize

Brightness/Contrast

Save edited image as new upload

Replace in image.url

5. Render Logic
Render image using image.url

Show image.altText if provided

IF no image.url → Show placeholder or remove block (configurable)

6. Image Settings Panel (Left or Modal)
Allow user to set:

Alt Text

Width, Max Height

Object Fit: Cover / Contain

Border Radius: None / Rounded / Circle

Shadow: None / Soft / Strong

