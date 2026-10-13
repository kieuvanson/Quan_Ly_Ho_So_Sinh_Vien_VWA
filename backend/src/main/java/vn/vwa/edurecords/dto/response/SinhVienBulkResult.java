package vn.vwa.edurecords.dto.response;

import java.util.List;

/**
 * Kết quả của một thao tác bulk trên nhiều sinh viên.
 *
 * <p>Trả về tổng số SV đã xử lý + danh sách kết quả theo từng SV để
 * client hiển thị chi tiết thành công / thất bại.</p>
 *
 * <p>Nguyên tắc:
 * <ul>
 *   <li>Một SV thất bại không chặn các SV khác (best-effort trong loop).</li>
 *   <li>Toàn bộ thao tác vẫn nằm trong transaction của method gọi — nếu method
 *       có {@code @Transactional}, các thay đổi thành công sẽ rollback khi bất
 *       kỳ SV nào ném exception không mong đợi. Đây là đánh đổi có chủ đích
 *       giữa tính nhất quán và khả năng xử lý một phần.</li>
 * </ul>
 * </p>
 */
public class SinhVienBulkResult {

    private final int total;
    private final int successCount;
    private final int failureCount;
    private final List<ItemResult> results;

    public SinhVienBulkResult(int total, int successCount, int failureCount,
                              List<ItemResult> results) {
        this.total = total;
        this.successCount = successCount;
        this.failureCount = failureCount;
        this.results = results;
    }

    public int getTotal() { return total; }
    public int getSuccessCount() { return successCount; }
    public int getFailureCount() { return failureCount; }
    public List<ItemResult> getResults() { return results; }

    /**
     * Kết quả xử lý 1 sinh viên trong bulk operation.
     */
    public static class ItemResult {
        private final String mssv;
        private final boolean success;
        private final String code;     // mã lỗi nghiệp vụ nếu thất bại
        private final String message;  // message người dùng nếu thất bại

        public ItemResult(String mssv, boolean success, String code, String message) {
            this.mssv = mssv;
            this.success = success;
            this.code = code;
            this.message = message;
        }

        public static ItemResult ok(String mssv) {
            return new ItemResult(mssv, true, null, null);
        }

        public static ItemResult fail(String mssv, String code, String message) {
            return new ItemResult(mssv, false, code, message);
        }

        public String getMssv() { return mssv; }
        public boolean isSuccess() { return success; }
        public String getCode() { return code; }
        public String getMessage() { return message; }
    }
}