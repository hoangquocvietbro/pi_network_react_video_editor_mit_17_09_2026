import { NextResponse } from "next/server";
import { ref, listAll, deleteObject } from "firebase/storage";
import { getFirebaseStorage } from "../../../../lib/firebase";

/**
 * API to delete all files in Firebase Storage
 * WARNING: Use with caution - deletes everything!
 * 
 * Usage: POST /api/uploads/delete-all
 */
export async function POST() {
    try {
        const rootRef = ref(getFirebaseStorage(), "");
        const result = await listAll(rootRef);

        let totalDeleted = 0;
        const deletedFiles: string[] = [];

        // Recursive delete function
        async function deleteFolder(folderPath: string): Promise<number> {
            const folderRef = ref(getFirebaseStorage(), folderPath);
            const folderResult = await listAll(folderRef);

            let count = 0;

            for (const itemRef of folderResult.items) {
                await deleteObject(itemRef);
                deletedFiles.push(itemRef.fullPath);
                count++;
            }

            for (const prefixRef of folderResult.prefixes) {
                count += await deleteFolder(prefixRef.fullPath);
            }

            return count;
        }

        // Delete files in root
        for (const itemRef of result.items) {
            await deleteObject(itemRef);
            deletedFiles.push(itemRef.fullPath);
            totalDeleted++;
        }

        // Delete all folders
        for (const prefixRef of result.prefixes) {
            totalDeleted += await deleteFolder(prefixRef.fullPath);
        }

        return NextResponse.json({
            success: true,
            message: `Deleted ${totalDeleted} files`,
            deletedCount: totalDeleted,
            deletedFiles
        });
    } catch (error) {
        console.error("Error deleting storage:", error);
        return NextResponse.json(
            {
                error: "Failed to delete storage",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
