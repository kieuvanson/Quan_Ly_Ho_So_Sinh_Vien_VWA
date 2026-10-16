package vn.vwa.edurecords.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.vwa.edurecords.dto.request.HoSoGiayToRequest;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.dto.response.HoSoGiayToListItem;
import vn.vwa.edurecords.dto.response.HoSoGiayToResponse;
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
     * Lay danh sach ho so giay to theo MSSV (ADMIN).
     * Tra ve HoSoGiayToResponse da map them tenGiayTo.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<HoSoGiayToResponse>>> getAll(
            @RequestParam(required = false) String mssv) {

        if (mssv == null || mssv.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(400, "MISSING_PARAM", "Thieu tham so mssv"));
        }
        List<HoSoGiayToResponse> result = hoSoGiayToService.getByMssvAsResponse(mssv);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/ho-so-giay-to/{maHoSo}
     * Chi tiet mot ho so giay to (ADMIN).
     */
    @GetMapping("/{maHoSo}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HoSoGiayTo>> getByMaHoSo(@PathVariable String maHoSo) {
        return hoSoGiayToService.getByMaHoSo(maHoSo)
                .map(hoSo -> ResponseEntity.ok(ApiResponse.success(hoSo)))
                .orElseGet(() -> ResponseEntity.status(404).body(
                        ApiResponse.error(404, "NOT_FOUND", "Khong tim thay ho so giay to")));
    }

    /**
     * GET /api/ho-so-giay-to/stats?mssv=XXX
     * Thong ke giay to theo MSSV (ADMIN).
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats(@RequestParam String mssv) {
        List<HoSoGiayTo> hoSos = hoSoGiayToService.getByMssv(mssv);
        long total = hoSos.size();
        long daNop = hoSos.stream().filter(h -> "Da nop".equals(h.getTrangThaiNop())).count();
        long chuaNop = hoSos.stream().filter(h -> "Chua nop".equals(h.getTrangThaiNop())).count();
        long thieu = hoSos.stream().filter(h -> "Thieu".equals(h.getTrangThaiNop())).count();
        long khongHopLe = hoSos.stream().filter(h -> "Khong hop le".equals(h.getTrangThaiNop())).count();

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
     * POST /api/ho-so-giay-to - Tao moi (ADMIN).
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HoSoGiayTo>> create(
            @RequestParam String mssv,
            @RequestParam String maLoai,
            @Valid @RequestBody HoSoGiayToRequest request,
            @AuthenticationPrincipal String username) {

        HoSoGiayTo created = hoSoGiayToService.create(mssv, maLoai, request, username);
        return ResponseEntity.ok(ApiResponse.success("Tao ho so giay to thanh cong", created));
    }

    /**
     * PUT /api/ho-so-giay-to/{maHoSo} - Cap nhat (ADMIN).
     */
    @PutMapping("/{maHoSo}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HoSoGiayTo>> update(
            @PathVariable String maHoSo,
            @Valid @RequestBody HoSoGiayToRequest request,
            @AuthenticationPrincipal String username) {

        HoSoGiayTo updated = hoSoGiayToService.update(maHoSo, request, username);
        return ResponseEntity.ok(ApiResponse.success("Cap nhat ho so giay to thanh cong", updated));
    }

    /**
     * PATCH /api/ho-so-giay-to/{maHoSo}/trang-thai - Cap nhat trang thai nop (ADMIN).
     */
    @PatchMapping("/{maHoSo}/trang-thai")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HoSoGiayTo>> capNhatTrangThai(
            @PathVariable String maHoSo,
            @RequestParam String trangThaiMoi,
            @RequestParam(required = false) String ghiChu,
            @AuthenticationPrincipal String username) {

        HoSoGiayTo updated = hoSoGiayToService.capNhatTrangThaiNop(maHoSo, trangThaiMoi, ghiChu, username);
        return ResponseEntity.ok(ApiResponse.success("Cap nhat trang thai thanh cong", updated));
    }

    /**
     * DELETE /api/ho-so-giay-to/{maHoSo} - Xoa (ADMIN).
     */
    @DeleteMapping("/{maHoSo}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String maHoSo) {
        hoSoGiayToService.delete(maHoSo);
        return ResponseEntity.ok(ApiResponse.success("Xoa ho so giay to thanh cong", (Void) null));
    }

    /**
     * GET /api/ho-so-giay-to/all - Tim kiem phan trang cho bang "Danh sach ho so
     * giay to" tren frontend (ADMIN).
     *
     * <p>Tra ve projection phang: moi dong = 1 ho so giay to kem thong tin
     * sinh vien (ho ten, nganh, lop, khoa, trang thai hoc vu).</p>
     *
     * <p>Filter (tat ca optional):</p>
     * <ul>
     *   <li>{@code keyword} - tim tren MSSV hoac ho ten (LIKE, case-insensitive)</li>
     *   <li>{@code maLoai} - ma loai giay to (GT01..GT13)</li>
     *   <li>{@code trangThaiNop} - Chua nop / Da nop / Thieu / Khong hop le</li>
     *   <li>{@code nganhId}, {@code lopId}, {@code khoaHocId} - loc theo danh muc SV</li>
     *   <li>{@code trangThaiHocVu} - Dang hoc / Bao luu / Dinh chi / Tot nghiep / Da rut ho so</li>
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
