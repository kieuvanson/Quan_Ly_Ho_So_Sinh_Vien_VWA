package vn.vwa.edurecords.dto.importexcel;

import java.util.ArrayList;
import java.util.List;

/**
 * Payload lưu trong Redis sau khi /preview thành công.
 *
 * <p>Được serialize JSON để Redis dễ lưu. Khi /confirm gọi, BE sẽ lấy lại
 * payload này (đã được validate lúc preview) để ghi vào DB.</p>
 */
public class ImportTokenPayload {

    private String token;
    private long createdAt;
    private List<SheetPreview> sheets = new ArrayList<>();

    public ImportTokenPayload() {}

    public ImportTokenPayload(String token, long createdAt, List<SheetPreview> sheets) {
        this.token = token;
        this.createdAt = createdAt;
        this.sheets = sheets;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public List<SheetPreview> getSheets() { return sheets; }
    public void setSheets(List<SheetPreview> sheets) { this.sheets = sheets; }
}
