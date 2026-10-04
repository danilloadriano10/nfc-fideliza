import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, terminate } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
console.log('Testing with config:', config.projectId, config.firestoreDatabaseId);

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    await setDoc(doc(db, 'settings', 'test_ping'), { ping: true, time: new Date().toISOString() });
    const snap = await getDoc(doc(db, 'settings', 'test_ping'));
    console.log('SUCCESS! Read back data:', snap.data());
  } catch (err) {
    console.error('Direct Firestore error:', err);
  } finally {
    await terminate(db);
    process.exit(0);
  }
}
test();
