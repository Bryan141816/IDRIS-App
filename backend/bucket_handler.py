
import uuid
from supabase import create_client, Client
from decouple import config
SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"
SUPABASE_KEY = "YOUR_SERVICE_ROLE_KEY"
BUCKET_NAME = "your-bucket-name"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SUPABASE_URL = config("SUPABASE_URL")
SUPABASE_KEY = config("SUPABASE_KEY")
BUCKET_NAME = config("SUPABASE_BUCKET")

async def upload_to_bucket(file, directory: str = "") -> str:
    """
    Uploads a file to a Supabase bucket with optional directory.
    Returns the public URL.
    - file: UploadFile or bytes
    - directory: folder/subfolder inside the bucket (e.g. 'profiles/user123')
    """

    # Clean directory (no leading/trailing slashes)
    directory = directory.strip("/")

    # Get file extension & content
    if hasattr(file, "filename"):  # FastAPI UploadFile
        file_content = await file.read()
        file_ext = file.filename.split(".")[-1]
    else:  # raw bytes
        file_content = file
        file_ext = "bin"

    # Generate unique filename
    filename = f"{uuid.uuid4()}.{file_ext}"

    # Build full path: directory/filename OR just filename
    full_path = f"{directory}/{filename}" if directory else filename

    # Upload
    res = supabase.storage.from_(BUCKET_NAME).upload(
        full_path,
        file_content
    )

    if res is None:
        raise Exception("Upload failed")

    # Public URL
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(full_path)

    return public_url
