import firebase_admin
from firebase_admin import credentials, auth
import os

cred_path = "D:/ALL PROJECTS/Final_Projects/Sephora_Project/Sephora_BE/firebase_key.json"
cred = credentials.Certificate(cred_path)

# Chỉ khởi tạo nếu chưa có
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
