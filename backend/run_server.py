"""Start CivicLens AI backend server."""
import os
import sys

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
