package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * Request body khi xác nhận import sinh viên sau bước preview.
 *
 * <p>Frontend gửi danh sách MSSV đã được xác nhận (dựa trên preview).
 * Backend kiểm tra lại từng MSSV trước khi ghi để tránh dữ liệu thay đổi
 * giữa bước preview và xác nhận.</p>
 */
public class ImportConfirmRequest {

    /**
     * Danh sách MSSV đã được preview và xác nhận để import.
     * Mỗi entry là một MSSV đã xác minh hợp lệ tại bước preview.
     */
    @NotEmpty(message = "Danh sách MSSV để import không được rỗng.")
    private List<String> mssvList;

    /** Token preview để xác thực rằng user đã qua bước preview. */
    private String previewToken;

    public ImportConfirmRequest() {}

    public ImportConfirmRequest(List<String> mssvList) {
        this.mssvList = mssvList;
    }

    public List<String> getMssvList() { return mssvList; }
    public void setMssvList(List<String> mssvList) { this.mssvList = mssvList; }

    public String getPreviewToken() { return previewToken; }
    public void setPreviewToken(String previewToken) { this.previewToken = previewToken; }
}
