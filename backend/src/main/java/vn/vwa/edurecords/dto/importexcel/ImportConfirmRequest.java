package vn.vwa.edurecords.dto.importexcel;

/**
 * Request body cho endpoint POST /api/ho-so-giay-to/import/confirm.
 *
 * <p>FE gửi token nhận được từ /preview để xác nhận ghi. Token được lưu trong
 * Redis với TTL 5 phút, chứa toàn bộ snapshot dữ liệu đã validate.</p>
 */
public class ImportConfirmRequest {

    /** Token từ response của /preview. */
    private String token;

    public ImportConfirmRequest() {}

    public ImportConfirmRequest(String token) {
        this.token = token;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
