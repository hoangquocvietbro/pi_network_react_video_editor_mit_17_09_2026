import { deleteAllStorage } from "../utils/firebase-delete";

async function main() {
    console.log("-----------------------------------------");
    console.log("Đang tiến hành dọn dẹp Firebase Storage...");
    console.log("-----------------------------------------");
    try {
        const deletedCount = await deleteAllStorage();
        console.log(`\n Hoàn tất! Đã xóa thành công ${deletedCount} file.`);
    } catch (err: any) {
        console.error("\n Gặp lỗi khi xóa Firebase Storage:", err?.message || err);
        if (err?.code === "storage/quota-exceeded") {
            console.error("\n Lưu ý: Firebase Bucket hiện đã bị khóa hoàn toàn do vượt quá Quota.");
            console.error("Bạn cần truy cập https://console.firebase.google.com/ để xóa trực tiếp trên giao diện Console hoặc thay Bucket mới trong .env.local");
        }
    }
}

main();
