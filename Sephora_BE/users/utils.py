from users.models import User

def get_userid_from_firebase(uid: str | None):
    if uid is None:
        return None
    user = User.objects.filter(firebase_uid=uid).first()
    return user.userid if user else None
