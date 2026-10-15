package vn.vwa.edurecords.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.vwa.edurecords.dto.request.HoSoGiayToRequest;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.dto.response.HoSoGiayToListItem;
import vn.vwa.edurecords.dto.response.PagedResponse;
import vn.vwa.edurecords.entity.HoSoGiayTo;
import vn.vwa.edurecords.service.HoSoGiayToService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ho-so-giay-to")
public class HoSoGiayToController {

    private final HoSoGiayToService hoSoGiayToService;

    public HoSoGiayToController(HoSoGiayToService hoSoGiayToService) {
        this.hoSoGiayToService = hoSoGiayToService;
    }

    /**
     * GET /api/ho-so-giay-to?mssv=XXX
     * Lấy danh sách hồ sơ giấy tờ theo MSSV (ADMIN).
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<HoSoGiayTo>>> getAll(
            @RequestParam(required = false) String mssv) {

        if (mssv == null || mssv.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(400, "MISSING_PARAM", "Thiếu tham số mssv"));
        }
        List<HoSoGiayTo> result = hoSoGiayToService.getByMssv(mssv);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/ho-so-giay-to/{maHoSo}
     * Chi tiết một hồ sơ giấy tờ (ADMIN).
     */
    @GetMapping("/{maHoSo}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HoSoGiayTo>> getByMaHoSo(@PathVariable String maHoSo) {
        return hoSoGiayToService.getByMaHoSo(maHoSo)
                .map(hoSo -> ResponseEntity.ok(ApiResponse.success(hoSo)))
                .orElseGet(() -> ResponseEntity.status(404).body(
                        ApiResponse.error(404, "NOT_FOUND", "Không tìm thấy hồ sơ giấy tờ")));
    }

    /**
     * GET /api/ho-so-giay-to/stats?mssv=XXX
     * Thống kê giấy tờ theo MSSV (ADMIN).
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats(@RequestParam String mssv) {
        List<HoSoGiayTo> hoSos = hoSoGiayToService.getByMssv(mssv);
        long total = hoSos.size();
        long daNop = hoSos.stream().filter(h -> "Đã nộp".equals(h.getTrangThaiNop())).count();
        long chuaNop = hoSos.stream().filter(h -> "Chưa nộp".equals(h.getTrangThaiNop())).count();
        long thieu = hoSos.stream().filter(h -> "Thiếu".equals(h.getTrangThaiNop())).count();
        long khongHopLe = hoSos.stream().filter(h -> "Không hợp lệ".equals(h.getTrangThaiNop())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("mssv", mssv);
        stats.put("tongSo", total);
        stats.put("daNop", daNop);
        stats.put("chuaNop", chuaNop);
        stats.put("thieu", thieu);
        stats.put("khongHopLe", khongHopLe);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * POST /api/ho-so-giay-to - Tạo mới (ADMIN).
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HoSoGiayTo>> create(
            @RequestParam String mssv,
            @RequestParam String maLoai,
            @Valid @RequestBody HoSoGiayToRequest request,
            @AuthenticationPrincipal String username) {

        HoSoGiayTo created = hoSoGiayToService.create(mssv, maLoai, request, username);
        return ResponseEntity.ok(ApiResponse.success("Tạo hồ sơ giấy tờ thành công", created));
    }

    /**
     * PUT /api/ho-so-giay-to/{maHoSo} - Cập nhật (ADMIN).
     */
    @PutMapping("/{maHoSo}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HoSoGiayTo>> update(
            @PathVariable String maHoSo,
            @Valid @RequestBody HoSoGiayToRequest request,
            @AuthenticationPrincipal String username) {

        HoSoGiayTo updated = hoSoGiayToService.update(maHoSo, request, username);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ giấy tờ thành công", updated));
    }

    /**
     * PATCH /api/ho-so-giay-to/{maHoSo}/trang-thai - Cập nhật trạng thái nộp (ADMIN).
     */
    @PatchMapping("/{maHoSo}/trang-thai")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HoSoGiayTo>> capNhatTrangThai(
            @PathVariable String maHoSo,
            @RequestParam String trangThaiMoi,
            @RequestParam(required = false) String ghiChu,
            @AuthenticationPrincipal String username) {

        HoSoGiayTo updated = hoSoGiayToService.capNhatTrangThaiNop(maHoSo, trangThaiMoi, ghiChu, username);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", updated));
    }

    /**
     * DELETE /api/ho-so-giay-to/{maHoSo} - Xóa (ADMIN).
     */
    @DeleteMapping("/{maHoSo}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String maHoSo) {
        hoSoGiayToService.delete(maHoSo);
        return ResponseEntity.ok(ApiResponse.success("Xóa hồ sơ giấy tờ thành công", (Void) null));
    }

    /**
     * GET /api/ho-so-giay-to/all - Tìm kiếm phân trang cho bảng "Danh sách hồ sơ
     * giấy tờ" trên frontend (ADMIN).
     *
     * <p>Trả về projection phẳng: mỗi dòng = 1 hồ sơ giấy tờ kèm thông tin
     * sinh viên (họ tên, ngành, lớp, khóa, trạng thái học vụ).</p>
     *
     * <p>Filter (tất cả optional):</p>
     * <ul>
     *   <li>{@code keyword} — tìm trên MSSV hoặc họ tên (LIKE, case-insensitive)</li>
     *   <li>{@code maLoai} — mã loại giấy tờ (GT01..GT13)</li>
     *   <li>{@code trangThaiNop} — Chưa nộp / Đã nộp / Thiếu / Không hợp lệ</li>
     *   <li>{@code nganhId}, {@code lopId}, {@code khoaHocId} — lọc theo danh mục SV</li>
     *   <li>{@code trangThaiHocVu} — Đang_học / Bảo_lưu / Đình_chỉ / Tốt_nghiệp / Đã_rút_hồ_sơ</li>
     *   <li>{@code page} (0-based), {@code size}</li>
     * </ul>
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<List<HoSoGiayToListItem>>>> searchList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String maLoai,
            @RequestParam(required = false) String trangThaiNop,
            @RequestParam(required = false) Integer nganhId,
            @RequestParam(required = false) Integer lopId,
            @RequestParam(required = false) Integer khoaHocId,
            @RequestParam(required = false) String trangThaiHocVu,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        // Clamp size to reasonable range to avoid abuse.
        int safeSize = Math.max(1, Math.min(size, 200));
        int safePage = Math.max(0, page);

        PagedResponse<List<HoSoGiayToListItem>> result = hoSoGiayToService.searchList(
                keyword, maLoai, trangThaiNop,
                nganhId, lopId, khoaHocId, trangThaiHocVu,
                safePage, safeSize);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}