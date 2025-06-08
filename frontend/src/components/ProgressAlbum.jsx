import React, { useEffect, useRef, useState } from "react";
import { db, auth } from "../utils/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, query, orderBy, doc, setDoc, onSnapshot } from "firebase/firestore";
import { theme } from "../theme";

export default function ProgressAlbum() {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [photos, setPhotos] = useState([]);
  const [caption, setCaption] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const fileRef = useRef();
  const storage = getStorage();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "progress_albums"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setAlbums(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !selectedAlbum) {
      setPhotos([]);
      return;
    }
    const q = query(
      collection(db, "users", user.uid, "progress_albums", selectedAlbum.id, "photos"),
      orderBy("date", "desc")
    );
    return onSnapshot(q, (snap) => {
      setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [selectedAlbum]);

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !newAlbumName.trim()) return;
    const albumDoc = doc(collection(db, "users", user.uid, "progress_albums"));
    await setDoc(albumDoc, { name: newAlbumName.trim(), createdAt: new Date() });
    setNewAlbumName("");
    setSelectedAlbum({ id: albumDoc.id, name: newAlbumName.trim() });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      handlePhotoUpload(e);
    }
  };

  const handlePhotoUpload = async (e) => {
    setUploading(true);
    const file = e.target.files[0];
    if (!file || !selectedAlbum) return setUploading(false);
    const user = auth.currentUser;
    if (!user) return setUploading(false);
    try {
      const filePath = `progress_photos/${user.uid}/${selectedAlbum.id}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await addDoc(
        collection(db, "users", user.uid, "progress_albums", selectedAlbum.id, "photos"),
        { url, caption, date, uploadedAt: new Date() }
      );
      setCaption("");
      setDate(new Date().toISOString().slice(0, 10));
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      alert("Upload error: " + err.message);
    }
    setUploading(false);
  };

  return (
    <div>
      <h3 style={{ marginBottom: 18 }}>Progress Albums</h3>

      <div style={{ marginBottom: 22 }}>
        <form onSubmit={handleCreateAlbum} style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            type="text"
            value={newAlbumName}
            onChange={e => setNewAlbumName(e.target.value)}
            placeholder="New album topic (e.g., 'Marathon Prep')"
            style={{ border: "1px solid #D2D6FC", borderRadius: 8, padding: "0.5em 1em", width: 260 }}
          />
          <button
            type="submit"
            style={{ background: theme.accent, border: "none", borderRadius: 8, padding: "0.5em 1.3em", fontWeight: 600 }}
          >Create</button>
        </form>
        {albums.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <span style={{ fontSize: 15, color: "#7C83FD", fontWeight: 600 }}>Your Albums: </span>
            {albums.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedAlbum(a)}
                className={
                  selectedAlbum?.id === a.id ? "album-tab-selected" : "album-tab"
                }
              >{a.name}</button>
            ))}
          </div>
        )}
      </div>

      {selectedAlbum && (
        <div style={{ marginBottom: 16, padding: "1em", background: "#f8faff", borderRadius: 13, boxShadow: "0 2px 12px #A0E7E511" }}>
          <b>Add Progress Photo</b>
          <form style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 7 }}>
            <label className="custom-file-label">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={handlePhotoChange}
                className="custom-file-input"
              />
              <span>{fileName || "Choose Photo"}</span>
            </label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Short caption, reflection, or milestone…"
              maxLength={180}
            />
          </form>
          {uploading && <div style={{ marginTop: 7, fontSize: 13, color: "#7C83FD" }}>Uploading...</div>}
        </div>
      )}

      {selectedAlbum && (
        <div>
          <h4 style={{ margin: "16px 0 8px 0", color: "#7C83FD" }}>
            {selectedAlbum.name} – Progress Diary
          </h4>
          {photos.length === 0 && <div style={{ color: "#bbb", marginTop: 10 }}>No photos yet.</div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {photos.map(photo => (
              <div
                key={photo.id}
                style={{
                  position: 'relative',
                  width: 80,
                  height: 80,
                  cursor: 'pointer',
                }}
                onClick={() => setExpandedPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9, border: '2px solid #A0E7E5' }}
                />
              </div>
            ))}
          </div>
      
      {expandedPhoto && (
        <div
          onClick={() => setExpandedPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer',
          }}
        >
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <img
              src={expandedPhoto.url}
              alt={expandedPhoto.caption}
              style={{ maxWidth: '90%', maxHeight: '70%', borderRadius: 12, boxShadow: '0 2px 12px #0003' }}
            />
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{expandedPhoto.caption || 'No caption'}</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>
                Date: {expandedPhoto.date} &middot; Uploaded: {expandedPhoto.uploadedAt?.toDate()?.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
