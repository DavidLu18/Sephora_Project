import { auth } from "./firebase";
import { onIdTokenChanged } from "firebase/auth";

export function setupFirebaseTokenRefresh() {
  onIdTokenChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdToken(true);
      localStorage.setItem("token", token);
      console.log("Firebase token refreshed!");
    } else {
      localStorage.removeItem("token");
    }
  });
}
