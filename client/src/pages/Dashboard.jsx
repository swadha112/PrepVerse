import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div style={{ maxWidth: 640, margin: "40px auto" }}>
      <h2>Welcome {user?.displayName || user?.email}</h2>
      <p>UID: {user?.uid}</p>
      <button onClick={logout} style={{ marginTop: 12 }}>Logout</button>
    </div>
  );
}
