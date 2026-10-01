package vn.vwa.edurecords.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.vwa.edurecords.dto.request.HoSoGiayToRequest;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.entity.HoSoGiayTo;
import vn.vwa.edurecords.security.JwtService;
import vn.vwa.edurecords.service.HoSoGiayToService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ho-so-giay-to")
@CrossOrigin(origins = "*")
public class HoSoGiayToController {

    private final HoSoGiayToService hoSoGiayToService;
    private final JwtService jwtService;

    public HoSoGiayToController(HoSoGiayToService hoSoGiayToService, JwtService jwtService) {
        this.hoSoGiayToService = hoSoGiayToService;
        this.jwtService = jwtService;
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
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        String username = jwtService.extractUsername(token);

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
            @RequestBody HoSoGiayToRequest request,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        String username = jwtService.extractUsername(token);

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
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        String username = jwtService.extractUsername(token);

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
}