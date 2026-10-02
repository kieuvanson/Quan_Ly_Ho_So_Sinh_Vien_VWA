package vn.vwa.edurecords.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.vwa.edurecords.dto.request.PhieuMuonRequest;
import vn.vwa.edurecords.dto.request.PhieuMuonSearchRequest;
import vn.vwa.edurecords.dto.request.PhieuTraRequest;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.dto.response.PagedResponse;
import vn.vwa.edurecords.dto.response.PhieuMuonResponse;
import vn.vwa.edurecords.service.PhieuXuatHoSoService;

import java.util.List;

@RestController
@RequestMapping("/api/phieu-muon")
@CrossOrigin(origins = "*")
public class PhieuXuatHoSoController {

    private final PhieuXuatHoSoService phieuXuatHoSoService;

    public PhieuXuatHoSoController(PhieuXuatHoSoService phieuXuatHoSoService) {
        this.phieuXuatHoSoService = phieuXuatHoSoService;
    }

    /**
     * GET /api/phieu-muon/dang-muon
     */
    @GetMapping("/dang-muon")
    public ResponseEntity<ApiResponse<PagedResponse<List<PhieuMuonResponse>>>> getDanhSachDangMuon(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String trangThai,
            @RequestParam(required = false) String loaiHoSo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PhieuMuonSearchRequest req = new PhieuMuonSearchRequest();
        req.setKeyword(keyword);
        req.setTrangThai(trangThai);
        req.setLoaiHoSo(loaiHoSo);
        req.setPage(page);
        req.setSize(size);

        Page<PhieuMuonResponse> result = phieuXuatHoSoService.getDanhSachDangMuon(req);

        PagedResponse.PageMetadata meta = new PagedResponse.PageMetadata(
                result.getNumber(), result.getSize(), result.getTotalElements());
        PagedResponse<List<PhieuMuonResponse>> paged =
                new PagedResponse<>(result.getContent(), meta);

        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hồ sơ đang mượn thành công", paged));
    }

    /**
     * GET /api/phieu-muon/lich-su
     */
    @GetMapping("/lich-su")
    public ResponseEntity<ApiResponse<PagedResponse<List<PhieuMuonResponse>>>> getLichSuMuonTra(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String trangThai,
            @RequestParam(required = false) String loaiHoSo,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PhieuMuonSearchRequest req = new PhieuMuonSearchRequest();
        req.setKeyword(keyword);
        req.setTrangThai(trangThai);
        req.setLoaiHoSo(loaiHoSo);
        req.setFromDate(fromDate);
        req.setToDate(toDate);
        req.setPage(page);
        req.setSize(size);

        Page<PhieuMuonResponse> result = phieuXuatHoSoService.getLichSuMuonTra(req);

        PagedResponse.PageMetadata meta = new PagedResponse.PageMetadata(
                result.getNumber(), result.getSize(), result.getTotalElements());
        PagedResponse<List<PhieuMuonResponse>> paged =
                new PagedResponse<>(result.getContent(), meta);

        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử mượn trả thành công", paged));
    }

    /**
     * GET /api/phieu-muon/{maPhieu}
     * Lấy chi tiết 1 phiếu.
     */
    @GetMapping("/{maPhieu}")
    public ResponseEntity<ApiResponse<PhieuMuonResponse>> getById(@PathVariable String maPhieu) {
        PhieuMuonResponse result = phieuXuatHoSoService.getById(maPhieu);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết phiếu thành công", result));
    }

    /**
     * POST /api/phieu-muon
     * Tạo phiếu mượn / rút hồ sơ mới.
     *
     * Body: { mssv, loaiPhieu, ngayMuon, ngayTraDuKien, lyDo, ghiChu, danhSachMaHoSo[] }
     *
     * Cán bộ phụ trách (nguoiTao) = user đang đăng nhập (lấy từ JWT).
     * Mặc định trạng thái mới = 'Chờ duyệt' (cán bộ duyệt sau).
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<PhieuMuonResponse>> createPhieu(
            @Valid @RequestBody PhieuMuonRequest req) {
        PhieuMuonResponse result = phieuXuatHoSoService.createPhieu(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiếu mượn / rút hồ sơ thành công", result));
    }

    /**
     * PUT /api/phieu-muon/{maPhieu}/tra
     * Trả hồ sơ: set trangThai = 'Đã trả' (Mượn) hoặc 'Hoàn tất' (Rút), set ngayTraThucTe = hôm nay.
     *
     * Body (optional): { ghiChu }
     */
    @PutMapping("/{maPhieu}/tra")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<PhieuMuonResponse>> traPhieu(
            @PathVariable String maPhieu,
            @RequestBody(required = false) PhieuTraRequest req) {
        PhieuMuonResponse result = phieuXuatHoSoService.traPhieu(maPhieu,
                req != null ? req : new PhieuTraRequest());
        return ResponseEntity.ok(ApiResponse.success("Trả hồ sơ thành công", result));
    }
}