import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
    addDoc,
    updateDoc,
    type DocumentData,
    type DocumentSnapshot
} from "firebase/firestore";
import { firestore } from "../firebaseConfig";

// Helper to convert a Firestore snapshot to a JS object with ID
const docToObject = <T>(docSnapshot: DocumentSnapshot<DocumentData>): T & { id:string } => {
    const data = docSnapshot.data() as T;
    return {
        ...data,
        id: docSnapshot.id,
    };
};

export const firestoreService = {
    async getDoc<T>(collectionPath: string, id: string): Promise<(T & { id: string }) | null> {
        const docRef = doc(firestore, collectionPath, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docToObject<T>(docSnap);
        }
        return null;
    },

    async getAll<T>(collectionPath: string): Promise<(T & { id: string })[]> {
        const collectionRef = collection(firestore, collectionPath);
        const snapshot = await getDocs(collectionRef);
        return snapshot.docs.map(doc => docToObject<T>(doc));
    },

    async addDoc<T>(collectionPath: string, data: Omit<T, 'id'>): Promise<string> {
        const collectionRef = collection(firestore, collectionPath);
        const docRef = await addDoc(collectionRef, data);
        return docRef.id;
    },

    async setDoc<T>(collectionPath: string, id: string, data: T): Promise<void> {
        const docRef = doc(firestore, collectionPath, id);
        // Firestore's setDoc wants plain objects, so we remove the `id` if it exists on the data object.
        const { id: docId, ...restData } = data as any;
        return setDoc(docRef, restData);
    },

    async deleteDoc(collectionPath: string, id: string): Promise<void> {
        const docRef = doc(firestore, collectionPath, id);
        return deleteDoc(docRef);
    },

    async updateDoc<T>(collectionPath: string, id: string, data: Partial<T>): Promise<void> {
        const docRef = doc(firestore, collectionPath, id);
        return updateDoc(docRef, data);
    }
};