import { ref, get, set, push, remove, child } from "firebase/database";
import { db } from "../firebaseConfig"; // Use the single, shared db instance

const dbRef = ref(db);

const firebaseObjectToArray = <T>(snapshotVal: Record<string, T> | null | undefined): (T & { id: string })[] => {
    if (!snapshotVal) return [];
    // This function is now more robust. It filters out any entries that are not objects,
    // preventing the app from crashing if corrupted or primitive data (e.g., a boolean)
    // is accidentally saved in a collection where objects are expected.
    return Object.entries(snapshotVal)
        .filter(([, value]) => {
            const isObject = typeof value === 'object' && value !== null;
            if (!isObject) {
                console.warn("Invalid data entry found in Firebase collection, skipping:", value);
            }
            return isObject;
        })
        .map(([key, value]) => ({
            ...(value as T),
            id: key,
        }));
};

export const firebaseService = {
    async get<T>(path: string): Promise<(T & { id: string }) | null> {
        const snapshot = await get(child(dbRef, path));
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (typeof data === 'object' && data !== null) {
                return { ...data, id: snapshot.key };
            }
            return data;
        }
        return null;
    },

    async getAll<T>(path:string): Promise<(T & { id: string })[]> {
        const snapshot = await get(child(dbRef, path));
        return firebaseObjectToArray(snapshot.val());
    },

    async add<T>(path: string, data: T): Promise<string> {
        const newRef = push(ref(db, path), data);
        if (!newRef.key) {
            throw new Error("Failed to get new key from Firebase");
        }
        return newRef.key;
    },

    async set<T>(path: string, data: T): Promise<void> {
        return set(ref(db, path), data);
    },

    async remove(path: string): Promise<void> {
        return remove(ref(db, path));
    },

    async pathExists(path: string): Promise<boolean> {
        const snapshot = await get(child(dbRef, path));
        return snapshot.exists();
    },

    async updateField(path: string, field: string, value: any): Promise<void> {
        const fieldRef = ref(db, `${path}/${field}`);
        return set(fieldRef, value);
    }
};