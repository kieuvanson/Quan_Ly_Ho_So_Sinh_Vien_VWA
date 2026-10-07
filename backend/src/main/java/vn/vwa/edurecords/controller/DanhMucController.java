package vn.vwa.edurecords.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.entity.Khoa;
import vn.vwa.edurecords.entity.KhoaHoc;
import vn.vwa.edurecords.entity.Lop;
import vn.vwa.edurecords.entity.Nganh;
import vn.vwa.edurecords.service.DanhMucService;

import java.util.List;

/**
 * API danh mục (Khoa, Ngành, Lớp, Khóa học) cho form sinh viên + filter dropdown.
 *
 * <p>Endpoint trả về danh sách đang sử dụng ({@code dang_su_dung = true}) sắp
 * xếp theo tên. Hỗ trợ filter phân cấp: list ngành theo khoa, list lớp theo
 * ngành — để frontend render cascade dropdown.</p>
 */
@RestController
@RequestMapping("/api/danh-muc")
public class DanhMucController {

    private final DanhMucService danhMucService;

    public DanhMucController(DanhMucService danhMucService) {
        this.danhMucService = danhMucService;
    }

    @GetMapping("/khoa")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Khoa>>> listKhoa() {
        return ResponseEntity.ok(ApiResponse.success(danhMucService.listKhoa()));
    }

    @GetMapping("/nganh")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Nganh>>> listNganh(
            @RequestParam(required = false) Integer khoaId) {
        return ResponseEntity.ok(ApiResponse.success(danhMucService.listNganhByKhoa(khoaId)));
    }

    @GetMapping("/khoa-hoc")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<KhoaHoc>>> listKhoaHoc() {
        return ResponseEntity.ok(ApiResponse.success(danhMucService.listKhoaHoc()));
    }

    @GetMapping("/lop")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Lop>>> listLop(
            @RequestParam(required = false) Integer nganhId) {
        return ResponseEntity.ok(ApiResponse.success(danhMucService.listLopByNganh(nganhId)));
    }
}
