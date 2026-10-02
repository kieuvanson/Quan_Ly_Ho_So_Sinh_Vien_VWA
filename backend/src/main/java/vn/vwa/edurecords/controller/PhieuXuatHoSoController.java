package vn.vwa.edurecords.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.vwa.edurecords.dto.request.PhieuMuonSearchRequest;
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
     *
     * Danh sách hồ sơ đang mượn (mỗi dòng = 1 phiếu xuất hồ sơ).
     *
     * Filter:
     * - keyword  : tìm trên maPhieu | mssv | hoTen | lyDo (LIKE, không phân biệt hoa thường)
     * - trangThai: trạng thái phiếu. Mặc định 'Đang mượn' nếu không truyền.
     * - loaiHoSo : 'Mượn tạm thời' | 'Rút vĩnh viễn'
     * - page, size: phân trang (mặc định 0, 10)
     *
     * Yêu cầu JWT (đã được cấu hình qua SecurityFilterChain — endpoint bất kỳ ngoài /api/auth/** đều yêu cầu xác thực).
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
     *
     * Lịch sử mượn / trả (mỗi dòng = 1 phiếu xuất hồ sơ, MỌI trạng thái).
     *
     * Filter (tất cả optional):
     * - keyword  : tìm trên maPhieu | mssv | hoTen | lyDo
     * - trangThai: lọc theo trạng thái (7 giá trị ENUM). Mặc định = NULL = lấy tất cả.
     * - loaiHoSo : 'Mượn tạm thời' | 'Rút vĩnh viễn'
     * - fromDate : yyyy-MM-dd, lọc phiếu có ngayTao >= fromDate
     * - toDate   : yyyy-MM-dd, lọc phiếu có ngayTao < toDate + 1 day (inclusive)
     * - page, size: phân trang (mặc định 0, 10)
     *
     * Yêu cầu JWT.
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
}