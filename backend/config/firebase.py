#initializing the Firebase Admin SDK inside Django backend
# django verifying firebase login tokens
import os 
import firebase_admin
from firebase_admin import credentials # to load service account file

_initialized = False 
# we initialize firebase only once as django will throw error (The default Firebase app already exists) if we initialize multiple times

def init_firebase():
    global _initialized
    if _initialized: #handling multiple initialization
        return
    
    #we stored the file path in .env:
    cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
    if not cred_path:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT_PATH not set")

    #loads your Firebase service account JSON file
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    _initialized = True